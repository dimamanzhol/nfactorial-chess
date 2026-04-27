import { supabase } from "./supabase";
import type { Game, Problem } from "@/types";

export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

export async function createGame(playerId: string): Promise<Game> {
  const roomCode = generateRoomCode();
  const { data, error } = await supabase
    .from("games")
    .insert({
      room_code: roomCode,
      player_white: playerId,
      status: "waiting",
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
  currentTurn: "white" | "black"
): Promise<void> {
  const nextTurn = currentTurn === "white" ? "black" : "white";
  const { error } = await supabase
    .from("games")
    .update({ current_turn: nextTurn } as { current_turn: string })
    .eq("id", gameId);
  if (error) throw new Error(error.message);
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
  failedCase?: { input: unknown; expected: unknown; got: unknown };
}> {
  try {
    // @ts-expect-error — Pyodide loaded via CDN script tag
    const pyodide = await window.__pyodidePromise;

    // Extract function name from def statement
    const fnMatch = code.match(/^def\s+(\w+)\s*\(/m);
    if (!fnMatch) return { passed: false };
    const fnName = fnMatch[1];

    await pyodide.runPythonAsync(code);
    const fn = pyodide.globals.get(fnName);

    for (const tc of testCases) {
      const args = Object.values(tc.input);
      const result = fn(...args);
      // Convert Pyodide proxy to JS value if needed
      const got = result?.toJs ? result.toJs({ dict_converter: Object.fromEntries }) : result;
      if (JSON.stringify(got) !== JSON.stringify(tc.expected)) {
        return { passed: false, failedCase: { input: tc.input, expected: tc.expected, got } };
      }
    }
    return { passed: true };
  } catch {
    return { passed: false };
  }
}
