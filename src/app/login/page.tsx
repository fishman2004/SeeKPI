'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, DEMO_USERS } from '@/contexts/AuthContext';
import './login.css';

/* ------------------------------------------------------------------ */
/*  Role labels (PT-BR) for display in the demo hints                  */
/* ------------------------------------------------------------------ */

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  gestao: 'Gestão',
  vendedor: 'Vendedor',
};

/* ------------------------------------------------------------------ */
/*  Login Page Component                                               */
/* ------------------------------------------------------------------ */

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Toggle for demo credentials section
  const [showDemo, setShowDemo] = useState(false);

  /** Handle form submission */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    setLoading(true);

    try {
      const success = await login(email, password);

      if (success) {
        router.push('/');
      } else {
        setError('E-mail ou senha inválidos. Tente novamente.');
      }
    } catch {
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  /** Autofill credentials from a demo user click */
  const handleDemoClick = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
  };

  /** Build a detail string for a demo user (pasta/route info) */
  const getDemoDetail = (user: (typeof DEMO_USERS)[number]) => {
    const parts: string[] = [user.email];
    if (user.pasta) parts.push(`Pasta ${user.pasta}`);
    if (user.route) parts.push(`Rota ${user.route}`);
    return parts.join(' · ');
  };

  return (
    <div className="login-page">
      {/* ── Background particles ──────────────────────────────────── */}
      <div className="login-particles">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="particle" />
        ))}
      </div>

      {/* ── Ambient glow orbs ─────────────────────────────────────── */}
      <div className="login-glow-orb login-glow-orb--green" />
      <div className="login-glow-orb login-glow-orb--blue" />

      {/* ── Centered content ──────────────────────────────────────── */}
      <div className="login-container">
        {/* Brand / Logo */}
        <div className="login-brand">
          <span className="login-logo-icon">📊</span>
          <h1 className="login-logo">SeeKPI</h1>
          <p className="login-tagline">Transformando dados em decisões</p>
        </div>

        {/* Glass card */}
        <div className="login-card">
          <h2 className="login-card__title">Bem-vindo de volta</h2>
          <p className="login-card__subtitle">
            Entre com suas credenciais para acessar o painel
          </p>

          {/* Login form */}
          <form className="login-form" onSubmit={handleSubmit}>
            {/* Error message with shake animation */}
            {error && (
              <div className="login-error" key={error}>
                <span className="login-error__icon">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email field with floating label */}
            <div className="login-field">
              <input
                id="login-email"
                type="email"
                className="login-field__input"
                placeholder="E-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={loading}
              />
              <label htmlFor="login-email" className="login-field__label">
                E-mail
              </label>
            </div>

            {/* Password field with floating label */}
            <div className="login-field">
              <input
                id="login-password"
                type="password"
                className="login-field__input"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                disabled={loading}
              />
              <label htmlFor="login-password" className="login-field__label">
                Senha
              </label>
            </div>

            {/* Submit button with loading state */}
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="login-submit__spinner" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </form>
        </div>

        {/* ── Demo credentials section ────────────────────────────── */}
        <div className="login-demo">
          <button
            type="button"
            className="login-demo__toggle"
            onClick={() => setShowDemo((prev) => !prev)}
          >
            🔑 Usuários de demonstração
            <span
              className={`login-demo__chevron ${showDemo ? 'login-demo__chevron--open' : ''}`}
            >
              ▼
            </span>
          </button>

          {showDemo && (
            <div className="login-demo__list">
              {DEMO_USERS.map((demoUser) => (
                <button
                  key={demoUser.id}
                  type="button"
                  className="login-demo__item"
                  onClick={() => handleDemoClick(demoUser.email, demoUser.password)}
                >
                  {/* Avatar icon colored by role */}
                  <span
                    className={`login-demo__item-icon login-demo__item-icon--${demoUser.role}`}
                  >
                    {demoUser.initials}
                  </span>

                  {/* Name and detail info */}
                  <span className="login-demo__item-info">
                    <span className="login-demo__item-name">{demoUser.name}</span>
                    <span className="login-demo__item-detail">
                      {getDemoDetail(demoUser)}
                    </span>
                  </span>

                  {/* Role badge */}
                  <span
                    className={`login-demo__item-role login-demo__item-role--${demoUser.role}`}
                  >
                    {ROLE_LABELS[demoUser.role]}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
