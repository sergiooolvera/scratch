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
    const { simMode } = body;

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
      return NextResponse.json({ error: 'Se requiere realizar la aportación voluntaria de mantenimiento.' }, { status: 403 });
    }

    // 3. Fetch all match details to determine which are editable
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('qui_matches')
      .select('*');

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

    // 5. Evaluate which matches are NOT locked
    const unlockedMatchIds: string[] = [];
    const currentTime = Date.now();
    const lockInterval = lockHours * 60 * 60 * 1000;
    const simTime = simMode === 'world_cup' ? new Date('2026-06-11T16:00:00Z').getTime() : currentTime;

    for (const match of matches) {
      let isLocked = false;

      if (simMode === 'bypass') {
        isLocked = false;
      } else if (simMode === 'force_all') {
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

      if (!isLocked) {
        unlockedMatchIds.push(match.id);
      }
    }

    if (unlockedMatchIds.length === 0) {
      return NextResponse.json({ error: 'No hay partidos desbloqueados para limpiar.' }, { status: 400 });
    }

    // 6. Delete predictions for unlocked matches of this user
    const { error: deleteError } = await supabaseAdmin
      .from('qui_predictions')
      .delete()
      .eq('user_id', user.id)
      .in('match_id', unlockedMatchIds);

    if (deleteError) {
      throw deleteError;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Se han eliminado los pronósticos de partidos editables.` 
    });
  } catch (err: any) {
    console.error('Error in clear prediction API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
