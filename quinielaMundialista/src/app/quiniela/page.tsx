'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { Lock, Save, Calendar, ShieldAlert, Award, Search, Sparkles, CheckCircle2, Check, Trash2, X } from 'lucide-react';
import { picante, getSpicyWinMsg, getSpicyBlunderMsg } from '@/lib/spicy';
import { playSound } from '@/lib/sounds';

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
  is_locked?: boolean;
}

interface Prediction {
  match_id: string;
  home_prediction: number | string;
  away_prediction: number | string;
  points_earned?: number;
  is_exact?: boolean;
}

// Helpers for Easter Eggs and Mexican Pop Culture References
const getExactScoreBadgeText = (seedString: string, isSpicy: boolean, points: number = 5) => {
  if (!isSpicy) {
    return `🎯 Marcador Exacto (+${points} pts) 🔥`;
  }
  return getSpicyWinMsg(seedString);
};

const getEpicBlunderMsg = (match: any, pred: any, isSpicy: boolean) => {
  if (!isSpicy) return '';
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
    return getSpicyBlunderMsg(match.id);
  }
  return '';
};

export default function QuinielaPage() {
  const router = useRouter();
  const { user, profile, loading, refreshProfile, spicyMode } = useAuth();
  
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<{ [matchId: string]: Prediction }>({});
  const [savingState, setSavingState] = useState<{ [matchId: string]: 'idle' | 'saving' | 'saved' | 'error' }>({});
  const [pageLoading, setPageLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'group' | 'date'>('date');
  const [toastMessage, setToastMessage] = useState('');
  const [modifiedMatchIds, setModifiedMatchIds] = useState<Set<string>>(new Set());
  const [isBulkSaving, setIsBulkSaving] = useState(false);
  
  // Simulator lock state for testing
  const [simMode, setSimMode] = useState<'real' | 'bypass' | 'force_all' | 'world_cup'>('real');

  const [lockHours, setLockHours] = useState(24);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMode = localStorage.getItem('sim_mode_24h') || 'real';
      if (profile?.is_admin) {
        setSimMode(savedMode as any);
      } else {
        setSimMode('real');
      }
    }
  }, [profile]);

  const changeSimMode = (mode: 'real' | 'bypass' | 'force_all' | 'world_cup') => {
    setSimMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sim_mode_24h', mode);
    }
    const msgs = {
      real: '⏱️ Modo Tiempo Real activado.',
      bypass: '🔓 Bypass de bloqueo activado. Todos los partidos están editables.',
      force_all: '🔒 Bloqueo completo forzado. Todos los partidos están bloqueados.',
      world_cup: '📅 Fecha simulada al 11-Junio-2026. Algunos partidos se bloquearán.'
    };
    showToast(msgs[mode]);
  };

  // Fetch Matches and Predictions
  const fetchData = async () => {
    if (matches.length === 0) {
      setPageLoading(true);
    }
    
    // Safety fallback timer to prevent permanent loading screens (e.g. tab sleep)
    const safetyTimer = setTimeout(() => {
      setPageLoading(false);
    }, 2500);

    console.log('[DEBUG] NEXT_PUBLIC_SUPABASE_URL used in browser:', process.env.NEXT_PUBLIC_SUPABASE_URL);

    try {
      setFetchError(null);
      // 1. Fetch matches sorted by time
      const { data: matchesData, error: matchesError } = await supabase
        .from('qui_matches')
        .select('*')
        .order('match_time', { ascending: true });

      if (matchesError) throw matchesError;
      setMatches(matchesData || []);

      // 2. Fetch user predictions ONLY if user is logged in
      if (user) {
        const { data: predsData, error: predsError } = await supabase
          .from('qui_predictions')
          .select('match_id, home_prediction, away_prediction, points_earned, is_exact')
          .eq('user_id', user.id);

        if (predsError) throw predsError;

        // Index predictions by match_id
        const predsMap: { [matchId: string]: Prediction } = {};
        predsData?.forEach((p) => {
          predsMap[p.match_id] = {
            match_id: p.match_id,
            home_prediction: p.home_prediction !== null && p.home_prediction !== undefined ? p.home_prediction : '',
            away_prediction: p.away_prediction !== null && p.away_prediction !== undefined ? p.away_prediction : '',
            points_earned: p.points_earned,
            is_exact: p.is_exact,
          };
        });
        setPredictions(predsMap);
      } else {
        setPredictions({});
      }

      // 3. Fetch system settings for lock hours
      const { data: settingsData, error: settingsError } = await supabase
        .from('qui_system_settings')
        .select('lock_hours_before')
        .eq('id', 'points_config')
        .single();

      if (!settingsError && settingsData) {
        setLockHours(Number(settingsData.lock_hours_before) || 24);
      }
    } catch (err: any) {
      console.error('Error fetching quiniela data:', err.message);
      setFetchError(err.message || String(err));
      showToast('Error al cargar partidos.');
    } finally {
      clearTimeout(safetyTimer);
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    if (user && refreshProfile) {
      refreshProfile();
    }
  }, [user]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // Check if a match is locked (less than lockHours hours to start, or already live/finished, or manually locked)
  const isMatchLocked = (match: Match) => {
    if (simMode === 'bypass') {
      return false;
    }
    if (simMode === 'force_all') {
      return true;
    }
    if (match.status === 'live' || match.status === 'finished') {
      return true;
    }
    if (match.is_locked) {
      return true;
    }
    
    let currentTime = Date.now();
    if (simMode === 'world_cup') {
      // Simulate June 11, 2026, at 16:00:00 UTC (1 hour after Mexico vs South Africa start)
      currentTime = new Date('2026-06-11T16:00:00Z').getTime();
    }

    const matchTime = new Date(match.match_time).getTime();
    const lockInterval = lockHours * 60 * 60 * 1000;
    return (matchTime - currentTime) < lockInterval;
  };

  // Get detailed locking explanation for testing feedback
  const getMatchLockStatus = (match: Match) => {
    if (simMode === 'bypass') {
      return { text: 'Bypass (Abierto)', type: 'unlocked' };
    }
    if (simMode === 'force_all') {
      return { text: 'Forzado (Bloqueado)', type: 'locked' };
    }
    if (match.status === 'live' || match.status === 'finished') {
      return { text: match.status === 'live' ? 'En Vivo' : 'Finalizado', type: 'locked' };
    }
    if (match.is_locked) {
      return { text: 'Bloqueado (Admin)', type: 'locked' };
    }

    let currentTime = Date.now();
    if (simMode === 'world_cup') {
      currentTime = new Date('2026-06-11T16:00:00Z').getTime();
    }

    const matchTime = new Date(match.match_time).getTime();
    const lockInterval = lockHours * 60 * 60 * 1000;
    const diff = matchTime - currentTime;

    if (diff < 0) {
      return { text: 'Ya inició', type: 'locked' };
    } else if (diff < lockInterval) {
      const hoursRemaining = Math.floor(diff / (60 * 60 * 1000));
      const minsRemaining = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      return { text: `Cierra en: ${hoursRemaining}h ${minsRemaining}m`, type: 'locked' };
    } else {
      const hoursRemaining = Math.floor(diff / (60 * 60 * 1000));
      return { text: `Abierto (Faltan ${hoursRemaining}h)`, type: 'unlocked' };
    }
  };

  const handlePredictionChange = (matchId: string, side: 'home' | 'away', val: string) => {
    // Keep only digits and restrict to length 2 (0-99)
    const cleanVal = val.replace(/\D/g, '').slice(0, 2);
    
    setPredictions(prev => {
      const current = prev[matchId] || { match_id: matchId, home_prediction: '', away_prediction: '' };
      return {
        ...prev,
        [matchId]: {
          ...current,
          [side === 'home' ? 'home_prediction' : 'away_prediction']: cleanVal
        }
      };
    });

    // Mark as modified
    setModifiedMatchIds(prev => {
      const newSet = new Set(prev);
      newSet.add(matchId);
      return newSet;
    });

    // Reset saving status to idle if user edits again
    if (savingState[matchId] === 'saved' || savingState[matchId] === 'error') {
      setSavingState(prev => ({ ...prev, [matchId]: 'idle' }));
    }
  };

  const savePrediction = async (matchId: string) => {
    if (!user) {
      showToast(picante(
        "Debe iniciar sesión o registrarse para guardar su pronóstico.",
        "⚠️ ¡Epa, compadre! Regístrate o inicia sesión para que tus goles queden guardados.",
        spicyMode
      ));
      setTimeout(() => {
        router.push('/login?redirect=/quiniela');
      }, 2000);
      return;
    }
    
    // Platform is 100% free - no active check needed

    const pred = predictions[matchId];
    if (!pred || pred.home_prediction === '' || pred.away_prediction === '') {
      showToast(picante(
        "Capture ambos marcadores antes de guardar.",
        "⚠️ ¡No andes de flojo! Ponle números a ambos marcadores antes de guardar.",
        spicyMode
      ));
      return;
    }

    setSavingState(prev => ({ ...prev, [matchId]: 'saving' }));

    try {
      // Get the session token to authenticate in our server endpoint
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No se encontró una sesión activa.');
      }

      const res = await fetch('/api/predictions/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          matchId,
          homePrediction: Number(pred.home_prediction),
          awayPrediction: Number(pred.away_prediction),
          simMode // Send the simulator mode!
        })
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Error al guardar pronóstico.');
      }

      setSavingState(prev => ({ ...prev, [matchId]: 'saved' }));
      setModifiedMatchIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(matchId);
        return newSet;
      });
      showToast(picante(
        "Pronóstico guardado exitosamente.",
        "⚽ ¡Golazo! Guardado al primer poste y con efecto.",
        spicyMode
      ));
    } catch (err: any) {
      console.error('Error saving prediction:', err.message);
      setSavingState(prev => ({ ...prev, [matchId]: 'error' }));
      showToast(picante(
        err.message || 'Error al guardar pronóstico.',
        "¡Híjole! Se nos ponchó el balón al guardar tu tiro. Inténtalo de nuevo.",
        spicyMode
      ));
    }
  };

  // Autofill empty predictions with realistic scores ("Lapicito Mágico")
  const handleAutoFill = () => {
    const realisticScores = [
      [1, 0], [2, 1], [1, 1], [0, 0], [0, 1], [1, 2], [2, 0], [0, 2], [2, 2], [3, 1], [1, 3], [3, 2], [2, 3]
    ];
    
    const newPredictions = { ...predictions };
    const newModified = new Set(modifiedMatchIds);
    let filledCount = 0;

    matches.forEach(match => {
      const locked = isMatchLocked(match);
      if (locked) return;

      const pred = predictions[match.id] || { home_prediction: '', away_prediction: '' };
      
      // Auto fill only if at least one input is empty
      if (pred.home_prediction === '' || pred.away_prediction === '') {
        const randomIndex = Math.floor(Math.random() * realisticScores.length);
        const [homeScore, awayScore] = realisticScores[randomIndex];

        newPredictions[match.id] = {
          match_id: match.id,
          home_prediction: String(homeScore),
          away_prediction: String(awayScore),
        };
        newModified.add(match.id);
        filledCount++;
      }
    });

    if (filledCount > 0) {
      playSound('magic');
      setPredictions(newPredictions);
      setModifiedMatchIds(newModified);
      showToast(picante(
        `Se han autocompletado ${filledCount} marcadores. No olvide guardarlos.`,
        `✨ ¡Al aventón! Autollenamos ${filledCount} marcadores. ¡Guárdalos antes de que se te vaya el tren! 🚊`,
        spicyMode
      ));
    } else {
      showToast(picante(
        'No hay marcadores vacíos o editables para autocompletar.',
        '⚠️ ¡Ya está todo listo! No andes de ocioso buscando qué más rellenar.',
        spicyMode
      ));
    }
  };

  // Clear all editable predictions back to empty strings and delete from DB
  const handleClearAll = async () => {
    if (!user) {
      showToast(picante(
        "Debe iniciar sesión o registrarse para limpiar sus pronósticos.",
        "⚠️ ¡Epa! Inicia sesión primero para poder limpiar marcadores.",
        spicyMode
      ));
      return;
    }

    let clearedCount = 0;
    const affectedMatchIds: string[] = [];

    matches.forEach(match => {
      const locked = isMatchLocked(match);
      if (locked) return;

      const pred = predictions[match.id];
      if (pred && (pred.home_prediction !== '' || pred.away_prediction !== '')) {
        affectedMatchIds.push(match.id);
        clearedCount++;
      }
    });

    if (clearedCount === 0) {
      showToast(picante(
        'No hay marcadores editables con datos para limpiar.',
        '⚠️ ¡Ya está limpio! No hay nada más que barrer aquí.',
        spicyMode
      ));
      return;
    }

    setIsBulkSaving(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No se encontró una sesión activa.');
      }

      // Call API to delete predictions from database
      const res = await fetch('/api/predictions/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          simMode
        })
      });

      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Error al eliminar los marcadores guardados.');
      }

      // Reset predictions locally, reset their saving state to idle, and remove from modified
      setPredictions(prev => {
        const next = { ...prev };
        affectedMatchIds.forEach(id => {
          const pred = prev[id];
          if (pred) {
            next[id] = {
              ...pred,
              home_prediction: '',
              away_prediction: ''
            };
          }
        });
        return next;
      });

      setModifiedMatchIds(prev => {
        const next = new Set(prev);
        affectedMatchIds.forEach(id => {
          next.delete(id);
        });
        return next;
      });

      setSavingState(prev => {
        const next = { ...prev };
        affectedMatchIds.forEach(id => {
          next[id] = 'idle'; // Reset to idle so the Save button shows "Guardar" again
        });
        return next;
      });

      showToast(picante(
        `Se han eliminado ${clearedCount} marcadores guardados y editables.`,
        `🗑️ ¡Borrón y cuenta nueva! Eliminamos tus ${clearedCount} marcadores. ¡Listos para capturar de nuevo!`,
        spicyMode
      ));
    } catch (err: any) {
      console.error('Error in handleClearAll:', err.message);
      showToast(picante(
        err.message || 'Error al limpiar los marcadores.',
        '¡Ups! Se ponchó el balón al intentar limpiar los marcadores en la base de datos.',
        spicyMode
      ));
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Bulk save all edited predictions
  const saveAllPredictions = async () => {
    if (!user) {
      showToast(picante(
        "Debe iniciar sesión o registrarse para guardar sus pronósticos.",
        "⚠️ ¡Epa, compadre! Regístrate o inicia sesión para guardar tus pronósticos de un jalón.",
        spicyMode
      ));
      setTimeout(() => {
        router.push('/login?redirect=/quiniela');
      }, 2000);
      return;
    }
    
    // Platform is 100% free - no active check needed

    const predictionsToSubmit: Array<{ matchId: string; homePrediction: number; awayPrediction: number }> = [];
    const affectedMatchIds: string[] = [];

    matches.forEach(match => {
      const locked = isMatchLocked(match);
      if (locked) return;

      if (modifiedMatchIds.has(match.id)) {
        const pred = predictions[match.id];
        if (pred && pred.home_prediction !== '' && pred.away_prediction !== '') {
          predictionsToSubmit.push({
            matchId: match.id,
            homePrediction: Number(pred.home_prediction),
            awayPrediction: Number(pred.away_prediction)
          });
          affectedMatchIds.push(match.id);
        }
      }
    });

    if (predictionsToSubmit.length === 0) {
      showToast(picante(
        'No hay cambios pendientes o válidos por guardar.',
        '⚠️ ¡No le muevas! No hay cambios nuevos por guardar.',
        spicyMode
      ));
      return;
    }

    setIsBulkSaving(true);
    
    setSavingState(prev => {
      const next = { ...prev };
      affectedMatchIds.forEach(id => {
        next[id] = 'saving';
      });
      return next;
    });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s safety timeout

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('No se encontró una sesión activa.');
      }

      const res = await fetch('/api/predictions/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          predictions: predictionsToSubmit,
          simMode
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const resData = await res.json();

      if (!res.ok) {
        throw new Error(resData.error || 'Error al guardar los pronósticos.');
      }

      setSavingState(prev => {
        const next = { ...prev };
        affectedMatchIds.forEach(id => {
          next[id] = 'saved';
        });
        return next;
      });
      playSound('airhorn');
      setModifiedMatchIds(new Set());
      showToast(picante(
        `Se han guardado ${predictionsToSubmit.length} pronósticos exitosamente.`,
        `💾 ¡A la red! Guardamos tus ${predictionsToSubmit.length} pronósticos de un solo trancazo.`,
        spicyMode
      ));
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error('Error in bulk saving predictions:', err);
      
      setSavingState(prev => {
        const next = { ...prev };
        affectedMatchIds.forEach(id => {
          next[id] = 'error';
        });
        return next;
      });
      
      const isTimeout = err.name === 'AbortError';
      showToast(picante(
        isTimeout ? 'La conexión tardó demasiado. Intente guardar de nuevo.' : (err.message || 'Error al guardar los pronósticos.'),
        isTimeout ? '⏰ ¡Tiempo fuera! El tiro tardó demasiado en llegar a la portería. Inténtalo de nuevo.' : "¡Chispas! Se nos desinfló el balón al intentar el tiro masivo. Vuélvele a calar.",
        spicyMode
      ));
    } finally {
      setIsBulkSaving(false);
    }
  };

  // Formatting dates locally
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

  const getMatchDayLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-MX', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  if ((loading || pageLoading) && matches.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--accent-neon-green)', fontWeight: 800 }}>
          Cargando Quiniela Deportiva...
        </div>
      </div>
    );
  }

  // Grouping Logics
  const groupedMatches: { [key: string]: Match[] } = {};

  if (activeTab === 'group') {
    matches.forEach(m => {
      if (!groupedMatches[m.group_name]) {
        groupedMatches[m.group_name] = [];
      }
      groupedMatches[m.group_name].push(m);
    });
  } else {
    matches.forEach(m => {
      const dayLabel = getMatchDayLabel(m.match_time);
      if (!groupedMatches[dayLabel]) {
        groupedMatches[dayLabel] = [];
      }
      groupedMatches[dayLabel].push(m);
    });
  }

  // Active status checks removed per user request: registered and confirmed users can save predictions immediately.
  const isInactive = false;

  return (
    <div>
      {/* Toast Message */}
      {toastMessage && (
        <div className="toast-msg">
          <CheckCircle2 size={18} style={{ color: 'var(--accent-neon-green)' }} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Fetch Error Display */}
      {fetchError && (
        <div className="glass-panel" style={{
          background: 'var(--panel-error-bg)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          marginBottom: '24px',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <ShieldAlert size={28} style={{ color: '#ef4444' }} />
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f87171', margin: 0 }}>Error al cargar datos</h3>
            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>{fetchError}</p>
          </div>
        </div>
      )}

      {/* Pending Confirmation Alert */}
      {isInactive && (
        <div className="glass-panel" style={{
          background: 'var(--panel-inactive-bg)',
          borderColor: 'rgba(245, 158, 11, 0.35)',
          marginBottom: '24px',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
        }}>
          <span style={{ fontSize: '2.2rem' }}>⏳</span>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-gold)', margin: 0 }}>
              Registro Pendiente de Confirmación
            </h3>
            <p style={{ margin: '6px 0 0 0', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.4' }}>
              Tu registro se ha completado con éxito, pero actualmente se encuentra **pendiente de confirmación y activación** por parte del administrador. 
              No podrás registrar ni guardar tus pronósticos hasta que tu cuenta sea confirmada por soporte técnico. ¡Muchas gracias por tu paciencia!
            </p>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>Captura tus Pronósticos</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Tienes hasta **{lockHours} horas antes** del inicio de cada partido para guardar o modificar tus resultados.
          </p>
        </div>

        {/* Test Simulator Controls & Tab switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          {profile?.is_admin && (
            <div style={{
              background: 'var(--panel-sim-bg)',
              border: '1px solid rgba(245, 158, 11, 0.2)',
              borderRadius: '12px',
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              backdropFilter: 'blur(8px)'
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                🔧 Simulación {lockHours}h
              </span>
              <select
                value={simMode}
                onChange={(e) => changeSimMode(e.target.value as any)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-glass)',
                  color: 'var(--text-primary)',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  outline: 'none'
                }}
              >
                <option value="real">⏱️ Tiempo Real (Normal)</option>
                <option value="bypass">🔓 Bypass (Desbloquear Todo)</option>
                <option value="force_all">🔒 Forzar Bloqueo Total</option>
                <option value="world_cup">📅 Simular Mundial (11-Jun-2026)</option>
              </select>
            </div>
          )}

          <div className="tab-container" style={{ margin: 0 }}>
            <button 
              className={`tab-btn ${activeTab === 'group' ? 'active' : ''}`}
              onClick={() => setActiveTab('group')}
            >
              Por Grupo
            </button>
            <button 
              className={`tab-btn ${activeTab === 'date' ? 'active' : ''}`}
              onClick={() => setActiveTab('date')}
            >
              Por Día
            </button>
          </div>
        </div>
      </div>

      {/* Premium Prediction Control Actions Bar */}
      <div className="glass-panel" style={{
        background: 'var(--panel-actions-bg)',
        border: '1px solid rgba(16, 185, 129, 0.15)',
        marginBottom: '24px',
        padding: '16px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px',
        borderRadius: '16px'
      }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase' }}>
            Acciones Rápidas
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            Usa el Llenado Mágico para completar pronósticos vacíos en un solo clic y modificarlos antes de guardar.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleAutoFill}
            disabled={pageLoading || isBulkSaving || isInactive}
            className="btn btn-secondary"
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              borderColor: isInactive ? 'rgba(255, 255, 255, 0.05)' : 'rgba(16, 185, 129, 0.3)',
              color: isInactive ? 'var(--text-muted)' : 'var(--accent-neon-green)',
              boxShadow: isInactive ? 'none' : '0 0 10px rgba(16, 185, 129, 0.05)',
              opacity: isInactive ? 0.4 : 1,
              cursor: isInactive ? 'not-allowed' : 'pointer'
            }}
          >
            <Sparkles size={16} />
            <span>Lapicito Mágico ✨</span>
          </button>

          <button
            onClick={handleClearAll}
            disabled={pageLoading || isBulkSaving || isInactive}
            className="btn btn-secondary"
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 800,
              fontSize: '0.85rem',
              borderColor: isInactive ? 'rgba(255, 255, 255, 0.05)' : 'rgba(239, 68, 68, 0.3)',
              color: isInactive ? 'var(--text-muted)' : '#f87171',
              boxShadow: isInactive ? 'none' : '0 0 10px rgba(239, 68, 68, 0.05)',
              opacity: isInactive ? 0.4 : 1,
              cursor: isInactive ? 'not-allowed' : 'pointer'
            }}
          >
            <Trash2 size={16} />
            <span>Limpiar todo 🗑️</span>
          </button>

          <button
            onClick={saveAllPredictions}
            disabled={modifiedMatchIds.size === 0 || isBulkSaving || isInactive}
            className="btn"
            style={{
              padding: '10px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontWeight: 850,
              fontSize: '0.85rem',
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
              background: (modifiedMatchIds.size > 0 && !isInactive) ? 'var(--accent-neon-green)' : 'var(--text-muted)',
              borderColor: (modifiedMatchIds.size > 0 && !isInactive) ? 'var(--accent-neon-green)' : 'var(--text-muted)',
              color: '#030712',
              boxShadow: (modifiedMatchIds.size > 0 && !isInactive) ? '0 0 15px var(--accent-neon-green-glow)' : 'none',
              opacity: (modifiedMatchIds.size > 0 && !isInactive) ? 1 : 0.5,
              cursor: (modifiedMatchIds.size > 0 && !isInactive) ? 'pointer' : 'not-allowed',
              transition: 'all 0.3s ease'
            }}
          >
            {isBulkSaving ? (
              <>
                <div className="animate-spin" style={{
                  width: '12px',
                  height: '12px',
                  border: '2px solid #030712',
                  borderTopColor: 'transparent',
                  borderRadius: '50%'
                }}></div>
                <span>Guardando todos...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Guardar Cambios ({modifiedMatchIds.size})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Simulation Information Banner */}
      {simMode !== 'real' && (
        <div className="glass-panel" style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(15, 23, 42, 0.95) 100%)',
          borderColor: 'rgba(245, 158, 11, 0.25)',
          marginBottom: '20px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.8rem' }}>
              {simMode === 'bypass' ? '🔓' : simMode === 'force_all' ? '🔒' : '📅'}
            </span>
            <div>
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-gold)' }}>
                {simMode === 'bypass' && 'Modo Bypass de Bloqueo Activo'}
                {simMode === 'force_all' && 'Modo Bloqueo Total Activo'}
                {simMode === 'world_cup' && 'Modo Simulación de Fecha Mundialista'}
              </h4>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {simMode === 'bypass' && 'Todos los partidos han sido desbloqueados para pruebas, sin importar su fecha u hora real.'}
                {simMode === 'force_all' && 'Todos los partidos han sido forzados a bloquearse para validar el estado de solo lectura.'}
                {simMode === 'world_cup' && 'Simulando fecha: 11-Junio-2026 16:00 UTC. Se bloquean automáticamente partidos antes de 12-Junio-2026 16:00 UTC.'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => changeSimMode('real')}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem', borderColor: 'rgba(245, 158, 11, 0.3)', color: 'var(--accent-gold)' }}
          >
            Volver a Tiempo Real
          </button>
        </div>
      )}

      {/* Fixtures grouping rendering */}
      {Object.keys(groupedMatches).length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '40px' }}>
          <Sparkles size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>No hay partidos programados en este momento.</p>
        </div>
      ) : (
        Object.keys(groupedMatches).map((groupName) => (
          <div key={groupName} style={{ marginBottom: '24px' }}>
            <h3 className="group-title">{groupName}</h3>
            <div className="matches-grid">
              {groupedMatches[groupName].map((match) => {
                const locked = isMatchLocked(match) || isInactive;
                const pred = predictions[match.id] || { home_prediction: '', away_prediction: '' };
                const saveStatus = savingState[match.id] || 'idle';

                return (
                  <div key={match.id} className="glass-card match-card" style={{
                    borderColor: locked ? 'var(--border-glass)' : 'rgba(255, 255, 255, 0.08)'
                  }}>
                    {/* Card Header */}
                    <div className="match-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="match-group-tag">{match.group_name}</span>
                        <div className="match-time-tag">
                          <Calendar size={12} />
                          <span>{formatMatchDate(match.match_time)}</span>
                        </div>
                      </div>
                      {(() => {
                        const status = getMatchLockStatus(match);
                        return (
                          <span style={{
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: status.type === 'locked' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            border: status.type === 'locked' ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid rgba(16, 185, 129, 0.25)',
                            color: status.type === 'locked' ? '#f87171' : 'var(--accent-neon-green)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.02em'
                          }}>
                            {status.text}
                          </span>
                        );
                      })()}
                    </div>

                    {/* Card Body */}
                    <div className="match-body">
                      {/* Home Team */}
                      <div className="team-column">
                        <div className="team-flag-container">
                          <img 
                            src={`https://flagcdn.com/w80/${match.home_flag}.png`} 
                            alt={match.home_team}
                            className="team-flag-img"
                            onError={(e) => {
                              // Fallback if flagcdn fails
                              (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/un.png';
                            }}
                          />
                        </div>
                        <span className="team-name" title={match.home_team}>{match.home_team}</span>
                      </div>

                      {/* Prediction Inputs */}
                      <div className="score-inputs-wrapper">
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="score-input"
                          maxLength={2}
                          value={pred.home_prediction}
                          onChange={(e) => handlePredictionChange(match.id, 'home', e.target.value)}
                          disabled={locked}
                        />
                        <span className="score-separator">:</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="score-input"
                          maxLength={2}
                          value={pred.away_prediction}
                          onChange={(e) => handlePredictionChange(match.id, 'away', e.target.value)}
                          disabled={locked}
                        />
                      </div>

                      {/* Away Team */}
                      <div className="team-column">
                        <div className="team-flag-container">
                          <img 
                            src={`https://flagcdn.com/w80/${match.away_flag}.png`} 
                            alt={match.away_team}
                            className="team-flag-img"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/un.png';
                            }}
                          />
                        </div>
                        <span className="team-name" title={match.away_team}>{match.away_team}</span>
                      </div>
                    </div>

                    {/* Actions and Status indicators */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                      {locked ? (
                        <div className="locked-badge">
                          <Lock size={12} />
                          <span>Partida Bloqueada</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => savePrediction(match.id)}
                          className="btn"
                          style={{
                            padding: '8px 16px',
                            fontSize: '0.82rem',
                            fontWeight: saveStatus === 'saved' ? '800' : '700',
                            letterSpacing: '0.01em',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: 1,
                            
                            // Dynamic background
                            background: saveStatus === 'saved'
                              ? 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)'
                              : saveStatus === 'saving'
                              ? 'rgba(255, 255, 255, 0.05)'
                              : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            
                            // Dynamic text color
                            color: saveStatus === 'saved'
                              ? '#ffffff'
                              : saveStatus === 'saving'
                              ? 'var(--text-muted)'
                              : '#030712',
                            
                            // Dynamic borders
                            border: saveStatus === 'saved'
                              ? '1px solid rgba(255, 255, 255, 0.25)'
                              : saveStatus === 'saving'
                              ? '1px solid var(--border-glass)'
                              : 'none',
                            
                            // Dynamic glows
                            boxShadow: saveStatus === 'saved'
                              ? '0 0 15px rgba(16, 185, 129, 0.65)'
                              : saveStatus === 'saving'
                              ? 'none'
                              : '0 4px 12px rgba(16, 185, 129, 0.25)',
                              
                            // Dynamic transform scale
                            transform: saveStatus === 'saved' ? 'scale(1.05)' : 'none'
                          }}
                          disabled={saveStatus === 'saving'}
                        >
                          {saveStatus === 'saving' ? (
                            <div className="animate-spin" style={{
                              width: '12px',
                              height: '12px',
                              border: '2px solid var(--text-muted)',
                              borderTopColor: 'transparent',
                              borderRadius: '50%'
                            }}></div>
                          ) : saveStatus === 'saved' ? (
                            <Check size={13} style={{ strokeWidth: 3 }} />
                          ) : (
                            <Save size={12} />
                          )}
                          <span>
                            {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? '¡Guardado!' : 'Guardar'}
                          </span>
                        </button>
                      )}

                      {/* Render official real-life scores if match is played */}
                      {(match.status === 'live' || match.status === 'finished') && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>
                            Marcador Real
                          </span>
                          <span className="sports-font" style={{ fontWeight: 800, color: match.status === 'live' ? 'var(--accent-red)' : 'var(--accent-neon-green)', fontSize: '1rem' }}>
                            {match.home_score} - {match.away_score} {match.status === 'live' && '🔴'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Render score analysis details if finished */}
                    {match.status === 'finished' && predictions[match.id] && (
                      <div className="prediction-box-meta">
                        <span>Puntos Obtenidos:</span>
                        {predictions[match.id]?.is_exact ? (
                          <span className="points-earned-tag" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(245, 158, 11, 0.3)', color: 'var(--accent-gold)' }}>
                            {getExactScoreBadgeText(`${match.id}-${user?.id}`, spicyMode, predictions[match.id]?.points_earned || 0)}
                          </span>
                        ) : (predictions[match.id]?.points_earned || 0) > 0 ? (
                          <span className="points-earned-tag">
                            ✅ Acertó Ganador/Empate +{predictions[match.id]?.points_earned} {predictions[match.id]?.points_earned === 1 ? 'pt' : 'pts'}
                          </span>
                        ) : (
                          (() => {
                            const blunderMsg = getEpicBlunderMsg(match, predictions[match.id], spicyMode);
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
                );
              })}
            </div>
          </div>
        ))
      )}

      {/* Translucent Glassmorphic Floating Save Bar */}
      {modifiedMatchIds.size > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '650px',
          background: 'var(--bg-toast)',
          border: '2px solid rgba(16, 185, 129, 0.5)',
          borderRadius: '20px',
          padding: '14px 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(16, 185, 129, 0.25)',
          backdropFilter: 'blur(16px)',
          zIndex: 1000,
          animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Keyframe animation injected inline */}
          <style>{`
            @keyframes slideUp {
              from {
                transform: translate(-50%, 100px);
                opacity: 0;
              }
              to {
                transform: translate(-50%, 0);
                opacity: 1;
              }
            }
          `}</style>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.2rem' }}>📝</span>
            <div>
              <span style={{ display: 'block', fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                Cambios sin Guardar
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-neon-green)', fontWeight: 600 }}>
                Tienes {modifiedMatchIds.size} {modifiedMatchIds.size === 1 ? 'pronóstico editado' : 'pronósticos editados'} pendientes de enviar.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleAutoFill}
              disabled={isBulkSaving}
              className="btn btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderColor: 'var(--border-glass)'
              }}
            >
              <span>Auto-llenar vacíos ✨</span>
            </button>
            
            <button
              onClick={saveAllPredictions}
              disabled={isBulkSaving}
              className="btn"
              style={{
                padding: '8px 16px',
                fontSize: '0.78rem',
                fontWeight: 900,
                background: 'var(--accent-neon-green)',
                borderColor: 'var(--accent-neon-green)',
                color: '#030712',
                boxShadow: '0 0 10px var(--accent-neon-green-glow)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {isBulkSaving ? (
                <>
                  <div className="animate-spin" style={{
                    width: '10px',
                    height: '10px',
                    border: '2px solid #030712',
                    borderTopColor: 'transparent',
                    borderRadius: '50%'
                  }}></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Save size={12} />
                  <span>Guardar Todo</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
