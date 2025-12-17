import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { upsertSubscription } from '@/app/lib/subscription';
import Stripe from 'stripe';

// Force dynamic rendering - prevent static generation during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  // Verify webhook signature
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  console.log(`Received webhook: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.supabase_user_id;

          if (!userId) {
            throw new Error('No supabase_user_id in session metadata');
          }

          // Fetch full subscription details
          const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId);
          const {
            id: subId,
            items,
            status: subStatus,
            current_period_start,
            current_period_end,
            cancel_at_period_end: cancelAtPeriodEnd,
            canceled_at
          } = subscriptionResponse as any;

          await upsertSubscription(userId, customerId, {
            stripe_subscription_id: subId,
            stripe_price_id: items.data[0].price.id,
            status: subStatus,
            current_period_start: new Date(current_period_start * 1000).toISOString(),
            current_period_end: new Date(current_period_end * 1000).toISOString(),
            cancel_at_period_end: cancelAtPeriodEnd,
            canceled_at: canceled_at
              ? new Date(canceled_at * 1000).toISOString()
              : null,
          });

          console.log(`Subscription created for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata.supabase_user_id;

        if (!userId) {
          console.warn('No supabase_user_id in subscription metadata');
          break;
        }

        await upsertSubscription(userId, customerId, {
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        });

        console.log(`Subscription updated for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata.supabase_user_id;

        if (!userId) {
          console.warn('No supabase_user_id in subscription metadata');
          break;
        }

        await upsertSubscription(userId, customerId, {
          stripe_subscription_id: subscription.id,
          status: 'canceled',
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          canceled_at: new Date().toISOString(),
        });

        console.log(`Subscription deleted for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId) as any;
          const userId = subscriptionData.metadata.supabase_user_id;
          const customerId = subscriptionData.customer as string;

          if (userId) {
            await upsertSubscription(userId, customerId, {
              stripe_subscription_id: subscriptionData.id,
              status: 'past_due',
            });

            console.log(`Payment failed for user ${userId}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
