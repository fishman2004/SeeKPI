import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import './globals.css';

/* Load Inter with all weights used in the design system */
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

/* App metadata — Portuguese strings for user-facing content */
export const metadata: Metadata = {
  title: 'SeeKPI',
  description:
    'Plataforma inteligente de KPIs de vendas. Acompanhe metas, positivações, mix de categorias e desempenho da equipe em tempo real.',
  applicationName: 'SeeKPI',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SeeKPI',
  },
  formatDetection: {
    telephone: false,
  },
};

/* Viewport & theme color extracted to the dedicated export (Next.js 15) */
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0a0f',
};

/**
 * Root layout — wraps every page in the application.
 * AuthProvider sits here so every page (login, dashboard, etc.) has access
 * to the auth context without needing per-page wrappers.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
