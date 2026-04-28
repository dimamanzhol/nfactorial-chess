import { supabase } from "./supabase";
import type { Game, Problem } from "@/types";

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function createGame(playerId: string, timeLimitSeconds = 180, difficulty = "easy", isRanked = false): Promise<Game> {
  const roomCode = generateRoomCode();
  const { data, error } = await supabase
    .from("games")
    .insert({
      room_code: roomCode,
      player_white: playerId,
      status: "waiting",
      time_limit_seconds: timeLimitSeconds,
      difficulty,
      is_ranked: isRanked,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Game;
}

export async function joinGame(
  roomCode: string,
  playerId: string
): Promise<Game> {
  const { data: game, error: fetchError } = await supabase
    .from("games")
    .select()
    .eq("room_code", roomCode.toUpperCase())
    .single();

  if (fetchError || !game) throw new Error("Game not found");
  if (game.status !== "waiting") throw new Error("Game already started");
  if (game.player_white === playerId) throw new Error("You created this game — share the code with a friend");

  const { data, error } = await supabase
    .from("games")
    .update({ player_black: playerId, status: "active" })
    .eq("id", game.id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Game;
}

export async function getRandomProblem(difficulty?: string): Promise<Problem> {
  let query = supabase.from("problems").select();
  if (difficulty) query = query.eq("difficulty", difficulty);

  const { data, error } = await query;
  if (error || !data?.length) throw new Error("No problems found");

  const idx = Math.floor(Math.random() * data.length);
  return data[idx] as unknown as Problem;
}

export async function submitMove(
  gameId: string,
  newFen: string,
  move: string,
  currentTurn: "white" | "black",
  winner?: string | null
): Promise<void> {
  const nextTurn = currentTurn === "white" ? "black" : "white";
  const update: Record<string, unknown> = {
    fen: newFen,
    current_turn: nextTurn,
  };
  if (winner !== undefined) {
    update.winner = winner;
    update.status = "finished";
  }
  const { error } = await supabase
    .from("games")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(update as any)
    .eq("id", gameId);
  if (error) throw new Error(error.message);
}

export async function skipTurn(
  gameId: string,
  currentTurn: "white" | "black",
  currentFen: string
): Promise<void> {
  const nextTurn = currentTurn === "white" ? "black" : "white";
  // Flip the active-color field in the FEN so chess.js on the other client
  // returns legal moves for the correct color.
  const fenParts = currentFen.split(" ");
  fenParts[1] = nextTurn === "white" ? "w" : "b";
  const newFen = fenParts.join(" ");
  const { error } = await supabase
    .from("games")
    .update({ current_turn: nextTurn, fen: newFen } as { current_turn: string; fen: string })
    .eq("id", gameId);
  if (error) throw new Error(error.message);
}

export async function recordTurn(params: {
  gameId: string;
  turnNumber: number;
  playerColor: "white" | "black";
  playerId: string;
  problemId: string;
  moveAttempted: string | null;
  moveMade: string | null;
  codeSubmitted: string | null;
  language: string;
  solved: boolean;
  timeTakenMs: number;
}): Promise<void> {
  const { error } = await supabase.from("turns").insert({
    game_id: params.gameId,
    turn_number: params.turnNumber,
    player_color: params.playerColor,
    player_id: params.playerId,
    problem_id: params.problemId,
    move_attempted: params.moveAttempted,
    move_made: params.moveMade,
    code_submitted: params.codeSubmitted,
    language: params.language,
    solved: params.solved,
    time_taken_ms: params.timeTakenMs,
    completed_at: new Date().toISOString(),
  });
  if (error) console.error("recordTurn error:", error.message);
}

/**
 * Run JavaScript code against test cases using new Function().
 * Expects the code to define a named function; calls it with each test case's args.
 */
export function runJSTests(
  code: string,
  testCases: Array<{ input: Record<string, unknown>; expected: unknown }>
): { passed: boolean; error?: string; failedCase?: { input: unknown; expected: unknown; got: unknown } } {
  try {
    const fnMatch = code.match(/function\s+(\w+)\s*\(/) ?? code.match(/(?:const|let|var)\s+(\w+)\s*=/);
    if (!fnMatch) return { passed: false, error: "No function definition found." };
    const fnName = fnMatch[1];
    // eslint-disable-next-line no-new-func
    const fn = new Function(`${code}\nreturn ${fnName};`)() as (...args: unknown[]) => unknown;
    for (const tc of testCases) {
      const args = Object.values(tc.input);
      const got = fn(...args);
      if (JSON.stringify(got) !== JSON.stringify(tc.expected)) {
        return { passed: false, failedCase: { input: tc.input, expected: tc.expected, got } };
      }
    }
    return { passed: true };
  } catch (e) {
    return { passed: false, error: String(e) };
  }
}

/**
 * Run Python code against test cases using Pyodide (in-browser WASM).
 * Expects the code to define a function; calls it with each test case's args.
 */
export async function runPyTests(
  code: string,
  testCases: Array<{ input: Record<string, unknown>; expected: unknown }>
): Promise<{
  passed: boolean;
  error?: string;
  failedCase?: { input: unknown; expected: unknown; got: unknown };
}> {
  try {
    // @ts-expect-error — Pyodide loaded via CDN script tag
    const pyodide = await window.__pyodidePromise;

    const fnMatch = code.match(/^def\s+(\w+)\s*\(/m);
    if (!fnMatch) return { passed: false, error: "No function definition found. Make sure your code starts with 'def function_name(...)'." };
    const fnName = fnMatch[1];

    await pyodide.runPythonAsync(code);

    for (const tc of testCases) {
      // Pass args as a JSON string into Python globals, then parse + unpack there.
      // This avoids all JS→Python proxy conversion issues.
      pyodide.globals.set("__args_json", JSON.stringify(Object.values(tc.input)));
      const resultJson: string = await pyodide.runPythonAsync(
        `import json as __json\n__result = ${fnName}(*__json.loads(__args_json))\n__json.dumps(__result)`
      );
      const got = JSON.parse(resultJson);
      if (JSON.stringify(got) !== JSON.stringify(tc.expected)) {
        return { passed: false, failedCase: { input: tc.input, expected: tc.expected, got } };
      }
    }
    return { passed: true };
  } catch (e) {
    return { passed: false, error: String(e) };
  }
}
