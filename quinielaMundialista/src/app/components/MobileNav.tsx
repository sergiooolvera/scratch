'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { Trophy, LayoutDashboard, TableProperties, ShieldAlert, CreditCard, LogIn, BadgeDollarSign } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const pathname = usePathname();
  const { user, profile } = useAuth();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="mobile-nav">
      <Link href="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
        <LayoutDashboard size={20} />
        <span>Inicio</span>
      </Link>

      {user ? (
        <Link href="/quiniela" className={`mobile-nav-item ${isActive('/quiniela') ? 'active' : ''}`}>
          <TableProperties size={20} />
          <span>Quiniela</span>
        </Link>
      ) : (
        <Link href="/login" className={`mobile-nav-item ${isActive('/login') ? 'active' : ''}`}>
          <LogIn size={20} />
          <span>Ingresar</span>
        </Link>
      )}

      <Link href="/ranking" className={`mobile-nav-item ${isActive('/ranking') ? 'active' : ''}`}>
        <Trophy size={20} />
        <span>Ranking</span>
      </Link>

      {profile?.is_admin && (
        <Link href="/admin" className={`mobile-nav-item ${isActive('/admin') ? 'active' : ''}`} style={{ color: 'var(--accent-gold)' }}>
          <ShieldAlert size={20} />
          <span>Admin</span>
        </Link>
      )}
    </nav>
  );
};
