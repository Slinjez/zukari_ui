import { Edit3, Trash2, X } from 'lucide-react';
import { BORDER, BRAND, BRAND_FAINT, MUTED, RED, TEXT } from '../constants/theme';
import { HISTORY_FILTERS } from '../utils/logFilters';

export function FilterTabs({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      {HISTORY_FILTERS.map((filter) => {
        const active = value === filter.id;

        return (
          <button
            key={filter.id}
            type="button"
            className={`zukari-filter-tab ${active ? 'is-active' : ''}`.trim()}
            onClick={() => onChange(filter.id)}
            style={{
              border: `1px solid ${active ? BRAND : BORDER}`,
              background: active ? '#efe0cf' : BRAND_FAINT,
              color: active ? BRAND : MUTED,
              borderRadius: 999,
              padding: '8px 11px',
              fontWeight: 900,
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            {filter.label}
          </button>
        );
      })}
    </div>
  );
}

export function MiniButton({ children, onClick, tone = BRAND, title, icon: Icon }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="zukari-mini-button"
      style={{
        border: `1px solid ${tone}`,
        background: `${tone}12`,
        color: tone,
        borderRadius: 999,
        padding: '8px 10px',
        fontWeight: 950,
        fontSize: 11,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
      }}
    >
      {Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  );
}

export function HistoryCard({
  title,
  subtitle,
  value,
  badge,
  tone = BRAND,
  note,
  children,
  onEdit,
  onDelete,
  isEditing = false,
}) {
  return (
    <div
      className="zukari-history-card"
      style={{
        border: `1px solid ${isEditing ? tone : BORDER}`,
        background: isEditing ? `${tone}0f` : '#fbfaf7',
        borderRadius: 18,
        padding: 13,
        marginBottom: 10,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ color: TEXT, fontWeight: 950, fontSize: 14 }}>{title}</div>
          <div style={{ color: MUTED, fontWeight: 700, fontSize: 12, marginTop: 3 }}>{subtitle}</div>
          {note ? (
            <div style={{ color: MUTED, fontWeight: 650, fontSize: 12, marginTop: 7, lineHeight: 1.35 }}>
              {note}
            </div>
          ) : null}
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ color: tone, fontWeight: 950, fontSize: 18 }}>{value}</div>
          {badge ? (
            <span
              style={{
                display: 'inline-block',
                marginTop: 4,
                color: tone,
                background: `${tone}14`,
                borderRadius: 999,
                padding: '4px 8px',
                fontSize: 10,
                fontWeight: 900,
              }}
            >
              {badge}
            </span>
          ) : null}
        </div>
      </div>

      {children ? <div style={{ marginTop: 12 }}>{children}</div> : null}

      {!isEditing ? (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 11 }}>
          <MiniButton onClick={onEdit} tone={BRAND} icon={Edit3}>Edit</MiniButton>
          <MiniButton onClick={onDelete} tone={RED} icon={Trash2}>Delete</MiniButton>
        </div>
      ) : null}
    </div>
  );
}

export function EmptyHistory({ children }) {
  return (
    <div style={{ color: MUTED, fontWeight: 750, fontSize: 13, padding: '8px 0', lineHeight: 1.45 }}>
      {children}
    </div>
  );
}

export function EditActions({ onCancel, onSave, saveLabel = 'Save changes', tone = BRAND }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginTop: 10 }}>
      <button
        type="button"
        onClick={onSave}
        className="zukari-primary-button"
        style={{
          height: 44,
          border: 'none',
          background: tone,
          color: '#fff',
          borderRadius: 14,
          fontWeight: 950,
          cursor: 'pointer',
        }}
      >
        {saveLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="zukari-mini-button"
        style={{
          width: 44,
          height: 44,
          border: `1px solid ${BORDER}`,
          background: BRAND_FAINT,
          color: MUTED,
          borderRadius: 14,
          fontWeight: 950,
          cursor: 'pointer',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <X size={17} />
      </button>
    </div>
  );
}
