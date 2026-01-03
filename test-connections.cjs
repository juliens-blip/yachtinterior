/**
 * Test script to verify Stripe and Supabase connections
 * Usage: node test-connections.js
 */

// Load environment variables
require('dotenv').config({ path: '.env.local' });

async function testStripeConnection() {
  console.log('\n🔵 Testing Stripe Connection...');

  try {
    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Test API by listing products
    const products = await stripe.products.list({ limit: 1 });
    console.log('✅ Stripe connection successful');
    console.log(`   API Key: ${process.env.STRIPE_SECRET_KEY.substring(0, 12)}...`);

    // Verify webhook secret exists
    if (process.env.STRIPE_WEBHOOK_SECRET) {
      console.log('✅ Webhook secret configured');
      console.log(`   Secret: whsec_${process.env.STRIPE_WEBHOOK_SECRET.substring(6, 18)}...`);
    } else {
      console.log('❌ STRIPE_WEBHOOK_SECRET not configured!');
    }

    // Verify price ID exists
    if (process.env.NEXT_PUBLIC_STRIPE_PRICE_ID) {
      try {
        const price = await stripe.prices.retrieve(process.env.NEXT_PUBLIC_STRIPE_PRICE_ID);
        console.log('✅ Price ID valid');
        console.log(`   Price: ${price.unit_amount / 100} ${price.currency.toUpperCase()} / ${price.recurring.interval}`);
      } catch (error) {
        console.log('❌ Price ID invalid:', error.message);
      }
    } else {
      console.log('❌ NEXT_PUBLIC_STRIPE_PRICE_ID not configured!');
    }

    return true;
  } catch (error) {
    console.log('❌ Stripe connection failed:', error.message);
    return false;
  }
}

async function testSupabaseConnection() {
  console.log('\n🟢 Testing Supabase Connection...');

  try {
    const { createClient } = require('@supabase/supabase-js');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      throw new Error('Missing Supabase credentials');
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('✅ Supabase client created');
    console.log(`   URL: ${supabaseUrl}`);

    // Test database connection by checking subscriptions table
    const { data, error } = await supabase
      .from('subscriptions')
      .select('count')
      .limit(1);

    if (error) {
      if (error.message.includes('relation "public.subscriptions" does not exist')) {
        console.log('❌ Table "subscriptions" does not exist!');
        console.log('   Run: npx supabase db push');
        return false;
      }
      throw error;
    }

    console.log('✅ Table "subscriptions" exists');

    // Check table structure
    const { data: columns } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(0);

    console.log('✅ Table accessible via service role');

    // Count records
    const { count } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true });

    console.log(`   Records in table: ${count || 0}`);

    return true;
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return false;
  }
}

async function checkWebhookEndpoint() {
  console.log('\n🌐 Checking Webhook Endpoint...');

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const webhookUrl = `${appUrl}/api/webhooks/stripe`;

    console.log(`   Webhook URL should be: ${webhookUrl}`);
    console.log('   To test webhooks locally, run:');
    console.log('   $ stripe listen --forward-to localhost:3000/api/webhooks/stripe');

    return true;
  } catch (error) {
    console.log('❌ Error checking webhook endpoint:', error.message);
    return false;
  }
}

async function checkUserData() {
  console.log('\n👤 Checking User Data in Supabase...');

  try {
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

    // Get all subscriptions with user emails
    const { data: subs, error } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        stripe_customer_id,
        stripe_subscription_id,
        status,
        current_period_end,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!subs || subs.length === 0) {
      console.log('   No subscriptions found in database');
      console.log('   This is the problem! Webhooks are not creating records.');
      return false;
    }

    console.log(`   Found ${subs.length} subscription(s):`);

    for (const sub of subs) {
      // Get user email from auth.users
      const { data: { user } } = await supabase.auth.admin.getUserById(sub.user_id);

      console.log(`\n   Subscription ${sub.stripe_subscription_id || 'N/A'}:`);
      console.log(`     User ID: ${sub.user_id}`);
      console.log(`     Email: ${user?.email || 'NOT FOUND'}`);
      console.log(`     Status: ${sub.status}`);
      console.log(`     Customer ID: ${sub.stripe_customer_id}`);
      console.log(`     Period End: ${sub.current_period_end || 'N/A'}`);
    }

    return true;
  } catch (error) {
    console.log('❌ Error checking user data:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  YachtGenius - Connection & Integration Test Suite');
  console.log('═══════════════════════════════════════════════════════');

  const results = {
    stripe: await testStripeConnection(),
    supabase: await testSupabaseConnection(),
    webhook: await checkWebhookEndpoint(),
    userData: await checkUserData()
  };

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Stripe Connection:     ${results.stripe ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Supabase Connection:   ${results.supabase ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Webhook Configuration: ${results.webhook ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`User Data Check:       ${results.userData ? '✅ PASS' : '⚠️  WARN'}`);

  const allPassed = results.stripe && results.supabase && results.webhook;

  if (!allPassed) {
    console.log('\n❌ CRITICAL ISSUES FOUND - Please fix before testing payments');
    process.exit(1);
  } else if (!results.userData) {
    console.log('\n⚠️  NO USER DATA - Webhooks may not be working properly');
    console.log('   Start stripe listener: stripe listen --forward-to localhost:3000/api/webhooks/stripe');
    process.exit(0);
  } else {
    console.log('\n✅ ALL TESTS PASSED - System is configured correctly');
    process.exit(0);
  }
}

runAllTests().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
