'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

type Mode = 'signin' | 'signup' | 'payment';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // Check for Stripe return (success/canceled)
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (success) {
      setCheckingSubscription(true);
      setStatus('Verifying your subscription...');

      let interval: ReturnType<typeof setInterval> | undefined;
      let timeout: ReturnType<typeof setTimeout> | undefined;

      const startPolling = () => {
        interval = setInterval(async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data } = await supabase
            .from('subscriptions')
            .select('status')
            .eq('user_id', user.id)
            .maybeSingle();

          const isActive =
            data?.status === 'active' ||
            data?.status === 'trialing' ||
            data?.status === 'past_due';

          if (isActive) {
            setCheckingSubscription(false);
            if (interval) clearInterval(interval);
            if (timeout) clearTimeout(timeout);
            setStatus('Subscription active! Redirecting...');
            setTimeout(() => {
              router.push('/');
            }, 1000);
          }
        }, 2000);

        timeout = setTimeout(() => {
          if (interval) clearInterval(interval);
          setCheckingSubscription(false);
          setError('Timed out. Please refresh the page.');
        }, 30000);
      };

      const syncSubscription = async () => {
        try {
          const { data: sessionData } = await supabase.auth.getSession();
          const token = sessionData.session?.access_token;

          if (sessionId && token) {
            const response = await fetch('/api/stripe/sync', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ session_id: sessionId }),
            });

            if (!response.ok) {
              const payload = await response.json();
              throw new Error(payload.error || 'Unable to sync');
            }
            setStatus('Subscription is being validated...');
          } else {
            // No session_id: rely on the webhook
            setStatus('Subscription is being validated via webhook...');
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Unable to sync the subscription. The webhook should finish in a few seconds.'
          );
        } finally {
          startPolling();
        }
      };

      syncSubscription();
      // Fallback to avoid getting stuck on /auth
      setTimeout(() => {
        router.push('/');
        setTimeout(() => (window.location.href = '/'), 500);
      }, 5000);

      return () => {
        if (interval) clearInterval(interval);
        if (timeout) clearTimeout(timeout);
      };
    }

    if (canceled) {
      setError('Payment canceled. You can try again.');
    }
  }, [router]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.access_token) {
        setError('Session expired. Please sign in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });
      const { url, error: apiError } = await response.json();

      if (apiError) {
        setError(apiError);
        setLoading(false);
        return;
      }

      window.location.href = url;
    } catch (err) {
      setError('Error creating payment session.');
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    if (mode === 'signin') {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else {
        setStatus('Signed in. Redirecting...');
        // Wait a bit for Supabase SSR to set cookies
        setTimeout(() => {
          router.push('/');
        }, 300);
      }
    } else {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (signUpError) {
        setError(signUpError.message);
      } else if (signUpData.session) {
        // If email confirmation is disabled, session comes back immediately
        setStatus('Account created! Subscription required...');
        setTimeout(() => setMode('payment'), 1000);
      } else if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        // Email already used
        setError('This email is already registered. Try signing in.');
        setMode('signin');
      } else {
        // Email confirmation required
        setStatus('A confirmation email has been sent. Check your inbox to activate your account.');
        setMode('signin');
      }
    }

    setLoading(false);
  };

  return (
    <div className="auth-page">
      <nav className="navbar glass-panel auth-nav">
        <div className="logo">YachtGenius</div>
        <button className="btn-primary" onClick={() => router.push('/')}>
          Back
        </button>
      </nav>

      <main className="auth-grid">
        <section className="auth-hero glass-panel">
          <p className="eyebrow">Secured by Supabase</p>
          <h1>
            YachtGenius
            <span className="accent"> Auth</span>
          </h1>
          <p className="lead">
            Sign in to continue your redesigns or create an account to launch your first interior
            transformation.
          </p>
          <div className="hero-highlight">
            <p>Full control</p>
            <p>Synced history</p>
            <p>Secure sessions</p>
          </div>
        </section>

        <section className="auth-card glass-panel">
          {mode === 'payment' ? (
            <div className="payment-section">
              <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#D4AF37' }}>
                YachtGenius Pro Subscription
              </h2>

              <div className="pricing-card" style={{
                textAlign: 'center',
                padding: '2rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#D4AF37' }}>
                  12 EUR<span style={{ fontSize: '1.5rem' }}>/month</span>
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: '2rem 0',
                  lineHeight: '2',
                  textAlign: 'left'
                }}>
                  <li>- Unlimited interior generations</li>
                  <li>- 5 unique styles per generation</li>
                  <li>- Gemini 2.5 Flash AI</li>
                  <li>- High-resolution images</li>
                  <li>- Priority support</li>
                </ul>

                {error && <p className="status error" style={{ marginBottom: '1rem' }}>{error}</p>}
                {status && <p className="status success" style={{ marginBottom: '1rem' }}>{status}</p>}

                <button
                  className="btn-gold full"
                  onClick={handleSubscribe}
                  disabled={loading || checkingSubscription}
                  style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
                >
                  {loading ? 'Redirecting to Stripe...' : checkingSubscription ? 'Verifying...' : 'Subscribe now'}
                </button>

                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                  Secure payment via Stripe. Cancel anytime.
                </p>

                <button
                  onClick={() => setMode('signin')}
                  style={{
                    marginTop: '1rem',
                    background: 'none',
                    border: 'none',
                    color: '#D4AF37',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                  type="button"
                >
                  Back to sign in
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="mode-toggle">
                <button
                  className={mode === 'signin' ? 'toggle active' : 'toggle'}
                  onClick={() => setMode('signin')}
                  type="button"
                >
                  Sign in
                </button>
                <button
                  className={mode === 'signup' ? 'toggle active' : 'toggle'}
                  onClick={() => setMode('signup')}
                  type="button"
                >
                  Sign up
                </button>
              </div>

              <form className="auth-form" onSubmit={handleSubmit}>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    placeholder="capitaine@yacht.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>

                <label className="field">
                  <span>Password</span>
                  <input
                    type="password"
                    placeholder="********"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </label>

                {mode === 'signup' && (
                  <label className="field">
                    <span>Confirm password</span>
                    <input
                      type="password"
                      placeholder="********"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </label>
                )}

                {error && <p className="status error">{error}</p>}
                {status && <p className="status success">{status}</p>}

                <button className="btn-gold full" type="submit" disabled={loading}>
                  {loading ? 'Processing...' : mode === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              </form>

              <p className="hint">
                By using YachtGenius Auth, you agree to our best practices: security, sensible passwords,
                and caution with links you receive.
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
