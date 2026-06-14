import { useMemo } from 'react';
import {
  BarChart3,
  ChevronRight,
  Droplet,
  Salad,
  ShieldCheck,
  Syringe,
} from 'lucide-react';
import SparkLine from '../components/SparkLine';
import { Card } from '../components/ui';
import {
  AMBER,
  BLUE,
  BRAND,
  BRAND_DARK,
  BRAND_SOFT,
  BORDER,
  MUTED,
  RED,
  TEXT,
  statusOf,
} from '../constants/theme';

function seededPick(items, seedText) {
  if (!items.length) return '';

  let hash = 0;
  for (let i = 0; i < seedText.length; i += 1) {
    hash = (hash * 31 + seedText.charCodeAt(i)) >>> 0;
  }

  return items[hash % items.length];
}

function getTimeMood() {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 5) {
    return { tag: 'night owl', subtitle: 'Logging sugars while the mosquitoes hold meetings.' };
  }

  if (hour >= 5 && hour < 9) {
    return { tag: 'early bird', subtitle: 'Morning check-in before the day starts shouting.' };
  }

  if (hour >= 9 && hour < 12) {
    return { tag: 'morning boss', subtitle: 'Dashboard fresh like chapati off the pan.' };
  }

  if (hour >= 12 && hour < 16) {
    return { tag: 'afternoon survivor', subtitle: 'Lunch choices are under investigation.' };
  }

  if (hour >= 16 && hour < 20) {
    return { tag: 'evening legend', subtitle: 'The day is tired, but the pancreas report continues.' };
  }

  return { tag: 'night shift captain', subtitle: 'Late logs, big dreams, suspicious cravings.' };
}

function buildGreeting(preferences) {
  const rawName = preferences?.name?.trim();
  const name = rawName || 'Boss';
  const gender = preferences?.gender || 'not_set';
  const mood = getTimeMood();
  const hourKey = new Date().toISOString().slice(0, 13);
  const seed = `${name}-${gender}-${mood.tag}-${hourKey}`;

  const neutralOpeners = [
    'Yoh',
    'Howdy',
    'Aye',
    'Well well well',
    'Look who checked in',
    'Health HQ online',
    'Sugar command reporting',
    'Captain',
  ];

  const maleOpeners = ['Yoh bro', 'Howdy bro', 'My guy', 'Chief', 'Big man', 'Chairman'];
  const femaleOpeners = ['Yoh queen', 'Howdy sis', 'Madam President', 'Chief queen', 'Her excellency', 'Boss lady'];
  const playfulTitles = [
    'Snack Investigator',
    'Carb Negotiator',
    'Glucose Detective',
    'Pancreas Project Manager',
    'Insulin Accountant',
    'Kitchen Risk Analyst',
    'Midnight Craving Auditor',
    'Chapati Compliance Officer',
    'Mandazi Risk Consultant',
    'Certified Fridge Inspector',
    'Blood Sugar Diplomat',
    'Breakfast Strategist',
    'Supper Situation Manager',
    'Chief Taste Tester',
    'Carb Crime Scene Analyst',
  ];
  const nightTitles = ['Night Owl', 'Midnight Fridge Ambassador', 'Late-Night Snack Diplomat', 'Dark Mode Diabetic', 'Craving Watch Commander'];
  const earlyTitles = ['Early Bird', 'Morning Glucose Scout', 'Sunrise Sugar Captain', 'Breakfast Forecast Officer'];
  const chaosTitles = ['Phone Addict With a Glucose Plan', 'Deadline Survivor', 'Professional Overthinker', 'Vibes-Based Nutritionist', 'CEO of Small Small Bites'];

  let openers = neutralOpeners;
  if (gender === 'male') openers = [...maleOpeners, ...neutralOpeners];
  if (gender === 'female') openers = [...femaleOpeners, ...neutralOpeners];

  let titlePool = [...playfulTitles, ...chaosTitles];
  if (mood.tag.includes('night')) titlePool = [...nightTitles, ...titlePool];
  if (mood.tag.includes('early')) titlePool = [...earlyTitles, ...titlePool];

  const opener = seededPick(openers, `${seed}-opener`);
  const title = seededPick(titlePool, `${seed}-title`);
  const formats = [
    `${opener}, ${name}`,
    `${opener}, ${name} the ${title}`,
    `${opener}, ${mood.tag}`,
    `${name}, ${title} reporting for duty`,
    `Hey ${name}, ${mood.tag} mode activated`,
    `Welcome back, ${name} the ${title}`,
  ];

  return {
    title: seededPick(formats, `${seed}-format`),
    subtitle: mood.subtitle,
  };
}

function QuickAction({ icon: Icon, title, subtitle, tone, target, setScreen }) {
  return (
    <button
      type="button"
      className="zukari-pressable"
      onClick={() => setScreen(target)}
      style={{
        background: '#fffaf5',
        border: `1px solid ${BORDER}`,
        borderRadius: 18,
        padding: 14,
        textAlign: 'left',
        minHeight: 94,
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(79,54,0,.05)',
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          color: tone,
          background: `${tone}14`,
          marginBottom: 10,
        }}
      >
        <Icon size={20} strokeWidth={2.5} />
      </div>
      <div style={{ color: TEXT, fontWeight: 900, fontSize: 14 }}>{title}</div>
      <div style={{ color: MUTED, fontWeight: 600, fontSize: 11, marginTop: 2 }}>{subtitle}</div>
    </button>
  );
}

export default function HomeScreen({ glucose, stats, preferences, setScreen }) {
  const latest = stats.latestG;
  const status = statusOf(latest?.val || 5.5, preferences);
  const greeting = useMemo(() => buildGreeting(preferences), [preferences?.name, preferences?.gender]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <header style={{ paddingTop: 12 }}>
        <div style={{ color: MUTED, fontSize: 13, fontWeight: 800 }}>{greeting.title}</div>
        <h1
          style={{
            color: TEXT,
            margin: '4px 0 0',
            fontSize: 25,
            letterSpacing: -0.8,
            lineHeight: 1.1,
          }}
        >
          Glucose dashboard
        </h1>
        <div style={{ color: MUTED, fontSize: 12, fontWeight: 650, marginTop: 4 }}>{greeting.subtitle}</div>
      </header>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: 18,
            background: `linear-gradient(135deg, ${BRAND_DARK}, ${BRAND})`,
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div>
              <div
                style={{
                  opacity: 0.72,
                  fontSize: 11,
                  fontWeight: 900,
                  letterSpacing: 1.4,
                  textTransform: 'uppercase',
                }}
              >
                Latest reading
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
                <span style={{ fontSize: 54, fontWeight: 950, letterSpacing: -2 }}>
                  {latest ? Number(latest.val ?? latest.value).toFixed(1) : '--'}
                </span>
                <span style={{ opacity: 0.75, fontWeight: 700 }}>{preferences?.glucoseUnit || 'mmol/L'}</span>
              </div>
              <div style={{ opacity: 0.78, fontSize: 12, fontWeight: 700 }}>
                {latest ? `Updated ${latest.time}` : 'No reading logged yet'}
              </div>
            </div>
            <span
              style={{
                background: 'rgba(255,255,255,.16)',
                border: '1px solid rgba(255,255,255,.22)',
                borderRadius: 999,
                padding: '8px 12px',
                fontWeight: 900,
                fontSize: 12,
              }}
            >
              {latest ? status.label : 'Ready'}
            </span>
          </div>
        </div>
        <div style={{ padding: '14px 18px 18px' }}>
          <SparkLine glucose={glucose} />
          <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
            <div style={{ flex: 1, background: BRAND_SOFT, borderRadius: 16, padding: 12 }}>
              <div style={{ color: BRAND, fontSize: 11, fontWeight: 900, textTransform: 'uppercase' }}>Avg</div>
              <div style={{ color: TEXT, fontSize: 22, fontWeight: 950 }}>{stats.avgG}</div>
            </div>

            <div style={{ flex: 1, background: '#e6d2bd', borderRadius: 16, padding: 12 }}>
              <div style={{ color: '#5a3218', fontSize: 11, fontWeight: 800, textTransform: 'uppercase' }}>
                Projected HbA1c
              </div>

              <div style={{ color: TEXT, fontSize: 22, fontWeight: 850 }}>
                {stats.hba1c ? `${stats.hba1c}%` : '--'}
              </div>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <QuickAction icon={Droplet} title="Log glucose" subtitle="Reading" tone={BLUE} target="blood_sugar" setScreen={setScreen} />
        <QuickAction icon={Salad} title="Log food" subtitle={`${stats.totalCarbs}g carbs today`} tone={AMBER} target="meals" setScreen={setScreen} />
        <QuickAction icon={Syringe} title="Insulin" subtitle={`${stats.totalInsulin}u today`} tone={RED} target="insulin" setScreen={setScreen} />
        <QuickAction icon={BarChart3} title="Reports" subtitle={`${preferences?.targetMin || 3.9}–${preferences?.targetMax || 10}`} tone={BRAND} target="insights" setScreen={setScreen} />
      </div>

      <Card compact>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              background: latest ? status.bg : BRAND_SOFT,
              color: latest ? status.tone : BRAND,
              width: 42,
              height: 42,
              borderRadius: 15,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: TEXT, fontWeight: 900, fontSize: 14 }}>
              {latest ? status.advice : 'Start by logging your first reading'}
            </div>
            <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>
              {latest ? `Last note: ${latest.note}` : 'Your logs will now survive app close.'}
            </div>
          </div> 
        </div>
      </Card>
    </div>
  );
}
