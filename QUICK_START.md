# 🚀 Quick Start - Résolution du Problème

## 🔴 Problème Identifié

Votre paiement Stripe fonctionne mais **les webhooks ne sont pas configurés**, donc :
- ✅ Le paiement réussit dans Stripe
- ❌ La subscription n'est jamais enregistrée dans Supabase
- ❌ Vous êtes redirigé vers `/auth` à chaque reconnexion

---

## ✅ Solution en 5 Minutes

### Étape 1: Créer un Price ID valide (2 min)

1. Aller sur https://dashboard.stripe.com/test/products
2. S'assurer d'être en mode **TEST** (switch en haut à droite)
3. Cliquer **"+ Add product"**
4. Remplir:
   ```
   Name: YachtGenius Premium
   Price: 12.00 EUR
   Billing: Monthly
   ```
5. Cliquer **"Save product"**
6. **Copier le Price ID** (format: `price_xxxxxxxxx`)
7. Mettre à jour `.env.local`:
   ```bash
   NEXT_PUBLIC_STRIPE_PRICE_ID=price_xxxxxxxxx
   ```

### Étape 2: Installer Stripe CLI (1 min)

**Windows:**
```powershell
# PowerShell (Administrateur)
scoop install stripe

# OU télécharger depuis:
# https://github.com/stripe/stripe-cli/releases/latest
```

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Linux:**
```bash
wget https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_x86_64.tar.gz
tar -xvf stripe_linux_x86_64.tar.gz
sudo mv stripe /usr/local/bin/
```

**Se connecter:**
```bash
stripe login
```

### Étape 3: Appliquer la migration email (30 sec)

1. Aller sur: https://supabase.com/dashboard/project/imcfossyagdkgyfyjgmh/sql/new
2. Copier-coller ce SQL:
   ```sql
   -- Add email column
   ALTER TABLE public.subscriptions
   ADD COLUMN IF NOT EXISTS email TEXT;

   -- Add index
   CREATE INDEX IF NOT EXISTS subscriptions_email_idx
   ON public.subscriptions(email);
   ```
3. Cliquer **"Run"**

### Étape 4: Lancer les serveurs (30 sec)

**Terminal 1:**
```bash
npm run dev
```

**Terminal 2:**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

**IMPORTANT:** Dans Terminal 2, vous verrez:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Copier ce secret** et mettre à jour `.env.local`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
```

**Relancer le serveur dev** (Ctrl+C puis `npm run dev`)

### Étape 5: Tester (1 min)

```bash
# Dans un 3ème terminal
node test-connections.cjs
```

**Résultat attendu:**
```
Stripe Connection:     ✅ PASS
Supabase Connection:   ✅ PASS
Webhook Configuration: ✅ PASS
```

---

## 🧪 Test du Flux Complet

1. **Aller sur:** http://localhost:3000/auth
2. **Se déconnecter** si connecté
3. **Créer un compte:** test@example.com / password123
4. **Cliquer:** "S'abonner maintenant"
5. **Carte test Stripe:**
   ```
   Card: 4242 4242 4242 4242
   Expiry: 12/34
   CVC: 123
   ```
6. **Cliquer:** "Subscribe"
7. **Attendre 2-3 secondes** → Redirection vers `/`
8. **Dans Terminal 2**, vous devriez voir:
   ```
   [WEBHOOK] Received event: checkout.session.completed
   [WEBHOOK] ✅ Subscription created successfully
   ```
9. **Vérifier Supabase:**
   - Dashboard → Table `subscriptions`
   - Devrait avoir 1 record avec votre email

10. **Tester reconnexion:**
    - Se déconnecter
    - Se reconnecter
    - Devrait rester sur `/` ✅

---

## 🔍 Vérifier que Tout Fonctionne

### Checklist:

- [ ] Price ID créé et mis dans `.env.local`
- [ ] Stripe CLI installé (`stripe --version` fonctionne)
- [ ] Migration SQL appliquée dans Supabase
- [ ] `stripe listen` actif dans Terminal 2
- [ ] Webhook secret copié dans `.env.local`
- [ ] `npm run dev` relancé après mise à jour env
- [ ] `node test-connections.cjs` → ✅ PASS
- [ ] Test paiement → Redirect vers `/`
- [ ] Vérif Supabase → 1 record dans `subscriptions`
- [ ] Reconnexion → Reste sur `/`

---

## 🐛 Si Ça Ne Marche Pas

### Problème: "Invalid signature"

```bash
# Relancer stripe listen pour avoir un nouveau secret
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copier le NOUVEAU secret
# Mettre à jour .env.local
# Relancer npm run dev
```

### Problème: "No such price"

```bash
# Vérifier que le Price ID est correct
node test-connections.cjs

# Devrait dire: ✅ Price ID valid
# Si ❌, recréer le produit dans Stripe Dashboard
```

### Problème: Webhook retourne 500

```bash
# Vérifier les logs du serveur (Terminal 1)
# Chercher les erreurs [WEBHOOK] ❌

# Vérifier que SUPABASE_SERVICE_ROLE_KEY est dans .env.local
# Vérifier que la table subscriptions existe
```

### Problème: Pas de redirect après paiement

```bash
# Vérifier que stripe listen est actif
# Devrait afficher des events dans Terminal 2

# Si rien ne s'affiche, vérifier le webhook secret
```

---

## 📚 Documentation Complète

- **Setup complet:** `STRIPE_SETUP_GUIDE.md`
- **Diagnostic détaillé:** `DIAGNOSTIC_REPORT.md`
- **Architecture projet:** `CLAUDE.md`

---

## ✅ Résumé

Vous avez maintenant:
- ✅ Webhook Stripe configuré et actif
- ✅ Email stocké dans la DB
- ✅ Logs détaillés pour déboguer
- ✅ Tests automatisés

**Prêt à tester !** 🎉
