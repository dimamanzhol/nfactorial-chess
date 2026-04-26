import Link from "next/link";

// ─── Design tokens ───────────────────────────────────────────────────────────
const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  bgDark: "#0f0f0d",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  borderDark: "#2a2a28",
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const companies = [
  {
    id: "google",
    name: "Google",
    interviewer: "Alex",
    trait: "Optimal solutions & time complexity",
    quote: "That works — but is there a more elegant approach?",
    color: "#4f8ef7",
  },
  {
    id: "meta",
    name: "Meta",
    interviewer: "Jordan",
    trait: "Speed + impact. Does it ship?",
    quote: "Good. Now do it faster. What's the bottleneck?",
    color: "#7c4dff",
  },
  {
    id: "amazon",
    name: "Amazon",
    interviewer: "Sam",
    trait: "Decision making & leadership principles",
    quote: "Walk me through your reasoning.",
    color: "#ff9900",
  },
  {
    id: "apple",
    name: "Apple",
    interviewer: "Riley",
    trait: "Clarity of thought & elegance",
    quote: "Why this and not that? Convince me.",
    color: "#888888",
  },
];

const features = [
  {
    n: "01",
    title: "Chess as an interview proxy",
    desc: "Puzzles map directly to algorithmic thinking — pattern recognition, multi-step planning, decisions under pressure. No syntax barrier.",
  },
  {
    n: "02",
    title: "A real AI interviewer",
    desc: 'Claude asks you to explain your moves in real-time — exactly like "walk me through your approach" in a real interview.',
  },
  {
    n: "03",
    title: "Structured debrief",
    desc: "Problem solving, communication, pressure handling — scored and explained with company-specific feedback.",
  },
  {
    n: "04",
    title: "Company-specific pressure",
    desc: "Google wants elegance. Meta wants speed. Amazon wants your reasoning. Apple wants conviction. Each session feels different.",
  },
];

const steps = [
  {
    n: "01",
    title: "Pick your company",
    desc: "Choose Google, Meta, Amazon, or Apple. Each comes with a distinct interviewer personality and puzzle style calibrated to that company's bar.",
  },
  {
    n: "02",
    title: "Solve under pressure",
    desc: "A chess puzzle loads. The AI interviewer probes you in real-time as you make moves — exactly like 'why did you choose that approach?' in a real interview.",
  },
  {
    n: "03",
    title: "Get your debrief",
    desc: "Receive a structured score on problem solving, communication, and pressure handling with specific tips — not just right or wrong.",
  },
];

const pricing = [
  {
    name: "Free",
    price: "$0",
    period: "",
    desc: "Get started today",
    items: ["3 mock interviews / day", "2 companies", "Basic AI debrief"],
    cta: "Start for free",
    primary: false,
  },
  {
    name: "Pro",
    price: "$9",
    period: "/mo",
    desc: "Serious interview prep",
    items: [
      "Unlimited interviews",
      "All 4 companies",
      "Full AI debrief",
      "LinkedIn share cards",
      "Progress tracking",
    ],
    cta: "Get Pro",
    primary: true,
  },
  {
    name: "Teams",
    price: "$29",
    period: "/mo",
    desc: "Bootcamps & universities",
    items: [
      "Everything in Pro",
      "Student progress tracking",
      "Custom puzzles",
      "Cohort leaderboard",
    ],
    cta: "Contact us",
    primary: false,
  },
];

// ─── Chess board mockup ───────────────────────────────────────────────────────
const BOARD = [
  ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"],
  ["♟", "♟", "♟", "♟", " ", "♟", "♟", "♟"],
  [" ", " ", " ", " ", " ", " ", " ", " "],
  [" ", " ", " ", " ", "♟", " ", " ", " "],
  [" ", " ", " ", " ", "♙", " ", " ", " "],
  [" ", " ", "♘", " ", " ", " ", " ", " "],
  ["♙", "♙", "♙", "♙", " ", "♙", "♙", "♙"],
  ["♖", " ", "♗", "♕", "♔", "♗", "♘", "♖"],
];

function ChessBoard() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", width: "100%", aspectRatio: "1" }}>
      {BOARD.map((row, r) =>
        row.map((piece, c) => {
          const light = (r + c) % 2 === 0;
          return (
            <div
              key={`${r}-${c}`}
              style={{
                background: light ? "#d4c9b8" : "#9e8e78",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(10px, 2.5vw, 18px)",
                color: piece === piece.toLowerCase() && piece !== " " ? "#1a1a1a" : "#f5f0e8",
                lineHeight: 1,
              }}
            >
              {piece !== " " ? piece : null}
            </div>
          );
        })
      )}
    </div>
  );
}

function InterviewMockup() {
  return (
    <div
      style={{
        border: `1px solid ${T.borderDark}`,
        borderRadius: 12,
        overflow: "hidden",
        background: "#111118",
        boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
        width: "100%",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      {/* Header bar */}
      <div
        style={{
          background: "#16161f",
          borderBottom: "1px solid #2a2a3a",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4f8ef7" }} />
          <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#9090a8", letterSpacing: "0.05em" }}>
            Google Interview · Alex
          </span>
        </div>
        <span style={{ fontFamily: "var(--font-geist-mono)", fontSize: 11, color: "#f59e0b" }}>
          ⏱ 12:34
        </span>
      </div>

      {/* Body */}
      <div style={{ display: "flex", height: 280 }}>
        {/* Chess board */}
        <div style={{ width: "45%", flexShrink: 0, padding: 12 }}>
          <ChessBoard />
        </div>

        {/* Chat panel */}
        <div
          style={{
            flex: 1,
            borderLeft: "1px solid #2a2a3a",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "14px 14px 12px",
          }}
        >
          {/* Messages */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, color: "#4f8ef7", marginBottom: 4, letterSpacing: "0.08em" }}>
                ALEX
              </p>
              <p style={{ fontSize: 12, color: "#d0d0e0", lineHeight: 1.5 }}>
                Interesting choice. Why did you push the pawn instead of developing your knight?
              </p>
            </div>
            <div>
              <p style={{ fontFamily: "var(--font-geist-mono)", fontSize: 9, color: "#55556a", marginBottom: 4, letterSpacing: "0.08em" }}>
                YOU
              </p>
              <p style={{ fontSize: 12, color: "#9090a8", lineHeight: 1.5 }}>
                I wanted to control the center before developing pieces...
              </p>
            </div>
          </div>

          {/* Input */}
          <div
            style={{
              border: "1px solid #2a2a3a",
              borderRadius: 6,
              padding: "8px 10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span style={{ fontSize: 11, color: "#55556a" }}>Your response...</span>
            <span
              style={{
                fontSize: 10,
                background: "#4f8ef7",
                color: "#fff",
                padding: "2px 8px",
                borderRadius: 4,
              }}
            >
              Send
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Home() {
  return (
    <div style={{ background: T.bg, color: T.text, fontFamily: "var(--font-geist), system-ui, sans-serif" }}>

      {/* ── Nav ── */}
      <nav
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: T.bg,
          borderBottom: `1px solid ${T.border}`,
          padding: "0 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: 56,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: T.text }}>
          KnightCode
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#how-it-works" style={{ fontSize: 14, color: T.textSec, textDecoration: "none" }}>
            How it works
          </a>
          <a href="#pricing" style={{ fontSize: 14, color: T.textSec, textDecoration: "none" }}>
            Pricing
          </a>
          <Link
            href="/companies"
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: "7px 16px",
              borderRadius: 6,
              background: T.bgDark,
              color: "#fff",
              textDecoration: "none",
              letterSpacing: "-0.01em",
            }}
          >
            Start Interview →
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "96px 40px 80px" }}>
        <p
          className="label-mono"
          style={{ color: T.textMut, marginBottom: 28 }}
        >
          BigTech Mock Interview Simulator
        </p>

        <div style={{ display: "flex", gap: 60, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Left: headline + CTA */}
          <div style={{ flex: "1 1 420px" }}>
            <h1
              style={{
                fontSize: "clamp(52px, 7vw, 88px)",
                fontWeight: 800,
                lineHeight: 1.02,
                letterSpacing: "-0.04em",
                color: T.text,
                marginBottom: 28,
              }}
            >
              The Interview Prep<br />
              that Actually<br />
              Works.
            </h1>
            <p style={{ fontSize: 18, color: T.textSec, lineHeight: 1.65, maxWidth: 460, marginBottom: 40 }}>
              Pick a company. Solve a chess puzzle under time pressure while explaining your thinking.
              Get grilled by an AI interviewer — then receive a real structured debrief.
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Link
                href="/companies"
                style={{
                  padding: "13px 28px",
                  borderRadius: 8,
                  background: T.bgDark,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 15,
                  textDecoration: "none",
                  letterSpacing: "-0.01em",
                }}
              >
                Start free interview
              </Link>
              <a
                href="#how-it-works"
                style={{
                  padding: "13px 28px",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  color: T.textSec,
                  fontWeight: 500,
                  fontSize: 15,
                  textDecoration: "none",
                }}
              >
                See how it works
              </a>
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", gap: 32, marginTop: 48 }}>
              {[
                { v: "4", l: "Companies" },
                { v: "500+", l: "Puzzles" },
                { v: "Free", l: "To start" },
              ].map((s) => (
                <div key={s.l}>
                  <p style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: T.text }}>
                    {s.v}
                  </p>
                  <p className="label-mono" style={{ color: T.textMut, marginTop: 2 }}>
                    {s.l}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Right: mockup */}
          <div style={{ flex: "1 1 340px" }}>
            <InterviewMockup />
          </div>
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ borderTop: `1px solid ${T.border}` }} />

      {/* ── Features strip ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 40px" }}>
        <p className="label-mono" style={{ color: T.textMut, marginBottom: 48 }}>
          Why it works
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 40 }}>
          {features.map((f) => (
            <div key={f.n}>
              <p
                className="label-mono"
                style={{ color: T.textMut, marginBottom: 14 }}
              >
                {f.n}
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 10, letterSpacing: "-0.01em" }}>
                {f.title}
              </p>
              <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.6 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ borderTop: `1px solid ${T.border}` }} />

      {/* ── Companies ── */}
      <section style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 40px" }}>
        <p className="label-mono" style={{ color: T.textMut, marginBottom: 48 }}>
          Choose your interviewer
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/interview/${c.id}`}
              className="company-card"
              style={{
                display: "block",
                padding: "24px",
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                background: T.bg,
                textDecoration: "none",
                ["--hover-color" as string]: c.color,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>
                  {c.name}
                </span>
                <span
                  className="label-mono"
                  style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: `${c.color}18`,
                    color: c.color,
                  }}
                >
                  {c.interviewer}
                </span>
              </div>
              <p style={{ fontSize: 13, color: T.textSec, marginBottom: 14 }}>
                {c.trait}
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: T.textMut,
                  fontStyle: "italic",
                  borderLeft: `2px solid ${c.color}40`,
                  paddingLeft: 10,
                  lineHeight: 1.5,
                }}
              >
                &ldquo;{c.quote}&rdquo;
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Divider ── */}
      <div style={{ borderTop: `1px solid ${T.border}` }} />

      {/* ── How it works ── */}
      <section id="how-it-works" style={{ maxWidth: 1100, margin: "0 auto", padding: "72px 40px" }}>
        <p className="label-mono" style={{ color: T.textMut, marginBottom: 48 }}>
          How it works
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 48 }}>
          {steps.map((s) => (
            <div key={s.n}>
              <p
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 36,
                  fontWeight: 700,
                  color: T.border,
                  marginBottom: 20,
                  letterSpacing: "-0.02em",
                }}
              >
                {s.n}
              </p>
              <p style={{ fontSize: 17, fontWeight: 600, color: T.text, marginBottom: 12, letterSpacing: "-0.01em" }}>
                {s.title}
              </p>
              <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.65 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dark section: interview pressure ── */}
      <section
        style={{
          background: T.bgDark,
          padding: "80px 40px",
        }}
      >
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", gap: 60, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 400px" }}>
            <p className="label-mono" style={{ color: "#55556a", marginBottom: 20 }}>
              Real interview pressure
            </p>
            <h2
              style={{
                fontSize: "clamp(32px, 5vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#f0f0f8",
                lineHeight: 1.1,
                marginBottom: 24,
              }}
            >
              The part that actually<br />gets you the offer.
            </h2>
            <p style={{ fontSize: 16, color: "#9090a8", lineHeight: 1.65, maxWidth: 440 }}>
              LeetCode trains your coding. KnightCode trains your thinking and communication under
              pressure — explaining your moves as you make them, handling follow-up questions, and
              recovering when you blunder.
            </p>
          </div>
          <div style={{ flex: "1 1 300px", display: "flex", flexDirection: "column", gap: 16 }}>
            {[
              { label: "Problem Solving", score: "8/10", color: "#22c55e" },
              { label: "Communication", score: "6/10", color: "#f59e0b" },
              { label: "Pressure Handling", score: "7/10", color: "#4f8ef7" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "#16161f",
                  border: "1px solid #2a2a3a",
                  borderRadius: 8,
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ fontSize: 14, color: "#9090a8" }}>{item.label}</span>
                <span style={{ fontSize: 18, fontWeight: 700, color: item.color, fontFamily: "var(--font-geist-mono)" }}>
                  {item.score}
                </span>
              </div>
            ))}
            <div
              style={{
                background: "#16161f",
                border: "1px solid #2a2a3a",
                borderRadius: 8,
                padding: "16px 20px",
              }}
            >
              <p className="label-mono" style={{ color: "#55556a", marginBottom: 8 }}>
                What Google would think
              </p>
              <p style={{ fontSize: 13, color: "#9090a8", lineHeight: 1.55, fontStyle: "italic" }}>
                &ldquo;Promising candidate. Shows strong pattern recognition but needs to work on
                communicating uncertainty. Would recommend another round.&rdquo;
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 40px" }}>
        <p className="label-mono" style={{ color: T.textMut, marginBottom: 12 }}>
          Pricing
        </p>
        <h2
          style={{
            fontSize: "clamp(32px, 4vw, 48px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: T.text,
            marginBottom: 48,
          }}
        >
          Start free. Upgrade when<br />you&apos;re serious.
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {pricing.map((p) => (
            <div
              key={p.name}
              style={{
                border: `1px solid ${p.primary ? T.text : T.border}`,
                borderRadius: 10,
                padding: "28px 24px",
                background: p.primary ? T.bgAlt : T.bg,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 4 }}>
                {p.name}
              </p>
              <p style={{ fontSize: 12, color: T.textMut, marginBottom: 20 }}>
                {p.desc}
              </p>
              <p style={{ marginBottom: 24 }}>
                <span style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", color: T.text }}>
                  {p.price}
                </span>
                {p.period && (
                  <span style={{ fontSize: 14, color: T.textMut }}>{p.period}</span>
                )}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 28px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
                {p.items.map((item) => (
                  <li key={item} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                    <span style={{ color: T.text, fontSize: 12, marginTop: 1, flexShrink: 0 }}>■</span>
                    <span style={{ fontSize: 13, color: T.textSec }}>{item}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/companies"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px 20px",
                  borderRadius: 6,
                  background: p.primary ? T.bgDark : "transparent",
                  border: `1px solid ${p.primary ? T.bgDark : T.border}`,
                  color: p.primary ? "#fff" : T.textSec,
                  fontSize: 14,
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {p.cta} →
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Dark CTA ── */}
      <section style={{ background: T.bgDark, padding: "80px 40px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 32 }}>
          <div>
            <p className="label-mono" style={{ color: "#55556a", marginBottom: 16 }}>
              Get started today for free
            </p>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 52px)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "#f0f0f8",
                lineHeight: 1.1,
              }}
            >
              CS students save $200/session<br />on mock interviews.
            </h2>
          </div>
          <Link
            href="/companies"
            style={{
              padding: "14px 32px",
              borderRadius: 8,
              background: "#fff",
              color: T.bgDark,
              fontWeight: 700,
              fontSize: 15,
              textDecoration: "none",
              letterSpacing: "-0.01em",
              whiteSpace: "nowrap",
            }}
          >
            Start free interview →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          borderTop: `1px solid ${T.border}`,
          padding: "28px 40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em", color: T.text }}>
          KnightCode
        </span>
        <div style={{ display: "flex", gap: 24 }}>
          <a href="#how-it-works" style={{ fontSize: 13, color: T.textMut, textDecoration: "none" }}>
            How it works
          </a>
          <a href="#pricing" style={{ fontSize: 13, color: T.textMut, textDecoration: "none" }}>
            Pricing
          </a>
        </div>
        <p className="label-mono" style={{ color: T.textMut }}>
          nFactorial Incubator 2026
        </p>
      </footer>
    </div>
  );
}
