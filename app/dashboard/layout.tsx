"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase, signOut } from "@/lib/supabase";
import { getProfile } from "@/lib/subscription";
import { useIsMobile } from "@/hooks/useIsMobile";
import type { User } from "@supabase/supabase-js";

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
  gold:         "#f59e0b",
};

const PIXEL = "var(--font-pixel), monospace";

const TIERS = [
  { name: "Pawn",   icon: "♟", min: 0    },
  { name: "Knight", icon: "♞", min: 1200 },
  { name: "Bishop", icon: "♝", min: 1400 },
  { name: "Rook",   icon: "♜", min: 1550 },
  { name: "Queen",  icon: "♛", min: 1700 },
  { name: "King",   icon: "♚", min: 1900 },
];
const PFP_MAP: Record<string, string> = {
  Pawn:   "/pawn.png",
  Knight: "/knight-pfp.png",
  Bishop: "/bishop-pfp.png",
  Rook:   "/rook.png",
  Queen:  "/queen.png",
  King:   "/mfking.png",
};
function getTier(elo: number) {
  return [...TIERS].reverse().find((t) => elo >= t.min) ?? TIERS[0];
}

const NAV = [
  { label: "DASHBOARD",   short: "PLAY",   href: "/dashboard/play",        icon: "⌂" },
  { label: "LEADERBOARD", short: "RANKS",  href: "/dashboard/leaderboard", icon: "♛" },
  { label: "PROFILE",     short: "ME",     href: "/dashboard/profile",     icon: "♟" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router   = useRouter();
  const [user, setUser]     = useState<User | null>(null);
  const [isPro, setIsPro]   = useState(false);
  const [elo, setElo]       = useState(1200);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.replace("/auth"); return; }
      setUser(data.user);
      const p = await getProfile(data.user.id);
      setIsPro(p.is_pro); setElo(p.elo);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) router.replace("/auth");
      else {
        setUser(session.user);
        getProfile(session.user.id).then((p) => { setIsPro(p.is_pro); setElo(p.elo); });
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split("@")[0]
    ?? "PLAYER";

  const tier    = getTier(elo);
  const pfp     = PFP_MAP[tier.name];
  const isMobile = useIsMobile();

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: T.bg,
      fontFamily: "var(--font-geist), system-ui, sans-serif",
      flexDirection: isMobile ? "column" : "row" }}>

      {/* ── Sidebar (desktop) ── */}
      <aside style={{
        width: 240,
        minHeight: "100vh",
        background: T.surface,
        borderRight: `1px solid ${T.border}`,
        display: isMobile ? "none" : "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        height: "100vh",
        overflow: "hidden",
        boxShadow: `4px 0 32px rgba(124,58,237,0.12)`,
      }}>

        {/* ── Logo ── */}
        <div style={{
          padding: "20px 20px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36,
            background: `${T.accent}30`,
            border: `2px solid ${T.accent}`,
            borderRadius: 6,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18,
          }}>
            ♛
          </div>
          <span style={{
            fontFamily: PIXEL,
            fontSize: 11,
            color: T.text,
            letterSpacing: "0.06em",
          }}>
            KNIGHTCODE
          </span>
        </div>

        {/* ── User card ── */}
        <div style={{
          margin: "16px 12px",
          padding: "14px",
          background: `${T.accent}12`,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* PFP */}
            <div style={{
              width: 56, height: 56,
              borderRadius: 6,
              border: `2px solid ${T.accent}60`,
              backgroundImage: pfp ? `url('${pfp}')` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center 20%",
              background: pfp ? undefined : T.surfaceAlt,
              flexShrink: 0,
              imageRendering: "pixelated",
            }} />
            <div style={{ minWidth: 0 }}>
              <p style={{
                margin: "0 0 3px",
                fontSize: 13, fontWeight: 600,
                color: T.text,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {displayName}
              </p>
              <p style={{
                margin: "0 0 4px",
                fontFamily: PIXEL, fontSize: 8,
                color: T.accentBright, letterSpacing: "0.06em",
              }}>
                {tier.icon} {tier.name.toUpperCase()}{isPro ? " · PRO" : ""}
              </p>
              <p style={{
                margin: 0,
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 12, color: T.gold, fontWeight: 700,
              }}>
                🏆 {elo} <span style={{ color: T.textMut, fontWeight: 400, fontSize: 11 }}>ELO</span>
              </p>
            </div>
          </div>
        </div>

        {/* ── Nav ── */}
        <nav style={{ flex: 1, padding: "4px 0", display: "flex", flexDirection: "column" }}>
          {NAV.map(({ label, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "13px 20px",
                  textDecoration: "none",
                  color: active ? T.text : T.textMut,
                  background: active ? T.surfaceAlt : "transparent",
                  borderLeft: active ? `3px solid ${T.accent}` : "3px solid transparent",
                  transition: "background 0.12s, color 0.12s",
                  fontFamily: PIXEL,
                  fontSize: 10,
                  letterSpacing: "0.06em",
                }}
              >
                <span style={{ fontSize: 16, lineHeight: 1, width: 20, textAlign: "center", flexShrink: 0 }}>
                  {icon}
                </span>
                {label}
              </a>
            );
          })}
        </nav>

        {/* ── Bottom: upgrade + log out ── */}
        <div style={{ padding: "12px", borderTop: `1px solid ${T.border}`, flexShrink: 0, display: "flex", flexDirection: "column", gap: 8 }}>
          {!isPro && (
            <a href="/pricing" style={{
              display: "block", padding: "9px 12px", textAlign: "center",
              background: `${T.accent}20`, border: `1px solid ${T.accent}50`,
              borderRadius: 6, textDecoration: "none",
              fontFamily: PIXEL, fontSize: 8, color: T.accentBright,
              letterSpacing: "0.06em",
            }}>
              ⚡ UPGRADE TO PRO
            </a>
          )}
          <button
            onClick={async () => { await signOut(); router.replace("/"); }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "11px 8px",
              background: "none", border: "none",
              cursor: "pointer", width: "100%",
              fontFamily: PIXEL, fontSize: 9,
              color: T.textMut, letterSpacing: "0.06em",
            }}
          >
            <span style={{ fontSize: 16 }}>⇥</span>
            LOG OUT
          </button>
        </div>
      </aside>

      {/* ── Mobile top bar ── */}
      {isMobile && (
        <header style={{
          height: 52, background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 16px", flexShrink: 0, position: "sticky", top: 0, zIndex: 20,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, background: `${T.accent}30`,
              border: `1.5px solid ${T.accent}`, borderRadius: 5,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>♛</div>
            <span style={{ fontFamily: PIXEL, fontSize: 9, color: T.text, letterSpacing: "0.06em" }}>
              KNIGHTCODE
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 12, color: T.gold, fontWeight: 700 }}>
              🏆 {elo}
            </span>
            {!isPro && (
              <a href="/pricing" style={{
                fontFamily: PIXEL, fontSize: 7, color: T.accentBright,
                background: `${T.accent}20`, border: `1px solid ${T.accent}50`,
                borderRadius: 4, padding: "3px 8px", textDecoration: "none",
                letterSpacing: "0.04em",
              }}>⚡ PRO</a>
            )}
          </div>
        </header>
      )}

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column",
        background: T.bg, paddingBottom: isMobile ? 64 : 0 }}>
        {children}
      </main>

      {/* ── Mobile bottom nav ── */}
      {isMobile && (
        <nav style={{
          position: "fixed", bottom: 0, left: 0, right: 0,
          height: 60, background: T.surface,
          borderTop: `1px solid ${T.border}`,
          display: "flex", alignItems: "stretch",
          zIndex: 20,
        }}>
          {NAV.map(({ short, href, icon }) => {
            const active = pathname === href || pathname.startsWith(href);
            return (
              <a key={href} href={href} style={{
                flex: 1, display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center", gap: 3,
                textDecoration: "none",
                color: active ? T.accentBright : T.textMut,
                background: active ? `${T.accent}12` : "transparent",
                borderTop: active ? `2px solid ${T.accent}` : "2px solid transparent",
              }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontFamily: PIXEL, fontSize: 6, letterSpacing: "0.02em" }}>{short}</span>
              </a>
            );
          })}
          <button onClick={async () => { await signOut(); router.replace("/"); }} style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", gap: 3,
            background: "none", border: "none", cursor: "pointer",
            color: T.textMut, borderTop: "2px solid transparent",
          }}>
            <span style={{ fontSize: 20 }}>⇥</span>
            <span style={{ fontFamily: PIXEL, fontSize: 6, letterSpacing: "0.02em" }}>OUT</span>
          </button>
        </nav>
      )}
    </div>
  );
}
