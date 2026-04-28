"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/lib/subscription";
import { getUserGames } from "@/lib/history";
import type { User } from "@supabase/supabase-js";
import type { GameSummary } from "@/lib/history";

const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  bgDeep: "#ddd8cf",
  surface: "#ffffff",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  green: "#16a34a",
  red: "#dc2626",
  yellow: "#b45309",
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
    supabase
      .from("games")
      .select("winner, player_white, player_black")
      .or(`player_white.eq.${userId},player_black.eq.${userId}`)
      .eq("status", "finished"),
    supabase
      .from("turns")
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

  const turns = turnsRes.data ?? [];
  const solved = turns.filter((t) => t.solved);
  const avgMs = solved.length
    ? solved.reduce((sum, t) => sum + (t.time_taken_ms ?? 0), 0) / solved.length
    : 0;

  return {
    totalGames: games.length,
    wins,
    losses,
    draws,
    totalTurns: turns.length,
    solvedTurns: solved.length,
    avgSolveMs: avgMs,
  };
}

function fmtMs(ms: number): string {
  if (!ms) return "—";
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function pct(a: number, b: number): string {
  if (!b) return "—";
  return `${Math.round((a / b) * 100)}%`;
}

function GameRow({ game, userId }: { game: GameSummary; userId: string }) {
  const myColor = game.player_white === userId ? "white" : "black";
  let result: "win" | "loss" | "draw";
  if (game.winner === null || game.winner === "draw") result = "draw";
  else if (game.winner === myColor) result = "win";
  else result = "loss";

  const resultColor = result === "win" ? T.green : result === "loss" ? T.red : T.textMut;
  const resultLabel = result === "win" ? "Win" : result === "loss" ? "Loss" : "Draw";

  const date = new Date(game.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <a
      href={`/history/${game.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "12px 16px",
        borderRadius: 10,
        border: `1px solid ${T.border}`,
        background: T.surface,
        textDecoration: "none",
        transition: "background 0.1s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{
          fontSize: 11, fontWeight: 700, padding: "3px 8px",
          borderRadius: 6, background: `${resultColor}15`, color: resultColor,
          fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.04em",
        }}>
          {resultLabel}
        </span>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, margin: 0 }}>
            {game.is_ranked ? "Ranked" : "Casual"} · {myColor}
          </p>
          <p style={{ fontSize: 11, color: T.textMut, margin: 0, fontFamily: "var(--font-geist-mono), monospace" }}>
            {game.difficulty} · {game.turn_count} turns
          </p>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <p style={{ fontSize: 12, color: T.textMut, margin: 0, fontFamily: "var(--font-geist-mono), monospace" }}>
          {date}
        </p>
        <p style={{ fontSize: 11, color: T.textMut, margin: 0 }}>
          {game.room_code}
        </p>
      </div>
    </a>
  );
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [elo, setElo] = useState(1200);
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentGames, setRecentGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const u = data.user;
      setUser(u);

      const [profile, statsData, games] = await Promise.all([
        getProfile(u.id),
        loadStats(u.id),
        getUserGames(u.id),
      ]);

      setIsPro(profile.is_pro);
      setElo(profile.elo);
      setStats(statsData);
      setRecentGames(games.slice(0, 5));
      setLoading(false);
    });
  }, []);

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ??
    user?.email?.split("@")[0] ??
    "Player";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  const statCards = stats
    ? [
        { label: "Games played", value: String(stats.totalGames) },
        { label: "Win rate", value: pct(stats.wins, stats.totalGames) },
        { label: "Solve rate", value: pct(stats.solvedTurns, stats.totalTurns) },
        { label: "Avg solve time", value: fmtMs(stats.avgSolveMs) },
      ]
    : [];

  // Rank tier based on ELO
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
  const tier = TIERS.find((t) => elo >= t.min && elo <= t.max) ?? TIERS[0];
  const nextTier = TIERS[TIERS.indexOf(tier) + 1];
  const tierPct = nextTier
    ? Math.round(((elo - tier.min) / (nextTier.min - tier.min)) * 100)
    : 100;

  return (
    <div style={{ padding: "44px 48px", maxWidth: 860, width: "100%" }}>

      {loading ? (
        <p style={{ fontSize: 13, color: T.textMut }}>Loading…</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {/* ── Hero card ── */}
          <div style={{
            background: T.text,
            borderRadius: 20,
            padding: "32px 36px",
            display: "flex",
            alignItems: "center",
            gap: 32,
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 4px 24px rgba(15,15,13,0.15)",
          }}>
            {/* Watermark */}
            <span style={{
              position: "absolute", right: 28, top: "50%",
              transform: "translateY(-50%)",
              fontSize: 120, lineHeight: 1, opacity: 0.06,
              color: "#fff", userSelect: "none", pointerEvents: "none",
            }}>
              {tier.icon}
            </span>

            {/* Avatar */}
            {PFP_MAP[tier.name] ? (
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                border: "2px solid rgba(255,255,255,0.15)",
                backgroundImage: `url('${PFP_MAP[tier.name]}')`,
                backgroundSize: "cover",
                backgroundPosition: "center 30%",
                flexShrink: 0,
              }} />
            ) : (
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                border: "2px solid rgba(255,255,255,0.15)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 800, color: "#fff", flexShrink: 0,
              }}>
                {initial}
              </div>
            )}

            {/* Name + rank */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <p style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0, letterSpacing: "-0.03em" }}>
                  {displayName}
                </p>
                {isPro && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                    background: `${T.green}30`, color: T.green,
                    fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em",
                  }}>PRO</span>
                )}
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", margin: "0 0 16px" }}>
                {user?.email}
              </p>

              {/* Rank + progress */}
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.9)",
                  fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em",
                }}>
                  {tier.icon} {tier.name.toUpperCase()}
                </span>
                <div style={{ flex: 1, maxWidth: 160, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                  <div style={{ width: `${tierPct}%`, height: "100%", background: "rgba(255,255,255,0.5)", borderRadius: 2 }} />
                </div>
                {nextTier && (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {PFP_MAP[nextTier.name] && (
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        backgroundImage: `url('${PFP_MAP[nextTier.name]}')`,
                        backgroundSize: "cover",
                        backgroundPosition: "center 30%",
                        border: "1.5px solid rgba(255,255,255,0.2)",
                        flexShrink: 0,
                      }} />
                    )}
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-geist-mono), monospace" }}>
                      {nextTier.min - elo} to {nextTier.name}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ELO — hero number */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 6px" }}>
                ELO
              </p>
              <p style={{ fontSize: 52, fontWeight: 800, letterSpacing: "-0.05em", color: "#fff", margin: 0, fontFamily: "var(--font-geist-mono), monospace", lineHeight: 1 }}>
                {elo}
              </p>
            </div>
          </div>

          {/* ── Stats row ── */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {statCards.map(({ label, value }) => (
              <div key={label} style={{
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 14, padding: "18px 20px",
                boxShadow: "0 1px 8px rgba(0,0,0,0.03)",
              }}>
                <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px" }}>
                  {label}
                </p>
                <p style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em", color: T.text, margin: 0, fontFamily: "var(--font-geist-mono), monospace" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {/* ── W/L/D bar ── */}
          {stats && stats.totalGames > 0 && (
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 14, padding: "20px 24px",
            }}>
              <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 16px" }}>
                Record
              </p>
              <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
                {[
                  { label: "W", value: stats.wins, color: T.green },
                  { label: "L", value: stats.losses, color: T.red },
                  { label: "D", value: stats.draws, color: T.textMut },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
                    <span style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "-0.03em" }}>{value}</span>
                    <span style={{ fontSize: 11, color: T.textMut }}>{label}</span>
                  </div>
                ))}
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: T.bgAlt, overflow: "hidden", display: "flex" }}>
                  {stats.wins > 0 && <div style={{ width: `${(stats.wins / stats.totalGames) * 100}%`, background: T.green, height: "100%" }} />}
                  {stats.draws > 0 && <div style={{ width: `${(stats.draws / stats.totalGames) * 100}%`, background: T.bgDeep, height: "100%" }} />}
                  {stats.losses > 0 && <div style={{ width: `${(stats.losses / stats.totalGames) * 100}%`, background: T.red, height: "100%" }} />}
                </div>
              </div>
            </div>
          )}

          {/* ── Subscription ── */}
          <div style={{
            background: isPro ? T.text : T.surface,
            border: `1.5px solid ${isPro ? T.text : T.border}`,
            borderRadius: 14, padding: "20px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16,
          }}>
            <div>
              <p style={{ fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 5px", color: isPro ? "rgba(255,255,255,0.4)" : T.textMut }}>
                Plan
              </p>
              <p style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: isPro ? "#fff" : T.text, margin: "0 0 3px" }}>
                {isPro ? "Pro" : "Free"}
              </p>
              <p style={{ fontSize: 12, color: isPro ? "rgba(255,255,255,0.4)" : T.textMut, margin: 0 }}>
                {isPro ? "Unlimited games · All difficulties · JS + Python" : "5 games/day · Easy only · Python only"}
              </p>
            </div>
            {isPro ? (
              <a href="/api/polar/portal" style={{ padding: "9px 16px", borderRadius: 9, textDecoration: "none", fontSize: 12, fontWeight: 600, background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.15)", whiteSpace: "nowrap", flexShrink: 0 }}>
                Manage →
              </a>
            ) : (
              <a href="/pricing" style={{ padding: "9px 16px", borderRadius: 9, textDecoration: "none", fontSize: 12, fontWeight: 700, background: T.text, color: "#fff", border: "none", whiteSpace: "nowrap", flexShrink: 0 }}>
                Upgrade →
              </a>
            )}
          </div>

          {/* ── Recent games ── */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", margin: 0 }}>
                Recent games
              </p>
              <a href="/history" style={{ fontSize: 12, color: T.textSec, textDecoration: "none" }}>View all →</a>
            </div>
            {recentGames.length === 0 ? (
              <div style={{ padding: "28px 24px", textAlign: "center", border: `1px dashed ${T.border}`, borderRadius: 12 }}>
                <p style={{ fontSize: 13, color: T.textMut, margin: 0 }}>
                  No games yet — <a href="/dashboard/play" style={{ color: T.text, fontWeight: 600, textDecoration: "none" }}>go play</a>
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {recentGames.map((g) => <GameRow key={g.id} game={g} userId={user?.id ?? ""} />)}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
