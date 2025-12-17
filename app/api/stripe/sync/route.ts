import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/app/lib/stripe';
import { upsertSubscription } from '@/app/lib/subscription';
import { createClient } from '@/app/lib/supabase-server';

// Ensure server runtime + no caching for webhook-style sync
export const dynamic = 'force-dynamic';

type SyncPayload = {
  session_id?: string;
};

export async function POST(request: NextRequest) {
  try {
    const { session_id: sessionId }: SyncPayload = await request.json();
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.toLowerCase().startsWith('bearer ')
      ? authHeader.slice(7)
      : undefined;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Missing session_id' },
        { status: 400 }
      );
    }

    // Validate authenticated Supabase user
    const supabase = await createClient({ accessToken });
    const { data: { user }, error: authError } = accessToken
      ? await supabase.auth.getUser(accessToken)
      : await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Retrieve checkout session + expand subscription/customer to avoid extra calls
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    const subscriptionData = session.subscription as Stripe.Subscription | string | null;
    if (!subscriptionData) {
      return NextResponse.json(
        { error: 'No subscription found for this session' },
        { status: 404 }
      );
    }

    type SubscriptionWithPeriods = Stripe.Subscription & {
      current_period_start?: number | null;
      current_period_end?: number | null;
      canceled_at?: number | null;
    };

    const subscription: SubscriptionWithPeriods = typeof subscriptionData === 'string'
      ? await stripe.subscriptions.retrieve(subscriptionData)
      : subscriptionData;

    const targetUserId =
      subscription.metadata?.supabase_user_id ||
      session.metadata?.supabase_user_id ||
      user.id;

    if (targetUserId !== user.id) {
      // Prevent cross-account pollution
      return NextResponse.json(
        { error: 'Session does not belong to this user' },
        { status: 403 }
      );
    }

    const firstItem = subscription.items.data[0];
    const customerId = (session.customer as string) || (subscription.customer as string);

    const customerEmail =
      session.customer_details?.email ||
      (typeof session.customer === 'object' && session.customer
        ? (session.customer as Stripe.Customer).email ?? undefined
        : undefined);

    const toIso = (ts?: number | null) =>
      ts ? new Date(ts * 1000).toISOString() : null;

    await upsertSubscription(targetUserId, customerId, {
      stripe_subscription_id: subscription.id,
      stripe_price_id: firstItem?.price?.id,
      status: subscription.status,
      current_period_start: toIso(subscription.current_period_start),
      current_period_end: toIso(subscription.current_period_end),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: toIso(subscription.canceled_at),
      email: customerEmail,
    });

    return NextResponse.json({ status: 'synced' });
  } catch (error) {
    console.error('[SYNC] Error syncing subscription from session:', error);
    return NextResponse.json(
      { error: 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}
