"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPlayerId, supabase } from "@/lib/supabase";
import { createGame, joinGame } from "@/lib/game";
import { getProfile } from "@/lib/subscription";
import { joinQueue, cancelQueue } from "@/lib/matchmaking";

const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  bgDeep: "#e8e2d9",
  surface: "#ffffff",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  green: "#16a34a",
  red: "#dc2626",
};

export default function PlayPage() {
  const router = useRouter();
  const [isPro, setIsPro] = useState(false);
  const [elo, setElo] = useState(1200);
  const [userId, setUserId] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [timeLimit, setTimeLimit] = useState(180);
  const [difficulty, setDifficulty] = useState("easy");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchElapsed, setSearchElapsed] = useState(0);
  const [error, setError] = useState("");

  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const profile = await getProfile(data.user.id);
      setIsPro(profile.is_pro);
      setElo(profile.elo);
    });
    return () => {
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    };
  }, []);

  async function handleCreate() {
    setCreating(true); setError("");
    try {
      const id = await getPlayerId();
      if (!isPro) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const { count } = await supabase.from("games").select("id", { count: "exact", head: true })
          .eq("player_white", id).gte("created_at", today.toISOString());
        if ((count ?? 0) >= 5) { setError("5-game daily limit reached. Upgrade to Pro →"); setCreating(false); return; }
      }
      const game = await createGame(id, isPro ? timeLimit : 180, isPro ? difficulty : "easy");
      router.push(`/game/${game.id}?color=white`);
    } catch (e) { setError(e instanceof Error ? e.message : "Failed"); setCreating(false); }
  }

  async function handleJoin() {
    if (roomCode.length < 6) { setError("Enter a 6-character room code"); return; }
    setJoining(true); setError("");
    try {
      const game = await joinGame(roomCode, await getPlayerId());
      router.push(`/game/${game.id}?color=black`);
    } catch (e) { setError(e instanceof Error ? e.message : "Not found"); setJoining(false); }
  }

  async function handleFindOpponent() {
    setError(""); setSearching(true); setSearchElapsed(0);
    try {
      const id = await getPlayerId();
      const entryId = await joinQueue(id, elo);
      elapsedIntervalRef.current = setInterval(() => setSearchElapsed((s) => s + 1), 1000);
      searchIntervalRef.current = setInterval(async () => {
        try {
          const { data: own } = await supabase.from("matchmaking").select("status, game_id").eq("id", entryId).single();
          if (own?.status === "matched" && own.game_id) {
            clearAll();
            const { data: g } = await supabase.from("games").select("player_white").eq("id", own.game_id).single();
            router.push(`/game/${own.game_id}?color=${g?.player_white === id ? "white" : "black"}`);
            return;
          }
          const res = await fetch("/api/matchmaking", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: id, entryId, elo }),
          });
          const data = await res.json() as { matched: boolean; gameId?: string };
          if (data.matched && data.gameId) { clearAll(); router.push(`/game/${data.gameId}?color=black`); }
        } catch { /* keep polling */ }
      }, 2000);
    } catch (e) { setSearching(false); setError(e instanceof Error ? e.message : "Failed"); }
  }

  function clearAll() {
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    if (elapsedIntervalRef.current) clearInterval(elapsedIntervalRef.current);
    setSearching(false);
  }

  async function handleCancel() {
    clearAll(); setSearchElapsed(0);
    await cancelQueue(await getPlayerId()).catch(() => {});
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div style={{ padding: "44px 48px", maxWidth: 1000, width: "100%" }}>

      {/* Page header */}
      <div style={{ marginBottom: 36 }}>
        <p style={{
          fontSize: 11, color: T.textMut,
          fontFamily: "var(--font-geist-mono), monospace",
          letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 12,
        }}>
          Game modes
        </p>
        <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.04em", color: T.text, lineHeight: 1 }}>
          How do you want<br />
          <span style={{ color: T.textSec }}>to play today?</span>
        </h1>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>

        {/* ── VS FRIEND — large left card ── */}
        <div style={{
          gridRow: "1 / 3",
          background: T.surface,
          border: `1.5px solid ${T.border}`,
          borderRadius: 20,
          padding: 32,
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 2px 16px rgba(0,0,0,0.04)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
              color: T.textMut, fontFamily: "var(--font-geist-mono), monospace",
            }}>
              vs Friend
            </span>
            <span style={{ fontSize: 44, lineHeight: 1, opacity: 0.12 }}>♜</span>
          </div>

          <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.04em", color: T.text, lineHeight: 1.05, marginBottom: 10 }}>
            Challenge<br />a friend
          </h2>
          <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.65, marginBottom: 28 }}>
            Create a private room, share the code, and compete head-to-head.
          </p>

          {/* How it works — fills vertical space */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 28 }}>
            {[
              { n: "01", t: "Create a room", d: "Generates a 6-letter code" },
              { n: "02", t: "Share the code", d: "Send it to your opponent" },
              { n: "03", t: "Solve to move", d: "First to solve earns the move" },
            ].map(({ n, t, d }) => (
              <div key={n} style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "12px 14px", background: T.bg,
                borderRadius: 10, border: `1px solid ${T.border}`,
              }}>
                <span style={{
                  fontSize: 10, fontFamily: "var(--font-geist-mono), monospace",
                  color: T.textMut, letterSpacing: "0.06em", flexShrink: 0,
                }}>{n}</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>{t}</p>
                  <p style={{ fontSize: 11, color: T.textMut, margin: 0 }}>{d}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Pro settings */}
          {isPro && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 24 }}>
              <div>
                <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Difficulty</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["easy", "medium", "hard"] as const).map((d) => (
                    <button key={d} onClick={() => setDifficulty(d)} style={{
                      flex: 1, padding: "8px 0", fontSize: 11, fontWeight: 600, textTransform: "capitalize",
                      background: difficulty === d ? T.text : T.bg,
                      color: difficulty === d ? "#fff" : T.textSec,
                      border: `1.5px solid ${difficulty === d ? T.text : T.border}`,
                      borderRadius: 8, cursor: "pointer", fontFamily: "inherit",
                    }}>{d}</button>
                  ))}
                </div>
              </div>
              <div>
                <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 7 }}>Time per turn</p>
                <div style={{ display: "flex", gap: 6 }}>
                  {([60, 180, 300] as const).map((s) => (
                    <button key={s} onClick={() => setTimeLimit(s)} style={{
                      flex: 1, padding: "8px 0", fontSize: 11, fontWeight: 600,
                      background: timeLimit === s ? T.text : T.bg,
                      color: timeLimit === s ? "#fff" : T.textSec,
                      border: `1.5px solid ${timeLimit === s ? T.text : T.border}`,
                      borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-geist-mono), monospace",
                    }}>{s === 60 ? "1 min" : s === 180 ? "3 min" : "5 min"}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={handleCreate} disabled={creating} style={{
              padding: "14px", background: T.text, color: "#fff", border: "none",
              borderRadius: 12, fontSize: 14, fontWeight: 700,
              cursor: creating ? "wait" : "pointer", opacity: creating ? 0.7 : 1,
              fontFamily: "inherit", letterSpacing: "-0.01em",
            }}>
              {creating ? "Creating room…" : "Create Room →"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ flex: 1, height: 1, background: T.border }} />
              <span style={{ fontSize: 11, color: T.textMut }}>or join with a code</span>
              <div style={{ flex: 1, height: 1, background: T.border }} />
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="XXXXXX"
                maxLength={6}
                onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                style={{
                  flex: 1, padding: "12px 14px",
                  border: `1.5px solid ${T.border}`, borderRadius: 10,
                  fontSize: 15, fontFamily: "var(--font-geist-mono), monospace",
                  letterSpacing: "0.2em", fontWeight: 700,
                  background: T.bg, color: T.text, outline: "none",
                }}
              />
              <button onClick={handleJoin} disabled={joining} style={{
                padding: "12px 22px", background: T.bgAlt, color: T.text,
                border: `1.5px solid ${T.border}`, borderRadius: 10,
                fontSize: 13, fontWeight: 700, cursor: joining ? "wait" : "pointer",
                fontFamily: "inherit", whiteSpace: "nowrap",
              }}>
                {joining ? "…" : "Join"}
              </button>
            </div>
          </div>
        </div>

        {/* ── VS AI — top right ── */}
        <div style={{
          background: T.bgAlt,
          border: `1.5px solid ${T.border}`,
          borderRadius: 20, padding: 28,
          display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden",
          boxShadow: "0 2px 16px rgba(0,0,0,0.03)",
        }}>
          <span style={{
            position: "absolute", right: 16, top: 16,
            fontSize: 88, lineHeight: 1, opacity: 0.07, userSelect: "none",
          }}>♞</span>

          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", marginBottom: 12,
          }}>
            vs AI
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: T.text, lineHeight: 1.1, marginBottom: 8 }}>
            Play against<br />Stockfish
          </h2>
          <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6, marginBottom: 24 }}>
            No waiting. Practice your coding under pressure anytime.
          </p>

          <a href="/game/ai" style={{
            display: "block", padding: "13px", textAlign: "center",
            background: T.surface, color: T.text, border: `1.5px solid ${T.border}`,
            borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 700,
            marginTop: "auto", letterSpacing: "-0.01em",
          }}>
            Play now →
          </a>
        </div>

        {/* ── RANKED — bottom right ── */}
        <div style={{
          background: T.text,
          border: `1.5px solid ${T.text}`,
          borderRadius: 20, padding: 28,
          display: "flex", flexDirection: "column",
          position: "relative", overflow: "hidden",
          boxShadow: "0 4px 24px rgba(15,15,13,0.18)",
        }}>
          <span style={{
            position: "absolute", right: 16, bottom: 12,
            fontSize: 88, lineHeight: 1, opacity: 0.07,
            color: "#fff", userSelect: "none",
          }}>♛</span>

          <span style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase",
            color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-geist-mono), monospace", marginBottom: 12,
          }}>
            Ranked
          </span>
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.03em", color: "#fff", lineHeight: 1.1, marginBottom: 8 }}>
            Compete for<br />ELO rating
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 20 }}>
            Matched by skill. Win to climb, lose to fall.
          </p>

          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 9, padding: "10px 14px", marginBottom: 20, width: "fit-content",
          }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em" }}>YOUR ELO</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: "#fff", fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "-0.02em" }}>{elo}</span>
          </div>

          <div style={{ marginTop: "auto" }}>
            {searching ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{
                  padding: "12px 16px", background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Searching</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#fff", fontFamily: "var(--font-geist-mono), monospace" }}>
                      {fmtTime(searchElapsed)}
                    </span>
                    <div style={{ display: "flex", gap: 3 }}>
                      {[0, 1, 2].map((i) => (
                        <div key={i} style={{
                          width: 5, height: 5, borderRadius: "50%",
                          background: "rgba(255,255,255,0.35)",
                          animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
                <button onClick={handleCancel} style={{
                  padding: "11px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.55)",
                  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
                  fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={handleFindOpponent} style={{
                width: "100%", padding: "14px", background: "#fff", color: T.text,
                border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800,
                cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
              }}>
                Find Opponent →
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: T.red, marginTop: 16, fontWeight: 500 }}>{error}</p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
