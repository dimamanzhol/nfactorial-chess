"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPlayerId, signOut, supabase } from "@/lib/supabase";
import { createGame, joinGame } from "@/lib/game";
import { getProfile } from "@/lib/subscription";
import { joinQueue, cancelQueue } from "@/lib/matchmaking";
import type { User } from "@supabase/supabase-js";

const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  dark: "#0f0f0d",
};

export default function HomePage() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [isPro, setIsPro] = useState(false);
  const [elo, setElo] = useState<number | null>(null);
  const [timeLimit, setTimeLimit] = useState(180);
  const [difficulty, setDifficulty] = useState("easy");
  const [searching, setSearching] = useState(false);
  const [searchElapsed, setSearchElapsed] = useState(0);
  const queueEntryIdRef = useRef<string | null>(null);
  const searchIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const searchElapsedIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const profile = await getProfile(data.user.id);
        setIsPro(profile.is_pro);
        setElo(profile.elo);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then((p) => { setIsPro(p.is_pro); setElo(p.elo); });
      } else {
        setIsPro(false);
        setElo(null);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Cleanup matchmaking intervals on unmount
  useEffect(() => {
    return () => {
      if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
      if (searchElapsedIntervalRef.current) clearInterval(searchElapsedIntervalRef.current);
    };
  }, []);

  async function handleCreate() {
    setCreating(true);
    setError("");
    try {
      const userId = await getPlayerId();
      if (!isPro) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const { count } = await supabase
          .from("games")
          .select("id", { count: "exact", head: true })
          .eq("player_white", userId)
          .gte("created_at", today.toISOString());
        if ((count ?? 0) >= 5) {
          setError("5-game daily limit reached. Upgrade to Pro →");
          setCreating(false);
          return;
        }
      }
      const game = await createGame(userId, isPro ? timeLimit : 180, isPro ? difficulty : "easy");
      router.push(`/game/${game.id}?color=white`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create game");
      setCreating(false);
    }
  }

  async function handleJoin() {
    if (roomCode.length < 6) { setError("Enter a 6-character room code"); return; }
    setJoining(true);
    setError("");
    try {
      const game = await joinGame(roomCode, await getPlayerId());
      router.push(`/game/${game.id}?color=black`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Game not found");
      setJoining(false);
    }
  }

  async function handleFindOpponent() {
    setError("");
    setSearching(true);
    setSearchElapsed(0);
    try {
      const userId = await getPlayerId();
      const playerElo = elo ?? 1200;
      const entryId = await joinQueue(userId, playerElo);
      queueEntryIdRef.current = entryId;

      // Elapsed timer
      searchElapsedIntervalRef.current = setInterval(() => {
        setSearchElapsed((s) => s + 1);
      }, 1000);

      // Poll every 2s: first check if own entry is already matched (handles being the "white" player),
      // then try to match against another waiting player (handles being the "black" player).
      searchIntervalRef.current = setInterval(async () => {
        try {
          // 1. Check own entry — covers the case where the opponent matched us first
          const { data: ownEntry } = await supabase
            .from("matchmaking")
            .select("status, game_id")
            .eq("id", entryId)
            .single();

          if (ownEntry?.status === "matched" && ownEntry.game_id) {
            clearInterval(searchIntervalRef.current!);
            clearInterval(searchElapsedIntervalRef.current!);
            setSearching(false);
            const { data: gameRow } = await supabase
              .from("games")
              .select("player_white")
              .eq("id", ownEntry.game_id)
              .single();
            const color = gameRow?.player_white === userId ? "white" : "black";
            router.push(`/game/${ownEntry.game_id}?color=${color}`);
            return;
          }

          // 2. Try to match against a waiting opponent
          const res = await fetch("/api/matchmaking", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ playerId: userId, entryId, elo: playerElo }),
          });
          const data = await res.json() as { matched: boolean; gameId?: string };
          if (data.matched && data.gameId) {
            clearInterval(searchIntervalRef.current!);
            clearInterval(searchElapsedIntervalRef.current!);
            setSearching(false);
            router.push(`/game/${data.gameId}?color=black`);
          }
        } catch { /* keep polling */ }
      }, 2000);

      // Also subscribe via Realtime for instant notification
      const channel = supabase
        .channel(`matchmaking:${entryId}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matchmaking", filter: `id=eq.${entryId}` },
          async (payload) => {
            const row = payload.new as { status: string; game_id: string | null };
            if (row.status === "matched" && row.game_id) {
              clearInterval(searchIntervalRef.current!);
              clearInterval(searchElapsedIntervalRef.current!);
              supabase.removeChannel(channel);
              setSearching(false);
              // Determine color by checking whether we are white or black in the game
              const { data: gameRow } = await supabase
                .from("games")
                .select("player_white")
                .eq("id", row.game_id)
                .single();
              const color = gameRow?.player_white === userId ? "white" : "black";
              router.push(`/game/${row.game_id}?color=${color}`);
            }
          })
        .subscribe();
    } catch (e) {
      setSearching(false);
      setError(e instanceof Error ? e.message : "Failed to join queue");
    }
  }

  async function handleCancelSearch() {
    if (searchIntervalRef.current) clearInterval(searchIntervalRef.current);
    if (searchElapsedIntervalRef.current) clearInterval(searchElapsedIntervalRef.current);
    setSearching(false);
    setSearchElapsed(0);
    try {
      const userId = await getPlayerId();
      await cancelQueue(userId);
    } catch { /* ignore */ }
    queueEntryIdRef.current = null;
  }

  async function handleSignOut() {
    await signOut();
    router.refresh();
  }

  return (
    <div style={{ background: T.bg, minHeight: "100vh", fontFamily: "var(--font-geist), system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{
        borderBottom: `1px solid ${T.border}`,
        padding: "0 40px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: T.bg,
        zIndex: 10,
      }}>
        <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: "-0.02em", color: T.text }}>
          KnightCode
        </span>
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <a
              href="/history"
              style={{ fontSize: 13, color: T.textSec, textDecoration: "none" }}
            >
              History
            </a>
            {!isPro && (
              <a
                href="/pricing"
                style={{ fontSize: 12, color: "#16a34a", fontWeight: 700, textDecoration: "none", border: "1px solid #16a34a30", borderRadius: 6, padding: "3px 8px" }}
              >
                Pro →
              </a>
            )}
            {elo !== null && (
              <span style={{
                fontSize: 12, color: T.textSec,
                fontFamily: "var(--font-geist-mono), monospace",
                border: `1px solid ${T.border}`, borderRadius: 6, padding: "3px 8px",
              }}>
                {elo} ELO
              </span>
            )}
            <span style={{ fontSize: 13, color: T.textSec }}>{user.email}</span>
            <button
              onClick={handleSignOut}
              style={{
                fontSize: 13,
                color: T.textSec,
                background: "none",
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: "5px 12px",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Sign out
            </button>
          </div>
        ) : (
          <a
            href="/auth"
            style={{ fontSize: 13, color: T.textSec, textDecoration: "none" }}
          >
            Sign in →
          </a>
        )}
      </nav>

      {/* Hero */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "80px 40px 64px" }}>
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: T.textMut,
          marginBottom: 20,
        }}>
          Chess meets LeetCode
        </p>

        <h1 style={{
          fontSize: "clamp(40px, 6vw, 72px)",
          fontWeight: 800,
          letterSpacing: "-0.04em",
          lineHeight: 1.0,
          color: T.text,
          marginBottom: 24,
        }}>
          Earn your move.<br />
          <span style={{ color: T.textSec }}>Solve to play.</span>
        </h1>

        <p style={{
          fontSize: 18,
          color: T.textSec,
          lineHeight: 1.6,
          maxWidth: 540,
          marginBottom: 48,
        }}>
          Two players. One chess board. To make any move, you must first solve a coding problem.
          Faster solver earns the move. Fail in 3 minutes — turn skipped.
        </p>

        {/* CTA Box */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 420 }}>
          {/* Play vs AI — primary CTA */}
          <a
            href="/game/ai"
            style={{
              display: "block",
              padding: "14px 24px",
              background: T.dark,
              color: "#fff",
              border: "none",
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              textDecoration: "none",
              textAlign: "center",
            }}
          >
            Play vs AI →
          </a>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 12, color: T.textMut }}>or play with a friend</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {isPro && (
            <div>
              <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                Problem difficulty
              </p>
              <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    style={{
                      flex: 1, padding: "8px 0",
                      background: difficulty === d ? T.dark : T.bgAlt,
                      color: difficulty === d ? "#fff" : T.textSec,
                      border: `1.5px solid ${difficulty === d ? T.dark : T.border}`,
                      borderRadius: 8, fontSize: 12, fontWeight: 600,
                      cursor: "pointer", fontFamily: "inherit",
                      textTransform: "capitalize",
                    }}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          )}

          {isPro && (
            <div>
              <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
                Time per turn
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                {([60, 180, 300] as const).map((secs) => (
                  <button
                    key={secs}
                    onClick={() => setTimeLimit(secs)}
                    style={{
                      flex: 1, padding: "8px 0",
                      background: timeLimit === secs ? T.dark : T.bgAlt,
                      color: timeLimit === secs ? "#fff" : T.textSec,
                      border: `1.5px solid ${timeLimit === secs ? T.dark : T.border}`,
                      borderRadius: 8, fontSize: 13, fontWeight: 600,
                      cursor: "pointer", fontFamily: "var(--font-geist-mono), monospace",
                    }}
                  >
                    {secs === 60 ? "1 min" : secs === 180 ? "3 min" : "5 min"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleCreate}
            disabled={creating}
            style={{
              padding: "12px 24px",
              background: T.bgAlt,
              color: T.text,
              border: `1.5px solid ${T.border}`,
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 600,
              cursor: creating ? "wait" : "pointer",
              opacity: creating ? 0.7 : 1,
              letterSpacing: "-0.01em",
              fontFamily: "inherit",
            }}
          >
            {creating ? "Creating room…" : "Create Game"}
          </button>

          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
              placeholder="ROOM CODE"
              maxLength={6}
              style={{
                flex: 1,
                padding: "12px 16px",
                border: `1.5px solid ${T.border}`,
                borderRadius: 10,
                fontSize: 15,
                fontFamily: "var(--font-geist-mono), monospace",
                letterSpacing: "0.1em",
                background: T.bg,
                color: T.text,
                outline: "none",
              }}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
            />
            <button
              onClick={handleJoin}
              disabled={joining}
              style={{
                padding: "12px 20px",
                background: T.bgAlt,
                color: T.text,
                border: `1.5px solid ${T.border}`,
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: joining ? "wait" : "pointer",
                opacity: joining ? 0.7 : 1,
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {joining ? "Joining…" : "Join Game"}
            </button>
          </div>

          {/* Ranked matchmaking divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: T.border }} />
            <span style={{ fontSize: 12, color: T.textMut }}>or play ranked</span>
            <div style={{ flex: 1, height: 1, background: T.border }} />
          </div>

          {searching ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{
                padding: "14px 20px",
                background: T.bgAlt,
                border: `1.5px solid ${T.border}`,
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 14, color: T.text, fontWeight: 600 }}>
                  Searching… {Math.floor(searchElapsed / 60)}:{(searchElapsed % 60).toString().padStart(2, "0")}
                </span>
                <span style={{ fontSize: 12, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace" }}>
                  {elo ?? 1200} ELO
                </span>
              </div>
              <button
                onClick={handleCancelSearch}
                style={{
                  padding: "10px 24px",
                  background: "transparent",
                  color: T.textSec,
                  border: `1.5px solid ${T.border}`,
                  borderRadius: 10,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={handleFindOpponent}
              disabled={!user}
              style={{
                padding: "12px 24px",
                background: T.bgAlt,
                color: user ? T.text : T.textMut,
                border: `1.5px solid ${T.border}`,
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 600,
                cursor: user ? "pointer" : "not-allowed",
                letterSpacing: "-0.01em",
                fontFamily: "inherit",
              }}
            >
              {user ? "Find Opponent (Ranked)" : "Sign in to play ranked"}
            </button>
          )}

          {error && (
            <p style={{ fontSize: 13, color: "#ef4444", margin: 0 }}>{error}</p>
          )}
        </div>
      </div>

      {/* How it works */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "64px 40px", maxWidth: 860, margin: "0 auto" }}>
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: T.textMut,
          marginBottom: 40,
        }}>
          How it works
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 32 }}>
          {[
            { n: "01", title: "Pick your move", body: "Select a chess piece and choose where to move it on the board." },
            { n: "02", title: "Solve to unlock", body: "A coding problem appears. Solve it in 3 minutes to execute your move." },
            { n: "03", title: "Earn the position", body: "Faster coding wins better positions. Checkmate wins the game." },
          ].map((s) => (
            <div key={s.n}>
              <p style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 11, color: T.textMut, letterSpacing: "0.08em", marginBottom: 12 }}>
                {s.n}
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 8, letterSpacing: "-0.01em" }}>
                {s.title}
              </p>
              <p style={{ fontSize: 14, color: T.textSec, lineHeight: 1.55, margin: 0 }}>
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Features grid */}
      <div style={{ borderTop: `1px solid ${T.border}`, padding: "64px 40px 80px", maxWidth: 860, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
          {[
            { label: "Real chess rules", desc: "Full FIDE-compliant moves — castling, en passant, promotion." },
            { label: "Coding problems", desc: "Easy to hard LeetCode-style problems. Currently supports JavaScript." },
            { label: "3-minute timer", desc: "Fail to solve in time and your turn is automatically skipped." },
            { label: "Persistent accounts", desc: "Sign up to track games and play with friends reliably." },
          ].map((f) => (
            <div key={f.label} style={{
              padding: "20px",
              border: `1px solid ${T.border}`,
              borderRadius: 10,
            }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4, letterSpacing: "-0.01em" }}>
                {f.label}
              </p>
              <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5, margin: 0 }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${T.border}`,
        padding: "28px 40px",
        display: "flex",
        justifyContent: "space-between",
        maxWidth: 860,
        margin: "0 auto",
      }}>
        <span style={{ fontSize: 13, color: T.textMut }}>KnightCode — Chess × Code</span>
        <span style={{ fontSize: 13, color: T.textMut }}>Built with Next.js + Supabase</span>
      </div>
    </div>
  );
}
