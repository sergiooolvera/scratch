'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Trophy, Search, Award, TrendingUp, DollarSign, Sparkles, AlertCircle, CircleCheck } from 'lucide-react';

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

export default function RankingPage() {
  const [leaderboard, setLeaderboard] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [poolTotal, setPoolTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Dynamic percentages states
  const [pctFirst, setPctFirst] = useState(50);
  const [pctSecond, setPctSecond] = useState(25);
  const [pctThird, setPctThird] = useState(5);

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
        .select('pool_accumulated, pct_first_place, pct_second_place, pct_third_place')
        .eq('id', 'points_config')
        .single();

      if (settingsError) throw settingsError;
      setPoolTotal(Number(settingsData?.pool_accumulated) || 0);
      setPctFirst(Number(settingsData?.pct_first_place) ?? 50);
      setPctSecond(Number(settingsData?.pct_second_place) ?? 25);
      setPctThird(Number(settingsData?.pct_third_place) ?? 5);
    } catch (err: any) {
      console.error('Error fetching ranking data:', err.message);
    } finally {
      clearTimeout(safetyTimer);
      setLoading(false);
    }
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
              <span>10,000 Frijolitos</span>
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
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{Math.floor(10000 * pctFirst / 100).toLocaleString()} 🫘</span>
              </div>
              
              {/* 2nd Place Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(226, 232, 240, 0.1) 0%, rgba(0, 0, 0, 0.2) 100%)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(226, 232, 240, 0.15)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#e2e8f0', display: 'block' }}>🥈 2do Lugar</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, display: 'block', margin: '4px 0', color: '#ffffff' }}>{pctSecond}%</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{Math.floor(10000 * pctSecond / 100).toLocaleString()} 🫘</span>
              </div>
              
              {/* 3rd Place Card */}
              <div style={{ background: 'linear-gradient(135deg, rgba(205, 127, 50, 0.12) 0%, rgba(0, 0, 0, 0.2) 100%)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(205, 127, 50, 0.2)', textAlign: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#cd7f32', display: 'block' }}>🥉 3er Lugar</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 900, display: 'block', margin: '4px 0', color: '#ffffff' }}>{pctThird}%</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 700 }}>{Math.floor(10000 * pctThird / 100).toLocaleString()} 🫘</span>
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

        {/* Table representation */}
        <div className="ranking-table-wrapper">
          <table className="ranking-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Pos</th>
                <th>Jugador</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Puntos</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Marcadores Exactos</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Diferencia Goles</th>
                <th style={{ width: '110px', textAlign: 'center' }}>Boleto</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaderboard.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
                    No se encontraron participantes.
                  </td>
                </tr>
              ) : (
                filteredLeaderboard.map((player, index) => {
                  return (
                    <tr key={player.id} className="ranking-row" style={{
                      background: player.is_active ? undefined : 'rgba(239, 68, 68, 0.02)'
                    }}>
                      {/* Rank Position */}
                      <td className="rank-number-cell" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
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

                      {/* Active Payment ticket status */}
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        {player.is_active ? (
                          <span className="badge badge-paid" title="Boleto Activo">Activo</span>
                        ) : (
                          <span className="badge badge-unpaid" title="Pago Pendiente">Pendiente</span>
                        )}
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
            <strong>Criterio de Desempate General:</strong> En caso de empate en puntos, las posiciones se definen por: 1) Mayor cantidad de <strong>Marcadores Exactos</strong> (🎯 acertados en marcador exacto), 2) Menor valor en <strong>Diferencia de Goles</strong> (⚽ menor diferencia acumulada absoluta entre tus predicciones de goles y goles oficiales).
          </p>
        </div>
      </div>
    </div>
  );
}
