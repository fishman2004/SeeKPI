'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import './Sidebar.css';

/* ------------------------------------------------------------------ */
/*  Navigation item definitions                                        */
/* ------------------------------------------------------------------ */

interface NavItem {
  icon: string;
  label: string;
  href: string;
  /** If true, only visible to admin users */
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: '🏠', label: 'Home',          href: '/' },
  { icon: '👤', label: 'Vendedores',    href: '/vendedores' },
  { icon: '💰', label: 'Vendas',        href: '/vendas' },
  { icon: '🛒', label: 'Reppos',        href: '/reppos' },
  { icon: '📦', label: 'Categorias',    href: '/categorias' },
  { icon: '📋', label: 'MSL',           href: '/msl' },
  { icon: '🏆', label: 'PDV Premiado',  href: '/pdv-premiado' },
  { icon: '🎮', label: 'Simulador',     href: '/simulador' },
];

const ADMIN_ITEMS: NavItem[] = [
  { icon: '⬆️', label: 'Upload',        href: '/upload',  adminOnly: true },
  { icon: '⚙️', label: 'Configurações', href: '/configuracoes',  adminOnly: true },
];

/* ------------------------------------------------------------------ */
/*  Role badge label mapping                                           */
/* ------------------------------------------------------------------ */

const ROLE_LABELS: Record<string, string> = {
  admin:    'Administrador',
  gestao:   'Gestão',
  vendedor: 'Vendedor',
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  /* Collapsed state (desktop) */
  const [collapsed, setCollapsed] = useState(false);

  /* Mobile open state */
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Close mobile sidebar on route change */
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /* Prevent body scroll when mobile sidebar is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const isAdmin = user?.role === 'admin';

  /** Check if a nav item is the currently active route */
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* ── Mobile hamburger button ────────────────────────────── */}
      <button
        className="sidebar-hamburger"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menu"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      {/* ── Mobile overlay backdrop ────────────────────────────── */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ───────────────────────────────────────────── */}
      <aside
        className={[
          'sidebar',
          collapsed ? 'sidebar--collapsed' : '',
          mobileOpen ? 'sidebar--mobile-open' : '',
        ].join(' ')}
      >
        {/* Brand */}
        <div className="sidebar__brand">
          <span className="sidebar__logo">📊</span>
          {!collapsed && <span className="sidebar__brand-text">SeeKPI</span>}

          {/* Collapse toggle (desktop only) */}
          <button
            className="sidebar__collapse-btn"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {collapsed ? '▶' : '◀'}
          </button>

          {/* Close button (mobile only) */}
          <button
            className="sidebar__close-btn"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="sidebar__nav">
          <ul className="sidebar__list">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`sidebar__link ${isActive(item.href) ? 'sidebar__link--active' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="sidebar__link-icon">{item.icon}</span>
                  {!collapsed && (
                    <span className="sidebar__link-label">{item.label}</span>
                  )}
                  {/* Collapsed tooltip */}
                  {collapsed && (
                    <span className="sidebar__tooltip">{item.label}</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>

          {/* Admin section */}
          {isAdmin && (
            <>
              <div className="sidebar__divider" />
              <ul className="sidebar__list">
                {ADMIN_ITEMS.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`sidebar__link ${isActive(item.href) ? 'sidebar__link--active' : ''}`}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className="sidebar__link-icon">{item.icon}</span>
                      {!collapsed && (
                        <span className="sidebar__link-label">{item.label}</span>
                      )}
                      {collapsed && (
                        <span className="sidebar__tooltip">{item.label}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </nav>

        {/* User section */}
        <div className="sidebar__user">
          <div className="sidebar__user-info">
            <div className="sidebar__avatar">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} />
              ) : (
                <span>{user?.initials ?? '??'}</span>
              )}
            </div>
            {!collapsed && (
              <div className="sidebar__user-details">
                <span className="sidebar__user-name">{user?.name ?? 'Usuário'}</span>
                <span className="sidebar__user-role">
                  {ROLE_LABELS[user?.role ?? 'vendedor']}
                </span>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            className="sidebar__logout"
            onClick={logout}
            title="Sair"
          >
            <span className="sidebar__logout-icon">🚪</span>
            {!collapsed && <span className="sidebar__logout-label">Sair</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
