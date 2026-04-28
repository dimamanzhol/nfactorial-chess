"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPlayerId, supabase } from "@/lib/supabase";
import { createGame, joinGame } from "@/lib/game";
import { getProfile } from "@/lib/subscription";
import { joinQueue, cancelQueue } from "@/lib/matchmaking";
import { useIsMobile } from "@/hooks/useIsMobile";

const T = {
  bg:           "#0d0a1a",
  surface:      "#13102a",
  border:       "#2d2250",
  accent:       "#7c3aed",
  accentBright: "#a78bfa",
  text:         "#e8e0f5",
  textSec:      "#a89cc8",
  textMut:      "#5e4f8a",
  green:        "#22c55e",
  greenDark:    "#14532d",
  greenBorder:  "#166534",
  gold:         "#ca8a04",
  goldBright:   "#f59e0b",
  goldDark:     "#451a03",
  goldBorder:   "#92400e",
  red:          "#ef4444",
};

const PIXEL = "var(--font-pixel), monospace";
const MONO  = "var(--font-geist-mono), monospace";

export default function PlayPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [displayName, setDisplayName] = useState("PLAYER");
  const [isPro, setIsPro]       = useState(false);
  const [elo, setElo]           = useState(1200);
  const [userId, setUserId]     = useState("");

  /* friend card state */
  const [friendOpen, setFriendOpen] = useState(false);
  const [roomCode, setRoomCode]     = useState("");
  const [timeLimit, setTimeLimit]   = useState(180);
  const [difficulty, setDifficulty] = useState("easy");
  const [creating, setCreating]     = useState(false);
  const [joining, setJoining]       = useState(false);

  /* ranked state */
  const [searching, setSearching]       = useState(false);
  const [searchElapsed, setSearchElapsed] = useState(0);

  const [error, setError] = useState("");

  const searchRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const name = (data.user.user_metadata?.full_name as string | undefined)
        ?? data.user.email?.split("@")[0]
        ?? "PLAYER";
      setDisplayName(name.toUpperCase());
      const profile = await getProfile(data.user.id);
      setIsPro(profile.is_pro);
      setElo(profile.elo);
    });
    return () => {
      if (searchRef.current)  clearInterval(searchRef.current);
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  /* ── handlers ── */
  async function handleCreate() {
    setCreating(true); setError("");
    try {
      const id = await getPlayerId();
      if (!isPro) {
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const { count } = await supabase.from("games")
          .select("id", { count: "exact", head: true })
          .eq("player_white", id).gte("created_at", today.toISOString());
        if ((count ?? 0) >= 5) {
          setError("5-game daily limit reached. Upgrade to Pro →");
          setCreating(false); return;
        }
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
      const id   = await getPlayerId();
      const entryId = await joinQueue(id, elo);
      elapsedRef.current = setInterval(() => setSearchElapsed((s) => s + 1), 1000);
      searchRef.current  = setInterval(async () => {
        try {
          const { data: own } = await supabase.from("matchmaking")
            .select("status, game_id").eq("id", entryId).single();
          if (own?.status === "matched" && own.game_id) {
            clearAll();
            const { data: g } = await supabase.from("games")
              .select("player_white").eq("id", own.game_id).single();
            router.push(`/game/${own.game_id}?color=${g?.player_white === id ? "white" : "black"}`);
            return;
          }
          const res  = await fetch("/api/matchmaking", {
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
    if (searchRef.current)  clearInterval(searchRef.current);
    if (elapsedRef.current) clearInterval(elapsedRef.current);
    setSearching(false);
  }

  async function handleCancel() {
    clearAll(); setSearchElapsed(0);
    await cancelQueue(await getPlayerId()).catch(() => {});
  }

  const fmtTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  /* ── shared pixel-btn style ── */
  function pixelBtn(bg: string, hover?: string): React.CSSProperties {
    return {
      width: "100%", padding: "14px 20px",
      background: bg, color: "#fff",
      border: "none", borderRadius: 4,
      fontSize: 13, fontWeight: 700,
      fontFamily: PIXEL, letterSpacing: "0.06em",
      cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      imageRendering: "pixelated",
    };
  }

  return (
    <div style={{ padding: isMobile ? "24px 16px" : "40px 44px", background: T.bg, minHeight: "100vh" }}>

      {/* ── Welcome header ── */}
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, color: T.textSec, margin: "0 0 6px",
          fontFamily: MONO, letterSpacing: "0.1em" }}>
          WELCOME BACK,{" "}
          <span style={{ color: T.accentBright }}>{displayName}</span>{" "}👋
        </p>
        <h1 style={{ margin: 0, lineHeight: 1.1 }}>
          <span style={{ fontFamily: PIXEL, fontSize: 28, color: T.text, display: "block", marginBottom: 4 }}>
            How do you want
          </span>
          <span style={{ fontFamily: PIXEL, fontSize: 28, color: T.accentBright }}>
            to play today?
          </span>
        </h1>
      </div>

      {/* ── 3 game mode cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* ── VS AI ── */}
        <div style={{
          background: "#110d24",
          border: `2px solid ${T.accent}60`,
          borderRadius: 8,
          padding: "28px 24px 24px",
          display: "flex", flexDirection: "column", alignItems: "center",
          boxShadow: `0 0 40px ${T.accent}20, inset 0 0 40px ${T.accent}08`,
          position: "relative", overflow: "hidden",
        }}>
          {/* purple sparkles */}
          {["12% 15%","80% 20%","20% 75%"].map((pos, i) => (
            <div key={i} style={{
              position: "absolute", left: pos.split(" ")[0], top: pos.split(" ")[1],
              width: 4, height: 4, background: T.accentBright, borderRadius: 0,
              opacity: 0.6, imageRendering: "pixelated",
            }} />
          ))}

          {/* piece art */}
          <div style={{
            width: 140, height: 140,
            backgroundImage: "url('/mfking.png')",
            backgroundSize: "contain", backgroundRepeat: "no-repeat",
            backgroundPosition: "center bottom",
            imageRendering: "pixelated",
            marginBottom: 16,
            filter: `drop-shadow(0 0 24px ${T.accent}90)`,
          }} />

          <p style={{ fontFamily: PIXEL, fontSize: 14, color: T.text,
            letterSpacing: "0.06em", margin: "0 0 10px", textAlign: "center" }}>
            PLAY VS AI
          </p>
          <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6,
            textAlign: "center", margin: 0 }}>
            Challenge the engine.<br />Solve problems and make<br />your moves.
          </p>

          <div style={{ marginTop: "auto", width: "100%", paddingTop: 20 }}>
            <a href="/game/ai" style={{
              ...pixelBtn(T.accent),
              textDecoration: "none",
              boxShadow: `0 0 16px ${T.accent}80`,
              borderRadius: 4,
            }}>
              <span>PLAY NOW</span>
              <span style={{ fontSize: 16 }}>›</span>
            </a>
          </div>
        </div>

        {/* ── VS FRIEND ── */}
        <div style={{
          background: "#0c1a0f",
          border: `2px solid ${T.greenBorder}`,
          borderRadius: 8,
          padding: "28px 24px 24px",
          display: "flex", flexDirection: "column", alignItems: "center",
          boxShadow: `0 0 40px ${T.green}10, inset 0 0 40px ${T.green}05`,
          position: "relative", overflow: "hidden",
        }}>
          {/* piece art — two knights */}
          <div style={{
            width: 160, height: 140,
            backgroundImage: "url('/knight-pfp.png')",
            backgroundSize: "contain", backgroundRepeat: "no-repeat",
            backgroundPosition: "center bottom",
            imageRendering: "pixelated",
            marginBottom: 16,
            filter: `drop-shadow(0 0 20px ${T.green}60)`,
          }} />

          <p style={{ fontFamily: PIXEL, fontSize: 14, color: T.text,
            letterSpacing: "0.06em", margin: "0 0 10px", textAlign: "center" }}>
            PLAY WITH FRIEND
          </p>
          <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6,
            textAlign: "center", margin: 0 }}>
            Create a room or join<br />your friend using<br />a room code.
          </p>

          <div style={{ marginTop: "auto", width: "100%", paddingTop: 20 }}>
          {!friendOpen ? (
            <button
              onClick={() => setFriendOpen(true)}
              style={{
                ...pixelBtn("#15803d"),
                boxShadow: `0 0 16px ${T.green}50`,
              }}
            >
              <span>CREATE / JOIN ROOM</span>
              <span style={{ fontSize: 16 }}>›</span>
            </button>
          ) : (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Pro settings */}
              {isPro && (
                <>
                  <div style={{ display: "flex", gap: 4 }}>
                    {(["easy","medium","hard"] as const).map((d) => (
                      <button key={d} onClick={() => setDifficulty(d)} style={{
                        flex: 1, padding: "6px 0", fontSize: 9, fontWeight: 700,
                        fontFamily: PIXEL, letterSpacing: "0.04em", cursor: "pointer",
                        background: difficulty === d ? "#15803d" : "#0c1a0f",
                        color: difficulty === d ? "#fff" : T.textMut,
                        border: `1.5px solid ${difficulty === d ? T.green : T.greenBorder}`,
                        borderRadius: 4, textTransform: "capitalize",
                      }}>{d}</button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    {([60,180,300] as const).map((s) => (
                      <button key={s} onClick={() => setTimeLimit(s)} style={{
                        flex: 1, padding: "6px 0", fontSize: 9, fontWeight: 700,
                        fontFamily: PIXEL, cursor: "pointer",
                        background: timeLimit === s ? "#15803d" : "#0c1a0f",
                        color: timeLimit === s ? "#fff" : T.textMut,
                        border: `1.5px solid ${timeLimit === s ? T.green : T.greenBorder}`,
                        borderRadius: 4,
                      }}>{s === 60 ? "1m" : s === 180 ? "3m" : "5m"}</button>
                    ))}
                  </div>
                </>
              )}

              <button onClick={handleCreate} disabled={creating} style={{
                ...pixelBtn("#15803d"),
                justifyContent: "center", gap: 8,
                opacity: creating ? 0.7 : 1, cursor: creating ? "wait" : "pointer",
              }}>
                {creating ? "CREATING…" : "CREATE ROOM"}
              </button>

              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase().slice(0, 6))}
                  placeholder="XXXXXX"
                  maxLength={6}
                  onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                  style={{
                    flex: 1, padding: "10px 12px",
                    background: "#0a1a0c", border: `1.5px solid ${T.greenBorder}`,
                    borderRadius: 4, fontSize: 14, fontFamily: MONO,
                    letterSpacing: "0.18em", fontWeight: 700,
                    color: T.text, outline: "none",
                  }}
                />
                <button onClick={handleJoin} disabled={joining} style={{
                  padding: "10px 14px", background: "#15803d", color: "#fff",
                  border: "none", borderRadius: 4, fontSize: 11,
                  fontFamily: PIXEL, cursor: joining ? "wait" : "pointer",
                  whiteSpace: "nowrap",
                }}>
                  {joining ? "…" : "JOIN"}
                </button>
              </div>

              <button onClick={() => setFriendOpen(false)} style={{
                background: "none", border: "none", color: T.textMut,
                fontSize: 11, cursor: "pointer", fontFamily: MONO,
                textAlign: "center", padding: "4px 0",
              }}>
                ← back
              </button>
            </div>
          )}
          </div>
        </div>

        {/* ── RANKED ARENA ── */}
        <div style={{
          background: "#1a1100",
          border: `2px solid ${T.goldBorder}`,
          borderRadius: 8,
          padding: "28px 24px 24px",
          display: "flex", flexDirection: "column", alignItems: "center",
          boxShadow: `0 0 40px ${T.goldBright}10, inset 0 0 40px ${T.gold}05`,
          position: "relative", overflow: "hidden",
        }}>
          {/* piece art + ELO overlay */}
          <div style={{ position: "relative", width: 140, height: 140, marginBottom: 16 }}>
            <div style={{
              width: 140, height: 140,
              backgroundImage: "url('/queen.png')",
              backgroundSize: "contain", backgroundRepeat: "no-repeat",
              backgroundPosition: "center bottom",
              imageRendering: "pixelated",
              filter: `drop-shadow(0 0 24px ${T.gold}90)`,
            }} />
            {/* ELO badge overlay */}
            <div style={{
              position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)",
              display: "flex", alignItems: "center", gap: 5,
              background: "#1a1100", border: `1px solid ${T.goldBorder}`,
              borderRadius: 4, padding: "4px 10px", whiteSpace: "nowrap",
              boxShadow: `0 0 8px ${T.gold}60`,
            }}>
              <span style={{ fontSize: 11 }}>🏆</span>
              <span style={{ fontFamily: PIXEL, fontSize: 9, color: T.goldBright, letterSpacing: "0.04em" }}>
                {elo} ELO
              </span>
            </div>
          </div>

          <p style={{ fontFamily: PIXEL, fontSize: 14, color: T.text,
            letterSpacing: "0.06em", margin: "0 0 10px", textAlign: "center" }}>
            RANKED ARENA
          </p>
          <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.6,
            textAlign: "center", margin: 0 }}>
            Compete with the best<br />coders. Climb the<br />leaderboard.
          </p>

          <div style={{ marginTop: "auto", width: "100%", paddingTop: 20, display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>

          {searching ? (
            <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                padding: "12px 16px", background: `${T.gold}15`,
                border: `1px solid ${T.goldBorder}`, borderRadius: 4,
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 11, color: T.textSec, fontFamily: PIXEL, letterSpacing: "0.05em" }}>SEARCHING</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: T.goldBright, fontFamily: MONO }}>
                    {fmtTime(searchElapsed)}
                  </span>
                  <div style={{ display: "flex", gap: 3 }}>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{
                        width: 4, height: 4,
                        background: T.goldBright,
                        animation: `pulse 1.2s ${i * 0.2}s ease-in-out infinite`,
                      }} />
                    ))}
                  </div>
                </div>
              </div>
              <button onClick={handleCancel} style={{
                ...pixelBtn(`${T.gold}30`),
                justifyContent: "center",
                color: T.goldBright, border: `1px solid ${T.goldBorder}`,
                fontSize: 11,
              }}>
                CANCEL
              </button>
            </div>
          ) : (
            <button onClick={handleFindOpponent} style={{
              ...pixelBtn(T.gold),
              boxShadow: `0 0 16px ${T.gold}60`,
            }}>
              <span>PLAY RANKED</span>
              <span style={{ fontSize: 16 }}>›</span>
            </button>
          )}
          </div>
        </div>
      </div>

      {/* ── Daily Quest bar ── */}
      <div style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 8,
        padding: "18px 20px",
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        gap: isMobile ? 12 : 20,
      }}>
        {/* top row: icon + title + progress */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, width: "100%", flex: 1, minWidth: 0 }}>
          <div style={{
            width: 44, height: 44, flexShrink: 0,
            backgroundImage: "url('/pawn.png')",
            backgroundSize: "contain", backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
            imageRendering: "pixelated",
            opacity: 0.85,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontFamily: PIXEL, fontSize: 9, color: T.accentBright,
              letterSpacing: "0.1em", margin: "0 0 5px" }}>
              DAILY QUEST
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <p style={{ fontSize: 13, color: T.text, margin: 0, fontWeight: 500 }}>
                Win 2 games today
              </p>
              <span style={{ fontSize: 12, color: T.accentBright, fontFamily: MONO, fontWeight: 700 }}>
                1 / 2
              </span>
            </div>
            <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: T.border, overflow: "hidden" }}>
              <div style={{
                width: "50%", height: "100%",
                background: `linear-gradient(90deg, ${T.accent}, ${T.accentBright})`,
                borderRadius: 2,
              }} />
            </div>
          </div>
        </div>

        {/* reward + button row */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: 12, flexShrink: 0,
          width: isMobile ? "100%" : "auto",
          justifyContent: isMobile ? "space-between" : "flex-end",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 11, color: T.textMut, fontFamily: MONO, letterSpacing: "0.06em" }}>REWARD:</span>
            <span style={{ fontSize: 13, color: T.accentBright, fontWeight: 700, fontFamily: MONO }}>💎 150</span>
            <span style={{ fontSize: 13, color: T.goldBright, fontWeight: 700, fontFamily: MONO }}>⚡ 300 XP</span>
          </div>
          <button style={{
            padding: "9px 14px",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 4, color: T.text,
            fontFamily: PIXEL, fontSize: 8,
            letterSpacing: "0.06em", cursor: "pointer",
            whiteSpace: "nowrap",
          }}>
            VIEW QUESTS ›
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, color: T.red, marginTop: 14, fontWeight: 500 }}>{error}</p>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1;   transform: scale(1.2); }
        }
        input::placeholder { color: #5e4f8a; letter-spacing: 0.18em; }
      `}</style>
    </div>
  );
}
