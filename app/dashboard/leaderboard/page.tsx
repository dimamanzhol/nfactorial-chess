"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  gold:         "#f59e0b",
  goldDim:      "#92400e",
};

const PIXEL = "var(--font-pixel), monospace";
const MONO  = "var(--font-geist-mono), monospace";

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

/* rank medal colours */
const MEDAL = [
  { bg: "#ca8a0420", border: "#ca8a04", color: "#fbbf24", label: "🥇" },
  { bg: "#9ca3af20", border: "#9ca3af", color: "#e5e7eb", label: "🥈" },
  { bg: "#b4530920", border: "#b45309", color: "#fb923c", label: "🥉" },
];

interface Row {
  id: string;
  email: string;
  full_name: string | null;
  elo: number;
  is_pro: boolean;
}

export default function LeaderboardPage() {
  const [rows, setRows]     = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId]     = useState<string | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data.user?.id ?? null));
    supabase.rpc("get_leaderboard").then(({ data }) => {
      setRows((data as Row[]) ?? []);
      setLoading(false);
    });
  }, []);

  const top3   = rows.slice(0, 3);
  const rest   = rows.slice(3);

  return (
    <div style={{ padding: isMobile ? "24px 16px" : "40px 44px", background: T.bg, minHeight: "100vh" }}>

      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontFamily: PIXEL, fontSize: 9, color: T.textMut,
          letterSpacing: "0.12em", margin: "0 0 8px" }}>
          RANKINGS
        </p>
        <h1 style={{ fontFamily: PIXEL, fontSize: 22, color: T.text,
          letterSpacing: "0.04em", margin: 0, lineHeight: 1.3 }}>
          TOP PLAYERS
        </h1>
      </div>

      {loading ? (
        <p style={{ fontFamily: PIXEL, fontSize: 9, color: T.textMut, letterSpacing: "0.1em" }}>
          LOADING…
        </p>
      ) : (
        <>
          {/* ── Top 3 podium cards ── */}
          {top3.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
              {top3.map((row, i) => {
                const tier  = getTier(row.elo);
                const name  = row.full_name ?? row.email.split("@")[0];
                const isMe  = row.id === myId;
                const medal = MEDAL[i];

                return (
                  <div key={row.id} style={{
                    background: T.surface,
                    border: `2px solid ${medal.border}40`,
                    borderRadius: 8,
                    padding: "20px 16px",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
                    boxShadow: `0 0 24px ${medal.border}18`,
                    position: "relative",
                  }}>
                    {/* rank badge */}
                    <div style={{
                      position: "absolute", top: -1, right: 12,
                      fontFamily: PIXEL, fontSize: 8, color: medal.color,
                      background: medal.bg, border: `1px solid ${medal.border}60`,
                      borderRadius: "0 0 6px 6px", padding: "3px 8px",
                      letterSpacing: "0.06em",
                    }}>
                      #{i + 1}
                    </div>

                    {/* avatar */}
                    <div style={{
                      width: 64, height: 64, borderRadius: 6,
                      backgroundImage: `url('${PFP_MAP[tier.name]}')`,
                      backgroundSize: "cover", backgroundPosition: "center 20%",
                      border: `2px solid ${medal.border}60`,
                      imageRendering: "pixelated",
                      flexShrink: 0,
                    }} />

                    {/* medal emoji */}
                    <span style={{ fontSize: 22, lineHeight: 1 }}>{medal.label}</span>

                    {/* name */}
                    <p style={{
                      fontFamily: PIXEL, fontSize: 9, color: isMe ? T.accentBright : T.text,
                      letterSpacing: "0.05em", margin: 0, textAlign: "center",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}>
                      {name}{isMe ? " (YOU)" : ""}
                    </p>

                    {/* tier */}
                    <p style={{
                      fontFamily: PIXEL, fontSize: 7, color: T.accentBright,
                      letterSpacing: "0.06em", margin: 0,
                    }}>
                      {tier.icon} {tier.name.toUpperCase()}
                    </p>

                    {/* elo */}
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ fontSize: 13 }}>🏆</span>
                      <span style={{
                        fontFamily: MONO, fontSize: 16, fontWeight: 800,
                        color: medal.color, letterSpacing: "-0.02em",
                      }}>
                        {row.elo}
                      </span>
                    </div>

                    {/* pro badge */}
                    {row.is_pro && (
                      <span style={{
                        fontFamily: PIXEL, fontSize: 7, color: T.green,
                        background: `${T.green}18`, border: `1px solid ${T.green}40`,
                        borderRadius: 4, padding: "2px 8px", letterSpacing: "0.08em",
                      }}>PRO</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Rest of leaderboard table ── */}
          {rest.length > 0 && (
            <div style={{
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 8,
              overflow: "hidden",
            }}>
              {/* table header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "48px 48px 1fr auto auto",
                gap: 0,
                padding: "10px 20px",
                borderBottom: `1px solid ${T.border}`,
                background: T.surfaceAlt,
              }}>
                {["RANK", "", "PLAYER", "", "ELO"].map((h, i) => (
                  <span key={i} style={{
                    fontFamily: PIXEL, fontSize: 7, color: T.textMut,
                    letterSpacing: "0.1em",
                    textAlign: i === 4 ? "right" : "left",
                  }}>{h}</span>
                ))}
              </div>

              {rest.map((row, idx) => {
                const i    = idx + 3;
                const tier = getTier(row.elo);
                const name = row.full_name ?? row.email.split("@")[0];
                const isMe = row.id === myId;

                return (
                  <div key={row.id} style={{
                    display: "grid",
                    gridTemplateColumns: "48px 48px 1fr auto auto",
                    alignItems: "center",
                    padding: "12px 20px",
                    borderBottom: idx < rest.length - 1 ? `1px solid ${T.border}` : "none",
                    background: isMe ? `${T.accent}10` : "transparent",
                    borderLeft: isMe ? `3px solid ${T.accent}` : "3px solid transparent",
                  }}>
                    {/* rank */}
                    <span style={{
                      fontFamily: MONO, fontSize: 13, fontWeight: 700,
                      color: T.textMut,
                    }}>
                      {i + 1}
                    </span>

                    {/* avatar */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 4,
                      backgroundImage: `url('${PFP_MAP[tier.name]}')`,
                      backgroundSize: "cover", backgroundPosition: "center 20%",
                      border: `1px solid ${T.border}`,
                      imageRendering: "pixelated",
                    }} />

                    {/* name + tier */}
                    <div style={{ minWidth: 0, paddingLeft: 12 }}>
                      <p style={{
                        margin: 0, fontSize: 13, fontWeight: isMe ? 700 : 500,
                        color: isMe ? T.accentBright : T.text,
                        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                      }}>
                        {name}{isMe ? " (you)" : ""}
                      </p>
                      <p style={{
                        margin: 0, fontFamily: PIXEL, fontSize: 7,
                        color: T.textMut, letterSpacing: "0.05em", marginTop: 2,
                      }}>
                        {tier.icon} {tier.name.toUpperCase()}
                      </p>
                    </div>

                    {/* pro */}
                    <div style={{ paddingRight: 16 }}>
                      {row.is_pro && (
                        <span style={{
                          fontFamily: PIXEL, fontSize: 7, color: T.green,
                          background: `${T.green}18`, border: `1px solid ${T.green}40`,
                          borderRadius: 4, padding: "2px 6px", letterSpacing: "0.08em",
                        }}>PRO</span>
                      )}
                    </div>

                    {/* elo */}
                    <span style={{
                      fontFamily: MONO, fontSize: 15, fontWeight: 800,
                      color: T.gold, letterSpacing: "-0.02em",
                      textAlign: "right",
                    }}>
                      {row.elo}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {rows.length === 0 && (
            <p style={{ fontFamily: PIXEL, fontSize: 9, color: T.textMut,
              letterSpacing: "0.1em", textAlign: "center", marginTop: 60 }}>
              NO PLAYERS YET
            </p>
          )}
        </>
      )}
    </div>
  );
}
