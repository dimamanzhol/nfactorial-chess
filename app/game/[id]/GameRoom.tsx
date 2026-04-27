"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Chess, type Square } from "chess.js";
import { Chessboard } from "react-chessboard";
import { supabase, getPlayerId } from "@/lib/supabase";
import { getRandomProblem, submitMove, skipTurn, runJSTests } from "@/lib/game";
import type { Game, Problem, Color } from "@/types";

// ─── Design tokens (dark theme for game) ───────────────────────────────────
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

const TIMER_SECONDS = 180; // 3 minutes

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
        if (t <= 1) {
          clearInterval(intervalRef.current!);
          onFailed();
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current!);
  }, [onFailed]);

  function formatTime(s: number) {
    const m = Math.floor(s / 60);
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  }

  function handleRun() {
    setRunning(true);
    setOutput(null);
    setTimeout(() => {
      const result = runJSTests(code, problem.test_cases as Array<{ input: Record<string, unknown>; expected: unknown }>);
      if (result.passed) {
        setOutput({ passed: true, message: "All test cases passed!" });
        clearInterval(intervalRef.current!);
        setTimeout(onSolved, 800);
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
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.75)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: 16,
    }}>
      <div style={{
        background: T.bg,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        width: "100%",
        maxWidth: 900,
        maxHeight: "90vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 24px",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.textPri, letterSpacing: "-0.01em" }}>
              {problem.title}
            </span>
            <span style={{
              fontSize: 11,
              fontFamily: "var(--font-geist-mono), monospace",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "3px 8px",
              borderRadius: 4,
              background: `${DIFF_COLOR[problem.difficulty]}20`,
              color: DIFF_COLOR[problem.difficulty],
            }}>
              {problem.difficulty}
            </span>
            <span style={{
              fontSize: 12,
              color: T.textMut,
              fontFamily: "var(--font-geist-mono), monospace",
            }}>
              Move: {moveAttempted}
            </span>
          </div>
          <span style={{
            fontSize: 20,
            fontWeight: 800,
            fontFamily: "var(--font-geist-mono), monospace",
            color: timerColor,
            letterSpacing: "-0.02em",
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>

        {/* Body: problem + editor */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Left: problem description */}
          <div style={{
            width: "42%",
            borderRight: `1px solid ${T.border}`,
            padding: "20px 24px",
            overflowY: "auto",
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: 13,
              color: T.textSec,
              lineHeight: 1.65,
              whiteSpace: "pre-wrap",
            }}>
              {problem.description}
            </div>

            {problem.examples.length > 0 && (
              <div style={{ marginTop: 20 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textPri, marginBottom: 12, letterSpacing: "0.02em" }}>
                  Examples
                </p>
                {problem.examples.map((ex, i) => (
                  <div key={i} style={{
                    background: T.bgCard,
                    border: `1px solid ${T.border}`,
                    borderRadius: 8,
                    padding: "12px",
                    marginBottom: 10,
                    fontSize: 12,
                    fontFamily: "var(--font-geist-mono), monospace",
                  }}>
                    <div style={{ color: T.textSec, marginBottom: 4 }}>Input: <span style={{ color: T.textPri }}>{ex.input}</span></div>
                    <div style={{ color: T.textSec }}>Output: <span style={{ color: T.textPri }}>{ex.output}</span></div>
                    {ex.explanation && (
                      <div style={{ color: T.textMut, marginTop: 4 }}>// {ex.explanation}</div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {problem.constraints && (
              <div style={{ marginTop: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.textPri, marginBottom: 8 }}>Constraints</p>
                <pre style={{
                  fontSize: 11,
                  color: T.textSec,
                  fontFamily: "var(--font-geist-mono), monospace",
                  lineHeight: 1.6,
                  whiteSpace: "pre-wrap",
                  margin: 0,
                }}>
                  {problem.constraints}
                </pre>
              </div>
            )}
          </div>

          {/* Right: code editor */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{
              padding: "8px 16px",
              borderBottom: `1px solid ${T.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
              <span style={{
                fontSize: 11,
                color: T.textMut,
                fontFamily: "var(--font-geist-mono), monospace",
                letterSpacing: "0.06em",
              }}>
                JAVASCRIPT
              </span>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1,
                background: T.bgSec,
                color: T.textPri,
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 13,
                lineHeight: 1.6,
                padding: "16px",
                border: "none",
                outline: "none",
                resize: "none",
                tabSize: 2,
              }}
              onKeyDown={(e) => {
                if (e.key === "Tab") {
                  e.preventDefault();
                  const start = e.currentTarget.selectionStart;
                  const end = e.currentTarget.selectionEnd;
                  const newCode = code.substring(0, start) + "  " + code.substring(end);
                  setCode(newCode);
                  setTimeout(() => {
                    e.currentTarget.selectionStart = start + 2;
                    e.currentTarget.selectionEnd = start + 2;
                  });
                }
              }}
            />

            {/* Output */}
            {output && (
              <div style={{
                padding: "12px 16px",
                borderTop: `1px solid ${T.border}`,
                background: output.passed ? `${T.green}10` : `${T.red}10`,
                flexShrink: 0,
              }}>
                <p style={{
                  fontSize: 12,
                  fontFamily: "var(--font-geist-mono), monospace",
                  color: output.passed ? T.green : T.red,
                  margin: 0,
                  lineHeight: 1.5,
                }}>
                  {output.passed ? "✓ " : "✗ "}{output.message}
                </p>
              </div>
            )}

            {/* Run button */}
            <div style={{
              padding: "12px 16px",
              borderTop: `1px solid ${T.border}`,
              display: "flex",
              gap: 8,
              flexShrink: 0,
            }}>
              <button
                onClick={handleRun}
                disabled={running}
                style={{
                  padding: "9px 20px",
                  background: T.accent,
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: running ? "wait" : "pointer",
                  opacity: running ? 0.7 : 1,
                  fontFamily: "inherit",
                  letterSpacing: "-0.01em",
                }}
              >
                {running ? "Running…" : "Run & Submit"}
              </button>
              <button
                onClick={onFailed}
                style={{
                  padding: "9px 16px",
                  background: "transparent",
                  color: T.textMut,
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
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

// ─── Main Game Room ────────────────────────────────────────────────────────
export default function GameRoom({ gameId }: { gameId: string }) {
  const searchParams = useSearchParams();
  const myColor = (searchParams.get("color") ?? "white") as Color;

  const [game, setGame] = useState<Game | null>(null);
  const [chess] = useState(() => new Chess());
  const [fen, setFen] = useState(chess.fen());
  const [boardSize, setBoardSize] = useState(480);
  const [pendingMove, setPendingMove] = useState<{ from: string; to: string } | null>(null);
  const [activeProblem, setActiveProblem] = useState<Problem | null>(null);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [highlightSquares, setHighlightSquares] = useState<Record<string, object>>({});
  const [gameOver, setGameOver] = useState<{ winner: string | null; reason: string } | null>(null);
  const [waitingForOpponent, setWaitingForOpponent] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive board size
  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const size = Math.min(rect.width - 32, rect.height - 32, 520);
        setBoardSize(Math.max(size, 280));
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Load game and subscribe to realtime changes
  useEffect(() => {
    loadGame();
    const channel = supabase
      .channel(`game:${gameId}`)
      .on("postgres_changes", {
        event: "UPDATE",
        schema: "public",
        table: "games",
        filter: `id=eq.${gameId}`,
      }, (payload) => {
        const updated = payload.new as Game;
        setGame(updated);
        // Sync chess state
        try {
          chess.load(updated.fen);
          setFen(updated.fen);
        } catch {
          // ignore bad fen
        }
        if (updated.status === "finished") {
          setGameOver({
            winner: updated.winner,
            reason: updated.winner ? "checkmate" : "draw",
          });
        }
        setWaitingForOpponent(false);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  async function loadGame() {
    const { data } = await supabase.from("games").select().eq("id", gameId).single();
    if (!data) return;
    setGame(data as Game);
    try {
      chess.load((data as Game).fen);
      setFen((data as Game).fen);
    } catch { /**/ }
    if ((data as Game).status === "waiting") {
      setWaitingForOpponent(true);
    }
    if ((data as Game).status === "finished") {
      setGameOver({ winner: (data as Game).winner, reason: "finished" });
    }
  }

  const isMyTurn = game?.current_turn === myColor && game?.status === "active";

  // Compute legal move squares from a given square
  function getLegalSquares(square: string): string[] {
    const moves = chess.moves({ square: square as Square, verbose: true });
    return moves.map((m) => m.to);
  }

  function handleSquareClick({ square }: { piece: { pieceType: string } | null; square: string }) {
    if (!isMyTurn || activeProblem) return;

    const piece = chess.get(square as Square);

    if (selectedSquare) {
      // Try to move
      const legal = getLegalSquares(selectedSquare);
      if (legal.includes(square)) {
        // Initiate move attempt
        setPendingMove({ from: selectedSquare, to: square });
        setSelectedSquare(null);
        setHighlightSquares({});
        openProblem(selectedSquare, square);
        return;
      }
      // Select new piece if same color
      if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
        setSelectedSquare(square);
        const legalSquares = getLegalSquares(square);
        const highlights: Record<string, object> = {};
        highlights[square] = { background: "rgba(79,142,247,0.4)", borderRadius: "50%" };
        legalSquares.forEach((sq) => {
          highlights[sq] = { background: "rgba(79,142,247,0.25)", borderRadius: "50%" };
        });
        setHighlightSquares(highlights);
        return;
      }
      setSelectedSquare(null);
      setHighlightSquares({});
      return;
    }

    // First click — select piece
    if (piece && piece.color === (myColor === "white" ? "w" : "b")) {
      setSelectedSquare(square);
      const legalSquares = getLegalSquares(square);
      const highlights: Record<string, object> = {};
      highlights[square] = { background: "rgba(79,142,247,0.4)", borderRadius: "50%" };
      legalSquares.forEach((sq) => {
        highlights[sq] = { background: "rgba(79,142,247,0.25)", borderRadius: "50%" };
      });
      setHighlightSquares(highlights);
    }
  }

  async function openProblem(from: string, to: string) {
    setPendingMove({ from, to });
    const prob = await getRandomProblem();
    setActiveProblem(prob);
  }

  const handleProblemSolved = useCallback(async () => {
    if (!pendingMove || !game) return;
    setActiveProblem(null);

    const { from, to } = pendingMove;
    setPendingMove(null);

    // Apply move
    try {
      const moveResult = chess.move({ from: from as Square, to: to as Square, promotion: "q" });
      if (!moveResult) { setStatusMsg("Invalid move"); return; }

      const newFen = chess.fen();
      setFen(newFen);

      let winner: string | null = null;
      if (chess.isCheckmate()) {
        winner = myColor;
      } else if (chess.isDraw() || chess.isStalemate()) {
        winner = null; // draw
      }

      const isOver = chess.isGameOver();
      await submitMove(gameId, newFen, moveResult.san, myColor, isOver ? winner : undefined);

      if (isOver) {
        setGameOver({ winner, reason: chess.isCheckmate() ? "checkmate" : "draw" });
      } else {
        setStatusMsg("Move played! Opponent's turn.");
      }
    } catch {
      setStatusMsg("Move failed");
    }
  }, [pendingMove, game, chess, myColor, gameId]);

  const handleProblemFailed = useCallback(async () => {
    if (!game) return;
    setActiveProblem(null);
    setPendingMove(null);
    setSelectedSquare(null);
    setHighlightSquares({});
    await skipTurn(gameId, myColor);
    setStatusMsg("Turn skipped — opponent's turn.");
  }, [game, gameId, myColor]);

  // Room code display
  const roomCode = game?.room_code ?? "…";

  // Status text
  let turnStatus = "";
  if (game?.status === "waiting") turnStatus = "Waiting for opponent to join…";
  else if (!isMyTurn && game?.status === "active") turnStatus = "Opponent is thinking…";
  else if (isMyTurn) turnStatus = "Your turn — pick a piece to move";

  return (
    <div style={{
      background: T.bg,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      fontFamily: "var(--font-geist), system-ui, sans-serif",
      color: T.textPri,
    }}>
      {/* Top bar */}
      <div style={{
        height: 52,
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        flexShrink: 0,
      }}>
        <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: "-0.02em" }}>KnightCode</span>

        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* Room code */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.06em" }}>
              ROOM
            </span>
            <span style={{
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--font-geist-mono), monospace",
              letterSpacing: "0.12em",
              color: T.textPri,
              padding: "3px 10px",
              background: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              cursor: "pointer",
            }}
              onClick={() => navigator.clipboard.writeText(roomCode)}
              title="Click to copy"
            >
              {roomCode}
            </span>
          </div>

          {/* Player colors */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{
              fontSize: 11,
              padding: "3px 10px",
              borderRadius: 4,
              background: myColor === "white" ? "#ffffff20" : "#00000040",
              color: myColor === "white" ? "#fff" : T.textSec,
              border: `1px solid ${T.border}`,
              fontFamily: "var(--font-geist-mono), monospace",
              letterSpacing: "0.06em",
            }}>
              YOU: {myColor.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Board column */}
        <div
          ref={containerRef}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            gap: 16,
          }}
        >
          {/* Status */}
          <div style={{
            padding: "8px 20px",
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 8,
            fontSize: 13,
            color: isMyTurn ? T.accent : T.textSec,
            fontWeight: isMyTurn ? 600 : 400,
          }}>
            {turnStatus || statusMsg || "Loading…"}
          </div>

          {/* Chess board */}
          <div style={{ userSelect: "none" }}>
            <Chessboard
              options={{
                position: fen,
                boardOrientation: myColor,
                onSquareClick: handleSquareClick,
                squareStyles: highlightSquares,
                boardStyle: { width: boardSize, height: boardSize, borderRadius: 8 },
                lightSquareStyle: { backgroundColor: "#e8e0d0" },
                darkSquareStyle: { backgroundColor: "#8b7355" },
                allowDragging: false,
              }}
            />
          </div>

          {/* Move info */}
          {selectedSquare && (
            <div style={{ fontSize: 13, color: T.textMut }}>
              Selected: <span style={{ color: T.textPri, fontFamily: "var(--font-geist-mono), monospace" }}>{selectedSquare}</span>
              {" — click a highlighted square to move"}
            </div>
          )}
        </div>

        {/* Right panel — game info */}
        <div style={{
          width: 280,
          borderLeft: `1px solid ${T.border}`,
          background: T.bgSec,
          display: "flex",
          flexDirection: "column",
          padding: "20px",
          gap: 24,
          flexShrink: 0,
          overflowY: "auto",
        }}>
          <div>
            <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", marginBottom: 12 }}>
              GAME STATUS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: T.textSec }}>Status</span>
                <span style={{
                  fontSize: 13,
                  color: game?.status === "active" ? T.green : game?.status === "waiting" ? T.yellow : T.textSec,
                  fontWeight: 600,
                }}>
                  {game?.status ?? "loading"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: T.textSec }}>Turn</span>
                <span style={{ fontSize: 13, color: T.textPri, fontFamily: "var(--font-geist-mono), monospace" }}>
                  {game?.current_turn ?? "—"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, color: T.textSec }}>You play</span>
                <span style={{ fontSize: 13, color: T.textPri, fontFamily: "var(--font-geist-mono), monospace" }}>
                  {myColor}
                </span>
              </div>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", marginBottom: 12 }}>
              HOW TO PLAY
            </p>
            <div style={{ fontSize: 12, color: T.textSec, lineHeight: 1.65, display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: 0 }}>1. Click a piece to select it</p>
              <p style={{ margin: 0 }}>2. Click a highlighted square to attempt the move</p>
              <p style={{ margin: 0 }}>3. Solve the coding problem within 3 minutes</p>
              <p style={{ margin: 0 }}>4. Solve it → move is played</p>
              <p style={{ margin: 0 }}>5. Fail/timeout → turn skipped</p>
            </div>
          </div>

          <div>
            <p style={{ fontSize: 11, color: T.textMut, fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.08em", marginBottom: 12 }}>
              SHARE ROOM
            </p>
            <p style={{ fontSize: 12, color: T.textSec, lineHeight: 1.5, margin: "0 0 8px 0" }}>
              Share the room code with your opponent:
            </p>
            <div
              onClick={() => navigator.clipboard.writeText(roomCode)}
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: T.textPri,
                padding: "10px",
                background: T.bgCard,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                textAlign: "center",
                cursor: "pointer",
              }}
            >
              {roomCode}
            </div>
            <p style={{ fontSize: 11, color: T.textMut, marginTop: 6, textAlign: "center" }}>
              Click to copy
            </p>
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
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.85)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 100,
        }}>
          <div style={{
            background: T.bgCard,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: "48px",
            textAlign: "center",
            maxWidth: 400,
          }}>
            <p style={{ fontSize: 48, margin: "0 0 16px" }}>
              {gameOver.winner === myColor ? "🏆" : gameOver.winner ? "💀" : "🤝"}
            </p>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", marginBottom: 8, color: T.textPri }}>
              {gameOver.winner === myColor
                ? "You won!"
                : gameOver.winner
                ? "You lost."
                : "Draw!"}
            </h2>
            <p style={{ fontSize: 14, color: T.textSec, marginBottom: 32 }}>
              {gameOver.reason === "checkmate" ? "Checkmate!" : "Game over."}
            </p>
            <a
              href="/"
              style={{
                display: "inline-block",
                padding: "12px 28px",
                background: T.accent,
                color: "#fff",
                borderRadius: 10,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Play again
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
