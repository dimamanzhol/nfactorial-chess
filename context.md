# ♟️ KnightCode — CONTEXT.md

> _"Chess meets LeetCode. Beat your friend on the board AND in code."_

---

## 1. What is KnightCode?

KnightCode is a **competitive multiplayer chess game where you can only make a move after solving a coding problem.**

Two players compete against each other. When it's your turn, you select your chess move — but it won't execute until you solve a LeetCode-style Easy problem in the built-in code editor. Solve it → move happens. Fail (time runs out) → you skip your turn.

This is not a chess site. This is not a LeetCode clone. It's a completely new category: **competitive coding disguised as a chess game.**

---

## 2. The Core Problem

Interview prep is boring and lonely:

- LeetCode is a grind with no stakes and no opponent
- There's no fun, competitive way to practice coding problems with friends
- Nobody trains "solving under pressure" — the hardest part of real interviews

KnightCode fixes all three. You're solving real coding problems, under a real timer, with a real opponent watching. That's pressure. That's practice.

---

## 3. Core Game Loop

```
1. Player creates a game → gets a 6-character room code (e.g. "XK92PL")
2. Shares the link with a friend → friend joins
3. Game starts — standard chess board, White moves first
4. White selects a piece and a target square
5. A coding problem appears for both players to see
6. White has 3 minutes to solve it in the built-in code editor
7. Code is executed against hidden test cases via Judge0 API
8. All test cases pass → move executes on the board ✅
9. Time runs out or wrong answer → turn is skipped ❌
10. Black's turn — same flow
11. Repeat until checkmate, stalemate, or draw
```

---

## 4. Detailed Rules

- Both players always see the **same problem** each turn
- Only the **active player** needs to solve it to make their move
- The opponent watches and waits (they can read the problem too)
- Time limit: **3 minutes per problem**
- Fail to solve → **turn is skipped**, opponent moves next
- Problems are always **Easy difficulty** to keep games fast and fun
- **Any programming language** accepted (Python, JS, Java, C++, Go, etc.)
- Code is actually **executed and tested** — not just syntax checked

---

## 5. Target Audience

| Segment           | Why they care                                           |
| ----------------- | ------------------------------------------------------- |
| CS students       | Fun way to practice interview problems with friends     |
| Junior devs       | Competitive coding with real stakes                     |
| Bootcamp students | Makes grinding LeetCode actually enjoyable              |
| Friends who code  | Something new to play together instead of regular chess |

**Primary persona:** 20-26 year old CS student who already does LeetCode but wants something more engaging and competitive.

---

## 6. Why This Works as a Product

- **Retention:** You come back to play your friend again. And again.
- **Virality:** "Bro play this with me" is the entire marketing strategy
- **Real skill building:** You're actually solving coding problems under pressure
- **Novel:** Nobody has built this. It's a genuinely new idea.
- **Simple to explain:** One sentence — "Chess but you solve LeetCode to move"

---

## 7. Tech Stack

| Layer          | Technology              | Why                                           |
| -------------- | ----------------------- | --------------------------------------------- |
| Framework      | Next.js 14 (App Router) | SSR, API routes, routing all in one           |
| Styling        | Tailwind CSS            | Fast, consistent, dark theme                  |
| Chess Logic    | `chess.js`              | Handles all rules, move validation, checkmate |
| Chess UI       | `react-chessboard`      | Customizable board component                  |
| Code Editor    | Monaco Editor           | VS Code in the browser                        |
| Code Execution | Judge0 API (free tier)  | Runs code, checks test cases                  |
| Multiplayer    | Supabase Realtime       | WebSocket channels, no extra server           |
| Auth           | Supabase Auth           | Google OAuth + email                          |
| Database       | Supabase PostgreSQL     | Games, users, problems, turns                 |
| Deployment     | Vercel                  | Instant deploy, Next.js native                |
| Payments       | Polar.sh                | No Stripe needed                              |

---

## 8. Database Schema

### `users`

```sql
id uuid primary key
email text
username text
avatar_url text
games_played int default 0
games_won int default 0
problems_solved int default 0
avg_solve_time float default 0
created_at timestamp
```

### `games`

```sql
id uuid primary key
room_code text unique          -- 6 char code e.g. "XK92PL"
player_white uuid references users(id)
player_black uuid references users(id)
status text                    -- 'waiting' | 'active' | 'finished'
current_fen text               -- current board state
current_turn text              -- 'white' | 'black'
current_problem_id uuid        -- active problem for this turn
winner uuid references users(id)
pgn text                       -- full game notation
created_at timestamp
```

### `problems`

```sql
id uuid primary key
title text
description text
examples jsonb                 -- [{input, output, explanation}]
constraints text
test_cases jsonb               -- [{input, expected_output}] hidden from user
difficulty text default 'easy'
tags text[]                    -- ['array', 'hashmap', 'string', etc.]
```

### `turns`

```sql
id uuid primary key
game_id uuid references games(id)
player_id uuid references users(id)
problem_id uuid references problems(id)
move_from text                 -- e.g. 'e2'
move_to text                   -- e.g. 'e4'
code_submitted text
language text
solved boolean
solve_time_seconds int
created_at timestamp
```

---

## 9. Multiplayer Architecture

Using **Supabase Realtime** channels. Channel: `game:{room_code}`

### Events:

```javascript
// Player joined the room
{ type: 'player_joined', player: { id, username, color } }

// Active player selected a move, problem appears for both
{ type: 'move_attempted', from: 'e2', to: 'e4', problem_id: '...' }

// Active player solved the problem — move executes
{ type: 'move_confirmed', from: 'e2', to: 'e4', fen: '...', pgn: '...' }

// Active player failed — turn skipped
{ type: 'move_failed', next_turn: 'black' }

// Game over
{ type: 'game_over', result: 'checkmate', winner: 'white' }
```

All game state also persisted to Supabase DB — handles reconnections gracefully.

---

## 10. Code Execution via Judge0

API: `https://judge0-ce.p.rapidapi.com`

```javascript
// Submit code
POST /submissions
{
  source_code: base64(userCode),
  language_id: 71,   // Python=71, JS=63, Java=62, C++=54
  stdin: base64(testInput)
}

// Poll result
GET /submissions/{token}
// status_id: 3=Accepted, 4=Wrong Answer, 5=Time Limit, 6=Compile Error

// Run against ALL test cases
// All pass → move confirmed
// Any fail → show which test failed, player can retry until timer runs out
```

---

## 11. Key Pages & Routes

| Route              | Description                                   |
| ------------------ | --------------------------------------------- |
| `/`                | Landing page — hero, how it works, CTA        |
| `/lobby`           | Create game or join with room code            |
| `/game/[roomCode]` | The actual game — chess board + problem modal |
| `/profile`         | Stats, game history, win rate                 |
| `/leaderboard`     | Global rankings + filter by city              |

---

## 12. Game Page Layout

```
┌──────────────────────────────────────────────────────────┐
│  KnightCode ♟          Room: XK92PL          ⏱ 02:34   │
├─────────────────────────┬────────────────────────────────┤
│                         │  👤 You (White)                │
│    [CHESS BOARD]        │  vs                            │
│                         │  👤 Alex (Black)               │
│                         │  ──────────────────────────    │
│                         │  Alex is solving...            │
│  ♟♟♙ captured           │  ──────────────────────────    │
│                         │  Move history:                 │
│                         │  1. e4 ✅   e5 ✅              │
│                         │  2. Nf3 ❌  d6 ✅              │
└─────────────────────────┴────────────────────────────────┘
```

### Problem Modal (when player selects a move):

```
┌──────────────────────────────────────────────────────────┐
│  ⚡ Solve to make your move              ⏱ 02:59        │
│  ────────────────────────────────────────────────────    │
│  Two Sum                                      Easy 🟢    │
│                                                          │
│  Given an array nums and target, return indices          │
│  of two numbers that add up to target.                   │
│                                                          │
│  Example: nums=[2,7,11,15], target=9 → [0,1]            │
│  ────────────────────────────────────────────────────    │
│  Language: [Python ▾]                                    │
│  ┌────────────────────────────────────────────────┐     │
│  │ def twoSum(nums, target):                       │     │
│  │     # your solution here                        │     │
│  └────────────────────────────────────────────────┘     │
│                                                          │
│  [Run Tests]                   [Submit & Make Move]      │
│                                                          │
│  ✅ Test 1 passed    ❌ Test 2 failed                    │
└──────────────────────────────────────────────────────────┘
```

---

## 13. Design System

### Aesthetic Direction

Dark, clean, competitive. Think LeetCode meets Chess.com. Professional but with energy. Every pixel should say "this is serious, you are being tested."

### Color Palette

```css
--bg-primary: #0a0a0f --bg-secondary: #111118 --bg-card: #16161f
  --border: #2a2a3a --accent: #4f8ef7 /* primary blue — CTA, highlights */
  --accent-green: #22c55e /* solved / success / ✅ */ --accent-red: #ef4444
  /* failed / skipped / ❌ */ --accent-yellow: #f59e0b /* timer warning */
  --text-primary: #f0f0f8 --text-secondary: #9090a8 --text-muted: #55556a;
```

### Typography

```css
--font-display:
  "DM Sans", sans-serif --font-body: "Inter",
  sans-serif --font-mono: "JetBrains Mono",
  monospace /* code editor, move notation */;
```

### UI Details

- Timer turns yellow under 60s, red under 30s
- Move history shows ✅ (solved) or ❌ (skipped) per move
- Opponent status always visible: "Solving...", "Waiting for you", "Thinking..."
- Chess board: warm wood tones (not default blue/gray)
- Problem modal: slide up from bottom on mobile, side panel on desktop
- Typing indicator when opponent is coding

---

## 14. Monetization

**Polar.sh** for payments (no Stripe needed).

| Plan | Price | What you get                                                                             |
| ---- | ----- | ---------------------------------------------------------------------------------------- |
| Free | $0    | 5 games/day, Easy problems, basic stats                                                  |
| Pro  | $7/mo | Unlimited games, Medium + Hard modes, full analytics, custom board themes, games history |

"Upgrade to Pro" button visible in nav from day one.

---

## 15. Seed Problems (minimum 20)

Start with these classics, all Easy:

- Two Sum
- Valid Palindrome
- Reverse String
- FizzBuzz
- Contains Duplicate
- Maximum Subarray (Kadane's)
- Merge Two Sorted Lists
- Valid Parentheses
- Best Time to Buy and Sell Stock
- Climbing Stairs
- Binary Search
- First Bad Version
- Majority Element
- Move Zeroes
- Reverse Linked List
- Missing Number
- Single Number
- Intersection of Two Arrays
- Squares of Sorted Array
- Running Sum of 1D Array

---

## 16. Build Priority Order

1. Supabase setup — tables + realtime config
2. Chess board with move selection (chess.js + react-chessboard)
3. Problem modal with Monaco editor
4. Judge0 code execution + test case validation
5. Multiplayer sync via Supabase Realtime
6. Full game flow: move attempt → problem → solve/fail → next turn
7. Landing page + lobby (create/join room)
8. Profile page + leaderboard
9. Auth (Supabase Google OAuth)
10. Pro upgrade button (Polar.sh)

---

## 17. What Makes This "Великий" Level

1. **Completely unique** — nobody has built this combination before
2. **One sentence pitch** — "Chess but you solve LeetCode to move" — instantly understood
3. **Real skill building** — actually improves coding under pressure
4. **Viral by design** — "play me on KnightCode" is the whole growth loop
5. **Genuine fun** — not just educational, actually enjoyable to play
6. **Clear monetization** — Free → Pro with real upsell reason
7. **Memorable** — out of 100 submissions, judges will remember this one

---

## 18. README Summary (for submission)

**KnightCode** — _Chess meets LeetCode. Beat your friend on the board AND in code._

A multiplayer chess game where you can only make a move after solving a coding problem. Challenge a friend via shared link, solve LeetCode-style problems under time pressure to make your chess moves, and win both the game and the coding battle.

**Built with:** Next.js 14, Supabase, Judge0 API, Monaco Editor, chess.js, Polar.sh, Vercel

**For:** CS students and developers who want a fun, competitive way to practice coding problems with friends — with real stakes, real pressure, and real skill building.

**Why it's valuable:** LeetCode is a solo grind. KnightCode makes coding practice competitive, social, and actually fun.

---

_Built for nFactorial Incubator 2026 — Phase 2 Technical Challenge_
