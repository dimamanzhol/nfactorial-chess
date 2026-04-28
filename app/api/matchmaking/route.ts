import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { playerId, entryId } = await req.json() as { playerId: string; entryId: string; elo: number };
    if (!playerId || !entryId) {
      return NextResponse.json({ error: "missing fields" }, { status: 400 });
    }

    const db = getServiceClient();

    // Find the oldest other waiting entry
    const { data: opponent, error: opponentErr } = await db
      .from("matchmaking")
      .select("id, player_id, elo")
      .eq("status", "waiting")
      .neq("player_id", playerId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (opponentErr) {
      console.error("[matchmaking] find opponent error:", opponentErr);
      return NextResponse.json({ error: opponentErr.message }, { status: 500 });
    }

    if (!opponent) {
      return NextResponse.json({ matched: false });
    }

    // Create the ranked game
    const roomCode = generateRoomCode();
    const { data: game, error: gameError } = await db
      .from("games")
      .insert({
        room_code: roomCode,
        player_white: opponent.player_id,
        player_black: playerId,
        status: "active",
        is_ranked: true,
        time_limit_seconds: 180,
        difficulty: "easy",
      })
      .select("id")
      .single();

    if (gameError || !game) {
      console.error("[matchmaking] create game error:", gameError);
      return NextResponse.json({ error: gameError?.message ?? "failed to create game" }, { status: 500 });
    }

    // Atomically mark opponent entry as matched
    const { data: updated, error: updateErr } = await db
      .from("matchmaking")
      .update({ status: "matched", game_id: game.id })
      .eq("id", opponent.id)
      .eq("status", "waiting")
      .select("id");

    if (updateErr) {
      console.error("[matchmaking] update opponent error:", updateErr);
    }

    if (!updated || updated.length === 0) {
      // Race condition — opponent was already matched by someone else
      await db.from("games").delete().eq("id", game.id);
      return NextResponse.json({ matched: false });
    }

    // Mark own entry as matched
    await db
      .from("matchmaking")
      .update({ status: "matched", game_id: game.id })
      .eq("id", entryId);

    return NextResponse.json({ matched: true, gameId: game.id, color: "black" });
  } catch (err) {
    console.error("[matchmaking] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
