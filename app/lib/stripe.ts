import Stripe from 'stripe';
import { getStripeSecretKey } from '@/app/lib/stripe-config';

let stripeClient: Stripe | null = null;

export const getStripe = (): Stripe => {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey(), {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    });
  }

  return stripeClient;
};
