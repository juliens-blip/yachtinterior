import { createClient, createServiceClient } from './supabase-server';

export async function hasActiveSubscription(accessToken?: string): Promise<boolean> {
  const supabase = await createClient(
    accessToken ? { accessToken } : undefined
  );
  const { data: { user } } = accessToken
    ? await supabase.auth.getUser(accessToken)
    : await supabase.auth.getUser();

  if (!user) return false;

  const { data } = await supabase
    .from('subscriptions')
    .select('status, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return false;

  // Active subscription
  if (data.status === 'active' || data.status === 'trialing') return true;

  // Canceled but still in valid period
  if (data.status === 'canceled' && data.current_period_end) {
    return new Date(data.current_period_end) > new Date();
  }

  // Past due (grace period - 3 days)
  if (data.status === 'past_due' && data.current_period_end) {
    const gracePeriod = new Date(data.current_period_end);
    gracePeriod.setDate(gracePeriod.getDate() + 3);
    return gracePeriod > new Date();
  }

  return false;
}

export async function upsertSubscription(
  userId: string,
  stripeCustomerId: string,
  subscriptionData: any
) {
  const supabase = createServiceClient();

  const payload = {
    user_id: userId,
    stripe_customer_id: stripeCustomerId,
    ...subscriptionData,
    updated_at: new Date().toISOString(),
  };

  const attemptUpsert = async (body: Record<string, any>) => {
    return supabase
      .from('subscriptions')
      .upsert(body, {
        onConflict: 'user_id'
      });
  };

  // Try with all fields (including email). If the schema in prod doesn't yet have "email",
  // fall back by removing it to avoid PGRST204 "column not found".
  let { error } = await attemptUpsert(payload);
  if (error && (error as any).code === 'PGRST204') {
    const { email, ...rest } = payload as any;
    const retry = await attemptUpsert(rest);
    error = retry.error;
  }

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }
}
