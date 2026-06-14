import { useState } from 'react';
import { ChevronRight, Database, LogOut, Menu, PlayCircle, Settings, UserRound, X } from 'lucide-react';
import BrandLogo from './BrandLogo';
import { BG, BORDER, BRAND, BRAND_DARK, BRAND_SOFT, MUTED, TEXT } from '../constants/theme';
import { NAV } from '../constants/data';

const BOTTOM_NAV_IDS = ['home', 'blood_sugar', 'insulin', 'meals', 'insights'];
const DRAWER_NAV_IDS = ['exercise', 'profile'];

function DrawerButton({ icon: Icon, label, subtitle, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="zukari-drawer-button"
      style={{
        width: '100%',
        border: `1px solid ${active ? BRAND : BORDER}`,
        background: active ? BRAND_SOFT : '#fffaf5',
        color: TEXT,
        borderRadius: 18,
        padding: 13,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        boxShadow: active ? '0 10px 24px rgba(79,54,0,.08)' : 'none',
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          background: active ? '#fff' : BRAND_SOFT,
          color: active ? BRAND_DARK : MUTED,
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={19} strokeWidth={2.5} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: TEXT, fontWeight: 950, fontSize: 14 }}>{label}</div>
        {subtitle ? (
          <div style={{ color: MUTED, fontWeight: 700, fontSize: 11, marginTop: 2 }}>{subtitle}</div>
        ) : null}
      </div>
      <ChevronRight size={18} color={MUTED} />
    </button>
  );
}

export default function AppShell({
  screen,
  setScreen,
  children,
  glucoseUnit = 'mmol/L',
  name = 'Bo$$',
  preferences = {},
  onLogout,
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const current = NAV.find((n) => n.id === screen) || (screen === 'learn' ? { label: 'Learn' } : null);
  const firstName = String(name || preferences?.name || 'Bo$$').split(' ')[0];
  const bottomNav = NAV.filter((n) => BOTTOM_NAV_IDS.includes(n.id));
  const drawerNav = NAV.filter((n) => DRAWER_NAV_IDS.includes(n.id));

  const goTo = (target) => {
    setScreen(target);
    setDrawerOpen(false);
  };

  return (
    <div
      className="zukari-shell"
      style={{
        background: BG,
        minHeight: '100vh',
        width: '100%',
        color: TEXT,
        fontFamily:
          "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        paddingBottom: 88,
        overflowX: 'hidden',
      }}
    >
      <div
        className="zukari-topbar"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          background: 'rgba(247,239,231,.94)',
          backdropFilter: 'blur(18px)',
          borderBottom: `1px solid ${BORDER}`,
          padding: '14px 18px 12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => goTo('home')}
            className="zukari-pressable"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 0,
              border: 'none',
              background: 'transparent',
              padding: 0,
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <BrandLogo
              size={42}
              compact
              style={{
                flexShrink: 0,
                borderRadius: 13,
                boxShadow: '0 8px 20px rgba(43,22,9,.08)',
              }}
            />
            <div style={{ minWidth: 0 }}>
              <div style={{ color: BRAND, fontWeight: 950, fontSize: 13, letterSpacing: 2.4 }}>ZUKARI</div>
              <div style={{ color: MUTED, fontSize: 12, fontWeight: 700, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {current?.label || 'Dashboard'} · {firstName}
              </div>
            </div>
          </button>

          <button
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
            className="zukari-pressable"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: BRAND_DARK,
              background: BRAND_SOFT,
              border: `1px solid ${BORDER}`,
              padding: '8px 11px',
              borderRadius: 999,
              fontWeight: 900,
              fontSize: 12,
              cursor: 'pointer',
              maxWidth: 145,
            }}
          >
            <UserRound size={15} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{firstName}</span>
            <Menu size={15} />
          </button>
        </div>
      </div>

      <main className="zukari-main" style={{ padding: '0 16px 18px', maxWidth: 560, margin: '0 auto' }}>
        <div key={screen} className="zukari-screen">
          {children}
        </div>
      </main>

      {drawerOpen ? (
        <div
          onClick={() => setDrawerOpen(false)}
          className="zukari-drawer-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            background: 'rgba(43,22,9,.28)',
            backdropFilter: 'blur(3px)',
          }}
        >
          <aside
            onClick={(e) => e.stopPropagation()}
            className="zukari-drawer-panel"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              width: 'min(86vw, 360px)',
              background: BG,
              borderLeft: `1px solid ${BORDER}`,
              boxShadow: '-18px 0 42px rgba(43,22,9,.18)',
              padding: '18px 16px calc(18px + env(safe-area-inset-bottom))',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <BrandLogo size={42} compact style={{ borderRadius: 13, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: TEXT, fontWeight: 950, fontSize: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {name || preferences?.name || 'Boss'}
                  </div>
                  <div style={{ color: MUTED, fontWeight: 750, fontSize: 12, marginTop: 2 }}>
                    Zukari command drawer
                  </div>
                </div>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
                className="zukari-mini-button"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 14,
                  border: `1px solid ${BORDER}`,
                  background: '#fffaf5',
                  color: TEXT,
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={19} />
              </button>
            </div>

            <div
              style={{
                marginTop: 16,
                border: `1px solid ${BORDER}`,
                background: '#fffaf5',
                borderRadius: 20,
                padding: 14,
                display: 'grid',
                gap: 10,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>Glucose unit</span>
                <span style={{ color: TEXT, fontWeight: 950, fontSize: 12 }}>{glucoseUnit}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>Target range</span>
                <span style={{ color: TEXT, fontWeight: 950, fontSize: 12 }}>
                  {preferences?.targetMin || 3.9}–{preferences?.targetMax || 10}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                <span style={{ color: MUTED, fontWeight: 800, fontSize: 12 }}>Reminders</span>
                <span style={{ color: TEXT, fontWeight: 950, fontSize: 12 }}>
                  {preferences?.remindersEnabled ? 'On' : 'Off'}
                </span>
              </div>
            </div>

            <div style={{ marginTop: 16, display: 'grid', gap: 10 }}>
              {drawerNav.map((n) => {
                const Icon = n.icon;
                return (
                  <DrawerButton
                    key={n.id}
                    icon={Icon}
                    label={n.label}
                    subtitle={n.id === 'exercise' ? 'Activity, movement, bedroom cardio' : 'Profile and preferences'}
                    active={screen === n.id}
                    onClick={() => goTo(n.id)}
                  />
                );
              })}

              <DrawerButton
                icon={PlayCircle}
                label="Learn"
                subtitle="Care clips and Zukari picks"
                active={screen === 'learn'}
                onClick={() => goTo('learn')}
              />

              <DrawerButton
                icon={Database}
                label="Import historical logs"
                subtitle="Paste old glucose diary entries"
                active={screen === 'import_history'}
                onClick={() => goTo('import_history')}
              />

              <DrawerButton
                icon={Settings}
                label="Reminders & settings"
                subtitle="Targets, insulin types, exports"
                active={screen === 'profile'}
                onClick={() => goTo('profile')}
              />

              {onLogout ? (
                <button
                  onClick={() => {
                    setDrawerOpen(false);
                    onLogout();
                  }}
                  className="zukari-drawer-button"
                  style={{
                    width: '100%',
                    border: `1px solid ${BORDER}`,
                    background: '#fff5f2',
                    color: '#8a2f17',
                    borderRadius: 18,
                    padding: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    textAlign: 'left',
                    fontWeight: 950,
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 14,
                      background: '#f4e1dc',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <LogOut size={19} />
                  </div>
                  Logout
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      <nav
        className="zukari-bottom-nav"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 20,
          background: 'rgba(255,250,245,.96)',
          backdropFilter: 'blur(18px)',
          borderTop: `1px solid ${BORDER}`,
          padding: '8px 8px calc(8px + env(safe-area-inset-bottom))',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${bottomNav.length}, minmax(0, 1fr))`,
            gap: 6,
            maxWidth: 560,
            margin: '0 auto',
          }}
        >
          {bottomNav.map((n) => {
            const Icon = n.icon;
            const active = screen === n.id;

            return (
              <button
                key={n.id}
                onClick={() => setScreen(n.id)}
                className={`zukari-nav-item ${active ? 'is-active' : ''}`.trim()}
                style={{
                  border: 'none',
                  background: active ? BRAND_SOFT : 'transparent',
                  color: active ? BRAND_DARK : MUTED,
                  borderRadius: 15,
                  minHeight: 54,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  fontWeight: active ? 950 : 750,
                  fontSize: 10,
                }}
              >
                <Icon size={19} strokeWidth={active ? 3 : 2.25} />
                <span
                  style={{
                    display: 'block',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {n.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
