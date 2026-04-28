"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/useIsMobile";

const T = {
  bg:           "#0d0a1a",
  surface:      "#13102a",
  surfaceAlt:   "#1f1640",
  border:       "#2d2250",
  accent:       "#7c3aed",
  accentBright: "#a78bfa",
  text:         "#e8e0f5",
  textSec:      "#a89cc8",
  textMut:      "#5e4f8a",
  green:        "#22c55e",
  gold:         "#f59e0b",
};

const PIXEL = "var(--font-pixel), monospace";
const MONO  = "var(--font-geist-mono), monospace";
const VT    = "var(--font-vt), monospace";

const STEPS = [
  {
    n: "01",
    icon: "♟",
    title: "PICK YOUR MOVE",
    body: "Select a chess piece and choose where to move it on the board.",
  },
  {
    n: "02",
    icon: "⌨",
    title: "SOLVE TO UNLOCK",
    body: "A coding problem appears. Solve it before the timer runs out to execute your move.",
  },
  {
    n: "03",
    icon: "♛",
    title: "EARN THE POSITION",
    body: "Faster coders get better positions. Checkmate your opponent to win the game.",
  },
];

const MODES = [
  {
    img: "/mfking.png",
    color: T.accent,
    colorDim: `${T.accent}30`,
    title: "VS AI",
    sub: "SINGLE PLAYER",
    desc: "Practise coding problems and chess strategy against our adaptive AI opponent.",
    cta: "PLAY NOW →",
  },
  {
    img: "/knight-pfp.png",
    color: T.green,
    colorDim: `${T.green}25`,
    title: "VS FRIEND",
    sub: "MULTIPLAYER",
    desc: "Challenge a friend in real time with a private room code. May the best coder win.",
    cta: "PLAY NOW →",
  },
  {
    img: "/queen.png",
    color: T.gold,
    colorDim: `${T.gold}25`,
    title: "RANKED ARENA",
    sub: "COMPETITIVE",
    desc: "Auto-match against players of similar ELO. Climb the leaderboard and earn your rank.",
    cta: "PLAY NOW →",
  },
];

export default function LandingPage() {
  const router = useRouter();
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/dashboard/play");
    });
  }, [router]);

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "var(--font-geist), system-ui, sans-serif", overflowX: "hidden" }}>

      {/* ── Nav ── */}
      <nav style={{
        borderBottom: `1px solid ${T.border}`,
        padding: "0 40px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: T.bg,
        zIndex: 10,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 28, height: 28,
            background: `${T.accent}30`,
            border: `1.5px solid ${T.accent}`,
            borderRadius: 5,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14,
          }}>♛</div>
          <span style={{ fontFamily: PIXEL, fontSize: 10, color: T.text, letterSpacing: "0.06em" }}>
            KNIGHTCODE
          </span>
        </div>
        <a
          href="/auth"
          style={{
            fontFamily: PIXEL, fontSize: 8, color: T.accentBright,
            textDecoration: "none",
            background: `${T.accent}20`,
            border: `1px solid ${T.accent}50`,
            borderRadius: 5,
            padding: "6px 14px",
            letterSpacing: "0.06em",
          }}
        >
          SIGN IN →
        </a>
      </nav>

      {/* ── Hero ── */}
      <div style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: isMobile ? "60px 20px 40px" : "100px 40px 80px",
        textAlign: "center",
        position: "relative",
      }}>
        {/* Glow orb behind */}
        <div style={{
          position: "absolute",
          top: 60,
          left: "50%",
          transform: "translateX(-50%)",
          width: 600,
          height: 400,
          background: `radial-gradient(ellipse, ${T.accent}18 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 0,
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <p style={{
            fontFamily: PIXEL, fontSize: 9, color: T.accentBright,
            letterSpacing: "0.14em", marginBottom: 28,
          }}>
            CHESS × CODE
          </p>

          <h1 style={{
            fontFamily: PIXEL,
            fontSize: "clamp(22px, 4.5vw, 46px)",
            color: T.text,
            lineHeight: 1.35,
            letterSpacing: "0.02em",
            marginBottom: 28,
          }}>
            EARN YOUR MOVE.<br />
            <span style={{ color: T.accentBright }}>SOLVE TO PLAY.</span>
          </h1>

          <p style={{
            fontFamily: VT,
            fontSize: 22,
            color: T.textSec,
            lineHeight: 1.6,
            maxWidth: 520,
            margin: "0 auto 52px",
            letterSpacing: "0.02em",
          }}>
            Two players. One chess board. To make any move, you must first solve a coding problem.
            Faster solver earns the move. Fail in time — turn skipped.
          </p>

          {/* Hero video */}
          <div style={{
            margin: "0 auto 48px",
            maxWidth: 720,
            borderRadius: 10,
            overflow: "hidden",
            border: `1.5px solid ${T.border}`,
            boxShadow: `0 0 40px ${T.accent}20`,
          }}>
            <video
              src="/knightcode-herodemo.mp4"
              autoPlay
              loop
              muted
              playsInline
              style={{ width: "100%", display: "block" }}
            />
          </div>

          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/auth"
              style={{
                fontFamily: PIXEL, fontSize: 10, color: "#fff",
                textDecoration: "none",
                background: T.accent,
                border: `2px solid ${T.accent}`,
                borderRadius: 7,
                padding: "14px 32px",
                letterSpacing: "0.06em",
                boxShadow: `0 0 28px ${T.accent}60`,
              }}
            >
              START PLAYING →
            </a>
          </div>
        </div>
      </div>

      {/* ── Pixel divider ── */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent, ${T.border} 20%, ${T.border} 80%, transparent)`,
        margin: "0 40px",
      }} />

      {/* ── How it works ── */}
      <div id="how-it-works" style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "48px 20px" : "80px 40px" }}>
        <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
          letterSpacing: "0.14em", textAlign: "center", marginBottom: 10 }}>
          THE RULES
        </p>
        <h2 style={{ fontFamily: PIXEL, fontSize: 18, color: T.text,
          letterSpacing: "0.04em", textAlign: "center", marginBottom: 56 }}>
          HOW IT WORKS
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
          {STEPS.map((s) => (
            <div key={s.n} style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              padding: "28px 24px",
              position: "relative",
              overflow: "hidden",
            }}>
              {/* Big watermark number */}
              <span style={{
                position: "absolute", right: 16, bottom: 10,
                fontFamily: MONO, fontSize: 64, fontWeight: 900,
                color: T.border, lineHeight: 1,
                userSelect: "none", pointerEvents: "none",
                zIndex: 0,
              }}>
                {s.n}
              </span>

              <p style={{ fontFamily: PIXEL, fontSize: 26, marginBottom: 16, lineHeight: 1, position: "relative", zIndex: 1 }}>
                {s.icon}
              </p>
              <p style={{ fontFamily: PIXEL, fontSize: 9, color: T.accentBright,
                letterSpacing: "0.06em", marginBottom: 12, position: "relative", zIndex: 1 }}>
                {s.title}
              </p>
              <p style={{ fontFamily: VT, fontSize: 18, color: T.textSec, lineHeight: 1.5, margin: 0, position: "relative", zIndex: 1 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Pixel divider ── */}
      <div style={{
        height: 2,
        background: `linear-gradient(90deg, transparent, ${T.border} 20%, ${T.border} 80%, transparent)`,
        margin: "0 40px",
      }} />

      {/* ── Game modes ── */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: isMobile ? "48px 20px" : "80px 40px" }}>
        <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
          letterSpacing: "0.14em", textAlign: "center", marginBottom: 10 }}>
          PLAY MODES
        </p>
        <h2 style={{ fontFamily: PIXEL, fontSize: 18, color: T.text,
          letterSpacing: "0.04em", textAlign: "center", marginBottom: 56 }}>
          CHOOSE YOUR BATTLE
        </h2>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {MODES.map((m) => (
            <div key={m.title} style={{
              background: T.surface,
              border: `1.5px solid ${m.colorDim}`,
              borderRadius: 10,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: `0 0 28px ${m.color}10`,
            }}>
              {/* Image */}
              <div style={{
                height: 160,
                backgroundImage: `url('${m.img}')`,
                backgroundSize: "contain",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center bottom",
                background: `${m.colorDim}`,
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "center",
                paddingBottom: 0,
                position: "relative",
              }}>
                <img src={m.img} alt={m.title}
                  style={{ height: 140, imageRendering: "pixelated", objectFit: "contain" }} />
              </div>

              {/* Content */}
              <div style={{ padding: "20px 20px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                <p style={{ fontFamily: PIXEL, fontSize: 7, color: m.color,
                  letterSpacing: "0.1em", margin: "0 0 8px" }}>
                  {m.sub}
                </p>
                <p style={{ fontFamily: PIXEL, fontSize: 11, color: T.text,
                  letterSpacing: "0.04em", margin: "0 0 12px" }}>
                  {m.title}
                </p>
                <p style={{ fontFamily: VT, fontSize: 18, color: T.textSec, lineHeight: 1.5,
                  margin: "0 0 20px", flex: 1 }}>
                  {m.desc}
                </p>
                <a
                  href="/auth"
                  style={{
                    display: "block", padding: "10px 0", textAlign: "center",
                    fontFamily: PIXEL, fontSize: 8, color: m.color,
                    background: `${m.color}15`,
                    border: `1.5px solid ${m.color}50`,
                    borderRadius: 6,
                    textDecoration: "none",
                    letterSpacing: "0.06em",
                  }}
                >
                  {m.cta}
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CTA Banner ── */}
      <div style={{
        maxWidth: 900, margin: "0 auto 80px",
        padding: "0 40px",
      }}>
        <div style={{
          background: `${T.accent}18`,
          border: `1.5px solid ${T.accent}50`,
          borderRadius: 12,
          padding: "48px 40px",
          textAlign: "center",
          boxShadow: `0 0 48px ${T.accent}18`,
        }}>
          <p style={{ fontFamily: PIXEL, fontSize: 8, color: T.accentBright,
            letterSpacing: "0.12em", marginBottom: 18 }}>
            FREE TO PLAY
          </p>
          <h2 style={{ fontFamily: PIXEL, fontSize: 18, color: T.text,
            letterSpacing: "0.04em", marginBottom: 14, lineHeight: 1.4 }}>
            READY TO EARN<br />YOUR FIRST MOVE?
          </h2>
          <p style={{ fontFamily: VT, fontSize: 20, color: T.textSec, marginBottom: 36, lineHeight: 1.6 }}>
            Create a free account and start your first game in under 60 seconds.
          </p>
          <a
            href="/auth"
            style={{
              fontFamily: PIXEL, fontSize: 10, color: "#fff",
              textDecoration: "none",
              background: T.accent,
              borderRadius: 7,
              padding: "14px 36px",
              letterSpacing: "0.06em",
              boxShadow: `0 0 28px ${T.accent}60`,
              display: "inline-block",
            }}
          >
            CREATE ACCOUNT →
          </a>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{
        borderTop: `1px solid ${T.border}`,
        padding: "28px 40px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        maxWidth: 900,
        margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 16 }}>♛</span>
          <span style={{ fontFamily: PIXEL, fontSize: 8, color: T.textMut, letterSpacing: "0.06em" }}>
            KNIGHTCODE
          </span>
        </div>
        <span style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut, letterSpacing: "0.08em" }}>
          CHESS × CODE
        </span>
      </div>

    </div>
  );
}
