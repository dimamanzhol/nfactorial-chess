import Link from "next/link";

const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
};

const companies = [
  {
    id: "google",
    name: "Google",
    interviewer: "Alex",
    trait: "Optimal solutions & time complexity",
    quote: "That works — but is there a more elegant approach?",
    focus: ["Algorithm efficiency", "Clean abstractions", "Edge cases"],
    color: "#4f8ef7",
  },
  {
    id: "meta",
    name: "Meta",
    interviewer: "Jordan",
    trait: "Speed + impact. Does it ship?",
    quote: "Good. Now do it faster. What's the bottleneck?",
    focus: ["Execution speed", "Practical trade-offs", "Shipping fast"],
    color: "#7c4dff",
  },
  {
    id: "amazon",
    name: "Amazon",
    interviewer: "Sam",
    trait: "Decision making & leadership principles",
    quote: "Walk me through your reasoning.",
    focus: ["Communication", "Decision rationale", "Strategic thinking"],
    color: "#ff9900",
  },
  {
    id: "apple",
    name: "Apple",
    interviewer: "Riley",
    trait: "Clarity of thought & elegance",
    quote: "Why this and not that? Convince me.",
    focus: ["Precision", "Elegant solutions", "Deep fundamentals"],
    color: "#888888",
  },
];

export default function CompaniesPage() {
  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "var(--font-geist), system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${T.border}`,
        padding: "0 40px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: T.text, textDecoration: "none" }}>
          KnightCode
        </Link>
        <Link href="/" style={{ fontSize: 13, color: T.textMut, textDecoration: "none" }}>
          ← Back
        </Link>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 40px" }}>
        <p
          style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: T.textMut,
            marginBottom: 16,
          }}
        >
          Choose your interviewer
        </p>
        <h1
          style={{
            fontSize: "clamp(36px, 5vw, 56px)",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            color: T.text,
            lineHeight: 1.05,
            marginBottom: 48,
          }}
        >
          Who are you interviewing<br />with today?
        </h1>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))", gap: 16 }}>
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/interview/${c.id}`}
              className="company-card"
              style={{
                display: "block",
                padding: "28px",
                border: `1px solid ${T.border}`,
                borderRadius: 12,
                background: T.bg,
                textDecoration: "none",
                ["--hover-color" as string]: c.color,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: T.text, marginBottom: 2 }}>
                    {c.name}
                  </p>
                  <p
                    style={{
                      fontFamily: "var(--font-geist-mono), monospace",
                      fontSize: 10,
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      color: T.textMut,
                    }}
                  >
                    with {c.interviewer}
                  </p>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    padding: "4px 10px",
                    borderRadius: 4,
                    background: `${c.color}15`,
                    color: c.color,
                  }}
                >
                  {c.interviewer}
                </span>
              </div>

              <p style={{ fontSize: 14, color: T.textSec, marginBottom: 16 }}>
                {c.trait}
              </p>

              <p
                style={{
                  fontSize: 13,
                  color: T.textMut,
                  fontStyle: "italic",
                  borderLeft: `2px solid ${c.color}40`,
                  paddingLeft: 12,
                  lineHeight: 1.5,
                  marginBottom: 20,
                }}
              >
                &ldquo;{c.quote}&rdquo;
              </p>

              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {c.focus.map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: 11,
                      color: T.textMut,
                      padding: "3px 8px",
                      borderRadius: 4,
                      border: `1px solid ${T.border}`,
                    }}
                  >
                    {f}
                  </span>
                ))}
              </div>

              <p style={{ fontSize: 13, color: c.color, fontWeight: 600, marginTop: 20 }}>
                Start interview →
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
