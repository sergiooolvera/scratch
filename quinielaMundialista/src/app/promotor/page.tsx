'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { BadgeDollarSign, Gift, User, Copy, Check, Sparkles, Heart, Share2, Users, ArrowRight, ShieldCheck, Mail, Smartphone, Landmark, Loader, AlertCircle } from 'lucide-react';

interface ReferredUser {
  id: string;
  username: string | null;
  full_name: string | null;
  created_at: string;
  is_active: boolean;
}

export default function PromotorPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile } = useAuth();
  
  const [requestLoading, setRequestLoading] = useState(false);
  const [referredUsers, setReferredUsers] = useState<ReferredUser[]>([]);
  const [loadingReferred, setLoadingReferred] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [promoterInfo, setPromoterInfo] = useState<any>(null);
  const [formFullName, setFormFullName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formClabe, setFormClabe] = useState('');
  const [formBank, setFormBank] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoMsg, setInfoMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'red' | 'pago'>('red');
  const [loadingInfo, setLoadingInfo] = useState(true);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Fetch referred users if user is a promoter
  useEffect(() => {
    const fetchReferred = async () => {
      if (!user || (profile?.role !== 'promotor' && profile?.seller_request_status !== 'approved')) return;
      
      setLoadingReferred(true);
      try {
        const { data, error } = await supabase
          .from('qui_profiles')
          .select('id, username, full_name, created_at, is_active')
          .eq('referred_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setReferredUsers(data || []);
      } catch (err: any) {
        console.error('Error fetching referred users:', err.message);
      } finally {
        setLoadingReferred(false);
      }
    };

    if (user && profile) {
      fetchReferred();
    }
  }, [user, profile]);

  const isApprovedPromoter = profile?.role === 'promotor' || profile?.seller_request_status === 'approved';
  const isPendingPromoter = profile?.seller_request_status === 'pending';
  const showApplyScreen = !isApprovedPromoter && !isPendingPromoter;

  // Fetch promoter info
  useEffect(() => {
    const fetchInfo = async () => {
      if (!user) return;
      setLoadingInfo(true);
      try {
        const { data, error } = await supabase
          .from('qui_promoter_info')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error && !error.message?.includes('does not exist')) {
          console.error('Error fetching promoter info:', error.message);
        }
        if (data) {
          setPromoterInfo(data);
          setFormFullName(data.full_name || profile?.full_name || '');
          setFormPhone(data.phone || '');
          setFormClabe(data.clabe || '');
          setFormBank(data.bank_name || '');
        } else {
          setFormFullName(profile?.full_name || '');
        }
      } catch (err: any) {
        console.error('Error fetching promoter info:', err.message);
      } finally {
        setLoadingInfo(false);
      }
    };
    if (isApprovedPromoter && user) {
      fetchInfo();
    }
  }, [user, isApprovedPromoter, profile]);

  const handleRequestPromoter = async () => {
    if (!user) return;
    setRequestLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';

      const res = await fetch('/api/promotor/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al enviar solicitud.');

      setSuccessMsg('¡Solicitud enviada con éxito! El administrador validará tu perfil muy pronto.');
      await refreshProfile();
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setErrorMsg('La solicitud tardó demasiado. Intenta de nuevo.');
      } else {
        setErrorMsg(err.message || 'Error de conexión.');
      }
    } finally {
      clearTimeout(timeout);
      setRequestLoading(false);
    }
  };

  const handleSaveInfo = async () => {
    if (!user || !formFullName || formFullName.trim().length < 3) {
      setInfoMsg('El nombre completo es obligatorio.');
      return;
    }
    setSavingInfo(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || '';
      const res = await fetch('/api/promoter/save-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ full_name: formFullName.trim(), phone: formPhone.trim(), clabe: formClabe.trim(), bank_name: formBank.trim() })
      });
      const response = await res.json();
      if (!res.ok) throw new Error(response.error);
      setInfoMsg('¡Datos guardados correctamente!');
      setTimeout(() => setInfoMsg(''), 3000);
    } catch (err: any) {
      setInfoMsg(`Error: ${err.message}`);
    } finally {
      setSavingInfo(false);
    }
  };

  const copyToClipboard = (text: string, type: 'code' | 'link') => {
    navigator.clipboard.writeText(text);
    if (type === 'code') {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } else {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (loading || !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Portal de Promotor...
        </div>
      </div>
    );
  }

  // Direct signup link
  const signupLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/login?ref=${profile?.referral_code || ''}`
    : '';

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px 16px', minHeight: '80vh' }}>
      
      {/* 1. APPLY SCREEN (Not Promoter yet) */}
      {showApplyScreen && (
        <div className="glass-panel" style={{ padding: '40px 30px', borderRadius: '24px', position: 'relative', overflow: 'hidden' }}>
          {/* Subtle neon accents */}
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
            zIndex: 0
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-20%',
            left: '-10%',
            width: '300px',
            height: '300px',
            background: 'radial-gradient(circle, rgba(245, 158, 11, 0.08) 0%, transparent 70%)',
            zIndex: 0
          }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', textAlign: 'center' }}>
            <div style={{
              background: 'rgba(245, 158, 11, 0.1)',
              border: '2px solid var(--accent-gold)',
              borderRadius: '50%',
              padding: '24px',
              color: 'var(--accent-gold)',
              boxShadow: '0 0 25px rgba(245, 158, 11, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BadgeDollarSign size={48} />
            </div>

            <h2 className="sports-font" style={{ fontSize: '2rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
              Red de Apoyo de Promotores 🚀
            </h2>
            
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', maxWidth: '700px', lineHeight: 1.7, margin: 0 }}>
              QuiMundial es una plataforma recreativa y privada, orientada exclusivamente al esparcimiento deportivo y 100% gratuita. 
              Sin embargo, mantener servidores en la nube rápidos, bases de datos seguras y el envío automático de correos tiene costos técnicos fijos.
            </p>

            <div className="glass-card" style={{
              maxWidth: '650px',
              padding: '24px',
              borderRadius: '16px',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(255,255,255,0.01)',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              marginTop: '10px'
            }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-neon-green)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} /> ¿Cómo funciona el Programa de Promotores?
              </h4>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-neon-green)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-neon-green)', fontSize: '0.8rem', fontWeight: 'bold' }}>1</div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Invita a tus Amigos:</strong> Al convertirte en Promotor, se activará tu <strong>Código de Referido</strong> único y enlaces directos de registro. Invita a tus amigos, familiares o grupos de WhatsApp a unirse a la Quiniela.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--accent-neon-green)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-neon-green)', fontSize: '0.8rem', fontWeight: 'bold' }}>2</div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Crea una Red de Apoyo:</strong> Explícales que QuiMundial es gratuita pero acepta cooperaciones voluntarias de mantenimiento para solventar los servidores en la nube.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid var(--accent-gold)', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--accent-gold)', fontSize: '0.8rem', fontWeight: 'bold' }}>3</div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong>Apoyo Mutuo 50/50:</strong> De las aportaciones voluntarias que decidan realizar tus referidos (si las hubiera):
                  <br />
                  • El **50%** se destinará directamente a cubrir gastos de mantenimiento de la página.
                  <br />
                  • El **50%** restante te corresponderá **directamente a ti** como recompensa por expandir y coordinar la comunidad.
                </p>
              </div>
            </div>

            {errorMsg && (
              <div className="glass-card" style={{ padding: '12px 20px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', borderRadius: '12px', fontSize: '0.9rem' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div className="glass-card" style={{ padding: '12px 20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: 'var(--accent-neon-green)', borderRadius: '12px', fontSize: '0.9rem' }}>
                {successMsg}
              </div>
            )}

            <button
              onClick={handleRequestPromoter}
              className="btn btn-gold"
              style={{ padding: '16px 36px', fontSize: '1.05rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', boxShadow: '0 0 20px rgba(245, 158, 11, 0.35)', marginTop: '10px' }}
              disabled={requestLoading}
            >
              {requestLoading ? 'Enviando Solicitud...' : 'Solicitar ser Promotor 🎁'}
            </button>
          </div>
        </div>
      )}

      {/* 2. PENDING SCREEN (Waiting for admin approval) */}
      {isPendingPromoter && (
        <div className="glass-panel" style={{ padding: '50px 30px', borderRadius: '24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '2px solid var(--accent-gold)',
            borderRadius: '50%',
            padding: '24px',
            color: 'var(--accent-gold)',
            boxShadow: '0 0 20px rgba(245, 158, 11, 0.25)',
            display: 'inline-flex',
            animation: 'pulse 2s infinite'
          }}>
            <Gift size={40} />
          </div>

          <h3 className="sports-font" style={{ fontSize: '1.6rem', fontWeight: 900, textTransform: 'uppercase', margin: 0 }}>
            Solicitud en Revisión ⏳
          </h3>
          
          <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', maxWidth: '500px', lineHeight: 1.6, margin: 0 }}>
            Tu solicitud para formar parte de nuestra **Red de Promotores** ha sido recibida con éxito.
            El administrador validará tu perfil muy pronto para darte de alta.
          </p>

          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.05)',
            borderRadius: '12px',
            padding: '16px',
            maxWidth: '450px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textAlign: 'left',
            marginTop: '10px'
          }}>
            <strong>Próximos pasos:</strong> Una vez aprobado por el administrador, se te notificará o podrás recargar esta página para ver tu panel de estadísticas, tu código exclusivo de referido, compartir el enlace y monitorear la participación de tus invitados.
          </div>
        </div>
      )}

      {/* 3. PROMOTER DASHBOARD (Approved) */}
      {isApprovedPromoter && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Main header panel */}
          <div className="glass-panel" style={{ padding: '30px 24px', borderRadius: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <h2 className="sports-font" style={{ fontSize: '1.8rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <ShieldCheck size={28} style={{ color: 'var(--accent-neon-green)' }} /> Panel del Promotor 🌟
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', margin: '6px 0 0 0' }}>
                Gestiona tu red de referidos y apoya a mantener viva la Quiniela Mundialista.
              </p>
            </div>
            
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: '12px',
              padding: '10px 18px',
              textAlign: 'right'
            }}>
              <span style={{ fontSize: '0.7rem', color: 'var(--accent-neon-green)', fontWeight: 800, textTransform: 'uppercase' }}>Rol Activo</span>
              <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#ffffff' }}>PROMOTOR OFICIAL</div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', marginBottom: '20px' }}>
            <button
              onClick={() => setActiveTab('red')}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: activeTab === 'red' ? '2px solid var(--accent-neon-green)' : '2px solid transparent',
                background: activeTab === 'red' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255,255,255,0.03)',
                color: activeTab === 'red' ? 'var(--accent-neon-green)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Users size={18} /> Mi Red
            </button>
            <button
              onClick={() => setActiveTab('pago')}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: activeTab === 'pago' ? '2px solid var(--accent-gold)' : '2px solid transparent',
                background: activeTab === 'pago' ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.03)',
                color: activeTab === 'pago' ? 'var(--accent-gold)' : 'var(--text-secondary)',
                fontWeight: 800,
                fontSize: '0.9rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Landmark size={18} /> Datos de Pago
            </button>
          </div>

          {/* Tab: Mi Red */}
          {activeTab === 'red' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Share2 size={18} style={{ color: 'var(--accent-neon-green)' }} /> Herramientas de Compartición
                  </h3>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tu Código de Referido</span>
                      {copiedCode && <span style={{ color: 'var(--accent-neon-green)', fontSize: '0.75rem', fontWeight: 'bold' }}>¡Copiado!</span>}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" className="form-input" value={profile?.referral_code || ''} readOnly
                        style={{ flex: 1, fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.1rem', letterSpacing: '1px', textAlign: 'center', textTransform: 'uppercase', background: 'rgba(0,0,0,0.2)' }} />
                      <button onClick={() => copyToClipboard(profile?.referral_code || '', 'code')} className="btn btn-secondary"
                        style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {copiedCode ? <Check size={18} style={{ color: 'var(--accent-neon-green)' }} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Enlace Directo de Registro</span>
                      {copiedLink && <span style={{ color: 'var(--accent-neon-green)', fontSize: '0.75rem', fontWeight: 'bold' }}>¡Enlace copiado!</span>}
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input type="text" className="form-input" value={signupLink} readOnly
                        style={{ flex: 1, fontSize: '0.8rem', background: 'rgba(0,0,0,0.2)' }} />
                      <button onClick={() => copyToClipboard(signupLink, 'link')} className="btn btn-secondary"
                        style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {copiedLink ? <Check size={18} style={{ color: 'var(--accent-neon-green)' }} /> : <Copy size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, borderBottom: '1px solid var(--border-glass)', paddingBottom: '8px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Heart size={18} style={{ color: 'var(--accent-neon-green)' }} /> Red de Apoyo Solidaria
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <p style={{ margin: 0 }}>¡Gracias por promover el juego limpio y ayudarnos a costear la Quiniela!</p>
                    <div style={{ background: 'rgba(16, 185, 129, 0.04)', border: '1px solid rgba(16, 185, 129, 0.15)', borderRadius: '10px', padding: '12px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      <strong>Regla de Aportaciones (50/50):</strong><br />
                      Si tus referidos deciden realizar un donativo voluntario para costear servidores, **el 50% de dicho donativo es transferido a tu favor**. El otro 50% se utiliza en el mantenimiento técnico de QuiMundial.
                    </div>
                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      *Nota: Los registros de donaciones voluntarias y las transferencias de recompensa se coordinan de forma offline directamente con el administrador de soporte.*
                    </p>
                  </div>
                </div>
              </div>

              <div className="glass-panel">
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <Users size={20} style={{ color: 'var(--accent-neon-green)' }} /> Tus Participantes Invitados ({referredUsers.length})
                </h3>
                {loadingReferred ? (
                  <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>Cargando registros de tus invitados...</div>
                ) : referredUsers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <Users size={36} style={{ opacity: 0.2 }} />
                    <span>No has registrado ningún invitado todavía.</span>
                    <span style={{ fontSize: '0.8rem', opacity: 0.8 }}>¡Comparte tu código de referido para empezar a sumar amigos a la Quiniela!</span>
                  </div>
                ) : (
                  <div className="ranking-table-wrapper">
                    <table className="ranking-table">
                      <thead>
                        <tr>
                          <th>Participante</th>
                          <th style={{ textAlign: 'center' }}>Registrado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {referredUsers.map((refUser) => (
                          <tr key={refUser.id} className="ranking-row">
                            <td>
                              <div className="rank-player-cell">
                                <div className="player-avatar" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)' }}>
                                  {(refUser.full_name || 'U')[0].toUpperCase()}
                                </div>
                                <div className="player-name-container">
                                  <span className="player-name">{refUser.full_name || 'Participante'}</span>
                                  <span className="player-badge">@{refUser.username || 'user'}</span>
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                              {new Date(refUser.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Tab: Datos de Pago */}
          {activeTab === 'pago' && (
            <div className="glass-panel">
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                <Landmark size={20} style={{ color: 'var(--accent-gold)' }} /> Datos para Pago
              </h3>
              {loadingInfo ? (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                  <Loader size={20} style={{ animation: 'spin 1s linear infinite', marginRight: '8px' }} />
                  Cargando datos...
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '600px' }}>
                  <div className="form-group">
                    <label className="form-label">Nombre Completo</label>
                    <input type="text" className="form-input" value={formFullName}
                      onChange={(e) => setFormFullName(e.target.value)}
                      placeholder="Tu nombre completo (como aparece en tu cuenta bancaria)" style={{ width: '100%' }} />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Smartphone size={16} /> Teléfono (WhatsApp)
                    </label>
                    <input type="tel" className="form-input" value={formPhone}
                      onChange={(e) => setFormPhone(e.target.value)}
                      placeholder="Ej: 521234567890" style={{ width: '100%' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group">
                      <label className="form-label">CLABE (18 dígitos)</label>
                      <input type="text" className="form-input" value={formClabe}
                        onChange={(e) => setFormClabe(e.target.value)}
                        placeholder="000000000000000000" maxLength={18} style={{ width: '100%', fontFamily: 'monospace' }} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Banco</label>
                      <input type="text" className="form-input" value={formBank}
                        onChange={(e) => setFormBank(e.target.value)}
                        placeholder="Ej: BBVA, Banorte, Santander..." style={{ width: '100%' }} />
                    </div>
                  </div>
                  {infoMsg && (
                    <div style={{
                      padding: '10px 14px',
                      background: infoMsg.startsWith('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      border: `1px solid ${infoMsg.startsWith('Error') ? 'rgba(239, 68, 68, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
                      borderRadius: '10px',
                      color: infoMsg.startsWith('Error') ? '#f87171' : 'var(--accent-neon-green)',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center', gap: '8px'
                    }}>
                      {infoMsg.startsWith('Error') ? <AlertCircle size={16} /> : <Check size={16} />} {infoMsg}
                    </div>
                  )}
                  <button onClick={handleSaveInfo} className="btn btn-primary" disabled={savingInfo}
                    style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 28px', fontWeight: 800 }}>
                    {savingInfo ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={18} />}
                    {savingInfo ? 'Guardando...' : 'Guardar Datos'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
