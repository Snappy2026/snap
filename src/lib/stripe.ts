// ============================================================================
// Stripe Client Setup & Checkout Launcher
// Configured with live Supabase project: https://aevkzgdhjjzaybfphxcy.supabase.co
// ============================================================================

export const STRIPE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  'pk_live_51SzkD5FBujpvbBXm92Ip2lz7GSeYnQmE62kgp4VFICpKqGBYbHCNEqaBuymgUU1BJtzrfLNXxuom6e9ay2hj6upy00YHFvCIQi';

export const launchStripeCheckout = async (plan: 'gold' | 'platinum', userId: string) => {
  const priceAmount = plan === 'platinum' ? 9900 : 999;
  const supabaseUrl = 'https://aevkzgdhjjzaybfphxcy.supabase.co';

  // Call Supabase Edge Function to generate Stripe Checkout Session
  const response = await fetch(`${supabaseUrl}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan,
      userId,
      returnUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8098',
    }),
  });

  const data = await response.json();
  if (data.url && typeof window !== 'undefined') {
    window.location.href = data.url;
  }
  return data;
};
