import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  Clock,
  Database,
  LogOut,
  Moon,
  Plus,
  ShieldCheck,
  Syringe,
  Trash2,
  UploadCloud,
  User,
} from 'lucide-react';
import { Card, Input, Label, PrimaryButton, Row } from '../components/ui';
import { reminderService } from '../services/reminderService';
import {
  AMBER,
  BLUE,
  BORDER,
  BRAND,
  BRAND_DARK,
  BRAND_FAINT,
  BRAND_SOFT,
  GREEN,
  MUTED,
  RED,
  TEXT,
} from '../constants/theme';

const DIABETES_TYPES = [
  { value: 'type_1', label: 'Type 1 diabetes' },
  { value: 'type_2', label: 'Type 2 diabetes' },
  { value: 'gestational', label: 'Gestational diabetes' },
  { value: 'other', label: 'Other / not sure' },
];

const VIBE_OPTIONS = [
  { value: 'not_set', label: 'Surprise me' },
  { value: 'male', label: 'Bro energy' },
  { value: 'female', label: 'Queen energy' },
  { value: 'neutral', label: 'Neutral boss mode' },
];

const INSULIN_OPTIONS = [
  'Novorapid',
  'Lantus',
  'Humalog',
  'Levemir',
  'Tresiba',
  'Apidra',
  'Actrapid',
  'Other',
];

const REMINDER_TYPES = [
  { value: 'glucose', label: 'Glucose check' },
  { value: 'insulin', label: 'Insulin log' },
  { value: 'medication', label: 'Medication' },
  { value: 'bedtime', label: 'Bedtime check' },
  { value: 'custom', label: 'Custom nudge' },
];

const QUICK_REMINDER_TEMPLATES = [
  {
    type: 'glucose',
    label: 'Fasting sugar check',
    time: '07:30',
    message: 'Wakey wakey Bo$$, have you tested your fasting sugars?',
  },
  {
    type: 'glucose',
    label: 'Lunch sugar check',
    time: '13:30',
    message: "It's past lunch hour dude, I have not received your reading.",
  },
  {
    type: 'glucose',
    label: 'Dinner sugar check',
    time: '19:30',
    message: 'Dinner patrol. Check sugar before the food starts giving testimony.',
  },
  {
    type: 'insulin',
    label: 'Lunch insulin log',
    time: '13:45',
    message: 'Quick insulin log check. Zukari is not judging, just monitoring with eyebrows raised.',
  },
  {
    type: 'bedtime',
    label: 'Bedtime glucose check',
    time: '22:30',
    message: 'Bedtime sugar check. Let us not let the night shift surprise us.',
  },
];

function PillButton({ active, children, onClick, tone = BRAND }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: `1px solid ${active ? tone : BORDER}`,
        background: active ? `${tone}16` : BRAND_FAINT,
        color: active ? tone : MUTED,
        borderRadius: 999,
        padding: '10px 13px',
        fontWeight: 900,
        fontSize: 12,
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  );
}

function SelectField({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{
        width: '100%',
        height: 48,
        background: BRAND_FAINT,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: '0 14px',
        color: TEXT,
        fontSize: 15,
        outline: 'none',
        fontWeight: 750,
      }}
    >
      {children}
    </select>
  );
}

function TextAreaField({ value, onChange, placeholder }) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={3}
      style={{
        width: '100%',
        background: BRAND_FAINT,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: '12px 14px',
        color: TEXT,
        fontSize: 14,
        outline: 'none',
        fontWeight: 750,
        resize: 'vertical',
        boxSizing: 'border-box',
        fontFamily: 'inherit',
      }}
    />
  );
}

function ToggleRow({ icon: Icon, title, subtitle, enabled, onClick, tone = BRAND }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        border: `1px solid ${enabled ? tone : BORDER}`,
        background: enabled ? `${tone}12` : '#fbfaf7',
        borderRadius: 18,
        padding: 13,
        cursor: 'pointer',
        textAlign: 'left',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          display: 'grid',
          placeItems: 'center',
          color: tone,
          background: `${tone}16`,
          flexShrink: 0,
        }}
      >
        <Icon size={20} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ color: TEXT, fontWeight: 900, fontSize: 14 }}>{title}</div>
        <div style={{ color: MUTED, fontWeight: 650, fontSize: 12, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div
        style={{
          width: 46,
          height: 26,
          borderRadius: 999,
          background: enabled ? tone : '#dccbbb',
          padding: 3,
          boxSizing: 'border-box',
          display: 'flex',
          justifyContent: enabled ? 'flex-end' : 'flex-start',
          transition: 'all .18s ease',
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 8px rgba(0,0,0,.15)',
          }}
        />
      </div>
    </button>
  );
}

function splitInsulinTypes(value) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return ['Novorapid', 'Lantus'];
}

function makeReminderId(prefix = 'reminder') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function formatReminderStatus(status) {
  if (!status) return '';

  if (status.permission?.message) {
    return status.permission.message;
  }

  if (status.permission?.display === 'granted') {
    return `${status.pendingCount || 0} reminder${status.pendingCount === 1 ? '' : 's'} currently scheduled on this device.`;
  }

  if (status.permission?.display === 'denied') {
    return 'Notification permission is denied. Enable it from phone settings if Zukari should nudge you.';
  }

  if (status.permission?.display === 'prompt' || status.permission?.display === 'prompt-with-rationale') {
    return 'Notification permission is not granted yet. Tap Enable reminders.';
  }

  return 'Reminder status ready.';
}

function reminderTone(type) {
  if (type === 'glucose') return AMBER;
  if (type === 'insulin') return BLUE;
  if (type === 'medication') return GREEN;
  if (type === 'bedtime') return BRAND;
  return MUTED;
}

function reminderIcon(type) {
  if (type === 'insulin') return Syringe;
  if (type === 'medication') return ShieldCheck;
  if (type === 'bedtime') return Clock;
  return Bell;
}

function normalizeReminderList(preferences = {}) {
  const fallback = QUICK_REMINDER_TEMPLATES.map((item, index) => ({
    ...item,
    id: `${item.type}_${index}_${item.time.replace(':', '')}`,
    enabled: true,
  }));

  try {
    const source = typeof reminderService.normalizeReminders === 'function'
      ? reminderService.normalizeReminders(preferences)
      : preferences?.reminders;

    const list = Array.isArray(source) && source.length ? source : fallback;

    return list.map((item, index) => ({
      id: item.id || makeReminderId(item.type || `reminder_${index}`),
      type: item.type || 'custom',
      label: String(item.label || 'Zukari reminder'),
      time: /^\d{2}:\d{2}$/.test(String(item.time || '')) ? item.time : '09:00',
      enabled: Boolean(item.enabled ?? true),
      message: String(item.message || 'Boss, Zukari reminder time.'),
    }));
  } catch (error) {
    console.warn('Could not normalize reminders, using safe defaults', error);
    return fallback;
  }
}

export default function ProfileScreen({ preferences, authUser, onUpdatePreferences, onLogout, setScreen }) {
  const [form, setForm] = useState(() => ({
    name: preferences?.name || 'Bo$$',
    phone: preferences?.phone || '',
    diabetesType: preferences?.diabetesType || 'type_1',
    gender: preferences?.gender || 'not_set',
    glucoseUnit: preferences?.glucoseUnit || 'mmol/L',
    targetMin: String(preferences?.targetMin ?? 3.9),
    targetMax: String(preferences?.targetMax ?? 10),
    insulinTypes: splitInsulinTypes(preferences?.insulinTypes),
    reminders: normalizeReminderList(preferences),
    darkMode: Boolean(preferences?.darkMode ?? false),
  }));
  const [message, setMessage] = useState('');
  const [reminderStatus, setReminderStatus] = useState('Checking reminder status...');
  const [isReminderBusy, setIsReminderBusy] = useState(false);

  useEffect(() => {
    let active = true;

    reminderService.getStatus().then((status) => {
      if (active) {
        setReminderStatus(formatReminderStatus(status));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setForm({
      name: preferences?.name || 'Bo$$',
      phone: preferences?.phone || '',
      diabetesType: preferences?.diabetesType || 'type_1',
      gender: preferences?.gender || 'not_set',
      glucoseUnit: preferences?.glucoseUnit || 'mmol/L',
      targetMin: String(preferences?.targetMin ?? 3.9),
      targetMax: String(preferences?.targetMax ?? 10),
      insulinTypes: splitInsulinTypes(preferences?.insulinTypes),
      reminders: normalizeReminderList(preferences),
      darkMode: Boolean(preferences?.darkMode ?? false),
    });
  }, [preferences]);

  const targetMinNumber = Number.parseFloat(form.targetMin);
  const targetMaxNumber = Number.parseFloat(form.targetMax);
  const hasBadTarget =
    !Number.isFinite(targetMinNumber) ||
    !Number.isFinite(targetMaxNumber) ||
    targetMinNumber <= 0 ||
    targetMaxNumber <= targetMinNumber;

  const selectedTypeLabel = useMemo(() => {
    return DIABETES_TYPES.find((item) => item.value === form.diabetesType)?.label || 'Diabetes type';
  }, [form.diabetesType]);

  const reminderList = Array.isArray(form.reminders) ? form.reminders : [];
  const activeReminderCount = reminderList.filter((item) => item.enabled).length;

  const updateField = (field, value) => {
    setMessage('');
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateReminder = (id, patch) => {
    setMessage('');
    setForm((current) => ({
      ...current,
      reminders: (Array.isArray(current.reminders) ? current.reminders : []).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  };

  const addReminder = (template = null) => {
    const source = template || {
      type: 'glucose',
      label: 'New glucose reminder',
      time: '07:30',
      message: 'Boss, umecheck sugar ama tunaishi by vibes today?',
    };

    setMessage('');
    setForm((current) => ({
      ...current,
      reminders: [
        ...(Array.isArray(current.reminders) ? current.reminders : []),
        {
          id: makeReminderId(source.type || 'reminder'),
          type: source.type || 'custom',
          label: source.label || 'Zukari reminder',
          time: source.time || '09:00',
          enabled: true,
          message: source.message || 'Boss, Zukari reminder time.',
        },
      ],
    }));
  };

  const removeReminder = (id) => {
    setMessage('');
    setForm((current) => ({
      ...current,
      reminders: (Array.isArray(current.reminders) ? current.reminders : []).filter((item) => item.id !== id),
    }));
  };

  const toggleInsulinType = (type) => {
    setMessage('');
    setForm((current) => {
      const exists = current.insulinTypes.includes(type);
      const insulinTypes = exists
        ? current.insulinTypes.filter((item) => item !== type)
        : [...current.insulinTypes, type];

      return {
        ...current,
        insulinTypes: insulinTypes.length ? insulinTypes : current.insulinTypes,
      };
    });
  };

  const buildPreferencePayload = () => ({
    name: form.name.trim() || 'Bo$$',
    phone: form.phone.trim(),
    diabetesType: form.diabetesType,
    gender: form.gender,
    glucoseUnit: form.glucoseUnit,
    targetMin: targetMinNumber,
    targetMax: targetMaxNumber,
    insulinTypes: form.insulinTypes,
    reminders: reminderList.map((item) => ({
      id: item.id,
      type: item.type,
      label: String(item.label || '').trim() || 'Zukari reminder',
      time: item.time,
      enabled: Boolean(item.enabled),
      message: String(item.message || '').trim() || 'Boss, Zukari reminder time.',
    })),
    remindersEnabled: form.reminders.some((item) => item.enabled),
    darkMode: form.darkMode,
  });

  const saveProfile = async () => {
    if (hasBadTarget) {
      setMessage('Target range needs a sensible minimum and maximum. Zukari is clever, not psychic.');
      return;
    }

    const result = await onUpdatePreferences(buildPreferencePayload());
    const reminderMessage = result?.reminders?.message;

    if (reminderMessage) {
      setReminderStatus(reminderMessage);
    }

    setMessage(
      reminderMessage
        ? `Profile saved. ${reminderMessage}`
        : 'Profile saved. Zukari now knows the mission parameters.'
    );
  };

  const enableReminders = async () => {
    if (hasBadTarget) {
      setMessage('Fix the target range first, then Zukari can schedule reminders like a responsible tiny assistant.');
      return;
    }

    setIsReminderBusy(true);
    setMessage('');

    try {
      const payload = buildPreferencePayload();
      const saved = await onUpdatePreferences(payload);
      const latestPreferences = saved?.preferences || payload;
      const result = await reminderService.enableAndSync(latestPreferences);

      setReminderStatus(result.message || 'Reminder permission checked.');
      setMessage(result.message || 'Reminder permission checked.');
    } catch (error) {
      setMessage(error?.message || 'Could not enable reminders. Zukari tripped on the alarm clock.');
    } finally {
      setIsReminderBusy(false);
    }
  };

  const sendTestReminder = async () => {
    setIsReminderBusy(true);
    setMessage('');

    try {
      const result = await reminderService.sendTestReminder();
      setReminderStatus(result.message || 'Test reminder handled.');
      setMessage(result.message || 'Test reminder handled.');
    } catch (error) {
      setMessage(error?.message || 'Could not send test reminder. The nudge refused to nudge.');
    } finally {
      setIsReminderBusy(false);
    }
  };

  const silenceReminders = async () => {
    setIsReminderBusy(true);
    setMessage('');

    try {
      await reminderService.cancelDailyReminders();
      setReminderStatus('Scheduled reminders cancelled on this device. Switch them off and save if you want them to stay quiet.');
      setMessage('Scheduled reminders cancelled. Zukari is now whispering respectfully.');
    } catch (error) {
      setMessage(error?.message || 'Could not cancel reminders. The alarm clock is being dramatic.');
    } finally {
      setIsReminderBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <header style={{ paddingTop: 12 }}>
        <div style={{ color: MUTED, fontSize: 13, fontWeight: 700 }}>Personal settings</div>
        <h1
          style={{
            color: TEXT,
            margin: '4px 0 0',
            fontSize: 25,
            letterSpacing: -0.8,
            lineHeight: 1.1,
          }}
        >
          Profile & preferences
        </h1>
      </header>

      <Card compact>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 17,
              background: BRAND_SOFT,
              color: BRAND,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <User size={23} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: TEXT, fontWeight: 950, fontSize: 16 }}>{form.name || 'Bo$$'}</div>
            <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 2 }}>
              {selectedTypeLabel} · Target {form.targetMin || '--'}–{form.targetMax || '--'} {form.glucoseUnit}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <Label>Signed in account</Label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 15,
              background: BRAND_SOFT,
              color: BRAND,
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <User size={21} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: TEXT, fontWeight: 950, fontSize: 15 }}>{authUser?.name || form.name || 'Zukari user'}</div>
            <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {authUser?.identifier || 'Local account'}
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            style={{
              border: `1px solid ${RED}`,
              background: '#f4e1dc',
              color: RED,
              borderRadius: 999,
              padding: '9px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              fontWeight: 950,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </Card>

      <Card>
        <Label>Data tools</Label>
        <div style={{ display: 'grid', gap: 10 }}>
          <button
            type="button"
            onClick={() => setScreen?.('import_history')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `1px solid ${BLUE}`,
              background: `${BLUE}12`,
              borderRadius: 18,
              padding: 13,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 15,
                display: 'grid',
                placeItems: 'center',
                color: BLUE,
                background: `${BLUE}16`,
                flexShrink: 0,
              }}
            >
              <UploadCloud size={21} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: TEXT, fontWeight: 950, fontSize: 14 }}>Import historical logs</div>
              <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 2 }}>
                Paste CSV from old apps or use the 24 readings extracted from your screenshots.
              </div>
            </div>
          </button>

          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              color: MUTED,
              fontWeight: 700,
              fontSize: 12,
              border: `1px solid ${BORDER}`,
              background: '#fbfaf7',
              borderRadius: 16,
              padding: 12,
            }}
          >
            <Database size={17} color={BRAND} />
            Imported logs join charts, insights, PDF reports, and local storage immediately.
          </div>
        </div>
      </Card>

      <Card>
        <Label>Basic profile</Label>
        <div style={{ display: 'grid', gap: 10 }}>
          <Input value={form.name} onChange={(value) => updateField('name', value)} type="text" placeholder="Your name" />
          <Input
            value={form.phone}
            onChange={(value) => updateField('phone', value)}
            type="tel"
            placeholder="Phone number, optional"
          />
          <SelectField value={form.diabetesType} onChange={(value) => updateField('diabetesType', value)}>
            {DIABETES_TYPES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </SelectField>
          <SelectField value={form.gender} onChange={(value) => updateField('gender', value)}>
            {VIBE_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </SelectField>
        </div>
      </Card>

      <Card>
        <Label>Glucose settings</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {['mmol/L', 'mg/dL'].map((unit) => (
            <PillButton
              key={unit}
              active={form.glucoseUnit === unit}
              tone={unit === 'mmol/L' ? BRAND : BLUE}
              onClick={() => updateField('glucoseUnit', unit)}
            >
              {unit}
            </PillButton>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Input
            value={form.targetMin}
            onChange={(value) => updateField('targetMin', value)}
            placeholder="Target min"
            step="0.1"
          />
          <Input
            value={form.targetMax}
            onChange={(value) => updateField('targetMax', value)}
            placeholder="Target max"
            step="0.1"
          />
        </div>

        <div
          style={{
            marginTop: 12,
            borderRadius: 16,
            border: `1px solid ${hasBadTarget ? RED : BORDER}`,
            background: hasBadTarget ? '#f4e1dc' : '#fbfaf7',
            padding: 12,
            color: hasBadTarget ? RED : MUTED,
            fontWeight: 800,
            fontSize: 12,
          }}
        >
          {hasBadTarget
            ? 'Target max must be higher than target min.'
            : `Reports and range badges will use ${form.targetMin}–${form.targetMax} ${form.glucoseUnit}.`}
        </div>
      </Card>

      <Card>
        <Label>Insulin types</Label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {INSULIN_OPTIONS.map((type) => (
            <PillButton
              key={type}
              active={form.insulinTypes.includes(type)}
              tone={type === 'Lantus' || type === 'Levemir' || type === 'Tresiba' ? BRAND : BLUE}
              onClick={() => toggleInsulinType(type)}
            >
              {type}
            </PillButton>
          ))}
        </div>
        <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 10 }}>
          These options appear on the insulin logging screen.
        </div>
      </Card>

      <Card>
        <Label>Reminder planner</Label>
        <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, lineHeight: 1.45, marginBottom: 12 }}>
          Add as many local reminders as you need: fasting, lunch, dinner, bedtime, insulin, medication, or custom nudges with Zukari-level disrespect.
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          {QUICK_REMINDER_TEMPLATES.map((template) => (
            <PillButton
              key={`${template.type}-${template.time}-${template.label}`}
              active={false}
              tone={reminderTone(template.type)}
              onClick={() => addReminder(template)}
            >
              + {template.label}
            </PillButton>
          ))}
        </div>

        <div style={{ display: 'grid', gap: 12 }}>
          {reminderList.length === 0 ? (
            <div
              style={{
                border: `1px dashed ${BORDER}`,
                background: '#fbfaf7',
                borderRadius: 18,
                padding: 14,
                color: MUTED,
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              No reminders yet. Zukari is quiet, which is suspicious.
            </div>
          ) : (
            reminderList.map((reminder) => {
              const Icon = reminderIcon(reminder.type);
              const tone = reminderTone(reminder.type);

              return (
                <div
                  key={reminder.id}
                  style={{
                    border: `1px solid ${reminder.enabled ? tone : BORDER}`,
                    background: reminder.enabled ? `${tone}10` : '#fbfaf7',
                    borderRadius: 20,
                    padding: 13,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => updateReminder(reminder.id, { enabled: !reminder.enabled })}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 15,
                        border: `1px solid ${reminder.enabled ? tone : BORDER}`,
                        background: reminder.enabled ? `${tone}18` : '#fffaf5',
                        color: tone,
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      aria-label="Toggle reminder"
                    >
                      <Icon size={21} />
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: TEXT, fontWeight: 950, fontSize: 14 }}>
                        {reminder.label || 'Zukari reminder'}
                      </div>
                      <div style={{ color: MUTED, fontWeight: 750, fontSize: 12, marginTop: 2 }}>
                        {reminder.enabled ? 'Enabled' : 'Off'} · {reminder.time} · {REMINDER_TYPES.find((item) => item.value === reminder.type)?.label || 'Custom'}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeReminder(reminder.id)}
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 14,
                        border: `1px solid ${RED}`,
                        background: '#f4e1dc',
                        color: RED,
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      aria-label="Delete reminder"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 10 }}>
                    <Input
                      value={reminder.label}
                      onChange={(value) => updateReminder(reminder.id, { label: value })}
                      type="text"
                      placeholder="Label, e.g. Fasting sugars"
                    />
                    <Input
                      value={reminder.time}
                      onChange={(value) => updateReminder(reminder.id, { time: value })}
                      type="time"
                    />
                  </div>

                  <SelectField value={reminder.type} onChange={(value) => updateReminder(reminder.id, { type: value })}>
                    {REMINDER_TYPES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </SelectField>

                  <TextAreaField
                    value={reminder.message}
                    onChange={(value) => updateReminder(reminder.id, { message: value })}
                    placeholder="Reminder message, e.g. Wake wakey Bo$$, have you tested your fasting sugars?"
                  />
                </div>
              );
            })
          )}
        </div>

        <button
          type="button"
          onClick={() => addReminder()}
          style={{
            marginTop: 12,
            border: `1px solid ${BRAND}`,
            background: BRAND_SOFT,
            color: BRAND_DARK,
            borderRadius: 15,
            padding: '13px 10px',
            fontWeight: 950,
            cursor: 'pointer',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            alignItems: 'center',
          }}
        >
          <Plus size={18} />
          Add custom reminder
        </button>

        <ToggleRow
          icon={Moon}
          title="Dark mode preference"
          subtitle="Saved locally; full theme switch in future release."
          enabled={form.darkMode}
          onClick={() => updateField('darkMode', !form.darkMode)}
          tone={BRAND}
        />

        <div
          style={{
            border: `1px solid ${BORDER}`,
            background: '#fbfaf7',
            borderRadius: 16,
            padding: 12,
            color: MUTED,
            fontWeight: 750,
            fontSize: 12,
            lineHeight: 1.45,
            marginTop: 10,
          }}
        >
          {reminderStatus}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          <button
            type="button"
            onClick={enableReminders}
            disabled={isReminderBusy}
            style={{
              border: 'none',
              background: AMBER,
              color: '#fff',
              borderRadius: 15,
              padding: '13px 10px',
              fontWeight: 950,
              cursor: isReminderBusy ? 'not-allowed' : 'pointer',
              opacity: isReminderBusy ? 0.7 : 1,
            }}
          >
            Enable reminders
          </button>
          <button
            type="button"
            onClick={sendTestReminder}
            disabled={isReminderBusy}
            style={{
              border: `1px solid ${BLUE}`,
              background: '#eef5ff',
              color: BLUE,
              borderRadius: 15,
              padding: '13px 10px',
              fontWeight: 950,
              cursor: isReminderBusy ? 'not-allowed' : 'pointer',
              opacity: isReminderBusy ? 0.7 : 1,
            }}
          >
            Send test
          </button>
        </div>

        <button
          type="button"
          onClick={silenceReminders}
          disabled={isReminderBusy}
          style={{
            border: `1px solid ${RED}`,
            background: '#f4e1dc',
            color: RED,
            borderRadius: 15,
            padding: '13px 10px',
            fontWeight: 950,
            cursor: isReminderBusy ? 'not-allowed' : 'pointer',
            opacity: isReminderBusy ? 0.7 : 1,
            marginTop: 10,
            width: '100%',
          }}
        >
          Cancel scheduled reminders
        </button>

        <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, lineHeight: 1.45, marginTop: 10 }}>
          These are real device reminders after installing the Local Notifications plugin and running a native Android/iOS build. Web preview keeps the jokes but not the alarm clock.
        </div>
      </Card>

      <Card>
        <Label>Current health profile</Label>
        <Row title="Diabetes type" subtitle="Used for future insights" value={selectedTypeLabel.replace(' diabetes', '')} tone={BRAND} />
        <Row title="Target range" subtitle="Used in reports" value={`${form.targetMin}–${form.targetMax}`} tone={GREEN} />
        <Row title="Insulin choices" subtitle="Log screen buttons" value={form.insulinTypes.length} tone={BLUE} />
        <Row title="Active reminders" subtitle="Scheduled after Enable reminders" value={activeReminderCount} tone={AMBER} />
      </Card>

      {message && (
        <div
          style={{
            borderRadius: 16,
            padding: 13,
            border: `1px solid ${message.includes('Target') ? RED : GREEN}`,
            background: message.includes('Target') ? '#f4e1dc' : '#edf0df',
            color: message.includes('Target') ? RED : GREEN,
            fontWeight: 900,
            fontSize: 13,
          }}
        >
          {message}
        </div>
      )}

      <PrimaryButton color={BRAND} onClick={saveProfile}>
        Save profile
      </PrimaryButton>
    </div>
  );
}
