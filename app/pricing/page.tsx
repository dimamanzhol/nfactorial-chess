"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/subscription";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { User } from "@supabase/supabase-js";

const T = {
  bg:           "#0d0a1a",
  surface:      "#13102a",
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
const PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID ?? "";

function PricingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [user, setUser]   = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const checkoutId = searchParams.get("checkoutId");
        if (success && checkoutId) {
          await fetch(`/api/polar/verify-checkout?checkoutId=${checkoutId}`);
        }
        const profile = await getProfile(data.user.id);
        setIsPro(profile.is_pro);
      }
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const upgradeUrl = user
    ? `/api/polar/checkout?products=${PRODUCT_ID}&customerEmail=${encodeURIComponent(user.email ?? "")}&customerExternalId=${user.id}`
    : "/auth";
  const portalUrl = user ? `/api/polar/portal?userId=${user.id}` : "/auth";

  return (
    <div style={{ background: T.bg, minHeight: "100vh",
      fontFamily: "var(--font-geist), system-ui, sans-serif" }}>

      {/* Nav */}
      <nav style={{
        height: 56, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 40px",
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

      <div style={{ maxWidth: 720, margin: "0 auto", padding: isMobile ? "32px 16px" : "60px 24px" }}>

        {/* Success banner */}
        {success && (
          <div style={{
            marginBottom: 32, padding: "14px 20px",
            background: `${T.green}15`, border: `1px solid ${T.green}40`,
            borderRadius: 8,
          }}>
            <p style={{ fontFamily: PIXEL, fontSize: 8, color: T.green,
              letterSpacing: "0.06em", margin: 0 }}>
              ⚡ YOU&apos;RE NOW PRO! ENJOY UNLIMITED GAMES AND ALL DIFFICULTIES.
            </p>
          </div>
        )}

        {/* Header */}
        <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
          letterSpacing: "0.14em", marginBottom: 12 }}>PRICING</p>
        <h1 style={{ fontFamily: PIXEL, fontSize: 20, color: T.text,
          letterSpacing: "0.04em", marginBottom: 12, lineHeight: 1.4 }}>
          SIMPLE, HONEST<br />PRICING
        </h1>
        <p style={{ fontFamily: "var(--font-vt), monospace", fontSize: 20,
          color: T.textSec, marginBottom: 48 }}>
          Free to play. Upgrade for unlimited access.
        </p>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>

          {/* Free */}
          <div style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 12, padding: "28px 24px",
            display: "flex", flexDirection: "column",
          }}>
            <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
              letterSpacing: "0.12em", marginBottom: 16 }}>FREE</p>
            <p style={{ fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 40, fontWeight: 800, color: T.text,
              letterSpacing: "-0.04em", margin: "0 0 4px" }}>$0</p>
            <p style={{ fontFamily: "var(--font-vt), monospace", fontSize: 18,
              color: T.textMut, marginBottom: 24 }}>Forever free</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {["5 games per day", "Easy problems only", "Python only"].map((f) => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: T.textMut, fontSize: 14 }}>—</span>
                  <span style={{ fontFamily: "var(--font-vt), monospace",
                    fontSize: 18, color: T.textSec }}>{f}</span>
                </div>
              ))}
            </div>

            <div style={{
              padding: "10px 0", textAlign: "center",
              border: `1px solid ${T.border}`, borderRadius: 7,
              fontFamily: PIXEL, fontSize: 8, color: T.textMut, letterSpacing: "0.06em",
            }}>
              CURRENT PLAN
            </div>
          </div>

          {/* Pro */}
          <div style={{
            background: `${T.accent}12`,
            border: `1.5px solid ${T.accent}60`,
            borderRadius: 12, padding: "28px 24px",
            position: "relative",
            display: "flex", flexDirection: "column",
            boxShadow: `0 0 32px ${T.accent}18`,
          }}>
            {/* Badge */}
            <div style={{
              position: "absolute", top: -1, right: 20,
              background: T.accent, color: "#fff",
              fontFamily: PIXEL, fontSize: 7,
              letterSpacing: "0.08em",
              padding: "4px 10px", borderRadius: "0 0 7px 7px",
            }}>
              RECOMMENDED
            </div>

            <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.accentBright,
              letterSpacing: "0.12em", marginBottom: 16 }}>PRO</p>
            <p style={{ fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 40, fontWeight: 800, color: T.gold,
              letterSpacing: "-0.04em", margin: "0 0 4px" }}>$7</p>
            <p style={{ fontFamily: "var(--font-vt), monospace", fontSize: 18,
              color: T.textSec, marginBottom: 24 }}>per month</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28, flex: 1 }}>
              {[
                "Unlimited games",
                "Easy + Medium + Hard problems",
                "JavaScript + Python",
                "All time controls (1 / 3 / 5 min)",
              ].map((f) => (
                <div key={f} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ color: T.green, fontSize: 14, fontWeight: 700 }}>✓</span>
                  <span style={{ fontFamily: "var(--font-vt), monospace",
                    fontSize: 18, color: T.text }}>{f}</span>
                </div>
              ))}
            </div>

            {loading ? (
              <div style={{ height: 40 }} />
            ) : !user ? (
              <a href="/auth" style={{
                display: "block", padding: "12px 0", textAlign: "center",
                background: T.accent, color: "#fff", borderRadius: 7,
                textDecoration: "none", fontFamily: PIXEL, fontSize: 9,
                letterSpacing: "0.06em", boxShadow: `0 0 20px ${T.accent}50`,
              }}>
                SIGN IN TO UPGRADE →
              </a>
            ) : isPro ? (
              <a href={portalUrl} style={{
                display: "block", padding: "12px 0", textAlign: "center",
                background: `${T.accent}20`, color: T.accentBright,
                border: `1px solid ${T.accent}50`,
                borderRadius: 7, textDecoration: "none",
                fontFamily: PIXEL, fontSize: 9, letterSpacing: "0.06em",
              }}>
                MANAGE SUBSCRIPTION →
              </a>
            ) : (
              <a href={upgradeUrl} style={{
                display: "block", padding: "12px 0", textAlign: "center",
                background: T.accent, color: "#fff", borderRadius: 7,
                textDecoration: "none", fontFamily: PIXEL, fontSize: 9,
                letterSpacing: "0.06em", boxShadow: `0 0 20px ${T.accent}50`,
              }}>
                UPGRADE →
              </a>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
