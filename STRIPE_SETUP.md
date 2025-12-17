# 🔧 Stripe Integration - Setup Instructions

## ✅ What's Already Done

Your Stripe integration is **95% complete**! All code is in place:
- ✅ API routes (`/api/create-checkout-session`, `/api/portal`, `/api/webhooks/stripe`)
- ✅ Subscription management logic
- ✅ Frontend payment flow
- ✅ Middleware protection
- ✅ Database schema file created

## ⚠️ Critical Steps Required (15 minutes)

You need to complete 3 configuration steps before testing:

---

## Step 1: Create Supabase Database Table (5 min)

**Why:** The `subscriptions` table stores user payment data synced from Stripe webhooks.

**How:**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/imcfossyagdkgyfyjgmh/editor

2. Click on **"SQL Editor"** in left sidebar

3. Click **"New Query"**

4. Copy and paste the SQL from `supabase/migrations/001_create_subscriptions_table.sql`

5. Click **"Run"** button

6. Verify success: Check **"Table Editor"** → You should see `subscriptions` table

**Alternative (if using Supabase CLI):**
```bash
cd D:\Projects\yachtinterior
supabase db push
```

---

## Step 2: Get Supabase Service Role Key (2 min)

**Why:** Webhooks need admin access to write subscription data (they run outside user context).

**How:**

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/imcfossyagdkgyfyjgmh/settings/api

2. Scroll to **"Project API keys"**

3. Find the **`service_role`** key (NOT the `anon` key)
   - It starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Has a 🔒 icon (secret key)

4. Click **"Copy"**

5. Open `.env.local` in your project

6. Replace this line:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
   ```

   With:
   ```bash
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...your_actual_key
   ```

7. **Save the file**

⚠️ **Security Warning:** Never commit this key to Git! It's already in `.gitignore`.

---

## Step 3: Configure Stripe Webhook Secret (10 min)

**Why:** Stripe signs webhook events to verify they're authentic (prevent fraud).

### For Local Development (Recommended)

**A. Install Stripe CLI**

**Windows (PowerShell - Run as Admin):**
```powershell
scoop install stripe
```

If you don't have Scoop, install it first:
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex
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

**B. Authenticate Stripe CLI**

```bash
stripe login
```

- This opens your browser to authenticate
- Follow the prompts to connect to your Stripe account

**C. Start Webhook Forwarding**

Open a **second terminal** and run:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

You'll see output like:
```
> Ready! You are using Stripe API Version [2024-11-20]. Your webhook signing secret is whsec_abc123xyz... (^C to quit)
```

**D. Copy Webhook Secret**

Copy the `whsec_...` value and update `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_abc123xyz...
```

**Save the file**.

⚠️ **Important:** Keep this terminal running while testing! Webhooks won't work if it's closed.

### For Production (Later)

When deploying to production:

1. Deploy your app to production URL
2. Go to Stripe Dashboard → **Developers** → **Webhooks**
3. Click **"Add endpoint"**
4. Enter URL: `https://yourdomain.com/api/webhooks/stripe`
5. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
6. Click **"Add endpoint"**
7. Copy the **Signing secret** → Update production `.env.local`

---

## Step 4: Restart Development Server

After updating `.env.local`:

**Terminal 1 (App Server):**
```bash
npm run dev
```

**Terminal 2 (Stripe Webhooks - keep running):**
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 🧪 Testing the Integration

### Test Payment Flow

1. **Start the app:**
   - Open http://localhost:3000
   - You should be redirected to `/auth` (no subscription yet)

2. **Sign up/Sign in:**
   - Create a new account or sign in
   - You'll see the payment screen (12€/month)

3. **Click "S'abonner maintenant":**
   - Redirects to Stripe Checkout
   - Use test card: **4242 4242 4242 4242**
   - Any future expiry date (e.g., 12/34)
   - Any CVC (e.g., 123)

4. **Complete payment:**
   - Click "Subscribe"
   - Watch **Terminal 2** for webhook logs:
     ```
     [200] POST /api/webhooks/stripe [evt_xxx]
     checkout.session.completed
     ```

5. **Verify success:**
   - App auto-redirects to home page
   - You should see the yacht interior generator
   - Check Supabase → `subscriptions` table → Your subscription appears

### Test Customer Portal

1. **Click "Gérer l'abonnement"** (top right)
2. Stripe portal opens
3. Try:
   - Update payment method
   - Cancel subscription
   - View invoices

### Test Subscription Persistence

1. Sign out
2. Sign back in
3. Verify you still have access (no payment screen)

---

## 🐛 Troubleshooting

### Issue: "Missing Supabase Service Role Key"

**Solution:** Complete Step 2 above. Make sure you copied the `service_role` key, not `anon` key.

### Issue: Webhooks failing (400 error)

**Symptoms:** Terminal 2 shows `[400] POST /api/webhooks/stripe`

**Solution:**
1. Check `STRIPE_WEBHOOK_SECRET` in `.env.local` matches the one from `stripe listen` output
2. Restart dev server after updating `.env.local`

### Issue: Subscription not appearing in database

**Checklist:**
- [ ] Terminal 2 shows `[200] POST` (webhook succeeded)
- [ ] Supabase table `subscriptions` exists
- [ ] Service role key is configured
- [ ] Check webhook logs in app: `app/api/webhooks/stripe/route.ts` has `console.log`

### Issue: "Cannot read properties of null (reading 'id')"

**Solution:** User not authenticated. Make sure you're signed in before testing payment.

### Issue: Redirect loop after payment

**Solution:**
1. Check middleware.ts is not blocking authenticated users
2. Verify subscription status is `'active'` in database

---

## 📊 Monitoring

### Check Webhook Logs

**Stripe CLI (Terminal 2):**
```
[200] POST /api/webhooks/stripe [evt_1abc123]
checkout.session.completed
```

**App Logs (Terminal 1):**
```
Webhook received: checkout.session.completed
✅ Subscription upserted for user: xxx
```

### Verify Database

**Supabase Dashboard → Table Editor → subscriptions:**

| user_id | stripe_customer_id | status | current_period_end |
|---------|-------------------|--------|-------------------|
| xxx-xxx | cus_xxx | active | 2025-01-17 |

---

## 🚀 Next Steps

Once local testing works:

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "feat: complete Stripe integration"
   ```

2. **Deploy to production:**
   - Update `.env` in production with live Stripe keys
   - Configure production webhook endpoint
   - Test with live cards (small amounts)

3. **Optional Enhancements:**
   - Add email notifications (Resend)
   - Add analytics (track conversions)
   - Add rate limiting
   - Add error monitoring (Sentry)

---

## 📚 Resources

- [Stripe Testing Cards](https://stripe.com/docs/testing)
- [Stripe CLI Docs](https://stripe.com/docs/stripe-cli)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

---

**Need Help?**
- Check webhook logs in Terminal 2
- Check app logs in Terminal 1
- Verify database with Supabase Table Editor
- Use Stripe Dashboard → Logs to see API calls
