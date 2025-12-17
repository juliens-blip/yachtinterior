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
    .single();

  if (!data) return false;

  // Active subscription
  if (data.status === 'active') return true;

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

  const { error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      ...subscriptionData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id'
    });

  if (error) {
    console.error('Error upserting subscription:', error);
    throw error;
  }
}
