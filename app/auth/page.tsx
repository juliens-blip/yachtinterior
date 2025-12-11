'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');

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
        setStatus('Connexion réussie. Redirection en cours...');
        router.push('/');
      }
    } else {
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
      } else {
        setStatus('Compte créé. Vérifie tes emails pour confirmer ton adresse.');
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
        </section>
      </main>
    </div>
  );
}
