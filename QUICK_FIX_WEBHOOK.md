# 🚀 CORRECTION RAPIDE - Webhook Stripe

## 🔴 PROBLÈME IDENTIFIÉ

Votre paiement Stripe fonctionne, mais l'information n'arrive jamais à Supabase car :

1. **❌ AUCUN webhook configuré dans Stripe**
2. **❌ Price ID invalide** (`price_1Sf6nVIovqQ8MlIX8mg9uYJj` n'existe pas)

---

## ⚡ SOLUTION RAPIDE (5 minutes)

### 🔧 ÉTAPE 1 : Créer un nouveau Price (2 min)

1. Aller sur https://dashboard.stripe.com/test/products
2. Cliquer **"Create product"**
3. Remplir :
   - **Name** : `YachtGenius Pro`
   - **Price** : `29.99 EUR` (ou votre tarif)
   - **Recurring** : `Monthly`
4. Cliquer **"Save product"**
5. **COPIER** le Price ID (format : `price_xxxxxxxxxxxxx`)

### 🔧 ÉTAPE 2 : Configurer le Webhook (2 min)

#### Option A : Développement Local (Recommandé)

Si vous testez en local (localhost), utilisez Stripe CLI :

```bash
# Installer Stripe CLI (Windows)
# Télécharger depuis : https://github.com/stripe/stripe-cli/releases/latest
# Ou avec Chocolatey :
choco install stripe-cli

# Connectez-vous
stripe login

# Démarrer le tunnel webhook (dans un terminal séparé)
stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
```

**➡️ COPIER** le `webhook signing secret` affiché (commence par `whsec_`)

#### Option B : Production (Vercel/déployé)

1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Cliquer **"Add endpoint"**
3. Remplir :
   - **Endpoint URL** : `https://VOTRE-DOMAINE.vercel.app/api/webhooks/stripe`
   - Cocher ces événements :
     - ✅ `checkout.session.completed`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
     - ✅ `invoice.payment_failed`
4. Cliquer **"Add endpoint"**
5. Cliquer **"Reveal"** à côté de "Signing secret"
6. **COPIER** le secret (commence par `whsec_`)

### 🔧 ÉTAPE 3 : Mettre à jour .env.local (1 min)

Éditer `D:\Projects\yachtinterior\.env.local` :

```bash
# Remplacer ces 2 lignes avec vos nouvelles valeurs :

NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxxxxxxxxxxxx    # ← VOTRE PRICE ID
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx          # ← VOTRE WEBHOOK SECRET
```

### 🔧 ÉTAPE 4 : Redémarrer (30 sec)

```bash
# Arrêter le serveur (Ctrl+C dans le terminal)
# Redémarrer
npm run dev
```

---

## ✅ VÉRIFICATION

### Test Rapide

```bash
node test-stripe-supabase.cjs
```

**Résultat attendu :**
```
✅ Stripe Connection:        ✅
✅ Supabase Connection:      ✅
✅ Webhook Configuration:    ✅  ← doit être VERT maintenant !
✅ Recent Events:            ✅
```

### Test Complet

1. Aller sur http://localhost:3000/auth
2. Se connecter
3. Cliquer "Subscribe"
4. Utiliser la carte de test : `4242 4242 4242 4242`
5. Valider

**Dans les logs du serveur, vous devez voir :**
```
[WEBHOOK] Received event: checkout.session.completed
[WEBHOOK] Processing checkout.session.completed
[WEBHOOK] ✅ Subscription created successfully
```

**Dans Supabase (Table Editor > subscriptions) :**
- ✅ Une nouvelle ligne doit apparaître
- ✅ Avec votre email
- ✅ Status = "active"

---

## 🐛 Si ça ne marche toujours pas

### Vérifier les logs Stripe

1. Aller sur https://dashboard.stripe.com/test/webhooks
2. Cliquer sur votre endpoint
3. Onglet **"Event logs"**
4. Vérifier s'il y a des erreurs (500, 400, etc.)

### Vérifier les logs Next.js

Dans le terminal où `npm run dev` tourne, chercher les lignes `[WEBHOOK]`.

Si vous voyez :
```
[WEBHOOK] ERROR: No supabase_user_id in session metadata
```

➡️ Le problème vient de l'authentification Supabase, pas du webhook.

### Relancer un événement manuellement

Si le paiement a fonctionné mais le webhook n'a pas été reçu :

```bash
# Lister les événements récents
stripe events list --limit 5

# Renvoyer un événement spécifique
stripe events resend evt_xxxxxxxxxxxxx
```

---

## 📞 Commandes Utiles

```bash
# Voir tous les webhooks configurés
stripe webhook_endpoints list

# Voir les événements récents
stripe events list --limit 10

# Tester les connexions
node test-stripe-supabase.cjs

# Setup assisté (création price + webhook)
node setup-stripe-webhook.cjs
```

---

## 🎯 Checklist Rapide

- [ ] Nouveau Price ID créé
- [ ] Price ID dans .env.local
- [ ] Webhook endpoint configuré
- [ ] Webhook secret dans .env.local
- [ ] Serveur redémarré
- [ ] Test de paiement OK
- [ ] Logs `[WEBHOOK]` visibles
- [ ] Subscription dans Supabase

---

**Besoin d'aide ?** Voir le guide complet : `WEBHOOK_SETUP_FIX.md`
