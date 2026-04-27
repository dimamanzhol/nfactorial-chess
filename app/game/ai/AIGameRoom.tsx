"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getRandomProblem, runPyTests } from "@/lib/game";
import type { Problem } from "@/types";
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
  green: "#16a34a",
  red: "#dc2626",
  yellow: "#b45309",
};

const DIFF_COLOR: Record<string, string> = {
  easy: T.green,
  medium: T.yellow,
  hard: T.red,
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

// ─── Problem Panel ─────────────────────────────────────────────────────────
function ProblemPanel({
  problem,
  moveAttempted,
  onSolved,
  onFailed,
}: {
  problem: Problem;
  moveAttempted: string;
  onSolved: () => void;
  onFailed: () => void;
}) {
  const [code, setCode] = useState(problem.starter_code["python"] ?? "");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ passed: boolean; message: string } | null>(null);
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
    setRunning(true);
    setOutput(null);
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

  const timerColor = timeLeft < 30 ? T.red : timeLeft < 60 ? T.yellow : T.textMut;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

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

      <div style={{ padding: "16px 24px", overflowY: "auto", maxHeight: 220, borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <p style={{ fontSize: 13, color: T.textSec, lineHeight: 1.65, whiteSpace: "pre-wrap", margin: 0 }}>
          {problem.description}
        </p>
        {problem.examples.length > 0 && (
          <div style={{ marginTop: 14 }}>
            {problem.examples.slice(0, 2).map((ex, i) => (
              <div key={i} style={{
                background: T.bgAlt, borderRadius: 8, padding: "10px 12px",
                marginBottom: 8, fontSize: 12, fontFamily: "var(--font-geist-mono), monospace",
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

      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: T.editorBg, overflow: "hidden", minHeight: 0 }}>
        <CodeEditor value={code} onChange={setCode} />
      </div>

      <div style={{ flexShrink: 0, borderTop: `1px solid ${T.border}`, background: T.bg }}>
        {output && (
          <div style={{
            padding: "10px 16px", borderBottom: `1px solid ${T.border}`,
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
        <div style={{ padding: "14px 16px", display: "flex", gap: 8 }}>
          <button
            onClick={handleRun}
            disabled={running}
            style={{
              flex: 1, padding: "10px 0", background: T.text, color: "#fff",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              cursor: running ? "wait" : "pointer", opacity: running ? 0.6 : 1,
              fontFamily: "inherit", letterSpacing: "-0.01em",
            }}
          >
            {running ? "Running…" : "Run & Submit"}
          </button>
          <button
            onClick={onFailed}
            style={{
              padding: "10px 14px", background: "transparent", color: T.textMut,
              border: `1px solid ${T.border}`, borderRadius: 8,
              fontSize: 13, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap",
            }}
          >
            Skip turn
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Move History ──────────────────────────────────────────────────────────
function MoveList({ moves }: { moves: { san: string; color: "w" | "b"; solved?: boolean }[] }) {
  return (
    <div style={{ padding: "24px" }}>
      <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
        Move History
      </p>
      {moves.length === 0 ? (
        <p style={{ fontSize: 13, color: T.textMut }}>No moves yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {Array.from({ length: Math.ceil(moves.length / 2) }, (_, i) => {
            const w = moves[i * 2];
            const b = moves[i * 2 + 1];
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", minWidth: 22 }}>
                  {i + 1}.
                </span>
                {w && (
                  <span style={{
                    fontSize: 13, fontFamily: "var(--font-geist-mono), monospace",
                    color: w.solved === false ? T.red : T.text,
                    minWidth: 60,
                  }}>
                    {w.san}
                    {w.solved === true && <span style={{ color: T.green, marginLeft: 4 }}>✓</span>}
                    {w.solved === false && <span style={{ color: T.red, marginLeft: 4 }}>✗</span>}
                  </span>
                )}
                {b && (
                  <span style={{ fontSize: 13, fontFamily: "var(--font-geist-mono), monospace", color: T.textSec }}>
                    {b.san}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── AI Game Room ──────────────────────────────────────────────────────────
type Phase = "player_turn" | "ai_thinking" | "game_over";

export default function AIGameRoom() {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [boardSize, setBoardSize] = useState(480);
  const [phase, setPhase] = useState<Phase>("player_turn");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, React.CSSProperties>>({});
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string; san: string } | null>(null);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [gameOver, setGameOver] = useState<{ winner: "player" | "ai" | "draw"; reason: string } | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ san: string; color: "w" | "b"; solved?: boolean }[]>([]);
  const boardRef = useRef<HTMLDivElement>(null);

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

  function getLegalSquares(sq: string): string[] {
    return chess.moves({ square: sq as Square, verbose: true }).map((m) => m.to);
  }

  function setSelection(sq: string) {
    const legal = getLegalSquares(sq);
    const h: Record<string, React.CSSProperties> = {};
    h[sq] = { background: "rgba(15,15,13,0.12)", borderRadius: "50%" };
    legal.forEach((s) => { h[s] = { background: "rgba(15,15,13,0.07)", borderRadius: "50%" }; });
    setSelectedSquare(sq); setHighlights(h);
  }

  function clearSelection() { setSelectedSquare(null); setHighlights({}); }

  function handleSquareClick({ square }: { piece: { pieceType: string } | null; square: string }) {
    if (phase !== "player_turn" || activeProblem) return;
    const piece = chess.get(square as Square);

    if (selectedSquare) {
      if (getLegalSquares(selectedSquare).includes(square)) {
        const testChess = new Chess(chess.fen());
        const result = testChess.move({ from: selectedSquare as Square, to: square as Square, promotion: "q" });
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
    if (chess.isCheckmate()) {
      setGameOver({ winner: chess.turn() === "w" ? "ai" : "player", reason: "Checkmate" });
    } else {
      setGameOver({ winner: "draw", reason: "Draw" });
    }
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
    if (!pendingMove) return;
    setActiveProblem(null);
    setMoveHistory((h) => [...h, { san: pendingMove.san, color: "w", solved: false }]);
    setPendingMove(null);
    clearSelection();
    setPhase("ai_thinking");
    runAI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMove]);

  function resetGame() {
    chess.reset();
    setFen(chess.fen());
    setPhase("player_turn");
    setGameOver(null);
    setMoveHistory([]);
    clearSelection();
    setPendingMove(null);
    setActiveProblem(null);
  }

  const isPlayerTurn = phase === "player_turn";
  const isAITurn = phase === "ai_thinking";

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "var(--font-geist), system-ui, sans-serif", color: T.text,
    }}>

      {/* Nav */}
      <nav style={{
        height: 52, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 28px", flexShrink: 0,
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.03em", color: T.text, textDecoration: "none" }}>
          KnightCode
        </a>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <span style={{
            fontSize: 10, padding: "3px 10px", borderRadius: 4,
            background: `${T.green}12`, color: T.green,
            fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em",
          }}>
            VS AI
          </span>
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
          {/* AI label */}
          <div style={{
            width: boardSize, display: "flex", alignItems: "center",
            justifyContent: "space-between", marginBottom: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.text }} />
              <span style={{ fontSize: 13, color: T.textSec, fontWeight: 500 }}>AI</span>
              <span style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em" }}>
                black
              </span>
            </div>
            {isAITurn && (
              <span style={{ fontSize: 12, color: T.yellow }}>thinking…</span>
            )}
          </div>

          {/* Board */}
          <div style={{ userSelect: "none", boxShadow: "0 1px 24px rgba(0,0,0,0.06)" }}>
            <Chessboard
              options={{
                position: fen,
                boardOrientation: "white",
                onSquareClick: handleSquareClick,
                squareStyles: highlights,
                boardStyle: { width: boardSize, height: boardSize, borderRadius: 10 },
                lightSquareStyle: { backgroundColor: "#ede0cc" },
                darkSquareStyle: { backgroundColor: "#a07850" },
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
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff", border: `1.5px solid ${T.border}` }} />
              <span style={{ fontSize: 13, color: T.text, fontWeight: 600 }}>You</span>
              <span style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em" }}>
                white
              </span>
            </div>
            {isPlayerTurn && !activeProblem && (
              <span style={{ fontSize: 12, color: T.green, fontWeight: 500 }}>your turn</span>
            )}
          </div>

          {/* Status */}
          {isAITurn && (
            <div style={{
              marginTop: 20, padding: "8px 16px",
              background: T.bgAlt, border: `1px solid ${T.border}`,
              borderRadius: 8, fontSize: 12, color: T.textSec,
            }}>
              AI is choosing a move…
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
              onSolved={handleProblemSolved}
              onFailed={handleProblemFailed}
            />
          ) : (
            <div style={{ overflowY: "auto" }}>
              {/* How to play */}
              <div style={{ padding: "24px", borderBottom: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 10, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>
                  How to play
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[
                    "Click a piece to select it",
                    "Click a highlighted square to attempt the move",
                    "Solve the coding problem within 3 minutes",
                    "Solve → your move plays. Fail → turn skipped, AI moves.",
                  ].map((s, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 10, fontFamily: "var(--font-geist-mono), monospace", color: T.textMut, flexShrink: 0, marginTop: 2 }}>
                        0{i + 1}
                      </span>
                      <span style={{ fontSize: 13, color: T.textSec, lineHeight: 1.5 }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
              <MoveList moves={moveHistory} />
            </div>
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
            <p style={{ fontSize: 52, margin: "0 0 20px" }}>
              {gameOver.winner === "player" ? "♛" : gameOver.winner === "ai" ? "♟" : "="}
            </p>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8, color: T.text }}>
              {gameOver.winner === "player" ? "You won." : gameOver.winner === "ai" ? "AI wins." : "Draw."}
            </h2>
            <p style={{ fontSize: 14, color: T.textSec, marginBottom: 36 }}>{gameOver.reason}.</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={resetGame}
                style={{
                  padding: "12px 28px", background: T.text, color: "#f7f3ee",
                  border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", letterSpacing: "-0.01em",
                }}
              >
                Play again →
              </button>
              <a href="/" style={{
                padding: "12px 20px", background: "transparent", color: T.textSec,
                border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14,
                textDecoration: "none", display: "inline-flex", alignItems: "center",
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
