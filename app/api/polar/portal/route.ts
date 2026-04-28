import { CustomerPortal } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const GET = CustomerPortal({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  getCustomerId: async (req) => {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    if (!userId) return "";

    const { data } = await adminSupabase
      .from("profiles")
      .select("polar_customer_id")
      .eq("id", userId)
      .single();

    return data?.polar_customer_id ?? "";
  },
  returnUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  server: "production",
});
