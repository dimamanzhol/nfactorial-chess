import { Webhooks } from "@polar-sh/nextjs";
import { createClient } from "@supabase/supabase-js";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const POST = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onSubscriptionActive: async (payload) => {
    const userId = payload.data.customer.externalId;
    const customerId = payload.data.customer.id;
    if (!userId) return;
    await adminSupabase
      .from("profiles")
      .upsert({ id: userId, is_pro: true, polar_customer_id: customerId });
  },
  onSubscriptionCanceled: async (payload) => {
    const userId = payload.data.customer.externalId;
    if (!userId) return;
    await adminSupabase
      .from("profiles")
      .update({ is_pro: false })
      .eq("id", userId);
  },
  onSubscriptionRevoked: async (payload) => {
    const userId = payload.data.customer.externalId;
    if (!userId) return;
    await adminSupabase
      .from("profiles")
      .update({ is_pro: false })
      .eq("id", userId);
  },
});
