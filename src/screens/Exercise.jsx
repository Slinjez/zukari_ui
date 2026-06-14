import { useMemo, useState } from 'react';
import { Card, Input, Label, PrimaryButton } from '../components/ui';
import { EditActions, EmptyHistory, FilterTabs, HistoryCard } from '../components/HistoryTools';
import { BLUE, BORDER, MUTED } from '../constants/theme';
import {
  dateTimeLocalToIso,
  filterLogs,
  formatLoggedAt,
  sortLogsDesc,
  toDateTimeLocalValue,
} from '../utils/logFilters';

const ACTIVITY_OPTIONS = [
  'Walking',
  'Running',
  'Cycling',
  'Swimming',
  'Gym',
  'Dancing',
  'House chores',
  'Stairs',
  'Shopping marathon',
  'Bedroom cardio',
  'Chasing deadlines',
  'Dodging responsibilities',
  'Other',
];

export default function ExerciseScreen({
  exercises,
  form,
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
}) {
  const { eType, setEType, eDur, setEDur } = form;
  const [customActivity, setCustomActivity] = useState('');
  const [eLoggedAt, setELoggedAt] = useState(() => toDateTimeLocalValue());
  const [eNote, setENote] = useState('');
  const [filter, setFilter] = useState('today');
  const [editing, setEditing] = useState(null);
  const visibleLogs = useMemo(() => sortLogsDesc(filterLogs(exercises, filter)), [exercises, filter]);

  const selectedActivity = eType === 'Other' ? customActivity.trim() : eType;

  const saveActivity = async () => {
    const durationMinutes = Number.parseFloat(eDur);

    if (!selectedActivity || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return;
    }

    await onAddActivity({
      activityName: selectedActivity,
      durationMinutes,
      notes: eNote.trim(),
      loggedAt: dateTimeLocalToIso(eLoggedAt),
    });

    setEDur('');
    setENote('');
    setELoggedAt(toDateTimeLocalValue());
  };

  const startEdit = (activity) => {
    setEditing({
      id: activity.id,
      activityName: activity.type || activity.activityName || '',
      durationMinutes: String(activity.duration ?? activity.durationMinutes ?? ''),
      notes: activity.notes || activity.note || '',
      loggedAt: toDateTimeLocalValue(activity.loggedAt || activity.createdAt || new Date()),
    });
  };

  const saveEdit = async () => {
    const durationMinutes = Number.parseFloat(editing?.durationMinutes);

    if (!editing?.id || !editing.activityName.trim() || !Number.isFinite(durationMinutes) || durationMinutes <= 0) {
      return;
    }

    await onUpdateActivity(editing.id, {
      activityName: editing.activityName.trim(),
      type: editing.activityName.trim(),
      durationMinutes,
      duration: durationMinutes,
      notes: editing.notes.trim(),
      loggedAt: dateTimeLocalToIso(editing.loggedAt),
    });

    setEditing(null);
  };

  const deleteLog = async (activity) => {
    const ok = window.confirm('Delete this activity log? Zukari will not judge, but the couch might celebrate.');
    if (!ok) return;
    await onDeleteActivity(activity.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <Label>Log activity</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
          {ACTIVITY_OPTIONS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setEType(t)}
              style={{
                padding: '10px 14px',
                borderRadius: 999,
                border: `1px solid ${eType === t ? BLUE : BORDER}`,
                background: eType === t ? '#eef5ff' : '#fbfaf7',
                color: eType === t ? BLUE : MUTED,
                fontWeight: 850,
                cursor: 'pointer',
              }}
            >
              {t}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 10 }}>
          {eType === 'Other' ? (
            <Input
              value={customActivity}
              onChange={setCustomActivity}
              type="text"
              placeholder="Type activity, e.g. Hiking, football, cleaning"
            />
          ) : null}
          <Input value={eDur} onChange={setEDur} placeholder="Duration in minutes" />
          <Input value={eNote} onChange={setENote} type="text" placeholder="Note, optional" />
          <Input value={eLoggedAt} onChange={setELoggedAt} type="datetime-local" max={toDateTimeLocalValue()} />
          <div style={{ color: MUTED, fontSize: 12, fontWeight: 750, lineHeight: 1.4 }}>
            Yes, bedroom cardio counts. Zukari logs the activity, not the documentary.
          </div>
          <PrimaryButton color={BLUE} onClick={saveActivity}>
            Log activity
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <Label>Activity history</Label>
          <span style={{ color: MUTED, fontWeight: 850, fontSize: 11 }}>{visibleLogs.length} shown</span>
        </div>
        <FilterTabs value={filter} onChange={setFilter} />

        {visibleLogs.length === 0 ? (
          <EmptyHistory>No activity logged here yet. Even chasing snacks counts if you move fast enough.</EmptyHistory>
        ) : (
          visibleLogs.map((e) => {
            const isEditing = editing?.id === e.id;

            return (
              <HistoryCard
                key={e.id}
                title={e.type || e.activityName}
                subtitle={formatLoggedAt(e)}
                value={`${e.duration ?? e.durationMinutes} min`}
                tone={BLUE}
                badge="Move"
                note={e.notes}
                onEdit={() => startEdit(e)}
                onDelete={() => deleteLog(e)}
                isEditing={isEditing}
              >
                {isEditing ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <Input value={editing.activityName} onChange={(activityName) => setEditing((current) => ({ ...current, activityName }))} type="text" placeholder="Activity" />
                    <Input value={editing.durationMinutes} onChange={(durationMinutes) => setEditing((current) => ({ ...current, durationMinutes }))} placeholder="Minutes" />
                    <Input value={editing.notes} onChange={(notes) => setEditing((current) => ({ ...current, notes }))} type="text" placeholder="Note" />
                    <Input value={editing.loggedAt} onChange={(loggedAt) => setEditing((current) => ({ ...current, loggedAt }))} type="datetime-local" max={toDateTimeLocalValue()} />
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
