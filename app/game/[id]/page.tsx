import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import GameRoom from "./GameRoom";

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
      // Use the authenticated server client so RLS allows reading own profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", data.user.id)
        .single();
      isPro = profile?.is_pro ?? false;
    }
  } catch {
    // unauthenticated or SSR issue — default to free
  }

  return <GameRoom gameId={id} isPro={isPro} />;
}
