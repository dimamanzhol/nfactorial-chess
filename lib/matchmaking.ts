import { supabase } from "./supabase";

export async function joinQueue(playerId: string, elo: number): Promise<string> {
  // Remove any stale waiting entry first
  await supabase
    .from("matchmaking")
    .delete()
    .eq("player_id", playerId)
    .eq("status", "waiting");

  const { data, error } = await supabase
    .from("matchmaking")
    .insert({ player_id: playerId, elo, status: "waiting" })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function cancelQueue(playerId: string): Promise<void> {
  await supabase
    .from("matchmaking")
    .delete()
    .eq("player_id", playerId)
    .eq("status", "waiting");
}

export async function pollForMatch(entryId: string): Promise<{ matched: boolean; gameId: string | null; color: string | null }> {
  const { data, error } = await supabase
    .from("matchmaking")
    .select("status, game_id")
    .eq("id", entryId)
    .single();

  if (error || !data) return { matched: false, gameId: null, color: null };
  if (data.status === "matched" && data.game_id) {
    return { matched: true, gameId: data.game_id as string, color: null };
  }
  return { matched: false, gameId: null, color: null };
}
