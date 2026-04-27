"use client";

import { useEffect, useState, use } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { supabase } from "@/lib/supabase";
import { getGameWithTurns, type TurnWithProblem } from "@/lib/history";
import type { Game } from "@/types";

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
  yellow: "#b45309",
};

const DIFF_COLOR: Record<string, string> = {
  easy: T.green,
  medium: T.yellow,
  hard: T.red,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatMs(ms: number | null) {
  if (!ms) return "—";
  const s = Math.floor(ms / 1000);
  return `${Math.floor(s / 60)}m ${s % 60}s`;
}

function fenAtTurn(turns: TurnWithProblem[], upToIndex: number): string {
  const chess = new Chess();
  for (let i = 0; i <= upToIndex; i++) {
    const t = turns[i];
    if (t.move_made) {
      try { chess.move(t.move_made); } catch { /**/ }
    }
  }
  return chess.fen();
}

export default function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: gameId } = use(params);
  const [game, setGame] = useState<Game | null>(null);
  const [turns, setTurns] = useState<TurnWithProblem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<Record<number, boolean>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    getGameWithTurns(gameId)
      .then(({ game, turns }) => {
        setGame(game);
        setTurns(turns);
        setSelectedIdx(turns.length > 0 ? turns.length - 1 : -1);
      })
      .finally(() => setLoading(false));
  }, [gameId]);

  const fen = selectedIdx >= 0 ? fenAtTurn(turns, selectedIdx) : new Chess().fen();

  function getResult() {
    if (!game || !userId) return null;
    if (!game.winner) return "draw";
    const myColor = game.player_white === userId ? "white" : "black";
    return game.winner === myColor ? "win" : "loss";
  }

  const result = getResult();

  if (loading) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: T.textMut, fontFamily: "var(--font-geist), sans-serif" }}>Loading replay…</p>
      </div>
    );
  }

  if (!game) {
    return (
      <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: T.textMut, fontFamily: "var(--font-geist), sans-serif" }}>Game not found.</p>
      </div>
    );
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "var(--font-geist), system-ui, sans-serif", color: T.text, display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{
        height: 52, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", background: T.bg, flexShrink: 0,
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.03em", color: T.text, textDecoration: "none" }}>
          KnightCode
        </a>
        <a href="/history" style={{ fontSize: 13, color: T.textMut, textDecoration: "none" }}>← History</a>
      </nav>

      {/* Game header */}
      <div style={{
        borderBottom: `1px solid ${T.border}`, padding: "16px 28px",
        display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap",
      }}>
        <span style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 18, fontWeight: 800, letterSpacing: "0.1em", color: T.text,
        }}>
          {game.room_code}
        </span>
        <span style={{ fontSize: 13, color: T.textMut }}>{formatDate(game.created_at)}</span>
        {result && (
          <span style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "4px 10px", borderRadius: 6,
            background: result === "win" ? `${T.green}15` : result === "loss" ? `${T.red}15` : `${T.textMut}15`,
            color: result === "win" ? T.green : result === "loss" ? T.red : T.textMut,
          }}>
            {result === "win" ? "Win" : result === "loss" ? "Loss" : "Draw"}
          </span>
        )}
        <span style={{ fontSize: 13, color: T.textMut }}>{turns.length} turn{turns.length !== 1 ? "s" : ""}</span>
      </div>

      {/* Body: two columns */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: board */}
        <div style={{
          flex: "0 0 auto", display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "32px 24px", gap: 16,
        }}>
          <div style={{ boxShadow: "0 1px 24px rgba(0,0,0,0.06)" }}>
            <Chessboard
              options={{
                position: fen,
                allowDragging: false,
                boardStyle: { width: 420, height: 420, borderRadius: 10 },
                lightSquareStyle: { backgroundColor: "#f0d9b5" },
                darkSquareStyle: { backgroundColor: "#b58863" },
              }}
            />
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setSelectedIdx((i) => Math.max(0, i - 1))}
              disabled={selectedIdx <= 0}
              style={{
                padding: "8px 16px", border: `1px solid ${T.border}`, borderRadius: 8,
                background: T.bgAlt, color: T.text, fontSize: 13, cursor: selectedIdx <= 0 ? "default" : "pointer",
                opacity: selectedIdx <= 0 ? 0.4 : 1, fontFamily: "inherit",
              }}
            >
              ← Prev
            </button>
            <span style={{ fontSize: 13, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace" }}>
              Turn {selectedIdx >= 0 ? selectedIdx + 1 : 0} of {turns.length}
            </span>
            <button
              onClick={() => setSelectedIdx((i) => Math.min(turns.length - 1, i + 1))}
              disabled={selectedIdx >= turns.length - 1}
              style={{
                padding: "8px 16px", border: `1px solid ${T.border}`, borderRadius: 8,
                background: T.bgAlt, color: T.text, fontSize: 13, cursor: selectedIdx >= turns.length - 1 ? "default" : "pointer",
                opacity: selectedIdx >= turns.length - 1 ? 0.4 : 1, fontFamily: "inherit",
              }}
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right: turn list */}
        <div style={{
          flex: 1, borderLeft: `1px solid ${T.border}`,
          overflowY: "auto", padding: "16px",
        }}>
          {turns.length === 0 ? (
            <p style={{ fontSize: 14, color: T.textMut, padding: "16px 8px" }}>No turns recorded for this game.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {turns.map((turn, idx) => {
                const isSelected = idx === selectedIdx;
                const prob = turn.problems;
                const isExpanded = expandedCode[idx] ?? false;
                return (
                  <div
                    key={turn.id}
                    onClick={() => setSelectedIdx(idx)}
                    style={{
                      background: isSelected ? T.bgAlt : T.surface,
                      border: `1px solid ${isSelected ? T.text + "30" : T.border}`,
                      borderRadius: 10, padding: "12px 14px",
                      cursor: "pointer", transition: "background 0.1s",
                    }}
                  >
                    {/* Turn header */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{
                        fontFamily: "var(--font-geist-mono), monospace",
                        fontSize: 10, color: T.textMut, letterSpacing: "0.06em",
                      }}>
                        {idx + 1}
                      </span>
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                        background: turn.player_color === "white" ? "#fff" : T.text,
                        border: `1.5px solid ${T.border}`,
                      }} />
                      <span style={{ fontSize: 12, color: T.textSec, fontWeight: 500 }}>
                        {turn.player_color}
                      </span>
                    </div>

                    {/* Problem info */}
                    {prob && (
                      <div style={{ marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>
                            {prob.title}
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", padding: "2px 6px", borderRadius: 4,
                            background: `${DIFF_COLOR[prob.difficulty] ?? T.textMut}18`,
                            color: DIFF_COLOR[prob.difficulty] ?? T.textMut,
                          }}>
                            {prob.difficulty}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Result row */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600,
                          color: turn.solved ? T.green : T.red,
                        }}>
                          {turn.solved ? `✓ Solved` : "✗ Skipped"}
                        </span>
                        {turn.time_taken_ms != null && (
                          <span style={{
                            fontSize: 11, color: T.textMut,
                            fontFamily: "var(--font-geist-mono), monospace",
                          }}>
                            {formatMs(turn.time_taken_ms)}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {turn.move_made ? (
                          <span style={{
                            fontFamily: "var(--font-geist-mono), monospace",
                            fontSize: 12, fontWeight: 700, color: T.text,
                            padding: "2px 8px", background: T.bgAlt,
                            borderRadius: 4, border: `1px solid ${T.border}`,
                          }}>
                            {turn.move_made}
                          </span>
                        ) : (
                          <span style={{
                            fontFamily: "var(--font-geist-mono), monospace",
                            fontSize: 12, color: T.textMut,
                          }}>
                            —
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Code toggle */}
                    {turn.code_submitted && (
                      <div style={{ marginTop: 8 }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedCode((prev) => ({ ...prev, [idx]: !prev[idx] }));
                          }}
                          style={{
                            fontSize: 11, color: T.textMut, background: "none",
                            border: "none", cursor: "pointer", padding: 0,
                            fontFamily: "var(--font-geist-mono), monospace",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {isExpanded ? "▲ hide code" : "▼ show code"}
                        </button>
                        {isExpanded && (
                          <pre style={{
                            marginTop: 8, padding: "10px 12px",
                            background: T.bgAlt, border: `1px solid ${T.border}`,
                            borderRadius: 6, fontSize: 11, lineHeight: 1.6,
                            color: T.text, overflow: "auto", maxHeight: 200,
                            fontFamily: "var(--font-geist-mono), monospace",
                          }}>
                            {turn.code_submitted}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
