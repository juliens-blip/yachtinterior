import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/app/lib/stripe';
import { upsertSubscription } from '@/app/lib/subscription';
import Stripe from 'stripe';

// Force dynamic rendering - prevent static generation during build
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const toIso = (ts?: number | null) =>
    ts ? new Date(ts * 1000).toISOString() : null;

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

  console.log(`[WEBHOOK] Received event: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`[WEBHOOK] Processing checkout.session.completed`);

        if (session.mode === 'subscription') {
          const subscriptionId = session.subscription as string;
          const customerId = session.customer as string;
          const userId = session.metadata?.supabase_user_id;
          const customerEmail = session.customer_email || session.customer_details?.email;

          console.log(`[WEBHOOK] Subscription ID: ${subscriptionId}`);
          console.log(`[WEBHOOK] Customer ID: ${customerId}`);
          console.log(`[WEBHOOK] User ID: ${userId}`);
          console.log(`[WEBHOOK] Email: ${customerEmail}`);

          if (!userId) {
            console.error('[WEBHOOK] ERROR: No supabase_user_id in session metadata');
            throw new Error('No supabase_user_id in session metadata');
          }

          // Fetch full subscription details
          console.log(`[WEBHOOK] Fetching subscription details from Stripe...`);
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

          console.log(`[WEBHOOK] Subscription status: ${subStatus}`);
          console.log(`[WEBHOOK] Current period end: ${toIso(current_period_end)}`);

          console.log(`[WEBHOOK] Upserting subscription to Supabase...`);

          await upsertSubscription(userId, customerId, {
            stripe_subscription_id: subId,
            stripe_price_id: items.data[0].price.id,
            status: subStatus,
            current_period_start: toIso(current_period_start),
            current_period_end: toIso(current_period_end),
            cancel_at_period_end: cancelAtPeriodEnd,
            canceled_at: toIso(canceled_at),
            email: customerEmail,
          });

          console.log(`[WEBHOOK] Subscription created successfully for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata.supabase_user_id;

        console.log(`[WEBHOOK] Processing customer.subscription.updated`);
        console.log(`[WEBHOOK] Subscription ID: ${subscription.id}`);
        console.log(`[WEBHOOK] User ID: ${userId}`);
        console.log(`[WEBHOOK] New status: ${subscription.status}`);

        if (!userId) {
          console.warn('[WEBHOOK] WARNING: No supabase_user_id in subscription metadata');
          break;
        }

        await upsertSubscription(userId, customerId, {
          stripe_subscription_id: subscription.id,
          stripe_price_id: subscription.items.data[0].price.id,
          status: subscription.status,
          current_period_start: toIso(subscription.current_period_start),
          current_period_end: toIso(subscription.current_period_end),
          cancel_at_period_end: subscription.cancel_at_period_end,
          canceled_at: toIso(subscription.canceled_at),
        });

        console.log(`[WEBHOOK] Subscription updated successfully for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata.supabase_user_id;

        console.log(`[WEBHOOK] Processing customer.subscription.deleted`);
        console.log(`[WEBHOOK] Subscription ID: ${subscription.id}`);
        console.log(`[WEBHOOK] User ID: ${userId}`);

        if (!userId) {
          console.warn('[WEBHOOK] WARNING: No supabase_user_id in subscription metadata');
          break;
        }

        await upsertSubscription(userId, customerId, {
          stripe_subscription_id: subscription.id,
          status: 'canceled',
          current_period_end: toIso(subscription.current_period_end),
          canceled_at: new Date().toISOString(),
        });

        console.log(`[WEBHOOK] Subscription deleted successfully for user ${userId}`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;

        console.log(`[WEBHOOK] Processing invoice.payment_failed`);
        console.log(`[WEBHOOK] Invoice ID: ${invoice.id}`);
        console.log(`[WEBHOOK] Subscription ID: ${subscriptionId}`);

        if (subscriptionId) {
          const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId) as any;
          const userId = subscriptionData.metadata.supabase_user_id;
          const customerId = subscriptionData.customer as string;

          console.log(`[WEBHOOK] User ID: ${userId}`);

          if (userId) {
            await upsertSubscription(userId, customerId, {
              stripe_subscription_id: subscriptionData.id,
              status: 'past_due',
              current_period_start: toIso(subscriptionData.current_period_start),
              current_period_end: toIso(subscriptionData.current_period_end),
              canceled_at: toIso(subscriptionData.canceled_at),
            });

            console.log(`[WEBHOOK] Payment failed - subscription marked as past_due for user ${userId}`);
          } else {
            console.warn('[WEBHOOK] WARNING: No supabase_user_id in subscription metadata');
          }
        }
        break;
      }

      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice = event.data.object as any;
        const invoiceId = invoice.id as string | undefined;
        const subscriptionIdFromInvoice = invoice.subscription as string | undefined;
        const customerIdFromInvoice = invoice.customer as string | undefined;

        console.log(`[WEBHOOK] Processing ${event.type}`);
        console.log(`[WEBHOOK] Invoice ID: ${invoiceId}`);
        console.log(`[WEBHOOK] Subscription (from invoice): ${subscriptionIdFromInvoice}`);

        const invoiceDetails = invoiceId
          ? await stripe.invoices.retrieve(invoiceId)
          : invoice;

        const subscriptionId = (invoiceDetails.subscription as string) || subscriptionIdFromInvoice;
        const customerId = (invoiceDetails.customer as string) || customerIdFromInvoice;

        if (!subscriptionId || !customerId) {
          console.warn('[WEBHOOK] WARNING: Missing subscriptionId or customerId on invoice.payment_succeeded');
          break;
        }

        const subscriptionData = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const userId = subscriptionData.metadata?.supabase_user_id;

        if (!userId) {
          console.warn('[WEBHOOK] WARNING: No supabase_user_id in subscription metadata');
          break;
        }

        const firstItem = subscriptionData.items.data[0];
        const emailFromInvoice =
          (invoiceDetails as any).customer_email ||
          invoice.customer_email ||
          invoice.customer_email_address;

        await upsertSubscription(userId, customerId, {
          stripe_subscription_id: subscriptionData.id,
          stripe_price_id: firstItem?.price?.id,
          status: subscriptionData.status || 'active',
          current_period_start: toIso(subscriptionData.current_period_start),
          current_period_end: toIso(subscriptionData.current_period_end),
          cancel_at_period_end: subscriptionData.cancel_at_period_end,
          canceled_at: toIso(subscriptionData.canceled_at),
          email: emailFromInvoice,
        });

        console.log(`[WEBHOOK] Subscription synced from ${event.type} for user ${userId}`);
        break;
      }

      default:
        console.log(`[WEBHOOK] Unhandled event type: ${event.type}`);
    }

    console.log(`[WEBHOOK] Event ${event.type} processed successfully`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK] Error processing webhook:', error);
    console.error('[WEBHOOK] Error details:', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
