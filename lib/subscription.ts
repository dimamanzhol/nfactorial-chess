import { supabase } from "./supabase";

export async function getProfile(userId: string): Promise<{ is_pro: boolean; polar_customer_id: string | null }> {
  const { data } = await supabase
    .from("profiles")
    .select("is_pro, polar_customer_id")
    .eq("id", userId)
    .single();

  if (!data) return { is_pro: false, polar_customer_id: null };
  return { is_pro: data.is_pro, polar_customer_id: data.polar_customer_id };
}
