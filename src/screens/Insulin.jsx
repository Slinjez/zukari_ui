import { useMemo, useState } from 'react';
import { Card, Input, Label, PrimaryButton } from '../components/ui';
import { EditActions, EmptyHistory, FilterTabs, HistoryCard } from '../components/HistoryTools';
import { BLUE, BORDER, BRAND, BRAND_SOFT, MUTED } from '../constants/theme';
import {
  dateTimeLocalToIso,
  filterLogs,
  formatLoggedAt,
  sortLogsDesc,
  toDateTimeLocalValue,
} from '../utils/logFilters';

function insulinTone(type) {
  const longActing = ['Lantus', 'Levemir', 'Tresiba'];
  return longActing.includes(type) ? BRAND : BLUE;
}

function insulinBadge(type) {
  const longActing = ['Lantus', 'Levemir', 'Tresiba'];
  return longActing.includes(type) ? 'Long' : 'Fast';
}

export default function InsulinScreen({
  insulin,
  stats,
  preferences,
  form,
  onAddInsulin,
  onUpdateInsulin,
  onDeleteInsulin,
}) {
  const { iType, setIType, iDose, setIDose } = form;
  const insulinTypes = Array.isArray(preferences?.insulinTypes) && preferences.insulinTypes.length
    ? preferences.insulinTypes
    : ['Novorapid', 'Lantus'];
  const activeType = insulinTypes.includes(iType) ? iType : insulinTypes[0];
  const [iLoggedAt, setILoggedAt] = useState(() => toDateTimeLocalValue());
  const [filter, setFilter] = useState('today');
  const [editing, setEditing] = useState(null);
  const visibleLogs = useMemo(() => sortLogsDesc(filterLogs(insulin, filter)), [insulin, filter]);

  const saveDose = async () => {
    const units = Number.parseFloat(iDose);

    if (!Number.isFinite(units) || units <= 0) {
      return;
    }

    await onAddInsulin({ insulinType: activeType, units, loggedAt: dateTimeLocalToIso(iLoggedAt) });
    setIDose('');
    setILoggedAt(toDateTimeLocalValue());
  };

  const startEdit = (dose) => {
    setEditing({
      id: dose.id,
      insulinType: dose.type || dose.insulinType || activeType,
      units: String(dose.dose ?? dose.units ?? ''),
      loggedAt: toDateTimeLocalValue(dose.loggedAt || dose.createdAt || new Date()),
      notes: dose.notes || dose.note || '',
    });
  };

  const saveEdit = async () => {
    const units = Number.parseFloat(editing?.units);

    if (!editing?.id || !Number.isFinite(units) || units <= 0) {
      return;
    }

    await onUpdateInsulin(editing.id, {
      insulinType: editing.insulinType,
      type: editing.insulinType,
      units,
      dose: units,
      notes: editing.notes.trim(),
      loggedAt: dateTimeLocalToIso(editing.loggedAt),
    });

    setEditing(null);
  };

  const deleteLog = async (dose) => {
    const ok = window.confirm('Delete this insulin dose log? This removes the diary entry only, not reality itself.');
    if (!ok) return;
    await onDeleteInsulin(dose.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <Label>Log insulin dose</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {insulinTypes.map((t) => {
            const selected = activeType === t;
            const tone = insulinTone(t);

            return (
              <button
                key={t}
                type="button"
                onClick={() => setIType(t)}
                style={{
                  minHeight: 44,
                  border: `1px solid ${selected ? tone : BORDER}`,
                  background: selected ? `${tone}14` : '#fbfaf7',
                  color: selected ? tone : MUTED,
                  borderRadius: 999,
                  fontWeight: 900,
                  cursor: 'pointer',
                  padding: '0 14px',
                }}
              >
                {t}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'grid', gap: 10 }}>
          <Input value={iDose} onChange={setIDose} placeholder="Units, e.g. 8" step="0.5" />
          <Input
            value={iLoggedAt}
            onChange={setILoggedAt}
            type="datetime-local"
            max={toDateTimeLocalValue()}
          />
          <PrimaryButton color={insulinTone(activeType)} onClick={saveDose}>
            Log {activeType} dose
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Label>Insulin history</Label>
          <span
            style={{
              color: BRAND,
              background: BRAND_SOFT,
              padding: '6px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 900,
            }}
          >
            {stats.totalInsulin}u today
          </span>
        </div>
        <FilterTabs value={filter} onChange={setFilter} />

        {visibleLogs.length === 0 ? (
          <EmptyHistory>No insulin doses logged in this filter.</EmptyHistory>
        ) : (
          visibleLogs.map((d) => {
            const type = d.type || d.insulinType;
            const tone = insulinTone(type);
            const isEditing = editing?.id === d.id;

            return (
              <HistoryCard
                key={d.id}
                title={type}
                subtitle={formatLoggedAt(d)}
                value={`${d.dose ?? d.units}u`}
                tone={tone}
                badge={insulinBadge(type)}
                note={d.notes}
                onEdit={() => startEdit(d)}
                onDelete={() => deleteLog(d)}
                isEditing={isEditing}
              >
                {isEditing ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <select
                      value={editing.insulinType}
                      onChange={(event) => setEditing((current) => ({ ...current, insulinType: event.target.value }))}
                      style={{
                        width: '100%',
                        height: 48,
                        border: `1px solid ${BORDER}`,
                        borderRadius: 14,
                        background: '#fbfaf7',
                        padding: '0 14px',
                        fontWeight: 850,
                      }}
                    >
                      {insulinTypes.map((typeOption) => (
                        <option key={typeOption} value={typeOption}>{typeOption}</option>
                      ))}
                    </select>
                    <Input
                      value={editing.units}
                      onChange={(units) => setEditing((current) => ({ ...current, units }))}
                      placeholder="Units"
                      step="0.5"
                    />
                    <Input
                      value={editing.loggedAt}
                      onChange={(loggedAt) => setEditing((current) => ({ ...current, loggedAt }))}
                      type="datetime-local"
                      max={toDateTimeLocalValue()}
                    />
                    <Input
                      value={editing.notes}
                      onChange={(notes) => setEditing((current) => ({ ...current, notes }))}
                      type="text"
                      placeholder="Optional note"
                    />
                    <EditActions onSave={saveEdit} onCancel={() => setEditing(null)} tone={tone} />
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
