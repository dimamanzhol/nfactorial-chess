import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import GameRoom from "./GameRoom";
import { getProfile } from "@/lib/subscription";

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let isPro = false;
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    );
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const profile = await getProfile(data.user.id);
      isPro = profile.is_pro;
    }
  } catch {
    // unauthenticated or SSR issue — default to free
  }

  return <GameRoom gameId={id} isPro={isPro} />;
}
