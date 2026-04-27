"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  dark: "#0f0f0d",
  error: "#ef4444",
};

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    if (tab === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        router.push("/");
      }
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setInfo("Check your email for a confirmation link, then sign in.");
        setLoading(false);
        setTab("signin");
      }
    }
  }

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
        position: "sticky",
        top: 0,
        background: T.bg,
        zIndex: 10,
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: T.text, textDecoration: "none" }}>
          KnightCode
        </a>
      </nav>

      {/* Form */}
      <div style={{ maxWidth: 400, margin: "80px auto", padding: "0 24px" }}>
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: T.textMut,
          marginBottom: 20,
        }}>
          Account
        </p>

        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: T.text, marginBottom: 32 }}>
          {tab === "signin" ? "Sign in" : "Create account"}
        </h1>

        {/* Tab toggle */}
        <div style={{ display: "flex", gap: 0, marginBottom: 28, border: `1.5px solid ${T.border}`, borderRadius: 10, overflow: "hidden" }}>
          {(["signin", "signup"] as const).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(""); setInfo(""); }}
              style={{
                flex: 1,
                padding: "10px 0",
                background: tab === t ? T.dark : "transparent",
                color: tab === t ? "#fff" : T.textSec,
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "-0.01em",
              }}
            >
              {t === "signin" ? "Sign in" : "Sign up"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              padding: "12px 16px",
              border: `1.5px solid ${T.border}`,
              borderRadius: 10,
              fontSize: 15,
              background: T.bg,
              color: T.text,
              outline: "none",
              fontFamily: "inherit",
            }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            style={{
              padding: "12px 16px",
              border: `1.5px solid ${T.border}`,
              borderRadius: 10,
              fontSize: 15,
              background: T.bg,
              color: T.text,
              outline: "none",
              fontFamily: "inherit",
            }}
          />

          {error && <p style={{ fontSize: 13, color: T.error, margin: 0 }}>{error}</p>}
          {info && <p style={{ fontSize: 13, color: T.textSec, margin: 0 }}>{info}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4,
              padding: "13px 24px",
              background: T.dark,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "wait" : "pointer",
              opacity: loading ? 0.7 : 1,
              fontFamily: "inherit",
              letterSpacing: "-0.01em",
            }}
          >
            {loading ? "…" : tab === "signin" ? "Sign in →" : "Create account →"}
          </button>
        </form>
      </div>
    </div>
  );
}
