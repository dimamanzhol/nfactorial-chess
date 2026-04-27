"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { getRandomProblem, runJSTests } from "@/lib/game";
import type { Problem } from "@/types";

// ─── Design tokens ────────────────────────────────────────────────────────
const T = {
  bg: "#0a0a0f",
  bgSec: "#111118",
  bgCard: "#16161f",
  border: "#2a2a3a",
  accent: "#4f8ef7",
  green: "#22c55e",
  red: "#ef4444",
  yellow: "#f59e0b",
  textPri: "#f0f0f8",
  textSec: "#9090a8",
  textMut: "#55556a",
};

const DIFF_COLOR: Record<string, string> = {
  easy: T.green,
  medium: T.yellow,
  hard: T.red,
};

const TIMER_SECONDS = 180;

// Piece values for AI move scoring
const PIECE_VALUE: Record<string, number> = {
  p: 1, n: 3, b: 3, r: 5, q: 9, k: 0,
};

/** Pick the best move for the AI using greedy evaluation. */
function pickAIMove(chess: Chess): string | null {
  const moves = chess.moves({ verbose: true });
  if (!moves.length) return null;

  // 1. Checkmate immediately
  for (const m of moves) {
    chess.move(m.san);
    if (chess.isCheckmate()) { chess.undo(); return m.san; }
    chess.undo();
  }

  // 2. Score each move: capture value + check bonus
  const scored = moves.map((m) => {
    let score = 0;
    if (m.captured) score += PIECE_VALUE[m.captured] * 10;
    chess.move(m.san);
    if (chess.inCheck()) score += 3;
    // Don't hang pieces (very rough: avoid moving to attacked squares with valuable piece)
    chess.undo();
    score += Math.random() * 0.5; // tiebreak
    return { move: m.san, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].move;
}

// ─── Problem Modal ─────────────────────────────────────────────────────────
function ProblemModal({
  problem,
  onSolved,
  onFailed,
  moveAttempted,
}: {
  problem: Problem;
  onSolved: () => void;
  onFailed: () => void;
  moveAttempted: string;
}) {
  const [code, setCode] = useState(problem.starter_code["javascript"] ?? "");
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState<{ passed: boolean; message: string } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(intervalRef.current!); onFailed(); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [onFailed]);

  function formatTime(s: number) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
  }

  function handleRun() {
    setRunning(true);
    setOutput(null);
    setTimeout(() => {
      const result = runJSTests(code, problem.test_cases as Array<{ input: Record<string, unknown>; expected: unknown }>);
      if (result.passed) {
        setOutput({ passed: true, message: "All test cases passed!" });
        clearInterval(intervalRef.current!);
        setTimeout(onSolved, 600);
      } else if (result.failedCase) {
        const { input, expected, got } = result.failedCase;
        setOutput({
          passed: false,
          message: `Failed: input=${JSON.stringify(input)}, expected=${JSON.stringify(expected)}, got=${JSON.stringify(got)}`,
        });
      } else {
        setOutput({ passed: false, message: "Error running code. Check your solution." });
      }
      setRunning(false);
    }, 100);
  }

  const timerColor = timeLeft < 30 ? T.red : timeLeft < 60 ? T.yellow : T.textSec;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16,
    }}>
      <div style={{
        background: T.bg, border: `1px solid ${T.border}`, borderRadius: 16,
        width: "100%", maxWidth: 900, maxHeight: "90vh",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 24px", borderBottom: `1px solid ${T.border}`, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.textPri, letterSpacing: "-0.01em" }}>
              {problem.title}
            </span>
            <span style={{
              fontSize: 11, fontFamily: "var(--font-geist-mono), monospace",
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "3px 8px", borderRadius: 4,
              background: `${DIFF_COLOR[problem.difficulty]}20`,
              color: DIFF_COLOR[problem.difficulty],
            }}>
              {problem.difficulty}
            </span>
            <span style={{ fontSize: 12, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace" }}>
              Move: {moveAttempted}
            </span>
          </div>
          <span style={{
            fontSize: 20, fontWeight: 800, fontFamily: "var(--font-geist-mono), monospace",
            color: timerColor, letterSpacing: "-0.02em",
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Problem */}
          <div style={{
            width: "42%", borderRight: `1px solid ${T.border}`,
            padding: "20px 24px", overflowY: "auto", flexShrink: 0,
          }}>
            <div style={{ fontSize: 13, color: T.textSec, lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
              {problem.description}
            </div>
            {problem.examples.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textPri, marginBottom: 12 }}>Examples</p>
                {problem.examples.map((ex, i) => (
                  <div key={i} style={{
                    background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 8,
                    padding: 12, marginBottom: 10, fontSize: 12, fontFamily: "var(--font-geist-mono), monospace",
                  }}>
                    <div style={{ color: T.textSec, marginBottom: 4 }}>Input: <span style={{ color: T.textPri }}>{ex.input}</span></div>
                    <div style={{ color: T.textSec }}>Output: <span style={{ color: T.textPri }}>{ex.output}</span></div>
                    {ex.explanation && <div style={{ color: T.textMut, marginTop: 4 }}>// {ex.explanation}</div>}
                  </div>
                ))}
              </div>
            )}
            {problem.constraints && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textPri, marginBottom: 8 }}>Constraints</p>
                <pre style={{ fontSize: 11, color: T.textSec, fontFamily: "var(--font-geist-mono), monospace", lineHeight: 1.6, whiteSpace: "pre-wrap", margin: 0 }}>
                  {problem.constraints}
                </pre>
              </div>
            )}
          </div>

          {/* Editor */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              padding: "8px 16px", borderBottom: `1px solid ${T.border}`,
              display: "flex", alignItems: "center",
            }}>
              <span style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em" }}>
                JAVASCRIPT
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, background: T.bgSec, color: T.textPri,
                fontFamily: "var(--font-geist-mono), monospace", fontSize: 13,
                lineHeight: 1.6, padding: 16, border: "none", outline: "none",
                resize: "none", tabSize: 2,
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const s = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  setCode(code.substring(0, s) + "  " + code.substring(end));
                  setTimeout(() => { e.currentTarget.selectionStart = s + 2; e.currentTarget.selectionEnd = s + 2; });
                }
              }}
            />
            {output && (
              <div style={{
                padding: "12px 16px", borderTop: `1px solid ${T.border}`,
                background: output.passed ? `${T.green}10` : `${T.red}10`, flexShrink: 0,
              }}>
                <p style={{ fontSize: 12, fontFamily: "var(--font-geist-mono), monospace", color: output.passed ? T.green : T.red, margin: 0, lineHeight: 1.5 }}>
                  {output.passed ? "✓ " : "✗ "}{output.message}
                </p>
              </div>
            )}
            <div style={{
              padding: "12px 16px", borderTop: `1px solid ${T.border}`,
              display: "flex", gap: 8, flexShrink: 0,
            }}>
              <button
                onClick={handleRun}
                disabled={running}
                style={{
                  padding: "9px 20px", background: T.accent, color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
                  cursor: running ? "wait" : "pointer", opacity: running ? 0.7 : 1, fontFamily: "inherit",
                }}
              >
                {running ? "Running…" : "Run & Submit"}
              </button>
              <button
                onClick={onFailed}
                style={{
                  padding: "9px 16px", background: "transparent", color: T.textMut,
                  border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13,
                  cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Skip (lose turn)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── AI Game Room ──────────────────────────────────────────────────────────
type Phase = "idle" | "player_turn" | "ai_thinking" | "game_over";

export default function AIGameRoom() {
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [boardSize, setBoardSize] = useState(480);
  const [phase, setPhase] = useState<Phase>("player_turn");
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlightSquares, setHighlightSquares] = useState<Record<string, React.CSSProperties>>({});
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string; san: string } | null>(null);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [gameOver, setGameOver] = useState<{ winner: "player" | "ai" | "draw"; reason: string } | null>(null);
  const [moveHistory, setMoveHistory] = useState<{ san: string; color: "w" | "b"; solved?: boolean }[]>([]);
  const [aiStatus, setAiStatus] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Player is always white
  const playerColor = "w";

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setBoardSize(Math.max(Math.min(rect.width - 32, rect.height - 32, 520), 280));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  function getLegalSquares(square: string): string[] {
    return chess.moves({ square: square as Square, verbose: true }).map((m) => m.to);
  }

  function handleSquareClick({ square }: { piece: { pieceType: string } | null; square: string }) {
    if (phase !== "player_turn" || activeProblem) return;

    const piece = chess.get(square as Square);

    if (selectedSquare) {
      const legal = getLegalSquares(selectedSquare);
      if (legal.includes(square)) {
        // Pre-validate move
        const testChess = new Chess(chess.fen());
        const result = testChess.move({ from: selectedSquare as Square, to: square as Square, promotion: "q" });
        if (!result) return;
        setPendingMove({ from: selectedSquare, to: square, san: result.san });
        setSelectedSquare(null);
        setHighlightSquares({});
        openProblem(selectedSquare, square, result.san);
        return;
      }
      if (piece?.color === playerColor) {
        setSelectedSquare(square);
        const legalSqs = getLegalSquares(square);
        const h: Record<string, React.CSSProperties> = {};
        h[square] = { background: "rgba(79,142,247,0.4)", borderRadius: "50%" };
        legalSqs.forEach((sq) => { h[sq] = { background: "rgba(79,142,247,0.25)", borderRadius: "50%" }; });
        setHighlightSquares(h);
        return;
      }
      setSelectedSquare(null);
      setHighlightSquares({});
      return;
    }

    if (piece?.color === playerColor) {
      setSelectedSquare(square);
      const legalSqs = getLegalSquares(square);
      const h: Record<string, React.CSSProperties> = {};
      h[square] = { background: "rgba(79,142,247,0.4)", borderRadius: "50%" };
      legalSqs.forEach((sq) => { h[sq] = { background: "rgba(79,142,247,0.25)", borderRadius: "50%" }; });
      setHighlightSquares(h);
    }
  }

  async function openProblem(from: string, to: string, san: string) {
    const prob = await getRandomProblem();
    setPendingMove({ from, to, san });
    setActiveProblem(prob);
  }

  const handleProblemSolved = useCallback(() => {
    if (!pendingMove) return;
    setActiveProblem(null);

    chess.move({ from: pendingMove.from as Square, to: pendingMove.to as Square, promotion: "q" });
    setFen(chess.fen());
    setMoveHistory((h) => [...h, { san: pendingMove.san, color: "w", solved: true }]);
    setPendingMove(null);

    if (chess.isGameOver()) {
      endGame();
    } else {
      setPhase("ai_thinking");
      runAI();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMove]);

  const handleProblemFailed = useCallback(() => {
    if (!pendingMove) return;
    setActiveProblem(null);
    setMoveHistory((h) => [...h, { san: pendingMove.san + "?", color: "w", solved: false }]);
    setPendingMove(null);
    setPhase("ai_thinking");
    runAI();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMove]);

  function endGame() {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === "w" ? "ai" : "player"; // loser's turn = checkmate
      setGameOver({ winner, reason: "Checkmate" });
    } else if (chess.isDraw()) {
      setGameOver({ winner: "draw", reason: "Draw" });
    } else {
      setGameOver({ winner: "draw", reason: "Game over" });
    }
    setPhase("game_over");
  }

  function runAI() {
    setAiStatus("Thinking…");
    // Slight delay for realism
    setTimeout(() => {
      const move = pickAIMove(chess);
      if (!move) { endGame(); return; }
      chess.move(move);
      setFen(chess.fen());
      setMoveHistory((h) => [...h, { san: move, color: "b" }]);
      setAiStatus("");
      if (chess.isGameOver()) {
        endGame();
      } else {
        setPhase("player_turn");
      }
    }, 800 + Math.random() * 600);
  }

  function resetGame() {
    chess.reset();
    setFen(chess.fen());
    setPhase("player_turn");
    setGameOver(null);
    setMoveHistory([]);
    setSelectedSquare(null);
    setHighlightSquares({});
    setPendingMove(null);
    setActiveProblem(null);
    setAiStatus("");
  }

  const isPlayerTurn = phase === "player_turn";

  let statusMsg = "";
  if (phase === "player_turn") statusMsg = "Your turn — pick a piece to move";
  else if (phase === "ai_thinking") statusMsg = aiStatus || "AI is making a move…";
  else if (phase === "game_over") statusMsg = "Game over";

  return (
    <div style={{
      background: T.bg, minHeight: "100vh", display: "flex", flexDirection: "column",
      fontFamily: "var(--font-geist), system-ui, sans-serif", color: T.textPri,
    }}>
      {/* Top bar */}
      <div style={{
        height: 52, borderBottom: `1px solid ${T.border}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px", flexShrink: 0,
      }}>
        <a href="/" style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em", color: T.textPri, textDecoration: "none" }}>
          KnightCode
        </a>
        <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
          <span style={{
            fontSize: 11, padding: "3px 10px", borderRadius: 4,
            background: "#22c55e20", color: T.green,
            fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em",
          }}>
            VS AI
          </span>
          <a href="/" style={{ fontSize: 13, color: T.textMut, textDecoration: "none" }}>← Back</a>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Board */}
        <div
          ref={containerRef}
          style={{
            flex: 1, display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", padding: 16, gap: 16,
          }}
        >
          {/* Status */}
          <div style={{
            padding: "8px 20px", background: T.bgCard, border: `1px solid ${T.border}`,
            borderRadius: 8, fontSize: 13,
            color: isPlayerTurn ? T.accent : phase === "ai_thinking" ? T.yellow : T.textSec,
            fontWeight: isPlayerTurn ? 600 : 400,
          }}>
            {statusMsg}
          </div>

          <Chessboard
            options={{
              position: fen,
              boardOrientation: "white",
              onSquareClick: handleSquareClick,
              squareStyles: highlightSquares,
              boardStyle: { width: boardSize, height: boardSize, borderRadius: 8 },
              lightSquareStyle: { backgroundColor: "#e8e0d0" },
              darkSquareStyle: { backgroundColor: "#8b7355" },
              allowDragging: false,
            }}
          />

          {selectedSquare && (
            <div style={{ fontSize: 13, color: T.textMut }}>
              Selected: <span style={{ color: T.textPri, fontFamily: "var(--font-geist-mono), monospace" }}>{selectedSquare}</span>
              {" — click a highlighted square to attempt the move"}
            </div>
          )}
        </div>

        {/* Right panel */}
        <div style={{
          width: 260, borderLeft: `1px solid ${T.border}`, background: T.bgSec,
          display: "flex", flexDirection: "column", padding: 20, gap: 24,
          flexShrink: 0, overflowY: "auto",
        }}>
          {/* Players */}
          <div>
            <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", marginBottom: 12 }}>
              PLAYERS
            </p>
            {[
              { label: "You", color: "white", active: isPlayerTurn },
              { label: "AI", color: "black", active: phase === "ai_thinking" },
            ].map((p) => (
              <div key={p.label} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 12px", borderRadius: 8,
                background: p.active ? `${T.accent}15` : "transparent",
                border: `1px solid ${p.active ? T.accent : T.border}`,
                marginBottom: 8,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, color: T.textPri, fontWeight: p.active ? 600 : 400 }}>{p.label}</span>
                  <span style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace" }}>{p.color}</span>
                </div>
                {p.active && (
                  <span style={{ fontSize: 11, color: T.accent }}>
                    {p.label === "AI" ? "thinking…" : "your turn"}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Move history */}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", marginBottom: 12 }}>
              MOVES
            </p>
            {moveHistory.length === 0 ? (
              <p style={{ fontSize: 12, color: T.textMut }}>No moves yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {Array.from({ length: Math.ceil(moveHistory.length / 2) }, (_, i) => {
                  const w = moveHistory[i * 2];
                  const b = moveHistory[i * 2 + 1];
                  return (
                    <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", minWidth: 20 }}>
                        {i + 1}.
                      </span>
                      {w && (
                        <span style={{
                          fontSize: 12, fontFamily: "var(--font-geist-mono), monospace",
                          color: w.solved === false ? T.red : T.textPri,
                        }}>
                          {w.san} {w.solved === true ? "✓" : w.solved === false ? "✗" : ""}
                        </span>
                      )}
                      {b && (
                        <span style={{
                          fontSize: 12, fontFamily: "var(--font-geist-mono), monospace",
                          color: T.textSec,
                        }}>
                          {b.san}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Rules reminder */}
          <div>
            <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", marginBottom: 8 }}>
              RULES
            </p>
            <div style={{ fontSize: 11, color: T.textMut, lineHeight: 1.65, display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ margin: 0 }}>You must solve a coding problem to make each move.</p>
              <p style={{ margin: 0 }}>Fail in 3 min → turn skipped.</p>
              <p style={{ margin: 0 }}>AI moves instantly.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Problem modal */}
      {activeProblem && pendingMove && (
        <ProblemModal
          problem={activeProblem}
          onSolved={handleProblemSolved}
          onFailed={handleProblemFailed}
          moveAttempted={`${pendingMove.from}→${pendingMove.to}`}
        />
      )}

      {/* Game over overlay */}
      {gameOver && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100,
        }}>
          <div style={{
            background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 16,
            padding: 48, textAlign: "center", maxWidth: 380,
          }}>
            <p style={{ fontSize: 48, margin: "0 0 16px" }}>
              {gameOver.winner === "player" ? "🏆" : gameOver.winner === "ai" ? "💀" : "🤝"}
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, color: T.textPri }}>
              {gameOver.winner === "player" ? "You beat the AI!" : gameOver.winner === "ai" ? "AI wins." : "Draw!"}
            </h2>
            <p style={{ fontSize: 14, color: T.textSec, marginBottom: 32 }}>{gameOver.reason}</p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={resetGame}
                style={{
                  padding: "12px 24px", background: T.accent, color: "#fff",
                  border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
                }}
              >
                Play again
              </button>
              <a
                href="/"
                style={{
                  padding: "12px 24px", background: "transparent", color: T.textSec,
                  border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14,
                  textDecoration: "none", display: "inline-flex", alignItems: "center",
                }}
              >
                Home
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
