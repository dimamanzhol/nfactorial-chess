"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const T = {
  bg: "#f7f3ee",
  surface: "#ffffff",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  green: "#16a34a",
};

const PFP_MAP: Record<string, string> = {
  Pawn:   "/pawn.png",
  Knight: "/knight-pfp.png",
  Bishop: "/bishop-pfp.png",
  Rook:   "/rook.png",
  Queen:  "/queen.png",
  King:   "/mfking.png",
};

const TIERS = [
  { name: "Pawn",   icon: "♟", min: 0    },
  { name: "Knight", icon: "♞", min: 1200 },
  { name: "Bishop", icon: "♝", min: 1400 },
  { name: "Rook",   icon: "♜", min: 1550 },
  { name: "Queen",  icon: "♛", min: 1700 },
  { name: "King",   icon: "♚", min: 1900 },
];

function getTier(elo: number) {
  return [...TIERS].reverse().find((t) => elo >= t.min) ?? TIERS[0];
}

interface Row {
  id: string;
  email: string;
  full_name: string | null;
  elo: number;
  is_pro: boolean;
}

export default function LeaderboardPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
    supabase.rpc("get_leaderboard").then(({ data }) => {
      setRows((data as Row[]) ?? []);
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ padding: "44px 48px", maxWidth: 720, width: "100%" }}>
      <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
        Leaderboard
      </p>
      <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em", color: T.text, marginBottom: 28 }}>
        Top Players
      </h1>

      {loading ? (
        <p style={{ fontSize: 13, color: T.textMut }}>Loading…</p>
      ) : (
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, overflow: "hidden" }}>
          {rows.map((row, i) => {
            const tier = getTier(row.elo);
            const name = row.full_name ?? row.email.split("@")[0];
            const isMe = row.id === myId;

            return (
              <div
                key={row.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  padding: "14px 20px",
                  borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : "none",
                  background: isMe ? "#f7f3ee" : "transparent",
                }}
              >
                {/* Rank */}
                <span style={{
                  width: 28, textAlign: "center", flexShrink: 0,
                  fontSize: i < 3 ? 16 : 12,
                  fontWeight: 700,
                  color: i === 0 ? "#b45309" : i === 1 ? T.textSec : i === 2 ? "#92400e" : T.textMut,
                  fontFamily: "var(--font-geist-mono), monospace",
                }}>
                  {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}`}
                </span>

                {/* Avatar */}
                {PFP_MAP[tier.name] ? (
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    backgroundImage: `url('${PFP_MAP[tier.name]}')`,
                    backgroundSize: "cover",
                    backgroundPosition: "center 30%",
                    border: `1.5px solid ${T.border}`,
                  }} />
                ) : (
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%", flexShrink: 0,
                    background: isMe ? T.text : "#efebe4",
                    border: `1.5px solid ${T.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700,
                    color: isMe ? "#fff" : T.text,
                  }}>
                    {name[0]?.toUpperCase()}
                  </div>
                )}

                {/* Name */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: isMe ? 700 : 500, color: T.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name} {isMe && <span style={{ fontSize: 10, color: T.textMut }}>(you)</span>}
                  </p>
                  <p style={{ fontSize: 11, color: T.textMut, margin: 0, fontFamily: "var(--font-geist-mono), monospace" }}>
                    {tier.icon} {tier.name}
                  </p>
                </div>

                {/* Pro badge */}
                {row.is_pro && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 4,
                    background: `${T.green}18`, color: T.green,
                    fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em",
                  }}>PRO</span>
                )}

                {/* ELO */}
                <span style={{
                  fontSize: 15, fontWeight: 800, color: T.text,
                  fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "-0.03em",
                  flexShrink: 0,
                }}>
                  {row.elo}
                </span>
              </div>
            );
          })}

          {rows.length === 0 && (
            <p style={{ padding: "32px 24px", fontSize: 13, color: T.textMut, textAlign: "center", margin: 0 }}>
              No players yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
