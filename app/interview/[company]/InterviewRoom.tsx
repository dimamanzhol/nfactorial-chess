"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────
type ChatMessage = {
  role: "user" | "interviewer";
  content: string;
};

// ─── Design tokens (matches landing page) ────────────────────────────────────
const T = {
  bg:      "#f7f3ee",
  bgAlt:   "#efebe4",
  bgDark:  "#0f0f0d",
  text:    "#0f0f0d",
  textSec: "#6e6e62",
  textMut: "#9e9e92",
  border:  "#e5e1d8",
};

// ─── Constants ────────────────────────────────────────────────────────────────
const DEMO_PUZZLE = {
  fen: "r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4",
};

const INTERVIEW_DURATION = 20 * 60;

const COMPANY_CONFIG: Record<string, { name: string; color: string; label: string }> = {
  google:  { name: "Alex",   color: "#4f8ef7", label: "Google"  },
  meta:    { name: "Jordan", color: "#7c4dff", label: "Meta"    },
  amazon:  { name: "Sam",    color: "#ff9900", label: "Amazon"  },
  apple:   { name: "Riley",  color: "#888888", label: "Apple"   },
};

// ─── Mono label style helper ──────────────────────────────────────────────────
const mono = (color = T.textMut, size = 11): React.CSSProperties => ({
  fontFamily: "var(--font-geist-mono), monospace",
  fontSize: size,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  color,
});

// ─── Component ────────────────────────────────────────────────────────────────
export default function InterviewRoom({ company }: { company: string }) {
  const cfg = COMPANY_CONFIG[company] ?? COMPANY_CONFIG.google;

  const [game, setGame] = useState(() => new Chess(DEMO_PUZZLE.fen));
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [timeLeft, setTimeLeft] = useState(INTERVIEW_DURATION);
  const [isThinking, setIsThinking] = useState(false);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [boardWidth, setBoardWidth] = useState(440);

  const gameRef           = useRef(game);
  const timeRef           = useRef(timeLeft);
  const messagesRef       = useRef<ChatMessage[]>([]);
  const timerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef    = useRef<HTMLDivElement>(null);
  const boardContainerRef = useRef<HTMLDivElement>(null);
  const inputRef          = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { gameRef.current     = game;     }, [game]);
  useEffect(() => { timeRef.current     = timeLeft; }, [timeLeft]);
  useEffect(() => { messagesRef.current = messages; }, [messages]);

  // Board sizing — constrain by both width and height so it fills the panel
  useEffect(() => {
    const update = () => {
      if (boardContainerRef.current) {
        const w = boardContainerRef.current.clientWidth;
        const h = boardContainerRef.current.clientHeight;
        setBoardWidth(Math.min(w - 32, h - 72, 640));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Timer
  useEffect(() => {
    if (!started || gameOver) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); setGameOver(true); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [started, gameOver]);

  // Claude streaming call
  const callAI = useCallback(async (
    conversation: { role: "user" | "assistant"; content: string }[],
    fen: string,
  ) => {
    setIsThinking(true);
    setMessages((prev) => [...prev, { role: "interviewer", content: "" }]);
    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, fen, timeLeft: timeRef.current, conversation }),
      });
      if (!res.ok || !res.body) throw new Error(`API ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const next = [...prev];
          next[next.length - 1] = { role: "interviewer", content: text };
          return next;
        });
      }
    } catch (err) {
      console.error("AI error:", err);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsThinking(false);
    }
  }, [company]);

  const startInterview = useCallback(() => {
    setStarted(true);
    callAI([{ role: "user", content: "START_INTERVIEW" }], DEMO_PUZZLE.fen);
  }, [callAI]);

  const onDrop = useCallback(({
    sourceSquare,
    targetSquare,
  }: { sourceSquare: string; targetSquare: string | null }): boolean => {
    if (isThinking || gameOver || !targetSquare) return false;
    try {
      const copy = new Chess(gameRef.current.fen());
      const move = copy.move({ from: sourceSquare, to: targetSquare, promotion: "q" });
      if (!move) return false;
      setGame(copy);
      const moveMsg: ChatMessage = { role: "user", content: `Played ${move.san}` };
      const newHistory = [...messagesRef.current, moveMsg];
      setMessages(newHistory);
      if (copy.isGameOver()) setGameOver(true);
      callAI(
        newHistory.map((m) => ({ role: m.role === "interviewer" ? "assistant" as const : "user" as const, content: m.content })),
        copy.fen(),
      );
      return true;
    } catch { return false; }
  }, [isThinking, gameOver, callAI]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || isThinking || gameOver) return;
    setInput("");
    inputRef.current?.focus();
    const userMsg: ChatMessage = { role: "user", content: text };
    const newHistory = [...messagesRef.current, userMsg];
    setMessages(newHistory);
    callAI(
      newHistory.map((m) => ({ role: m.role === "interviewer" ? "assistant" as const : "user" as const, content: m.content })),
      gameRef.current.fen(),
    );
  }, [input, isThinking, gameOver, callAI]);

  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const timerColor = timeLeft < 120 ? "#c0392b" : timeLeft < 300 ? "#b7620a" : T.textMut;

  // ─────────────────────────────────────────────────────────────────────────
  // PRE-START SCREEN
  // ─────────────────────────────────────────────────────────────────────────
  if (!started) {
    return (
      <div style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "var(--font-geist), system-ui, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Nav */}
        <nav style={{
          borderBottom: `1px solid ${T.border}`,
          padding: "0 40px",
          height: 56,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <Link href="/" style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em", color: T.text, textDecoration: "none" }}>
            KnightCode
          </Link>
          <Link href="/companies" style={{ fontSize: 13, color: T.textMut, textDecoration: "none" }}>
            ← Companies
          </Link>
        </nav>

        {/* Content */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
          <div style={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: cfg.color, margin: "0 auto 28px" }} />

            <p style={{ ...mono(T.textMut), marginBottom: 16 }}>
              {cfg.label} Technical Interview
            </p>

            <h1 style={{
              fontSize: "clamp(36px, 5vw, 52px)",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: T.text,
              lineHeight: 1.05,
              marginBottom: 20,
            }}>
              {cfg.name} is ready<br />for you.
            </h1>

            <p style={{ fontSize: 16, color: T.textSec, lineHeight: 1.65, marginBottom: 40 }}>
              You&apos;ll solve a chess puzzle while explaining your thinking.{" "}
              {cfg.name} will ask follow-up questions in real-time — just like a
              real {cfg.label} interview.
            </p>

            {/* Stats */}
            <div style={{
              display: "flex",
              padding: "20px 24px",
              background: T.bgAlt,
              borderRadius: 10,
              border: `1px solid ${T.border}`,
              marginBottom: 24,
            }}>
              {[
                { v: "20 min",   l: "Time limit"  },
                { v: "Tactical", l: "Puzzle type" },
                { v: cfg.name,   l: "Interviewer" },
              ].map((s) => (
                <div key={s.l} style={{ flex: 1, textAlign: "center" }}>
                  <p style={{ fontSize: 16, fontWeight: 700, letterSpacing: "-0.02em", color: T.text }}>
                    {s.v}
                  </p>
                  <p style={{ ...mono(T.textMut, 10), marginTop: 4 }}>
                    {s.l}
                  </p>
                </div>
              ))}
            </div>

            <button
              onClick={startInterview}
              style={{
                width: "100%",
                padding: "15px 24px",
                borderRadius: 8,
                background: T.bgDark,
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                border: "none",
                cursor: "pointer",
                letterSpacing: "-0.01em",
                fontFamily: "var(--font-geist), system-ui, sans-serif",
              }}
            >
              Start Interview →
            </button>

            <Link
              href="/companies"
              style={{ display: "block", marginTop: 16, fontSize: 13, color: T.textMut, textDecoration: "none" }}
            >
              ← Choose a different company
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // INTERVIEW ROOM
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: T.bg,
      overflow: "hidden",
      fontFamily: "var(--font-geist), system-ui, sans-serif",
    }}>

      {/* Header */}
      <div style={{
        height: 52,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        borderBottom: `1px solid ${T.border}`,
        background: T.bg,
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: cfg.color }} />
          <span style={{ ...mono(T.textSec, 12) }}>
            {cfg.label} Interview · {cfg.name}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {game.isCheckmate() && (
            <span style={{ ...mono("#22863a", 11) }}>✓ Solved</span>
          )}
          <span style={{
            fontFamily: "var(--font-geist-mono), monospace",
            fontSize: 15,
            fontWeight: 700,
            color: timerColor,
            letterSpacing: "0.04em",
          }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* Left: chess board */}
        <div
          ref={boardContainerRef}
          style={{
            width: "52%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 16px",
            borderRight: `1px solid ${T.border}`,
            gap: 14,
            flexShrink: 0,
            background: T.bgAlt,
          }}
        >
          <Chessboard
            options={{
              position: game.fen(),
              onPieceDrop: onDrop,
              darkSquareStyle:  { backgroundColor: "#b58863" },
              lightSquareStyle: { backgroundColor: "#f0d9b5" },
              boardStyle: {
                borderRadius: 4,
                boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
                width: boardWidth,
                height: boardWidth,
              },
              allowDragging: !gameOver && !isThinking,
            }}
          />

          {/* Board status */}
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {game.isCheck() && !game.isCheckmate() && (
              <span style={{ ...mono("#c0392b", 11) }}>Check!</span>
            )}
            {game.isCheckmate() && (
              <span style={{ ...mono("#22863a", 11) }}>Checkmate · Puzzle solved</span>
            )}
            {!game.isGameOver() && (
              <span style={{ ...mono(T.textMut, 10) }}>
                {game.turn() === "w" ? "White to move" : "Black to move"}
              </span>
            )}
          </div>
        </div>

        {/* Right: chat */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* Interviewer label */}
          <div style={{
            padding: "12px 24px",
            borderBottom: `1px solid ${T.border}`,
            flexShrink: 0,
          }}>
            <p style={{ ...mono(cfg.color, 11), marginBottom: 2 }}>
              {cfg.name} · {cfg.label}
            </p>
            <p style={{ fontSize: 12, color: T.textMut }}>Technical Interview Session</p>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: "auto",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}>
            {messages.length === 0 && (
              <p style={{ fontSize: 13, color: T.textMut, textAlign: "center", marginTop: 24 }}>
                Connecting to {cfg.name}...
              </p>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <p style={{ ...mono(msg.role === "interviewer" ? cfg.color : T.textMut, 9), marginBottom: 5 }}>
                  {msg.role === "interviewer" ? cfg.name : "You"}
                </p>
                <div style={{
                  maxWidth: "88%",
                  padding: "10px 14px",
                  borderRadius: msg.role === "user" ? "12px 12px 2px 12px" : "2px 12px 12px 12px",
                  background: msg.role === "user" ? T.bgAlt : "#fff",
                  border: `1px solid ${T.border}`,
                }}>
                  {msg.content === "" && isThinking && i === messages.length - 1 ? (
                    <span style={{ color: T.textMut, fontSize: 20, letterSpacing: 6 }}>···</span>
                  ) : (
                    <p style={{ fontSize: 13, color: T.text, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {msg.content}
                    </p>
                  )}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            padding: "12px 24px",
            borderTop: `1px solid ${T.border}`,
            flexShrink: 0,
            background: T.bg,
          }}>
            <div style={{ display: "flex", gap: 8 }}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                }}
                placeholder={gameOver ? "Interview complete — great work!" : "Explain your thinking..."}
                disabled={isThinking || gameOver}
                rows={2}
                style={{
                  flex: 1,
                  background: gameOver ? T.bgAlt : "#fff",
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: "10px 12px",
                  color: T.text,
                  fontSize: 13,
                  resize: "none",
                  fontFamily: "var(--font-geist), system-ui, sans-serif",
                  outline: "none",
                  lineHeight: 1.5,
                  opacity: gameOver ? 0.5 : 1,
                }}
              />
              <button
                onClick={handleSend}
                disabled={isThinking || !input.trim() || gameOver}
                style={{
                  padding: "0 18px",
                  borderRadius: 8,
                  background: isThinking || !input.trim() || gameOver ? T.bgAlt : T.bgDark,
                  color: isThinking || !input.trim() || gameOver ? T.textMut : "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  border: `1px solid ${T.border}`,
                  cursor: isThinking || !input.trim() || gameOver ? "not-allowed" : "pointer",
                  transition: "background 0.15s",
                  fontFamily: "var(--font-geist), system-ui, sans-serif",
                }}
              >
                Send
              </button>
            </div>
            <p style={{ ...mono(T.border, 10), marginTop: 8, letterSpacing: "0.06em" }}>
              Enter to send · Shift+Enter for new line · Drag pieces on the board
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
