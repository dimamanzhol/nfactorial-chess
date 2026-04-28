"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
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
  green:        "#22c55e",
  red:          "#ef4444",
  gold:         "#f59e0b",
};

const PIXEL = "var(--font-pixel), monospace";
const MONO  = "var(--font-geist-mono), monospace";

const TIERS = [
  { name: "Pawn",   icon: "♟", min: 0,    max: 1199 },
  { name: "Knight", icon: "♞", min: 1200, max: 1399 },
  { name: "Bishop", icon: "♝", min: 1400, max: 1549 },
  { name: "Rook",   icon: "♜", min: 1550, max: 1699 },
  { name: "Queen",  icon: "♛", min: 1700, max: 1899 },
  { name: "King",   icon: "♚", min: 1900, max: 9999 },
];
const PFP_MAP: Record<string, string> = {
  Pawn:   "/pawn.png",
  Knight: "/knight-pfp.png",
  Bishop: "/bishop-pfp.png",
  Rook:   "/rook.png",
  Queen:  "/queen.png",
  King:   "/mfking.png",
};

interface Stats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  totalTurns: number;
  solvedTurns: number;
  avgSolveMs: number;
}

async function loadStats(userId: string): Promise<Stats> {
  const [gamesRes, turnsRes] = await Promise.all([
    supabase.from("games")
      .select("winner, player_white, player_black")
      .or(`player_white.eq.${userId},player_black.eq.${userId}`)
      .eq("status", "finished"),
    supabase.from("turns")
      .select("solved, time_taken_ms")
      .eq("player_id", userId),
  ]);
  const games = gamesRes.data ?? [];
  let wins = 0, losses = 0, draws = 0;
  for (const g of games) {
    const myColor = g.player_white === userId ? "white" : "black";
    if (g.winner === null || g.winner === "draw") draws++;
    else if (g.winner === myColor) wins++;
    else losses++;
  }
  const turns  = turnsRes.data ?? [];
  const solved = turns.filter((t) => t.solved);
  const avgMs  = solved.length
    ? solved.reduce((s, t) => s + (t.time_taken_ms ?? 0), 0) / solved.length : 0;
  return { totalGames: games.length, wins, losses, draws, totalTurns: turns.length, solvedTurns: solved.length, avgSolveMs: avgMs };
}

function fmtMs(ms: number) {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}
function pct(a: number, b: number) {
  return b ? `${Math.round((a / b) * 100)}%` : "—";
}

export default function ProfilePage() {
  const [user, setUser]   = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [elo, setElo]     = useState(1200);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUser(data.user);
      const [profile, statsData] = await Promise.all([
        getProfile(data.user.id),
        loadStats(data.user.id),
      ]);
      setIsPro(profile.is_pro);
      setElo(profile.elo);
      setStats(statsData);
      setLoading(false);
    });
  }, []);

  const displayName = (user?.user_metadata?.full_name as string | undefined)
    ?? user?.email?.split("@")[0] ?? "Player";

  const tier     = TIERS.find((t) => elo >= t.min && elo <= t.max) ?? TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const tierPct  = nextTier
    ? Math.round(((elo - tier.min) / (nextTier.min - tier.min)) * 100) : 100;

  const statCards = stats ? [
    { label: "GAMES",      value: String(stats.totalGames) },
    { label: "WIN RATE",   value: pct(stats.wins, stats.totalGames) },
    { label: "SOLVE RATE", value: pct(stats.solvedTurns, stats.totalTurns) },
    { label: "AVG SOLVE",  value: fmtMs(stats.avgSolveMs) },
  ] : [];

  if (loading) return (
    <div style={{ padding: "40px 44px", background: T.bg, minHeight: "100vh" }}>
      <p style={{ fontFamily: PIXEL, fontSize: 9, color: T.textMut, letterSpacing: "0.1em" }}>LOADING…</p>
    </div>
  );

  return (
    <div style={{ padding: isMobile ? "24px 16px" : "40px 44px", background: T.bg, minHeight: "100vh", maxWidth: 860 }}>

      {/* ── Hero card ── */}
      <div style={{
        background: T.surface,
        border: `2px solid ${T.accent}50`,
        borderRadius: 8,
        padding: "28px",
        display: "flex",
        alignItems: isMobile ? "flex-start" : "center",
        flexDirection: isMobile ? "column" : "row",
        gap: 24,
        marginBottom: 16,
        position: "relative",
        overflow: "hidden",
        boxShadow: `0 0 40px ${T.accent}15`,
      }}>
        {/* watermark */}
        <span style={{
          position: "absolute", right: 24, top: "50%",
          transform: "translateY(-50%)",
          fontSize: 110, lineHeight: 1, opacity: 0.04,
          color: T.accentBright, userSelect: "none", pointerEvents: "none",
        }}>
          {tier.icon}
        </span>

        {/* PFP */}
        <div style={{
          width: 80, height: 80, borderRadius: 8, flexShrink: 0,
          backgroundImage: `url('${PFP_MAP[tier.name]}')`,
          backgroundSize: "cover", backgroundPosition: "center 20%",
          border: `2px solid ${T.accent}60`,
          imageRendering: "pixelated",
          boxShadow: `0 0 20px ${T.accent}40`,
        }} />

        {/* name + tier + progress */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <p style={{ fontFamily: PIXEL, fontSize: 13, color: T.text, margin: 0, letterSpacing: "0.04em" }}>
              {displayName.toUpperCase()}
            </p>
            {isPro && (
              <span style={{
                fontFamily: PIXEL, fontSize: 7, color: T.green,
                background: `${T.green}18`, border: `1px solid ${T.green}40`,
                borderRadius: 4, padding: "2px 7px", letterSpacing: "0.08em",
              }}>PRO</span>
            )}
          </div>
          <p style={{ fontFamily: PIXEL, fontSize: 8, color: T.accentBright,
            letterSpacing: "0.06em", margin: "0 0 14px" }}>
            {tier.icon} {tier.name.toUpperCase()}
          </p>

          {/* progress bar */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              flex: 1, maxWidth: 200, height: 6, borderRadius: 3,
              background: T.border, overflow: "hidden",
            }}>
              <div style={{
                width: `${tierPct}%`, height: "100%", borderRadius: 3,
                background: `linear-gradient(90deg, ${T.accent}, ${T.accentBright})`,
              }} />
            </div>
            {nextTier && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{
                  width: 20, height: 20, borderRadius: 3,
                  backgroundImage: `url('${PFP_MAP[nextTier.name]}')`,
                  backgroundSize: "cover", backgroundPosition: "center 20%",
                  border: `1px solid ${T.border}`,
                  imageRendering: "pixelated",
                }} />
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.textMut }}>
                  {nextTier.min - elo} to {nextTier.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ELO */}
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
            letterSpacing: "0.12em", margin: "0 0 4px" }}>ELO</p>
          <p style={{ fontFamily: MONO, fontSize: 48, fontWeight: 800,
            color: T.gold, margin: 0, lineHeight: 1, letterSpacing: "-0.04em" }}>
            {elo}
          </p>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
        {statCards.map(({ label, value }) => (
          <div key={label} style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 8, padding: "18px 20px",
          }}>
            <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
              letterSpacing: "0.1em", margin: "0 0 10px" }}>{label}</p>
            <p style={{ fontFamily: MONO, fontSize: 26, fontWeight: 800,
              color: T.text, margin: 0, letterSpacing: "-0.03em" }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── W/L/D ── */}
      {stats && stats.totalGames > 0 && (
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 8, padding: "20px 24px", marginBottom: 16,
        }}>
          <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
            letterSpacing: "0.1em", margin: "0 0 14px" }}>RECORD</p>
          <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
            {[
              { label: "W", value: stats.wins,   color: T.green },
              { label: "L", value: stats.losses, color: T.red },
              { label: "D", value: stats.draws,  color: T.textMut },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                <span style={{ fontFamily: MONO, fontSize: 24, fontWeight: 800,
                  color, letterSpacing: "-0.03em" }}>{value}</span>
                <span style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut }}>{label}</span>
              </div>
            ))}
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.border,
              overflow: "hidden", display: "flex" }}>
              {stats.wins > 0 && <div style={{ width: `${(stats.wins / stats.totalGames) * 100}%`, background: T.green, height: "100%" }} />}
              {stats.draws > 0 && <div style={{ width: `${(stats.draws / stats.totalGames) * 100}%`, background: T.surfaceAlt, height: "100%" }} />}
              {stats.losses > 0 && <div style={{ width: `${(stats.losses / stats.totalGames) * 100}%`, background: T.red, height: "100%" }} />}
            </div>
          </div>
        </div>
      )}

      {/* ── Plan ── */}
      <div style={{
        background: isPro ? `${T.accent}18` : T.surface,
        border: `1.5px solid ${isPro ? T.accent : T.border}`,
        borderRadius: 8, padding: "20px 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
        boxShadow: isPro ? `0 0 24px ${T.accent}20` : "none",
      }}>
        <div>
          <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
            letterSpacing: "0.1em", margin: "0 0 6px" }}>PLAN</p>
          <p style={{ fontFamily: PIXEL, fontSize: 11, color: isPro ? T.accentBright : T.text,
            margin: "0 0 4px", letterSpacing: "0.04em" }}>
            {isPro ? "⚡ PRO" : "FREE"}
          </p>
          <p style={{ fontSize: 12, color: T.textMut, margin: 0 }}>
            {isPro ? "Unlimited games · All difficulties · JS + Python"
                   : "5 games/day · Easy only · Python only"}
          </p>
        </div>
        {isPro ? (
          <a href="/api/polar/portal" style={{
            padding: "10px 18px", borderRadius: 6, textDecoration: "none",
            fontFamily: PIXEL, fontSize: 8, color: T.accentBright,
            background: `${T.accent}20`, border: `1px solid ${T.accent}50`,
            whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.06em",
          }}>MANAGE →</a>
        ) : (
          <a href="/pricing" style={{
            padding: "10px 18px", borderRadius: 6, textDecoration: "none",
            fontFamily: PIXEL, fontSize: 8, color: "#fff",
            background: T.accent, border: "none",
            whiteSpace: "nowrap", flexShrink: 0, letterSpacing: "0.06em",
            boxShadow: `0 0 16px ${T.accent}60`,
          }}>UPGRADE →</a>
        )}
      </div>

    </div>
  );
}
