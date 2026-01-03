#!/usr/bin/env node

/**
 * Script de test pour vérifier les connexions Stripe et Supabase
 * Usage: node test-stripe-supabase.cjs
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testStripeConnection() {
  log('\n=== TEST 1: Stripe Connection ===', 'blue');

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      throw new Error('STRIPE_SECRET_KEY not found in .env.local');
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

    // Test: Lister les produits
    const products = await stripe.products.list({ limit: 1 });
    log(`✅ Stripe connected successfully`, 'green');
    log(`   Products available: ${products.data.length}`, 'green');

    // Test: Vérifier le webhook secret
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      log('⚠️  STRIPE_WEBHOOK_SECRET not found', 'yellow');
    } else {
      log(`✅ Webhook secret configured`, 'green');
    }

    // Test: Vérifier le price ID
    const priceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
    if (!priceId) {
      log('⚠️  NEXT_PUBLIC_STRIPE_PRICE_ID not found', 'yellow');
    } else {
      try {
        const price = await stripe.prices.retrieve(priceId);
        log(`✅ Price ID valid: ${price.id} (${price.unit_amount / 100} ${price.currency})`, 'green');
      } catch (e) {
        log(`❌ Price ID invalid: ${e.message}`, 'red');
      }
    }

    return true;
  } catch (error) {
    log(`❌ Stripe connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testSupabaseConnection() {
  log('\n=== TEST 2: Supabase Connection ===', 'blue');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not found in .env.local');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test: Vérifier la connexion
    const { data, error } = await supabase.from('subscriptions').select('count');

    if (error) {
      throw error;
    }

    log(`✅ Supabase connected successfully`, 'green');
    log(`   Subscriptions table accessible`, 'green');

    // Test: Vérifier la structure de la table
    const { data: tableData, error: tableError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (tableError) {
      log(`⚠️  Error querying table: ${tableError.message}`, 'yellow');
    } else {
      log(`✅ Table structure verified`, 'green');
      if (tableData && tableData.length > 0) {
        log(`   Columns: ${Object.keys(tableData[0]).join(', ')}`, 'green');
      } else {
        log(`   Table is empty (no subscriptions yet)`, 'yellow');
      }
    }

    return true;
  } catch (error) {
    log(`❌ Supabase connection failed: ${error.message}`, 'red');
    return false;
  }
}

async function testWebhookEndpoint() {
  log('\n=== TEST 3: Webhook Endpoint ===', 'blue');

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

    // Lister les webhooks configurés
    const webhooks = await stripe.webhookEndpoints.list();

    if (webhooks.data.length === 0) {
      log('⚠️  No webhooks configured in Stripe', 'yellow');
      return false;
    }

    log(`✅ Found ${webhooks.data.length} webhook(s)`, 'green');

    webhooks.data.forEach((webhook, index) => {
      log(`\n   Webhook ${index + 1}:`, 'blue');
      log(`   - URL: ${webhook.url}`);
      log(`   - Status: ${webhook.status}`);
      log(`   - Events: ${webhook.enabled_events.join(', ')}`);

      // Vérifier les événements requis
      const requiredEvents = [
        'checkout.session.completed',
        'customer.subscription.updated',
        'customer.subscription.deleted',
        'invoice.payment_failed'
      ];

      const missingEvents = requiredEvents.filter(
        event => !webhook.enabled_events.includes(event)
      );

      if (missingEvents.length > 0) {
        log(`   ⚠️  Missing events: ${missingEvents.join(', ')}`, 'yellow');
      } else {
        log(`   ✅ All required events configured`, 'green');
      }
    });

    return true;
  } catch (error) {
    log(`❌ Webhook endpoint check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testRecentWebhookEvents() {
  log('\n=== TEST 4: Recent Webhook Events ===', 'blue');

  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

    // Lister les événements récents
    const events = await stripe.events.list({ limit: 5 });

    if (events.data.length === 0) {
      log('⚠️  No recent events found', 'yellow');
      return false;
    }

    log(`✅ Found ${events.data.length} recent event(s)`, 'green');

    events.data.forEach((event, index) => {
      log(`\n   Event ${index + 1}:`, 'blue');
      log(`   - Type: ${event.type}`);
      log(`   - Created: ${new Date(event.created * 1000).toISOString()}`);
      log(`   - Status: ${event.request ? 'Delivered' : 'Pending'}`);

      // Si c'est un checkout.session.completed, vérifier le metadata
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        log(`   - Session ID: ${session.id}`);
        log(`   - Customer: ${session.customer}`);
        log(`   - Metadata supabase_user_id: ${session.metadata?.supabase_user_id || 'MISSING!'}`);

        if (!session.metadata?.supabase_user_id) {
          log(`   ❌ PROBLEM: No supabase_user_id in metadata!`, 'red');
        } else {
          log(`   ✅ supabase_user_id found in metadata`, 'green');
        }
      }
    });

    return true;
  } catch (error) {
    log(`❌ Recent events check failed: ${error.message}`, 'red');
    return false;
  }
}

async function testSubscriptionData() {
  log('\n=== TEST 5: Subscription Data in Supabase ===', 'blue');

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Récupérer toutes les subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!subscriptions || subscriptions.length === 0) {
      log('⚠️  No subscriptions found in database', 'yellow');
      log('   This could mean:', 'yellow');
      log('   1. No successful payments yet', 'yellow');
      log('   2. Webhook not receiving events', 'yellow');
      log('   3. Error in webhook handler', 'yellow');
      return false;
    }

    log(`✅ Found ${subscriptions.length} subscription(s)`, 'green');

    subscriptions.forEach((sub, index) => {
      log(`\n   Subscription ${index + 1}:`, 'blue');
      log(`   - User ID: ${sub.user_id}`);
      log(`   - Stripe Customer ID: ${sub.stripe_customer_id}`);
      log(`   - Stripe Subscription ID: ${sub.stripe_subscription_id}`);
      log(`   - Status: ${sub.status}`);
      log(`   - Email: ${sub.email || 'NOT SET'}`);
      log(`   - Created: ${sub.created_at}`);
      log(`   - Updated: ${sub.updated_at}`);

      if (!sub.email) {
        log(`   ⚠️  Email not set in subscription`, 'yellow');
      }
    });

    return true;
  } catch (error) {
    log(`❌ Subscription data check failed: ${error.message}`, 'red');
    return false;
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  STRIPE + SUPABASE CONNECTION TESTER                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const results = {
    stripe: false,
    supabase: false,
    webhook: false,
    events: false,
    data: false,
  };

  results.stripe = await testStripeConnection();
  results.supabase = await testSupabaseConnection();
  results.webhook = await testWebhookEndpoint();
  results.events = await testRecentWebhookEvents();
  results.data = await testSubscriptionData();

  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  SUMMARY                                               ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  log(`\nStripe Connection:        ${results.stripe ? '✅' : '❌'}`, results.stripe ? 'green' : 'red');
  log(`Supabase Connection:      ${results.supabase ? '✅' : '❌'}`, results.supabase ? 'green' : 'red');
  log(`Webhook Configuration:    ${results.webhook ? '✅' : '❌'}`, results.webhook ? 'green' : 'red');
  log(`Recent Events:            ${results.events ? '✅' : '❌'}`, results.events ? 'green' : 'red');
  log(`Subscription Data:        ${results.data ? '✅' : '❌'}`, results.data ? 'green' : 'red');

  const allPassed = Object.values(results).every(r => r === true);

  if (allPassed) {
    log('\n✅ ALL TESTS PASSED!', 'green');
  } else {
    log('\n⚠️  SOME TESTS FAILED - See details above', 'yellow');
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
