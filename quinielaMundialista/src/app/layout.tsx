import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/AuthContext';
import { Header } from './components/Header';
import { MobileNav } from './components/MobileNav';
import { GlobalFloatingActions } from './components/GlobalFloatingActions';

export const metadata: Metadata = {
  title: 'Quiniela Mundialista 2026 - Dashboard Deportivo',
  description: 'Participa en la Quiniela del Mundial 2026, captura tus pronósticos de partidos y compite por la bolsa acumulada en tiempo real.',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <Header />
          <main className="main-wrapper">
            {children}
          </main>
          <MobileNav />
          <GlobalFloatingActions />
        </AuthProvider>
      </body>
    </html>
  );
}
