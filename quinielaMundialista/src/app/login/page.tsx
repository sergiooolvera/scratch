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
  
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isAdult, setIsAdult] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [poolTotal, setPoolTotal] = useState(0);
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');

  // Fetch accumulated pool size for terms display
  useEffect(() => {
    const fetchPoolTotal = async () => {
      try {
        const { data, error } = await supabase
          .from('qui_system_settings')
          .select('pool_accumulated')
          .eq('id', 'points_config')
          .single();
        if (!error && data) {
          setPoolTotal(Number(data.pool_accumulated) || 0);
        }
      } catch (err) {}
    };
    fetchPoolTotal();
  }, []);

  // If user is already authenticated, redirect to home page
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Capture referral code from URL query parameters (e.g. ?ref=31E0F271)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref') || params.get('code');
      if (ref) {
        setReferralCode(ref.toUpperCase());
        setIsSignUp(true);
      }
    }
  }, []);

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
        if (!agreeTerms || !isAdult) {
          setErrorMsg('Debes aceptar los términos y condiciones y confirmar que eres mayor de 18 años para registrarte.');
          setActionLoading(false);
          return;
        }

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
        } else if (data.user && (data.session === null || !data.user.email_confirmed_at)) {
          // If email verification is active or email is unconfirmed
          setSuccessMsg('¡Registro exitoso! Le hemos enviado un correo de confirmación. Favor de confirmar su registro en su bandeja de entrada antes de ingresar.');
          setRegisteredEmail(email);
          setShowVerificationModal(true);
          if (data.session) {
            await supabase.auth.signOut();
          }
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

          {isSignUp && (
            <div className="form-group" style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--accent-neon-green)' }}
                  required
                />
                <span>
                  Estoy de acuerdo con los{' '}
                  <strong
                    onClick={(e) => {
                      e.preventDefault();
                      setShowTerms(true);
                    }}
                    style={{
                      color: 'var(--accent-neon-green)',
                      textDecoration: 'underline',
                      cursor: 'pointer'
                    }}
                  >
                    Términos y Condiciones
                  </strong>{' '}
                  de juego
                </span>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={isAdult}
                  onChange={(e) => setIsAdult(e.target.checked)}
                  style={{ width: '16px', height: '16px', marginTop: '2px', accentColor: 'var(--accent-neon-green)' }}
                  required
                />
                <span>Confirmo que soy <strong style={{ color: 'var(--accent-neon-green)' }}>mayor de 18 años</strong></span>
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', marginTop: '10px' }}
            disabled={actionLoading || (isSignUp && (!agreeTerms || !isAdult))}
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
            style={{ width: '100%', padding: '12px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
            </svg>
            <span>Iniciar sesión con Google</span>
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
              setAgreeTerms(false);
              setIsAdult(false);
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

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.9)',
          backdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
          padding: '20px'
        }} onClick={() => setShowTerms(false)}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.98) 0%, rgba(15, 23, 42, 0.99) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '20px',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '30px 24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '18px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px', textTransform: 'uppercase' }}>
              Aviso Legal y Exención de Responsabilidad
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <p>
                <strong>1. Carácter de Mero Entretenimiento:</strong> QuiMundial es una plataforma recreativa y privada orientada exclusivamente al esparcimiento deportivo con motivo del Mundial 2026. Bajo ninguna circunstancia opera, promueve, ni facilita actividades de apuestas comerciales o juegos de azar regulados por la Ley Federal de Juegos y Sorteos de México.
              </p>
              <p>
                <strong>2. Naturaleza de las Aportaciones:</strong> Los montos ingresados por los usuarios tienen el carácter estricto de <strong>Cooperaciones Voluntarias de Mantenimiento</strong>. Dichos fondos se utilizan exclusivamente para sufragar el hospedaje en servidores en la nube, ancho de banda, APIs de banderas e infraestructura técnica necesaria para habilitar la plataforma. No existe reembolso de aportaciones bajo ningún supuesto.
              </p>
              <p>
                <strong>3. Bolsa Simbólica (Frijolitos):</strong> Para enfatizar el carácter lúdico del torneo, la bolsa acumulada se representa y distribuye en una métrica virtual de {poolTotal.toLocaleString()} Frijolitos (puntos recreativos de entretenimiento) a repartir de forma amistosa entre los participantes con mayor puntaje al finalizar el torneo. Estos puntos no tienen equivalencia ni valor de cambio financiero inmediato garantizado por la plataforma.
              </p>
              <p>
                <strong>4. Red de Promotores Solidarios:</strong> Los usuarios que soliciten expresamente y obtengan aprobación administrativa como "Promotores" pueden invitar a nuevos participantes compartiendo su código exclusivo de referido. En caso de que dichos invitados realicen cooperaciones voluntarias de mantenimiento para sufragar costos del servidor: (a) El <strong>50%</strong> de dicho apoyo se destina a cubrir gastos de servidores y APIs de QuiMundial. (b) El <strong>50%</strong> restante se compartirá con el Promotor en agradecimiento por su coordinación y expansión de la comunidad.
              </p>
              <p>
                <strong>5. Aceptación de Condiciones:</strong> El uso de la plataforma, el registro de perfiles, el envío de solicitudes de promotor y la captura de marcadores implica la manifestación libre, voluntaria y expresa de la aceptación absoluta de todos los presentes términos y condiciones generales por parte de los usuarios.
              </p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px', padding: '12px' }} onClick={() => setShowTerms(false)}>
              Entendido y Acepto
            </button>
          </div>
        </div>
      )}

      {/* Verification Success Modal */}
      {showVerificationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.85)',
          backdropFilter: 'blur(16px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 10000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            maxWidth: '480px',
            width: '100%',
            padding: '40px 30px',
            textAlign: 'center',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(3, 7, 18, 0.95) 100%)',
            boxShadow: '0 20px 40px rgba(16, 185, 129, 0.1)',
            borderRadius: '24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '2px solid var(--accent-neon-green)',
              borderRadius: '50%',
              padding: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--accent-neon-green)',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.2)'
            }}>
              <Mail size={40} />
            </div>

            <h3 style={{
              fontSize: '1.5rem',
              fontWeight: 900,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '0.5px'
            }}>
              ¡Verifica tu correo!
            </h3>

            <p style={{
              fontSize: '0.95rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0
            }}>
              Hemos enviado un enlace de confirmación a:
              <br />
              <strong style={{ color: 'var(--accent-neon-green)', wordBreak: 'break-all', display: 'inline-block', marginTop: '6px', fontSize: '1.2rem' }}>
                {registeredEmail}
              </strong>
            </p>

            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '16px',
              width: '100%',
              textAlign: 'left',
              fontSize: '0.85rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--accent-neon-green)', fontWeight: 'bold' }}>1.</span>
                <span>Busca un correo de <strong>sergio.olver@gmail.com</strong> (QuiMundial).</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--accent-neon-green)', fontWeight: 'bold' }}>2.</span>
                <span>Haz clic en el botón o enlace de confirmación dentro del correo.</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span style={{ color: 'var(--accent-neon-green)', fontWeight: 'bold' }}>3.</span>
                <span>Si no lo ves, revisa tu carpeta de <strong>Correo no deseado / Spam</strong>.</span>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '10px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onClick={() => {
                setShowVerificationModal(false);
                setIsSignUp(false); // Switch to sign in view
                // Reset signup fields for clean experience
                setFullName('');
                setUsername('');
                setEmail('');
                setPassword('');
                setReferralCode('');
                setAgreeTerms(false);
                setIsAdult(false);
              }}
            >
              Entendido, ir al login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
