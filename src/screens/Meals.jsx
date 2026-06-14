import { useMemo, useState } from 'react';
import { Card, Input, Label, PrimaryButton } from '../components/ui';
import { EditActions, EmptyHistory, FilterTabs, HistoryCard } from '../components/HistoryTools';
import { AMBER, BORDER, MUTED, TEXT } from '../constants/theme';
import { MEAL_TEMPLATES } from '../constants/data';
import {
  dateTimeLocalToIso,
  filterLogs,
  formatLoggedAt,
  sortLogsDesc,
  toDateTimeLocalValue,
} from '../utils/logFilters';

export default function MealsScreen({ meals, form, onAddMeal, onUpdateMeal, onDeleteMeal }) {
  const { mName, setMName, mCarbs, setMCarbs } = form;
  const [mLoggedAt, setMLoggedAt] = useState(() => toDateTimeLocalValue());
  const [mNote, setMNote] = useState('');
  const [filter, setFilter] = useState('today');
  const [editing, setEditing] = useState(null);
  const visibleLogs = useMemo(() => sortLogsDesc(filterLogs(meals, filter)), [meals, filter]);

  const saveMeal = async () => {
    const carbsEstimate = Number.parseFloat(mCarbs);

    if (!mName.trim() || !Number.isFinite(carbsEstimate) || carbsEstimate < 0) {
      return;
    }

    await onAddMeal({
      mealName: mName.trim(),
      carbsEstimate,
      notes: mNote.trim(),
      loggedAt: dateTimeLocalToIso(mLoggedAt),
    });

    setMName('');
    setMCarbs('');
    setMNote('');
    setMLoggedAt(toDateTimeLocalValue());
  };

  const startEdit = (meal) => {
    setEditing({
      id: meal.id,
      mealName: meal.name || meal.mealName || '',
      carbsEstimate: String(meal.carbs ?? meal.carbsEstimate ?? ''),
      notes: meal.notes || meal.note || '',
      loggedAt: toDateTimeLocalValue(meal.loggedAt || meal.createdAt || new Date()),
    });
  };

  const saveEdit = async () => {
    const carbsEstimate = Number.parseFloat(editing?.carbsEstimate);

    if (!editing?.id || !editing.mealName.trim() || !Number.isFinite(carbsEstimate) || carbsEstimate < 0) {
      return;
    }

    await onUpdateMeal(editing.id, {
      mealName: editing.mealName.trim(),
      name: editing.mealName.trim(),
      carbsEstimate,
      carbs: carbsEstimate,
      notes: editing.notes.trim(),
      loggedAt: dateTimeLocalToIso(editing.loggedAt),
    });

    setEditing(null);
  };

  const deleteLog = async (meal) => {
    const ok = window.confirm('Delete this meal log? The mandazi evidence will vanish from Zukari.');
    if (!ok) return;
    await onDeleteMeal(meal.id);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <Label>Quick add</Label>
        <div style={{ display: 'grid', gap: 10 }}>
          {MEAL_TEMPLATES.map((t) => (
            <button
              key={t.name}
              type="button"
              onClick={() => {
                setMName(t.name);
                setMCarbs(String(t.carbs));
              }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 16px',
                background: mName === t.name ? '#fff6e5' : '#fbfaf7',
                border: `1px solid ${mName === t.name ? AMBER : BORDER}`,
                borderRadius: 16,
                cursor: 'pointer',
                color: TEXT,
              }}
            >
              <span style={{ fontWeight: 900 }}>{t.name}</span>
              <span style={{ color: AMBER, fontWeight: 900 }}>{t.carbs}g carbs</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Label>Log meal</Label>
        <div style={{ display: 'grid', gap: 10 }}>
          <Input value={mName} onChange={setMName} type="text" placeholder="Meal name" />
          <Input value={mCarbs} onChange={setMCarbs} placeholder="Carbs in grams" />
          <Input value={mNote} onChange={setMNote} type="text" placeholder="Note, e.g. Rice, late lunch, cravings court case" />
          <Input value={mLoggedAt} onChange={setMLoggedAt} type="datetime-local" max={toDateTimeLocalValue()} />
          <PrimaryButton color={AMBER} onClick={saveMeal}>
            Log meal
          </PrimaryButton>
        </div>
      </Card>

      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
          <Label>Food history</Label>
          <span style={{ color: MUTED, fontWeight: 850, fontSize: 11 }}>{visibleLogs.length} shown</span>
        </div>
        <FilterTabs value={filter} onChange={setFilter} />

        {visibleLogs.length === 0 ? (
          <EmptyHistory>No meals logged here yet. The plate is innocent for now.</EmptyHistory>
        ) : (
          visibleLogs.map((m) => {
            const isEditing = editing?.id === m.id;

            return (
              <HistoryCard
                key={m.id}
                title={m.name || m.mealName}
                subtitle={formatLoggedAt(m)}
                value={`${m.carbs ?? m.carbsEstimate}g`}
                tone={AMBER}
                badge="Carbs"
                note={m.notes}
                onEdit={() => startEdit(m)}
                onDelete={() => deleteLog(m)}
                isEditing={isEditing}
              >
                {isEditing ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <Input value={editing.mealName} onChange={(mealName) => setEditing((current) => ({ ...current, mealName }))} type="text" placeholder="Meal name" />
                    <Input value={editing.carbsEstimate} onChange={(carbsEstimate) => setEditing((current) => ({ ...current, carbsEstimate }))} placeholder="Carbs" />
                    <Input value={editing.notes} onChange={(notes) => setEditing((current) => ({ ...current, notes }))} type="text" placeholder="Note" />
                    <Input value={editing.loggedAt} onChange={(loggedAt) => setEditing((current) => ({ ...current, loggedAt }))} type="datetime-local" max={toDateTimeLocalValue()} />
                    <EditActions onSave={saveEdit} onCancel={() => setEditing(null)} tone={AMBER} />
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
