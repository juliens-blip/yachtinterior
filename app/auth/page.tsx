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
    const canceled = searchParams.get('canceled');

    if (success) {
      setCheckingSubscription(true);
      setStatus('Vérification de votre abonnement...');

      const interval = setInterval(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
          .from('subscriptions')
          .select('status')
          .eq('user_id', user.id)
          .single();

        if (data?.status === 'active') {
          setCheckingSubscription(false);
          clearInterval(interval);
          setStatus('Abonnement activé ! Redirection...');
          setTimeout(() => router.push('/'), 2000);
        }
      }, 2000);

      setTimeout(() => {
        clearInterval(interval);
        setCheckingSubscription(false);
        setError('Délai d\'attente dépassé. Veuillez rafraîchir la page.');
      }, 30000);

      return () => clearInterval(interval);
    }

    if (canceled) {
      setError('Paiement annulé. Vous pouvez réessayer.');
    }
  }, [router]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session?.access_token) {
        setError('Session expirée. Merci de te reconnecter.');
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
      setError('Erreur lors de la création de la session de paiement');
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setStatus('');

    if (mode === 'signup' && password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
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
        // Check subscription status
        const { data: { user } } = await supabase.auth.getUser();
        const { data: subscription } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user!.id)
          .single();

        const isActive = subscription?.status === 'active' ||
          (subscription?.status === 'canceled' && subscription?.current_period_end && new Date(subscription.current_period_end) > new Date());

        if (isActive) {
          setStatus('Connexion réussie. Redirection...');
          router.push('/');
        } else {
          setStatus('Abonnement requis');
          setMode('payment');
        }
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
        // Si une session est retournée directement (confirmation email désactivée)
        setStatus('Compte créé ! Abonnement requis...');
        setTimeout(() => setMode('payment'), 1000);
      } else if (signUpData.user && signUpData.user.identities && signUpData.user.identities.length === 0) {
        // Email déjà utilisé
        setError('Cet email est déjà enregistré. Essaie de te connecter.');
        setMode('signin');
      } else {
        // Confirmation d'email requise
        setStatus('Un email de confirmation a été envoyé. Vérifie ta boîte mail pour activer ton compte.');
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
          Retour
        </button>
      </nav>

      <main className="auth-grid">
        <section className="auth-hero glass-panel">
          <p className="eyebrow">Sécurisé par Supabase</p>
          <h1>
            Accès YachtGenius
            <span className="accent"> Auth</span>
          </h1>
          <p className="lead">
            Connecte-toi pour poursuivre tes redesigns ou crée un compte pour lancer ta première
            transformation d&apos;intérieur.
          </p>
          <div className="hero-highlight">
            <p>Contrôle total</p>
            <p>Historique synchronisé</p>
            <p>Sessions sécurisées</p>
          </div>
        </section>

        <section className="auth-card glass-panel">
          {mode === 'payment' ? (
            <div className="payment-section">
              <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#D4AF37' }}>
                Abonnement YachtGenius Pro
              </h2>

              <div className="pricing-card" style={{
                textAlign: 'center',
                padding: '2rem',
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <div style={{ fontSize: '3rem', fontWeight: 'bold', color: '#D4AF37' }}>
                  12€<span style={{ fontSize: '1.5rem' }}>/mois</span>
                </div>

                <ul style={{
                  listStyle: 'none',
                  padding: '2rem 0',
                  lineHeight: '2',
                  textAlign: 'left'
                }}>
                  <li>✓ Générations illimitées d'intérieurs</li>
                  <li>✓ 5 styles uniques par génération</li>
                  <li>✓ IA Gemini 2.5 Flash</li>
                  <li>✓ Images haute résolution</li>
                  <li>✓ Support prioritaire</li>
                </ul>

                {error && <p className="status error" style={{ marginBottom: '1rem' }}>{error}</p>}
                {status && <p className="status success" style={{ marginBottom: '1rem' }}>{status}</p>}

                <button
                  className="btn-gold full"
                  onClick={handleSubscribe}
                  disabled={loading || checkingSubscription}
                  style={{ width: '100%', padding: '1rem', marginBottom: '1rem' }}
                >
                  {loading ? 'Redirection vers Stripe...' : checkingSubscription ? 'Vérification...' : 'S\'abonner maintenant'}
                </button>

                <p style={{ opacity: 0.7, fontSize: '0.9rem' }}>
                  Paiement sécurisé par Stripe. Annulez à tout moment.
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
                  Retour à la connexion
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
                  Connexion
                </button>
                <button
                  className={mode === 'signup' ? 'toggle active' : 'toggle'}
                  onClick={() => setMode('signup')}
                  type="button"
                >
                  Création
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
              <span>Mot de passe</span>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>

            {mode === 'signup' && (
              <label className="field">
                <span>Confirme le mot de passe</span>
                <input
                  type="password"
                  placeholder="••••••••"
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
              {loading ? 'Traitement...' : mode === 'signin' ? 'Se connecter' : "Créer l'accès"}
            </button>
          </form>

          <p className="hint">
            En utilisant YachtGenius Auth, vous acceptez nos bonnes pratiques : sécurité, sobriété des
            mots de passe et vigilance sur les liens reçus.
          </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
