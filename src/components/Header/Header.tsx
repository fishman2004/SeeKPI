'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import './Header.css';

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Return a Portuguese greeting based on current hour */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia';
  if (hour >= 12 && hour < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Format the current date in Brazilian Portuguese */
function formatDatePt(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Header() {
  const { user } = useAuth();

  /* Recalculate greeting on mount (avoids SSR hydration mismatch) */
  const [greeting, setGreeting] = useState('');
  const [dateStr, setDateStr] = useState('');

  useEffect(() => {
    setGreeting(getGreeting());
    setDateStr(formatDatePt());

    /* Update greeting every minute in case user keeps the tab open */
    const interval = setInterval(() => {
      setGreeting(getGreeting());
      setDateStr(formatDatePt());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      {/* ── Left: greeting & date ──────────────────────────────── */}
      <div className="header__greeting">
        <h1 className="header__title">
          {greeting}
          {user ? `, ${user.name.split(' ')[0]}` : ''}
          <span className="header__wave">👋</span>
        </h1>
        <p className="header__date">{dateStr}</p>
      </div>

      {/* ── Right: actions ─────────────────────────────────────── */}
      <div className="header__actions">
        {/* Filtros globais de Mês/Dia serão adicionados no page.tsx ou outro componente adequado */}

        {/* Notification bell */}
        <button
          className="header__icon-btn"
          aria-label="Notificações"
          title="Notificações"
        >
          🔔
          <span className="header__notification-dot" />
        </button>

        {/* User avatar */}
        <div className="header__avatar" title={user?.name}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt={user.name} />
          ) : (
            <span>{user?.initials ?? '??'}</span>
          )}
        </div>
      </div>
    </header>
  );
}
