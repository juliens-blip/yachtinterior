# 🔍 Diagnostic Report - YachtGenius Stripe Integration

**Date:** 2025-12-17
**Status:** ❌ PROBLÈMES CRITIQUES IDENTIFIÉS

---

## 📊 Résumé Exécutif

Le paiement Stripe fonctionne correctement, mais **les webhooks ne créent pas de records dans Supabase**. C'est pourquoi l'utilisateur est redirigé vers la page d'abonnement à la reconnexion.

### État des Systèmes

| Système | Status | Détails |
|---------|--------|---------|
| Stripe Connection | ✅ OK | API Key valide, connexion réussie |
| Supabase Connection | ✅ OK | DB accessible, table exists |
| Table `subscriptions` | ✅ OK | Structure correcte, RLS configuré |
| Price ID | ❌ INVALIDE | `price_1Sf6nVIovqQ8MlIX8mg9uYJj` n'existe pas |
| Webhooks Stripe | ❌ NON CONFIGURÉ | Aucun endpoint actif |
| Data dans DB | ❌ VIDE | 0 subscriptions enregistrées |

---

## 🚨 Problèmes Identifiés

### 1. CRITIQUE : Webhooks Non Configurés

**Symptôme:**
- Table `subscriptions` est vide (0 records)
- Aucun webhook endpoint configuré dans Stripe Dashboard
- Listener local (`stripe listen`) non actif

**Impact:**
- Les paiements réussissent dans Stripe
- MAIS les subscriptions ne sont jamais enregistrées dans Supabase
- L'utilisateur ne peut pas accéder à l'app après paiement

**Cause:**
Quand l'utilisateur paie :
1. ✅ Stripe Checkout réussit
2. ✅ Utilisateur redirigé vers `/auth?success=true`
3. ❌ Webhook `checkout.session.completed` n'est JAMAIS envoyé
4. ❌ Fonction `upsertSubscription()` n'est JAMAIS appelée
5. ❌ Table `subscriptions` reste vide
6. ❌ À la reconnexion, middleware vérifie la DB → Pas de subscription → Redirect vers `/auth`

**Solution:**
```bash
# Pour le développement local
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Pour la production
# Ajouter dans Stripe Dashboard → Webhooks:
# URL: https://yourdomain.com/api/webhooks/stripe
# Events: checkout.session.completed, customer.subscription.updated,
#         customer.subscription.deleted, invoice.payment_failed
```

---

### 2. CRITIQUE : Price ID Invalide

**Erreur détectée:**
```
❌ Price ID invalid: No such price: 'price_1Sf6nVIovqQ8MlIX8mg9uYJj'
```

**Fichier:** `.env.local`
```
NEXT_PUBLIC_STRIPE_PRICE_ID=price_1Sf6nVIovqQ8MlIX8mg9uYJj
```

**Impact:**
- La création de checkout session échouera
- Impossible de créer un abonnement

**Solution:**
1. Aller dans [Stripe Dashboard → Products](https://dashboard.stripe.com/test/products)
2. Créer un nouveau produit "YachtGenius Premium" à 12€/mois
3. Copier le Price ID (commence par `price_...`)
4. Remplacer dans `.env.local`

---

### 3. MOYEN : Email Non Stocké

**Problème:**
L'email de l'utilisateur n'est jamais stocké dans la table `subscriptions`.

**Code actuel:** `app/api/webhooks/stripe/route.ts:65-75`
```typescript
await upsertSubscription(userId, customerId, {
  stripe_subscription_id: subId,
  stripe_price_id: items.data[0].price.id,
  status: subStatus,
  current_period_start: new Date(current_period_start * 1000).toISOString(),
  current_period_end: new Date(current_period_end * 1000).toISOString(),
  cancel_at_period_end: cancelAtPeriodEnd,
  canceled_at: canceled_at ? new Date(canceled_at * 1000).toISOString() : null,
  // ❌ MANQUE: email: session.customer_email
});
```

**Impact:**
- L'email existe dans `auth.users` mais pas dans `subscriptions`
- Difficile d'afficher l'email dans un admin dashboard

**Solution:**
Ajouter une colonne `email` à la table et la remplir depuis le webhook.

---

### 4. FAIBLE : Logging Insuffisant

**Problème:**
Difficile de déboguer quand un webhook échoue (pas de logs détaillés).

**Solution:**
Ajouter des logs complets dans le webhook handler.

---

## ✅ Solutions & Corrections

### Solution 1: Créer un Price ID Valide

**Étapes:**

1. Ouvrir Stripe Dashboard Test Mode
2. Aller dans **Products** → **Add product**
3. Créer:
   - Name: `YachtGenius Premium`
   - Description: `Accès complet à l'outil de redesign d'intérieurs de yachts avec IA`
   - Pricing: `12 EUR / month`
   - Billing period: `Monthly`
4. Cliquer **Save product**
5. Copier le **Price ID** (format: `price_xxxxxxxxxxxxx`)
6. Mettre à jour `.env.local`:
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_ID=price_NEW_ID_HERE
   ```

### Solution 2: Activer les Webhooks en Local

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
stripe login  # Si pas déjà connecté
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Résultat attendu:**
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxx
```

**Important:** Copier le `whsec_...` et mettre à jour `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
```

### Solution 3: Ajouter l'Email dans Subscriptions

**Migration SQL:**
```sql
-- Add email column to subscriptions table
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS subscriptions_email_idx
ON public.subscriptions(email);

-- Add comment
COMMENT ON COLUMN public.subscriptions.email IS 'User email from Stripe customer';
```

**Mise à jour du webhook handler:**
```typescript
// Dans app/api/webhooks/stripe/route.ts, ligne 65
await upsertSubscription(userId, customerId, {
  stripe_subscription_id: subId,
  stripe_price_id: items.data[0].price.id,
  status: subStatus,
  current_period_start: new Date(current_period_start * 1000).toISOString(),
  current_period_end: new Date(current_period_end * 1000).toISOString(),
  cancel_at_period_end: cancelAtPeriodEnd,
  canceled_at: canceled_at ? new Date(canceled_at * 1000).toISOString() : null,
  email: session.customer_email,  // ✅ AJOUT
});
```

### Solution 4: Améliorer le Logging

**Ajout dans webhook handler:**
```typescript
console.log(`[WEBHOOK] ${event.type} received`);
console.log(`[WEBHOOK] User ID: ${userId}`);
console.log(`[WEBHOOK] Customer ID: ${customerId}`);
console.log(`[WEBHOOK] Subscription ID: ${subscriptionId}`);
console.log(`[WEBHOOK] Status: ${subStatus}`);
console.log(`[WEBHOOK] Attempting to upsert...`);

await upsertSubscription(...);

console.log(`[WEBHOOK] ✅ Subscription saved successfully`);
```

---

## 🧪 Plan de Test

### Test 1: Vérifier Price ID

```bash
node test-connections.cjs
```

**Résultat attendu:**
```
✅ Price ID valid
   Price: 12.00 EUR / month
```

### Test 2: Tester le Webhook en Local

**Étapes:**

1. Lancer dev server: `npm run dev`
2. Lancer listener: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Créer un test checkout:
   ```bash
   stripe trigger checkout.session.completed
   ```
4. Vérifier logs dans le terminal du listener
5. Vérifier Supabase Dashboard → Table `subscriptions` → Should have 1 record

### Test 3: Flux Complet Utilisateur

1. Se déconnecter de l'app
2. Créer nouveau compte (email test)
3. Cliquer "S'abonner"
4. Utiliser carte test Stripe: `4242 4242 4242 4242`
5. Vérifier logs webhook dans terminal
6. Attendre 2-3 secondes
7. Devrait être redirigé vers `/` (accueil)
8. Se déconnecter et reconnecter
9. Devrait rester sur `/` (pas de redirect vers `/auth`)

---

## 📋 Checklist de Résolution

- [ ] Créer nouveau Product/Price dans Stripe Dashboard
- [ ] Mettre à jour `NEXT_PUBLIC_STRIPE_PRICE_ID` dans `.env.local`
- [ ] Lancer `stripe listen` dans un terminal séparé
- [ ] Copier le webhook secret et mettre à jour `.env.local`
- [ ] Relancer `npm run dev`
- [ ] Exécuter `node test-connections.cjs` → Devrait être ✅ PASS
- [ ] (Optionnel) Ajouter colonne `email` à la table subscriptions
- [ ] (Optionnel) Mettre à jour webhook handler pour enregistrer l'email
- [ ] Tester un paiement complet
- [ ] Vérifier que la subscription apparaît dans Supabase
- [ ] Tester reconnexion → Devrait rester connecté

---

## 🎯 Résumé des Fichiers à Modifier

### Fichiers à modifier:

1. **`.env.local`** - Mettre à jour Price ID et Webhook Secret
2. **`supabase/migrations/002_add_email_to_subscriptions.sql`** - (Nouveau) Migration email
3. **`app/api/webhooks/stripe/route.ts`** - Ajouter email dans upsertSubscription
4. **`app/lib/subscription.ts`** - (Optionnel) Ajouter type pour email

### Fichiers de test créés:

- ✅ `test-connections.cjs` - Vérifier connexions et configuration
- ✅ `debug-webhook.cjs` - Analyser le flux webhook

---

## 📞 Prochaines Étapes

1. **Immédiat:** Créer le Price ID valide dans Stripe
2. **Immédiat:** Lancer `stripe listen` pour activer webhooks
3. **Court terme:** Ajouter colonne email (amélioration)
4. **Moyen terme:** Créer admin dashboard pour voir les subscriptions
5. **Long terme:** Déployer en production avec webhooks Stripe configurés

---

**Fin du rapport**
