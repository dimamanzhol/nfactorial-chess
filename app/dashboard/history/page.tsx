"use client";

const T = { text: "#0f0f0d", textMut: "#9e9e92" };

export default function DashboardHistoryPage() {
  return (
    <div style={{ padding: "40px 48px" }}>
      <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>History</p>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: T.text, marginBottom: 8 }}>Game History</h1>
      <p style={{ fontSize: 14, color: T.textMut }}>Full game log — coming soon.</p>
    </div>
  );
}
