export const BRAND = '#6f431f';
export const BRAND_DARK = '#2b1609';
export const BRAND_SOFT = '#efe0cf';
export const BRAND_FAINT = '#faf2e9';
export const BG = '#f7efe7';
export const SURFACE = '#fffaf5';
export const TEXT = '#23140b';
export const MUTED = '#7a6656';
export const BORDER = '#e3d1bd';
export const GREEN = '#6f7d4a';
export const AMBER = '#9b6a2f';
export const RED = '#8f4a37';
export const BLUE = '#6d5140';

export const statusOf = (val, preferences = {}) => {
  const targetMin = Number(preferences.targetMin ?? 3.9);
  const targetMax = Number(preferences.targetMax ?? 10);
  const safeMin = Number.isFinite(targetMin) && targetMin > 0 ? targetMin : 3.9;
  const safeMax = Number.isFinite(targetMax) && targetMax > safeMin ? targetMax : 10;

  if (val < safeMin) {
    return {
      label: 'Low',
      tone: '#8f4a37',
      bg: '#f3e5d8',
      advice: 'Treat low glucose',
    };
  }

  if (val <= safeMax) {
    return {
      label: 'In range',
      tone: '#6f431f',
      bg: '#e8d8c7',
      advice: 'Steady control',
    };
  }

  return {
    label: 'High',
    tone: '#3b1f0d',
    bg: '#c39a73',
    advice: 'Monitor trend',
  };
};
