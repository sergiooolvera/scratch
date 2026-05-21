import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Token de autenticación faltante.' }, { status: 401 });
    }

    // 1. Authenticate the user securely using Supabase Admin Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Sesión inválida o expirada.' }, { status: 401 });
    }

    const { matchId, homePrediction, awayPrediction, simMode } = await req.json();

    if (!matchId || homePrediction === undefined || awayPrediction === undefined) {
      return NextResponse.json({ error: 'Parámetros obligatorios faltantes.' }, { status: 400 });
    }

    // 2. Fetch the user profile to verify active status
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('qui_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado.' }, { status: 404 });
    }

    if (!profile.is_active && simMode !== 'bypass') {
      return NextResponse.json({ error: 'Se requiere realizar la aportación voluntaria de mantenimiento para registrar pronósticos.' }, { status: 403 });
    }

    // 3. Fetch the match details
    const { data: match, error: matchError } = await supabaseAdmin
      .from('qui_matches')
      .select('*')
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      return NextResponse.json({ error: 'Partido no encontrado.' }, { status: 404 });
    }

    // 4. Fetch the system settings for lockout duration
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('qui_system_settings')
      .select('lock_hours_before')
      .eq('id', 'points_config')
      .single();

    const lockHours = settingsError || !settings ? 24 : settings.lock_hours_before;

    // 5. Evaluate if match is locked
    let isLocked = false;
    let lockReason = '';

    if (simMode === 'bypass') {
      isLocked = false;
    } else if (simMode === 'force_all') {
      isLocked = true;
      lockReason = 'Modo simulación de bloqueo total activo.';
    } else if (match.status === 'live' || match.status === 'finished') {
      isLocked = true;
      lockReason = match.status === 'live' ? 'El partido ya está en vivo.' : 'El partido ya finalizó.';
    } else if (match.is_locked) {
      isLocked = true;
      lockReason = 'El partido ha sido bloqueado individualmente por el administrador.';
    } else {
      let currentTime = Date.now();
      if (simMode === 'world_cup') {
        // Simulate June 11, 2026, at 16:00:00 UTC (during the cup)
        currentTime = new Date('2026-06-11T16:00:00Z').getTime();
      }

      const matchTime = new Date(match.match_time).getTime();
      const lockInterval = lockHours * 60 * 60 * 1000;

      if ((matchTime - currentTime) < lockInterval) {
        isLocked = true;
        lockReason = `El partido se bloquea ${lockHours} horas antes de su inicio.`;
      }
    }

    if (isLocked) {
      return NextResponse.json({ error: `Partido bloqueado: ${lockReason}` }, { status: 400 });
    }

    // 6. Upsert the prediction using the admin client (bypasses client-side RLS limits)
    const { error: upsertError } = await supabaseAdmin
      .from('qui_predictions')
      .upsert({
        user_id: user.id,
        match_id: matchId,
        home_prediction: Number(homePrediction),
        away_prediction: Number(awayPrediction),
      }, {
        onConflict: 'user_id,match_id'
      });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ success: true, message: 'Pronóstico guardado exitosamente.' });
  } catch (err: any) {
    console.error('Error in save prediction API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
