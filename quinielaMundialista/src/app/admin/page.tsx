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
  role?: string | null;
  seller_request_status?: string | null;
  referred_by?: string | null;
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
  
  const [activeSubTab, setActiveSubTab] = useState<'scores' | 'settings' | 'users'>('scores');
  
  // Data States
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [scoresInput, setScoresInput] = useState<{ [matchId: string]: { home: string; away: string } }>({});
  
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
      }

      // Fetch profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('qui_profiles')
        .select('id, username, full_name, is_active, points, created_at, role, seller_request_status, referred_by')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;
      setPlayers(profilesData || []);
    } catch (err: any) {
      console.error('Error fetching admin details:', err.message);
      showToast('Error al cargar datos administrativos.');
    }
  };

  useEffect(() => {
    if (profile?.is_admin) {
      fetchAdminData();
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

  // Toggle user activation (admin approval/confirmation)
  const handleToggleUserActivation = async (playerId: string, makeActive: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/toggle-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user?.id,
          userId: playerId,
          isActive: makeActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado de activación.');

      showToast(makeActive ? '✅ ¡Registro confirmado y activado con éxito!' : '🚫 ¡Usuario desactivado con éxito!');
      await fetchAdminData(); // Refresh UI
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error al cambiar estado: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle promoter role (admin approval / removal)
  const handleTogglePromoterRole = async (playerId: string, makePromoter: boolean) => {
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/toggle-promotor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminId: user?.id,
          userId: playerId,
          approve: makePromoter,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cambiar estado de promotor.');

      showToast(makePromoter ? '✅ ¡Usuario aprobado como Promotor con éxito!' : '🚫 ¡Rol de Promotor removido con éxito!');
      await fetchAdminData(); // Refresh UI
    } catch (err: any) {
      console.error(err);
      showToast(`❌ Error: ${err.message}`);
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
                  <th style={{ textAlign: 'center' }}>Invitado Por</th>
                  <th style={{ textAlign: 'center' }}>Registrado</th>
                  <th style={{ textAlign: 'center' }}>Puntos</th>
                  <th style={{ textAlign: 'center' }}>Estado Cuenta</th>
                  <th style={{ textAlign: 'center' }}>Rol / Promotor</th>
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
                    
                    <td style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                      {player.referred_by ? (
                        <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>
                          @{players.find(p => p.id === player.referred_by)?.username || 'promotor'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Directo</span>
                      )}
                    </td>
                    
                    <td style={{ textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                      {new Date(player.created_at).toLocaleDateString('es-MX')}
                    </td>
                    
                    <td className="points-cell" style={{ textAlign: 'center', fontWeight: 800 }}>
                      {player.points} pts
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: player.is_active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        border: player.is_active ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                        color: player.is_active ? 'var(--accent-neon-green)' : 'var(--accent-gold)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                      }}>
                        {player.is_active ? 'Confirmado' : 'Pendiente'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: player.role === 'promotor' 
                          ? 'rgba(139, 92, 246, 0.12)' 
                          : player.seller_request_status === 'pending'
                            ? 'rgba(245, 158, 11, 0.12)'
                            : 'rgba(255, 255, 255, 0.04)',
                        border: player.role === 'promotor'
                          ? '1px solid rgba(139, 92, 246, 0.3)'
                          : player.seller_request_status === 'pending'
                            ? '1px solid rgba(245, 158, 11, 0.3)'
                            : '1px solid rgba(255, 255, 255, 0.1)',
                        color: player.role === 'promotor'
                          ? '#a78bfa'
                          : player.seller_request_status === 'pending'
                            ? 'var(--accent-gold)'
                            : 'var(--text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.02em'
                      }}>
                        {player.role === 'promotor' 
                          ? 'Promotor 🚀' 
                          : player.seller_request_status === 'pending'
                            ? 'Pendiente Promotor ⏳'
                            : 'Participante'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {player.is_active ? (
                          <button
                            onClick={() => handleToggleUserActivation(player.id, false)}
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              borderColor: 'rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Desactivar cuenta"
                          >
                            <Ban size={12} />
                            <span>Desactivar</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleUserActivation(player.id, true)}
                            className="btn"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.72rem',
                              fontWeight: 900,
                              background: 'var(--accent-neon-green)',
                              borderColor: 'var(--accent-neon-green)',
                              color: '#030712',
                              boxShadow: '0 0 8px rgba(16, 185, 129, 0.2)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Confirmar cuenta"
                          >
                            <UserCheck size={12} />
                            <span>Confirmar</span>
                          </button>
                        )}

                        {player.role === 'promotor' ? (
                          <button
                            onClick={() => handleTogglePromoterRole(player.id, false)}
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              borderColor: 'rgba(239, 68, 68, 0.25)',
                              color: '#f87171',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Quitar rol de promotor"
                          >
                            <BadgeX size={12} />
                            <span>Quitar Promotor</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleTogglePromoterRole(player.id, true)}
                            className="btn btn-secondary"
                            style={{
                              padding: '6px 12px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              borderColor: player.seller_request_status === 'pending' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(139, 92, 246, 0.3)',
                              color: player.seller_request_status === 'pending' ? 'var(--accent-gold)' : '#c084fc',
                              background: player.seller_request_status === 'pending' ? 'rgba(245, 158, 11, 0.05)' : 'rgba(139, 92, 246, 0.03)',
                              boxShadow: player.seller_request_status === 'pending' ? '0 0 10px rgba(245, 158, 11, 0.15)' : 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title={player.seller_request_status === 'pending' ? "Aprobar solicitud de promotor" : "Hacer promotor"}
                          >
                            <UserCheck size={12} />
                            <span>{player.seller_request_status === 'pending' ? 'Aprobar Promotor' : 'Hacer Promotor'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
