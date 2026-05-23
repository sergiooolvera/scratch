'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { CreditCard, CheckCircle2, Ticket, ShieldAlert, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { picante } from '@/lib/spicy';

function PayTicketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading, refreshProfile, spicyMode } = useAuth();
  
  const [payLoading, setPayLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const [sandboxMode, setSandboxMode] = useState(false);

  const [ticketCost, setTicketCost] = useState(200);
  const [poolTotal, setPoolTotal] = useState(10000);

  // States for coupon redemption
  const [couponCode, setCouponCode] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const handleRedeemCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError('');
    setErrorMsg('');

    try {
      if (sandboxMode) {
        // Intercept and mock success in Sandbox mode
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (couponCode.trim().toUpperCase() === 'QP-DEMO-PASS') {
          setSuccessMsg(`🎉 ¡Felicidades! Cupón de prueba canjeado con éxito. (Demostración de Sandbox exitosa).`);
          setCouponCode('');
          if (redirectCountdown === null) {
            setRedirectCountdown(4);
          }
        } else {
          throw new Error('Código demo inválido. Usa el atajo QP-DEMO-PASS en Modo Sandbox.');
        }
        return;
      }

      const res = await fetch('/api/coupons/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          code: couponCode.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al canjear el cupón.');
      }

      setSuccessMsg(`🎉 ¡Felicidades! Tu cupón prepago ha sido canjeado con éxito. ¡Tu perfil de participante ahora está ACTIVO!`);
      setCouponCode('');
      
      // Refresh the user profile in AuthContext
      await refreshProfile();

      // Trigger countdown redirect to /quiniela
      if (redirectCountdown === null) {
        setRedirectCountdown(4);
      }
    } catch (err: any) {
      console.error(err);
      setCouponError(err.message || 'Ocurrió un error al procesar el cupón.');
    } finally {
      setCouponLoading(false);
    }
  };

  // Fetch settings dynamically from Database
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('qui_system_settings')
          .select('ticket_cost, pool_accumulated')
          .eq('id', 'points_config')
          .single();
        if (!error && data) {
          setTicketCost(Number(data.ticket_cost) || 200);
          setPoolTotal(Number(data.pool_accumulated) || 10000);
        }
      } catch (err) {
        console.error('Error fetching settings in pay page:', err);
      }
    };
    fetchSettings();
  }, []);

  // Handle redirects and queries
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const cancel = searchParams.get('cancel');
    if (cancel === 'true') {
      setErrorMsg('⚠️ La aportación voluntaria de soporte técnico fue cancelada.');
    }
  }, [searchParams]);

  // Poll profile when success=true is present and profile is not active yet
  useEffect(() => {
    const success = searchParams.get('success');
    if (success !== 'true' || profile?.is_active) {
      setIsVerifyingPayment(false);
      return;
    }

    setIsVerifyingPayment(true);
    
    // Initial fetch to check if it's already active
    refreshProfile();

    let attempts = 0;
    const maxAttempts = 15;

    const interval = setInterval(async () => {
      attempts++;
      await refreshProfile();
      
      if (attempts >= maxAttempts) {
        clearInterval(interval);
        setIsVerifyingPayment(false);
        setErrorMsg('El pago está tardando más de lo esperado en registrarse. Por favor contacta al Administrador o refresca la página.');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [searchParams, user, profile?.is_active]);

  // Redirect countdown when profile becomes active under success=true
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true' && profile?.is_active) {
      setSuccessMsg('🎉 ¡Felicidades! Tu aportación voluntaria de mantenimiento ha sido registrada con éxito. ¡Tu perfil de participante ahora está ACTIVO!');
      
      if (redirectCountdown === null) {
        setRedirectCountdown(4); // 4 seconds countdown before auto redirect
      }
    }
  }, [searchParams, profile?.is_active, redirectCountdown]);

  // Execute countdown timer
  useEffect(() => {
    if (redirectCountdown === null) return;
    
    if (redirectCountdown === 0) {
      router.push('/quiniela');
      return;
    }

    const timer = setTimeout(() => {
      setRedirectCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [redirectCountdown, router]);

  const handleCheckout = async () => {
    if (!user) return;
    setPayLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con la pasarela de Stripe.');
      }

      if (data.url) {
        // Redirect user to Stripe Checkout
        window.location.href = data.url;
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Ocurrió un error al procesar el pago.');
      setPayLoading(false);
    }
  };

  if (loading && !profile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Taquilla Digital...
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px 0' }}>
      
      {/* Toast Feedbacks */}
      {successMsg && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          borderRadius: 'var(--border-radius-md)',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: 'var(--accent-neon-green)'
        }}>
          <CheckCircle2 size={24} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.95rem' }}>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--border-radius-md)',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          color: '#f87171'
        }}>
          <AlertTriangle size={24} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '0.95rem' }}>{errorMsg}</span>
        </div>
      )}

      {isVerifyingPayment && (
        <div className="glass-panel" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(15, 23, 42, 0.9) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--border-radius-md)',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: 'var(--accent-gold)'
        }}>
          <div className="animate-spin" style={{
            width: '24px',
            height: '24px',
            border: '3px solid var(--accent-gold)',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            flexShrink: 0
          }}></div>
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Verificando aportación voluntaria...</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Procesando tu pago de forma segura con Stripe. Por favor no cierres ni recargues esta ventana.
            </p>
          </div>
        </div>
      )}

      {redirectCountdown !== null && redirectCountdown > 0 && (
        <div className="glass-panel" style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.9) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.35)',
          borderRadius: 'var(--border-radius-md)',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          color: 'var(--accent-neon-green)'
        }}>
          <Sparkles size={24} style={{ flexShrink: 0, color: 'var(--accent-neon-green)' }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>¡Boleto Activado con Éxito!</h4>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Redirigiéndote a <strong>Mi Quiniela</strong> para registrar tus pronósticos en <strong>{redirectCountdown}</strong> segundos...
            </p>
          </div>
        </div>
      )}

      {/* Dynamic Explanation Showcase Banner */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%)',
        borderColor: 'rgba(59, 130, 246, 0.35)',
        borderRadius: 'var(--border-radius-md)',
        padding: '20px',
        marginBottom: '28px',
        textAlign: 'left'
      }}>
        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', gap: '8px', textTransform: 'uppercase' }}>
          <span>🚀 {picante("Showcase Tecnológico: Pasarela en Modo Prueba", "Showcase Técnico: ¡Para que mires cómo jala! 💻", spicyMode)}</span>
        </h4>
        <p style={{ margin: '8px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
          {picante(
            "¡La Quiniela Mundialista es ahora 100% gratuita y recreativa! Tu cuenta ya está ACTIVA por defecto y puedes registrar tus pronósticos de inmediato sin pagar nada. Hemos conservado este portal interactivo en Modo de Prueba (Stripe Test Mode) y canje de cupones estrictamente para que conozcas mi trabajo y habilidades técnicas como programador web full-stack.",
            "¡La quiniela ya es gratis y para toda la banda, compadre! Tu cuenta ya está súper ACTIVA y lista para meter goles. Dejamos este módulo de cobros en 'Modo Demo' para lucir la ingeniería de mi portafolio. ¡Diviértete calando cómo interactúa la base de datos simulando transacciones!",
            spicyMode
          )}
        </p>
      </div>

      {/* Sandbox Toggle */}
      <div className="glass-panel" style={{
        background: 'rgba(245, 158, 11, 0.05)',
        border: '1px dashed rgba(245, 158, 11, 0.3)',
        borderRadius: 'var(--border-radius-md)',
        padding: '14px 18px',
        marginBottom: '28px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sparkles size={16} style={{ color: 'var(--accent-gold)' }} />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
            🧪 {picante("Panel de Pruebas de Desarrollo", "Sandbox de Portafolio del Programador", spicyMode)}
          </span>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <input
            type="checkbox"
            checked={sandboxMode}
            onChange={(e) => setSandboxMode(e.target.checked)}
            style={{ width: '16px', height: '16px', accentColor: 'var(--accent-gold)' }}
          />
          <span>{picante("Simular boleto inactivo para probar pasarela", "Desactivar temporalmente para calar pagos", spicyMode)}</span>
        </label>
      </div>

      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
        {picante("Taquilla Digital (Demostración)", "Taquilla Demo 🎟️ (Portafolio)", spicyMode)}
      </h2>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '0.9rem' }}>
        {picante(
          "Simula una cooperación técnica o canjea un cupón de prueba para ver el flujo de activación en tiempo real.",
          "Cálale simulando un donativo voluntario o canjea un cupón ficticio para que mires la magia del código en acción.",
          spicyMode
        )}
      </p>

      {/* Ticket Design */}
      <div className="glass-panel" style={{
        padding: 0,
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '24px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}>
        {/* Ticket Header Banner */}
        <div style={{
          background: (profile?.is_active && !sandboxMode) 
            ? 'linear-gradient(135deg, #10b981 0%, #064e3b 100%)' 
            : 'linear-gradient(135deg, var(--accent-gold) 0%, #78350f 100%)',
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#030712' }}>
            <Ticket size={24} />
            <span className="sports-font" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {(profile?.is_active && !sandboxMode) ? "Boleto Activo (Gratuito)" : "Cooperación de Mantenimiento"}
            </span>
          </div>
          <span className="badge" style={{
            background: (profile?.is_active && !sandboxMode) ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)',
            color: (profile?.is_active && !sandboxMode) ? '#ffffff' : 'var(--accent-gold)'
          }}>
            {(profile?.is_active && !sandboxMode) ? 'ACTIVO' : 'PENDIENTE'}
          </span>
        </div>

        {/* Ticket Contents */}
        <div style={{ padding: '24px', position: 'relative' }}>
          {/* Decorative side cuts for ticket shape */}
          <div style={{
            position: 'absolute',
            left: '-12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--bg-dark)',
            borderRight: '1px solid rgba(255, 255, 255, 0.12)',
            zIndex: 10
          }}></div>
          <div style={{
            position: 'absolute',
            right: '-12px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: 'var(--bg-dark)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.12)',
            zIndex: 10
          }}></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Participante</span>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, margin: '2px 0 0 0' }}>
                {profile?.full_name || 'Usuario'}
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                @{profile?.username || 'user'}
              </span>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Donativo Sugerido</span>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '2px 0 0 0', color: 'var(--text-primary)' }}>
                {ticketCost.toLocaleString()} Frijolitos
              </h4>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', padding: '12px 0', borderTop: '1px dashed var(--border-glass)', borderBottom: '1px dashed var(--border-glass)', marginBottom: '24px' }}>
            <div>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Torneo</span>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>Mundial 2026</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Soporte</span>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-neon-green)' }}>TÉCNICO</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Acceso</span>
              <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>COMPLETO</div>
            </div>
          </div>

          {/* Barcode Mock */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '80%',
              height: '50px',
              background: 'linear-gradient(90deg, #fff 2px, transparent 2px, transparent 4px, #fff 4px, #fff 8px, transparent 8px, transparent 10px, #fff 10px, #fff 11px, transparent 11px, #fff 15px, transparent 15px, #fff 16px, #fff 18px, transparent 18px, #fff 22px, #fff 24px, transparent 24px)',
              backgroundSize: '32px 100%',
              opacity: (profile?.is_active && !sandboxMode) ? 0.7 : 0.25
            }}></div>
            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
              {profile?.id ? profile.id.substring(0, 18).toUpperCase() : 'PENDINGDONATION2026'}
            </span>
          </div>
        </div>

        {/* Ticket Bottom Panel */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.4)',
          padding: '24px',
          borderTop: '1px solid var(--border-glass)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px'
        }}>
          {(profile?.is_active && !sandboxMode) ? (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ inlineSize: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-neon-green)', fontWeight: 700, marginBottom: '16px' }}>
                <CheckCircle2 size={20} />
                <span>{picante("¡APORTACIÓN REGISTRADA (PERFIL ACTIVO)!", "¡BOLETO ACTIVO Y LISTO PARA JUGAR! ⚽", spicyMode)}</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                {picante(
                  "Tu perfil se encuentra activo de forma 100% gratuita. Ya puedes ingresar a la quiniela para capturar tus marcadores.",
                  "¡Ya estás más activo que el mismísimo Cuauhtémoc Blanco en sus mejores tiempos! Pícale al botón de abajo y vete a rellenar tus pronósticos.",
                  spicyMode
                )}
              </p>
              <button
                onClick={() => router.push('/quiniela')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <span>{picante("Ir a mi Quiniela", "Mete tus goles aquí ⚽", spicyMode)}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ) : isVerifyingPayment ? (
            <div style={{ width: '100%', textAlign: 'center', padding: '12px 0' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--accent-gold)', fontWeight: 700, marginBottom: '12px' }}>
                <div className="animate-spin" style={{
                  width: '18px',
                  height: '18px',
                  border: '2px solid var(--accent-gold)',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                }}></div>
                <span>VERIFICANDO REGISTRO...</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                Estamos validando tu pago con la pasarela de Stripe. Tu boleto de participación se activará en cualquier momento.
              </p>
            </div>
          ) : (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <button
                onClick={handleCheckout}
                className="btn btn-gold"
                style={{ width: '100%', padding: '14px' }}
                disabled={payLoading}
              >
                <CreditCard size={18} />
                <span>{payLoading ? 'Cargando Pasarela...' : 'Realizar Aportación Técnica (Stripe)'}</span>
              </button>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', textAlign: 'left', marginTop: '20px', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-glass)' }}>
                <ShieldAlert size={18} style={{ color: 'var(--accent-gold)', flexShrink: 0, marginTop: '2px' }} />
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  <strong>{picante("Tarjeta de Pruebas de Stripe:", "🔬 Tarjeta de Pruebas de Stripe:", spicyMode)}</strong> {picante(
                    "Puedes simular un pago en Stripe ingresando el número de tarjeta 4242 4242 4242 4242, con cualquier fecha futura de expiración y CVC 123.",
                    "Usa la tarjeta demo '4242 4242 4242 4242' con cualquier mes/año futuro y CVC '123' para completar la simulación de cobro exitosamente.",
                    spicyMode
                  )}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Coupon Redemption Section */}
      {(!profile?.is_active || sandboxMode) && (
        <div className="glass-panel" style={{
          marginTop: '24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(15, 23, 42, 0.8) 100%)',
          borderColor: 'rgba(16, 185, 129, 0.25)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <Ticket size={20} style={{ color: 'var(--accent-neon-green)' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, textTransform: 'uppercase' }}>
              {picante("Activar con Cupón Prepago 🎟️", "Cargar Cupón Prepago de Prueba 🎟️", spicyMode)}
            </h3>
          </div>
          
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            {picante(
              "¿Le pagaste en efectivo a un vendedor autorizado? Ingresa el código de tu cupón prepago para activar tu boleto.",
              "¿Le soltaste efectivo de mentiras a un vendedor imaginario? Ingresa tu código demo para activar el boleto.",
              spicyMode
            )}
            {sandboxMode && (
              <span style={{ display: 'block', marginTop: '6px' }}>
                💡 En Modo Sandbox, haz clic aquí para auto-rellenar el código demo: 
                <button
                  type="button"
                  onClick={() => setCouponCode('QP-DEMO-PASS')}
                  style={{
                    background: 'rgba(245, 158, 11, 0.15)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: 'var(--accent-gold)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.78rem',
                    marginLeft: '8px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  QP-DEMO-PASS
                </button>
              </span>
            )}
          </p>

          <form onSubmit={handleRedeemCoupon} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value);
                setCouponError('');
              }}
              placeholder="QP-XXXX-XXXX"
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.3)',
                border: couponError ? '1px solid #ef4444' : '1px solid var(--border-glass)',
                borderRadius: 'var(--border-radius-md)',
                padding: '12px 16px',
                color: 'var(--text-primary)',
                fontSize: '1rem',
                fontFamily: 'monospace',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                outline: 'none',
                transition: 'var(--transition-smooth)'
              }}
              disabled={couponLoading}
            />
            <button
              type="submit"
              className="btn"
              style={{
                background: 'var(--accent-neon-green)',
                borderColor: 'var(--accent-neon-green)',
                color: '#030712',
                fontWeight: 800,
                padding: '0 24px',
                borderRadius: 'var(--border-radius-md)',
                boxShadow: '0 0 15px var(--accent-neon-green-glow)',
                cursor: 'pointer'
              }}
              disabled={couponLoading || !couponCode.trim()}
            >
              {couponLoading ? 'Validando...' : 'Canjear'}
            </button>
          </form>

          {couponError && (
            <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', margin: '12px 0 0 0' }}>
              <AlertTriangle size={14} />
              <span>{couponError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default function PayPage() {
  return (
    <React.Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Taquilla Digital...
        </div>
      </div>
    }>
      <PayTicketContent />
    </React.Suspense>
  );
}
