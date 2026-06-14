import { AMBER, BLUE, BORDER, BRAND, BRAND_FAINT, GREEN, MUTED, RED, TEXT } from '../constants/theme';

export function MetricBar({ label, value, max = 100, tone = BRAND, suffix = '', subtitle }) {
  const safeMax = Number(max) > 0 ? Number(max) : 1;
  const safeValue = Number(value) || 0;
  const width = Math.max(4, Math.min(100, (safeValue / safeMax) * 100));

  return (
    <div style={{ display: 'grid', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ color: TEXT, fontWeight: 900, fontSize: 12 }}>{label}</div>
        <div style={{ color: tone, fontWeight: 950, fontSize: 12 }}>{safeValue}{suffix}</div>
      </div>
      <div style={{ height: 10, borderRadius: 999, background: BRAND_FAINT, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
        <div className="zukari-bar-fill" style={{ width: `${width}%`, height: '100%', background: tone, borderRadius: 999 }} />
      </div>
      {subtitle ? <div style={{ color: MUTED, fontSize: 11, fontWeight: 700 }}>{subtitle}</div> : null}
    </div>
  );
}

export function TimeInRangeStrip({ low = 0, range = 0, high = 0 }) {
  const total = low + range + high;
  const safe = total || 1;
  const lowWidth = (low / safe) * 100;
  const rangeWidth = (range / safe) * 100;
  const highWidth = (high / safe) * 100;

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', height: 18, borderRadius: 999, overflow: 'hidden', background: BRAND_FAINT, border: `1px solid ${BORDER}` }}>
        <div className="zukari-bar-fill" style={{ width: `${lowWidth}%`, background: RED }} />
        <div className="zukari-bar-fill" style={{ width: `${rangeWidth}%`, background: GREEN }} />
        <div className="zukari-bar-fill" style={{ width: `${highWidth}%`, background: AMBER }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
        <Legend label="Low" value={low} tone={RED} />
        <Legend label="Range" value={range} tone={GREEN} />
        <Legend label="High" value={high} tone={AMBER} />
      </div>
    </div>
  );
}

function Legend({ label, value, tone }) {
  return (
    <div style={{ color: tone, background: `${tone}12`, borderRadius: 12, padding: 8, textAlign: 'center' }}>
      <div style={{ fontWeight: 950, fontSize: 15 }}>{value}</div>
      <div style={{ fontWeight: 800, fontSize: 10 }}>{label}</div>
    </div>
  );
}

export function SimpleBarChart({ data = [], valueKey = 'value', labelKey = 'label', tone = BRAND, suffix = '', emptyText = 'No chart data yet.' }) {
  const max = Math.max(0, ...data.map((item) => Number(item[valueKey]) || 0));

  if (!data.length || max <= 0) {
    return <div style={{ color: MUTED, fontWeight: 750, fontSize: 13, padding: '10px 0' }}>{emptyText}</div>;
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {data.map((item) => {
        const value = Number(item[valueKey]) || 0;
        const width = Math.max(4, (value / max) * 100);

        return (
          <div key={item[labelKey]} style={{ display: 'grid', gap: 5 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ color: TEXT, fontWeight: 850, fontSize: 12 }}>{item[labelKey]}</span>
              <span style={{ color: tone, fontWeight: 950, fontSize: 12 }}>{value}{suffix}</span>
            </div>
            <div style={{ height: 11, borderRadius: 999, background: BRAND_FAINT, border: `1px solid ${BORDER}`, overflow: 'hidden' }}>
              <div className="zukari-bar-fill" style={{ width: `${width}%`, height: '100%', background: tone, borderRadius: 999 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DualMetricRows({ data = [], leftLabel = 'Carbs', rightLabel = 'Glucose' }) {
  if (!data.length) {
    return <div style={{ color: MUTED, fontWeight: 750, fontSize: 13, padding: '10px 0' }}>No comparison data yet.</div>;
  }

  const maxLeft = Math.max(1, ...data.map((item) => Number(item.left) || 0));
  const maxRight = Math.max(1, ...data.map((item) => Number(item.right) || 0));

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {data.map((item) => {
        const left = Number(item.left) || 0;
        const right = Number(item.right) || 0;

        return (
          <div key={item.label} style={{ display: 'grid', gap: 6 }}>
            <div style={{ color: TEXT, fontWeight: 900, fontSize: 12 }}>{item.label}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 44px', gap: 8, alignItems: 'center' }}>
              <span style={{ color: MUTED, fontWeight: 800, fontSize: 11 }}>{leftLabel}</span>
              <div style={{ height: 9, borderRadius: 999, background: BRAND_FAINT, overflow: 'hidden' }}>
                <div className="zukari-bar-fill" style={{ width: `${Math.max(3, (left / maxLeft) * 100)}%`, height: '100%', background: AMBER }} />
              </div>
              <span style={{ color: AMBER, fontWeight: 950, fontSize: 11, textAlign: 'right' }}>{left}</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '70px 1fr 44px', gap: 8, alignItems: 'center' }}>
              <span style={{ color: MUTED, fontWeight: 800, fontSize: 11 }}>{rightLabel}</span>
              <div style={{ height: 9, borderRadius: 999, background: BRAND_FAINT, overflow: 'hidden' }}>
                <div className="zukari-bar-fill" style={{ width: `${Math.max(3, (right / maxRight) * 100)}%`, height: '100%', background: BLUE }} />
              </div>
              <span style={{ color: BLUE, fontWeight: 950, fontSize: 11, textAlign: 'right' }}>{right}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
