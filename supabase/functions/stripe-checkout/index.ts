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

    const { plan, userId, returnUrl, creatorStripeAccountId, type, snapId, price } = await req.json();

    const isPpv = type === "ppv";
    const priceAmount = isPpv ? Math.round((price || 1.99) * 100) : (plan === "platinum" ? 9900 : 999);
    const planName = isPpv
      ? `Adult+ Pay-Per-View Locked Snap (#${snapId || "ppv"})`
      : plan === "platinum"
      ? "Adult+ VIP Annual Membership"
      : "Adult+ VIP Gold Monthly";

    const lineItemPriceData: any = {
      currency: "usd",
      product_data: {
        name: planName,
        description: isPpv
          ? "Instant 1-tap unlock for premium creator photo/video snap."
          : "Full access to private stories, exclusive snaps, and VIP badge.",
      },
      unit_amount: priceAmount,
    };

    if (!isPpv) {
      lineItemPriceData.recurring = { interval: plan === "platinum" ? "year" : "month" };
    }

    // Create Stripe Checkout Session (Supports both Subscription & Pay-Per-View Single Payment)
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: lineItemPriceData,
          quantity: 1,
        },
      ],
      mode: isPpv ? "payment" : "subscription",
      client_reference_id: userId,
      payment_intent_data: isPpv && creatorStripeAccountId
        ? {
            application_fee_amount: Math.round(priceAmount * 0.05), // 5% Admin fee on PPV snap
            transfer_data: {
              destination: creatorStripeAccountId,
            },
          }
        : undefined,
      subscription_data: !isPpv && creatorStripeAccountId
        ? {
            application_fee_percent: 5, // 5% Admin fee on subscription
            transfer_data: {
              destination: creatorStripeAccountId,
            },
          }
        : undefined,
      success_url: returnUrl ? `${returnUrl}?ppv_success=true&snap_id=${snapId || ''}` : "http://localhost:8098/?ppv_success=true",
      cancel_url: returnUrl ? `${returnUrl}?ppv_cancel=true` : "http://localhost:8098/?ppv_cancel=true",
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
