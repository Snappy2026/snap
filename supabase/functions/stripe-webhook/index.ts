// ============================================================================
// Supabase Edge Function: stripe-webhook
// Listens to Stripe Webhooks and updates Supabase profiles (is_vip_member = true).
// ============================================================================

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

serve(async (req: Request) => {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get("stripe-signature");
    const bodyText = await req.text();

    let event;
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(bodyText, signature, webhookSecret);
    } else {
      event = JSON.parse(bodyText);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Handle Payment Complete event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.client_reference_id;

      if (userId) {
        console.log(`[Stripe Webhook] Unlocking VIP for user ${userId}`);
        await supabaseAdmin
          .from("profiles")
          .update({
            is_vip_member: true,
            vip_tier: "vip_gold",
            vip_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
          })
          .eq("id", userId);
      }
    }

    // Handle Subscription Canceled event
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      console.log(`[Stripe Webhook] Subscription ended for customer ${customerId}`);
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 400 });
  }
});
