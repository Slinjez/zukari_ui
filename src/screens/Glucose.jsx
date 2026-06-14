import { useMemo, useState } from 'react';
import { Card, Input, Label, PrimaryButton } from '../components/ui';
import { EditActions, EmptyHistory, FilterTabs, HistoryCard } from '../components/HistoryTools';
import { AMBER, BLUE, BORDER, GREEN, MUTED, RED, statusOf } from '../constants/theme';
import {
  dateTimeLocalToIso,
  filterLogs,
  formatLoggedAt,
  sortLogsDesc,
  toDateTimeLocalValue,
} from '../utils/logFilters';

export default function GlucoseScreen({
  glucose,
  preferences,
  form,
  onAddGlucose,
  onUpdateGlucose,
  onDeleteGlucose,
}) {
  const { gVal, setGVal, gNote, setGNote } = form;
  const targetMin = Number(preferences?.targetMin ?? 3.9);
  const targetMax = Number(preferences?.targetMax ?? 10);
  const glucoseUnit = preferences?.glucoseUnit || 'mmol/L';
  const [gLoggedAt, setGLoggedAt] = useState(() => toDateTimeLocalValue());
  const [filter, setFilter] = useState('today');
  const [editing, setEditing] = useState(null);

  const visibleLogs = useMemo(() => sortLogsDesc(filterLogs(glucose, filter)), [glucose, filter]);

  const saveReading = async () => {
    const value = Number.parseFloat(gVal);

    if (!Number.isFinite(value) || value <= 0) {
      return;
    }

    await onAddGlucose({
      value,
      note: gNote.trim() || 'Manual',
      loggedAt: dateTimeLocalToIso(gLoggedAt),
    });

    setGVal('');
    setGNote('');
    setGLoggedAt(toDateTimeLocalValue());
  };

  const startEdit = (log) => {
    setEditing({
      id: log.id,
      value: String(log.val ?? log.value ?? ''),
      note: log.note ?? log.notes ?? '',
      loggedAt: toDateTimeLocalValue(log.loggedAt || log.createdAt || new Date()),
    });
  };

  const saveEdit = async () => {
    const value = Number.parseFloat(editing?.value);

    if (!editing?.id || !Number.isFinite(value) || value <= 0) {
      return;
    }

    await onUpdateGlucose(editing.id, {
      value,
      val: value,
      notes: editing.note.trim() || 'Manual',
      note: editing.note.trim() || 'Manual',
      loggedAt: dateTimeLocalToIso(editing.loggedAt),
    });

    setEditing(null);
  };

  const deleteLog = async (log) => {
    const ok = window.confirm('Delete this glucose reading? Even alien pancreas reports deserve a fair trial.');
    if (!ok) return;
    await onDeleteGlucose(log.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <Label>Log blood sugar</Label>
        <div style={{ display: 'grid', gap: 10 }}>
          <Input value={gVal} onChange={setGVal} placeholder={`e.g. 6.4 ${glucoseUnit}`} step="0.1" />
          <Input
            value={gNote}
            onChange={setGNote}
            type="text"
            placeholder="Note, e.g. Fasting, before breakfast, after rice"
          />
          <div>
            <Label>Reading date and time</Label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
              <Input
                value={gLoggedAt}
                onChange={setGLoggedAt}
                type="datetime-local"
                max={toDateTimeLocalValue()}
              />
              <button
                type="button"
                onClick={() => setGLoggedAt(toDateTimeLocalValue())}
                style={{
                  height: 48,
                  border: `1px solid ${BORDER}`,
                  background: '#fbfaf7',
                  color: BLUE,
                  borderRadius: 14,
                  fontWeight: 900,
                  cursor: 'pointer',
                  padding: '0 12px',
                  whiteSpace: 'nowrap',
                }}
              >
                Now
              </button>
            </div>
          </div>
          <PrimaryButton color={BLUE} onClick={saveReading}>
            Log reading
          </PrimaryButton>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        {[
          { label: 'Low', range: `< ${targetMin}`, tone: RED, bg: '#f4e1dc' },
          { label: 'Range', range: `${targetMin}–${targetMax}`, tone: GREEN, bg: '#edf0df' },
          { label: 'High', range: `> ${targetMax}`, tone: AMBER, bg: '#f6e8d3' },
        ].map((x) => (
          <div key={x.label} style={{ background: x.bg, borderRadius: 16, padding: 12, textAlign: 'center' }}>
            <div style={{ color: x.tone, fontWeight: 950, fontSize: 13 }}>{x.range}</div>
            <div style={{ color: x.tone, opacity: 0.8, fontWeight: 800, fontSize: 11 }}>{x.label}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <Label>Reading history</Label>
          <span style={{ color: MUTED, fontWeight: 850, fontSize: 11 }}>{visibleLogs.length} shown</span>
        </div>
        <FilterTabs value={filter} onChange={setFilter} />

        {visibleLogs.length === 0 ? (
          <EmptyHistory>No readings here yet. First log ndio inaanza story.</EmptyHistory>
        ) : (
          visibleLogs.map((g) => {
            const st = statusOf(g.val, preferences);
            const isEditing = editing?.id === g.id;

            return (
              <HistoryCard
                key={g.id}
                title={g.note || g.notes || 'Manual reading'}
                subtitle={`${formatLoggedAt(g)} · ${g.unit || glucoseUnit}`}
                value={Number(g.val ?? g.value).toFixed(1)}
                tone={st.tone}
                badge={st.label}
                note={isEditing ? null : g.notes && g.notes !== g.note ? g.notes : ''}
                onEdit={() => startEdit(g)}
                onDelete={() => deleteLog(g)}
                isEditing={isEditing}
              >
                {isEditing ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <Input
                      value={editing.value}
                      onChange={(value) => setEditing((current) => ({ ...current, value }))}
                      placeholder="Reading"
                      step="0.1"
                    />
                    <Input
                      value={editing.note}
                      onChange={(note) => setEditing((current) => ({ ...current, note }))}
                      type="text"
                      placeholder="Note"
                    />
                    <Input
                      value={editing.loggedAt}
                      onChange={(loggedAt) => setEditing((current) => ({ ...current, loggedAt }))}
                      type="datetime-local"
                      max={toDateTimeLocalValue()}
                    />
                    <EditActions onSave={saveEdit} onCancel={() => setEditing(null)} tone={BLUE} />
                  </div>
                ) : null}
              </HistoryCard>
            );
          })
        )}
      </Card>
    </div>
  );
}
