"use client";

import { Chessboard } from "react-chessboard";
import type React from "react";

// ─── Piece map → /public/pieces/{code}.png ────────────────────────────────
const PIECE_CODES = [
  "wK","wQ","wR","wB","wN","wP",
  "bK","bQ","bR","bB","bN","bP",
] as const;

const customPieces = Object.fromEntries(
  PIECE_CODES.map((code) => [
    code,
    () => (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/pieces/${code.toLowerCase()}.png`}
        alt={code}
        style={{
          imageRendering: "pixelated",
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "contain",
        }}
      />
    ),
  ])
);

// ─── Props ────────────────────────────────────────────────────────────────
interface PixelChessBoardProps {
  position: string;
  boardSize: number;
  boardOrientation?: "white" | "black";
  squareStyles?: Record<string, React.CSSProperties>;
  onSquareClick?: (args: { piece: { pieceType: string } | null; square: string }) => void;
  allowDragging?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────
export default function PixelChessBoard({
  position,
  boardSize,
  boardOrientation = "white",
  squareStyles = {},
  onSquareClick,
  allowDragging = false,
}: PixelChessBoardProps) {
  return (
    /* Outer arena frame */
    <div
      className="relative"
      style={{
        width: boardSize + 12,
        height: boardSize + 12,
        padding: 4,
        background: "#1a0d35",
        border: "4px solid #6d28d9",
        boxShadow: [
          "0 0 0 1px #0d0a1a",
          "0 0 24px #7c3aed90",
          "0 0 60px #7c3aed40",
          "inset 0 0 12px #7c3aed20",
          "0 8px 40px rgba(0,0,0,0.8)",
        ].join(", "),
        imageRendering: "pixelated",
      }}
    >
      {/* Corner pixel accents */}
      {(["top-0 left-0", "top-0 right-0", "bottom-0 left-0", "bottom-0 right-0"] as const).map((pos) => (
        <div
          key={pos}
          className={`absolute ${pos} w-2 h-2`}
          style={{ background: "#a78bfa", zIndex: 10, imageRendering: "pixelated" }}
        />
      ))}

      {/* Inner glow ring */}
      <div
        style={{
          position: "absolute",
          inset: 4,
          border: "2px solid #4c1d95",
          boxShadow: "inset 0 0 16px #7c3aed30",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Board */}
      <div style={{ imageRendering: "pixelated" }}>
        <Chessboard
          options={{
            position,
            boardOrientation,
            onSquareClick,
            squareStyles: {
              ...squareStyles,
              // override highlight squares with pixel glow style
              ...Object.fromEntries(
                Object.entries(squareStyles).map(([sq, style]) => {
                  const bg = (style.background as string) ?? "";
                  // selected square
                  if (bg.includes("0.45")) {
                    return [sq, {
                      background: "rgba(139,92,246,0.55)",
                      boxShadow: "inset 0 0 0 3px #a78bfa, inset 0 0 12px #7c3aed80",
                    }];
                  }
                  // legal move square
                  if (bg.includes("0.22")) {
                    return [sq, {
                      background: "rgba(109,40,217,0.3)",
                      boxShadow: "inset 0 0 0 2px #7c3aed60",
                    }];
                  }
                  return [sq, style];
                })
              ),
            },
            boardStyle: {
              width: boardSize,
              height: boardSize,
              borderRadius: 0,
              imageRendering: "pixelated",
            } as React.CSSProperties,
            lightSquareStyle: { backgroundColor: "#3B2352" },
            darkSquareStyle:  { backgroundColor: "#2A163A" },
            pieces: customPieces,
            allowDragging,
          }}
        />
      </div>
    </div>
  );
}
