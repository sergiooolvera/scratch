'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Trophy, Calendar, Ticket, ShieldQuestion, Star, Flame, ChevronRight, Activity, Award, Gift, Copy, Check, Share2 } from 'lucide-react';
import { picante } from '@/lib/spicy';

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
  const { user, profile, loading, spicyMode } = useAuth();

  // Statistics
  const [activePlayers, setActivePlayers] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [playedMatches, setPlayedMatches] = useState(0);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [poolTotal, setPoolTotal] = useState(0);
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  
  // Point system rules
  const [ptsExact, setPtsExact] = useState(5);
  const [ptsWinner, setPtsWinner] = useState(3);
  const [ptsDraw, setPtsDraw] = useState(3);
  const [lockHours, setLockHours] = useState(24);

  const [statsLoading, setStatsLoading] = useState(true);
  const [showTerms, setShowTerms] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Background images randomizer
  const [bgImage, setBgImage] = useState<string>('');

  useEffect(() => {
    // Randomly select one of 15 custom background files
    const randomIndex = Math.floor(Math.random() * 15) + 1;
    setBgImage(`/bg-mundial-${randomIndex}.jpg`);
  }, []);

  // Countdown target date and state
  const [firstMatchTime, setFirstMatchTime] = useState<string>('2026-06-11T15:00:00Z');
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isOver: false
  });

  // Countdown timer hook
  useEffect(() => {
    const updateTimer = () => {
      const targetDate = new Date(firstMatchTime).getTime();
      const now = Date.now();
      const difference = targetDate - now;

      if (difference <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isOver: true });
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds, isOver: false });
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [firstMatchTime]);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async (code: string) => {
    if (typeof window === 'undefined') return;
    const shareUrl = `${window.location.origin}/login?ref=${code}`;
    const shareText = `¡Únete a mi Quiniela Futbolera para el Mundial 2026! ⚽🏆 Regístrate usando mi código: ${code}\n\nEnlace de registro: ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Quiniela Mundialista 2026',
          text: `¡Únete a mi Quiniela Futbolera para el Mundial 2026! ⚽🏆 Regístrate usando mi código de referido: ${code}`,
          url: shareUrl
        });
        return;
      } catch (err) {
        console.log('Share API failed or was cancelled', err);
      }
    }

    // Fallback: copy registration URL + code text
    navigator.clipboard.writeText(shareText);
    setShared(true);
    setTimeout(() => setShared(false), 2000);
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
        if (sorted.length > 0) {
          setFirstMatchTime(sorted[0].match_time);
        }
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
    if (!loading) {
      fetchDashboardData();
    }
  }, [user, profile, loading]);

  // Silent visibility dashboard refresh when tab becomes active after inactivity
  useEffect(() => {
    if (loading) return;

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboardData();
      }
    };

    window.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loading]);

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
          transform: scale(1.02);
        }

        @keyframes championship-glow {
          0%, 100% {
            box-shadow: 0 0 25px rgba(212, 175, 55, 0.25), inset 0 0 15px rgba(212, 175, 55, 0.05);
            border-color: rgba(212, 175, 55, 0.4);
          }
          50% {
            box-shadow: 0 0 45px rgba(212, 175, 55, 0.65), inset 0 0 25px rgba(212, 175, 55, 0.2);
            border-color: rgba(212, 175, 55, 0.85);
          }
        }
        .championship-card {
          animation: championship-glow 3s infinite ease-in-out;
          background: linear-gradient(135deg, rgba(20, 20, 25, 0.93) 0%, rgba(35, 30, 20, 0.96) 100%) !important;
          border: 1px solid rgba(212, 175, 55, 0.45) !important;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .championship-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 15px 50px rgba(212, 175, 55, 0.55) !important;
          border-color: rgba(212, 175, 55, 0.9) !important;
        }
        @keyframes float-trophy {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-12px) rotate(4deg); }
        }
        .floating-trophy {
          animation: float-trophy 4.5s infinite ease-in-out;
          filter: drop-shadow(0 0 25px rgba(212, 175, 55, 0.65));
        }
        @keyframes shine-text {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .shine-gold-text {
          background: linear-gradient(90deg, #ffe066, #f5c71a, #ffe066, #ffffff, #ffe066);
          background-size: 200% auto;
          color: transparent;
          -webkit-background-clip: text;
          background-clip: text;
          animation: shine-text 6s linear infinite;
        }
      `}</style>

      {/* Championship Celebration Banner Card */}
      <div className="glass-panel welcome-banner-card championship-card" style={{
        marginBottom: '24px',
        padding: '40px 32px',
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '24px'
      }}>
        {/* Responsive layout container */}
        <div className="welcome-layout-container" style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '32px',
          zIndex: 2,
          position: 'relative'
        }}>
          {/* Left Side: Winner details and thanks */}
          <div className="welcome-text-column" style={{ maxWidth: '540px', flex: '1 1 320px' }}>
            <span style={{ 
              fontSize: '0.85rem', 
              fontWeight: 800, 
              color: 'var(--accent-gold)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.15em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(212, 175, 55, 0.12)',
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              marginBottom: '16px'
            }}>
              🏆 PODIO FINAL - CLAUSURA 🏆
            </span>
            <h2 className="shine-gold-text sports-font" style={{ 
              fontSize: '2.6rem', 
              fontWeight: 950, 
              textTransform: 'uppercase', 
              margin: '0 0 6px 0', 
              lineHeight: '1.1',
              letterSpacing: '0.02em'
            }}>
              ¡FELICIDADES LUIS SOTO!
            </h2>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 18px 0',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Ganador Absoluto de la Quiniela Mundialista
            </h3>
            
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.98rem', marginBottom: '16px', lineHeight: '1.6' }}>
              {picante(
                "Queremos agradecer profundamente a todos los participantes por su increíble entusiasmo, entrega y la excelente vibra recreativa demostrada a lo largo de este torneo mundialista. ¡Hicieron que cada jornada de pronósticos fuera sumamente divertida!",
                "¡Se acabó el tiro y el veredicto es final! Felicitaciones a Luis Soto por dejar en el camino a toda la perrada. Y a todos ustedes, par de troncos y estrategas de sillón, gracias de corazón por entrarle con tanto entusiasmo y aguantar la carrilla. ¡Se la rifaron de principio a fin! 🫘⚽🔥",
                spicyMode
              )}
            </p>
            
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '28px', fontStyle: 'italic', fontWeight: 500 }}>
              ¡Los esperamos con los brazos abiertos y listos para competir en un próximo gran evento deportivo! Manténganse atentos.
            </p>


          </div>

          {/* Right Side: Trophy illustration */}
          <div className="welcome-countdown-card floating-trophy" style={{
            flex: '1 1 240px',
            maxWidth: '320px',
            background: 'rgba(212, 175, 55, 0.05)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(212, 175, 55, 0.25)',
            borderRadius: '24px',
            padding: '36px 24px',
            boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5), inset 0 0 20px rgba(212, 175, 55, 0.05)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
          }}>
            <div style={{
              background: 'radial-gradient(circle, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0) 70%)',
              borderRadius: '50%',
              padding: '24px',
              marginBottom: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Trophy size={72} style={{ color: '#f5c71a' }} />
            </div>
            <span className="sports-font" style={{ 
              fontSize: '1.4rem', 
              fontWeight: 900, 
              color: '#ffe066', 
              textTransform: 'uppercase', 
              letterSpacing: '0.05em', 
              display: 'block' 
            }}>
              🏆 LUIS SOTO 🏆
            </span>
            <span style={{ 
              fontSize: '0.78rem', 
              color: 'rgba(255, 255, 255, 0.7)', 
              display: 'block', 
              marginTop: '6px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              CAMPEÓN ABSOLUTO
            </span>
          </div>
        </div>

        {/* Faded Background Image */}
        {bgImage && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1,
            pointerEvents: 'none',
            opacity: 0.18,
            mixBlendMode: 'normal',
            overflow: 'hidden'
          }}>
            <img 
              src={bgImage} 
              alt="Mundial background decoration" 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                filter: 'grayscale(35%) brightness(50%) contrast(120%)'
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          </div>
        )}
      </div>

      {/* Referral Code Banner */}
      {user && profile && profile.referral_code && (
        <div 
          className="referral-box-glow"
          style={{
            background: 'var(--referral-bg)',
            border: '2px solid var(--referral-border)',
            borderRadius: '16px',
            padding: '18px 24px',
            marginBottom: '28px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            backdropFilter: 'blur(8px)'
          }}
        >
          <div className="referral-left-side" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: '50%',
              padding: '12px',
              color: 'var(--accent-neon-green)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)'
            }}>
              <Gift size={22} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em', color: 'var(--text-primary)' }}>¡Invita a tus amigos a la quiniela!</h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Comparte tu código y haz que se registren usándolo para competir juntos en la tabla general.
              </p>
            </div>
          </div>
          <div className="referral-right-side" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div 
              className="sports-font referral-code-display"
              style={{
                background: 'var(--referral-code-bg)',
                border: '2px solid var(--referral-code-border)',
                borderRadius: '12px',
                height: '46px',
                padding: '0 20px',
                fontSize: '1.5rem',
                fontWeight: 950,
                color: 'var(--accent-neon-green)',
                textShadow: '0 0 12px rgba(16, 185, 129, 0.6)',
                letterSpacing: '0.08em',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 15px rgba(16, 185, 129, 0.15)',
              }}
            >
              {profile.referral_code}
            </div>
            
            <div className="referral-actions-row" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                onClick={() => handleCopyCode(profile.referral_code || '')}
                className="btn btn-secondary"
                style={{ 
                  height: '46px', 
                  padding: '0 16px', 
                  minWidth: '100px', 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700,
                  borderRadius: '12px' 
                }}
              >
                {copied ? (
                  <>
                    <Check size={16} style={{ color: 'var(--accent-neon-green)' }} />
                    <span style={{ color: 'var(--accent-neon-green)', fontSize: '0.85rem' }}>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span style={{ fontSize: '0.85rem' }}>Copiar</span>
                  </>
                )}
              </button>

              <button 
                onClick={() => handleShare(profile.referral_code || '')}
                className="btn btn-primary"
                style={{ 
                  height: '46px', 
                  padding: '0 16px', 
                  minWidth: '110px', 
                  display: 'flex', 
                  gap: '8px', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  fontWeight: 700,
                  borderRadius: '12px' 
                }}
              >
                {shared ? (
                  <>
                    <Check size={16} />
                    <span style={{ fontSize: '0.85rem' }}>¡Enlace Listo!</span>
                  </>
                ) : (
                  <>
                    <Share2 size={16} />
                    <span style={{ fontSize: '0.85rem' }}>Compartir</span>
                  </>
                )}
              </button>
            </div>
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
            <span className="stat-label">{picante("Bolsa de Recompensa", "Frijoles de Honor en Juego 🫘", spicyMode)}</span>
            <span className="stat-value" style={{ color: 'var(--accent-gold)' }}>
              {poolTotal.toLocaleString()} Frijolitos 🫘
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
            <ShieldQuestion size={18} style={{ color: 'var(--accent-gold)' }} /> {picante("Reglamento de Juego", "Reglas para no andar de chillón 📜", spicyMode)}
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              {picante(
                "Consigue la mayor puntuación en base a las predicciones exactas de los partidos oficiales. La tabla de puntuación actual asigna:",
                "Demuestra tus dotes de pitoniso del fútbol. Aquí está el botín de puntos que te vas a embolsar si le atinas:",
                spicyMode
              )}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px', margin: '10px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{picante("🎯 Marcador Exacto", "🎯 Marcador Exacto (¡De Cracks!)", spicyMode)}</span>
                <strong style={{ color: 'var(--accent-neon-green)' }}>+{ptsExact} Puntos</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{picante("🏃‍♂️ Resultado Correcto (Ganador / Empate)", "🏃‍♂️ Resultado Correcto (¡Apenas de Panza!)", spicyMode)}</span>
                <strong style={{ color: 'var(--accent-neon-green)' }}>+{ptsWinner} Puntos</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{picante("❌ Pronóstico Erróneo / Vacío", "❌ Pronóstico Erróneo (¡Puro Tronco!)", spicyMode)}</span>
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
              <strong>{picante("Restricción de Tiempo:", "¡Ponte las Pilas! ⏱️", spicyMode)}</strong> {picante(
                `Solo puedes registrar o modificar tus pronósticos hasta ${lockHours} horas antes del silbatazo inicial de cada partido. Transcurrido ese límite, los marcadores quedarán completamente bloqueados.`,
                `Tienes hasta ${lockHours} horas antes de cada partido para moverle. Después de eso, ¡el que se fue a la villa perdió su silla! Ni rezándole a San Juditas se abre la taquilla.`,
                spicyMode
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Sponsor Banners Section */}
      <div className="glass-panel" style={{
        marginTop: '40px',
        padding: '28px 24px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.06) 0%, rgba(30, 41, 59, 0.4) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Patrocinadores
          </span>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 900, margin: '4px 0 0 0', color: 'var(--text-primary)' }}>
            ¿Tu marca quiere llegar a miles de aficionados?
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '6px 0 0 0', maxWidth: '500px', marginLeft: 'auto', marginRight: 'auto' }}>
            Asóciate con QuiMundial y lleva tu marca al corazón de la afición futbolera. <strong>¡Escríbenos a <a href="mailto:quinielafutbolera2026@gmail.com" style={{ color: 'var(--accent-gold)' }}>quinielafutbolera2026@gmail.com</a>!</strong>
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          maxWidth: '350px',
          margin: '0 auto'
        }}>
          <div
            style={{
              display: 'block',
              borderRadius: '14px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.3s ease',
              position: 'relative',
            }}
            className="sponsor-banner-link"
          >
            <img
              src="/publicidad2.jpg"
              alt="Patrocinador 2"
              style={{ width: '100%', height: '120px', objectFit: 'cover', display: 'block' }}
            />
          </div>
        </div>
      </div>

      {/* Footer and Terms & Conditions trigger */}
      <footer style={{
        marginTop: '40px',
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
          <div className="glass-panel" style={{
            maxWidth: '600px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            padding: '30px 24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            position: 'relative'
          }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--accent-gold)', marginBottom: '18px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px', textTransform: 'uppercase' }}>
              {picante("Aviso Legal y Exención de Responsabilidad", "Aviso Legal y de no andar con lloraderas", spicyMode)}
            </h3>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
              <p>
                <strong>1. Carácter de Mero Entretenimiento:</strong> {picante(
                  "QuiMundial es una plataforma 100% gratuita, recreativa y privada orientada exclusivamente al esparcimiento deportivo con motivo del Mundial 2026. Bajo ninguna circunstancia opera, promueve, ni facilita actividades de apuestas comerciales o juegos de azar, siendo de libre registro y participación.",
                  "QuiMundial es una reta 100% lúdica y recreativa de amigos de la cuadra. Aquí nadie te va a cobrar ni un peso partido por la mitad por registrar tus corazonadas, cumpliendo al cien con la Ley Federal de Juegos y Sorteos.",
                  spicyMode
                )}
              </p>
              <p>
                <strong>2. Naturaleza del Acceso Gratuito:</strong> {picante(
                  "El registro, uso y participación es totalmente gratuito, permitiendo un acceso libre e inmediato a la captura de pronósticos para todos los participantes sin costo alguno.",
                  "¡El registro es gratis y para toda la banda! Puedes registrar tus marcadores libremente sin gastar un centavo. 😎💻",
                  spicyMode
                )}
              </p>
              <p>
                <strong>3. Bolsa Simbólica (Frijolitos de Honor):</strong> {picante(
                  `Para enfatizar el carácter lúdico del torneo, la bolsa acumulada se representa y distribuye en una métrica virtual de ${poolTotal.toLocaleString()} Frijolitos de honor, los cuales representan reputación deportiva y orgullo amistoso sin valor monetario real.`,
                  `Los Frijolitos son virtuales y representan pura carrilla sana y créditos de honor. El que gane se lleva la corona del barrio y el derecho a recordarle a todos quién manda, pero cero dinero real de por medio.`,
                  spicyMode
                )}
              </p>
              <p>
                <strong>4. Causa Social y Búsqueda de Oportunidades:</strong> {picante(
                  "Este proyecto ha sido desarrollado e impulsado con dedicación por personas que nos quedamos sin empleo recientemente y que estamos preocupados por el bienestar de nuestras familias, queremos que nos veas y si te agrada el trabajo pues que juntos nos apoyemos para crear oportunidades laborales.",
                  "Este proyecto nació del esfuerzo de personas talentosas que perdieron su empleo pero no las ganas de crear. Si te gusta lo que ves, compártelo y ayúdanos a mostrar nuestro trabajo para generar nuevas oportunidades. ¡Gratis para ti, esperanza para nosotros!",
                  spicyMode
                )}
              </p>
              <p>
                <strong>5. Comunicaciones y Autorización de Contacto:</strong> {picante(
                  "Al registrarse, el usuario autoriza expresamente a QuiMundial para enviar comunicaciones vía correo electrónico y/o mensajes con fines informativos, promocionales y de publicidad. El usuario podrá darse de baja en cualquier momento mediante el enlace de cancelación incluido en cada comunicación.",
                  "Al registrarte aceptas que te mandemos uno que otro correo o mensaje para avisarte de novedades, resultados y cosas interesantes de la quiniela. Si te llega a molestar la publicidad, siempre puedes cancelar la suscripción con un solo clic al final del mensaje. Sin presiones, prometido.",
                  spicyMode
                )}
              </p>
              <p>
                <strong>6. Resultados Oficiales de Juego:</strong> {picante(
                  "Los marcadores y resultados oficiales que se tomarán en cuenta para el cálculo de los puntos serán únicamente los declarados oficiales por el comité organizador de la competencia deportiva.",
                  "Aquí lo que diga el árbitro oficial de la cancha va a misa. Nada de que 'a mí me pareció penal'. Los marcadores oficiales del torneo son la ley absoluta en esta quiniela.",
                  spicyMode
                )}
              </p>
              <p>
                <strong>7. Nombramiento de Ganadores y Premiación:</strong> {picante(
                  "El día 26 de Junio se nombrará oficialmente al ganador o ganadora del torneo en base al puntaje final acumulado.",
                  "El 26 de Junio coronaremos oficialmente al rey del balón de esta quiniela y nos echaremos un buen mole por el campeón.",
                  spicyMode
                )}
              </p>
              <p>
                <strong>8. Aceptación de Condiciones:</strong> {picante(
                  "El uso de la plataforma, el registro de perfiles y la captura de marcadores implica la manifestación libre, voluntaria y expresa de la aceptación absoluta de estos términos.",
                  "Si te metes a jugar, es porque estás de acuerdo con el reglamento de esta reta. ¡Que ruede el balón y que gane el menos tronco!",
                  spicyMode
                )}
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
