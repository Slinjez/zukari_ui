import { useMemo } from 'react';
import { BRAND, BORDER, MUTED, SURFACE } from '../constants/theme';

export default function SparkLine({ glucose, height = 92 }) {
  const chart = useMemo(() => {
    const vals = glucose.map((g) => Number(g.val)).filter((v) => Number.isFinite(v));
    const W = 300;
    const H = 86;

    if (vals.length === 0) {
      return {
        W,
        H,
        empty: true,
        pts: [],
        path: `M0,${H / 2}L${W},${H / 2}`,
        area: `M0,${H / 2}L${W},${H / 2}L${W},${H}L0,${H}Z`,
      };
    }

    const min = Math.min(...vals) - 0.5;
    const max = Math.max(...vals) + 0.5;
    const pts = vals.map((v, i) => {
      const x = vals.length === 1 ? W / 2 : (i / (vals.length - 1)) * W;
      const y = H - ((v - min) / (max - min || 1)) * H;
      return { x, y };
    });
    const path = `M${pts.map((p) => `${p.x},${p.y}`).join('L')}`;
    const area = `${path}L${W},${H}L0,${H}Z`;

    return { W, H, pts, path, area, empty: false };
  }, [glucose]);

  return (
    <svg viewBox={`0 0 ${chart.W} ${chart.H}`} style={{ width: '100%', height }}>
      <defs>
        <linearGradient id="zukariFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND} stopOpacity="0.2" />
          <stop offset="100%" stopColor={BRAND} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={chart.area} fill="url(#zukariFill)" />
      <path
        className={chart.empty ? undefined : 'zukari-spark-path'}
        d={chart.path}
        fill="none"
        stroke={chart.empty ? BORDER : BRAND}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={chart.empty ? '8 8' : undefined}
      />
      {chart.empty ? (
        <text x="150" y="38" textAnchor="middle" fill={MUTED} fontSize="12" fontWeight="700">
          No readings yet
        </text>
      ) : (
        chart.pts.map((p, i) => (
          <circle
            key={i}
            className="zukari-spark-point"
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill={SURFACE}
            stroke={BRAND}
            strokeWidth="3"
            style={{ animationDelay: `${220 + i * 35}ms` }}
          />
        ))
      )}
    </svg>
  );
}
