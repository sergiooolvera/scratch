'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trophy, LogIn, LogOut, LayoutDashboard, TableProperties, ShieldAlert, CreditCard, Bell, Check, X } from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, loading, logout } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (path: string) => pathname === path;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('qui_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) {
        setNotifications(data);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Subscribe to real-time notification changes
      const channel = supabase
        .channel('qui_notifications_channel')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'qui_notifications',
          filter: `user_id=eq.${user.id}`
        }, () => {
          fetchNotifications();
        })
        .subscribe();
      
      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const { error } = await supabase
        .from('qui_notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);
      if (!error) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (e) {
      console.error('Error marking notifications as read:', e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('qui_notifications')
        .update({ read: true })
        .eq('id', id);
      if (!error) {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      }
    } catch (e) {
      console.error('Error marking notification as read:', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="header-container">
      <Link href="/" className="logo-section">
        <Trophy size={24} />
        <span>QuiMundial</span>
      </Link>

      <nav className="nav-links">
        <Link href="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          <span>Inicio</span>
        </Link>
        
        {user && (
          <>
            <Link href="/quiniela" className={`nav-link ${isActive('/quiniela') ? 'active' : ''}`}>
              <TableProperties size={18} />
              <span>Mi Quiniela</span>
            </Link>
            
            {!profile?.is_active && (
              <Link href="/pay" className={`nav-link ${isActive('/pay') ? 'active' : ''}`} style={{ color: 'var(--accent-gold)' }}>
                <CreditCard size={18} />
                <span>Soporte Técnico</span>
              </Link>
            )}
          </>
        )}

        <Link href="/ranking" className={`nav-link ${isActive('/ranking') ? 'active' : ''}`}>
          <Trophy size={18} />
          <span>Ranking</span>
        </Link>

        {profile?.is_admin && (
          <Link href="/admin" className={`nav-link ${isActive('/admin') ? 'active' : ''}`} style={{ border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.05)' }}>
            <ShieldAlert size={18} style={{ color: 'var(--accent-gold)' }} />
            <span style={{ color: 'var(--accent-gold)' }}>Panel Admin</span>
          </Link>
        )}
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {loading ? (
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Cargando...</div>
        ) : user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            
            {/* Bell Icon with glowing count badge */}
            <div style={{ position: 'relative' }}>
              <button 
                onClick={() => setShowNotifDrawer(true)} 
                className="btn btn-secondary" 
                style={{ padding: '8px', position: 'relative', borderRadius: '50%', border: '1px solid var(--border-glass)' }}
                title="Notificaciones"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: 'var(--accent-neon-green)',
                    color: '#030712',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 10px var(--accent-neon-green)',
                    border: '2px solid var(--bg-dark)'
                  }}>
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>

            <div className="mobile-hide" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
              <span className="sports-font" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                {profile?.full_name || user.email?.split('@')[0]}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-neon-green)', fontWeight: 700 }}>
                {profile?.points || 0} pts
              </span>
            </div>
            
            <div className="player-avatar">
              {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
            </div>

            <button onClick={logout} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem' }} title="Cerrar sesión">
              <LogOut size={14} />
              <span style={{ display: 'none' }} className="tablet-show">Salir</span>
            </button>
          </div>
        ) : (
          <Link href="/login" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
            <LogIn size={16} />
            <span>Ingresar</span>
          </Link>
        )}
      </div>

      {/* Notification Drawer (Slide-out Glassmorphic Sidebar) */}
      {showNotifDrawer && mounted && createPortal(
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.4)',
          backdropFilter: 'blur(4px)',
          zIndex: 99999,
          display: 'flex',
          justifyContent: 'flex-end',
          animation: 'fade-in 0.2s ease-out'
        }} onClick={() => setShowNotifDrawer(false)}>
          <div style={{
            width: '100%',
            maxWidth: '420px',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
            display: 'flex',
            flexDirection: 'column',
            animation: 'slide-in-right 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }} onClick={(e) => e.stopPropagation()}>
            
            {/* Drawer Header */}
            <div style={{
              padding: '24px 20px',
              borderBottom: '1px solid var(--border-glass)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={20} style={{ color: 'var(--accent-neon-green)' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
                  Notificaciones
                </h3>
              </div>
              <button 
                onClick={() => setShowNotifDrawer(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer Actions */}
            {unreadCount > 0 && (
              <div style={{
                padding: '12px 20px',
                background: 'rgba(255,255,255,0.02)',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'flex-end'
              }}>
                <button 
                  onClick={markAllAsRead}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    gap: '4px',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    color: 'var(--accent-neon-green)'
                  }}
                >
                  <Check size={12} />
                  <span>Marcar todo como leído</span>
                </button>
              </div>
            )}

            {/* Drawer Body (List of Notifications) */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {notifications.length === 0 ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '60%',
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  gap: '12px'
                }}>
                  <Bell size={48} style={{ opacity: 0.15 }} />
                  <span style={{ fontSize: '0.9rem' }}>No tienes notificaciones aún.</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <div 
                    key={n.id} 
                    className="glass-card" 
                    onClick={() => !n.read && markAsRead(n.id)}
                    style={{
                      padding: '14px',
                      borderRadius: '12px',
                      borderLeft: !n.read ? '3px solid var(--accent-neon-green)' : '1px solid var(--border-glass)',
                      background: !n.read ? 'rgba(16, 185, 129, 0.03)' : undefined,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      cursor: !n.read ? 'pointer' : 'default',
                      opacity: n.read ? 0.75 : 1
                    }}
                    title={!n.read ? 'Haga clic para marcar como leída' : undefined}
                  >
                    <p style={{
                      fontSize: '0.85rem',
                      lineHeight: 1.45,
                      margin: '0 0 8px 0',
                      color: n.read ? 'var(--text-secondary)' : 'var(--text-primary)'
                    }}>
                      {n.message}
                    </p>
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      fontWeight: 600
                    }}>
                      {new Date(n.created_at).toLocaleString('es-MX', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                    {!n.read && (
                      <span style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        fontSize: '0.65rem',
                        color: 'var(--accent-neon-green)',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}>
                        <Check size={10} /> Nueva
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </header>
  );
};
