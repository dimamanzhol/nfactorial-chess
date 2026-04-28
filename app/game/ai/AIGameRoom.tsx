"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Chess, type Square } from "chess.js";
import { getRandomProblem, runPyTests } from "@/lib/game";
import type { Problem } from "@/types";
import CodeEditor from "@/components/CodeEditor";
import PixelChessBoard from "@/components/PixelChessBoard";

const T = {
  bg:           "#0d0a1a",
  surface:      "#160f2e",
  surfaceAlt:   "#1f1640",
  border:       "#2d2250",
  accent:       "#7c3aed",
  accentBright: "#a78bfa",
  text:         "#e8e0f5",
  textSec:      "#a89cc8",
  textMut:      "#5e4f8a",
  green:        "#22c55e",
  red:          "#ef4444",
  gold:         "#f59e0b",
};

const PIXEL = "var(--font-pixel), monospace";
const MONO  = "var(--font-geist-mono), monospace";

const DIFF_COLOR: Record<string, string> = {
  easy: T.green, medium: T.gold, hard: T.red,
};

const TIMER_SECONDS = 180;

const PIECE_VALUE: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

function fmt(s: number) {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function pickAIMove(chess: Chess): string | null {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;
  for (const m of moves) {
    chess.move(m.san);
    if (chess.isCheckmate()) { chess.undo(); return m.san; }
    chess.undo();
  }
  const scored = moves.map((m) => {
    let score = 0;
    if (m.captured) score += PIECE_VALUE[m.captured] * 10;
    chess.move(m.san);
    if (chess.inCheck()) score += 3;
    chess.undo();
    score += Math.random() * 0.5;
    return { move: m.san, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

// ─── Problem Panel ──────────────────────────────────────────────────────────
function ProblemPanel({
  problem, moveAttempted, onSolved, onFailed,
}: {
  problem: Problem; moveAttempted: string;
  onSolved: () => void; onFailed: () => void;
}) {
  const [code, setCode]     = useState(problem.starter_code["python"] ?? "");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [running, setRunning]   = useState(false);
  const [output, setOutput]     = useState<{ passed: boolean; message: string } | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); onFailed(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [onFailed]);

  async function handleRun() {
    setRunning(true); setOutput(null);
    const result = await runPyTests(code, problem.test_cases as Array<{ input: Record<string, unknown>; expected: unknown }>);
    if (result.passed) {
      setOutput({ passed: true, message: "All test cases passed!" });
      clearInterval(timerRef.current!);
      setTimeout(onSolved, 600);
    } else if (result.failedCase) {
      const { input, expected, got } = result.failedCase;
      setOutput({ passed: false, message: `Input: ${JSON.stringify(input)} → got ${JSON.stringify(got)}, expected ${JSON.stringify(expected)}` });
    } else {
      setOutput({ passed: false, message: "Error in your code — check the console." });
    }
    setRunning(false);
  }

  const pct        = ((TIMER_SECONDS - timeLeft) / TIMER_SECONDS) * 100;
  const isCrit     = timeLeft < 30;
  const isWarn     = timeLeft < 60;
  const timerColor = isCrit ? T.red : isWarn ? T.gold : T.accentBright;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

      {/* ── Big timer (matches GameRoom) ── */}
      <div style={{
        padding: "14px 16px", borderBottom: `2px solid ${T.border}`,
        background: T.surface, flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontSize: 14 }}>⏳</span>
          <span style={{ fontFamily: PIXEL, fontSize: 8, color: T.textMut, letterSpacing: "0.08em" }}>
            TIME LEFT
          </span>
        </div>
        <div style={{
          fontSize: 42, fontFamily: PIXEL, color: timerColor,
          letterSpacing: "0.04em", lineHeight: 1, marginBottom: 10,
          textShadow: `0 0 18px ${timerColor}50`,
        }}>
          {fmt(timeLeft)}
        </div>
        <div style={{ height: 8, borderRadius: 2, background: T.surfaceAlt,
          border: `1px solid ${T.border}`, overflow: "hidden" }}>
          <div style={{
            width: `${100 - pct}%`, height: "100%", background: timerColor,
            transition: "width 1s linear", boxShadow: `0 0 8px ${timerColor}70`,
          }} />
        </div>
        {isWarn && (
          <p style={{ marginTop: 6, fontSize: 8, fontFamily: PIXEL,
            color: T.gold, letterSpacing: "0.03em" }}>
            ⚠ {isCrit ? "HURRY UP!" : "Under 1 min!"}
          </p>
        )}
      </div>

      {/* Header */}
      <div style={{ padding: "14px 20px 12px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
          letterSpacing: "0.1em", marginBottom: 6 }}>
          SOLVE TO MOVE {moveAttempted.toUpperCase()}
        </p>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: T.text, margin: "0 0 8px" }}>
          {problem.title}
        </h3>
        <span style={{
          fontFamily: PIXEL, fontSize: 7, letterSpacing: "0.08em",
          padding: "2px 8px", borderRadius: 4,
          background: `${DIFF_COLOR[problem.difficulty]}18`,
          color: DIFF_COLOR[problem.difficulty],
        }}>
          {problem.difficulty.toUpperCase()}
        </span>
      </div>

      {/* Description */}
      <div style={{ padding: "14px 20px", overflowY: "auto", maxHeight: 180,
        borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.65,
          whiteSpace: "pre-wrap", margin: 0 }}>
          {problem.description}
        </p>
        {problem.examples.length > 0 && (
          <div style={{ marginTop: 12 }}>
            {problem.examples.slice(0, 2).map((ex, i) => (
              <div key={i} style={{
                background: T.surfaceAlt, borderRadius: 6, padding: "8px 12px",
                marginBottom: 6, fontSize: 12, fontFamily: MONO,
              }}>
                <span style={{ color: T.textMut }}>In: </span>
                <span style={{ color: T.text }}>{ex.input}</span>
                <span style={{ color: T.textMut }}> → </span>
                <span style={{ color: T.accentBright }}>{ex.output}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div style={{ flex: 1, overflow: "hidden", minHeight: 0 }}>
        <CodeEditor value={code} onChange={setCode} />
      </div>

      {/* Footer */}
      <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.bg }}>
        {output && (
          <div style={{
            padding: "10px 16px", borderBottom: `1px solid ${T.border}`,
            background: output.passed ? `${T.green}10` : `${T.red}10`,
          }}>
            <p style={{ fontFamily: MONO, fontSize: 12,
              color: output.passed ? T.green : T.red, margin: 0, lineHeight: 1.5 }}>
              {output.passed ? "✓ " : "✗ "}{output.message}
            </p>
          </div>
        )}
        <div style={{ padding: "12px 16px", display: "flex", gap: 8 }}>
          <button onClick={handleRun} disabled={running} style={{
            flex: 1, padding: "10px 0",
            background: T.accent, color: "#fff", border: "none", borderRadius: 6,
            fontFamily: PIXEL, fontSize: 9, letterSpacing: "0.06em",
            cursor: running ? "wait" : "pointer", opacity: running ? 0.6 : 1,
            boxShadow: `0 0 16px ${T.accent}50`,
          }}>
            {running ? "RUNNING…" : "RUN & SUBMIT"}
          </button>
          <button onClick={onFailed} style={{
            padding: "10px 14px", background: "transparent", color: T.textMut,
            border: `1px solid ${T.border}`, borderRadius: 6,
            fontFamily: PIXEL, fontSize: 8, cursor: "pointer", whiteSpace: "nowrap",
          }}>
            SKIP
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Move List ───────────────────────────────────────────────────────────────
function MoveList({ moves }: { moves: { san: string; color: "w" | "b"; solved?: boolean }[] }) {
  return (
    <div style={{ padding: "20px" }}>
      <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
        letterSpacing: "0.1em", marginBottom: 14 }}>MOVE HISTORY</p>
      {moves.length === 0 ? (
        <p style={{ fontSize: 12, color: T.textMut, fontFamily: MONO }}>No moves yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          {Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => {
            const w = moves[i * 2];
            const b = moves[i * 2 + 1];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 11, color: T.textMut, minWidth: 22 }}>
                  {i + 1}.
                </span>
                {w && (
                  <span style={{ fontFamily: MONO, fontSize: 13,
                    color: w.solved === false ? T.red : T.text, minWidth: 60 }}>
                    {w.san}
                    {w.solved === true  && <span style={{ color: T.green, marginLeft: 4 }}>✓</span>}
                    {w.solved === false && <span style={{ color: T.red,   marginLeft: 4 }}>✗</span>}
                  </span>
                )}
                {b && (
                  <span style={{ fontFamily: MONO, fontSize: 13, color: T.textSec }}>{b.san}</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ────────────────────────────────────────────────────────────────────
type Phase = "player_turn" | "ai_thinking" | "game_over";

export default function AIGameRoom() {
  const [chess]       = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [boardSize, setBoardSize] = useState(480);
  const [phase, setPhase]         = useState<Phase>("player_turn");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlights, setHighlights]         = useState<Record<string, React.CSSProperties>>({});
  const [pendingMove, setPendingMove]       = useState<{ from: string; to: string; san: string } | null>(null);
  const [activeProblem, setActiveProblem]   = useState<Problem | null>(null);
  const [gameOver, setGameOver]             = useState<{ winner: "player" | "ai" | "draw"; reason: string } | null>(null);
  const [moveHistory, setMoveHistory]       = useState<{ san: string; color: "w" | "b"; solved?: boolean }[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function measure() {
      if (boardRef.current) {
        const r = boardRef.current.getBoundingClientRect();
        setBoardSize(Math.max(Math.min(r.width - 48, r.height - 100, 540), 260));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function getLegalSquares(sq: string) {
    return chess.moves({ square: sq as Square, verbose: true }).map((m) => m.to);
  }

  function setSelection(sq: string) {
    const legal = getLegalSquares(sq);
    const h: Record<string, React.CSSProperties> = {};
    h[sq] = { background: "rgba(139,92,246,0.45)" };
    legal.forEach((s) => { h[s] = { background: "rgba(109,40,217,0.22)" }; });
    setSelectedSquare(sq); setHighlights(h);
  }

  function clearSelection() { setSelectedSquare(null); setHighlights({}); }

  function handleSquareClick({ square }: { piece: { pieceType: string } | null; square: string }) {
    if (phase !== "player_turn" || activeProblem) return;
    const piece = chess.get(square as Square);
    if (selectedSquare) {
      if (getLegalSquares(selectedSquare).includes(square as Square)) {
        const tc = new Chess(chess.fen());
        const result = tc.move({ from: selectedSquare as Square, to: square as Square, promotion: "q" });
        if (!result) return;
        clearSelection();
        openProblem(selectedSquare, square, result.san);
        return;
      }
      if (piece?.color === "w") { setSelection(square); return; }
      clearSelection(); return;
    }
    if (piece?.color === "w") setSelection(square);
  }

  async function openProblem(from: string, to: string, san: string) {
    setPendingMove({ from, to, san });
    const prob = await getRandomProblem();
    setActiveProblem(prob);
  }

  function endGame() {
    setGameOver(chess.isCheckmate()
      ? { winner: chess.turn() === "w" ? "ai" : "player", reason: "Checkmate" }
      : { winner: "draw", reason: "Draw" });
    setPhase("game_over");
  }

  function runAI() {
    setTimeout(() => {
      const move = pickAIMove(chess);
      if (!move) { endGame(); return; }
      chess.move(move);
      setFen(chess.fen());
      setMoveHistory((h) => [...h, { san: move, color: "b" }]);
      if (chess.isGameOver()) endGame();
      else setPhase("player_turn");
    }, 700 + Math.random() * 500);
  }

  const handleProblemSolved = useCallback(() => {
    if (!pendingMove) return;
    setActiveProblem(null);
    chess.move({ from: pendingMove.from as Square, to: pendingMove.to as Square, promotion: "q" });
    setFen(chess.fen());
    setMoveHistory((h) => [...h, { san: pendingMove.san, color: "w", solved: true }]);
    setPendingMove(null);
    if (chess.isGameOver()) endGame();
    else { setPhase("ai_thinking"); runAI(); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMove]);

  const handleProblemFailed = useCallback(() => {
    setActiveProblem(null);
    if (pendingMove) {
      setMoveHistory((h) => [...h, { san: pendingMove.san, color: "w", solved: false }]);
      setPendingMove(null);
    }
    clearSelection();
    chess.load(chess.fen().replace(/ w /, " b "));
    setFen(chess.fen());
    setPhase("ai_thinking");
    runAI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMove]);

  function resetGame() {
    chess.reset(); setFen(chess.fen()); setPhase("player_turn");
    setGameOver(null); setMoveHistory([]); clearSelection();
    setPendingMove(null); setActiveProblem(null);
  }

  const isAITurn = phase === "ai_thinking";

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "var(--font-geist), system-ui, sans-serif", color: T.text,
    }}>

      {/* ── Nav ── */}
      <nav style={{
        height: 52, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", flexShrink: 0,
        background: T.surface,
        boxShadow: `0 2px 16px rgba(124,58,237,0.08)`,
      }}>
        <a href="/dashboard/play" style={{
          fontFamily: PIXEL, fontSize: 9, color: T.accentBright,
          textDecoration: "none", letterSpacing: "0.06em",
        }}>
          KNIGHTCODE
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{
            fontFamily: PIXEL, fontSize: 8, padding: "3px 10px", borderRadius: 4,
            background: `${T.accent}20`, color: T.accentBright,
            border: `1px solid ${T.accent}40`, letterSpacing: "0.08em",
          }}>
            VS AI
          </span>
          <a href="/dashboard/play" style={{
            fontFamily: PIXEL, fontSize: 8, color: T.textMut,
            textDecoration: "none", letterSpacing: "0.06em",
          }}>← LEAVE</a>
        </div>
      </nav>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Board area */}
        <div ref={boardRef} style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "32px 24px",
        }}>
          {/* AI label */}
          <div style={{
            width: boardSize + 12, display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, background: "#1a1a2e", border: `2px solid ${T.border}` }} />
              <span style={{ fontFamily: PIXEL, fontSize: 9, color: T.textSec, letterSpacing: "0.06em" }}>AI</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: T.textMut }}>black</span>
            </div>
            {isAITurn && (
              <span style={{ fontFamily: PIXEL, fontSize: 8, color: T.gold, letterSpacing: "0.06em" }}>
                THINKING…
              </span>
            )}
          </div>

          {/* Board */}
          <div style={{ userSelect: "none" }}>
            <PixelChessBoard
              position={fen}
              boardSize={boardSize}
              boardOrientation="white"
              onSquareClick={handleSquareClick}
              squareStyles={highlights}
            />
          </div>

          {/* You label */}
          <div style={{
            width: boardSize + 12, display: "flex", alignItems: "center",
            justifyContent: "space-between", marginTop: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, background: T.text, border: `2px solid ${T.accentBright}60` }} />
              <span style={{ fontFamily: PIXEL, fontSize: 9, color: T.text, letterSpacing: "0.06em" }}>YOU</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: T.textMut }}>white</span>
            </div>
            {phase === "player_turn" && !activeProblem && (
              <span style={{ fontFamily: PIXEL, fontSize: 8, color: T.green, letterSpacing: "0.06em" }}>
                YOUR TURN
              </span>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div style={{
          width: 400, borderLeft: `1px solid ${T.border}`,
          display: "flex", flexDirection: "column",
          background: T.surface, overflow: "hidden", flexShrink: 0,
        }}>
          {activeProblem && pendingMove ? (
            <ProblemPanel
              problem={activeProblem}
              moveAttempted={`${pendingMove.from}→${pendingMove.to}`}
              onSolved={handleProblemSolved}
              onFailed={handleProblemFailed}
            />
          ) : (
            <div style={{ overflowY: "auto" }}>
              <div style={{ padding: "20px", borderBottom: `1px solid ${T.border}` }}>
                <p style={{ fontFamily: PIXEL, fontSize: 7, color: T.textMut,
                  letterSpacing: "0.1em", marginBottom: 14 }}>HOW TO PLAY</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Click a piece to select it",
                    "Click a highlighted square to attempt the move",
                    "Solve the coding problem within 3 minutes",
                    "Solve → your move plays. Fail → turn skipped, AI moves.",
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontFamily: PIXEL, fontSize: 7, color: T.accentBright,
                        flexShrink: 0, marginTop: 2 }}>0{i + 1}</span>
                      <span style={{ fontSize: 13, color: T.textSec, lineHeight: 1.55 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <MoveList moves={moveHistory} />
            </div>
          )}
        </div>
      </div>

      {/* ── Game over modal ── */}
      {gameOver && (
        <div style={{
          position: "fixed", inset: 0,
          background: "rgba(13,10,26,0.88)",
          backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: T.surface,
            border: `2px solid ${T.accent}60`,
            borderRadius: 8, padding: "44px 48px",
            textAlign: "center", maxWidth: 360,
            boxShadow: `0 0 60px ${T.accent}30`,
          }}>
            <p style={{ fontSize: 48, margin: "0 0 16px" }}>
              {gameOver.winner === "player" ? "♛" : gameOver.winner === "ai" ? "♟" : "="}
            </p>
            <h2 style={{ fontFamily: PIXEL, fontSize: 16, color: T.text,
              letterSpacing: "0.04em", marginBottom: 8 }}>
              {gameOver.winner === "player" ? "YOU WIN!" : gameOver.winner === "ai" ? "AI WINS" : "DRAW"}
            </h2>
            <p style={{ fontSize: 13, color: T.textSec, marginBottom: 32 }}>
              {gameOver.reason}.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button onClick={resetGame} style={{
                padding: "11px 24px", background: T.accent, color: "#fff",
                border: "none", borderRadius: 6,
                fontFamily: PIXEL, fontSize: 9, letterSpacing: "0.06em",
                cursor: "pointer", boxShadow: `0 0 16px ${T.accent}60`,
              }}>
                PLAY AGAIN →
              </button>
              <a href="/dashboard/play" style={{
                padding: "11px 20px", background: "transparent", color: T.textMut,
                border: `1px solid ${T.border}`, borderRadius: 6,
                fontFamily: PIXEL, fontSize: 9, letterSpacing: "0.06em",
                textDecoration: "none", display: "inline-flex", alignItems: "center",
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
