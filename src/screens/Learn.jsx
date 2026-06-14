import { useMemo, useState } from 'react';
import { ExternalLink, PlayCircle, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { Card, Input, Label, PrimaryButton } from '../components/ui';
import { AMBER, BLUE, BORDER, BRAND, BRAND_DARK, BRAND_SOFT, GREEN, MUTED, RED, TEXT } from '../constants/theme';

const LEARN_VIDEOS = [
  {
    title: 'Type 1 Diabetes: What You Need to Know',
    channel: 'JDRF',
    duration: '14 min',
    category: 'Basics',
    youtubeId: 'agOzxh3zQb0',
    description: 'A practical introduction to type 1 diabetes, insulin, and common misconceptions.',
    tags: ['type 1', 'basics', 'insulin'],
  },
  {
    title: 'Mayo Clinic Explains Diabetes',
    channel: 'Mayo Clinic',
    duration: '8 min',
    category: 'Basics',
    youtubeId: 'Txqe_CAD43c',
    description: 'A clinician-led overview of diabetes symptoms, diagnosis, and treatment basics.',
    tags: ['basics', 'type 1', 'type 2'],
  },
  {
    title: 'Diabetes 101 Overview',
    channel: 'American Diabetes Association',
    duration: '9 min',
    category: 'Basics',
    youtubeId: 'Uzbq4zYFtOM',
    description: 'A general diabetes overview from the American Diabetes Association.',
    tags: ['basics', 'education'],
  },
  {
    title: 'How to Check Your Blood Glucose Level',
    channel: 'NHS',
    duration: '3 min',
    category: 'Basics',
    youtubeId: 'jg5cl2P3RRA',
    description: 'A short guide on checking blood glucose correctly.',
    tags: ['glucose', 'testing', 'meter'],
  },
  {
    title: 'How to Measure Your Blood Sugar',
    channel: 'Mayo Clinic Patient Education',
    duration: '4 min',
    category: 'Basics',
    youtubeId: 'nxIJeHWlhF4',
    description: 'Patient education on glucose meter use and blood sugar checks.',
    tags: ['glucose', 'testing', 'meter'],
  },
  {
    title: 'Diabetes: How to Inject Insulin',
    channel: 'NHS',
    duration: '4 min',
    category: 'Insulin',
    youtubeId: 'y1tul4BvK98',
    description: 'A practical insulin injection guide. Always follow your clinician’s instructions.',
    tags: ['insulin', 'injection', 'safety'],
  },
  {
    title: 'Insulin Pumps and Sensors',
    channel: 'Mayo Clinic',
    duration: '6 min',
    category: 'Insulin',
    youtubeId: 'DP6MaaSk__Y',
    description: 'A look at insulin pumps, glucose sensors, and diabetes technology.',
    tags: ['insulin', 'technology', 'pump', 'sensor'],
  },
  {
    title: 'Diabetes Basics: Create Your Plate',
    channel: 'American Diabetes Association',
    duration: '5 min',
    category: 'Food',
    youtubeId: 'A6LZijdsGu0',
    description: 'Simple meal planning using the plate method.',
    tags: ['food', 'meal', 'carbs', 'plate'],
  },
  {
    title: 'Exercise and Type 1 Diabetes',
    channel: 'JDRF',
    duration: '7 min',
    category: 'Exercise',
    youtubeId: 'LQKlHyVfReY',
    description: 'Real-world exercise tips and experiences for people living with type 1 diabetes.',
    tags: ['exercise', 'activity', 'type 1'],
  },
  {
    title: 'Diabetes Hypos: What Does Hypoglycaemia Feel Like?',
    channel: 'Diabetes UK',
    duration: '3 min',
    category: 'Emergencies',
    youtubeId: '4LttAS3HpA0',
    description: 'Recognizing low blood sugar symptoms and why quick action matters.',
    tags: ['hypo', 'low', 'emergency', 'safety'],
  },
  {
    title: 'How to Take Care of Your Feet If You Have Diabetes',
    channel: 'Mayo Clinic',
    duration: '2 min',
    category: 'Emergencies',
    youtubeId: 'aZvI9zElGX0',
    description: 'Foot care basics and why prevention matters with diabetes.',
    tags: ['feet', 'safety', 'prevention'],
  },
];

const CATEGORIES = ['All', 'Zukari Picks', 'Basics', 'Food', 'Insulin', 'Exercise', 'Emergencies'];

function getTimeBucket(log) {
  const date = new Date(log?.loggedAt || log?.createdAt || 0);
  if (Number.isNaN(date.getTime())) return 'unknown';
  const hour = date.getHours();

  if (hour >= 4 && hour < 10) return 'morning';
  if (hour >= 10 && hour < 15) return 'midday';
  if (hour >= 15 && hour < 20) return 'evening';
  return 'night';
}

function getRecommendation({ glucose = [], stats, preferences }) {
  const targetMax = Number(preferences?.targetMax ?? 10);
  const targetMin = Number(preferences?.targetMin ?? 3.9);
  const recent = [...glucose]
    .filter((g) => Number.isFinite(Number(g.val ?? g.value)))
    .sort((a, b) => new Date(b.loggedAt || b.createdAt || 0) - new Date(a.loggedAt || a.createdAt || 0))
    .slice(0, 14);

  const highReadings = recent.filter((g) => Number(g.val ?? g.value) > targetMax);
  const lowReadings = recent.filter((g) => Number(g.val ?? g.value) < targetMin);
  const morningHighs = highReadings.filter((g) => getTimeBucket(g) === 'morning');
  const nightReadings = recent.filter((g) => getTimeBucket(g) === 'night');

  if (recent.length === 0) {
    return {
      reason: 'Start logging readings and Zukari will recommend clips based on your patterns.',
      video: LEARN_VIDEOS.find((v) => v.category === 'Basics'),
    };
  }

  if (lowReadings.length >= 2) {
    return {
      reason: 'You have a few low readings recently. Start with hypo safety basics.',
      video: LEARN_VIDEOS.find((v) => v.tags.includes('hypo')),
    };
  }

  if (morningHighs.length >= 2) {
    return {
      reason: 'Your morning readings have been running high. Start with type 1 basics and discuss fasting patterns with your clinician.',
      video: LEARN_VIDEOS.find((v) => v.youtubeId === 'agOzxh3zQb0'),
    };
  }

  if (highReadings.length >= 3) {
    return {
      reason: 'You have several readings above target recently. Food planning may help you spot patterns.',
      video: LEARN_VIDEOS.find((v) => v.category === 'Food'),
    };
  }

  if (nightReadings.length >= 2) {
    return {
      reason: 'You log at night sometimes. Bedtime and safety habits are worth keeping sharp.',
      video: LEARN_VIDEOS.find((v) => v.category === 'Emergencies'),
    };
  }

  if (Number(stats?.totalInsulin || 0) > 0) {
    return {
      reason: 'You are tracking insulin. A quick insulin safety refresher is a good investment.',
      video: LEARN_VIDEOS.find((v) => v.category === 'Insulin'),
    };
  }

  return {
    reason: 'Your recent readings look fairly calm. Keep learning and stay dangerous to ignorance.',
    video: LEARN_VIDEOS.find((v) => v.category === 'Exercise'),
  };
}

function openYoutube(videoId) {
  const url = `https://www.youtube.com/watch?v=${videoId}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function VideoCard({ video, featured = false }) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden', borderColor: featured ? BRAND : BORDER }}>
      <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 0, minHeight: 110 }}>
        <button
          type="button"
          onClick={() => openYoutube(video.youtubeId)}
          aria-label={`Watch ${video.title} on YouTube`}
          style={{
            border: 'none',
            padding: 0,
            margin: 0,
            position: 'relative',
            background: '#1f1712',
            cursor: 'pointer',
            minHeight: 110,
            overflow: 'hidden',
          }}
        >
          <img
            src={`https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`}
            alt=""
            loading="lazy"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.9 }}
          />
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              background: 'linear-gradient(180deg, rgba(0,0,0,.05), rgba(0,0,0,.35))',
              color: '#fff',
            }}
          >
            <PlayCircle size={34} fill="rgba(255,255,255,.18)" />
          </div>
        </button>

        <div style={{ padding: 13, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 7 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: featured ? `${BRAND}18` : BRAND_SOFT,
                color: featured ? BRAND : BRAND_DARK,
                borderRadius: 999,
                padding: '5px 8px',
                fontSize: 10,
                fontWeight: 950,
              }}
            >
              {featured ? <Sparkles size={12} /> : <PlayCircle size={12} />}
              {featured ? 'Recommended' : video.category}
            </span>
            <span style={{ color: MUTED, fontSize: 11, fontWeight: 800 }}>{video.duration}</span>
          </div>

          <div style={{ color: TEXT, fontWeight: 950, fontSize: 14, lineHeight: 1.2 }}>{video.title}</div>
          <div style={{ color: BRAND, fontSize: 12, fontWeight: 900, marginTop: 5 }}>{video.channel}</div>
          <div style={{ color: MUTED, fontSize: 12, fontWeight: 650, marginTop: 5, lineHeight: 1.35 }}>
            {video.description}
          </div>

          <button
            type="button"
            onClick={() => openYoutube(video.youtubeId)}
            style={{
              marginTop: 10,
              border: `1px solid ${BORDER}`,
              background: '#fffaf5',
              color: BRAND_DARK,
              borderRadius: 999,
              padding: '8px 11px',
              cursor: 'pointer',
              fontWeight: 950,
              fontSize: 12,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            Watch on YouTube <ExternalLink size={13} />
          </button>
        </div>
      </div>
    </Card>
  );
}

export default function LearnScreen({ glucose = [], stats = {}, preferences = {} }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [query, setQuery] = useState('');

  const recommendation = useMemo(
    () => getRecommendation({ glucose, stats, preferences }),
    [glucose, stats, preferences]
  );

  const filteredVideos = useMemo(() => {
    const q = query.trim().toLowerCase();

    if (activeCategory === 'Zukari Picks') {
      return recommendation?.video ? [recommendation.video] : [];
    }

    return LEARN_VIDEOS.filter((video) => {
      const matchesCategory = activeCategory === 'All' || video.category === activeCategory;
      const matchesSearch =
        !q ||
        video.title.toLowerCase().includes(q) ||
        video.channel.toLowerCase().includes(q) ||
        video.category.toLowerCase().includes(q) ||
        video.description.toLowerCase().includes(q) ||
        video.tags.some((tag) => tag.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, query, recommendation]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <header style={{ paddingTop: 12 }}>
        <div style={{ color: MUTED, fontSize: 13, fontWeight: 800 }}>Care clips</div>
        <h1
          style={{
            color: TEXT,
            margin: '4px 0 0',
            fontSize: 25,
            letterSpacing: -0.8,
            lineHeight: 1.1,
          }}
        >
          Learn diabetes care
        </h1>
        <div style={{ color: MUTED, fontSize: 12, fontWeight: 650, marginTop: 4 }}>
          Helpful video cards. No broken embeds, no private-video embarrassment, no algorithm roulette.
        </div>
      </header>

      <Card compact>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
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
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ color: TEXT, fontWeight: 950, fontSize: 14 }}>Educational content only</div>
            <div style={{ color: MUTED, fontSize: 12, marginTop: 3, lineHeight: 1.4 }}>
              These videos do not replace your clinician. Zukari can teach patterns, but it should not prescribe insulin like a rogue pancreas.
            </div>
          </div>
        </div>
      </Card>

      {recommendation?.video ? (
        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ color: TEXT, fontWeight: 950, fontSize: 15 }}>⭐ Recommended for you</div>
          <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, lineHeight: 1.4 }}>{recommendation.reason}</div>
          <VideoCard video={recommendation.video} featured />
        </div>
      ) : null}

      <Card>
        <Label>Search videos</Label>
        <div style={{ position: 'relative' }}>
          <Search
            size={18}
            color={MUTED}
            style={{
              position: 'absolute',
              left: 13,
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
          <Input
            value={query}
            onChange={setQuery}
            type="text"
            placeholder="Search basics, insulin, food..."
            style={{ paddingLeft: 40 }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
          {CATEGORIES.map((category) => {
            const active = activeCategory === category;
            const categoryColor = category === 'Emergencies' ? RED : category === 'Food' ? AMBER : category === 'Exercise' ? GREEN : BRAND;

            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                style={{
                  border: `1px solid ${active ? categoryColor : BORDER}`,
                  background: active ? `${categoryColor}16` : '#fffaf5',
                  color: active ? categoryColor : MUTED,
                  borderRadius: 999,
                  padding: '9px 12px',
                  fontWeight: 900,
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                {category}
              </button>
            );
          })}
        </div>
      </Card>

      {filteredVideos.length === 0 ? (
        <Card compact>
          <div style={{ color: MUTED, fontWeight: 800, fontSize: 13 }}>
            No videos found. Even YouTube has limits, apparently.
          </div>
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredVideos.map((video) => (
            <VideoCard key={video.youtubeId} video={video} />
          ))}
        </div>
      )}
    </div>
  );
}
