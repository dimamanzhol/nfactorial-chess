"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/subscription";
import type { User } from "@supabase/supabase-js";

const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  surface: "#ffffff",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  green: "#16a34a",
};

const PRODUCT_ID = process.env.NEXT_PUBLIC_POLAR_PRODUCT_ID ?? "";

function PricingContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        // If coming back from a successful checkout, verify and activate Pro
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
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "var(--font-geist), system-ui, sans-serif", color: T.text }}>
      {/* Nav */}
      <nav style={{
        height: 52, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", background: T.bg,
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.03em", color: T.text, textDecoration: "none" }}>
          KnightCode
        </a>
        <a href="/" style={{ fontSize: 13, color: T.textMut, textDecoration: "none" }}>← Back</a>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px" }}>
        {/* Success banner */}
        {success && (
          <div style={{
            marginBottom: 32, padding: "14px 20px",
            background: `${T.green}10`, border: `1px solid ${T.green}30`,
            borderRadius: 10, fontSize: 14, color: T.green, fontWeight: 600,
          }}>
            You&apos;re now Pro! Enjoy unlimited games and all difficulties.
          </div>
        )}

        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
          color: T.textMut, marginBottom: 16,
        }}>
          Pricing
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8 }}>
          Simple, honest pricing
        </h1>
        <p style={{ fontSize: 15, color: T.textSec, marginBottom: 40 }}>
          Free to play. Upgrade for unlimited access.
        </p>

        {/* Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Free card */}
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 16, padding: "28px 24px",
          }}>
            <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMut, marginBottom: 12 }}>
              Free
            </p>
            <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>$0</p>
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 24 }}>Forever free</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[
                "5 games per day",
                "Easy problems only",
                "No game history",
              ].map((f) => (
                <div key={f} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.textMut }}>—</span>
                  <span style={{ fontSize: 13, color: T.textSec }}>{f}</span>
                </div>
              ))}
            </div>
            <div style={{
              padding: "10px 0", textAlign: "center",
              fontSize: 13, color: T.textMut, fontWeight: 500,
              border: `1px solid ${T.border}`, borderRadius: 8,
            }}>
              Current plan
            </div>
          </div>

          {/* Pro card */}
          <div style={{
            background: T.surface, border: `1.5px solid ${T.text}`,
            borderRadius: 16, padding: "28px 24px", position: "relative",
          }}>
            <div style={{
              position: "absolute", top: -1, right: 20,
              background: T.text, color: "#fff",
              fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              padding: "4px 10px", borderRadius: "0 0 8px 8px",
              textTransform: "uppercase",
            }}>
              Recommended
            </div>
            <p style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", color: T.textMut, marginBottom: 12 }}>
              Pro
            </p>
            <p style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.04em", marginBottom: 4 }}>$7</p>
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 24 }}>per month</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
              {[
                "Unlimited games",
                "Easy + Medium + Hard problems",
                "Full game history & replay",
              ].map((f) => (
                <div key={f} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontSize: 13, color: T.green, fontWeight: 700 }}>✓</span>
                  <span style={{ fontSize: 13, color: T.text }}>{f}</span>
                </div>
              ))}
            </div>
            {loading ? (
              <div style={{ height: 40 }} />
            ) : !user ? (
              <a
                href="/auth"
                style={{
                  display: "block", padding: "10px 0", textAlign: "center",
                  background: T.text, color: "#fff",
                  borderRadius: 8, textDecoration: "none",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Sign in to upgrade
              </a>
            ) : isPro ? (
              <a
                href={portalUrl}
                style={{
                  display: "block", padding: "10px 0", textAlign: "center",
                  background: T.bgAlt, color: T.text,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8, textDecoration: "none",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Manage subscription →
              </a>
            ) : (
              <a
                href={upgradeUrl}
                style={{
                  display: "block", padding: "10px 0", textAlign: "center",
                  background: T.text, color: "#fff",
                  borderRadius: 8, textDecoration: "none",
                  fontSize: 13, fontWeight: 600,
                }}
              >
                Upgrade →
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
