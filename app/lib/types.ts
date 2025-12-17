/**
 * TypeScript type definitions for the application
 */

// Stripe Subscription Status
export type SubscriptionStatus =
  | 'active'
  | 'canceled'
  | 'past_due'
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'unpaid';

// Subscription record from Supabase
export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id: string;
  stripe_subscription_id?: string | null;
  stripe_price_id?: string | null;
  status: SubscriptionStatus;
  current_period_start?: string | null;
  current_period_end?: string | null;
  cancel_at_period_end: boolean;
  canceled_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Stripe Customer metadata
export interface StripeCustomerMetadata {
  supabaseUserId: string;
}

// Stripe Checkout Session metadata
export interface StripeCheckoutMetadata {
  userId: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

// User subscription check result
export interface SubscriptionCheck {
  hasActiveSubscription: boolean;
  subscription?: Subscription | null;
  reason?: string;
}

// Gemini API types (if needed)
export interface YachtStyle {
  id: string;
  name: string;
  description: string;
  keywords: string[];
}

export interface GenerateRequest {
  imageBase64: string;
  style: string;
}

export interface GenerateResponse {
  imageUrl: string;
  style: string;
  prompt: string;
}
