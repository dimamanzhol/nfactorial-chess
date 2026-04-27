import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/supabase";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

let _client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabase() {
  if (!_client) {
    // createBrowserClient stores the session in cookies so the proxy can read it
    _client = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
  }
  return _client;
}

export const supabase = getSupabase();

/** Get the authenticated user's ID, or a random UUID as fallback. */
export async function getPlayerId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? crypto.randomUUID();
}

export async function signOut() {
  await supabase.auth.signOut();
}
