-- Migration: Add email column to subscriptions table
-- Created: 2025-12-17
-- Purpose: Store user email from Stripe for easier admin management

-- Add email column
ALTER TABLE public.subscriptions
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add index for faster email lookups
CREATE INDEX IF NOT EXISTS subscriptions_email_idx
ON public.subscriptions(email);

-- Add comment for documentation
COMMENT ON COLUMN public.subscriptions.email IS 'User email from Stripe customer, synced via webhooks';

-- No need to backfill existing records as table is currently empty
-- If there were existing records, you would run:
-- UPDATE public.subscriptions s
-- SET email = (
--   SELECT email FROM auth.users u WHERE u.id = s.user_id
-- )
-- WHERE s.email IS NULL;
