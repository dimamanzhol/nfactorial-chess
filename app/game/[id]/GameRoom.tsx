"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Chess, type Square } from "chess.js";
import PixelChessBoard from "@/components/PixelChessBoard";
import { supabase } from "@/lib/supabase";
import { getRandomProblem, submitMove, skipTurn, runPyTests, runJSTests, recordTurn, createGame } from "@/lib/game";
import { getPlayerId } from "@/lib/supabase";
import type { Game, Problem, Color } from "@/types";
import CodeEditor from "@/components/CodeEditor";

// ─── Design tokens ────────────────────────────────────────────────────────
const T = {
  bg:          "#0d0a1a",
  surface:     "#160f2e",
  surfaceAlt:  "#1f1640",
  border:      "#2d2250",
  accent:      "#7c3aed",
  accentBright:"#a78bfa",
  gold:        "#f59e0b",
  text:        "#e8e0f5",
  textSec:     "#a89cc8",
  textMut:     "#5e4f8a",
  green:       "#22c55e",
  red:         "#ef4444",
  yellow:      "#eab308",
};

const DIFF_COLOR: Record<string, string> = {
  easy:   T.green,
  medium: T.yellow,
  hard:   T.red,
};

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

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}



const LANGUAGES = [
  { key: "python",     label: "Python3"    },
  { key: "javascript", label: "JavaScript" },
];

// ─── Player Card ──────────────────────────────────────────────────────────
function PlayerCard({
  label, name, elo, color, isActive,
}: {
  label: "YOU" | "OPP";
  name: string;
  elo: number;
  color: Color;
  isActive: boolean;
}) {
  const tier = getTier(elo);
  const pfp  = PFP_MAP[tier.name];

  return (
    <div style={{
      background: T.surfaceAlt,
      border: `2px solid ${isActive ? T.accentBright : T.border}`,
      borderRadius: 2,
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 10,
      boxShadow: isActive ? `0 0 14px ${T.accentBright}30` : "none",
      transition: "border-color 0.2s, box-shadow 0.2s",
    }}>
      {/* PFP */}
      <div style={{
        width: 44, height: 44, borderRadius: 2, flexShrink: 0,
        backgroundImage: pfp ? `url('${pfp}')` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center 30%",
        backgroundColor: pfp ? undefined : T.border,
        border: `2px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, color: T.textMut,
      }}>
        {!pfp && tier.icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{
            fontSize: 8, fontFamily: "var(--font-pixel), monospace",
            color: label === "YOU" ? T.accentBright : T.textMut,
            letterSpacing: "0.05em",
          }}>
            {label}
          </span>
        </div>
        <p style={{
          fontSize: 12, fontWeight: 600, color: T.text, margin: "0 0 3px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          fontFamily: "var(--font-geist-mono), monospace",
        }}>
          {name}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            fontSize: 8, fontFamily: "var(--font-pixel), monospace",
            color: T.accentBright, letterSpacing: "0.02em",
          }}>
            {tier.icon} {tier.name.toUpperCase()}
          </span>
          <span style={{
            fontSize: 11, fontFamily: "var(--font-geist-mono), monospace",
            color: T.gold, fontWeight: 700,
          }}>
            🏆 {elo}
          </span>
        </div>
      </div>

      {/* Color dot */}
      <div style={{
        width: 12, height: 12, borderRadius: "50%", flexShrink: 0,
        background: color === "white" ? "#f0e6d3" : "#1a1020",
        border: `2px solid ${T.border}`,
      }} />
    </div>
  );
}

// ─── Timer Section ────────────────────────────────────────────────────────
function TimerSection({ timeLeft, totalTime }: { timeLeft: number; totalTime: number }) {
  const pct      = Math.max(0, (timeLeft / totalTime) * 100);
  const isCrit   = timeLeft < 30;
  const isWarn   = timeLeft < 60;
  const color    = isCrit ? T.red : isWarn ? T.yellow : T.accentBright;

  return (
    <div style={{
      padding: "14px 16px",
      borderBottom: `2px solid ${T.border}`,
      background: T.surface,
      flexShrink: 0,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: 14 }}>⏳</span>
        <span style={{
          fontSize: 8, fontFamily: "var(--font-pixel), monospace",
          color: T.textMut, letterSpacing: "0.08em",
        }}>
          TIME LEFT
        </span>
      </div>
      <div style={{
        fontSize: 42, fontFamily: "var(--font-pixel), monospace",
        color, letterSpacing: "0.04em", lineHeight: 1, marginBottom: 10,
        textShadow: `0 0 18px ${color}50`,
      }}>
        {fmt(timeLeft)}
      </div>
      <div style={{
        height: 8, borderRadius: 2,
        background: T.surfaceAlt, border: `1px solid ${T.border}`,
        overflow: "hidden",
      }}>
        <div style={{
          width: `${pct}%`, height: "100%",
          background: color,
          transition: "width 1s linear",
          boxShadow: `0 0 8px ${color}70`,
        }} />
      </div>
      {isWarn && (
        <p style={{
          marginTop: 6, fontSize: 8,
          fontFamily: "var(--font-pixel), monospace",
          color: T.yellow, letterSpacing: "0.03em",
        }}>
          ⚠ {isCrit ? "HURRY UP!" : "Under 1 min — bonus XP reduced!"}
        </p>
      )}
    </div>
  );
}

// ─── Problem Panel ────────────────────────────────────────────────────────
function ProblemPanel({
  problem, moveAttempted, timerSeconds, isPro, onSolved, onFailed,
}: {
  problem: Problem;
  moveAttempted: string;
  timerSeconds: number;
  isPro: boolean;
  onSolved: (code: string, language: string, timeTakenMs: number) => void;
  onFailed:  (code: string, language: string, timeTakenMs: number) => void;
}) {
  const MIN_LINES = 20;
  const pad = (s: string) => {
    const n = (s.match(/\n/g) ?? []).length + 1;
    return n >= MIN_LINES ? s : s + "\n".repeat(MIN_LINES - n);
  };

  const [lang,        setLang]        = useState("python");
  const [code,        setCode]        = useState(pad(problem.starter_code["python"] ?? ""));
  const [timeLeft,    setTimeLeft]    = useState(timerSeconds);
  const [running,     setRunning]     = useState(false);
  const [output,      setOutput]      = useState<{ passed: boolean; message: string } | null>(null);
  const [testResults, setTestResults] = useState<(boolean | null)[]>([]);
  const timerRef     = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const codeRef      = useRef(code);
  const langRef      = useRef(lang);
  codeRef.current = code;
  langRef.current = lang;

  const tcs = problem.test_cases as Array<{ input: Record<string, unknown>; expected: unknown }>;

  useEffect(() => { setTestResults(tcs.slice(0, 4).map(() => null)); }, []); // eslint-disable-line

  function switchLang(l: string) {
    setLang(l);
    setCode(pad(problem.starter_code[l] ?? ""));
    setOutput(null);
  }

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!);
          onFailed(codeRef.current, langRef.current, Date.now() - startTimeRef.current);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [onFailed]);

  async function handleRun() {
    setRunning(true);
    setOutput(null);
    const result = lang === "javascript"
      ? runJSTests(code, tcs)
      : await runPyTests(code, tcs);

    if (result.passed) {
      setTestResults(tcs.slice(0, 4).map(() => true));
      setOutput({ passed: true, message: "All test cases passed!" });
      clearInterval(timerRef.current!);
      const elapsed = Date.now() - startTimeRef.current;
      setTimeout(() => onSolved(code, lang, elapsed), 600);
    } else if (result.failedCase) {
      setTestResults(tcs.slice(0, 4).map((_, i) => (i === 0 ? false : null)));
      const { input, expected, got } = result.failedCase;
      setOutput({ passed: false, message: `Input: ${JSON.stringify(input)} → got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}` });
    } else {
      setTestResults(tcs.slice(0, 4).map(() => false));
      setOutput({ passed: false, message: result.error ?? "Error in your code." });
    }
    setRunning(false);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Timer */}
      <TimerSection timeLeft={timeLeft} totalTime={timerSeconds} />

      {/* Problem header */}
      <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{
            fontSize: 8, fontFamily: "var(--font-pixel), monospace",
            color: T.textMut, letterSpacing: "0.05em",
          }}>
            ← LEETCODE PROBLEM
          </span>
          <span style={{
            fontSize: 8, fontFamily: "var(--font-pixel), monospace",
            padding: "3px 8px",
            background: `${DIFF_COLOR[problem.difficulty]}18`,
            color: DIFF_COLOR[problem.difficulty],
            border: `1px solid ${DIFF_COLOR[problem.difficulty]}40`,
            borderRadius: 2, letterSpacing: "0.04em",
          }}>
            {problem.difficulty.toUpperCase()}
          </span>
        </div>
        <h3 style={{
          fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 4px",
          fontFamily: "var(--font-geist), system-ui, sans-serif",
        }}>
          {problem.title}
        </h3>
        <p style={{ fontSize: 10, color: T.textMut, margin: 0, fontFamily: "var(--font-geist-mono), monospace" }}>
          Move: {moveAttempted}
        </p>
      </div>

      {/* Description */}
      <div style={{
        padding: "12px 16px", overflowY: "auto", maxHeight: 170,
        borderBottom: `1px solid ${T.border}`, flexShrink: 0,
      }}>
        <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.7, whiteSpace: "pre-wrap", margin: "0 0 10px" }}>
          {problem.description}
        </p>
        {problem.examples.slice(0, 2).map((ex, i) => (
          <div key={i} style={{
            background: T.surfaceAlt, border: `1px solid ${T.border}`,
            borderRadius: 2, padding: "8px 12px", marginBottom: 6,
            fontSize: 12, fontFamily: "var(--font-geist-mono), monospace",
          }}>
            <span style={{ color: T.accentBright }}>Input: </span>
            <span style={{ color: T.text }}>{ex.input}</span>
            <span style={{ color: T.textMut }}> → </span>
            <span style={{ color: T.green }}>{ex.output}</span>
          </div>
        ))}
      </div>

      {/* Language selector */}
      <div style={{
        display: "flex", alignItems: "center", gap: 6, padding: "8px 12px",
        borderBottom: `1px solid ${T.border}`, flexShrink: 0, background: T.surface,
      }}>
        {LANGUAGES.filter((l) => isPro || l.key === "python").map((l) => (
          <button
            key={l.key}
            onClick={() => switchLang(l.key)}
            style={{
              padding: "4px 10px", fontSize: 10,
              fontFamily: "var(--font-geist-mono), monospace",
              fontWeight: 600, letterSpacing: "0.04em",
              background: lang === l.key ? T.accent : "transparent",
              color: lang === l.key ? "#fff" : T.textMut,
              border: `1px solid ${lang === l.key ? T.accent : T.border}`,
              borderRadius: 2, cursor: "pointer",
            }}
          >
            {l.label}
          </button>
        ))}
        {!isPro && (
          <a href="/pricing" style={{
            marginLeft: "auto", padding: "4px 10px", fontSize: 10,
            fontFamily: "var(--font-geist-mono), monospace",
            color: T.gold, border: `1px solid ${T.gold}40`,
            borderRadius: 2, textDecoration: "none",
          }}>
            JS — Pro →
          </a>
        )}
      </div>

      {/* Code editor */}
      <div style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        <CodeEditor value={code} onChange={setCode} />
      </div>

      {/* Output */}
      {output && (
        <div style={{
          padding: "8px 14px", flexShrink: 0,
          background: output.passed ? `${T.green}10` : `${T.red}10`,
          borderTop: `1px solid ${output.passed ? T.green : T.red}30`,
        }}>
          <p style={{
            fontSize: 11, fontFamily: "var(--font-geist-mono), monospace",
            color: output.passed ? T.green : T.red, margin: 0, lineHeight: 1.5,
          }}>
            {output.passed ? "✓ " : "✗ "}{output.message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div style={{
        padding: "10px 12px", display: "flex", gap: 8,
        borderTop: `2px solid ${T.border}`, flexShrink: 0, background: T.surface,
      }}>
        <button
          onClick={handleRun}
          disabled={running}
          style={{
            flex: 1, padding: "11px 0",
            background: "transparent", color: T.accentBright,
            border: `2px solid ${T.accentBright}`, borderRadius: 2,
            fontSize: 9, fontWeight: 700,
            fontFamily: "var(--font-pixel), monospace",
            cursor: running ? "wait" : "pointer",
            opacity: running ? 0.6 : 1, letterSpacing: "0.04em",
          }}
        >
          {running ? "RUNNING..." : "RUN TESTS"}
        </button>
        <button
          onClick={() => onFailed(codeRef.current, langRef.current, Date.now() - startTimeRef.current)}
          style={{
            padding: "11px 14px",
            background: "transparent", color: T.textMut,
            border: `2px solid ${T.border}`, borderRadius: 2,
            fontSize: 9, cursor: "pointer",
            fontFamily: "var(--font-pixel), monospace",
            letterSpacing: "0.02em", whiteSpace: "nowrap",
          }}
        >
          SKIP
        </button>
      </div>

      {/* Test cases */}
      <div style={{
        padding: "8px 12px",
        borderTop: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", gap: 10, flexShrink: 0, background: T.surface,
        flexWrap: "wrap",
      }}>
        <span style={{
          fontSize: 8, fontFamily: "var(--font-pixel), monospace",
          color: T.textMut, letterSpacing: "0.05em",
        }}>
          TESTS
        </span>
        {testResults.map((r, i) => (
          <span key={i} style={{
            fontSize: 11, fontFamily: "var(--font-geist-mono), monospace",
            color: r === true ? T.green : r === false ? T.red : T.textMut,
          }}>
            {i + 1} {r === true ? "✅" : r === false ? "❌" : "⟳"}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Info Panel ────────────────────────────────────────────────────────────
function InfoPanel({
  game, myColor, isRanked,
}: {
  game: Game | null;
  myColor: Color;
  isRanked: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const roomCode = game?.room_code ?? "……";

  function copy() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 20, overflowY: "auto" }}>

      <div>
        <p style={{
          fontSize: 8, fontFamily: "var(--font-pixel), monospace",
          color: T.textMut, letterSpacing: "0.08em", marginBottom: 14,
        }}>
          GAME INFO
        </p>
        {[
          { label: "Turn",      value: game?.current_turn ? game.current_turn.charAt(0).toUpperCase() + game.current_turn.slice(1) : "—" },
          { label: "You play",  value: myColor },
          { label: "Game Type", value: isRanked ? "Ranked" : "Casual" },
          { label: "Difficulty",value: game?.difficulty ?? "easy" },
          { label: "Time/turn", value: `${(game?.time_limit_seconds ?? 180) / 60} min` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: T.textSec }}>{label}</span>
            <span style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: T.text }}>{value}</span>
          </div>
        ))}
      </div>

      <div>
        <p style={{
          fontSize: 8, fontFamily: "var(--font-pixel), monospace",
          color: T.textMut, letterSpacing: "0.08em", marginBottom: 10,
        }}>
          SHARE ROOM
        </p>
        <button
          onClick={copy}
          style={{
            width: "100%", padding: "14px",
            background: T.surfaceAlt, border: `2px solid ${T.border}`,
            borderRadius: 2, cursor: "pointer",
            fontFamily: "var(--font-pixel), monospace",
            fontSize: 14, letterSpacing: "0.2em",
            color: T.accentBright, textAlign: "center",
          }}
        >
          {roomCode}
        </button>
        <p style={{ fontSize: 10, color: T.textMut, marginTop: 6, textAlign: "center", fontFamily: "var(--font-geist-mono), monospace" }}>
          {copied ? "Copied! ✓" : "Click to copy"}
        </p>
      </div>

      <div>
        <p style={{
          fontSize: 8, fontFamily: "var(--font-pixel), monospace",
          color: T.textMut, letterSpacing: "0.08em", marginBottom: 12,
        }}>
          HOW TO PLAY
        </p>
        {[
          "Click a piece to select it",
          "Click a highlighted square to attempt a move",
          "Solve the coding problem in 3 min",
          "Solve → move plays. Fail → turn skipped",
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
            <span style={{
              fontSize: 8, fontFamily: "var(--font-pixel), monospace",
              color: T.accent, flexShrink: 0, marginTop: 2,
            }}>
              0{i + 1}
            </span>
            <span style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5 }}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Game Room ────────────────────────────────────────────────────────
export default function GameRoom({ gameId, isPro = false, isRanked = false }: { gameId: string; isPro?: boolean; isRanked?: boolean }) {
  const searchParams = useSearchParams();
  const myColor = (searchParams.get("color") ?? "white") as Color;

  const [game,       setGame]       = useState<Game | null>(null);
  const [chess]                     = useState(() => new Chess());
  const [fen,        setFen]        = useState(chess.fen());
  const [boardSize,  setBoardSize]  = useState(480);
  const [pendingMove,setPendingMove]= useState<{ from: string; to: string } | null>(null);
  const [activeProblem,setActiveProblem] = useState<Problem | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, React.CSSProperties>>({});
  const [gameOver,   setGameOver]   = useState<{ winner: string | null; reason: string } | null>(null);
  const [eloResult,  setEloResult]  = useState<{ change: number } | null>(null);
  const [statusMsg,  setStatusMsg]  = useState("");
  const [myProfile,  setMyProfile]  = useState<{ name: string; elo: number }>({ name: "Player", elo: 1200 });
  const [copied,     setCopied]     = useState(false);
  const boardRef     = useRef<HTMLDivElement>(null);
  const turnNumberRef= useRef(myColor === "white" ? 1 : 2);
  const playerIdRef  = useRef<string>("");

  useEffect(() => {
    function measure() {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setBoardSize(Math.max(Math.min(rect.width - 48, rect.height - 120, 540), 240));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    getPlayerId().then(async (id) => {
      playerIdRef.current = id;
      const [{ data: profile }, { data: { user } }] = await Promise.all([
        supabase.from("profiles").select("elo").eq("id", id).single(),
        supabase.auth.getUser(),
      ]);
      const name = (user?.user_metadata?.full_name as string | undefined)
        ?? user?.email?.split("@")[0]
        ?? "Player";
      setMyProfile({ name, elo: profile?.elo ?? 1200 });
    });
  }, []);

  useEffect(() => {
    loadGame();
    const channel = supabase
      .channel(`game:${gameId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "games", filter: `id=eq.${gameId}` },
        (payload) => {
          const updated = payload.new as Game;
          setGame(updated);
          try { chess.load(updated.fen); setFen(updated.fen); } catch { /**/ }
          if (updated.status === "finished") {
            setGameOver({ winner: updated.winner, reason: updated.winner ? "checkmate" : "draw" });
            if (isRanked) triggerEloUpdate(updated.winner, updated.id);
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function loadGame() {
    const { data } = await supabase.from("games").select().eq("id", gameId).single();
    if (!data) return;
    setGame(data as Game);
    try { chess.load((data as Game).fen); setFen((data as Game).fen); } catch { /**/ }
    if ((data as Game).status === "finished") {
      setGameOver({ winner: (data as Game).winner, reason: "finished" });
      if (isRanked) triggerEloUpdate((data as Game).winner, gameId);
    }
  }

  async function triggerEloUpdate(winner: string | null, gid: string) {
    try {
      const res = await fetch("/api/elo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: gid, winner: winner ?? "draw" }),
      });
      if (!res.ok) return;
      const result = await res.json() as { whiteChange: number; blackChange: number };
      const change = myColor === "white" ? result.whiteChange : result.blackChange;
      setEloResult({ change });
    } catch { /* non-critical */ }
  }

  const isMyTurn    = game?.current_turn === myColor && game?.status === "active";
  const opponentColor = myColor === "white" ? "black" : "white";

  function getLegalSquares(sq: string) {
    return chess.moves({ square: sq as Square, verbose: true }).map((m) => m.to);
  }

  function setSelection(sq: string) {
    const legal = getLegalSquares(sq);
    const h: Record<string, React.CSSProperties> = {};
    h[sq] = { background: "rgba(167,139,250,0.45)", borderRadius: "50%" };
    legal.forEach((s) => { h[s] = { background: "rgba(167,139,250,0.22)", borderRadius: "50%" }; });
    setSelectedSquare(sq);
    setHighlights(h);
  }

  function clearSelection() { setSelectedSquare(null); setHighlights({}); }

  function handleSquareClick({ square }: { piece: { pieceType: string } | null; square: string }) {
    if (!isMyTurn || activeProblem) return;
    const piece = chess.get(square as Square);
    const myChessColor = myColor === "white" ? "w" : "b";
    if (selectedSquare) {
      if (getLegalSquares(selectedSquare).includes(square)) { clearSelection(); openProblem(selectedSquare, square); return; }
      if (piece?.color === myChessColor) { setSelection(square); return; }
      clearSelection(); return;
    }
    if (piece?.color === myChessColor) setSelection(square);
  }

  async function openProblem(from: string, to: string) {
    setPendingMove({ from, to });
    const diff = game?.difficulty ?? "easy";
    const prob = await getRandomProblem(diff === "any" ? undefined : diff);
    setActiveProblem(prob);
  }

  const handleProblemSolved = useCallback(async (code: string, language: string, timeTakenMs: number) => {
    if (!pendingMove || !game) return;
    const prob = activeProblem;
    setActiveProblem(null);
    const { from, to } = pendingMove;
    setPendingMove(null);
    try {
      const result = chess.move({ from: from as Square, to: to as Square, promotion: "q" });
      if (!result) return;
      const newFen = chess.fen();
      setFen(newFen);
      const isOver  = chess.isGameOver();
      const winner  = chess.isCheckmate() ? myColor : null;
      await submitMove(gameId, newFen, result.san, myColor, isOver ? winner : undefined);
      if (prob) {
        await recordTurn({ gameId, turnNumber: turnNumberRef.current, playerColor: myColor, playerId: playerIdRef.current, problemId: prob.id, moveAttempted: `${from} → ${to}`, moveMade: result.san, codeSubmitted: code, language, solved: true, timeTakenMs });
        turnNumberRef.current += 2;
      }
      if (isOver) {
        setGameOver({ winner, reason: chess.isCheckmate() ? "checkmate" : "draw" });
        if (isRanked) triggerEloUpdate(winner, gameId);
      } else setStatusMsg("Move played — waiting for opponent.");
    } catch { setStatusMsg("Move failed."); }
  }, [pendingMove, game, activeProblem, chess, myColor, gameId]); // eslint-disable-line

  const handleProblemFailed = useCallback(async (code: string, language: string, timeTakenMs: number) => {
    if (!game) return;
    const prob = activeProblem;
    const move = pendingMove;
    setActiveProblem(null);
    setPendingMove(null);
    clearSelection();
    const fenParts = chess.fen().split(" ");
    fenParts[1] = myColor === "white" ? "b" : "w";
    const flippedFen = fenParts.join(" ");
    chess.load(flippedFen);
    setFen(flippedFen);
    await skipTurn(gameId, myColor, flippedFen);
    if (prob) {
      await recordTurn({ gameId, turnNumber: turnNumberRef.current, playerColor: myColor, playerId: playerIdRef.current, problemId: prob.id, moveAttempted: move ? `${move.from} → ${move.to}` : null, moveMade: null, codeSubmitted: code, language, solved: false, timeTakenMs });
      turnNumberRef.current += 2;
    }
    setStatusMsg("Turn skipped — opponent's move.");
  }, [game, activeProblem, gameId, myColor]); // eslint-disable-line

  function copyRoomCode() {
    if (game?.room_code) {
      navigator.clipboard.writeText(game.room_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "var(--font-geist), system-ui, sans-serif", color: T.text,
    }}>

      {/* ── Top Nav ── */}
      <nav style={{
        height: 52, borderBottom: `2px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 20px", flexShrink: 0, background: T.surface, gap: 16,
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none", flexShrink: 0 }}>
          <span style={{ fontSize: 18 }}>♛</span>
          <span style={{ fontFamily: "var(--font-pixel), monospace", fontSize: 9, color: T.text, letterSpacing: "0.06em" }}>
            KNIGHTCODE
          </span>
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>
          <span style={{ fontSize: 8, fontFamily: "var(--font-pixel), monospace", color: T.textMut, letterSpacing: "0.06em" }}>
            ROOM:
          </span>
          <span style={{
            fontSize: 10, fontFamily: "var(--font-pixel), monospace",
            color: T.accentBright, letterSpacing: "0.15em",
            border: `1px solid ${T.border}`, padding: "3px 10px", borderRadius: 2,
          }}>
            {game?.room_code ?? "……"}
          </span>
          <button
            onClick={copyRoomCode}
            style={{
              padding: "4px 10px", fontSize: 8,
              fontFamily: "var(--font-pixel), monospace",
              background: "transparent", color: T.textSec,
              border: `1px solid ${T.border}`, borderRadius: 2,
              cursor: "pointer", letterSpacing: "0.04em",
            }}
          >
            {copied ? "COPIED!" : "COPY LINK"}
          </button>
        </div>

        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <span style={{
            fontSize: 8, fontFamily: "var(--font-pixel), monospace",
            color: isRanked ? T.accentBright : T.textMut,
            border: `1px solid ${isRanked ? T.accent : T.border}`,
            padding: "4px 8px", borderRadius: 2, letterSpacing: "0.04em",
          }}>
            {isRanked ? "⚔ RANKED" : "VS FRIEND"}
          </span>
          <a href="/" style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", fontSize: 8,
            fontFamily: "var(--font-pixel), monospace",
            color: T.red, border: `1px solid ${T.red}60`,
            borderRadius: 2, textDecoration: "none", letterSpacing: "0.04em",
          }}>
            🚪 LEAVE
          </a>
        </div>
      </nav>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Left Panel ── */}
        <div style={{
          width: 240, flexShrink: 0,
          background: T.surface, borderRight: `2px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          padding: "12px", gap: 10, overflowY: "auto",
        }}>
          <PlayerCard label="OPP" name="Opponent" elo={1200} color={opponentColor} isActive={!isMyTurn && game?.status === "active"} />

          {/* Turn indicator */}
          <div style={{
            padding: "10px 12px",
            background: isMyTurn ? `${T.green}15` : T.surfaceAlt,
            border: `2px solid ${isMyTurn ? T.green : T.border}`,
            borderRadius: 2, textAlign: "center",
          }}>
            {isMyTurn ? (
              <>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 4 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: T.green, boxShadow: `0 0 8px ${T.green}`,
                  }} />
                  <span style={{ fontSize: 8, fontFamily: "var(--font-pixel), monospace", color: T.green, letterSpacing: "0.06em" }}>
                    YOUR TURN
                  </span>
                </div>
                <p style={{ fontSize: 11, color: T.textSec, margin: 0, lineHeight: 1.4 }}>
                  Solve the problem to make your move!
                </p>
              </>
            ) : (
              <span style={{ fontSize: 8, fontFamily: "var(--font-pixel), monospace", color: T.textMut, letterSpacing: "0.04em" }}>
                {game?.status === "waiting" ? "WAITING FOR PLAYER..." : "OPPONENT'S TURN"}
              </span>
            )}
          </div>

          <PlayerCard label="YOU" name={myProfile.name} elo={myProfile.elo} color={myColor} isActive={isMyTurn} />

          {statusMsg && (
            <div style={{
              padding: "8px 10px",
              background: T.surfaceAlt, border: `1px solid ${T.border}`,
              borderRadius: 2, fontSize: 11, color: T.textSec, lineHeight: 1.4,
            }}>
              {statusMsg}
            </div>
          )}

          {/* Game info */}
          <div style={{ marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
            <p style={{ fontSize: 8, fontFamily: "var(--font-pixel), monospace", color: T.textMut, letterSpacing: "0.06em", marginBottom: 10 }}>
              GAME INFO
            </p>
            {[
              { label: "Turn",       value: game?.current_turn ? game.current_turn.charAt(0).toUpperCase() + game.current_turn.slice(1) : "—" },
              { label: "Game Type",  value: isRanked ? "Ranked" : "Casual" },
              { label: "Difficulty", value: game?.difficulty ?? "easy" },
              { label: "Time",       value: `${(game?.time_limit_seconds ?? 180) / 60} min / turn` },
            ].map(({ label, value }) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: T.textMut }}>{label}</span>
                <span style={{ fontSize: 11, fontFamily: "var(--font-geist-mono), monospace", color: T.text }}>{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Board Area ── */}
        <div
          ref={boardRef}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "24px 20px", background: T.bg,
          }}
        >
          <div style={{ width: boardSize, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: opponentColor === "white" ? "#f0e6d3" : "#120d20", border: `2px solid ${T.border}` }} />
              <span style={{ fontSize: 11, color: T.textSec, fontFamily: "var(--font-geist-mono), monospace" }}>
                Opponent ({opponentColor})
              </span>
            </div>
            {!isMyTurn && game?.status === "active" && (
              <span style={{ fontSize: 11, color: T.yellow, fontFamily: "var(--font-geist-mono), monospace" }}>thinking…</span>
            )}
          </div>

          {/* Board */}
          <div style={{ userSelect: "none" }}>
            <PixelChessBoard
              position={fen}
              boardSize={boardSize}
              boardOrientation={myColor}
              onSquareClick={handleSquareClick}
              squareStyles={highlights}
            />
          </div>

          <div style={{ width: boardSize, display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: myColor === "white" ? "#f0e6d3" : "#120d20", border: `2px solid ${T.border}` }} />
              <span style={{ fontSize: 11, color: T.text, fontWeight: 600, fontFamily: "var(--font-geist-mono), monospace" }}>
                {myProfile.name} ({myColor})
              </span>
            </div>
            {isMyTurn && !activeProblem && (
              <span style={{ fontSize: 11, color: T.green, fontFamily: "var(--font-geist-mono), monospace" }}>● your turn</span>
            )}
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div style={{
          width: 400, borderLeft: `2px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          background: T.surface, overflow: "hidden", flexShrink: 0,
        }}>
          {activeProblem && pendingMove ? (
            <ProblemPanel
              problem={activeProblem}
              moveAttempted={`${pendingMove.from} → ${pendingMove.to}`}
              timerSeconds={game?.time_limit_seconds ?? 180}
              isPro={isPro}
              onSolved={handleProblemSolved}
              onFailed={handleProblemFailed}
            />
          ) : (
            <InfoPanel game={game} myColor={myColor} isRanked={isRanked} />
          )}
        </div>
      </div>

      {/* ── Game Over Modal ── */}
      {gameOver && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(13,10,26,0.92)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: T.surface, border: `2px solid ${T.accentBright}`,
            borderRadius: 4, padding: "48px 52px",
            textAlign: "center", maxWidth: 380,
            boxShadow: `0 0 60px ${T.accent}40, 0 8px 48px rgba(0,0,0,0.5)`,
          }}>
            <p style={{ fontSize: 52, margin: "0 0 20px" }}>
              {gameOver.winner === myColor ? "♛" : gameOver.winner ? "♟" : "="}
            </p>
            <h2 style={{
              fontSize: 16, marginBottom: 10, color: T.text,
              fontFamily: "var(--font-pixel), monospace", letterSpacing: "0.05em",
            }}>
              {gameOver.winner === myColor ? "YOU WIN!" : gameOver.winner ? "YOU LOSE." : "DRAW."}
            </h2>
            <p style={{ fontSize: 12, color: T.textSec, marginBottom: eloResult ? 16 : 32, fontFamily: "var(--font-geist-mono), monospace" }}>
              {gameOver.reason === "checkmate" ? "Checkmate." : "Game finished."}
            </p>
            {eloResult && (
              <p style={{
                fontSize: 24, fontWeight: 800,
                fontFamily: "var(--font-pixel), monospace",
                color: eloResult.change >= 0 ? T.green : T.red,
                marginBottom: 28, letterSpacing: "0.04em",
                textShadow: `0 0 20px ${eloResult.change >= 0 ? T.green : T.red}60`,
              }}>
                {eloResult.change >= 0 ? "+" : ""}{eloResult.change} ELO
              </p>
            )}
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={async () => {
                  const userId = playerIdRef.current;
                  if (!userId) return;
                  const newGame = await createGame(userId, game?.time_limit_seconds ?? 180);
                  const newColor = myColor === "white" ? "black" : "white";
                  window.location.href = `/game/${newGame.id}?color=${newColor}`;
                }}
                style={{
                  padding: "12px 24px",
                  background: T.accent, color: "#fff",
                  border: `2px solid ${T.accentBright}`, borderRadius: 2,
                  fontSize: 9, fontFamily: "var(--font-pixel), monospace",
                  cursor: "pointer", letterSpacing: "0.04em",
                }}
              >
                REMATCH
              </button>
              <a href="/" style={{
                display: "inline-flex", alignItems: "center", padding: "12px 24px",
                background: "transparent", color: T.textSec,
                border: `2px solid ${T.border}`, borderRadius: 2,
                textDecoration: "none", fontSize: 9,
                fontFamily: "var(--font-pixel), monospace", letterSpacing: "0.04em",
              }}>
                HOME
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
