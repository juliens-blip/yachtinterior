# 🔧 Guide de Correction - Webhook Stripe + Supabase

## 🚨 Problèmes Identifiés

1. **AUCUN webhook configuré dans Stripe** → Les paiements ne sont jamais transmis à Supabase
2. **Price ID invalide** → Les sessions de checkout échouent
3. **Table subscriptions vide** → Conséquence des problèmes ci-dessus

---

## ✅ ÉTAPE 1 : Créer un Price ID valide

### Option A : Utiliser Stripe CLI (Recommandé pour test)

```bash
# 1. Se connecter à Stripe CLI
stripe login

# 2. Créer un produit
stripe products create \
  --name="YachtGenius Pro Subscription" \
  --description="Accès illimité à la génération de designs de yacht"

# 3. Créer un prix (remplacer prod_xxx par l'ID du produit créé)
stripe prices create \
  --product=prod_xxx \
  --unit-amount=2999 \
  --currency=eur \
  --recurring[interval]=month

# Le Price ID sera affiché (ex: price_1AbCdEfGhIjKlMnO)
```

### Option B : Via le Dashboard Stripe

1. Aller sur [Stripe Dashboard > Products](https://dashboard.stripe.com/products)
2. Cliquer "Add product"
3. Remplir :
   - **Name**: YachtGenius Pro Subscription
   - **Description**: Accès illimité à la génération de designs
   - **Pricing model**: Standard pricing
   - **Price**: 29.99 EUR (ou votre tarif)
   - **Billing period**: Monthly
4. Cliquer "Save product"
5. **COPIER LE PRICE ID** (format : `price_xxxxxxxxxxxxx`)

---

## ✅ ÉTAPE 2 : Configurer le Webhook Endpoint

### Option A : Webhook Local (Pour développement avec Stripe CLI)

```bash
# 1. Démarrer le serveur Next.js
npm run dev

# 2. Dans un autre terminal, créer un tunnel webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 3. COPIER le webhook signing secret (whsec_xxxx)
# Il sera affiché dans le terminal
```

### Option B : Webhook Production (Déploiement Vercel/Autre)

1. Aller sur [Stripe Dashboard > Webhooks](https://dashboard.stripe.com/webhooks)
2. Cliquer "Add endpoint"
3. Remplir :
   - **Endpoint URL**: `https://votre-domaine.vercel.app/api/webhooks/stripe`
   - **Description**: YachtGenius Webhook
4. Sélectionner les événements suivants :
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_failed`
5. Cliquer "Add endpoint"
6. **COPIER LE SIGNING SECRET** (whsec_xxxxx)

---

## ✅ ÉTAPE 3 : Mettre à jour .env.local

Éditer le fichier `.env.local` et remplacer les valeurs :

```bash
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx  # Laisser tel quel
STRIPE_SECRET_KEY=sk_test_xxxxx                   # Laisser tel quel

# 🔥 NOUVEAU : Remplacer par le Price ID créé à l'étape 1
NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxxxxxxxxxxxx

# 🔥 NOUVEAU : Remplacer par le Signing Secret de l'étape 2
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Supabase (laisser tel quel)
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## ✅ ÉTAPE 4 : Redémarrer le serveur

```bash
# Arrêter le serveur (Ctrl+C)
# Redémarrer
npm run dev
```

---

## ✅ ÉTAPE 5 : Tester le flux complet

### Test Manuel

1. Aller sur http://localhost:3000/auth
2. Se connecter avec Supabase Auth
3. Cliquer sur "Subscribe"
4. Utiliser une carte de test Stripe :
   - **Numéro**: 4242 4242 4242 4242
   - **Date**: 12/34 (toute date future)
   - **CVC**: 123
5. Valider le paiement
6. **Vérifier les logs du serveur** → doit afficher :
   ```
   [WEBHOOK] Received event: checkout.session.completed
   [WEBHOOK] Processing checkout.session.completed
   [WEBHOOK] ✅ Subscription created successfully
   ```

### Test Automatisé

```bash
# Relancer le script de test
node test-stripe-supabase.cjs
```

**Résultat attendu :**
```
✅ Stripe Connection:        ✅
✅ Supabase Connection:      ✅
✅ Webhook Configuration:    ✅  (doit être vert maintenant!)
✅ Recent Events:            ✅
✅ Subscription Data:        ✅  (doit contenir une subscription!)
```

---

## ✅ ÉTAPE 6 : Vérifier dans Supabase

1. Aller sur [Supabase Dashboard](https://app.supabase.com)
2. Sélectionner votre projet
3. Aller dans **Table Editor** > `subscriptions`
4. Vous devriez voir :
   - ✅ `user_id` rempli
   - ✅ `stripe_customer_id` rempli
   - ✅ `stripe_subscription_id` rempli
   - ✅ `email` rempli
   - ✅ `status` = "active"

---

## 🐛 Débogage

### Si le webhook ne reçoit pas d'événements

1. **Vérifier les logs Stripe** :
   - [Dashboard > Webhooks > Votre endpoint](https://dashboard.stripe.com/webhooks)
   - Cliquer sur l'endpoint
   - Onglet "Event logs"
   - Vérifier les erreurs (4xx, 5xx)

2. **Vérifier les logs Next.js** :
   ```bash
   # Dans le terminal où tourne npm run dev
   # Chercher les lignes [WEBHOOK]
   ```

3. **Tester manuellement le webhook** :
   ```bash
   stripe events resend evt_xxxxxxxxx
   ```

### Si l'email n'apparaît pas dans Supabase

1. Vérifier que la migration `002_add_email_to_subscriptions.sql` a été appliquée :
   ```bash
   node apply-migration.cjs
   ```

2. Vérifier que le webhook passe bien l'email :
   ```typescript
   // Dans app/api/webhooks/stripe/route.ts ligne 88
   email: customerEmail,  // Doit être présent
   ```

---

## 📊 Commandes de Diagnostic

```bash
# Vérifier la configuration
node test-stripe-supabase.cjs

# Lister les webhooks Stripe
stripe webhook_endpoints list

# Voir les événements récents
stripe events list --limit 10

# Voir les détails d'un événement
stripe events retrieve evt_xxxxxxxxx

# Ré-envoyer un événement
stripe events resend evt_xxxxxxxxx
```

---

## 🎯 Checklist Finale

- [ ] Price ID valide créé
- [ ] Price ID mis à jour dans .env.local
- [ ] Webhook endpoint configuré dans Stripe
- [ ] Webhook secret mis à jour dans .env.local
- [ ] Serveur redémarré
- [ ] Test de paiement effectué
- [ ] Webhook reçu (logs [WEBHOOK] visibles)
- [ ] Subscription visible dans Supabase
- [ ] Email présent dans la table subscriptions

---

## 🆘 Support

Si les problèmes persistent :

1. Vérifier les logs détaillés :
   ```bash
   # Terminal 1 : Serveur Next.js
   npm run dev

   # Terminal 2 : Stripe CLI
   stripe listen --forward-to localhost:3000/api/webhooks/stripe --print-json

   # Terminal 3 : Logs Supabase
   # (utiliser le dashboard Supabase > Logs)
   ```

2. Créer un fichier de debug :
   ```bash
   node debug-webhook.cjs
   ```

3. Consulter la documentation :
   - [Stripe Webhooks](https://stripe.com/docs/webhooks)
   - [Supabase Auth](https://supabase.com/docs/guides/auth)
   - [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
