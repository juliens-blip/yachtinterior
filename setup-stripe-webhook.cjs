#!/usr/bin/env node

/**
 * Script de configuration automatique du webhook Stripe
 * Usage: node setup-stripe-webhook.cjs
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const readline = require('readline');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  STRIPE WEBHOOK SETUP                                  ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    log('\n❌ STRIPE_SECRET_KEY not found in .env.local', 'red');
    process.exit(1);
  }

  const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

  // Étape 1 : Vérifier/Créer un Price
  log('\n=== STEP 1: Price Configuration ===', 'blue');

  const currentPriceId = process.env.NEXT_PUBLIC_STRIPE_PRICE_ID;
  let priceId = currentPriceId;

  if (currentPriceId) {
    try {
      const price = await stripe.prices.retrieve(currentPriceId);
      log(`✅ Current Price ID is valid: ${price.id}`, 'green');
      log(`   Amount: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`, 'green');
      log(`   Interval: ${price.recurring?.interval || 'one-time'}`, 'green');

      const useExisting = await question('\nUse this existing price? (y/n): ');
      if (useExisting.toLowerCase() !== 'y') {
        priceId = null;
      }
    } catch (e) {
      log(`⚠️  Current Price ID is invalid: ${e.message}`, 'yellow');
      priceId = null;
    }
  } else {
    log('⚠️  No Price ID configured', 'yellow');
  }

  if (!priceId) {
    const createPrice = await question('\nCreate a new price? (y/n): ');
    if (createPrice.toLowerCase() === 'y') {
      // Créer un produit
      log('\n📦 Creating product...', 'blue');
      const product = await stripe.products.create({
        name: 'YachtGenius Pro Subscription',
        description: 'Accès illimité à la génération de designs de yacht avec IA',
      });
      log(`✅ Product created: ${product.id}`, 'green');

      // Demander le prix
      const amount = await question('Enter price amount (e.g., 29.99): ');
      const currency = await question('Enter currency (e.g., eur): ');
      const interval = await question('Enter billing interval (month/year): ');

      // Créer le prix
      log('\n💰 Creating price...', 'blue');
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(parseFloat(amount) * 100),
        currency: currency.toLowerCase(),
        recurring: {
          interval: interval.toLowerCase(),
        },
      });

      priceId = price.id;
      log(`✅ Price created: ${priceId}`, 'green');
      log(`\n🔥 ADD THIS TO YOUR .env.local:`, 'magenta');
      log(`NEXT_PUBLIC_STRIPE_PRICE_ID=${priceId}`, 'yellow');
    } else {
      log('\n⚠️  Skipping price creation', 'yellow');
    }
  }

  // Étape 2 : Configuration du Webhook
  log('\n=== STEP 2: Webhook Configuration ===', 'blue');

  const webhookType = await question('\nWebhook type? (1=Local Dev, 2=Production): ');

  if (webhookType === '1') {
    // Webhook local via Stripe CLI
    log('\n📍 LOCAL DEVELOPMENT WEBHOOK', 'magenta');
    log('\nTo set up local webhook:', 'yellow');
    log('1. Open a new terminal', 'yellow');
    log('2. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe', 'yellow');
    log('3. Copy the webhook signing secret (whsec_xxxx)', 'yellow');
    log('4. Add it to .env.local as STRIPE_WEBHOOK_SECRET', 'yellow');
    log('\n⚠️  Note: Stripe CLI webhook only works while the command is running', 'yellow');

  } else if (webhookType === '2') {
    // Webhook production
    const url = await question('\nEnter your production URL (e.g., https://yourdomain.vercel.app): ');
    const webhookUrl = `${url.replace(/\/$/, '')}/api/webhooks/stripe`;

    log(`\n🌐 Creating webhook endpoint: ${webhookUrl}`, 'blue');

    const requiredEvents = [
      'checkout.session.completed',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'invoice.payment_failed',
    ];

    try {
      const webhook = await stripe.webhookEndpoints.create({
        url: webhookUrl,
        enabled_events: requiredEvents,
        description: 'YachtGenius Webhook - Production',
      });

      log(`✅ Webhook created successfully!`, 'green');
      log(`   ID: ${webhook.id}`, 'green');
      log(`   URL: ${webhook.url}`, 'green');
      log(`   Status: ${webhook.status}`, 'green');

      log(`\n🔥 ADD THIS TO YOUR .env.local:`, 'magenta');
      log(`STRIPE_WEBHOOK_SECRET=${webhook.secret}`, 'yellow');

    } catch (error) {
      if (error.message.includes('url has already been added')) {
        log(`\n⚠️  Webhook already exists for this URL`, 'yellow');

        const webhooks = await stripe.webhookEndpoints.list();
        const existing = webhooks.data.find(w => w.url === webhookUrl);

        if (existing) {
          log(`\n✅ Found existing webhook:`, 'green');
          log(`   ID: ${existing.id}`, 'green');
          log(`   URL: ${existing.url}`, 'green');
          log(`   Status: ${existing.status}`, 'green');
          log(`\n⚠️  To get the secret, you need to:`, 'yellow');
          log(`1. Go to https://dashboard.stripe.com/webhooks`, 'yellow');
          log(`2. Click on your webhook endpoint`, 'yellow');
          log(`3. Click "Reveal" next to "Signing secret"`, 'yellow');
          log(`4. Copy and add to .env.local as STRIPE_WEBHOOK_SECRET`, 'yellow');
        }
      } else {
        log(`\n❌ Error creating webhook: ${error.message}`, 'red');
      }
    }
  }

  // Étape 3 : Résumé
  log('\n╔════════════════════════════════════════════════════════╗', 'blue');
  log('║  SETUP COMPLETE                                        ║', 'blue');
  log('╚════════════════════════════════════════════════════════╝', 'blue');

  log('\n✅ Next steps:', 'green');
  log('1. Update your .env.local with the values shown above', 'yellow');
  log('2. Restart your Next.js server: npm run dev', 'yellow');
  log('3. Test the payment flow', 'yellow');
  log('4. Run: node test-stripe-supabase.cjs to verify', 'yellow');

  log('\n📚 For more details, see: WEBHOOK_SETUP_FIX.md', 'blue');

  rl.close();
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  console.error(error);
  rl.close();
  process.exit(1);
});
