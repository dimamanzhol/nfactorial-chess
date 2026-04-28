import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { calcElo } from "@/lib/elo";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const { gameId, winner } = await req.json() as { gameId: string; winner: "white" | "black" | "draw" };
  if (!gameId || !winner) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const db = getServiceClient();

  // Fetch game
  const { data: game, error: gameErr } = await db
    .from("games")
    .select("player_white, player_black, is_ranked, elo_updated")
    .eq("id", gameId)
    .single();

  if (gameErr || !game) return NextResponse.json({ error: "game not found" }, { status: 404 });
  if (!game.is_ranked) return NextResponse.json({ error: "not a ranked game" }, { status: 400 });
  if (game.elo_updated) return NextResponse.json({ error: "elo already updated" }, { status: 409 });
  if (!game.player_white || !game.player_black) return NextResponse.json({ error: "players missing" }, { status: 400 });

  // Fetch both players' ELO
  const { data: profiles, error: profileErr } = await db
    .from("profiles")
    .select("id, elo")
    .in("id", [game.player_white, game.player_black]);

  if (profileErr || !profiles || profiles.length < 2) {
    return NextResponse.json({ error: "profiles not found" }, { status: 404 });
  }

  const whiteProfile = profiles.find((p) => p.id === game.player_white)!;
  const blackProfile = profiles.find((p) => p.id === game.player_black)!;
  const whiteElo = whiteProfile.elo as number;
  const blackElo = blackProfile.elo as number;

  const whiteScore: 0 | 0.5 | 1 = winner === "white" ? 1 : winner === "draw" ? 0.5 : 0;
  const blackScore: 0 | 0.5 | 1 = winner === "black" ? 1 : winner === "draw" ? 0.5 : 0;

  const newWhiteElo = calcElo(whiteElo, blackElo, whiteScore);
  const newBlackElo = calcElo(blackElo, whiteElo, blackScore);

  // Update both profiles and mark game as elo_updated
  await Promise.all([
    db.from("profiles").update({ elo: newWhiteElo }).eq("id", game.player_white),
    db.from("profiles").update({ elo: newBlackElo }).eq("id", game.player_black),
    db.from("games").update({ elo_updated: true }).eq("id", gameId),
  ]);

  return NextResponse.json({
    whiteElo: newWhiteElo,
    blackElo: newBlackElo,
    whiteChange: newWhiteElo - whiteElo,
    blackChange: newBlackElo - blackElo,
  });
}
