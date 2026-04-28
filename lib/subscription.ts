import { supabase } from "./supabase";

export async function getProfile(userId: string): Promise<{ is_pro: boolean; elo: number; polar_customer_id: string | null }> {
  const { data } = await supabase
    .from("profiles")
    .select("is_pro, elo, polar_customer_id")
    .eq("id", userId)
    .single();

  if (!data) return { is_pro: false, elo: 1200, polar_customer_id: null };
  return { is_pro: data.is_pro, elo: data.elo ?? 1200, polar_customer_id: data.polar_customer_id };
}
