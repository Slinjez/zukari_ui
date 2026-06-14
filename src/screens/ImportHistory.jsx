import { useMemo, useState } from 'react';
import { AlertCircle, ClipboardList, Database, UploadCloud } from 'lucide-react';
import { Card, Label, PrimaryButton } from '../components/ui';
import { AMBER, BLUE, BORDER, BRAND, BRAND_FAINT, GREEN, MUTED, RED, TEXT } from '../constants/theme';
import {
  HISTORICAL_IMPORT_SAMPLE,
  SCREENSHOT_IMPORT_DATA,
  parseHistoricalImport,
} from '../utils/historicalImport';
import { formatLoggedAt } from '../utils/logFilters';

function SmallButton({ children, onClick, tone = BRAND }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${tone}`,
        background: `${tone}12`,
        color: tone,
        borderRadius: 999,
        padding: '9px 12px',
        fontWeight: 950,
        cursor: 'pointer',
        fontSize: 12,
      }}
    >
      {children}
    </button>
  );
}

function StatBox({ label, value, tone = BRAND }) {
  return (
    <div style={{ background: `${tone}12`, border: `1px solid ${tone}22`, borderRadius: 16, padding: 12 }}>
      <div style={{ color: tone, fontWeight: 950, fontSize: 20 }}>{value}</div>
      <div style={{ color: MUTED, fontWeight: 800, fontSize: 11, marginTop: 2 }}>{label}</div>
    </div>
  );
}

export default function ImportHistoryScreen({ preferences, onImportHistoricalLogs, setScreen }) {
  const [rawText, setRawText] = useState(SCREENSHOT_IMPORT_DATA);
  const [message, setMessage] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const parsed = useMemo(() => parseHistoricalImport(rawText, preferences), [rawText, preferences]);
  const previewGlucose = parsed.glucoseLogs.slice(0, 6);
  const previewInsulin = parsed.insulinLogs.slice(0, 4);

  const runImport = async () => {
    if (!parsed.glucoseLogs.length && !parsed.insulinLogs.length) {
      setMessage('Nothing valid to import yet. Paste CSV data first, captain.');
      return;
    }

    const ok = window.confirm(
      `Import ${parsed.glucoseLogs.length} glucose reading(s) and ${parsed.insulinLogs.length} insulin log(s)?`
    );

    if (!ok) return;

    setIsImporting(true);
    setMessage('');

    try {
      const result = await onImportHistoricalLogs({
        glucoseLogs: parsed.glucoseLogs,
        insulinLogs: parsed.insulinLogs,
      });

      setMessage(
        `Imported ${result.glucoseCount} glucose reading(s) and ${result.insulinCount} insulin log(s). Historical pancreas files have entered the chat.`
      );
    } catch (error) {
      setMessage(error?.message || 'Import failed. The CSV fought back.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <header style={{ paddingTop: 12 }}>
        <div style={{ color: MUTED, fontSize: 13, fontWeight: 700 }}>Data tools</div>
        <h1
          style={{
            color: TEXT,
            margin: '4px 0 0',
            fontSize: 25,
            letterSpacing: -0.8,
            lineHeight: 1.1,
          }}
        >
          Import historical logs
        </h1>
        <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 5 }}>
          Paste CSV from old apps, screenshots you have typed out, or the 24 readings we extracted.
        </div>
      </header>

      <Card compact>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 17,
              background: `${BLUE}14`,
              color: BLUE,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <UploadCloud size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: TEXT, fontWeight: 950, fontSize: 15 }}>CSV importer</div>
            <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 2 }}>
              Format: date, time, context, glucose, insulin. Multiple insulin doses can be separated with semicolons.
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Label>Import data</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          <SmallButton onClick={() => setRawText(SCREENSHOT_IMPORT_DATA)} tone={BLUE}>
            Load extracted screenshot data
          </SmallButton>
          <SmallButton onClick={() => setRawText(HISTORICAL_IMPORT_SAMPLE)} tone={AMBER}>
            Load sample
          </SmallButton>
          <SmallButton onClick={() => setRawText('')} tone={RED}>
            Clear
          </SmallButton>
        </div>

        <textarea
          value={rawText}
          onChange={(event) => setRawText(event.target.value)}
          placeholder="date,time,context,glucose,insulin"
          style={{
            width: '100%',
            minHeight: 230,
            resize: 'vertical',
            background: BRAND_FAINT,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: 14,
            color: TEXT,
            outline: 'none',
            fontSize: 13,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            lineHeight: 1.45,
            boxSizing: 'border-box',
          }}
        />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 12 }}>
          <StatBox label="Glucose rows" value={parsed.glucoseLogs.length} tone={BLUE} />
          <StatBox label="Insulin rows" value={parsed.insulinLogs.length} tone={RED} />
          <StatBox label="Skipped" value={parsed.skipped} tone={AMBER} />
        </div>

        <div style={{ marginTop: 12 }}>
          <PrimaryButton color={GREEN} onClick={runImport} disabled={isImporting}>
            {isImporting ? 'Importing...' : 'Import valid logs'}
          </PrimaryButton>
        </div>

        {message ? (
          <div
            style={{
              marginTop: 12,
              borderRadius: 16,
              border: `1px solid ${message.includes('failed') ? RED : GREEN}`,
              background: message.includes('failed') ? '#f4e1dc' : '#edf0df',
              color: message.includes('failed') ? RED : GREEN,
              padding: 12,
              fontWeight: 850,
              fontSize: 12,
            }}
          >
            {message}
          </div>
        ) : null}
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <Label>Preview</Label>
          <span style={{ color: MUTED, fontWeight: 850, fontSize: 11 }}>
            {parsed.glucoseLogs.length + parsed.insulinLogs.length} valid total
          </span>
        </div>

        {previewGlucose.length === 0 ? (
          <div style={{ color: MUTED, fontWeight: 750, fontSize: 13, padding: '8px 0' }}>
            No valid glucose rows yet. Paste data and Zukari will inspect the evidence.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 8 }}>
            {previewGlucose.map((item, index) => (
              <div
                key={`${item.loggedAt}-${index}`}
                style={{
                  border: `1px solid ${BORDER}`,
                  background: '#fbfaf7',
                  borderRadius: 16,
                  padding: 12,
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 10,
                  alignItems: 'center',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: TEXT, fontWeight: 950, fontSize: 13 }}>{item.note || item.context}</div>
                  <div style={{ color: MUTED, fontWeight: 700, fontSize: 11, marginTop: 2 }}>{formatLoggedAt(item)}</div>
                </div>
                <div style={{ color: BLUE, fontWeight: 950, fontSize: 16 }}>
                  {Number(item.value).toFixed(1)} {item.unit}
                </div>
              </div>
            ))}

            {previewInsulin.length ? (
              <div style={{ color: MUTED, fontWeight: 800, fontSize: 12, marginTop: 2 }}>
                Insulin preview: {previewInsulin.map((x) => `${x.insulinType} ${x.units}u`).join(', ')}
                {parsed.insulinLogs.length > previewInsulin.length ? '...' : ''}
              </div>
            ) : null}
          </div>
        )}
      </Card>

      {parsed.errors.length ? (
        <Card compact style={{ borderColor: `${AMBER}66`, background: '#fff7ed' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertCircle size={20} color={AMBER} style={{ flexShrink: 0 }} />
            <div>
              <div style={{ color: TEXT, fontWeight: 950, fontSize: 14 }}>Import warnings</div>
              <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 4 }}>
                {parsed.errors.slice(0, 5).join(' ')}
                {parsed.errors.length > 5 ? ` Plus ${parsed.errors.length - 5} more.` : ''}
              </div>
            </div>
          </div>
        </Card>
      ) : null}

      <Card compact>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 15,
              background: `${BRAND}14`,
              color: BRAND,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <Database size={21} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: TEXT, fontWeight: 950, fontSize: 14 }}>After importing</div>
            <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 2 }}>
              Go to Reports and your historical readings will join the charts, insights, and PDF export.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setScreen('insights')}
            style={{
              border: `1px solid ${BORDER}`,
              background: '#fbfaf7',
              color: BRAND,
              borderRadius: 999,
              padding: '9px 12px',
              display: 'flex',
              gap: 7,
              alignItems: 'center',
              fontWeight: 950,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <ClipboardList size={16} />
            Reports
          </button>
        </div>
      </Card>
    </div>
  );
}
