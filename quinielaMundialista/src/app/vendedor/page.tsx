'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { BadgeDollarSign, Users, Ticket, Percent, Landmark, Copy, Check, Plus, Minus, RotateCcw, AlertTriangle, ArrowLeft, Clock, ShieldX } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

interface ReferredUser {
  id: string;
  full_name: string | null;
  username: string | null;
  created_at: string;
  is_active: boolean;
  isSimulated?: boolean;
}

function VendedorContent() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [realReferred, setRealReferred] = useState<ReferredUser[]>([]);
  const [dbLoading, setDbLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  // System Settings Configurable Rates
  const [ticketPrice, setTicketPrice] = useState(200);
  const [commScale1, setCommScale1] = useState(0.20);
  const [commScale2, setCommScale2] = useState(0.25);
  const [commScale3, setCommScale3] = useState(0.30);
  const [requestLoading, setRequestLoading] = useState(false);

  // Simulation State
  const [simPaidCount, setSimPaidCount] = useState(0);
  const [simPendingCount, setSimPendingCount] = useState(0);

  // Prepaid Coupon System States
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [buyQuantity, setBuyQuantity] = useState(1);
  const [buyLoading, setBuyLoading] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [buySuccess, setBuySuccess] = useState('');
  const [copiedCouponId, setCopiedCouponId] = useState<string | null>(null);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Handle Stripe redirect parameters and poll for confirmation
  useEffect(() => {
    const success = searchParams.get('success');
    const cancel = searchParams.get('cancel');

    if (cancel === 'true') {
      setBuyError('⚠️ La compra de cupones prepago fue cancelada.');
      router.replace('/vendedor');
      return;
    }

    if (success !== 'true' || !user) return;

    setIsVerifyingPayment(true);
    setBuySuccess('⏳ Verificando pago con Stripe y generando tus cupones prepago...');

    let attempts = 0;
    const maxAttempts = 10;
    const initialCount = coupons.length;

    const interval = setInterval(async () => {
      attempts++;
      
      const { data, error } = await supabase
        .from('qui_coupons')
        .select('id')
        .eq('seller_id', user.id);

      if (!error && data && data.length > initialCount) {
        clearInterval(interval);
        setIsVerifyingPayment(false);
        setBuySuccess('🎟️ ¡Tu pago en Stripe fue confirmado! Se han generado tus cupones prepago en tu panel.');
        await fetchCoupons();
        await refreshProfile();
        router.replace('/vendedor');
      } else if (attempts >= maxAttempts) {
        clearInterval(interval);
        setIsVerifyingPayment(false);
        setBuySuccess('');
        setBuyError('El pago está tardando en procesarse. Por favor, refresca la página en unos momentos.');
        await fetchCoupons();
        router.replace('/vendedor');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [searchParams, user, coupons.length]);

  const fetchCoupons = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('qui_coupons')
        .select(`
          id,
          code,
          price_paid,
          status,
          created_at,
          used_at,
          used_by,
          qui_profiles:used_by (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching coupons:', error.message);
      } else if (data) {
        setCoupons(data);
      }
    } catch (err) {
      console.error('Unexpected error fetching coupons:', err);
    }
  };

  const handleCopyCoupon = (code: string, couponId: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCouponId(couponId);
    setTimeout(() => setCopiedCouponId(null), 2000);
  };

  const activeCoupons = coupons.filter(c => c.status === 'active');
  const activeCount = activeCoupons.length;
  const maxBuyLimit = 5 - activeCount;

  // Make sure quantity defaults to a valid value when inventory changes
  useEffect(() => {
    if (maxBuyLimit > 0 && buyQuantity > maxBuyLimit) {
      setBuyQuantity(1);
    }
  }, [maxBuyLimit, buyQuantity]);

  const handleBuyCoupons = async () => {
    if (!user || maxBuyLimit <= 0) return;
    setBuyLoading(true);
    setBuyError('');
    setBuySuccess('');

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          email: user.email,
          action: 'buy_coupons',
          quantity: buyQuantity
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al procesar el pago con Stripe.');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No se recibió la URL de redirección de Stripe.');
      }
    } catch (err: any) {
      console.error(err);
      setBuyError(err.message || 'Error de comunicación.');
      setBuyLoading(false);
    }
  };

  const formatCouponDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Redirect to home if user logs out
  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Load Referred Users and System Settings
  useEffect(() => {
    let active = true;

    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('qui_system_settings')
          .select('*')
          .eq('id', 'points_config')
          .maybeSingle();

        if (active && !error && data) {
          if (data.ticket_cost !== undefined && data.ticket_cost !== null) {
            setTicketPrice(Number(data.ticket_cost));
          }
          if (data.seller_commission_1_10 !== undefined && data.seller_commission_1_10 !== null) {
            setCommScale1(Number(data.seller_commission_1_10));
          }
          if (data.seller_commission_11_25 !== undefined && data.seller_commission_11_25 !== null) {
            setCommScale2(Number(data.seller_commission_11_25));
          }
          if (data.seller_commission_26_up !== undefined && data.seller_commission_26_up !== null) {
            setCommScale3(Number(data.seller_commission_26_up));
          }
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
      }
    };

    fetchSettings();

    if (user && profile && profile.role === 'vendedor') {
      const loadData = async () => {
        await Promise.resolve();
        if (!active) return;
        setDbLoading(true);

        try {
          const { data, error } = await supabase
            .from('qui_profiles')
            .select('id, full_name, username, created_at, is_active')
            .eq('referred_by', user.id)
            .order('created_at', { ascending: false });

          if (active) {
            if (error) {
              console.error('Error fetching referred users:', error.message);
            } else if (data) {
              setRealReferred(data as ReferredUser[]);
            }
          }

          // Also fetch prepaid coupons on load
          await fetchCoupons();
        } catch (e) {
          console.error('Unexpected error fetching seller data:', e);
        } finally {
          if (active) {
            setDbLoading(false);
          }
        }
      };
      
      loadData();
    }

    return () => {
      active = false;
    };
  }, [user, profile]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRequestSeller = async () => {
    if (!user) return;
    setRequestLoading(true);
    try {
      const response = await fetch('/api/vendedor/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        await refreshProfile();
      } else {
        alert(data.error || 'Error al procesar la solicitud.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de comunicación con el servidor.');
    } finally {
      setRequestLoading(false);
    }
  };

  // Generate simulated list of users
  const getSimulatedUsers = (): ReferredUser[] => {
    const list: ReferredUser[] = [];
    const baseTime = 1779480000000;

    for (let i = 1; i <= simPaidCount; i++) {
      list.push({
        id: `sim-paid-${i}`,
        full_name: `Usuario Simulado ${i}`,
        username: `simulado_pagado_${i}`,
        created_at: new Date(baseTime - i * 3600000).toISOString(),
        is_active: true,
        isSimulated: true
      });
    }

    for (let i = 1; i <= simPendingCount; i++) {
      list.push({
        id: `sim-pending-${i}`,
        full_name: `Usuario Pendiente ${i}`,
        username: `simulado_pendiente_${i}`,
        created_at: new Date(baseTime - (i + simPaidCount) * 3600000 - 1800000).toISOString(),
        is_active: false,
        isSimulated: true
      });
    }

    return list;
  };

  const allReferred = [...getSimulatedUsers(), ...realReferred];
  const totalReferidos = allReferred.length;
  const boletosVendidos = allReferred.filter(r => r.is_active).length;

  const MIN_REFERRALS_TO_SELL = 5;
  const isQualified = totalReferidos >= MIN_REFERRALS_TO_SELL;

  let commissionRate = 0;
  if (isQualified) {
    if (boletosVendidos >= 26) {
      commissionRate = commScale3;
    } else if (boletosVendidos >= 11) {
      commissionRate = commScale2;
    } else if (boletosVendidos >= 1) {
      commissionRate = commScale1;
    }
  }

  const totalComisiones = boletosVendidos * ticketPrice * commissionRate;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || (dbLoading && realReferred.length === 0)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Panel Vendedor...
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Prevent flashing when logging out or not logged in
  }

  // Render Portal Workflow for non-vendedores
  if (!profile || profile.role !== 'vendedor') {
    const requestStatus = profile?.seller_request_status || 'none';

    if (requestStatus === 'pending') {
      return (
        <div className="auth-container" style={{ padding: '40px 20px' }}>
          <div className="glass-panel auth-panel" style={{ textAlign: 'center', padding: '40px 30px', maxWidth: '550px' }}>
            <Clock size={60} style={{ color: 'var(--accent-gold)', marginBottom: '20px', animation: 'pulse 2s infinite' }} />
            <h2 className="sports-font" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase' }}>
              Solicitud en Revisión
            </h2>
            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              Tu solicitud para activar el rol de <strong>Vendedor Autorizado</strong> ha sido recibida y se encuentra actualmente en revisión por nuestro equipo de administración.
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '24px' }}>
              Te notificaremos en tu buzón una vez que la solicitud sea procesada. Generalmente toma menos de 24 horas.
            </p>
            <Link href="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <ArrowLeft size={16} />
              <span>Volver al Inicio</span>
            </Link>
          </div>
        </div>
      );
    }

    if (requestStatus === 'rejected') {
      return (
        <div className="auth-container" style={{ padding: '40px 20px' }}>
          <div className="glass-panel auth-panel" style={{ textAlign: 'center', padding: '40px 30px', maxWidth: '550px' }}>
            <ShieldX size={60} style={{ color: 'var(--accent-red)', marginBottom: '20px' }} />
            <h2 className="sports-font" style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '14px', textTransform: 'uppercase' }}>
              Solicitud Declinada
            </h2>
            <div style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '0.9rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5
            }}>
              Lamentablemente, tu solicitud para activar el rol de vendedor ha sido rechazada por el administrador. Si consideras que esto es un error o deseas volver a postularte, puedes hacerlo a continuación.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleRequestSeller}
                disabled={requestLoading}
                className="btn btn-primary"
                style={{ width: '100%', padding: '14px', justifyContent: 'center' }}
              >
                {requestLoading ? 'Enviando...' : '¡Volver a solicitar!'}
              </button>
              <Link href="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                <ArrowLeft size={16} />
                <span>Volver al Inicio</span>
              </Link>
            </div>
          </div>
        </div>
      );
    }

    // Default 'none' / null state: Elegant become-seller promo screen
    return (
      <div className="auth-container" style={{ padding: '40px 20px' }}>
        <div className="glass-panel auth-panel" style={{ padding: '40px 30px', maxWidth: '600px', background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, rgba(30, 41, 59, 0.7) 100%)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <BadgeDollarSign size={54} style={{ color: 'var(--accent-neon-green)', marginBottom: '16px' }} />
            <h2 className="sports-font" style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 8px 0', textTransform: 'uppercase' }}>
              ¡Conviértete en Vendedor!
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Genera ingresos extras compartiendo la emoción de la Quiniela Mundialista 2026. Invita a tus amigos y gana excelentes comisiones por cada boleto pagado.
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-glass)', borderRadius: '14px', padding: '20px', marginBottom: '28px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', marginBottom: '14px', textAlign: 'center' }}>
              Esquema de Comisiones (Ticket: ${ticketPrice} MXN)
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>Nivel Inicial (1 - 10 boletos)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comisión del {(commScale1 * 100).toFixed(0)}%</span>
                </div>
                <strong style={{ color: 'var(--accent-neon-green)', fontSize: '1rem' }}>${(ticketPrice * commScale1).toFixed(2)} MXN / boleto</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>Nivel Pro (11 - 25 boletos)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comisión del {(commScale2 * 100).toFixed(0)}%</span>
                </div>
                <strong style={{ color: 'var(--accent-neon-green)', fontSize: '1rem' }}>${(ticketPrice * commScale2).toFixed(2)} MXN / boleto</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700 }}>Nivel Máximo (26+ boletos)</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Comisión del {(commScale3 * 100).toFixed(0)}%</span>
                </div>
                <strong style={{ color: 'var(--accent-neon-green)', fontSize: '1rem' }}>${(ticketPrice * commScale3).toFixed(2)} MXN / boleto</strong>
              </div>
            </div>
            
            <div style={{ marginTop: '16px', background: 'rgba(245, 158, 11, 0.05)', border: '1px dashed rgba(245, 158, 11, 0.3)', borderRadius: '8px', padding: '10px 12px', fontSize: '0.75rem', color: 'var(--accent-gold)', lineHeight: 1.4, textAlign: 'center' }}>
              * Nota: Requieres registrar al menos <strong>{MIN_REFERRALS_TO_SELL} usuarios</strong> para activar tus comisiones.
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={handleRequestSeller}
              disabled={requestLoading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', justifyContent: 'center', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}
            >
              {requestLoading ? 'Enviando solicitud...' : '¡Quiero ser vendedor!'}
            </button>
            <Link href="/" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
              <ArrowLeft size={16} />
              <span>Volver al Inicio</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Standard Seller View (Authorized Role)
  return (
    <div>
      <style>{`
        @keyframes referral-pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(16, 185, 129, 0.25), inset 0 0 10px rgba(16, 185, 129, 0.05);
            border-color: rgba(16, 185, 129, 0.45);
          }
          50% {
            box-shadow: 0 0 40px rgba(16, 185, 129, 0.75), inset 0 0 20px rgba(16, 185, 129, 0.25);
            border-color: rgba(16, 185, 129, 0.95);
          }
        }
        .referral-box-glow {
          animation: referral-pulse-glow 2.5s infinite ease-in-out;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .referral-box-glow:hover {
          box-shadow: 0 0 50px rgba(16, 185, 129, 0.95), inset 0 0 25px rgba(16, 185, 129, 0.35) !important;
          border-color: rgba(16, 185, 129, 1) !important;
          transform: scale(1.03);
        }
      `}</style>

      {/* Header Panel */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(30, 41, 59, 0.4) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        marginBottom: '24px',
        padding: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-neon-green)', marginBottom: '4px' }}>
            <BadgeDollarSign size={20} />
            <span style={{ fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              Área de Negocio
            </span>
          </div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            Panel de Vendedor
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>
            Gestiona tus referidos, simula tus ventas y visualiza tus ganancias por comisiones.
          </p>
        </div>

        {/* Copy Referral Code */}
        <div 
          className="referral-box-glow"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px', 
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(3, 7, 18, 0.75) 100%)', 
            padding: '16px 26px', 
            borderRadius: '18px', 
            border: '2px solid rgba(16, 185, 129, 0.5)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ marginRight: '12px' }}>
            <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 900, letterSpacing: '0.08em', marginBottom: '4px' }}>Código de Referido</span>
            <span className="sports-font" style={{ 
              fontSize: '2rem', 
              fontWeight: 950, 
              color: 'var(--accent-neon-green)',
              textShadow: '0 0 15px rgba(16, 185, 129, 0.7)',
              letterSpacing: '0.08em',
              lineHeight: 1.1
            }}>{profile.referral_code || 'SIN_CODIGO'}</span>
          </div>
          {profile.referral_code && (
            <button 
              onClick={() => handleCopyCode(profile.referral_code || '')}
              className="btn btn-secondary"
              style={{ padding: '8px 16px', display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 700 }}
            >
              {copied ? (
                <>
                  <Check size={16} style={{ color: 'var(--accent-neon-green)' }} />
                  <span style={{ color: 'var(--accent-neon-green)', fontSize: '0.8rem' }}>Copiado</span>
                </>
              ) : (
                <>
                  <Copy size={16} />
                  <span style={{ fontSize: '0.8rem' }}>Copiar</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Seller Qualification Alert */}
      {!isQualified && (
        <div className="glass-panel" style={{
          background: 'rgba(245, 158, 11, 0.04)',
          border: '1px dashed rgba(245, 158, 11, 0.3)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: 'var(--accent-gold)'
        }}>
          <AlertTriangle size={28} style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, textTransform: 'uppercase' }}>Estado: Vendedor en Activación (Pre-Vendedor)</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              Requieres un mínimo de <strong>{MIN_REFERRALS_TO_SELL} referidos registrados</strong> en total para activar tu cuenta de vendedor y comenzar a devengar comisiones. Actualmente cuentas con <strong>{totalReferidos} / {MIN_REFERRALS_TO_SELL}</strong>. ¡Comparte tu código para desbloquear tus comisiones!
            </p>
          </div>
        </div>
      )}

      {/* Statistics Cards Grid */}
      <div className="stats-grid" style={{ marginBottom: '24px' }}>
        {/* Stat 1: Total Referrals */}
        <div className="glass-panel stat-box" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <div className="stat-icon">
            <Users size={22} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Inscritos Totales</span>
            <span className="stat-value">{totalReferidos}</span>
          </div>
        </div>

        {/* Stat 2: Paid Tickets */}
        <div className="glass-panel stat-box success" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <div className="stat-icon">
            <Ticket size={22} style={{ color: 'var(--accent-neon-green)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Boletos Vendidos</span>
            <span className="stat-value" style={{ color: 'var(--accent-neon-green)' }}>{boletosVendidos}</span>
          </div>
        </div>

        {/* Stat 3: Commission Percentage */}
        <div className="glass-panel stat-box gold" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <div className="stat-icon">
            <Percent size={22} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tasa Comisión</span>
            <span className="stat-value" style={{ color: 'var(--accent-gold)' }}>
              {isQualified ? `${(commissionRate * 100).toFixed(0)}%` : '0% (Inactivo)'}
            </span>
          </div>
        </div>

        {/* Stat 4: Commission Total Earnings */}
        <div className="glass-panel stat-box gold" style={{ background: 'rgba(15, 23, 42, 0.5)' }}>
          <div className="stat-icon">
            <Landmark size={22} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Comisiones Ganadas</span>
            <span className="stat-value" style={{ color: 'var(--accent-gold)' }}>
              ${totalComisiones.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
            </span>
          </div>
        </div>
      </div>

      {/* Prepaid Coupon System Section */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid var(--border-glass)',
        borderRadius: '24px',
        padding: '24px',
        marginBottom: '24px',
        boxShadow: '0 15px 40px rgba(0, 0, 0, 0.5)'
      }}>
        <h3 className="sports-font" style={{
          fontSize: '1.4rem',
          fontWeight: 900,
          textTransform: 'uppercase',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-glass)',
          paddingBottom: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <Ticket size={24} style={{ color: 'var(--accent-neon-green)' }} />
          <span>Venta Física y Sistema de Cupones Prepago 🎟️</span>
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
          {/* Left Column: Acquisition Module */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Adquirir Cupones en Lote
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.45 }}>
                ¿Un participante te pagó en efectivo? Puedes comprar códigos prepago aquí. Al entregárselo, el participante se activará al instante y se registrará automáticamente como tu referido directo.
              </p>
            </div>

            {/* Inventory Count Indicator */}
            <div style={{
              background: activeCount === 5 ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.08)',
              border: activeCount === 5 ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '14px',
              padding: '14px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Cupones Activos Disponibles
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Límite permitido por vendedor: 5
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="sports-font" style={{
                  fontSize: '1.8rem',
                  fontWeight: 950,
                  color: activeCount === 5 ? 'var(--accent-gold)' : 'var(--accent-neon-green)'
                }}>
                  {activeCount} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 5</span>
                </span>
              </div>
            </div>

            {/* If limit is reached, show an amber alert and disable selector */}
            {activeCount === 5 ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.05)',
                border: '1px dashed rgba(245, 158, 11, 0.4)',
                borderRadius: '12px',
                padding: '12px 14px',
                color: 'var(--accent-gold)',
                fontSize: '0.8rem',
                lineHeight: 1.4
              }}>
                ⚠️ <strong>¡Límite de Cupones Activos Alcanzado!</strong> Solo puedes mantener un máximo de 5 cupones activos (sin usar) al mismo tiempo. Debes esperar que tus cupones actuales sean canjeados por participantes para poder comprar más.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                      Cantidad a Comprar
                    </label>
                    <select
                      value={buyQuantity}
                      onChange={(e) => setBuyQuantity(Number(e.target.value))}
                      style={{
                        width: '100%',
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 'var(--border-radius-sm)',
                        padding: '10px 12px',
                        color: 'var(--text-primary)',
                        fontSize: '0.9rem',
                        outline: 'none'
                      }}
                    >
                      {Array.from({ length: maxBuyLimit }, (_, idx) => idx + 1).map((val) => (
                        <option key={val} value={val} style={{ background: '#1e293b' }}>
                          {val} {val === 1 ? 'cupón' : 'cupones'}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div style={{ width: '120px', textAlign: 'right' }}>
                    <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
                      Total Sugerido
                    </span>
                    <span className="sports-font" style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                      ${(buyQuantity * ticketPrice).toLocaleString()} MXN
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleBuyCoupons}
                  disabled={buyLoading || isVerifyingPayment}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    background: (buyLoading || isVerifyingPayment) ? 'var(--text-muted)' : 'var(--accent-neon-green)',
                    borderColor: (buyLoading || isVerifyingPayment) ? 'var(--text-muted)' : 'var(--accent-neon-green)',
                    color: '#030712',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '12px',
                    justifyContent: 'center',
                    boxShadow: (buyLoading || isVerifyingPayment) ? 'none' : '0 0 15px var(--accent-neon-green-glow)'
                  }}
                >
                  {buyLoading ? 'Redireccionando a Stripe...' : isVerifyingPayment ? 'Verificando pago...' : 'Comprar y Generar Cupones'}
                </button>
              </div>
            )}

            {/* Error and Success Feedbacks */}
            {buyError && (
              <p style={{ color: '#f87171', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                <AlertTriangle size={14} />
                <span>{buyError}</span>
              </p>
            )}

            {buySuccess && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '10px',
                padding: '10px 14px',
                color: 'var(--accent-neon-green)',
                fontSize: '0.8rem',
                lineHeight: 1.4
              }}>
                {buySuccess}
              </div>
            )}
          </div>

          {/* Right Column: Coupons Inventory List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Mis Códigos Prepago ({coupons.length})</span>
              {couponsLoading && <span style={{ fontSize: '0.75rem', color: 'var(--accent-neon-green)', fontWeight: 500 }}>Cargando...</span>}
            </h4>

            <div style={{
              flex: 1,
              background: 'rgba(0, 0, 0, 0.25)',
              border: '1px solid var(--border-glass)',
              borderRadius: '16px',
              padding: '12px',
              maxHeight: '320px',
              overflowY: 'auto'
            }}>
              {coupons.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                  <Ticket size={36} style={{ opacity: 0.15 }} />
                  <span style={{ fontSize: '0.85rem' }}>Aún no has generado cupones prepago.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {coupons.map((coupon) => {
                    const isActive = coupon.status === 'active';
                    const usedByUser = coupon.qui_profiles;
                    
                    return (
                      <div
                        key={coupon.id}
                        style={{
                          background: isActive ? 'rgba(16, 185, 129, 0.04)' : 'rgba(255, 255, 255, 0.01)',
                          border: isActive ? '1px solid rgba(16, 185, 129, 0.15)' : '1px solid rgba(255, 255, 255, 0.03)',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                          transition: 'var(--transition-smooth)'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              className="sports-font"
                              style={{
                                fontSize: '1.1rem',
                                fontWeight: 900,
                                fontFamily: 'monospace',
                                letterSpacing: '0.05em',
                                textDecoration: isActive ? 'none' : 'line-through',
                                color: isActive ? 'var(--accent-neon-green)' : 'var(--text-muted)'
                              }}
                            >
                              {coupon.code}
                            </span>
                            {isActive ? (
                              <span style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                background: 'var(--accent-neon-green)',
                                boxShadow: '0 0 8px var(--accent-neon-green)'
                              }}></span>
                            ) : (
                              <span style={{
                                fontSize: '0.65rem',
                                background: 'rgba(255,255,255,0.05)',
                                color: 'var(--text-muted)',
                                padding: '1px 5px',
                                borderRadius: '4px',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                              }}>Canjeado</span>
                            )}
                          </div>

                          <div style={{ marginTop: '4px', fontSize: '0.72rem' }}>
                            {isActive ? (
                              <span style={{ color: 'var(--text-secondary)' }}>
                                Sugerido: ${coupon.price_paid} MXN • Listo para usar
                              </span>
                            ) : (
                              <span style={{ color: 'var(--text-muted)' }}>
                                Canjeado por{' '}
                                <strong style={{ color: 'var(--text-secondary)' }}>
                                  {usedByUser?.full_name || `@${usedByUser?.username}` || 'Participante'}
                                </strong>{' '}
                                el {formatCouponDate(coupon.used_at)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          {isActive ? (
                            <button
                              onClick={() => handleCopyCoupon(coupon.code, coupon.id)}
                              className="btn"
                              style={{
                                padding: '6px 12px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '1px solid rgba(16, 185, 129, 0.3)',
                                borderRadius: '8px',
                                color: 'var(--accent-neon-green)',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: 700
                              }}
                            >
                              {copiedCouponId === coupon.id ? (
                                <>
                                  <Check size={12} />
                                  <span>¡Copiado!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  <span>Copiar</span>
                                </>
                              )}
                            </button>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Tachado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Interactive Simulation Panel + Referred List */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        
        {/* Left Column: Interactive Simulation Control Center */}
        <div className="glass-panel" style={{ height: 'fit-content' }}>
          <h3 className="sports-font" style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BadgeDollarSign size={18} style={{ color: 'var(--accent-neon-green)' }} /> Simulador de Ventas
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', lineHeight: 1.45, marginBottom: '20px' }}>
            Prueba interactivamente la escala de comisiones inyectando ventas simuladas para comprobar cómo cambia tu tasa de comisión y tus ganancias:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
            {/* Control 1: Simulated Paid Referrals */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Boletos Pagados</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-neon-green)' }}>Genera comisión de nivel</span>
                </div>
                <span className="sports-font" style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-neon-green)' }}>{simPaidCount}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setSimPaidCount(prev => Math.max(0, prev - 1))}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px' }}
                >
                  <Minus size={16} />
                </button>
                <button 
                  onClick={() => setSimPaidCount(prev => prev + 1)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', border: '1px solid rgba(16, 185, 129, 0.3)' }}
                >
                  <Plus size={16} style={{ color: 'var(--accent-neon-green)' }} />
                </button>
              </div>
            </div>

            {/* Control 2: Simulated Pending Referrals */}
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-glass)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <div>
                  <span style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Registros Pendientes</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent-gold)' }}>Registrados sin pago completo</span>
                </div>
                <span className="sports-font" style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--accent-gold)' }}>{simPendingCount}</span>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => setSimPendingCount(prev => Math.max(0, prev - 1))}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px' }}
                >
                  <Minus size={16} />
                </button>
                <button 
                  onClick={() => setSimPendingCount(prev => prev + 1)}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}
                >
                  <Plus size={16} style={{ color: 'var(--accent-gold)' }} />
                </button>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Quick Actions preset scales */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
              <button 
                onClick={() => { setSimPaidCount(5); setSimPendingCount(0); }}
                className="btn btn-secondary"
                style={{ padding: '6px', fontSize: '0.75rem', fontWeight: 700 }}
              >
                Simular 5 ({(commScale1 * 100).toFixed(0)}%)
              </button>
              <button 
                onClick={() => { setSimPaidCount(12); setSimPendingCount(2); }}
                className="btn btn-secondary"
                style={{ padding: '6px', fontSize: '0.75rem', fontWeight: 700 }}
              >
                Simular 12 ({(commScale2 * 100).toFixed(0)}%)
              </button>
              <button 
                onClick={() => { setSimPaidCount(30); setSimPendingCount(4); }}
                className="btn btn-secondary"
                style={{ padding: '6px', fontSize: '0.75rem', fontWeight: 700 }}
              >
                Simular 30 ({(commScale3 * 100).toFixed(0)}%)
              </button>
            </div>

            <button 
              onClick={() => { setSimPaidCount(0); setSimPendingCount(0); }}
              className="btn btn-danger"
              style={{ width: '100%', padding: '10px', display: 'flex', gap: '8px', justifyContent: 'center', alignItems: 'center' }}
            >
              <RotateCcw size={16} />
              <span>Limpiar Simulación</span>
            </button>
          </div>

          {/* Commission Scale Reference Table */}
          <div style={{ marginTop: '24px', borderTop: '1px dashed var(--border-glass)', paddingTop: '16px' }}>
            <h4 style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '10px' }}>
              Tabla Referencia de Comisiones
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: 'rgba(255,255,255,0.01)', borderRadius: '6px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Mínimo Referidos para calificar:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{MIN_REFERRALS_TO_SELL} referidos</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: commissionRate === commScale1 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)', borderRadius: '6px', border: commissionRate === commScale1 ? '1px solid rgba(16, 185, 129, 0.2)' : undefined }}>
                <span style={{ color: commissionRate === commScale1 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>1 - 10 boletos vendidos:</span>
                <strong style={{ color: commissionRate === commScale1 ? 'var(--accent-neon-green)' : 'var(--text-primary)' }}>{(commScale1 * 100).toFixed(0)}% comisión</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: commissionRate === commScale2 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)', borderRadius: '6px', border: commissionRate === commScale2 ? '1px solid rgba(16, 185, 129, 0.2)' : undefined }}>
                <span style={{ color: commissionRate === commScale2 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>11 - 25 boletos vendidos:</span>
                <strong style={{ color: commissionRate === commScale2 ? 'var(--accent-neon-green)' : 'var(--text-primary)' }}>{(commScale2 * 100).toFixed(0)}% comisión</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: commissionRate === commScale3 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.01)', borderRadius: '6px', border: commissionRate === commScale3 ? '1px solid rgba(16, 185, 129, 0.2)' : undefined }}>
                <span style={{ color: commissionRate === commScale3 ? 'var(--text-primary)' : 'var(--text-secondary)' }}>26 en adelante boletos vendidos:</span>
                <strong style={{ color: commissionRate === commScale3 ? 'var(--accent-neon-green)' : 'var(--text-primary)' }}>{(commScale3 * 100).toFixed(0)}% comisión</strong>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: List of referred users */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 className="sports-font" style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Users size={18} style={{ color: 'var(--accent-blue)' }} /> Lista de Referidos ({totalReferidos})
          </h3>

          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '500px' }}>
            {allReferred.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Users size={40} style={{ opacity: 0.15 }} />
                <span style={{ fontSize: '0.85rem' }}>No se han inscrito usuarios con tu código de referido aún.</span>
              </div>
            ) : (
              <div className="ranking-table-wrapper" style={{ margin: 0 }}>
                <table className="ranking-table">
                  <thead>
                    <tr>
                      <th style={{ padding: '12px 10px' }}>Nombre / Usuario</th>
                      <th style={{ padding: '12px 10px', textAlign: 'center' }}>Registro</th>
                      <th style={{ padding: '12px 10px', textAlign: 'right' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allReferred.map((ref) => (
                      <tr key={ref.id} className="ranking-row">
                        <td style={{ padding: '10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {ref.full_name || 'Participante'}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                              @{ref.username || 'sin_usuario'}
                            </span>
                            {ref.isSimulated && (
                              <span style={{ 
                                alignSelf: 'flex-start',
                                fontSize: '0.6rem', 
                                background: 'rgba(59, 130, 246, 0.15)', 
                                color: '#60a5fa', 
                                border: '1px solid rgba(59, 130, 246, 0.3)',
                                padding: '1px 4px',
                                borderRadius: '4px',
                                marginTop: '4px',
                                fontWeight: 700,
                                textTransform: 'uppercase'
                              }}>
                                Simulado
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '10px', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                          {formatDate(ref.created_at)}
                        </td>
                        <td style={{ padding: '10px', textAlign: 'right' }}>
                          {ref.is_active ? (
                            <span className="badge badge-paid" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Pagado</span>
                          ) : (
                            <span className="badge badge-unpaid" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function VendedorPage() {
  return (
    <React.Suspense fallback={
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Panel Vendedor...
        </div>
      </div>
    }>
      <VendedorContent />
    </React.Suspense>
  );
}
