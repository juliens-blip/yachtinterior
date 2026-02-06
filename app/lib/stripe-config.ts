import 'server-only';

export type StripeMode = 'test' | 'live';

const parseStripeMode = (value?: string): StripeMode | null => {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'test' || normalized === 'live') {
    return normalized;
  }
  return null;
};

const getFirstEnvValue = (keys: readonly string[]): string | undefined => {
  for (const key of keys) {
    const value = process.env[key];
    if (value && value.trim()) {
      return value.trim();
    }
  }
  return undefined;
};

const inferStripeMode = (): StripeMode => {
  const explicitMode = parseStripeMode(process.env.STRIPE_MODE);
  if (explicitMode) {
    return explicitMode;
  }

  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === 'production') {
    return 'live';
  }
  if (vercelEnv === 'preview' || vercelEnv === 'development') {
    return 'test';
  }

  const liveKey = process.env.STRIPE_SECRET_KEY_LIVE;
  const testKey = process.env.STRIPE_SECRET_KEY_TEST;
  const legacyKey = process.env.STRIPE_SECRET_KEY;

  if (liveKey && !testKey) {
    return 'live';
  }
  if (testKey && !liveKey) {
    return 'test';
  }
  if (!liveKey && !testKey && legacyKey?.startsWith('sk_live_')) {
    return 'live';
  }

  return 'test';
};

export const stripeMode: StripeMode = inferStripeMode();

type KeyConfig = {
  label: string;
  live: readonly string[];
  test: readonly string[];
  legacy?: readonly string[];
};

const hasModeSpecificValue = (config: KeyConfig): boolean =>
  Boolean(getFirstEnvValue([...config.live, ...config.test]));

const resolveKeyValue = (config: KeyConfig): string | undefined => {
  const envKeys = stripeMode === 'live' ? config.live : config.test;
  if (hasModeSpecificValue(config)) {
    return getFirstEnvValue(envKeys);
  }
  return getFirstEnvValue([...envKeys, ...(config.legacy ?? [])]);
};

const requireKeyValue = (config: KeyConfig): string => {
  const value = resolveKeyValue(config);
  if (value) {
    return value;
  }

  const envKeys = stripeMode === 'live' ? config.live : config.test;
  const attempted = hasModeSpecificValue(config)
    ? envKeys.join(', ')
    : [...envKeys, ...(config.legacy ?? [])].join(', ');
  throw new Error(
    `[Stripe config] Missing ${config.label} for "${stripeMode}" mode. Checked: ${attempted}`
  );
};

const ensureSecretKeyMatchesMode = (key: string): string => {
  if (stripeMode === 'test' && key.startsWith('sk_live_')) {
    throw new Error(
      '[Stripe config] Test mode is active but a live secret key was selected. Configure STRIPE_SECRET_KEY_TEST.'
    );
  }
  if (stripeMode === 'live' && key.startsWith('sk_test_')) {
    throw new Error(
      '[Stripe config] Live mode is active but a test secret key was selected. Configure STRIPE_SECRET_KEY_LIVE.'
    );
  }
  return key;
};

export const getStripeSecretKey = (): string =>
  ensureSecretKeyMatchesMode(
    requireKeyValue({
      label: 'Stripe secret key',
      live: ['STRIPE_SECRET_KEY_LIVE'],
      test: ['STRIPE_SECRET_KEY_TEST'],
      legacy: ['STRIPE_SECRET_KEY'],
    })
  );

export const getStripeWebhookSecret = (): string =>
  requireKeyValue({
    label: 'Stripe webhook secret',
    live: ['STRIPE_WEBHOOK_SECRET_LIVE'],
    test: ['STRIPE_WEBHOOK_SECRET_TEST'],
    legacy: ['STRIPE_WEBHOOK_SECRET'],
  });

export const getStripePriceId = (): string =>
  requireKeyValue({
    label: 'Stripe price id',
    live: ['STRIPE_PRICE_ID_LIVE', 'NEXT_PUBLIC_STRIPE_PRICE_ID_LIVE'],
    test: ['STRIPE_PRICE_ID_TEST', 'NEXT_PUBLIC_STRIPE_PRICE_ID_TEST'],
    legacy: ['NEXT_PUBLIC_STRIPE_PRICE_ID', 'STRIPE_PRICE_ID'],
  });

export const getStripePublishableKey = (): string | undefined =>
  resolveKeyValue({
    label: 'Stripe publishable key',
    live: ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_LIVE'],
    test: ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_TEST'],
    legacy: ['NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'],
  });
