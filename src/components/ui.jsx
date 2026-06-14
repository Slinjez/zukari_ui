import { BORDER, BRAND, BRAND_FAINT, MUTED, SURFACE, TEXT } from '../constants/theme';

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

export function Card({ children, style = {}, compact = false, className = '' }) {
  return (
    <section
      className={cx('zukari-card', className)}
      style={{
        background: SURFACE,
        border: `1px solid ${BORDER}`,
        borderRadius: 22,
        padding: compact ? 14 : 18,
        boxShadow: '0 14px 35px rgba(43,22,9,.08)',
        ...style,
      }}
    >
      {children}
    </section>
  );
}

export function Label({ children }) {
  return <div style={{ color: MUTED, fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 10 }}>{children}</div>;
}

export function Input({ value, onChange, type = 'number', placeholder, step, className = '', style = {}, ...props }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      step={step}
      {...props}
      className={cx('zukari-input', className)}
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
        ...style,
      }}
    />
  );
}

export function PrimaryButton({ children, onClick, color = BRAND, disabled = false, type = 'button', className = '' }) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cx('zukari-primary-button', className)}
      style={{
        width: '100%',
        height: 50,
        background: disabled ? MUTED : color,
        border: 'none',
        borderRadius: 15,
        color: '#fff',
        fontSize: 15,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.72 : 1,
        boxShadow: disabled ? 'none' : '0 12px 22px rgba(43,22,9,.16)',
      }}
    >
      {children}
    </button>
  );
}

export function Row({ title, subtitle, value, tone = BRAND, badge }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 0' }}>
    <div style={{ minWidth: 0 }}>
      <div style={{ color: TEXT, fontWeight: 700, fontSize: 14 }}>{title}</div>
      <div style={{ color: MUTED, fontSize: 12, marginTop: 2 }}>{subtitle}</div>
    </div>
    <div style={{ textAlign: 'right', flexShrink: 0 }}>
      <div style={{ color: tone, fontWeight: 900, fontSize: 18 }}>{value}</div>
      {badge && <span style={{ display: 'inline-block', marginTop: 3, color: tone, background: `${tone}14`, borderRadius: 999, padding: '3px 8px', fontSize: 10, fontWeight: 700 }}>{badge}</span>}
    </div>
  </div>;
}
