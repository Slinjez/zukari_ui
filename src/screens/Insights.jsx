import { useMemo, useState } from 'react';
import SparkLine from '../components/SparkLine';
import { Card, Input, Label, PrimaryButton, Row } from '../components/ui';
import { DualMetricRows, SimpleBarChart, TimeInRangeStrip } from '../components/Charts';
import { AMBER, BLUE, BORDER, BRAND, GREEN, MUTED, RED, TEXT } from '../constants/theme';
import { reportExportService } from '../services/reportExportService';
import {
  buildActivityTrend,
  buildCarbsGlucoseComparison,
  buildDailyGlucoseTrend,
  countRangeBuckets,
  generateLocalInsights,
} from '../utils/insights';

const REPORT_RANGES = [
  { id: '7d', label: '7 days' },
  { id: '30d', label: '30 days' },
  { id: '90d', label: '90 days' },
  { id: 'all', label: 'All' },
  { id: 'custom', label: 'Custom' },
];

function toDateInputValue(date = new Date()) {
  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return toDateInputValue(new Date());
  }

  return parsed.toISOString().slice(0, 10);
}

function daysAgoInput(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return toDateInputValue(date);
}

function RangeButton({ item, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        border: `1px solid ${selected ? BRAND : BORDER}`,
        background: selected ? '#f7efe7' : '#fffaf5',
        color: selected ? BRAND : MUTED,
        borderRadius: 999,
        padding: '9px 12px',
        fontWeight: 900,
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      {item.label}
    </button>
  );
}

export default function InsightsScreen({ glucose, insulin, meals, exercises, stats, preferences }) {
  const [exportMessage, setExportMessage] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [reportRangeMode, setReportRangeMode] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState(daysAgoInput(6));
  const [customEndDate, setCustomEndDate] = useState(toDateInputValue());
  const glucoseUnit = preferences?.glucoseUnit || 'mmol/L';
  const targetMin = preferences?.targetMin ?? 3.9;
  const targetMax = preferences?.targetMax ?? 10;
  const smartInsights = generateLocalInsights({ glucose, insulin, meals, exercises, preferences });
  const rangeBuckets = countRangeBuckets(glucose, preferences);
  const glucoseTrend = buildDailyGlucoseTrend(glucose, 7);
  const activityTrend = buildActivityTrend(exercises, 7);
  const carbsGlucose = buildCarbsGlucoseComparison({ glucose, meals });
  const exportPayload = { glucose, insulin, meals, exercises, stats, preferences };

  const reportRange = useMemo(
    () => ({
      mode: reportRangeMode,
      startDate: customStartDate,
      endDate: customEndDate,
    }),
    [reportRangeMode, customStartDate, customEndDate]
  );

  const handleExport = async (exporter, fallbackMessage) => {
    setExportBusy(true);
    setExportMessage('Preparing report. Zukari is putting on a tie.');

    try {
      const result = await exporter(exportPayload, { range: reportRange });
      setExportMessage(result?.message || fallbackMessage);
    } catch (error) {
      setExportMessage(error?.message || 'Export failed. Zukari tripped over a PDF cable.');
    } finally {
      setExportBusy(false);
    }
  };

  const exportPdf = () => handleExport(reportExportService.exportDoctorSummaryPdf, 'PDF report exported.');
  const exportCsv = () => handleExport(reportExportService.exportCsvFile, 'CSV exported.');
  const exportHtml = () => handleExport(reportExportService.exportDoctorSummaryHtml, 'HTML report exported.');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <header style={{ paddingTop: 12 }}>
        <div style={{ color: MUTED, fontSize: 13, fontWeight: 700 }}>Local analytics</div>
        <h1
          style={{
            color: TEXT,
            margin: '4px 0 0',
            fontSize: 25,
            letterSpacing: -0.8,
            lineHeight: 1.1,
          }}
        >
          Insights & charts
        </h1>
        <div style={{ color: MUTED, fontSize: 12, fontWeight: 650, marginTop: 4 }}>
          No API yet. Just local pattern spotting with zero cloud drama.
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {[
          { label: 'Average', value: stats.avgG, sub: glucoseUnit, tone: BRAND },
          { label: 'In range', value: `${stats.tir}%`, sub: `${targetMin}–${targetMax}`, tone: GREEN },
          { label: 'Low events', value: stats.low, sub: `< ${targetMin}`, tone: RED },
          { label: 'High events', value: stats.high, sub: `> ${targetMax}`, tone: AMBER },
        ].map((s) => (
          <Card key={s.label} compact>
            <div
              style={{
                color: s.tone,
                fontSize: 11,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {s.label}
            </div>
            <div style={{ color: TEXT, fontSize: 26, fontWeight: 950, marginTop: 4 }}>{s.value}</div>
            <div style={{ color: MUTED, fontSize: 12, fontWeight: 700 }}>{s.sub}</div>
          </Card>
        ))}
      </div>

      <Card>
        <Label>Export reports</Label>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {REPORT_RANGES.map((item) => (
            <RangeButton
              key={item.id}
              item={item}
              selected={reportRangeMode === item.id}
              onClick={() => setReportRangeMode(item.id)}
            />
          ))}
        </div>

        {reportRangeMode === 'custom' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            <div>
              <div style={{ color: MUTED, fontWeight: 800, fontSize: 11, marginBottom: 6 }}>From</div>
              <Input type="date" value={customStartDate} onChange={setCustomStartDate} />
            </div>
            <div>
              <div style={{ color: MUTED, fontWeight: 800, fontSize: 11, marginBottom: 6 }}>To</div>
              <Input type="date" value={customEndDate} onChange={setCustomEndDate} />
            </div>
          </div>
        ) : null}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <PrimaryButton color={BRAND} onClick={exportPdf} disabled={exportBusy}>
            PDF & share
          </PrimaryButton>
          <PrimaryButton color={BLUE} onClick={exportCsv} disabled={exportBusy}>
            CSV & share
          </PrimaryButton>
        </div>

        <div style={{ marginTop: 10 }}>
          <PrimaryButton color={AMBER} onClick={exportHtml} disabled={exportBusy}>
            HTML backup
          </PrimaryButton>
        </div>

        <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, lineHeight: 1.45, marginTop: 10 }}>
          PDF and CSV are written as real files. On Android/iOS, Zukari opens the native share sheet. On web, it downloads the files.
        </div>

        {exportMessage ? (
          <div
            style={{
              color: exportMessage.toLowerCase().includes('fail') ? RED : GREEN,
              background: exportMessage.toLowerCase().includes('fail') ? '#f4e1dc' : '#edf0df',
              borderRadius: 14,
              padding: 10,
              fontWeight: 850,
              fontSize: 12,
              marginTop: 10,
              lineHeight: 1.4,
            }}
          >
            {exportMessage}
          </div>
        ) : null}
      </Card>

      <Card>
        <Label>Smart local insights</Label>
        <div style={{ display: 'grid', gap: 10 }}>
          {smartInsights.map((insight) => (
            <div
              key={`${insight.title}-${insight.body}`}
              style={{
                borderRadius: 17,
                border: `1px solid ${insight.tone}`,
                background: `${insight.tone}10`,
                padding: 13,
              }}
            >
              <div style={{ color: insight.tone, fontWeight: 950, fontSize: 14 }}>{insight.title}</div>
              <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 5, lineHeight: 1.45 }}>
                {insight.body}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Time in range</Label>
        <TimeInRangeStrip low={rangeBuckets.low} range={rangeBuckets.range} high={rangeBuckets.high} />
      </Card>

      <Card>
        <Label>7-day glucose trend</Label>
        <SparkLine glucose={glucoseTrend.map((item) => ({ val: item.value })).filter((item) => item.val > 0)} height={118} />
        <div style={{ marginTop: 10 }}>
          <SimpleBarChart
            data={glucoseTrend}
            valueKey="value"
            labelKey="label"
            tone={BRAND}
            suffix={` ${glucoseUnit}`}
            emptyText="No glucose readings this week yet."
          />
        </div>
      </Card>

      <Card>
        <Label>Carbs vs glucose</Label>
        <DualMetricRows data={carbsGlucose} leftLabel="Carbs" rightLabel="Glucose" />
      </Card>

      <Card>
        <Label>Activity minutes this week</Label>
        <SimpleBarChart
          data={activityTrend}
          valueKey="value"
          labelKey="label"
          tone={BLUE}
          suffix=" min"
          emptyText="No activity logged this week. Even a walk to the fridge can start the chart."
        />
      </Card>

      <Card>
        <Label>Daily summary</Label>
        <Row title="Readings logged" subtitle="All stored readings" value={glucose.length} tone={BRAND} />
        <Row title="Target range" subtitle={glucoseUnit} value={`${targetMin}–${targetMax}`} tone={GREEN} />
        <Row title="Total carbs" subtitle="Today" value={`${stats.totalCarbs}g`} tone={AMBER} />
        <Row title="Insulin" subtitle="Today" value={`${stats.totalInsulin}u`} tone={BLUE} />
        <Row title="Activity" subtitle="Today" value={`${stats.activeMinutes} min`} tone={BLUE} />
      </Card>
    </div>
  );
}
