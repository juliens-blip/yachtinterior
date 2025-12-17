-- Create subscriptions table for Stripe integration
-- This table stores user subscription data synced via webhooks

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  status TEXT NOT NULL,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT subscriptions_user_id_key UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own subscription
CREATE POLICY "Users can read own subscription"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role has full access (for webhooks)
CREATE POLICY "Service role has full access"
  ON public.subscriptions
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Indexes for faster lookups
CREATE INDEX subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX subscriptions_stripe_customer_id_idx ON public.subscriptions(stripe_customer_id);
CREATE INDEX subscriptions_status_idx ON public.subscriptions(status);

-- Comments for documentation
COMMENT ON TABLE public.subscriptions IS 'Stores Stripe subscription data synced via webhooks';
COMMENT ON COLUMN public.subscriptions.status IS 'Stripe subscription status: active, canceled, past_due, incomplete';
COMMENT ON COLUMN public.subscriptions.cancel_at_period_end IS 'Whether subscription will cancel at end of current period';
