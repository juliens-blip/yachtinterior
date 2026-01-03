#!/usr/bin/env node

/**
 * Diagnostic approfondi du flux de paiement Stripe → Supabase
 * Usage: node diagnose-payment-flow.cjs
 */

require('dotenv').config({ path: '.env.local' });
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');

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

async function main() {
  log('\n╔═══════════════════════════════════════════════════════════════╗', 'blue');
  log('║  DIAGNOSTIC COMPLET - FLUX DE PAIEMENT                        ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════════╝', 'blue');

  const issues = [];
  const warnings = [];

  // Configuration
  const config = {
    stripeSecretKey: process.env.STRIPE_SECRET_KEY,
    stripePublicKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    stripePriceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ID,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  };

  // 1. Vérifier les variables d'environnement
  log('\n[1/7] Vérification des variables d\'environnement...', 'blue');

  const requiredVars = {
    'STRIPE_SECRET_KEY': config.stripeSecretKey,
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY': config.stripePublicKey,
    'NEXT_PUBLIC_STRIPE_PRICE_ID': config.stripePriceId,
    'STRIPE_WEBHOOK_SECRET': config.stripeWebhookSecret,
    'NEXT_PUBLIC_SUPABASE_URL': config.supabaseUrl,
    'NEXT_PUBLIC_SUPABASE_ANON_KEY': config.supabaseAnonKey,
    'SUPABASE_SERVICE_ROLE_KEY': config.supabaseServiceKey,
  };

  let envOk = true;
  for (const [key, value] of Object.entries(requiredVars)) {
    if (!value) {
      log(`  ❌ ${key} manquante`, 'red');
      issues.push(`Variable d'environnement ${key} manquante`);
      envOk = false;
    } else {
      log(`  ✅ ${key}`, 'green');
    }
  }

  if (!envOk) {
    log('\n⚠️  Certaines variables d\'environnement sont manquantes.', 'yellow');
    log('   Vérifiez votre fichier .env.local', 'yellow');
  }

  // 2. Tester la connexion Stripe
  log('\n[2/7] Test de la connexion Stripe...', 'blue');

  try {
    const stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2024-11-20.acacia' });

    // Vérifier le mode (test vs live)
    if (config.stripeSecretKey.startsWith('sk_live_')) {
      log('  ⚠️  ATTENTION : Vous utilisez des clés LIVE (production)', 'yellow');
      warnings.push('Utilisation de clés LIVE - Assurez-vous que c\'est intentionnel');
    } else {
      log('  ✅ Mode TEST activé', 'green');
    }

    // Vérifier le Price ID
    if (config.stripePriceId) {
      try {
        const price = await stripe.prices.retrieve(config.stripePriceId);
        log(`  ✅ Price ID valide : ${price.id}`, 'green');
        log(`     Montant : ${price.unit_amount / 100} ${price.currency.toUpperCase()}`, 'green');
        log(`     Récurrence : ${price.recurring?.interval || 'one-time'}`, 'green');
      } catch (e) {
        log(`  ❌ Price ID invalide : ${config.stripePriceId}`, 'red');
        log(`     Erreur : ${e.message}`, 'red');
        issues.push(`Price ID invalide : ${config.stripePriceId}`);
      }
    } else {
      log('  ❌ Price ID non configuré', 'red');
      issues.push('Price ID non configuré');
    }

    // Vérifier les webhooks
    const webhooks = await stripe.webhookEndpoints.list();
    log(`\n  Webhooks configurés : ${webhooks.data.length}`, 'blue');

    if (webhooks.data.length === 0) {
      log('  ❌ AUCUN webhook configuré dans Stripe', 'red');
      issues.push('Aucun webhook configuré - Les paiements ne seront JAMAIS transmis à Supabase');
    } else {
      webhooks.data.forEach((webhook, i) => {
        log(`\n  Webhook ${i + 1}:`, 'magenta');
        log(`    URL : ${webhook.url}`, 'blue');
        log(`    Status : ${webhook.status}`, webhook.status === 'enabled' ? 'green' : 'red');

        const requiredEvents = [
          'checkout.session.completed',
          'customer.subscription.updated',
          'customer.subscription.deleted',
          'invoice.payment_failed'
        ];

        const missingEvents = requiredEvents.filter(
          e => !webhook.enabled_events.includes(e)
        );

        if (missingEvents.length > 0) {
          log(`    ⚠️  Événements manquants : ${missingEvents.join(', ')}`, 'yellow');
          warnings.push(`Webhook ${webhook.url} : événements manquants`);
        } else {
          log(`    ✅ Tous les événements requis configurés`, 'green');
        }
      });
    }

  } catch (e) {
    log(`  ❌ Erreur Stripe : ${e.message}`, 'red');
    issues.push(`Erreur de connexion Stripe : ${e.message}`);
  }

  // 3. Tester la connexion Supabase
  log('\n[3/7] Test de la connexion Supabase...', 'blue');

  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

    // Tester l'accès à la table subscriptions
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (error) {
      log(`  ❌ Erreur d'accès à la table : ${error.message}`, 'red');
      issues.push(`Erreur Supabase : ${error.message}`);
    } else {
      log('  ✅ Connexion Supabase OK', 'green');
      log('  ✅ Table subscriptions accessible', 'green');
    }

    // Vérifier la structure de la table
    const { data: tableData, error: tableError } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (!tableError && tableData) {
      const requiredColumns = [
        'user_id',
        'stripe_customer_id',
        'stripe_subscription_id',
        'stripe_price_id',
        'status',
        'current_period_end',
        'email'  // Nouveau champ
      ];

      if (tableData.length > 0) {
        const columns = Object.keys(tableData[0]);
        const missingColumns = requiredColumns.filter(c => !columns.includes(c));

        if (missingColumns.length > 0) {
          log(`  ⚠️  Colonnes manquantes : ${missingColumns.join(', ')}`, 'yellow');
          warnings.push(`Colonnes manquantes dans subscriptions : ${missingColumns.join(', ')}`);
        } else {
          log('  ✅ Structure de la table OK', 'green');
        }
      }
    }

  } catch (e) {
    log(`  ❌ Erreur Supabase : ${e.message}`, 'red');
    issues.push(`Erreur de connexion Supabase : ${e.message}`);
  }

  // 4. Analyser les événements Stripe récents
  log('\n[4/7] Analyse des événements Stripe récents...', 'blue');

  try {
    const stripe = new Stripe(config.stripeSecretKey, { apiVersion: '2024-11-20.acacia' });
    const events = await stripe.events.list({ limit: 10 });

    log(`  Événements trouvés : ${events.data.length}`, 'blue');

    const eventTypes = {};
    events.data.forEach(event => {
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;
    });

    log('\n  Répartition des événements :', 'magenta');
    for (const [type, count] of Object.entries(eventTypes)) {
      log(`    - ${type} : ${count}`, 'blue');
    }

    // Chercher des checkout.session.completed
    const checkoutEvents = events.data.filter(e => e.type === 'checkout.session.completed');

    if (checkoutEvents.length === 0) {
      log('\n  ⚠️  Aucun événement checkout.session.completed trouvé', 'yellow');
      log('     → Aucun paiement finalisé récemment', 'yellow');
    } else {
      log(`\n  ✅ ${checkoutEvents.length} paiement(s) finalisé(s) trouvé(s)`, 'green');

      checkoutEvents.forEach((event, i) => {
        const session = event.data.object;
        log(`\n  Paiement ${i + 1}:`, 'magenta');
        log(`    Date : ${new Date(event.created * 1000).toISOString()}`, 'blue');
        log(`    Session ID : ${session.id}`, 'blue');
        log(`    Customer ID : ${session.customer}`, 'blue');
        log(`    Email : ${session.customer_details?.email || session.customer_email || 'N/A'}`, 'blue');

        // CRITIQUE : Vérifier le metadata
        if (!session.metadata?.supabase_user_id) {
          log(`    ❌ PROBLÈME : metadata.supabase_user_id MANQUANT!`, 'red');
          issues.push(`Paiement ${session.id} sans supabase_user_id - NE PEUT PAS être sauvegardé`);
        } else {
          log(`    ✅ supabase_user_id : ${session.metadata.supabase_user_id}`, 'green');
        }
      });
    }

  } catch (e) {
    log(`  ❌ Erreur lors de l'analyse des événements : ${e.message}`, 'red');
  }

  // 5. Vérifier les données dans Supabase
  log('\n[5/7] Vérification des données Supabase...', 'blue');

  try {
    const supabase = createClient(config.supabaseUrl, config.supabaseServiceKey);

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      log(`  ❌ Erreur : ${error.message}`, 'red');
    } else if (!subscriptions || subscriptions.length === 0) {
      log('  ⚠️  AUCUNE subscription dans la base de données', 'yellow');
      log('\n  Causes possibles :', 'yellow');
      log('    1. Aucun paiement n\'a encore été finalisé', 'yellow');
      log('    2. Le webhook n\'est pas configuré', 'yellow');
      log('    3. Le webhook reçoit les événements mais échoue', 'yellow');
    } else {
      log(`  ✅ ${subscriptions.length} subscription(s) trouvée(s)`, 'green');

      subscriptions.forEach((sub, i) => {
        log(`\n  Subscription ${i + 1}:`, 'magenta');
        log(`    User ID : ${sub.user_id}`, 'blue');
        log(`    Email : ${sub.email || 'NON DÉFINI'}`, sub.email ? 'green' : 'yellow');
        log(`    Status : ${sub.status}`, sub.status === 'active' ? 'green' : 'yellow');
        log(`    Créée le : ${sub.created_at}`, 'blue');
      });
    }

  } catch (e) {
    log(`  ❌ Erreur : ${e.message}`, 'red');
  }

  // 6. Vérifier les logs de webhook (si disponibles)
  log('\n[6/7] Vérification de la configuration webhook...', 'blue');

  if (!config.stripeWebhookSecret) {
    log('  ❌ STRIPE_WEBHOOK_SECRET non configuré', 'red');
    issues.push('Webhook secret manquant - Le webhook ne peut PAS fonctionner');
  } else {
    log('  ✅ Webhook secret configuré', 'green');

    if (config.stripeWebhookSecret.startsWith('whsec_')) {
      log('  ✅ Format du secret valide', 'green');
    } else {
      log('  ⚠️  Le secret ne commence pas par "whsec_" - Vérifiez qu\'il est correct', 'yellow');
    }
  }

  // 7. Générer le rapport final
  log('\n[7/7] Génération du rapport...', 'blue');

  log('\n╔═══════════════════════════════════════════════════════════════╗', 'blue');
  log('║  RAPPORT DE DIAGNOSTIC                                        ║', 'blue');
  log('╚═══════════════════════════════════════════════════════════════╝', 'blue');

  if (issues.length === 0 && warnings.length === 0) {
    log('\n✅ TOUT EST OK !', 'green');
    log('\nSi les paiements ne fonctionnent toujours pas :', 'blue');
    log('1. Vérifiez les logs Next.js pendant un test de paiement', 'blue');
    log('2. Vérifiez les logs du webhook dans Stripe Dashboard', 'blue');
  } else {
    if (issues.length > 0) {
      log('\n🔴 PROBLÈMES CRITIQUES TROUVÉS:', 'red');
      issues.forEach((issue, i) => {
        log(`  ${i + 1}. ${issue}`, 'red');
      });
    }

    if (warnings.length > 0) {
      log('\n⚠️  AVERTISSEMENTS:', 'yellow');
      warnings.forEach((warning, i) => {
        log(`  ${i + 1}. ${warning}`, 'yellow');
      });
    }

    log('\n📋 ACTIONS RECOMMANDÉES:', 'magenta');
    if (issues.some(i => i.includes('webhook'))) {
      log('\n  1. CONFIGURER LE WEBHOOK (PRIORITÉ HAUTE):', 'yellow');
      log('     - Voir : QUICK_FIX_WEBHOOK.md', 'blue');
      log('     - Ou exécuter : node setup-stripe-webhook.cjs', 'blue');
    }

    if (issues.some(i => i.includes('Price ID'))) {
      log('\n  2. CRÉER UN PRICE VALIDE:', 'yellow');
      log('     - Aller sur https://dashboard.stripe.com/test/products', 'blue');
      log('     - Créer un nouveau produit avec un prix', 'blue');
      log('     - Mettre à jour NEXT_PUBLIC_STRIPE_PRICE_ID dans .env.local', 'blue');
    }

    if (issues.some(i => i.includes('supabase_user_id'))) {
      log('\n  3. VÉRIFIER L\'AUTHENTIFICATION:', 'yellow');
      log('     - Le code de création de session doit passer le user_id en metadata', 'blue');
      log('     - Voir : app/api/create-checkout-session/route.ts ligne 61-67', 'blue');
    }
  }

  log('\n📚 RESSOURCES:', 'blue');
  log('  - Guide rapide : QUICK_FIX_WEBHOOK.md', 'blue');
  log('  - Guide complet : WEBHOOK_SETUP_FIX.md', 'blue');
  log('  - Setup assisté : node setup-stripe-webhook.cjs', 'blue');
  log('  - Test connexions : node test-stripe-supabase.cjs', 'blue');

  log('\n');
}

main().catch(error => {
  log(`\n❌ Erreur fatale : ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});
