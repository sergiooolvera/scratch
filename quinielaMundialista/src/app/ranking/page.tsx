'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { Trophy, Search, Award, TrendingUp, DollarSign, Sparkles, AlertCircle, CircleCheck, Calendar, Lock, Unlock, X, Check, Eye } from 'lucide-react';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  points: number;
  exact_scores: number;
  goal_difference: number;
}

// Helpers for Easter Eggs and Mexican Pop Culture References
const getExactScoreBadgeText = (seedString: string) => {
  let hash = 0;
  for (let i = 0; i < seedString.length; i++) {
    hash = seedString.charCodeAt(i) + ((hash << 5) - hash);
  }
  const choice = Math.abs(hash) % 3;
  if (choice === 0) return '🎯 ¡Tómala Barbón! (+5 pts) 🔥';
  if (choice === 1) return '🎯 ¡Te la mamaste! (+5 pts) 🧠';
  return '🎯 ¡Ahhh perreeeee!!! (+5 pts) 🐕🔥';
};

const getEpicBlunderMsg = (match: any, pred: any) => {
  if (!pred || match.status !== 'finished') return '';
  const homePred = Number(pred.home_prediction);
  const awayPred = Number(pred.away_prediction);
  const homeReal = Number(match.home_score);
  const awayReal = Number(match.away_score);
  
  const predictedHomeMargin = homePred - awayPred;
  const realHomeMargin = homeReal - awayReal;
  
  const isBlunder = (predictedHomeMargin >= 2 && realHomeMargin <= -1) || 
                     (predictedHomeMargin <= -2 && realHomeMargin >= 1);
                     
  if (isBlunder) {
    const choice = match.id.charCodeAt(0) % 2;
    return choice === 0 
      ? 'De qué te vas a disfrazaaaaaaaaaaar 🤡' 
      : 'Mayonesa McCormick... digo, Hellmann\'s! 🤦‍♂️';
  }
  return '';
};


export default function RankingPage() {
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [poolTotal, setPoolTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Dynamic percentages states
  const [pctFirst, setPctFirst] = useState(50);
  const [pctSecond, setPctSecond] = useState(25);
  const [pctThird, setPctThird] = useState(5);

  // Visor de pronósticos states
  const [selectedPlayer, setSelectedPlayer] = useState<Profile | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<{ [matchId: string]: any }>({});
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [lockHours, setLockHours] = useState(24);
  const { user: authUser, profile: authProfile } = useAuth();

  // Fetch leaderboard standings and system settings
  const fetchRankingData = async () => {
    setLoading(true);
    // Safety fallback timer to prevent permanent loading screens (e.g. tab sleep)
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 2500);

    try {
      // 1. Fetch profiles ordered by points DESC, exact_scores DESC, goal_difference ASC
      const { data: profilesData, error: profilesError } = await supabase
        .from('qui_profiles')
        .select('id, username, full_name, avatar_url, is_active, points, exact_scores, goal_difference')
        .order('points', { ascending: false })
        .order('exact_scores', { ascending: false })
        .order('goal_difference', { ascending: true });

      if (profilesError) throw profilesError;
      setLeaderboard(profilesData || []);

      // 2. Fetch accumulated pool size and percentages from system settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('qui_system_settings')
        .select('pool_accumulated, pct_first_place, pct_second_place, pct_third_place, lock_hours_before')
        .eq('id', 'points_config')
        .single();

      if (settingsError) throw settingsError;
      setPoolTotal(Number(settingsData?.pool_accumulated) || 0);
      setPctFirst(Number(settingsData?.pct_first_place) ?? 50);
      setPctSecond(Number(settingsData?.pct_second_place) ?? 25);
      setPctThird(Number(settingsData?.pct_third_place) ?? 5);
      setLockHours(Number(settingsData?.lock_hours_before) || 24);
    } catch (err: any) {
      console.error('Error fetching ranking data:', err.message);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
  };

  const fetchPlayerPredictions = async (playerId: string) => {
    setLoadingPredictions(true);
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from('qui_matches')
        .select('*')
        .order('match_time', { ascending: true });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      const { data: predsData, error: predsError } = await supabase
        .from('qui_predictions')
        .select('*')
        .eq('user_id', playerId);

      if (predsError) throw predsError;

      const predsMap: { [matchId: string]: any } = {};
      predsData?.forEach(p => {
        predsMap[p.match_id] = p;
      });
      setPredictions(predsMap);
    } catch (err: any) {
      console.error('Error fetching player predictions:', err.message);
    } finally {
      setLoadingPredictions(false);
    }
  };

  useEffect(() => {
    if (selectedPlayer) {
      fetchPlayerPredictions(selectedPlayer.id);
    } else {
      setPredictions({});
      setMatches([]);
    }
  }, [selectedPlayer]);

  const isPredictionVisible = (match: any) => {
    if (authProfile?.is_admin) {
      return true;
    }
    if (authUser?.id === selectedPlayer?.id) {
      return true;
    }
    if (match.status === 'live' || match.status === 'finished' || match.is_locked) {
      return true;
    }
    const currentTime = Date.now();
    const matchTime = new Date(match.match_time).getTime();
    const lockInterval = lockHours * 60 * 60 * 1000;
    return (matchTime - currentTime) < lockInterval;
  };

  useEffect(() => {
    fetchRankingData();

    // Listen to changes in profiles table to update rankings dynamically (Realtime!)
    const channel = supabase
      .channel('qui_profiles_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'qui_profiles' }, () => {
        fetchRankingData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Filter leaderboard based on search query
  const filteredLeaderboard = leaderboard.filter(player => {
    const term = searchQuery.toLowerCase();
    return (
      (player.full_name || '').toLowerCase().includes(term) ||
      (player.username || '').toLowerCase().includes(term)
    );
  });

  // Limit to top 50 unless there is an active search query
  const displayedLeaderboard = searchQuery.trim() === ''
    ? filteredLeaderboard.slice(0, 50)
    : filteredLeaderboard;


  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(val);
  };

  if (loading && leaderboard.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Tabla de Clasificación...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Tabla General de Posiciones</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
          Clasificación oficial de la Quiniela Mundialista calculada en tiempo real. ¡Compite de forma amistosa!
        </p>
      </div>

      {/* Premium Recreative Rewards Panel */}
      <div className="glass-panel prize-banner" style={{ marginBottom: '32px', padding: '24px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(30, 41, 59, 0.4) 100%)', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> Bolsa de Recompensa Recreativa
            </span>
            <h3 className="sports-font" style={{ fontSize: '2.2rem', fontWeight: 900, color: 'var(--accent-gold)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{poolTotal.toLocaleString()} Frijolitos</span>
              <span style={{ fontSize: '1.6rem' }}>🫘</span>
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Puntos de entretenimiento distribuidos de forma lúdica y amistosa entre los tres mejores puntuaciones al finalizar el torneo.
            </p>
          </div>
          
          {/* Dynamic Rewards Distribution Grid */}
          <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '12px' }}>
              Distribución Automática de Frijolitos 🫘
            </span>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              {/* 1st Place Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(0, 0, 0, 0.2) 100%)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(245, 158, 11, 0.25)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-gold)', display: 'block' }}>🥇 1er Lugar</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, display: 'block', margin: '4px 0', color: '#ffffff' }}>{pctFirst}%</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{Math.floor(poolTotal * pctFirst / 100).toLocaleString()} 🫘</span>
              </div>
              
              {/* 2nd Place Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.15)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>🥈 2do Lugar</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, display: 'block', margin: '4px 0', color: '#ffffff' }}>{pctSecond}%</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{Math.floor(poolTotal * pctSecond / 100).toLocaleString()} 🫘</span>
              </div>
              
              {/* 3rd Place Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.12) 0%, rgba(0, 0, 0, 0.2) 100%)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(205, 127, 50, 0.2)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#cd7f32', display: 'block' }}>🥉 3er Lugar</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, display: 'block', margin: '4px 0', color: '#ffffff' }}>{pctThird}%</span>
                {pctThird === 0 ? (
                  <span 
                    style={{ 
                      fontSize: '0.78rem', 
                      color: 'var(--text-secondary)', 
                      fontWeight: 800, 
                      fontStyle: 'italic', 
                      display: 'block', 
                      marginTop: '6px',
                      textShadow: '0 0 8px rgba(255,255,255,0.1)',
                      opacity: 0.8
                    }}
                  >
                    "Tú simplemente te vas... jeje" 🤫🚪
                  </span>
                ) : (
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{Math.floor(poolTotal * pctThird / 100).toLocaleString()} 🫘</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Standings Filter & Table */}
      <div className="glass-panel" style={{ padding: '20px' }}>
        {/* Search Bar */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar participante por nombre o @usuario..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingLeft: '44px', background: 'rgba(0,0,0,0.25)' }}
          />
        </div>

        {/* Dynamic Context Label */}
        <div style={{ 
          fontSize: '0.8rem', 
          color: 'var(--text-secondary)', 
          marginBottom: '16px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px'
        }}>
          {searchQuery.trim() === '' ? (
            <>
              <span>Mostrando los <strong>Top 50</strong> mejores clasificados 🏆</span>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Puedes buscar a cualquier participante del torneo usando el buscador</span>
            </>
          ) : (
            <span>Se encontraron <strong>{displayedLeaderboard.length}</strong> resultados en la búsqueda 🔍</span>
          )}
        </div>

        {/* Table representation */}
        <div className="ranking-table-wrapper">
          <table className="ranking-table">
            <thead>
              <tr>
                <th style={{ width: '70px', textAlign: 'center' }}>Pos</th>
                <th>Jugador</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Puntos</th>
                <th style={{ width: '180px', textAlign: 'center', whiteSpace: 'nowrap' }}>Marcadores Exactos</th>
                <th style={{ width: '140px', textAlign: 'center' }}>
                  <div className="custom-tooltip-container" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center', width: '100%' }}>
                    <span style={{ borderBottom: '1px dashed rgba(255,255,255,0.3)', cursor: 'help', whiteSpace: 'nowrap' }}>Dif. Goles</span>
                    <div className="custom-tooltip-text">
                      <strong>Diferencia de Goles:</strong> Diferencia absoluta (siempre positiva o cero) entre la suma de goles de tus pronósticos y la suma de goles reales (solo de los partidos ya finalizados).<br/><br/>
                      <em>Ejemplo (solo partidos finalizados):</em><br/>
                      • Goles pronosticados: 7<br/>
                      • Goles reales: 10<br/>
                      • Diferencia: | 7 - 10 | = <strong>3</strong>
                    </div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayedLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No se encontraron participantes.
                  </td>
                </tr>
              ) : (
                displayedLeaderboard.map((player, index) => {
                  const realRank = leaderboard.findIndex(p => p.id === player.id) + 1;
                  return (
                    <tr 
                      key={player.id} 
                      className="ranking-row" 
                      onClick={() => setSelectedPlayer(player)}
                      style={{
                        cursor: 'pointer'
                      }}
                      title="Haz clic para ver los pronósticos de este jugador"
                    >
                      {/* Rank Position */}
                      <td className="rank-number-cell" style={{ textAlign: 'center', verticalAlign: 'middle', fontWeight: realRank === 69 ? 900 : undefined }}>
                        {realRank === 1 ? '🥇' : realRank === 2 ? '🥈' : realRank === 3 ? '🥉' : realRank === 69 ? '69 😈' : realRank}
                      </td>

                      {/* Player Info */}
                      <td>
                        <div className="rank-player-cell">
                          <div className="player-avatar">
                            {(player.full_name || 'U')[0].toUpperCase()}
                          </div>
                          <div className="player-name-container">
                            <span className="player-name">
                              {player.full_name || 'Participante'}
                            </span>
                            <span className="player-badge">
                              @{player.username || 'user'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Score Points */}
                      <td className="points-cell" style={{ textAlign: 'center', fontWeight: 800, verticalAlign: 'middle' }}>
                        {player.points} pts
                      </td>

                      {/* Tie-breaker 1: Exact matches */}
                      <td style={{ textAlign: 'center', fontWeight: 600, color: 'var(--accent-gold)', verticalAlign: 'middle' }}>
                        🎯 {player.exact_scores}
                      </td>

                      {/* Tie-breaker 2: Goals absolute diff error */}
                      <td style={{ textAlign: 'center', color: 'var(--text-secondary)', verticalAlign: 'middle' }}>
                        ⚽ {player.goal_difference}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Tie-breakers legend helper */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          <AlertCircle size={16} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '1px' }} />
          <p style={{ margin: 0 }}>
            <strong>Criterio de Desempate General:</strong> En caso de empate en puntos, las posiciones se definen por: 1) Mayor cantidad de <strong>Marcadores Exactos</strong> (🎯 acertados), 2) <strong>Diferencia de Goles</strong> (⚽ valor absoluto de la diferencia entre tus goles pronosticados y los goles reales, considerando únicamente los partidos ya finalizados). Puedes pasar el cursor sobre la columna o tarjeta para ver un ejemplo interactivo.
          </p>
        </div>
      </div>

      {/* Modal Visor de Pronósticos */}
      {selectedPlayer && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(3, 7, 18, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1100,
          padding: '16px',
          animation: 'slide-up-fade 0.3s ease-out'
        }}
        onClick={() => setSelectedPlayer(null)}
        >
          <div 
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(16, 185, 129, 0.05)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de Cerrar */}
            <button 
              onClick={() => setSelectedPlayer(null)}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'var(--transition-smooth)'
              }}
              className="btn-close-hover"
              title="Cerrar modal"
            >
              <X size={18} />
            </button>

            {/* Header del Modal */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid var(--border-glass)' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--accent-neon-green)',
                fontWeight: 800,
                fontSize: '1.4rem',
                color: 'var(--accent-neon-green)'
              }}>
                {(selectedPlayer.full_name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {selectedPlayer.full_name || 'Participante'}
                </h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  @{selectedPlayer.username || 'usuario'} • Pronósticos de la Quiniela
                </span>
              </div>
            </div>

            {/* Mini Tarjetas de Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Puntos Totales</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-neon-green)' }}>{selectedPlayer.points} pts</span>
              </div>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-glass)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Marcadores Exactos</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-gold)' }}>🎯 {selectedPlayer.exact_scores}</span>
              </div>
              <div 
                className="custom-tooltip-container" 
                style={{ 
                  background: 'rgba(255, 255, 255, 0.03)', 
                  padding: '10px', 
                  borderRadius: '8px', 
                  border: '1px solid var(--border-glass)', 
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'help'
                }}
              >
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Dif. de Goles</span>
                <span style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--accent-blue)' }}>⚽ {selectedPlayer.goal_difference}</span>
                <div className="custom-tooltip-text" style={{ bottom: '115%', width: '260px' }}>
                  <strong>Diferencia de Goles:</strong> Diferencia absoluta (siempre positiva o cero) entre la suma de goles de tus pronósticos y la suma de goles reales (solo de los partidos ya finalizados).<br/><br/>
                  <em>Ejemplo (solo partidos finalizados):</em><br/>
                  • Goles pronosticados: 7<br/>
                  • Goles reales: 10<br/>
                  • Diferencia: | 7 - 10 | = <strong>3</strong>
                </div>
              </div>
            </div>

            {/* Lista Scrollable de Partidos y Pronósticos */}
            <div style={{ 
              flex: 1, 
              overflowY: 'auto', 
              paddingRight: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {loadingPredictions ? (
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', minHeight: '200px', gap: '12px' }}>
                  <div className="animate-spin" style={{ width: '32px', height: '32px', border: '3px solid rgba(16, 185, 129, 0.1)', borderTopColor: 'var(--accent-neon-green)', borderRadius: '50%' }}></div>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Obteniendo pronósticos del jugador...</span>
                </div>
              ) : matches.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
                  No hay partidos registrados en el sistema.
                </div>
              ) : (
                matches.map((match) => {
                  const pred = predictions[match.id];
                  const visible = isPredictionVisible(match);
                  const isFinishedOrLive = match.status === 'finished' || match.status === 'live';
                  
                  return (
                    <div 
                      key={match.id}
                      style={{
                        background: 'rgba(255, 255, 255, 0.02)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '12px',
                        padding: '12px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        transition: 'var(--transition-smooth)'
                      }}
                    >
                      {/* Cabecera del partido (Grupo / Fecha) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <span style={{ background: 'rgba(255, 255, 255, 0.05)', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {match.group_name}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={12} /> {new Date(match.match_time).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Cuerpo del partido (Equipos + Marcador Real) */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        {/* Local */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-glass)', flexShrink: 0 }}>
                            <img 
                              src={`https://flagcdn.com/w80/${match.home_flag}.png`} 
                              alt={match.home_team} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/un.png';
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={match.home_team}>
                            {match.home_team}
                          </span>
                        </div>

                        {/* Marcador Real */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0,0,0,0.2)', padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-glass)' }}>
                          {isFinishedOrLive ? (
                            <>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{match.home_score}</span>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>-</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>{match.away_score}</span>
                              {match.status === 'live' && (
                                <span className="live-pulse" style={{ marginLeft: '4px' }}></span>
                              )}
                            </>
                          ) : (
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>vs</span>
                          )}
                        </div>

                        {/* Visitante */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', minWidth: 0, textAlign: 'right' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={match.away_team}>
                            {match.away_team}
                          </span>
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '1px solid var(--border-glass)', flexShrink: 0 }}>
                            <img 
                              src={`https://flagcdn.com/w80/${match.away_flag}.png`} 
                              alt={match.away_team} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/un.png';
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Sección de Pronóstico y Puntos */}
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center', 
                        borderTop: '1px dashed var(--border-glass)', 
                        paddingTop: '8px',
                        fontSize: '0.8rem'
                      }}>
                        {visible ? (
                          pred ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ color: 'var(--text-secondary)' }}>Pronóstico:</span>
                              <span style={{ 
                                fontWeight: 800, 
                                background: 'rgba(255,255,255,0.06)', 
                                padding: '2px 8px', 
                                borderRadius: '4px',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-glass)'
                              }}>
                                {pred.home_prediction} - {pred.away_prediction}
                              </span>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--accent-red)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <X size={12} /> Sin Pronóstico
                            </span>
                          )
                        ) : (
                          <span style={{ 
                            color: 'var(--accent-gold)', 
                            fontWeight: 700, 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            background: 'rgba(245, 158, 11, 0.05)',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(245, 158, 11, 0.15)'
                          }}>
                            <Lock size={12} /> Oculto (Hasta cierre)
                          </span>
                        )}

                        {/* Puntos Ganados */}
                        {isFinishedOrLive && pred && visible && (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            {pred.points_earned === 5 ? (
                              <span className="points-earned-tag" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--accent-gold)' }}>
                                {getExactScoreBadgeText(`${match.id}-${selectedPlayer?.id}`)}
                              </span>
                            ) : pred.points_earned === 3 ? (
                              <span className="points-earned-tag">
                                🏃‍♂️ Resultado Correcto +3 pts
                              </span>
                            ) : (
                              (() => {
                                const blunderMsg = getEpicBlunderMsg(match, pred);
                                return blunderMsg ? (
                                  <span className="points-earned-tag incorrect" style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171' }} title={blunderMsg}>
                                    {blunderMsg}
                                  </span>
                                ) : (
                                  <span className="points-earned-tag incorrect">
                                    ❌ Sin pts
                                  </span>
                                );
                              })()
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
