import { supabase } from "./supabase";
import type { Game, Turn, Problem } from "@/types";

export interface GameSummary extends Game {
  turn_count: number;
}

export interface TurnWithProblem extends Turn {
  problems: Problem | null;
}

export async function getUserGames(userId: string): Promise<GameSummary[]> {
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .or(`player_white.eq.${userId},player_black.eq.${userId}`)
    .eq("status", "finished")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  if (!data) return [];

  // Fetch turn counts for each game
  const gameIds = data.map((g) => g.id);
  const { data: turnCounts } = await supabase
    .from("turns")
    .select("game_id")
    .in("game_id", gameIds);

  const countMap: Record<string, number> = {};
  for (const t of turnCounts ?? []) {
    countMap[t.game_id] = (countMap[t.game_id] ?? 0) + 1;
  }

  return (data as Game[]).map((g) => ({
    ...g,
    turn_count: countMap[g.id] ?? 0,
  }));
}

export async function getGameWithTurns(
  gameId: string
): Promise<{ game: Game; turns: TurnWithProblem[] }> {
  const [gameRes, turnsRes] = await Promise.all([
    supabase.from("games").select("*").eq("id", gameId).single(),
    supabase
      .from("turns")
      .select("*, problems:problem_id(*)")
      .eq("game_id", gameId)
      .order("turn_number", { ascending: true }),
  ]);

  if (gameRes.error) throw new Error(gameRes.error.message);
  if (turnsRes.error) throw new Error(turnsRes.error.message);

  return {
    game: gameRes.data as Game,
    turns: (turnsRes.data ?? []) as unknown as TurnWithProblem[],
  };
}
