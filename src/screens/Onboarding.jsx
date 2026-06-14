import { useRef } from "react";
import { ChevronRight, Plus, ShieldCheck, TrendingUp } from "lucide-react";
import { BLUE, BRAND, BRAND_DARK, GREEN } from "../constants/theme";
import BrandLogo from "../components/BrandLogo";

export default function Onboarding({
  welcomeStep,
  setWelcomeStep,
  finishWelcome,
  tir,
}) {
  const touchStartX = useRef(null);
  const slides = [
    {
      kicker: "Welcome to Zukari",
      title: "A calmer way to understand your glucose.",
      body: "Track readings, insulin, meals and activity in one warm, simple dashboard built for daily control.",
      icon: ShieldCheck,
      tone: BRAND,
      metric: "mmol/L",
      caption: "Your glucose command center",
    },
    {
      kicker: "Log in seconds",
      title: "Capture the important moments without drama.",
      body: "Record glucose, Novorapid, Lantus, food and movement quickly — because diabetes already has enough admin.",
      icon: Plus,
      tone: BLUE,
      metric: "4 logs",
      caption: "Glucose · Insulin · Food · Activity",
    },
    {
      kicker: "See patterns",
      title: "Turn daily logs into useful insight.",
      body: "Follow time in range, averages and trends so you can make better decisions with your clinician.",
      icon: TrendingUp,
      tone: GREEN,
      metric: `${tir}%`,
      caption: "Current sample time in range",
    },
  ];
  const slide = slides[welcomeStep];
  const Icon = slide.icon;
  const isLast = welcomeStep === slides.length - 1;
  const goNext = () =>
    isLast
      ? finishWelcome()
      : setWelcomeStep((s) => Math.min(s + 1, slides.length - 1));
  const goPrev = () => setWelcomeStep((s) => Math.max(s - 1, 0));

  return (
    <div
      className="zukari-onboarding-root"
      onTouchStart={(e) => {
        touchStartX.current = e.touches?.[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx =
          (e.changedTouches?.[0]?.clientX ?? touchStartX.current) -
          touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) < 48) return;
        if (dx < 0) goNext();
        if (dx > 0) goPrev();
      }}
      style={{
        position: "fixed",
        inset: 0,
        minHeight: "100dvh",
        width: "100%",
        maxWidth: "100vw",
        background: `linear-gradient(155deg, ${BRAND_DARK} 0%, #3f2412 48%, #130b06 100%)`,
        color: "#fff",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        overflowX: "clip",
        overscrollBehaviorX: "none",
        touchAction: "pan-y",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 260,
          height: 260,
          borderRadius: "50%",
          background: "rgba(246,234,208,.12)",
          top: -70,
          right: -90,
        }}
      />
      <div
        style={{
          padding: "18px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 11, minWidth: 0 }}>
          <BrandLogo
            size={46}
            compact
            style={{
              borderColor: "rgba(255,255,255,.18)",
              boxShadow: "0 12px 28px rgba(0,0,0,.18)",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                letterSpacing: 3,
                fontWeight: 950,
                fontSize: 13,
                color: "#f4d7aa",
              }}
            >
              ZUKARI
            </div>
            <div
              style={{
                marginTop: 3,
                fontSize: 12,
                color: "rgba(255,255,255,.62)",
                fontWeight: 700,
              }}
            >
              Diabetes control, less chaos
            </div>
          </div>
        </div>
        <button
          onClick={finishWelcome}
          className="zukari-pressable"
          style={{
            border: "1px solid rgba(255,255,255,.18)",
            background: "rgba(255,255,255,.08)",
            color: "rgba(255,255,255,.78)",
            borderRadius: 999,
            padding: "8px 12px",
            fontWeight: 850,
            fontSize: 12,
          }}
        >
          Skip
        </button>
      </div>
      <div
        style={{
          flex: 1,
          display: "grid",
          placeItems: "center",
          padding: "10px 20px",
          zIndex: 1,
        }}
      >
        <div style={{ width: "100%", maxWidth: 420, minWidth: 0 }}>
          <div
            key={welcomeStep}
            className="zukari-onboarding-card"
            style={{
              border: "1px solid rgba(255,255,255,.16)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.06))",
              boxShadow: "0 24px 80px rgba(0,0,0,.28)",
              borderRadius: 34,
              padding: 22,
              minHeight: 310,
              backdropFilter: "blur(18px)",
            }}
          >
            {welcomeStep === 0 ? (
              <BrandLogo
                size={82}
                style={{
                  marginBottom: 22,
                  borderColor: "rgba(255,255,255,.18)",
                  boxShadow: "0 18px 44px rgba(0,0,0,.18)",
                }}
              />
            ) : (
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 22,
                  display: "grid",
                  placeItems: "center",
                  background: `${slide.tone}33`,
                  color: "#f4d7aa",
                  border: "1px solid rgba(255,255,255,.14)",
                  marginBottom: 22,
                }}
              >
                <Icon size={30} strokeWidth={2.6} />
              </div>
            )}
            <div
              style={{
                color: "#f4d7aa",
                fontSize: 12,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                fontWeight: 950,
                marginBottom: 10,
              }}
            >
              {slide.kicker}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 34,
                lineHeight: 1.05,
                letterSpacing: -1.1,
                fontWeight: 950,
              }}
            >
              {slide.title}
            </h1>
            <p
              style={{
                margin: "16px 0 24px",
                color: "rgba(255,255,255,.72)",
                fontSize: 15.5,
                lineHeight: 1.55,
                fontWeight: 600,
              }}
            >
              {slide.body}
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "rgba(255,255,255,.1)",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 22,
                padding: "14px 16px",
              }}
            >
              <div>
                <div
                  style={{
                    color: "rgba(255,255,255,.62)",
                    fontSize: 11,
                    textTransform: "uppercase",
                    letterSpacing: 1.1,
                    fontWeight: 900,
                  }}
                >
                  Preview
                </div>
                <div
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 850,
                    marginTop: 3,
                  }}
                >
                  {slide.caption}
                </div>
              </div>
              <div style={{ color: "#f4d7aa", fontSize: 26, fontWeight: 950 }}>
                {slide.metric}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          padding: "18px 20px calc(18px + env(safe-area-inset-bottom))",
          zIndex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            marginBottom: 18,
          }}
        >
          {slides.map((_, i) => (
            <span
              key={i}
              style={{
                width: i === welcomeStep ? 28 : 8,
                height: 8,
                borderRadius: 999,
                background:
                  i === welcomeStep ? "#f4d7aa" : "rgba(255,255,255,.24)",
                transition: "all 180ms ease",
              }}
            />
          ))}
        </div>
        <button
          onClick={goNext}
          className="zukari-primary-button"
          style={{
            width: "100%",
            maxWidth: 420,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            height: 56,
            border: "none",
            borderRadius: 18,
            background: "#f4d7aa",
            color: "#23140b",
            fontWeight: 950,
            fontSize: 15,
            boxShadow: "0 16px 34px rgba(248,223,157,.22)",
          }}
        >
          {isLast ? "Set up account" : "Continue"}
          <ChevronRight size={20} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
}
