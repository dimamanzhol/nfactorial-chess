"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { getUserGames, type GameSummary } from "@/lib/history";
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
  red: "#dc2626",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth");
        return;
      }
      setUser(data.user);
      getUserGames(data.user.id)
        .then(setGames)
        .finally(() => setLoading(false));
    });
  }, [router]);

  function getResult(game: GameSummary, userId: string) {
    if (!game.winner) return "draw";
    const myColor = game.player_white === userId ? "white" : "black";
    return game.winner === myColor ? "win" : "loss";
  }

  function getMyColor(game: GameSummary, userId: string) {
    return game.player_white === userId ? "white" : "black";
  }

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
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase",
          color: T.textMut, marginBottom: 16,
        }}>
          Game History
        </p>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 32 }}>
          Your finished games
        </h1>

        {loading ? (
          <p style={{ fontSize: 14, color: T.textMut }}>Loading…</p>
        ) : games.length === 0 ? (
          <div style={{
            padding: "48px 24px", textAlign: "center",
            border: `1px solid ${T.border}`, borderRadius: 12,
          }}>
            <p style={{ fontSize: 15, color: T.textSec, marginBottom: 8 }}>No finished games yet.</p>
            <a href="/" style={{ fontSize: 13, color: T.text, fontWeight: 600, textDecoration: "none" }}>
              Play a game →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {games.map((game) => {
              const userId = user!.id;
              const result = getResult(game, userId);
              const myColor = getMyColor(game, userId);
              return (
                <div
                  key={game.id}
                  style={{
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 12, padding: "16px 20px",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  {/* Left: date + color */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                      background: myColor === "white" ? "#fff" : T.text,
                      border: `1.5px solid ${T.border}`,
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 2 }}>
                        {formatDate(game.created_at)}
                      </p>
                      <p style={{
                        fontSize: 11, color: T.textMut,
                        fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em",
                      }}>
                        {game.room_code} · {game.turn_count} turn{game.turn_count !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Right: result badge + link */}
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
                      textTransform: "uppercase", padding: "4px 10px", borderRadius: 6,
                      background: result === "win" ? `${T.green}15` : result === "loss" ? `${T.red}15` : `${T.textMut}15`,
                      color: result === "win" ? T.green : result === "loss" ? T.red : T.textMut,
                    }}>
                      {result === "win" ? "Win" : result === "loss" ? "Loss" : "Draw"}
                    </span>
                    <a
                      href={`/history/${game.id}`}
                      style={{
                        fontSize: 13, color: T.text, fontWeight: 600,
                        textDecoration: "none", whiteSpace: "nowrap",
                      }}
                    >
                      View replay →
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
