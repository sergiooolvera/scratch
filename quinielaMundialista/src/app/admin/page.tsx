'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Save, TableProperties, Settings, Users, RotateCcw, ShieldAlert, BadgeDollarSign, Sparkles, Ban, Lock, Unlock, Store, ChevronDown, ChevronUp, Search, BadgeCheck, BadgeX, UserCheck } from 'lucide-react';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
  group_name: string;
  is_locked?: boolean;
}

interface Player {
  id: string;
  username: string | null;
  full_name: string | null;
  is_active: boolean;
  points: number;
  created_at: string;
}

interface VendorClient {
  id: string;
  username: string | null;
  full_name: string | null;
  is_active: boolean;
}

interface VendorData {
  id: string;
  username: string | null;
  full_name: string | null;
  is_active: boolean;
  client_count: number;
  clients: VendorClient[];
}

export default function AdminPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const [activeSubTab, setActiveSubTab] = useState<'scores' | 'settings' | 'users' | 'seller-requests' | 'vendors'>('scores');
  
  // Data States
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scoresInput, setScoresInput] = useState<{ [matchId: string]: { home: string; away: string } }>({});
  const [sellerRequests, setSellerRequests] = useState<any[]>([]);
  const [vendors, setVendors] = useState<VendorData[]>([]);
  const [vendorSearch, setVendorSearch] = useState('');
  const [expandedVendors, setExpandedVendors] = useState<Set<string>>(new Set());
  const [vendorsLoading, setVendorsLoading] = useState(false);
  
  // Settings Form State
  const [ptsExact, setPtsExact] = useState(5);
  const [ptsWinner, setPtsWinner] = useState(3);
  const [ptsDraw, setPtsDraw] = useState(3);
  const [ptsIncorrect, setPtsIncorrect] = useState(0);
  const [lockHours, setLockHours] = useState(24);
  const [ticketCost, setTicketCost] = useState(200.00);
  const [poolTotal, setPoolTotal] = useState(0);
  
  // Percentiles dynamic states
  const [pctFirst, setPctFirst] = useState(50);
  const [pctSecond, setPctSecond] = useState(25);
  const [pctThird, setPctThird] = useState(5);

  // Customizable Seller Commissions Rates (in %)
  const [commScale1, setCommScale1] = useState(20);
  const [commScale2, setCommScale2] = useState(25);
  const [commScale3, setCommScale3] = useState(30);

  // Status indicators
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // 1. Redirect if not authorized
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (profile && !profile.is_admin) {
        router.push('/');
      }
    }
  }, [user, profile, loading, router]);

  // 2. Fetch all admin data
  const fetchAdminData = async () => {
    try {
      // Fetch matches
      const { data: matchesData, error: matchesError } = await supabase
        .from('qui_matches')
        .select('*')
        .order('match_time', { ascending: true });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // Populate scores inputs with existing scores
      const scoreInputsMap: typeof scoresInput = {};
      matchesData?.forEach((m) => {
        scoreInputsMap[m.id] = {
          home: m.home_score !== null ? String(m.home_score) : '',
          away: m.away_score !== null ? String(m.away_score) : '',
        };
      });
      setScoresInput(scoreInputsMap);

      // Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('qui_system_settings')
        .select('*')
        .eq('id', 'points_config')
        .single();

      if (!settingsError && settingsData) {
        setPtsExact(settingsData.points_exact_score);
        setPtsWinner(settingsData.points_correct_winner);
        setPtsDraw(settingsData.points_correct_draw);
        setPtsIncorrect(settingsData.points_incorrect);
        setLockHours(settingsData.lock_hours_before);
        setTicketCost(Number(settingsData.ticket_cost));
        setPoolTotal(Number(settingsData.pool_accumulated));
        setPctFirst(settingsData.pct_first_place ?? 50);
        setPctSecond(settingsData.pct_second_place ?? 25);
        setPctThird(settingsData.pct_third_place ?? 5);
        setCommScale1(Number(settingsData.seller_commission_1_10 ?? 0.20) * 100);
        setCommScale2(Number(settingsData.seller_commission_11_25 ?? 0.25) * 100);
        setCommScale3(Number(settingsData.seller_commission_26_up ?? 0.30) * 100);
      }

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('qui_profiles')
        .select('id, username, full_name, is_active, points, created_at')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setPlayers(profilesData || []);
    } catch (err: any) {
      console.error('Error fetching admin details:', err.message);
      showToast('Error al cargar datos administrativos.');
    }
  };

  const fetchSellerRequests = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/admin/seller-requests?adminId=${user.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSellerRequests(data.requests || []);
        }
      }
    } catch (e) {
      console.error('Error fetching seller requests:', e);
    }
  };

  const handleSellerRequestAction = async (targetUserId: string, action: 'approve' | 'reject') => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/seller-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user?.id,
          targetUserId,
          action
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`✅ Solicitud ${action === 'approve' ? 'aprobada' : 'rechazada'} con éxito.`);
        await fetchSellerRequests();
        await fetchAdminData();
      } else {
        throw new Error(data.error || 'Error al procesar la solicitud.');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const fetchVendors = async () => {
    setVendorsLoading(true);
    try {
      const res = await fetch(`/api/admin/vendors`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setVendors(data.vendors || []);
        }
      }
    } catch (e) {
      console.error('Error fetching vendors:', e);
    } finally {
      setVendorsLoading(false);
    }
  };

  const toggleVendorExpand = (vendorId: string) => {
    setExpandedVendors(prev => {
      const next = new Set(prev);
      if (next.has(vendorId)) {
        next.delete(vendorId);
      } else {
        next.add(vendorId);
      }
      return next;
    });
  };

  const handleSeedVendorClients = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/seed-vendor-clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminId: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al generar datos de prueba.');
      showToast(`✨ ${data.message}`);
      await fetchVendors();
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.is_admin) {
      fetchAdminData();
      fetchSellerRequests();
      fetchVendors();
    }
  }, [profile]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 4000);
  };

  // Submit official scores to backend recalculation API
  const handleSaveScore = async (matchId: string) => {
    const input = scoresInput[matchId];
    if (!input || input.home === '' || input.away === '') {
      showToast('⚠️ Por favor captura ambos marcadores.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          homeScore: parseInt(input.home),
          awayScore: parseInt(input.away),
          adminId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar resultado.');

      showToast('✅ ¡Marcador guardado e inscripciones recalculadas al instante!');
      await fetchAdminData(); // Refresh UI lists
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit all modified and completed scores in bulk
  const handleSaveAllScores = async () => {
    const bulkMatches: { matchId: string; homeScore: number; awayScore: number }[] = [];
    
    matches.forEach(match => {
      if (match.status === 'finished') return; // Cannot edit finished matches!

      const input = scoresInput[match.id];
      if (input && input.home !== '' && input.away !== '') {
        bulkMatches.push({
          matchId: match.id,
          homeScore: parseInt(input.home),
          awayScore: parseInt(input.away)
        });
      }
    });

    if (bulkMatches.length === 0) {
      showToast('⚠️ No hay marcadores nuevos o completos para guardar.');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matches: bulkMatches,
          adminId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar resultados en masa.');

      await fetchAdminData(); // Refresh UI lists first
      showToast(`✅ ¡${bulkMatches.length} marcadores guardados e inscripciones recalculadas al instante!`);
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle individual match lock manually
  const handleToggleMatchLock = async (matchId: string, isLocked: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/match-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          isLocked,
          adminId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar bloqueo.');

      showToast(`🔒 Partido ${isLocked ? 'bloqueado' : 'desbloqueado'} con éxito.`);
      await fetchAdminData(); // Refresh UI lists
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Update dynamic settings parameters
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user?.id,
          points_exact_score: ptsExact,
          points_correct_winner: ptsWinner,
          points_correct_draw: ptsDraw,
          points_incorrect: ptsIncorrect,
          lock_hours_before: lockHours,
          ticket_cost: ticketCost,
          pool_accumulated: poolTotal,
          pct_first_place: pctFirst,
          pct_second_place: pctSecond,
          pct_third_place: pctThird,
          seller_commission_1_10: commScale1 / 100,
          seller_commission_11_25: commScale2 / 100,
          seller_commission_26_up: commScale3 / 100,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar ajustes.');

      showToast('✅ ¡Ajustes de la quiniela actualizados con éxito!');
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Manual payment activation (useful for testing and offline players)
  const handleManualActivate = async (playerId: string) => {
    setActionLoading(true);
    try {
      // 1. Update user payment state
      const { error: profileError } = await supabase
        .from('qui_profiles')
        .update({ is_active: true })
        .eq('id', playerId);

      if (profileError) throw profileError;

      // 2. Insert payments receipt in qui_payments
      const receiptId = `manual_receipt_${Date.now()}`;
      await supabase
        .from('qui_payments')
        .insert({
          id: receiptId,
          user_id: playerId,
          amount: ticketCost,
          status: 'paid'
        });

      // 3. Add ticket cost to accumulated pool settings
      const newPool = poolTotal + ticketCost;
      const { error: configError } = await supabase
        .from('qui_system_settings')
        .update({ pool_accumulated: newPool })
        .eq('id', 'points_config');

      if (configError) throw configError;

      showToast('🥇 ¡Usuario activado manualmente y bolsa aumentada!');
      setPoolTotal(newPool); // Sync local state
      await fetchAdminData(); // Refresh UI
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error de activación: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Reset Quiniela Standings (Danger zone!)
  const handleResetQuiniela = async () => {
    if (!window.confirm('⚠️ ¿ESTÁS COMPLETAMENTE SEGURO? Esto borrará todas las predicciones de los usuarios y restablecerá sus puntajes a 0. Esta acción no se puede deshacer.')) {
      return;
    }
    
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/reset-quiniela', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al reiniciar la quiniela.');

      showToast('🔄 ¡Quiniela y marcadores reiniciados completamente a 0!');
      await fetchAdminData();
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error al reiniciar: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSeedTestUsers = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/seed-test-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user.id
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al inyectar participantes de prueba.');

      showToast(`✨ ${data.message}`);
      await fetchAdminData(); // Refresh list to show the new players
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Panel de Seguridad...
        </div>
      </div>
    );
  }

  // Deny layout if not admin
  if (profile && !profile.is_admin) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: '40px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
        <ShieldAlert size={48} style={{ color: '#ef4444', marginBottom: '12px' }} />
        <h3>Acceso Restringido</h3>
        <p style={{ color: 'var(--text-secondary)' }}>No cuentas con permisos de administrador para visualizar esta consola.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Global Loading Overlay */}
      {actionLoading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(3, 7, 18, 0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}>
          <div className="glass-panel" style={{
            padding: '30px 40px',
            textAlign: 'center',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            boxShadow: '0 0 40px rgba(245, 158, 11, 0.15)',
            maxWidth: '400px',
            width: '90%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            {/* Spinning Loader */}
            <div style={{
              width: '50px',
              height: '50px',
              border: '4px solid rgba(245, 158, 11, 0.1)',
              borderTop: '4px solid var(--accent-gold)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
            
            <div>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Procesando Resultados
              </h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                Guardando marcadores oficiales, notificando a los participantes y recalculando la tabla general. Por favor, espera...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic Action Toast */}
      {toastMessage && (
        <div className="toast-msg" style={{ borderColor: 'var(--accent-gold)', boxShadow: '0 0 20px rgba(245, 158, 11, 0.2)' }}>
          <ShieldCheck size={18} style={{ color: 'var(--accent-gold)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={28} style={{ color: 'var(--accent-gold)' }} /> Consola de Administración
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Supervisa participantes, registra aportaciones voluntarias de mantenimiento, edita matriz de puntos y valida resultados oficiales.
          </p>
        </div>

        {/* Sub Navigation */}
        <div className="tab-container">
          <button
            className={`tab-btn ${activeSubTab === 'scores' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('scores')}
          >
            <TableProperties size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Resultados
          </button>
          <button
            className={`tab-btn ${activeSubTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('settings')}
          >
            <Settings size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Configuración
          </button>
          <button
            className={`tab-btn ${activeSubTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('users')}
          >
            <Users size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Participantes
          </button>
          <button
            className={`tab-btn ${activeSubTab === 'seller-requests' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('seller-requests')}
          >
            <BadgeDollarSign size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Solicitudes Vendedor
          </button>
          <button
            className={`tab-btn ${activeSubTab === 'vendors' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('vendors')}
          >
            <ShieldCheck size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Vendedores
          </button>
        </div>
      </div>

      {/* Tab Panel 1: Official Scores Entry */}
      {activeSubTab === 'scores' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            Ingresar Resultados Oficiales de Partidos
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
            Ingresa los marcadores oficiales de los partidos pendientes abajo y presiona el botón global de **Guardar Todos y Recalcular Tabla** para procesar todo en un solo clic. Una vez que se guarde el resultado de un partido, este se considerará finalizado y no se podrá volver a editar.
          </p>

          {/* Bulk Action Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(16, 185, 129, 0.04)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '24px',
            gap: '16px',
            flexWrap: 'wrap'
          }}>
            <div style={{ flex: 1, minWidth: '260px' }}>
              <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 800, color: 'var(--accent-neon-green)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Guardado y Recálculo Masivo
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Captura marcadores en varias tarjetas abajo y presiona este botón para guardar todo y actualizar la tabla general en un solo paso optimizado.
              </p>
            </div>
            <button
              onClick={handleSaveAllScores}
              className="btn btn-gold"
              style={{
                padding: '10px 20px',
                fontSize: '0.82rem',
                fontWeight: 800,
                boxShadow: '0 0 15px rgba(245, 158, 11, 0.35)',
                background: 'linear-gradient(135deg, var(--accent-gold) 0%, #d97706 100%)',
                borderColor: 'rgba(245, 158, 11, 0.5)',
                color: '#030712',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              disabled={actionLoading}
            >
              <Save size={14} />
              <span>Guardar Todos y Recalcular Tabla</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
            {matches.map((match) => {
              const input = scoresInput[match.id] || { home: '', away: '' };

              return (
                <div key={match.id} className="glass-card" style={{
                  border: match.status === 'finished' ? '1px solid rgba(16, 185, 129, 0.25)' : undefined
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span className="match-group-tag">{match.group_name}</span>
                    <span className={`badge ${match.status === 'finished' ? 'badge-finished' : 'badge-pending'}`}>
                      {match.status === 'finished' ? 'Finalizado' : 'Pendiente'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifySelf: 'stretch', justifyContent: 'space-between', gap: '8px' }}>
                    <span className="sports-font" style={{ fontWeight: 800, flex: 1, textAlign: 'right', fontSize: '0.95rem' }}>{match.home_team}</span>
                    
                    {match.status === 'finished' ? (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        gap: '12px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                        padding: '6px 16px',
                        borderRadius: '12px',
                        minWidth: '98px',
                        height: '46px'
                      }}>
                        <span style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--accent-neon-green)' }}>
                          {match.home_score}
                        </span>
                        <span style={{ fontWeight: 800, color: 'rgba(16, 185, 129, 0.6)' }}>-</span>
                        <span style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--accent-neon-green)' }}>
                          {match.away_score}
                        </span>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="score-input"
                          maxLength={2}
                          value={input.home}
                          onChange={(e) => setScoresInput(prev => {
                            const current = prev[match.id] || { home: '', away: '' };
                            const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 2);
                            return {
                              ...prev,
                              [match.id]: { ...current, home: cleanVal }
                            };
                          })}
                          style={{ width: '46px', height: '46px', fontSize: '1.2rem', textAlign: 'center' }}
                        />
                        <span style={{ fontWeight: 800, color: 'var(--text-muted)' }}>-</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="score-input"
                          maxLength={2}
                          value={input.away}
                          onChange={(e) => setScoresInput(prev => {
                            const current = prev[match.id] || { home: '', away: '' };
                            const cleanVal = e.target.value.replace(/\D/g, '').slice(0, 2);
                            return {
                              ...prev,
                              [match.id]: { ...current, away: cleanVal }
                            };
                          })}
                          style={{ width: '46px', height: '46px', fontSize: '1.2rem', textAlign: 'center' }}
                        />
                      </div>
                    )}

                    <span className="sports-font" style={{ fontWeight: 800, flex: 1, textAlign: 'left', fontSize: '0.95rem' }}>{match.away_team}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab Panel 2: Dynamic configurations and points settings */}
      {activeSubTab === 'settings' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          
          {/* Main settings form */}
          <form onSubmit={handleSaveSettings} className="glass-panel" style={{ flex: 2 }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              Configuración y Puntuaciones
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Marcador Exacto</label>
                <input
                  type="number"
                  className="form-input"
                  value={ptsExact}
                  onChange={(e) => setPtsExact(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Resultado Correcto</label>
                <input
                  type="number"
                  className="form-input"
                  value={ptsWinner}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setPtsWinner(val);
                    setPtsDraw(val);
                  }}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Incorrecto / Vacío</label>
                <input
                  type="number"
                  className="form-input"
                  value={ptsIncorrect}
                  onChange={(e) => setPtsIncorrect(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cierre previo (Horas)</label>
                <input
                  type="number"
                  className="form-input"
                  value={lockHours}
                  onChange={(e) => setLockHours(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Cooperación Voluntaria (Frijolitos)</label>
                <input
                  type="number"
                  className="form-input"
                  value={ticketCost}
                  onChange={(e) => setTicketCost(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">% Recompensa 1er Lugar</label>
                <input
                  type="number"
                  className="form-input"
                  value={pctFirst}
                  onChange={(e) => setPctFirst(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">% Recompensa 2do Lugar</label>
                <input
                  type="number"
                  className="form-input"
                  value={pctSecond}
                  onChange={(e) => setPctSecond(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">% Recompensa 3er Lugar</label>
                <input
                  type="number"
                  className="form-input"
                  value={pctThird}
                  onChange={(e) => setPctThird(parseInt(e.target.value) || 0)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">% Comisión Vendedor (1-10 boletos)</label>
                <input
                  type="number"
                  className="form-input"
                  value={commScale1}
                  onChange={(e) => setCommScale1(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">% Comisión Vendedor (11-25 boletos)</label>
                <input
                  type="number"
                  className="form-input"
                  value={commScale2}
                  onChange={(e) => setCommScale2(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">% Comisión Vendedor (26+ boletos)</label>
                <input
                  type="number"
                  className="form-input"
                  value={commScale3}
                  onChange={(e) => setCommScale3(parseInt(e.target.value) || 0)}
                  min={0}
                  max={100}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bolsa de Recompensa (Frijolitos)</label>
                <input
                  type="number"
                  className="form-input"
                  value={poolTotal}
                  onChange={(e) => setPoolTotal(parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-gold"
              style={{ width: '100%', padding: '12px', marginTop: '20px' }}
              disabled={actionLoading}
            >
              <Save size={16} />
              <span>Guardar Configuración</span>
            </button>
          </form>

          {/* Danger zone actions */}
          <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '16px', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f87171', borderBottom: '1px solid rgba(239,68,68,0.2)', paddingBottom: '10px' }}>
              Zona de Peligro
            </h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Estas acciones alteran de forma definitiva el funcionamiento y la base de datos de la Quiniela. Utiliza con extrema precaución.
            </p>

            <button
              onClick={handleResetQuiniela}
              className="btn btn-danger"
              style={{ width: '100%', padding: '12px', display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}
              disabled={actionLoading}
            >
              <RotateCcw size={16} />
              <span>Reiniciar Quiniela Completa</span>
            </button>
            
            <div style={{ marginTop: '10px', padding: '12px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.15)', fontSize: '0.78rem', color: '#fca5a5' }}>
              <strong>Advertencia:</strong> El reinicio eliminará todas las predicciones de los participantes y restablecerá sus puntajes a 0. Los partidos se colocarán como pendientes. El estado de activación y pagos de usuarios NO se eliminarán.
            </div>
          </div>
        </div>
      )}

      {/* Tab Panel 3: Users list and manual activations */}
      {activeSubTab === 'users' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            Panel de Control de Participantes
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Lista completa de jugadores registrados en el sistema. Puedes activar manualmente sus aportaciones de mantenimiento en caso de soporte directo offline, o monitorizar sus puntuaciones.
          </p>

          {/* Test Seeder Panel */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)'
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Entorno de Pruebas y Simulación
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Genera instantáneamente 10 perfiles simulados con predicciones aleatorias inteligentes para llenar el Leaderboard y validar la tabla de posiciones.
              </p>
            </div>
            <button
              onClick={handleSeedTestUsers}
              className="btn btn-gold"
              style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 800, boxShadow: '0 0 15px rgba(245, 158, 11, 0.3)' }}
              disabled={actionLoading}
            >
              <Sparkles size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              <span>Generar 10 Participantes de Prueba</span>
            </button>
          </div>

          <div className="ranking-table-wrapper">
            <table className="ranking-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th style={{ textAlign: 'center' }}>Registrado</th>
                  <th style={{ textAlign: 'center' }}>Puntos</th>
                  <th style={{ textAlign: 'center' }}>Estado Aportación</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {players.map((player) => (
                  <tr key={player.id} className="ranking-row">
                    <td>
                      <div className="rank-player-cell">
                        <div className="player-avatar">
                          {(player.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <div className="player-name-container">
                          <span className="player-name">{player.full_name || 'Participante'}</span>
                          <span className="player-badge">@{player.username || 'user'}</span>
                        </div>
                      </div>
                    </td>
                    
                    <td style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(player.created_at).toLocaleDateString('es-MX')}
                    </td>
                    
                    <td className="points-cell" style={{ textAlign: 'center', fontWeight: 800 }}>
                      {player.points} pts
                    </td>
                    
                    <td style={{ textAlign: 'center' }}>
                      {player.is_active ? (
                        <span className="badge badge-paid">Aportación Activa</span>
                      ) : (
                        <span className="badge badge-unpaid">Pendiente</span>
                      )}
                    </td>
                    
                    <td style={{ textAlign: 'center' }}>
                      {!player.is_active && (
                        <button
                          onClick={() => handleManualActivate(player.id)}
                          className="btn btn-gold"
                          style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          disabled={actionLoading}
                        >
                          <BadgeDollarSign size={12} />
                          <span>Registrar Donativo</span>
                        </button>
                      )}
                      
                      {player.is_active && (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          Cooperador Activo
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab Panel 4: Seller Requests review panel */}
      {activeSubTab === 'seller-requests' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BadgeDollarSign size={20} style={{ color: 'var(--accent-gold)' }} /> Solicitudes de Activación de Vendedor
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Acepta o rechaza las solicitudes de los usuarios que desean convertirse en vendedores activos de la quiniela. Al aceptar, se les asignará el rol de vendedor y podrán ver su panel de referidos.
          </p>

          <div className="ranking-table-wrapper">
            {sellerRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <Users size={40} style={{ opacity: 0.15 }} />
                <span style={{ fontSize: '0.85rem' }}>No hay solicitudes de vendedor pendientes en este momento.</span>
              </div>
            ) : (
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th>Usuario / Nombre</th>
                    <th style={{ textAlign: 'center' }}>Registrado</th>
                    <th style={{ textAlign: 'center' }}>Puntos</th>
                    <th style={{ textAlign: 'center' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sellerRequests.map((req) => (
                    <tr key={req.id} className="ranking-row">
                      <td>
                        <div className="rank-player-cell">
                          <div className="player-avatar">
                            {(req.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <div className="player-name-container">
                            <span className="player-name">{req.full_name || 'Participante'}</span>
                            <span className="player-badge">@{req.username || 'user'}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {new Date(req.created_at).toLocaleDateString('es-MX')}
                      </td>
                      
                      <td style={{ textAlign: 'center', fontWeight: 800 }}>
                        {req.points} pts
                      </td>
                      
                      <td style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleSellerRequestAction(req.id, 'approve')}
                            className="btn btn-primary"
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '0.75rem',
                              background: 'rgba(16, 185, 129, 0.2)',
                              border: '1px solid rgba(16, 185, 129, 0.4)',
                              color: 'var(--accent-neon-green)'
                            }}
                            disabled={actionLoading}
                          >
                            Aceptar
                          </button>
                          <button
                            onClick={() => handleSellerRequestAction(req.id, 'reject')}
                            className="btn btn-danger"
                            style={{ 
                              padding: '6px 12px', 
                              fontSize: '0.75rem',
                              background: 'rgba(239, 68, 68, 0.2)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: 'rgb(248, 113, 113)'
                            }}
                            disabled={actionLoading}
                          >
                            Rechazar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Tab Panel 5: Vendors and their Clients */}
      {activeSubTab === 'vendors' && (
        <div className="glass-panel">
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} style={{ color: '#a78bfa' }} /> Red de Vendedores y Clientes
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Visualiza la lista completa de vendedores activos junto con los clientes que han adquirido cupones a través de ellos. Expande cada vendedor para ver el detalle.
          </p>

          {/* Test Data Seeder */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(30, 41, 59, 0.6) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.25)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} /> Datos de Prueba: Vendedores y Clientes
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Genera 2 vendedores de prueba con 6 clientes asociados para verificar que el panel funciona correctamente.
              </p>
            </div>
            <button
              onClick={handleSeedVendorClients}
              className="btn btn-gold"
              style={{ padding: '10px 20px', fontSize: '0.82rem', fontWeight: 800, boxShadow: '0 0 15px rgba(124, 58, 237, 0.3)', background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)', borderColor: 'rgba(124, 58, 237, 0.5)', color: '#fff' }}
              disabled={actionLoading}
            >
              <Sparkles size={14} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
              <span>Generar Vendedores de Prueba</span>
            </button>
          </div>

          {/* Search Bar */}
          <div style={{
            position: 'relative',
            marginBottom: '24px',
          }}>
            <Search size={16} style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: '#a78bfa',
              pointerEvents: 'none',
            }} />
            <input
              type="text"
              placeholder="Buscar vendedor o cliente por nombre..."
              value={vendorSearch}
              onChange={(e) => setVendorSearch(e.target.value)}
              className="form-input"
              style={{
                paddingLeft: '40px',
                width: '100%',
                background: 'rgba(124, 58, 237, 0.06)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                borderRadius: '12px',
                fontSize: '0.9rem',
                transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.6)';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(124, 58, 237, 0.15)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'rgba(124, 58, 237, 0.25)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Summary Stats */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            marginBottom: '24px',
          }}>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(124, 58, 237, 0.2)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#a78bfa' }}>{vendors.length}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Vendedores Activos</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-neon-green)' }}>
                {vendors.reduce((sum, v) => sum + v.client_count, 0)}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Clientes Totales</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', textAlign: 'center', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--accent-gold)' }}>
                {vendors.length > 0 ? (vendors.reduce((sum, v) => sum + v.client_count, 0) / vendors.length).toFixed(1) : '0'}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Promedio por Vendedor</div>
            </div>
          </div>

          {vendorsLoading ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(124, 58, 237, 0.1)',
                borderTop: '3px solid #a78bfa',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 16px',
              }} />
              Cargando red de vendedores...
            </div>
          ) : vendors.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <Store size={48} style={{ opacity: 0.15 }} />
              <span style={{ fontSize: '0.9rem' }}>No hay vendedores registrados en el sistema aún.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {vendors
                .filter(v => {
                  if (!vendorSearch.trim()) return true;
                  const q = vendorSearch.toLowerCase();
                  const vendorMatch = (v.full_name || '').toLowerCase().includes(q) || (v.username || '').toLowerCase().includes(q);
                  const clientMatch = v.clients.some(c => (c.full_name || '').toLowerCase().includes(q) || (c.username || '').toLowerCase().includes(q));
                  return vendorMatch || clientMatch;
                })
                .map((vendor) => {
                  const isExpanded = expandedVendors.has(vendor.id);
                  return (
                    <div key={vendor.id} style={{
                      background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.06) 0%, rgba(30, 41, 59, 0.5) 100%)',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      boxShadow: isExpanded ? '0 8px 32px rgba(124, 58, 237, 0.12)' : '0 4px 12px rgba(0,0,0,0.15)',
                    }}>
                      {/* Vendor Header */}
                      <div
                        onClick={() => toggleVendorExpand(vendor.id)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          padding: '16px 20px',
                          cursor: 'pointer',
                          gap: '12px',
                          transition: 'background 0.2s ease',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.08)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '12px',
                          background: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 900,
                          fontSize: '1.1rem',
                          color: '#fff',
                          flexShrink: 0,
                          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
                        }}>
                          {(vendor.full_name || vendor.username || 'V')[0].toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            {vendor.full_name || 'Vendedor'}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            @{vendor.username || 'user'}
                          </div>
                        </div>

                        {/* Client Count Badge */}
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: vendor.client_count > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                          border: `1px solid ${vendor.client_count > 0 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(100, 116, 139, 0.2)'}`,
                          padding: '6px 14px',
                          borderRadius: '20px',
                          fontSize: '0.82rem',
                          fontWeight: 700,
                          color: vendor.client_count > 0 ? 'var(--accent-neon-green)' : 'var(--text-muted)',
                        }}>
                          <UserCheck size={14} />
                          {vendor.client_count} {vendor.client_count === 1 ? 'cliente' : 'clientes'}
                        </div>

                        {/* Chevron */}
                        <div style={{ color: '#a78bfa', transition: 'transform 0.3s ease', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                          <ChevronDown size={20} />
                        </div>
                      </div>

                      {/* Expanded Client List */}
                      {isExpanded && (
                        <div style={{
                          borderTop: '1px solid rgba(124, 58, 237, 0.15)',
                          padding: '0',
                          background: 'rgba(0, 0, 0, 0.15)',
                        }}>
                          {vendor.clients.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                              Este vendedor aún no tiene clientes registrados.
                            </div>
                          ) : (
                            <div>
                              {/* Client List Header */}
                              <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 120px 100px',
                                padding: '10px 20px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                color: 'var(--text-muted)',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                              }}>
                                <span>Cliente</span>
                                <span style={{ textAlign: 'center' }}>Estado</span>
                                <span style={{ textAlign: 'center' }}>Pago</span>
                              </div>

                              {/* Client Rows */}
                              {vendor.clients
                                .filter(c => {
                                  if (!vendorSearch.trim()) return true;
                                  const q = vendorSearch.toLowerCase();
                                  return (c.full_name || '').toLowerCase().includes(q) || (c.username || '').toLowerCase().includes(q);
                                })
                                .map((client, idx) => (
                                <div key={client.id} style={{
                                  display: 'grid',
                                  gridTemplateColumns: '1fr 120px 100px',
                                  alignItems: 'center',
                                  padding: '12px 20px',
                                  borderBottom: idx < vendor.clients.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                                  transition: 'background 0.2s ease',
                                }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(124, 58, 237, 0.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  {/* Client Info */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                      width: '32px',
                                      height: '32px',
                                      borderRadius: '8px',
                                      background: client.is_active ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: 700,
                                      fontSize: '0.8rem',
                                      color: client.is_active ? 'var(--accent-neon-green)' : 'var(--text-muted)',
                                      flexShrink: 0,
                                    }}>
                                      {(client.full_name || client.username || 'C')[0].toUpperCase()}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                                        {client.full_name || 'Cliente'}
                                      </div>
                                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        @{client.username || 'user'}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Status */}
                                  <div style={{ textAlign: 'center' }}>
                                    {client.is_active ? (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        color: 'var(--accent-neon-green)',
                                        padding: '3px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        border: '1px solid rgba(16, 185, 129, 0.25)',
                                      }}>
                                        <BadgeCheck size={12} /> Activo
                                      </span>
                                    ) : (
                                      <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#f87171',
                                        padding: '3px 10px',
                                        borderRadius: '12px',
                                        fontSize: '0.72rem',
                                        fontWeight: 600,
                                        border: '1px solid rgba(239, 68, 68, 0.25)',
                                      }}>
                                        <BadgeX size={12} /> Inactivo
                                      </span>
                                    )}
                                  </div>

                                  {/* Payment Badge */}
                                  <div style={{ textAlign: 'center' }}>
                                    <span className={`badge ${client.is_active ? 'badge-paid' : 'badge-unpaid'}`} style={{ fontSize: '0.72rem' }}>
                                      {client.is_active ? 'Pagado' : 'Pendiente'}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
