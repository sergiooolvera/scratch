'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trophy, Calendar, Ticket, ShieldQuestion, Star, Users, Flame, ChevronRight, Activity, Award, Gift, Copy, Check } from 'lucide-react';

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  home_score: number | null;
  away_score: number | null;
  match_time: string;
  status: string;
  group_name: string;
}

export default function HomePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  // Statistics
  const [activePlayers, setActivePlayers] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [playedMatches, setPlayedMatches] = useState(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [poolTotal, setPoolTotal] = useState(0);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  
  // Point system rules
  const [ptsExact, setPtsExact] = useState(3);
  const [ptsWinner, setPtsWinner] = useState(1);
  const [ptsDraw, setPtsDraw] = useState(1);
  const [lockHours, setLockHours] = useState(24);

  const [statsLoading, setStatsLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fetchDashboardData = async () => {
    setStatsLoading(true);
    
    // Safety fallback timer to prevent permanent loading screens (e.g. tab sleep)
    const safetyTimer = setTimeout(() => {
      setStatsLoading(false);
    }, 2500);

    try {
      // 1. Fetch system settings
      const { data: settings, error: settingsError } = await supabase
        .from('qui_system_settings')
        .select('*')
        .eq('id', 'points_config')
        .single();

      if (!settingsError && settings) {
        setPtsExact(settings.points_exact_score);
        setPtsWinner(settings.points_correct_winner);
        setPtsDraw(settings.points_correct_draw);
        setLockHours(settings.lock_hours_before);
        setPoolTotal(Number(settings.pool_accumulated) || 0);
      }

      // 2. Fetch matches statistics
      const { data: matchesData, error: matchesError } = await supabase
        .from('qui_matches')
        .select('status, home_team, away_team, home_flag, away_flag, home_score, away_score, match_time, group_name, id');

      if (!matchesError && matchesData) {
        setTotalMatches(matchesData.length);
        setPlayedMatches(matchesData.filter(m => m.status === 'finished').length);
        
        // Extract live or next upcoming matches (up to 4 matches)
        const sorted = [...matchesData].sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
        const live = sorted.filter(m => m.status === 'live');
        const upcoming = sorted.filter(m => m.status === 'pending');
        
        setLiveMatches([...live, ...upcoming].slice(0, 4) as Match[]);
      }

      // 3. Fetch active players count
      const { count, error: countError } = await supabase
        .from('qui_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      if (!countError && count !== null) {
        setActivePlayers(count);
      }

      // 4. Calculate current user's rank
      if (user && profile) {
        const { data: rankings, error: rankError } = await supabase
          .from('qui_profiles')
          .select('id, points')
          .order('points', { ascending: false });

        if (!rankError && rankings) {
          const index = rankings.findIndex(r => r.id === user.id);
          if (index !== -1) {
            setUserRank(index + 1);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard statistics:', err);
    } finally {
      clearTimeout(safetyTimer);
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user, profile]);

  const formatMatchDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading && totalMatches === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Estadio Digital...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Banner Card */}
      <div className="glass-panel" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(30, 41, 59, 0.6) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        marginBottom: '24px',
        padding: '32px 24px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ maxWidth: '480px', zIndex: 2, position: 'relative' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--accent-neon-green)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Mundial 2026
          </span>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 900, textTransform: 'uppercase', margin: '4px 0 10px 0', lineHeight: '1.1' }}>
            Quiniela Mundialista
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px' }}>
            Registra tus pronósticos de los partidos más importantes del planeta, suma puntos y compite de forma recreativa contra tus amigos por el gran pozo de Frijolitos.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {user ? (
              profile?.is_active ? (
                <Link href="/quiniela" className="btn btn-primary">
                  <span>Capturar Pronósticos</span>
                  <ChevronRight size={16} />
                </Link>
              ) : (
                <Link href="/pay" className="btn btn-gold">
                  <span>Registrar Donativo Técnico</span>
                  <Ticket size={16} />
                </Link>
              )
            ) : (
              <Link href="/login" className="btn btn-primary" style={{ padding: '12px 24px' }}>
                <span>Unirme a la Quiniela</span>
                <ChevronRight size={16} />
              </Link>
            )}
            
            <Link href="/ranking" className="btn btn-secondary">
              Ver Posiciones
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div style={{
          position: 'absolute',
          right: '-10px',
          bottom: '-30px',
          fontSize: '11rem',
          opacity: 0.08,
          transform: 'rotate(-15deg)',
          pointerEvents: 'none',
          fontFamily: 'Outfit'
        }}>
          ⚽
        </div>
      </div>

      {/* Referral Code Banner */}
      {user && profile && profile.referral_code && (
        <div className="glass-panel" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-glass)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: '50%',
              padding: '10px',
              color: 'var(--accent-neon-green)'
            }}>
              <Gift size={20} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700 }}>¡Invita a tus amigos a la quiniela!</h4>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Comparte tu código y haz que se registren usándolo para competir juntos.
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-glass)',
              borderRadius: '8px',
              padding: '8px 16px',
              fontFamily: 'monospace',
              fontSize: '1rem',
              fontWeight: 800,
              color: 'var(--accent-neon-green)',
              letterSpacing: '1px'
            }}>
              {profile.referral_code}
            </div>
            <button 
              onClick={() => handleCopyCode(profile.referral_code || '')}
              className="btn btn-secondary"
              style={{ padding: '8px 12px', minWidth: '95px', display: 'flex', gap: '6px', alignItems: 'center', justifyContent: 'center' }}
            >
              {copied ? (
                <>
                  <Check size={14} style={{ color: 'var(--accent-neon-green)' }} />
                  <span style={{ color: 'var(--accent-neon-green)', fontSize: '0.8rem' }}>Copiado</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span style={{ fontSize: '0.8rem' }}>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Dynamic Statistics Grid */}
      <div className="stats-grid">
        {/* Stat 1: Frijolitos Prize */}
        <div className="glass-panel stat-box gold" style={{ cursor: 'pointer' }} onClick={() => router.push('/ranking')}>
          <div className="stat-icon">
            <Trophy size={24} style={{ color: 'var(--accent-gold)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Bolsa de Recompensa</span>
            <span className="stat-value" style={{ color: 'var(--accent-gold)' }}>
              {poolTotal.toLocaleString()} Frijolitos 🫘
            </span>
          </div>
        </div>

        {/* Stat 2: Active Players */}
        <div className="glass-panel stat-box success">
          <div className="stat-icon">
            <Users size={24} style={{ color: 'var(--accent-neon-green)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Colaboradores</span>
            <span className="stat-value">
              {statsLoading ? '...' : activePlayers}
            </span>
          </div>
        </div>

        {/* Stat 3: Matches Progress */}
        <div className="glass-panel stat-box">
          <div className="stat-icon">
            <Flame size={24} style={{ color: 'var(--accent-blue)' }} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Partidos Jugados</span>
            <span className="stat-value">
              {statsLoading ? '...' : `${playedMatches} / ${totalMatches}`}
            </span>
          </div>
        </div>

        {/* Stat 4: User Current Ranking standing */}
        {user && profile && (
          <div className="glass-panel stat-box success" style={{ cursor: 'pointer' }} onClick={() => router.push('/ranking')}>
            <div className="stat-icon">
              <Award size={24} style={{ color: 'var(--accent-neon-green)' }} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Tu Posición</span>
              <span className="stat-value">
                {statsLoading ? '...' : userRank ? `#${userRank}` : 'Pendiente'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Live/Upcoming matches + Point scoring rules */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginTop: '8px' }}>
        
        {/* Left Column: Live or Next Matches list */}
        <div className="glass-panel" style={{ flex: 2 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent-neon-green)' }} /> Encuentros Destacados
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {liveMatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                No hay partidos cargados en este momento.
              </div>
            ) : (
              liveMatches.map((match) => {
                const isLive = match.status === 'live';

                return (
                  <div key={match.id} className="glass-card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderLeft: isLive ? '3px solid var(--accent-red)' : undefined,
                    background: isLive ? 'rgba(239, 68, 68, 0.02)' : undefined
                  }}>
                    {/* Home Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                      <img 
                        src={`https://flagcdn.com/w80/${match.home_flag}.png`} 
                        alt={match.home_team}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass)' }}
                      />
                      <span className="sports-font" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{match.home_team}</span>
                    </div>

                    {/* Mid Scoreboard display */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '80px' }}>
                      {isLive ? (
                        <>
                          <span className="sports-font" style={{ fontWeight: 800, color: 'var(--accent-red)', fontSize: '1.15rem' }}>
                            {match.home_score} - {match.away_score}
                          </span>
                          <span className="badge badge-live" style={{ padding: '1px 6px', fontSize: '0.65rem' }}>EN VIVO 🔴</span>
                        </>
                      ) : match.status === 'finished' ? (
                        <>
                          <span className="sports-font" style={{ fontWeight: 800, color: 'var(--accent-neon-green)', fontSize: '1.15rem' }}>
                            {match.home_score} - {match.away_score}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700 }}>FINALIZADO</span>
                        </>
                      ) : (
                        <>
                          <span className="sports-font" style={{ fontWeight: 800, color: 'var(--text-muted)', fontSize: '1.1rem' }}>
                            VS
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                            {formatMatchDate(match.match_time)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Away Team */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, justifyContent: 'flex-end', textAlign: 'right' }}>
                      <span className="sports-font" style={{ fontWeight: 700, fontSize: '0.9rem' }}>{match.away_team}</span>
                      <img 
                        src={`https://flagcdn.com/w80/${match.away_flag}.png`} 
                        alt={match.away_team}
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-glass)' }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
          
          <Link href="/quiniela" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--accent-neon-green)', fontWeight: 700, marginTop: '16px', textDecoration: 'underline' }}>
            <span>Capturar todos mis pronósticos</span>
            <ChevronRight size={14} />
          </Link>
        </div>

        {/* Right Column: Dynamic Scoring Rules matrix */}
        <div className="glass-panel" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '20px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldQuestion size={18} style={{ color: 'var(--accent-gold)' }} /> Reglamento de Juego
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Consigue la mayor puntuación en base a las predicciones exactas de los partidos oficiales. La tabla de puntuación actual asigna:
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>🎯 Marcador Exacto</span>
                <strong style={{ color: 'var(--accent-neon-green)' }}>+{ptsExact} Puntos</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>🏃‍♂️ Ganador Correcto</span>
                <strong style={{ color: 'var(--accent-neon-green)' }}>+{ptsWinner} Punto</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>🤝 Empate Correcto</span>
                <strong style={{ color: 'var(--accent-neon-green)' }}>+{ptsDraw} Punto</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>❌ Pronóstico Erróneo / Vacío</span>
                <strong style={{ color: 'var(--text-muted)' }}>0 Puntos</strong>
              </div>
            </div>

            <div style={{
              background: 'rgba(245, 158, 11, 0.05)',
              border: '1px dashed rgba(245, 158, 11, 0.25)',
              padding: '12px',
              borderRadius: '8px',
              fontSize: '0.78rem',
              color: 'var(--accent-gold)',
              lineHeight: 1.35
            }}>
              <strong>Restricción de Tiempo:</strong> Solo puedes registrar o modificar tus pronósticos hasta **{lockHours} horas antes** del silbatazo inicial de cada partido. Transcurrido ese límite, los marcadores quedarán completamente bloqueados.
            </div>
          </div>
        </div>

      </div>

      {/* Footer and Terms & Conditions trigger */}
      <footer style={{
        marginTop: '60px',
        padding: '24px 0',
        borderTop: '1px solid var(--border-glass)',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div>© 2026 QuiMundial. Todos los derechos reservados. Plataforma privada de entretenimiento deportivo.</div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <button 
            onClick={() => setShowTerms(true)} 
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-neon-green)',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'underline',
              padding: 0
            }}
          >
            Términos, Condiciones y Exención de Responsabilidad
          </button>
        </div>
      </footer>

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
                <strong>4. Aceptación de Condiciones:</strong> El uso de la plataforma, el registro de perfiles y la captura de marcadores implica la manifestación libre, voluntaria y expresa de la aceptación absoluta de todos los presentes términos y condiciones generales por parte de los usuarios.
              </p>
            </div>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: '24px', padding: '12px' }} onClick={() => setShowTerms(false)}>
              Entendido y Acepto
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
