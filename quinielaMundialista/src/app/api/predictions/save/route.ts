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

    const body = await req.json();
    const { predictions, matchId, homePrediction, awayPrediction, simMode } = body;

    // Standardize input into a predictions array
    let predictionsToSave: Array<{ matchId: string; homePrediction: number | string; awayPrediction: number | string }> = [];

    if (predictions && Array.isArray(predictions)) {
      predictionsToSave = predictions;
    } else if (matchId && homePrediction !== undefined && awayPrediction !== undefined) {
      predictionsToSave = [{ matchId, homePrediction, awayPrediction }];
    } else {
      return NextResponse.json({ error: 'Parámetros obligatorios faltantes.' }, { status: 400 });
    }

    if (predictionsToSave.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay predicciones para guardar.' });
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

    // Active profile check removed per user request: once registered and confirmed, they can save predictions.


    // 3. Fetch all match details related to these predictions
    const matchIds = predictionsToSave.map(p => p.matchId);
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('qui_matches')
      .select('*')
      .in('id', matchIds);

    if (matchesError || !matches) {
      console.error('Error fetching matches:', matchesError?.message);
      return NextResponse.json({ error: 'Error al recuperar detalles de los partidos.' }, { status: 500 });
    }

    // 4. Fetch the system settings for lockout duration
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('qui_system_settings')
      .select('lock_hours_before')
      .eq('id', 'points_config')
      .single();

    const lockHours = settingsError || !settings ? 24 : settings.lock_hours_before;

    // 5. Evaluate which predictions are NOT locked and filter them
    const unlockedPredictions = [];
    const currentTime = Date.now();
    const lockInterval = lockHours * 60 * 60 * 1000;
    
    // Security check: Only admins can use simulated modes
    const effectiveSimMode = profile.is_admin ? simMode : 'real';
    const simTime = effectiveSimMode === 'world_cup' ? new Date('2026-06-11T16:00:00Z').getTime() : currentTime;

    for (const pred of predictionsToSave) {
      const match = matches.find((m: any) => m.id === pred.matchId);
      if (!match) continue;

      let isLocked = false;

      if (effectiveSimMode === 'bypass') {
        isLocked = false;
      } else if (effectiveSimMode === 'force_all') {
        isLocked = true;
      } else if (match.status === 'live' || match.status === 'finished') {
        isLocked = true;
      } else if (match.is_locked) {
        isLocked = true;
      } else {
        const matchTime = new Date(match.match_time).getTime();
        if ((matchTime - simTime) < lockInterval) {
          isLocked = true;
        }
      }

      if (!isLocked && pred.homePrediction !== '' && pred.awayPrediction !== '') {
        unlockedPredictions.push({
          user_id: user.id,
          match_id: pred.matchId,
          home_prediction: Number(pred.homePrediction),
          away_prediction: Number(pred.awayPrediction),
        });
      }
    }

    if (unlockedPredictions.length === 0) {
      return NextResponse.json({ error: 'Todos los partidos seleccionados se encuentran bloqueados o con marcadores incompletos.' }, { status: 400 });
    }

    // 6. Bulk upsert the predictions using the admin client
    const { error: upsertError } = await supabaseAdmin
      .from('qui_predictions')
      .upsert(unlockedPredictions, {
        onConflict: 'user_id,match_id'
      });

    if (upsertError) {
      throw upsertError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se han guardado ${unlockedPredictions.length} pronósticos exitosamente.` 
    });
  } catch (err: any) {
    console.error('Error in save prediction API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
