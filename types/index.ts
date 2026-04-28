export type GameStatus = "waiting" | "active" | "finished";
export type Color = "white" | "black";
export type Difficulty = "easy" | "medium" | "hard";

export interface Game {
  id: string;
  room_code: string;
  player_white: string | null;
  player_black: string | null;
  status: GameStatus;
  fen: string;
  current_turn: Color;
  winner: Color | "draw" | null;
  time_limit_seconds: number;
  difficulty: string;
  created_at: string;
  updated_at: string;
}

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  description: string;
  examples: Example[];
  constraints: string | null;
  test_cases: TestCase[];
  starter_code: Record<string, string>;
}

export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: Record<string, unknown>;
  expected: unknown;
}

export interface Turn {
  id: string;
  game_id: string;
  turn_number: number;
  player_color: Color;
  player_id: string | null;
  problem_id: string;
  move_attempted: string | null;
  move_made: string | null;
  code_submitted: string | null;
  language: string | null;
  solved: boolean | null;
  time_taken_ms: number | null;
  started_at: string;
  completed_at: string | null;
}
