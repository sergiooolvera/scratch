'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { CreditCard, CheckCircle2, Ticket, ShieldAlert, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';

function PayTicketContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading, refreshProfile } = useAuth();
  
  const [payLoading, setPayLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Handle redirects and queries
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const success = searchParams.get('success');
    const cancel = searchParams.get('cancel');

    if (success === 'true') {
      setSuccessMsg('🎉 ¡Felicidades! Tu aportación voluntaria de mantenimiento ha sido registrada con éxito. ¡Tu perfil de participante ahora está ACTIVO!');
      // Force refresh auth profile to immediately reflect the state from database
      refreshProfile();
    } else if (cancel === 'true') {
      setErrorMsg('⚠️ La aportación voluntaria de soporte técnico fue cancelada.');
    }
  }, [searchParams]);

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
          <CheckCircle2 size={24} />
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
          <AlertTriangle size={24} />
          <span style={{ fontSize: '0.95rem' }}>{errorMsg}</span>
        </div>
      )}

      <h2 style={{ fontSize: '1.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px', textAlign: 'center' }}>
        Soporte Técnico del Servidor
      </h2>
      <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '32px', fontSize: '0.9rem' }}>
        Realiza una cooperación voluntaria para cubrir costos de hospedaje y base de datos, habilitando tu participación por la bolsa recreativa de 10,000 Frijolitos.
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
          background: profile?.is_active 
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
              Cooperación de Mantenimiento
            </span>
          </div>
          <span className="badge" style={{
            background: profile?.is_active ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.3)',
            color: profile?.is_active ? '#ffffff' : 'var(--accent-gold)'
          }}>
            {profile?.is_active ? 'ACTIVO' : 'PENDIENTE'}
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
                200 Frijolitos
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
              opacity: profile?.is_active ? 0.7 : 0.25
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
          {profile?.is_active ? (
            <div style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ inlineSize: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--accent-neon-green)', fontWeight: 700, marginBottom: '16px' }}>
                <CheckCircle2 size={20} />
                <span>¡APORTACIÓN REGISTRADA (PERFIL ACTIVO)!</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Ya eres un colaborador activo. Puedes dirigirte a la quiniela para capturar y modificar tus pronósticos en cualquier momento.
              </p>
              <button
                onClick={() => router.push('/quiniela')}
                className="btn btn-primary"
                style={{ width: '100%' }}
              >
                <span>Ir a mi Quiniela</span>
                <ArrowRight size={16} />
              </button>
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
                  <strong>¿Aportación Fuera de Línea?</strong> Si realizaste tu cooperación en efectivo o transferencia bancaria directa, comunícate con el Administrador local y proporciónale tu usuario (<strong>@{profile?.username}</strong>) para activar tu perfil al instante.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
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
