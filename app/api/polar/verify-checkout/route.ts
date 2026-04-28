import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  const checkoutId = req.nextUrl.searchParams.get("checkoutId");
  if (!checkoutId) return NextResponse.json({ error: "Missing checkoutId" }, { status: 400 });

  const res = await fetch(`https://api.polar.sh/v1/checkouts/${checkoutId}`, {
    headers: { Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}` },
  });
  if (!res.ok) return NextResponse.json({ error: "Checkout not found" }, { status: 404 });

  const checkout = await res.json();
  if (checkout.status !== "succeeded") return NextResponse.json({ isPro: false });

  const userId: string | undefined = checkout.customer_external_id;
  if (!userId) return NextResponse.json({ error: "No user ID in checkout" }, { status: 400 });

  await adminSupabase
    .from("profiles")
    .upsert({ id: userId, is_pro: true, polar_customer_id: checkout.customer_id });

  return NextResponse.json({ isPro: true });
}
