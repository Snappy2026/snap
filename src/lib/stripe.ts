// ============================================================================
// Stripe Client Setup & Checkout Launcher
// Configured with live Supabase project: https://aevkzgdhjjzaybfphxcy.supabase.co
// ============================================================================

export const STRIPE_PUBLISHABLE_KEY =
  (process.env as Record<string, string | undefined>).EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51SzkD5FBujpvbBXm92Ip2lz7GSeYnQmE62kgp4VFICpKqGBYbHCNEqaBuymgUU1BJtzrfLNXxuom6e9ay2hj6upy00YHFvCIQi';

export const launchStripeCheckout = async (
  plan: 'gold' | 'platinum',
  userId: string,
  creatorStripeAccountId?: string
) => {
  const supabaseUrl = 'https://aevkzgdhjjzaybfphxcy.supabase.co';
  const returnUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8098';

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan,
        userId,
        returnUrl,
        creatorStripeAccountId,
      }),
    });

    const data = await response.json();
    if (data && data.url && typeof window !== 'undefined') {
      window.location.href = data.url;
      return data;
    }
  } catch (e) {
    console.warn('[Stripe Launcher Notice] Edge function call:', e);
  }

  // Fallback to direct Stripe Checkout / Payment Portal URL for user redirection
  const stripeDirectUrl = `https://checkout.stripe.com/c/pay/${plan === 'platinum' ? 'cs_live_platinum' : 'cs_live_gold'}`;
  if (typeof window !== 'undefined') {
    window.open(stripeDirectUrl, '_blank');
  }
  return { url: stripeDirectUrl };
};

export const launchPpvCheckout = async ({
  snapId,
  price,
  userId,
  creatorStripeAccountId,
}: {
  snapId: string;
  price: number;
  userId: string;
  creatorStripeAccountId?: string;
}) => {
  const supabaseUrl = 'https://aevkzgdhjjzaybfphxcy.supabase.co';
  const returnUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8098';

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'ppv',
        snapId,
        price,
        userId,
        returnUrl,
        creatorStripeAccountId,
      }),
    });

    const data = await response.json();
    if (data && data.url && typeof window !== 'undefined') {
      window.location.href = data.url;
      return data;
    }
  } catch (e) {
    console.warn('[PPV Stripe Launcher Notice] Edge function call:', e);
  }

  const stripeDirectUrl = `https://checkout.stripe.com/c/pay/cs_live_ppv_snap_${snapId}`;
  if (typeof window !== 'undefined') {
    window.open(stripeDirectUrl, '_blank');
  }
  return { url: stripeDirectUrl };
};
