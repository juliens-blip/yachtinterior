# 🚀 Guide de Configuration Stripe - YachtGenius

Ce guide vous explique comment configurer Stripe pour que les paiements fonctionnent correctement.

---

## 📋 Prérequis

- Compte Stripe (mode Test)
- Accès au Stripe Dashboard
- Node.js installé
- Supabase configuré

---

## 🔧 Étape 1: Installer Stripe CLI

### Windows (PowerShell - Administrateur)

```powershell
# Méthode 1: Scoop
scoop install stripe

# Méthode 2: Téléchargement direct
# Télécharger depuis: https://github.com/stripe/stripe-cli/releases/latest
# Extraire dans C:\Program Files\Stripe\
# Ajouter au PATH système
```

### macOS

```bash
brew install stripe/stripe-cli/stripe
```

### Linux

```bash
# Debian/Ubuntu
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

### Vérifier l'installation

```bash
stripe --version
# Devrait afficher: stripe version X.X.X
```

### Se connecter à Stripe

```bash
stripe login
# Suivre les instructions pour autoriser l'accès
```

---

## 💳 Étape 2: Créer un Produit et Prix dans Stripe

### Via Stripe Dashboard (Recommandé)

1. **Ouvrir le Dashboard**
   - Aller sur https://dashboard.stripe.com/test/products
   - S'assurer d'être en mode **TEST** (en haut à droite)

2. **Créer un nouveau produit**
   - Cliquer **"+ Add product"**

3. **Remplir les informations**
   ```
   Product information:
   ├─ Name: YachtGenius Premium
   ├─ Description: Accès complet à l'outil de redesign d'intérieurs de yachts avec IA
   ├─ Image: (optionnel)
   └─ Statement descriptor: YACHTGENIUS

   Pricing:
   ├─ Price: 12.00
   ├─ Currency: EUR
   ├─ Billing period: Monthly
   ├─ Usage type: Licensed
   └─ Payment type: Recurring
   ```

4. **Sauvegarder**
   - Cliquer **"Save product"**

5. **Copier le Price ID**
   - Dans la section "Pricing", copier l'ID qui commence par `price_...`
   - Exemple: `price_1QZaBcDeFgHiJkLmNoPqRsTu`

6. **Mettre à jour `.env.local`**
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_ID=price_1QZaBcDeFgHiJkLmNoPqRsTu
   ```

### Via Stripe CLI (Alternative)

```bash
# Créer le produit
stripe products create \
  --name="YachtGenius Premium" \
  --description="Accès complet à l'outil de redesign avec IA"

# Créer le prix (remplacer PRODUCT_ID par l'ID retourné ci-dessus)
stripe prices create \
  --product=PRODUCT_ID \
  --unit-amount=1200 \
  --currency=eur \
  --recurring[interval]=month

# Copier le Price ID retourné
```

---

## 🔗 Étape 3: Configurer les Webhooks en Local

### Lancer le serveur de développement

**Terminal 1:**
```bash
npm run dev
```

### Lancer le listener Stripe

**Terminal 2:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**Résultat attendu:**
```
> Ready! You have a new webhook signing secret: whsec_xxxxxxxxxxxxxxxxxxxxx

2025-12-17 15:30:00   --> charge.succeeded [evt_xxxxx]
2025-12-17 15:30:01   <--  [200] POST http://localhost:3000/api/webhooks/stripe
```

### Copier le Webhook Secret

Dans le terminal où vous avez lancé `stripe listen`, vous verrez:

```
> Ready! You have a new webhook signing secret: whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Mettre à jour `.env.local`:**
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

### Relancer le serveur

```bash
# Arrêter le serveur (Ctrl+C) et relancer
npm run dev
```

---

## 🧪 Étape 4: Tester la Configuration

### Test 1: Vérifier les connexions

```bash
node test-connections.cjs
```

**Résultat attendu:**
```
═══════════════════════════════════════════════════════
  Test Summary
═══════════════════════════════════════════════════════
Stripe Connection:     ✅ PASS
Supabase Connection:   ✅ PASS
Webhook Configuration: ✅ PASS
User Data Check:       ⚠️  WARN (normal si aucun paiement encore)
```

### Test 2: Déclencher un webhook test

**Dans le terminal avec `stripe listen` actif:**

```bash
stripe trigger checkout.session.completed
```

**Vérifier:**
1. Les logs dans le terminal `stripe listen` montrent: `<-- [200] POST`
2. Les logs du serveur Next.js montrent le traitement du webhook
3. Aller dans Supabase Dashboard → Table `subscriptions` → Devrait avoir 1 nouveau record

### Test 3: Paiement complet

1. **Créer un compte test**
   - Aller sur http://localhost:3000/auth
   - Créer un compte avec email: `test@example.com`

2. **Cliquer "S'abonner"**
   - Devrait rediriger vers Stripe Checkout

3. **Remplir les infos de paiement**
   ```
   Card number: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   Name: Test User
   ```

4. **Compléter le paiement**
   - Cliquer "Subscribe"

5. **Vérifier le webhook**
   - Terminal `stripe listen` devrait afficher:
     ```
     2025-12-17 15:35:00   --> checkout.session.completed [evt_xxxxx]
     2025-12-17 15:35:01   <--  [200] POST http://localhost:3000/api/webhooks/stripe
     ```

6. **Vérifier la redirection**
   - Après 2-3 secondes, devrait être redirigé vers `/` (accueil)

7. **Tester la reconnexion**
   - Se déconnecter
   - Se reconnecter avec le même email
   - Devrait rester sur `/` (pas de redirect vers `/auth`)

8. **Vérifier Supabase**
   - Supabase Dashboard → Table `subscriptions`
   - Devrait voir 1 record avec:
     - `status`: active
     - `email`: test@example.com
     - `current_period_end`: date dans 1 mois

---

## 🌍 Étape 5: Configuration pour la Production

### Créer un Webhook Endpoint dans Stripe

1. **Aller dans Stripe Dashboard**
   - https://dashboard.stripe.com/webhooks

2. **Passer en mode LIVE** (en haut à droite)

3. **Cliquer "+ Add endpoint"**

4. **Configurer l'endpoint**
   ```
   Endpoint URL: https://votre-domaine.com/api/webhooks/stripe
   Description: YachtGenius Production Webhooks

   Events to send:
   ☑ checkout.session.completed
   ☑ customer.subscription.updated
   ☑ customer.subscription.deleted
   ☑ invoice.payment_failed
   ```

5. **Sauvegarder et copier le Signing Secret**
   - Format: `whsec_xxxxxxxxxxxxxxxx`

6. **Ajouter dans les variables d'environnement de production**
   - Vercel: Settings → Environment Variables
   - Railway: Variables
   - Etc.

   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxx (production secret, différent du local)
   STRIPE_SECRET_KEY=sk_live_xxxxxxxxxx (clé live, pas test)
   NEXT_PUBLIC_STRIPE_PRICE_ID=price_live_xxxxxxxxx (prix en mode live)
   ```

---

## 🐛 Dépannage

### Problème: "Invalid signature"

**Cause:** Le `STRIPE_WEBHOOK_SECRET` ne correspond pas.

**Solution:**
1. Arrêter `stripe listen`
2. Relancer `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
3. Copier le NOUVEAU secret affiché
4. Mettre à jour `.env.local`
5. Relancer `npm run dev`

### Problème: "No such price"

**Cause:** Le `NEXT_PUBLIC_STRIPE_PRICE_ID` est invalide.

**Solution:**
1. Aller dans Stripe Dashboard → Products
2. Vérifier que le produit existe en mode TEST
3. Copier le bon Price ID
4. Mettre à jour `.env.local`

### Problème: Webhook retourne 500

**Cause:** Erreur dans le code du webhook ou Supabase inaccessible.

**Solution:**
1. Vérifier les logs du serveur Next.js
2. Vérifier que `SUPABASE_SERVICE_ROLE_KEY` est configuré
3. Vérifier que la table `subscriptions` existe dans Supabase

### Problème: Subscription non créée

**Cause:** Le listener n'est pas actif.

**Solution:**
1. Vérifier que `stripe listen` tourne dans un terminal séparé
2. Vérifier les logs: devrait afficher `<-- [200]` après chaque event
3. Si `<-- [400]` ou `<-- [500]`, il y a une erreur

---

## 📚 Ressources

- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Testing Cards](https://stripe.com/docs/testing#cards)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Products & Prices](https://stripe.com/docs/api/prices)

---

## ✅ Checklist Finale

- [ ] Stripe CLI installé et connecté (`stripe login`)
- [ ] Produit créé dans Stripe Dashboard (mode TEST)
- [ ] Price ID copié et mis dans `.env.local`
- [ ] `stripe listen` lancé dans terminal séparé
- [ ] Webhook secret copié et mis dans `.env.local`
- [ ] Serveur dev relancé (`npm run dev`)
- [ ] Test connections: `node test-connections.cjs` → ✅ PASS
- [ ] Test webhook: `stripe trigger checkout.session.completed` → ✅ OK
- [ ] Test paiement complet → ✅ Redirect vers `/`
- [ ] Test reconnexion → ✅ Reste connecté

---

**Prêt à tester !** 🎉
