// ============================================================================
// Supabase Edge Function: stripe-checkout
// Creates a Stripe Checkout Session for VIP Memberships ($9.99/mo or $99/yr).
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: "STRIPE_SECRET_KEY environment variable is missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { plan, userId, returnUrl, creatorStripeAccountId } = await req.json();

    const priceAmount = plan === "platinum" ? 9900 : 999; // $99.00 or $9.99 in cents
    const planName = plan === "platinum" ? "Snapchat VIP Annual Membership" : "Snapchat VIP Gold Monthly";

    // Create Stripe Checkout Session with Direct Payout to Creator's Connected Account
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: planName,
              description: "Full access to private stories, exclusive snaps, and VIP badge.",
            },
            unit_amount: priceAmount,
            recurring: { interval: plan === "platinum" ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      client_reference_id: userId,
      subscription_data: creatorStripeAccountId
        ? {
            transfer_data: {
              destination: creatorStripeAccountId,
            },
          }
        : undefined,
      success_url: returnUrl ? `${returnUrl}?vip_success=true` : "http://localhost:8098/?vip_success=true",
      cancel_url: returnUrl ? `${returnUrl}?vip_cancel=true` : "http://localhost:8098/?vip_cancel=true",
    });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
