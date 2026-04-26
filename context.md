# ♟️ KnightCode — CONTEXT.md

> _"The best engineers think like chess players. Now you can train like one."_

---

## 1. What is KnightCode?

KnightCode is a **BigTech interview simulator** disguised as a chess platform.

It combines chess puzzles with a live AI interviewer that talks to you while you solve problems — exactly like a real technical interview at Google, Meta, Amazon, or Apple.

You don't just solve a puzzle. You explain your thinking, respond to follow-up questions, handle pressure, and get evaluated on your logic AND your communication — just like a real interview.

**This is not a chess site. This is a career tool.**

---

## 2. The Core Problem

Coding interview prep is broken:

- LeetCode gives you problems but no human feedback
- Mock interviews are expensive ($100-300/session)
- Nobody trains the "explain your thinking" muscle — the hardest part of real interviews

Chess is the perfect proxy for algorithmic thinking:

- Pattern recognition
- Multiple steps ahead thinking
- Decision making under pressure
- Explaining your reasoning out loud

**KnightCode merges both worlds.**

---

## 3. The Core Experience

### What happens in a session:

```
1. User picks a company (Google / Meta / Amazon / Apple)
2. UI transforms into a mock interview room — clean, professional, slightly tense
3. AI Interviewer appears (avatar + name: "Alex from Google")
4. Chess puzzle loads on screen + timer starts (15-20 min)
5. AI speaks first: "Hi! Let's get started. Take a look at the board.
   What's your initial assessment?"
6. User types their thinking + makes moves on the board
7. AI reacts in real-time:
   - "Interesting. Why did you prioritize that piece?"
   - "What alternatives did you consider?"
   - "You have 5 minutes left — how are you feeling about your approach?"
   - "That was a mistake — can you recover? Walk me through your thinking."
8. Game ends → AI gives full structured debrief:
   - Logic & problem solving score
   - Communication score
   - Speed & pressure handling
   - What Google/Meta would think of this performance
   - Specific tips to improve
```

---

## 4. Target Audience

| Segment                               | Why they care                                             |
| ------------------------------------- | --------------------------------------------------------- |
| CS students preparing for internships | Need mock interview practice, can't afford coaches        |
| Junior devs applying to BigTech       | Want to feel what a real interview is like                |
| Self-taught developers                | No university career center to help them prep             |
| International students                | Practice English + technical communication simultaneously |

**Primary persona:** 20-26 year old CS student or junior dev who has LeetCode but has never done a real mock interview and is terrified of the communication part.

---

## 5. Why Chess Specifically?

Chess puzzles are perfect interview proxies because:

- ✅ They have a **clear optimal solution** (like algorithms)
- ✅ They require **multi-step thinking** (like system design)
- ✅ They create **time pressure** (like real interviews)
- ✅ They are **language-agnostic** (no coding syntax barrier)
- ✅ They are **visually engaging** (unlike staring at code)
- ✅ The interviewer can ask "why this move?" just like "why this approach?"

Chess puzzles map directly to interview skills:

| Chess                  | Interview                     |
| ---------------------- | ----------------------------- |
| Find the winning move  | Find the optimal solution     |
| Explain why Nf3        | Explain your algorithm choice |
| Recover from a blunder | Debug under pressure          |
| Think 5 moves ahead    | Plan system architecture      |

---

## 6. Company Modes

Each company has a different interviewer personality and focus:

### 🔵 Google

- Interviewer: **Alex** — friendly but precise
- Focus: Optimal solution, time complexity thinking
- Style: "That works, but is there a more elegant approach?"
- Puzzle type: Complex tactical puzzles requiring deep calculation

### 🟣 Meta

- Interviewer: **Jordan** — fast-paced, product-minded
- Focus: Speed + impact, "does it ship?"
- Style: "Good. Now do it faster. What's the bottleneck?"
- Puzzle type: Mid-complexity puzzles under tight time pressure

### 🟠 Amazon

- Interviewer: **Sam** — leadership principles focused
- Focus: Decision making + communication
- Style: "Walk me through your reasoning. What would you do differently?"
- Puzzle type: Endgame scenarios requiring clear strategic thinking

### 🍎 Apple

- Interviewer: **Riley** — design-minded, detail obsessed
- Focus: Clarity of thought, elegance of solution
- Style: "Why this and not that? Convince me."
- Puzzle type: Opening puzzles about fundamentals done perfectly

---

## 7. AI Interviewer — How It Works

The AI interviewer is powered by **Claude API** with a carefully crafted system prompt.

### System Prompt:

```
You are {name}, a senior engineer at {company} conducting a technical interview.

Your personality: {company_personality}

You are interviewing a candidate solving a chess puzzle as a proxy for
algorithmic thinking.

Current board state (FEN): {fen}
Optimal solution: {solution_moves}
Candidate's last move: {last_move}
Time remaining: {time_left}

Your job:
- Ask questions about their thinking process
- React to their moves (praise good ones, probe bad ones)
- Create realistic interview pressure without being cruel
- Never give away the answer directly
- Ask follow-up questions like a real interviewer would
- If they make a mistake, ask them to explain their reasoning first

Keep responses SHORT (2-3 sentences max). This is a conversation, not a lecture.
Stay in character as {name} from {company} at all times.
```

### Real-time interaction triggers:

- After every move → Claude evaluates and responds
- Every 5 minutes → time pressure check-in
- On wrong moves → probing questions
- On good moves → brief praise + harder follow-up
- Final 2 minutes → "you're running out of time" pressure

---

## 8. Post-Interview Debrief

After the session, Claude generates a **structured performance report**:

```
Interview Debrief — Google Mock Interview
Overall Score: 73/100 — "Strong Hire with coaching"

Problem Solving: 8/10
You found the key tactical motif quickly. Your calculation was accurate
up to move 4, where you missed the defensive resource.

Communication: 6/10
You explained your first three moves clearly but went silent under
pressure. Real interviewers notice when candidates stop talking.

Pressure Handling: 7/10
You recovered well from the blunder on move 6. Good sign.

What Google would think:
"Promising candidate. Shows strong pattern recognition but needs to work
on communicating uncertainty. Would recommend another round."

Top 3 things to improve:
1. Keep talking even when you don't know the answer
2. Always state time complexity of your approach
3. Ask clarifying questions before diving in
```

This debrief is **shareable** — users post it on LinkedIn:

> "Just completed a Google mock interview on KnightCode. Score: 73/100. Working on it 💪"

---

## 9. Progression System

Users level up through interview rounds:

| Level | Title            | Unlocks                         |
| ----- | ---------------- | ------------------------------- |
| 1     | Intern Candidate | Basic puzzles, one company      |
| 2     | New Grad         | All 4 companies, medium puzzles |
| 3     | L3 Engineer      | Hard puzzles, timed sprints     |
| 4     | Senior Engineer  | System design chess scenarios   |
| 5     | Staff Engineer   | Custom interview scenarios      |

---

## 10. Viral / Social Layer

### LinkedIn Share Card

After each session a beautiful card generates:

```
🎯 Mock Interview Complete
Company: Google
Score: 73/100
Level: L3 Engineer
"Strong Hire with coaching"

Practiced on KnightCode.com
```

### Leaderboard

- Global leaderboard by score
- Filter by company (Who's the best Google candidate?)
- Filter by city (Top candidates in Almaty 🇰🇿)
- Weekly tournaments during hiring season

---

## 11. Monetization

Using **Polar.sh** (no Stripe needed).

| Plan  | Price  | What you get                                                                              |
| ----- | ------ | ----------------------------------------------------------------------------------------- |
| Free  | $0     | 3 mock interviews/day, 2 companies, basic debrief                                         |
| Pro   | $9/mo  | Unlimited interviews, all 4 companies, full AI debrief, LinkedIn cards, progress tracking |
| Teams | $29/mo | For bootcamps / universities — track student progress, custom puzzles                     |

**"Upgrade to Pro"** button visible from day one.

The Teams plan is the real money — bootcamps and CS departments will pay for this.

---

## 12. Tech Stack

| Layer           | Technology              | Why                                        |
| --------------- | ----------------------- | ------------------------------------------ |
| Framework       | Next.js 14 (App Router) | SSR, API routes, routing all in one        |
| Styling         | Tailwind CSS            | Fast, consistent                           |
| Chess Logic     | `chess.js`              | Handles all rules, puzzle validation       |
| Chess UI        | `react-chessboard`      | Customizable board component               |
| AI Interviewer  | Anthropic Claude API    | Best conversational AI, stays in character |
| Puzzle Database | Supabase PostgreSQL     | Categorized by difficulty + company        |
| Auth            | Supabase Auth           | Email + Google OAuth                       |
| Database        | Supabase PostgreSQL     | Users, sessions, scores, progress          |
| Deployment      | Vercel                  | Instant deploy, Next.js native             |
| Payments        | Polar.sh                | Works without Stripe                       |

---

## 13. Database Schema

### `users`

```sql
id uuid primary key
email text
username text
avatar_url text
level int default 1
total_sessions int default 0
avg_score float default 0
created_at timestamp
```

### `puzzles`

```sql
id uuid primary key
fen text                    -- board position
solution_moves text[]       -- correct moves in UCI format
difficulty text             -- 'easy' | 'medium' | 'hard'
company text                -- 'google' | 'meta' | 'amazon' | 'apple' | 'any'
theme text                  -- 'tactics' | 'endgame' | 'opening'
rating int
```

### `sessions`

```sql
id uuid primary key
user_id uuid references users(id)
puzzle_id uuid references puzzles(id)
company text
interviewer_name text
moves_played text[]
conversation jsonb           -- full AI conversation history
score_problem_solving int
score_communication int
score_pressure int
score_total int
debrief text
completed_at timestamp
```

---

## 14. Key Pages & Routes

| Route                  | Description                                                   |
| ---------------------- | ------------------------------------------------------------- |
| `/`                    | Landing page — professional, career-focused, slightly intense |
| `/companies`           | Pick your company to interview with                           |
| `/interview/[company]` | Live mock interview session                                   |
| `/debrief/[sessionId]` | Post-interview performance report                             |
| `/profile`             | User profile, history, scores, level                          |
| `/leaderboard`         | Global + company + city rankings                              |

---

## 15. Design System

### Aesthetic Direction

**Professional dark mode** — think Linear meets LeetCode meets a high-stakes interview room.

Clean, minimal, slightly tense. Every design decision should make the user feel like they're in a real interview. This is not a game UI — it's a professional tool.

### Color Palette

```css
--bg-primary: #0a0a0f /* Near-black, slightly cool */ --bg-secondary: #111118
  /* Card backgrounds */ --bg-card: #16161f /* Elevated surfaces */
  --border: #2a2a3a /* Subtle borders */ --accent-blue: #4f8ef7
  /* Primary CTA */ --accent-green: #22c55e /* Success / correct move */
  --accent-red: #ef4444 /* Error / wrong move */ --accent-yellow: #f59e0b
  /* Warning / time running out */ --text-primary: #f0f0f8 /* Near white */
  --text-secondary: #9090a8 /* Muted */ --text-muted: #55556a /* Very subtle */
  /* Company colors */ --google: #4f8ef7 --meta: #7c4dff --amazon: #ff9900
  --apple: #a8a8b3;
```

### Typography

```css
--font-display:
  "DM Sans", sans-serif /* Headings — modern, clean */ --font-body: "Inter",
  sans-serif /* Body — readable, professional */ --font-mono: "JetBrains Mono",
  monospace /* Move notation */;
```

### Interview Room Layout

```
┌─────────────────────────────────────────────────────┐
│  🔵 Google Interview — Alex              ⏱ 12:34   │
├──────────────────────┬──────────────────────────────┤
│                      │  Alex from Google             │
│   [CHESS BOARD]      │  ─────────────────────────   │
│                      │  "Interesting choice. Why     │
│                      │   did you move the knight     │
│                      │   there instead of pushing    │
│                      │   the pawn?"                  │
│                      │                               │
│                      │  ─────────────────────────   │
│  Captured pieces     │  Your response:               │
│  ♟♟♙                │  [___________________________]│
│                      │              [Send]           │
└──────────────────────┴──────────────────────────────┘
```

### UI Principles

- **Professional tension** — UI should feel like you're being evaluated
- **Minimal distractions** — during interview, only board + chat visible
- **Clear feedback** — green/red immediately on moves
- **Timer always visible** — creates real pressure
- **Interviewer feels human** — avatar, name, company logo, typing indicator

---

## 16. What Makes This "Великий" Level

1. **Genuinely unique concept** — nobody else is doing this. Not Chess.com, not LeetCode, not any interview prep platform
2. **Real pain point** — mock interviews cost $100-300/session. This makes it accessible to everyone
3. **Not just chess** — it's a career tool. TAM is every CS student on earth
4. **AI used meaningfully** — Claude doesn't just generate text, it conducts a live interview
5. **Retention built-in** — users come back to level up and prep for real interviews
6. **Viral mechanic** — LinkedIn debrief cards get shared organically
7. **Clear monetization** — Free → Pro → Teams funnel with real B2B potential
8. **Judges will remember it** — out of 100 submissions, this is the only one that is a career tool

---

## 17. README Summary (for submission)

**KnightCode** — _Train for BigTech interviews. One chess puzzle at a time._

A mock interview simulator that uses chess puzzles as a proxy for algorithmic thinking. Pick a company (Google, Meta, Amazon, Apple), get matched with an AI interviewer, solve a puzzle under time pressure while explaining your thinking — then receive a structured performance debrief.

**Built with:** Next.js 14, Supabase, Anthropic Claude API, chess.js, Polar.sh, Vercel

**For:** CS students and junior developers preparing for BigTech interviews who need affordable mock interview practice with real feedback — not just on their solutions, but on how they communicate under pressure.

**Why it's valuable:** LeetCode trains your coding. KnightCode trains your thinking and communication under pressure — the part that actually gets you the offer.

---

_Built for nFactorial Incubator 2026 — Phase 2 Technical Challenge_
