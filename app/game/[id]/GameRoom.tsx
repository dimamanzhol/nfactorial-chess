"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { supabase } from "@/lib/supabase";
import { getRandomProblem, submitMove, skipTurn, runPyTests, runJSTests, recordTurn, createGame } from "@/lib/game";
import { getPlayerId } from "@/lib/supabase";
import type { Game, Problem, Color } from "@/types";
import CodeEditor from "@/components/CodeEditor";

// ─── Design tokens ────────────────────────────────────────────────────────
const T = {
  bg: "#f7f3ee",
  bgAlt: "#efebe4",
  surface: "#ffffff",
  text: "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border: "#e5e1d8",
  editorBg: "#f7f3ee",
  editorText: "#0f0f0d",
  editorBorder: "#e5e1d8",
  // state colors (muted for light bg)
  green: "#16a34a",
  red: "#dc2626",
  yellow: "#b45309",
};

const DIFF_COLOR: Record<string, string> = {
  easy: T.green,
  medium: T.yellow,
  hard: T.red,
};

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

const LANGUAGES = [
  { key: "python", label: "Python" },
  { key: "javascript", label: "JavaScript" },
];

// ─── Problem Panel (inline right side) ────────────────────────────────────
function ProblemPanel({
  problem,
  moveAttempted,
  timerSeconds,
  isPro,
  onSolved,
  onFailed,
}: {
  problem: Problem;
  moveAttempted: string;
  timerSeconds: number;
  isPro: boolean;
  onSolved: (code: string, language: string, timeTakenMs: number) => void;
  onFailed: (code: string, language: string, timeTakenMs: number) => void;
}) {
  const [lang, setLang] = useState("python");
  const [code, setCode] = useState(problem.starter_code["python"] ?? "");
  const [timeLeft, setTimeLeft] = useState(timerSeconds);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ passed: boolean; message: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());
  const codeRef = useRef(code);
  const langRef = useRef(lang);
  codeRef.current = code;
  langRef.current = lang;

  function switchLang(newLang: string) {
    setLang(newLang);
    setCode(problem.starter_code[newLang] ?? "");
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
    const tcs = problem.test_cases as Array<{ input: Record<string, unknown>; expected: unknown }>;
    const result = lang === "javascript"
      ? runJSTests(code, tcs)
      : await runPyTests(code, tcs);
    if (result.passed) {
      setOutput({ passed: true, message: "All test cases passed!" });
      clearInterval(timerRef.current!);
      const elapsed = Date.now() - startTimeRef.current;
      setTimeout(() => onSolved(code, lang, elapsed), 600);
    } else if (result.failedCase) {
      const { input, expected, got } = result.failedCase;
      setOutput({ passed: false, message: `Input: ${JSON.stringify(input)} → got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}` });
    } else {
      setOutput({ passed: false, message: result.error ?? "Error in your code." });
    }
    setRunning(false);
  }

  const timerColor = timeLeft < 30 ? T.red : timeLeft < 60 ? T.yellow : T.textMut;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* Problem header */}
      <div style={{ padding: "20px 24px 16px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div>
            <p style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase",
              color: T.textMut, marginBottom: 6,
            }}>
              Solve to move {moveAttempted}
            </p>
            <h3 style={{ fontSize: 17, fontWeight: 700, letterSpacing: "-0.02em", color: T.text, marginBottom: 8 }}>
              {problem.title}
            </h3>
            <span style={{
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 4,
              background: `${DIFF_COLOR[problem.difficulty]}15`,
              color: DIFF_COLOR[problem.difficulty],
            }}>
              {problem.difficulty}
            </span>
          </div>
          {/* Timer */}
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", marginBottom: 4 }}>
              TIME
            </p>
            <span style={{
              fontSize: 28, fontWeight: 800, letterSpacing: "-0.04em",
              fontFamily: "var(--font-geist-mono), monospace", color: timerColor,
            }}>
              {fmt(timeLeft)}
            </span>
          </div>
        </div>
      </div>

      {/* Problem description — scrollable */}
      <div style={{ padding: "16px 24px", overflowY: "auto", maxHeight: 220, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: 0 }}>
          {problem.description}
        </p>
        {problem.examples.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {problem.examples.slice(0, 2).map((ex, i) => (
              <div key={i} style={{
                background: T.bgAlt, borderRadius: 8, padding: "10px 12px",
                marginBottom: 8, fontSize: 12,
                fontFamily: "var(--font-geist-mono), monospace",
              }}>
                <span style={{ color: T.textMut }}>In: </span>
                <span style={{ color: T.text }}>{ex.input}</span>
                <span style={{ color: T.textMut }}> → </span>
                <span style={{ color: T.text }}>{ex.output}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Language selector + code editor */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.editorBg, overflow: "hidden", minHeight: 0 }}>
        <div style={{ display: "flex", gap: 4, padding: "8px 12px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
          {LANGUAGES.filter((l) => isPro || l.key === "python").map((l) => (
            <button
              key={l.key}
              onClick={() => switchLang(l.key)}
              style={{
                padding: "4px 10px",
                fontSize: 11, fontFamily: "var(--font-geist-mono), monospace",
                fontWeight: 600, letterSpacing: "0.04em",
                background: lang === l.key ? T.text : "transparent",
                color: lang === l.key ? "#fff" : T.textMut,
                border: `1px solid ${lang === l.key ? T.text : T.border}`,
                borderRadius: 6, cursor: "pointer",
              }}
            >
              {l.label}
            </button>
          ))}
          {!isPro && (
            <a
              href="/pricing"
              style={{
                padding: "4px 10px", fontSize: 11,
                fontFamily: "var(--font-geist-mono), monospace",
                fontWeight: 600, letterSpacing: "0.04em",
                color: T.green, border: `1px solid ${T.green}40`,
                borderRadius: 6, textDecoration: "none",
              }}
            >
              JS — Pro →
            </a>
          )}
        </div>
        <CodeEditor value={code} onChange={setCode} />
      </div>

      {/* Output + actions */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.bg }}>
        {output && (
          <div style={{
            padding: "10px 16px",
            borderBottom: `1px solid ${T.border}`,
            background: output.passed ? `${T.green}08` : `${T.red}08`,
          }}>
            <p style={{
              fontSize: 12, fontFamily: "var(--font-geist-mono), monospace",
              color: output.passed ? T.green : T.red, margin: 0, lineHeight: 1.5,
            }}>
              {output.passed ? "✓ " : "✗ "}{output.message}
            </p>
          </div>
        )}
        <div style={{ padding: "14px 16px", display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              flex: 1, padding: "10px 0",
              background: T.text, color: "#fff",
              border: "none", borderRadius: 8,
              fontSize: 13, fontWeight: 600,
              cursor: running ? "wait" : "pointer",
              opacity: running ? 0.6 : 1, fontFamily: "inherit",
              letterSpacing: "-0.01em",
            }}
          >
            {running ? "Running…" : "Run & Submit"}
          </button>
          <button
            onClick={() => onFailed(codeRef.current, langRef.current, Date.now() - startTimeRef.current)}
            style={{
              padding: "10px 14px",
              background: "transparent", color: T.textMut,
              border: `1px solid ${T.border}`, borderRadius: 8,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit",
              whiteSpace: "nowrap",
            }}
          >
            Skip turn
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Info Panel (idle right side) ─────────────────────────────────────────
function InfoPanel({
  game,
  myColor,
  statusMsg,
}: {
  game: Game | null;
  myColor: Color;
  statusMsg: string;
}) {
  const roomCode = game?.room_code ?? "…";
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Status */}
      <div>
        <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          Game
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            { label: "Status", value: game?.status ?? "loading", highlight: game?.status === "active" ? T.green : game?.status === "waiting" ? T.yellow : undefined },
            { label: "Current turn", value: game?.current_turn ?? "—" },
            { label: "You play", value: myColor },
            { label: "Difficulty", value: game?.difficulty ?? "easy" },
          ].map(({ label, value, highlight }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 13, color: T.textSec }}>{label}</span>
              <span style={{
                fontSize: 13, fontFamily: "var(--font-geist-mono), monospace",
                color: highlight ?? T.text, fontWeight: highlight ? 600 : 500,
              }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Status message */}
      {statusMsg && (
        <div style={{
          padding: "12px 14px",
          background: T.bgAlt,
          border: `1px solid ${T.border}`,
          borderRadius: 10,
          fontSize: 13,
          color: T.textSec,
          lineHeight: 1.5,
        }}>
          {statusMsg}
        </div>
      )}

      {/* Room code */}
      <div>
        <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          Share Room
        </p>
        <button
          onClick={copy}
          style={{
            width: "100%", padding: "16px",
            background: T.bgAlt, border: `1px solid ${T.border}`,
            borderRadius: 12, cursor: "pointer",
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 24, fontWeight: 800, letterSpacing: "0.2em",
            color: T.text, textAlign: "center",
          }}
        >
          {roomCode}
        </button>
        <p style={{ fontSize: 11, color: T.textMut, marginTop: 8, textAlign: "center" }}>
          {copied ? "Copied!" : "Click to copy room code"}
        </p>
      </div>

      {/* How to play */}
      <div>
        <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 14 }}>
          How to play
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[
            "Click a piece to select it",
            "Click a highlighted square to attempt that move",
            "Solve the coding problem in 3 minutes",
            "Solve → move plays. Fail → turn skipped",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{
                fontSize: 10, fontFamily: "var(--font-geist-mono), monospace",
                color: T.textMut, flexShrink: 0, marginTop: 2,
              }}>
                0{i + 1}
              </span>
              <span style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Game Room ────────────────────────────────────────────────────────
export default function GameRoom({ gameId, isPro = false }: { gameId: string; isPro?: boolean }) {
  const searchParams = useSearchParams();
  const myColor = (searchParams.get("color") ?? "white") as Color;

  const [game, setGame] = useState<Game | null>(null);
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [boardSize, setBoardSize] = useState(480);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, React.CSSProperties>>({});
  const [gameOver, setGameOver] = useState<{ winner: string | null; reason: string } | null>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const boardRef = useRef<HTMLDivElement>(null);
  const turnNumberRef = useRef(myColor === "white" ? 1 : 2);
  const playerIdRef = useRef<string>("");

  useEffect(() => {
    function measure() {
      if (boardRef.current) {
        const rect = boardRef.current.getBoundingClientRect();
        setBoardSize(Math.max(Math.min(rect.width - 48, rect.height - 100, 540), 260));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    getPlayerId().then((id) => { playerIdRef.current = id; });
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
    }
  }

  const isMyTurn = game?.current_turn === myColor && game?.status === "active";

  function getLegalSquares(sq: string): string[] {
    return chess.moves({ square: sq as Square, verbose: true }).map((m) => m.to);
  }

  function setSelection(sq: string) {
    const legal = getLegalSquares(sq);
    const h: Record<string, React.CSSProperties> = {};
    h[sq] = { background: "rgba(15,15,13,0.12)", borderRadius: "50%" };
    legal.forEach((s) => { h[s] = { background: "rgba(15,15,13,0.07)", borderRadius: "50%" }; });
    setSelectedSquare(sq);
    setHighlights(h);
  }

  function clearSelection() { setSelectedSquare(null); setHighlights({}); }

  function handleSquareClick({ square }: { piece: { pieceType: string } | null; square: string }) {
    if (!isMyTurn || activeProblem) return;
    const piece = chess.get(square as Square);
    const myChessColor = myColor === "white" ? "w" : "b";

    if (selectedSquare) {
      if (getLegalSquares(selectedSquare).includes(square)) {
        clearSelection();
        openProblem(selectedSquare, square);
        return;
      }
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
      const isOver = chess.isGameOver();
      const winner = chess.isCheckmate() ? myColor : null;
      await submitMove(gameId, newFen, result.san, myColor, isOver ? winner : undefined);
      if (prob) {
        await recordTurn({
          gameId,
          turnNumber: turnNumberRef.current,
          playerColor: myColor,
          playerId: playerIdRef.current,
          problemId: prob.id,
          moveAttempted: `${from} → ${to}`,
          moveMade: result.san,
          codeSubmitted: code,
          language,
          solved: true,
          timeTakenMs,
        });
        turnNumberRef.current += 2;
      }
      if (isOver) setGameOver({ winner, reason: chess.isCheckmate() ? "checkmate" : "draw" });
      else setStatusMsg("Move played — waiting for opponent.");
    } catch { setStatusMsg("Move failed."); }
  }, [pendingMove, game, activeProblem, chess, myColor, gameId]);

  const handleProblemFailed = useCallback(async (code: string, language: string, timeTakenMs: number) => {
    if (!game) return;
    const prob = activeProblem;
    const move = pendingMove;
    setActiveProblem(null);
    setPendingMove(null);
    clearSelection();
    // Flip the FEN turn so the opponent's chess.js instance returns legal moves
    const fenParts = chess.fen().split(" ");
    fenParts[1] = myColor === "white" ? "b" : "w";
    const flippedFen = fenParts.join(" ");
    chess.load(flippedFen);
    setFen(flippedFen);
    await skipTurn(gameId, myColor, flippedFen);
    if (prob) {
      await recordTurn({
        gameId,
        turnNumber: turnNumberRef.current,
        playerColor: myColor,
        playerId: playerIdRef.current,
        problemId: prob.id,
        moveAttempted: move ? `${move.from} → ${move.to}` : null,
        moveMade: null,
        codeSubmitted: code,
        language,
        solved: false,
        timeTakenMs,
      });
      turnNumberRef.current += 2;
    }
    setStatusMsg("Turn skipped — opponent's move.");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game, activeProblem, gameId, myColor]);

  let turnStatus = "";
  if (game?.status === "waiting") turnStatus = "Waiting for opponent to join…";
  else if (!isMyTurn && game?.status === "active") turnStatus = "Opponent is thinking…";
  else if (isMyTurn && !activeProblem) turnStatus = "Your turn — select a piece";

  const opponentColor = myColor === "white" ? "black" : "white";

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "var(--font-geist), system-ui, sans-serif", color: T.text,
    }}>

      {/* Nav */}
      <nav style={{
        height: 52, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", flexShrink: 0, background: T.bg,
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.03em", color: T.text, textDecoration: "none" }}>
          KnightCode
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <span style={{ fontSize: 12, color: T.textMut }}>vs friend</span>
          <a href="/" style={{ fontSize: 13, color: T.textMut, textDecoration: "none" }}>← Leave</a>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Board area */}
        <div
          ref={boardRef}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "32px 24px", gap: 0,
          }}
        >
          {/* Opponent label */}
          <div style={{
            width: boardSize, display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: opponentColor === "white" ? "#fff" : T.text,
                border: `1.5px solid ${T.border}`,
              }} />
              <span style={{ fontSize: 13, color: T.textSec, fontWeight: 500 }}>Opponent</span>
              <span style={{
                fontSize: 10, color: T.textMut,
                fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em",
              }}>
                {opponentColor}
              </span>
            </div>
            {!isMyTurn && game?.status === "active" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 12, color: T.yellow }}>thinking…</span>
              </div>
            )}
          </div>

          {/* Board */}
          <div style={{ userSelect: "none", boxShadow: "0 1px 24px rgba(0,0,0,0.06)" }}>
            <Chessboard
              options={{
                position: fen,
                boardOrientation: myColor,
                onSquareClick: handleSquareClick,
                squareStyles: highlights,
                boardStyle: { width: boardSize, height: boardSize, borderRadius: 10 },
                lightSquareStyle: { backgroundColor: "#f0d9b5" },
                darkSquareStyle: { backgroundColor: "#b58863" },
                allowDragging: false,
              }}
            />
          </div>

          {/* You label */}
          <div style={{
            width: boardSize, display: "flex", alignItems: "center",
            justifyContent: "space-between", marginTop: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%",
                background: myColor === "white" ? "#fff" : T.text,
                border: `1.5px solid ${T.border}`,
              }} />
              <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>You</span>
              <span style={{
                fontSize: 10, color: T.textMut,
                fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em",
              }}>
                {myColor}
              </span>
            </div>
            {isMyTurn && !activeProblem && (
              <span style={{ fontSize: 12, color: T.green, fontWeight: 500 }}>your turn</span>
            )}
          </div>

          {/* Status hint */}
          {(turnStatus || statusMsg) && (
            <div style={{
              marginTop: 20, padding: "8px 16px",
              background: T.bgAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, fontSize: 12, color: T.textSec,
            }}>
              {turnStatus || statusMsg}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{
          width: 420, borderLeft: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          background: T.bg, overflow: "hidden", flexShrink: 0,
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
            <InfoPanel
              game={game}
              myColor={myColor}
              statusMsg=""
            />
          )}
        </div>
      </div>

      {/* Game over */}
      {gameOver && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(247,243,238,0.92)",
          backdropFilter: "blur(4px)", display: "flex",
          alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 20, padding: "48px 52px",
            textAlign: "center", maxWidth: 380,
            boxShadow: "0 8px 48px rgba(0,0,0,0.08)",
          }}>
            <p style={{ fontSize: 52, margin: "0 0 20px", letterSpacing: "-0.02em" }}>
              {gameOver.winner === myColor ? "♛" : gameOver.winner ? "♟" : "="}
            </p>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8, color: T.text }}>
              {gameOver.winner === myColor ? "You won." : gameOver.winner ? "You lost." : "Draw."}
            </h2>
            <p style={{ fontSize: 14, color: T.textSec, marginBottom: 36 }}>
              {gameOver.reason === "checkmate" ? "Checkmate." : "Game finished."}
            </p>
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
                  background: T.text, color: "#f7f3ee",
                  border: "none", borderRadius: 10,
                  fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em",
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Rematch →
              </button>
              <a href="/" style={{
                display: "inline-flex", alignItems: "center", padding: "12px 24px",
                background: "transparent", color: T.textSec,
                border: `1px solid ${T.border}`, borderRadius: 10,
                textDecoration: "none", fontSize: 14, fontWeight: 500,
              }}>
                Home
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
