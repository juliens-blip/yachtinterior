/**
 * Debug script to simulate and test Stripe webhook processing
 * Usage: node debug-webhook.js
 */

require('dotenv').config({ path: '.env.local' });

async function simulateWebhookPayload() {
  console.log('\n🔍 Simulating Stripe Webhook Event...\n');

  // Simulate a checkout.session.completed event
  const fakeEvent = {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_fake123',
        mode: 'subscription',
        customer: 'cus_test_fake456',
        subscription: 'sub_test_fake789',
        metadata: {
          supabase_user_id: 'FAKE_USER_ID_12345'  // This should exist in auth.users
        },
        customer_email: 'test@example.com'
      }
    }
  };

  console.log('Event payload:');
  console.log(JSON.stringify(fakeEvent, null, 2));

  return fakeEvent;
}

async function testWebhookLogic(event) {
  console.log('\n🧪 Testing Webhook Processing Logic...\n');

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const session = event.data.object;

    console.log('Step 1: Extract data from webhook');
    console.log(`  Subscription ID: ${session.subscription}`);
    console.log(`  Customer ID: ${session.customer}`);
    console.log(`  User ID: ${session.metadata?.supabase_user_id}`);
    console.log(`  Email: ${session.customer_email}`);

    if (!session.metadata?.supabase_user_id) {
      throw new Error('❌ Missing supabase_user_id in metadata!');
    }

    console.log('\nStep 2: Fetch subscription details from Stripe');
    // Note: This will fail with fake IDs, but we can test the logic
    console.log(`  Would call: stripe.subscriptions.retrieve('${session.subscription}')`);
    console.log('  Expected response: {status: "active", current_period_end: ...}');

    console.log('\nStep 3: Prepare data for Supabase');
    const subscriptionData = {
      user_id: session.metadata.supabase_user_id,
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      stripe_price_id: 'price_fake_from_subscription',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancel_at_period_end: false,
      canceled_at: null,
      updated_at: new Date().toISOString()
    };

    console.log('  Data to upsert:');
    console.log(JSON.stringify(subscriptionData, null, 2));

    console.log('\n⚠️  ISSUE IDENTIFIED:');
    console.log('  The email from Stripe (customer_email) is NOT being saved!');
    console.log(`  Email "${session.customer_email}" would be lost.`);

    console.log('\n💡 SOLUTION:');
    console.log('  Option 1: Add email column to subscriptions table');
    console.log('  Option 2: Link via user_id and fetch from auth.users');
    console.log('  Option 3: Store email in Stripe customer metadata');

    return true;
  } catch (error) {
    console.log('\n❌ Error during webhook logic test:', error.message);
    return false;
  }
}

async function checkExistingWebhooks() {
  console.log('\n📡 Checking Stripe Webhooks Configuration...\n');

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const endpoints = await stripe.webhookEndpoints.list({ limit: 10 });

    if (endpoints.data.length === 0) {
      console.log('⚠️  No webhook endpoints configured in Stripe Dashboard');
      console.log('   For production, add: https://yourdomain.com/api/webhooks/stripe');
      console.log('   For local dev, use: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
    } else {
      console.log(`Found ${endpoints.data.length} webhook endpoint(s):`);
      endpoints.data.forEach((endpoint, i) => {
        console.log(`\n  ${i + 1}. ${endpoint.url}`);
        console.log(`     Status: ${endpoint.status}`);
        console.log(`     Events: ${endpoint.enabled_events.join(', ')}`);
      });
    }

    return true;
  } catch (error) {
    console.log('❌ Error checking webhooks:', error.message);
    return false;
  }
}

async function analyzeWebhookFlow() {
  console.log('\n🔬 Analyzing Complete Webhook Flow...\n');

  console.log('Expected Flow:');
  console.log('1. User completes payment on Stripe Checkout');
  console.log('2. Stripe sends webhook to /api/webhooks/stripe');
  console.log('3. Webhook handler verifies signature');
  console.log('4. Handler extracts: subscriptionId, customerId, userId from metadata');
  console.log('5. Handler calls upsertSubscription()');
  console.log('6. Subscription record created/updated in Supabase');
  console.log('7. Frontend polls DB and finds active subscription');
  console.log('8. User redirected to main app');

  console.log('\n❌ Current Issues:');
  console.log('Issue 1: Email not stored in subscriptions table');
  console.log('  Impact: Cannot display user email in admin dashboard');
  console.log('  Severity: LOW (email still exists in auth.users)');

  console.log('\nIssue 2: Webhook may not be triggered');
  console.log('  Cause: stripe listen not running, or WEBHOOK_SECRET mismatch');
  console.log('  Impact: HIGH - Subscription never created, user cannot access app');
  console.log('  Severity: CRITICAL');

  console.log('\nIssue 3: No error handling if user_id doesn\'t exist');
  console.log('  Cause: Metadata has wrong user_id or user was deleted');
  console.log('  Impact: Webhook fails silently');
  console.log('  Severity: MEDIUM');

  console.log('\n✅ Recommendations:');
  console.log('1. Add comprehensive logging to webhook handler');
  console.log('2. Store webhook events in a separate table for debugging');
  console.log('3. Add email column to subscriptions (optional)');
  console.log('4. Add retry logic for failed webhooks');
  console.log('5. Create admin dashboard to view webhook logs');
}

async function runDebug() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  YachtGenius - Webhook Debug & Analysis Tool');
  console.log('═══════════════════════════════════════════════════════');

  const fakeEvent = await simulateWebhookPayload();
  await testWebhookLogic(fakeEvent);
  await checkExistingWebhooks();
  await analyzeWebhookFlow();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Next Steps');
  console.log('═══════════════════════════════════════════════════════');
  console.log('1. Run: npm install dotenv');
  console.log('2. Run: node test-connections.js');
  console.log('3. Start dev server: npm run dev');
  console.log('4. In new terminal: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
  console.log('5. Test payment flow and watch webhook logs');
  console.log('6. Check Supabase dashboard for new subscription record');
}

runDebug().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
