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

  if (!profile?.is_admin) return null;

  return (
    <nav className="mobile-nav">
      <Link href="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
        <LayoutDashboard size={20} />
        <span>Inicio</span>
      </Link>

      <Link href="/admin" className={`mobile-nav-item ${isActive('/admin') ? 'active' : ''}`} style={{ color: 'var(--accent-gold)' }}>
        <ShieldAlert size={20} />
        <span>Admin</span>
      </Link>
    </nav>
  );
};
