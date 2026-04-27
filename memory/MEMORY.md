# KnightCode Memory

## Project Concept
**KnightCode** = multiplayer chess + LeetCode hybrid game.
Two players compete. To make a chess move, you must solve a coding problem.
Faster solver earns the move. Fail in 3 min → turn skipped. Checkmate wins.

## Tech Stack
- Next.js 16 (App Router), TypeScript, React 19
- Supabase project: `fkideaqnvysrwginfxnr` (fkideaqnvysrwginfxnr.supabase.co)
- chess.js v1.4, react-chessboard v5.10
- Tailwind CSS v4

## Key Files
- `app/page.tsx` — Landing page (light theme, create/join game)
- `app/game/[id]/page.tsx` + `GameRoom.tsx` — Main game room
- `lib/supabase.ts` — Supabase client + `getPlayerId()` (localStorage UUID, no auth)
- `lib/game.ts` — Game logic (createGame, joinGame, submitMove, skipTurn, runJSTests)
- `types/index.ts` — Game, Problem, Turn types
- `types/supabase.ts` — Generated Supabase types

## Design System
- Light marketing: bg=#f7f3ee, text=#0f0f0d, border=#e5e1d8, Geist fonts
- Dark game: bg=#0a0a0f, accent=#4f8ef7, text=#f0f0f8, Geist Mono for code

## react-chessboard v5 API
```tsx
<Chessboard options={{
  position: fen,
  boardOrientation: "white" | "black",
  onSquareClick: ({ piece, square }) => {},
  squareStyles: { [sq]: React.CSSProperties },
  boardStyle: { width, height, borderRadius },
  lightSquareStyle: { backgroundColor: "#..." },
  darkSquareStyle: { backgroundColor: "#..." },
  allowDragging: false,
}} />
```

## DB Schema (Supabase)
- `games`: id, room_code, player_white, player_black, status, fen, current_turn, winner
- `problems`: id, title, slug, difficulty, description, examples, constraints, test_cases, starter_code
- `turns`: id, game_id, turn_number, player_color, player_id, problem_id, move_attempted, move_made, code_submitted, language, solved, time_taken_ms
- Realtime enabled on `games` and `turns` tables

## Auth Approach
No Supabase Auth — using localStorage UUID via `getPlayerId()`. No FK constraints on player columns.

## Code Execution
In-browser JS execution via `new Function()` in `runJSTests()`. No Judge0 needed.

## User Preferences
- Design: warm light (#f7f3ee) for marketing, dark (#0a0a0f) for the game room
- No emojis in code unless asked
- Concise responses
