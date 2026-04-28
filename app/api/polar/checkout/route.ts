import { Checkout } from "@polar-sh/nextjs";

export const GET = Checkout({
  accessToken: process.env.POLAR_ACCESS_TOKEN!,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing?success=true`,
  server: "production",
});
// Usage: GET /api/polar/checkout?products=PRODUCT_ID&customerEmail=EMAIL&customerExternalId=USER_ID
