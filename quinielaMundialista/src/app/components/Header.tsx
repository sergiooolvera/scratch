'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trophy, LogIn, LogOut, LayoutDashboard, TableProperties, ShieldAlert, CreditCard, Bell, Check, X, Trash2, BadgeDollarSign, Volume2, VolumeX, Sun, Moon } from 'lucide-react';

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user, profile, loading, logout, spicyMode, setSpicyMode, soundMuted, setSoundMuted, theme, setTheme } = useAuth();
  
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
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

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('qui_notifications')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);
      
      if (!error) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        console.error('Failed to delete notification:', error.message);
      }
    } catch (e) {
      console.error('Error deleting notification:', e);
    }
  };

  const clearAllNotifications = async () => {
    if (!user || notifications.length === 0) return;
    try {
      const { error } = await supabase
        .from('qui_notifications')
        .delete()
        .eq('user_id', user.id);
      
      if (!error) {
        setNotifications([]);
      } else {
        console.error('Failed to clear notifications:', error.message);
      }
    } catch (e) {
      console.error('Error clearing notifications:', e);
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

            <div style={{ position: 'relative' }}>
              <div 
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '10px', 
                  cursor: 'pointer', 
                  padding: '4px 10px', 
                  borderRadius: '12px', 
                  background: showUserMenu ? 'rgba(255, 255, 255, 0.05)' : 'transparent', 
                  border: showUserMenu ? '1px solid var(--border-glass)' : '1px solid transparent',
                  transition: 'all 0.2s ease' 
                }}
                className="user-profile-trigger"
              >
                <div className="mobile-hide" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', lineHeight: 1.2 }}>
                  <span className="sports-font" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {profile?.full_name || user.email?.split('@')[0]}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-neon-green)', fontWeight: 700 }}>
                    {profile?.points || 0} pts
                  </span>
                </div>
                
                <div className="player-avatar" style={{ margin: 0 }}>
                  {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
              </div>

              {showUserMenu && (
                <>
                  {/* Click outside overlay */}
                  <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 998 }} 
                    onClick={() => setShowUserMenu(false)}
                  />
                  {/* Dropdown Menu */}
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 8px)',
                    right: 0,
                    width: '280px',
                    background: 'var(--bg-toast)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '16px',
                    padding: '16px',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 0 20px rgba(16, 185, 129, 0.1)',
                    zIndex: 999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    animation: 'slideDownFade 0.2s ease-out'
                  }}>
                    <style>{`
                      @keyframes slideDownFade {
                        from { opacity: 0; transform: translateY(-10px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                    `}</style>

                    {/* User Profile Header (useful for mobile where it's hidden) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
                      <div className="player-avatar" style={{ width: '40px', height: '40px', fontSize: '1.2rem', margin: 0 }}>
                        {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                        <span className="sports-font" style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {profile?.full_name || user.email?.split('@')[0]}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-neon-green)', fontWeight: 700 }}>
                          {profile?.points || 0} pts
                        </span>
                      </div>
                    </div>

                    {/* Settings Section */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Configuración
                      </span>

                      {/* Spicy Mode */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '1rem' }}>🌶️</span>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Modo Picante</span>
                        </div>
                        <button
                          onClick={() => setSpicyMode(!spicyMode)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: spicyMode ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid var(--border-glass)',
                            background: spicyMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            color: spicyMode ? 'var(--accent-red)' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {spicyMode ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {/* Sound Effects */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!soundMuted ? (
                            <Volume2 size={16} style={{ color: 'var(--accent-neon-green)' }} />
                          ) : (
                            <VolumeX size={16} style={{ color: 'var(--text-muted)' }} />
                          )}
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Efectos de Sonido</span>
                        </div>
                        <button
                          onClick={() => setSoundMuted(!soundMuted)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: !soundMuted ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-glass)',
                            background: !soundMuted ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            color: !soundMuted ? 'var(--accent-neon-green)' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {!soundMuted ? 'ON' : 'OFF'}
                        </button>
                      </div>

                      {/* Dark/Light Mode Theme */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {theme === 'dark' ? (
                            <Moon size={16} style={{ color: 'var(--accent-blue)' }} />
                          ) : (
                            <Sun size={16} style={{ color: 'var(--accent-gold)' }} />
                          )}
                          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>Modo Oscuro</span>
                        </div>
                        <button
                          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '20px',
                            border: theme === 'dark' ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-glass)',
                            background: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                            color: theme === 'dark' ? '#60a5fa' : 'var(--text-muted)',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {theme === 'dark' ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    </div>

                    {/* Logout Button */}
                    <button 
                      onClick={() => {
                        setShowUserMenu(false);
                        logout();
                      }} 
                      className="btn btn-secondary" 
                      style={{ 
                        width: '100%', 
                        padding: '10px', 
                        fontSize: '0.8rem', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        gap: '8px', 
                        marginTop: '6px',
                        border: '1px solid rgba(239, 68, 68, 0.2)',
                        color: '#f87171',
                        background: 'rgba(239, 68, 68, 0.05)'
                      }} 
                      title="Cerrar sesión"
                    >
                      <LogOut size={14} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>

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
          background: 'var(--notif-drawer-overlay)',
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
            background: 'var(--notif-drawer-bg)',
            borderLeft: '1px solid var(--notif-drawer-border)',
            boxShadow: '-10px 0 30px var(--notif-drawer-shadow)',
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
            {notifications.length > 0 && (
              <div style={{
                padding: '12px 20px',
                background: 'var(--notif-drawer-actions-bg)',
                borderBottom: '1px solid var(--border-glass)',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px'
              }}>
                {unreadCount > 0 && (
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
                    <span>Marcar todo leído</span>
                  </button>
                )}
                <button 
                  onClick={clearAllNotifications}
                  className="btn btn-secondary"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    gap: '4px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: 'rgb(248, 113, 113)'
                  }}
                >
                  <Trash2 size={12} />
                  <span>Limpiar todo</span>
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
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="delete-notif-btn"
                      title="Eliminar notificación"
                    >
                      <X size={14} />
                    </button>
                    <p style={{
                      fontSize: '0.85rem',
                      lineHeight: 1.45,
                      margin: '0 0 8px 0',
                      paddingRight: '24px',
                      color: n.read ? 'var(--notif-text-secondary)' : 'var(--text-primary)'
                    }}>
                      {n.message}
                    </p>
                    <span style={{
                      fontSize: '0.7rem',
                      color: 'var(--notif-text-muted)',
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
