"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const T = {
  bg:           "#0d0a1a",
  surface:      "#13102a",
  border:       "#2d2250",
  accent:       "#7c3aed",
  accentBright: "#a78bfa",
  text:         "#e8e0f5",
  textSec:      "#a89cc8",
  textMut:      "#5e4f8a",
  error:        "#ef4444",
  green:        "#22c55e",
};

const PIXEL = "var(--font-pixel), monospace";

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab]           = useState<"signin" | "signup">("signin");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [info, setInfo]         = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setInfo(""); setLoading(true);
    if (tab === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else router.push("/dashboard/play");
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) { setError(error.message); setLoading(false); }
      else { setInfo("Check your email for a confirmation link, then sign in."); setLoading(false); setTab("signin"); }
    }
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "var(--font-geist), system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${T.border}`,
        padding: "0 40px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <div style={{
            width: 28, height: 28,
            background: `${T.accent}30`, border: `1.5px solid ${T.accent}`,
            borderRadius: 5, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
          }}>♛</div>
          <span style={{ fontFamily: PIXEL, fontSize: 10, color: T.text, letterSpacing: "0.06em" }}>
            KNIGHTCODE
          </span>
        </a>
        <a href="/" style={{ fontFamily: PIXEL, fontSize: 8, color: T.textMut,
          textDecoration: "none", letterSpacing: "0.06em" }}>
          ← BACK
        </a>
      </nav>

      {/* Centered card */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{
          width: "100%", maxWidth: 400,
          background: T.surface,
          border: `1.5px solid ${T.border}`,
          borderRadius: 12,
          padding: "36px 32px",
          boxShadow: `0 0 40px ${T.accent}12`,
        }}>
          {/* Header */}
          <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
            letterSpacing: "0.14em", marginBottom: 12 }}>ACCOUNT</p>
          <p style={{ fontFamily: PIXEL, fontSize: 14, color: T.text,
            letterSpacing: "0.04em", marginBottom: 28, lineHeight: 1.4 }}>
            {tab === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
          </p>

          {/* Tab toggle */}
          <div style={{
            display: "flex", marginBottom: 24,
            border: `1px solid ${T.border}`, borderRadius: 7, overflow: "hidden",
          }}>
            {(["signin", "signup"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setError(""); setInfo(""); }}
                style={{
                  flex: 1, padding: "9px 0",
                  background: tab === t ? T.accent : "transparent",
                  color: tab === t ? "#fff" : T.textMut,
                  border: "none", cursor: "pointer",
                  fontFamily: PIXEL, fontSize: 8,
                  letterSpacing: "0.06em",
                  transition: "background 0.12s",
                }}
              >
                {t === "signin" ? "SIGN IN" : "SIGN UP"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "12px 14px",
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 7,
                fontSize: 14, color: T.text,
                outline: "none", fontFamily: "inherit",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required minLength={6}
              style={{
                padding: "12px 14px",
                background: T.bg,
                border: `1px solid ${T.border}`,
                borderRadius: 7,
                fontSize: 14, color: T.text,
                outline: "none", fontFamily: "inherit",
              }}
            />

            {error && (
              <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.error,
                margin: 0, letterSpacing: "0.04em", lineHeight: 1.6 }}>
                {error}
              </p>
            )}
            {info && (
              <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.green,
                margin: 0, letterSpacing: "0.04em", lineHeight: 1.6 }}>
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 6,
                padding: "13px 0",
                background: loading ? `${T.accent}80` : T.accent,
                color: "#fff", border: "none", borderRadius: 7,
                fontFamily: PIXEL, fontSize: 9,
                letterSpacing: "0.06em",
                cursor: loading ? "wait" : "pointer",
                boxShadow: loading ? "none" : `0 0 20px ${T.accent}50`,
                transition: "box-shadow 0.12s",
              }}
            >
              {loading ? "…" : tab === "signin" ? "SIGN IN →" : "CREATE ACCOUNT →"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}
