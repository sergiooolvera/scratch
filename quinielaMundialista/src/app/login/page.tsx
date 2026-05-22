'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Lock, Mail, User, ShieldCheck, AlertTriangle, Gift } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // If user is already authenticated, redirect to home page
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!email || !password) {
      setErrorMsg('Por favor completa todos los campos requeridos.');
      return;
    }

    setActionLoading(true);

    try {
      if (isSignUp) {
        // Sign Up Flow
        if (!username || !fullName) {
          setErrorMsg('Por favor ingresa un nombre y un usuario.');
          setActionLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username.toLowerCase().trim(),
              full_name: fullName.trim(),
              referral_code_used: referralCode.toUpperCase().trim() || null,
            },
          },
        });

        if (error) {
          setErrorMsg(error.message);
        } else if (data.user && data.session === null) {
          // If email verification is active
          setSuccessMsg('¡Registro exitoso! Por favor verifica tu correo electrónico para activar tu cuenta.');
        } else {
          setSuccessMsg('¡Usuario registrado e ingresado con éxito!');
          router.push('/');
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg(error.message);
        } else {
          setSuccessMsg('¡Ingreso exitoso! Redirigiendo...');
          router.push('/');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    if (!email) {
      setErrorMsg('Ingresa tu correo en el campo superior para recuperar tu contraseña.');
      return;
    }
    
    setActionLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/login?reset=true`,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Se ha enviado un correo con instrucciones para restablecer tu contraseña.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al enviar correo.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'facebook') => {
    setErrorMsg('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      if (error) setErrorMsg(error.message);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error de autenticación social.');
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Sistema...
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="glass-panel auth-panel">
        <h2 className="auth-title">QuiMundial 2026</h2>
        <p className="auth-subtitle">
          {isSignUp ? 'Crea tu cuenta de Quiniela Mundialista' : 'Accede a tus pronósticos y marcadores'}
        </p>

        {errorMsg && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f87171',
            fontSize: '0.85rem'
          }}>
            <AlertTriangle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: 'var(--border-radius-sm)',
            padding: '12px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-neon-green)',
            fontSize: '0.85rem'
          }}>
            <ShieldCheck size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <>
              <div className="form-group">
                <label className="form-label">Nombre Completo</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. Sergio Olvera"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{ width: '100%', paddingLeft: '44px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nombre de Usuario</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '14px', top: '12px', color: 'var(--text-muted)', fontWeight: 700 }}>@</span>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="ej. sergiolv"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ width: '100%', paddingLeft: '36px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Código de Referido (Opcional)</label>
                <div style={{ position: 'relative' }}>
                  <Gift size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej. ABCD1234"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    style={{ width: '100%', paddingLeft: '44px', textTransform: 'uppercase' }}
                  />
                </div>
              </div>
            </>
          )}

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="email"
                className="form-input"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
              <input
                type="password"
                className="form-input"
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px' }}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '10px' }}
            disabled={actionLoading}
          >
            {actionLoading ? 'Procesando...' : isSignUp ? 'Registrarme' : 'Iniciar Sesión'}
          </button>
        </form>

        {!isSignUp && (
          <div style={{ textAlign: 'right', marginTop: '10px' }}>
            <button
              onClick={handlePasswordRecovery}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
              disabled={actionLoading}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        )}

        <div style={{ margin: '20px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>O entrar con</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-glass)' }}></div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => handleOAuth('google')}
            className="btn btn-secondary"
            style={{ flex: 1, padding: '12px', fontSize: '0.85rem' }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Google</span>
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          {isSignUp ? '¿Ya tienes cuenta?' : '¿No tienes cuenta registrada?'}
          {' '}
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setSuccessMsg('');
              setReferralCode('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-neon-green)',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isSignUp ? 'Ingresar aquí' : 'Regístrate aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
