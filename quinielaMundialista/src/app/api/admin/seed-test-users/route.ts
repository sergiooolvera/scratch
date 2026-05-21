import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { adminId } = await req.json();

    if (!adminId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    // 1. Verify administrative privileges
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Operación no autorizada. Requiere rol de Administrador.' }, { status: 403 });
    }

    // 2. Retrieve system settings to use for predictions points
    const { data: settings } = await supabaseAdmin
      .from('qui_system_settings')
      .select('*')
      .eq('id', 'points_config')
      .single();

    const ptsExact = settings ? Number(settings.points_exact_score) : 3;
    const ptsWinner = settings ? Number(settings.points_correct_winner) : 1;
    const ptsDraw = settings ? Number(settings.points_correct_draw) : 1;

    // 3. Purge existing test users to keep the database clean and repeatable
    const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (!listError && listData?.users) {
      const testUsers = listData.users.filter(u => u.email?.endsWith('@quimundial.test'));
      for (const tu of testUsers) {
        await supabaseAdmin.auth.admin.deleteUser(tu.id);
      }
    }

    // 4. Mock player definitions
    const mockPlayers = [
      { name: 'Pedro Gol', username: 'pedrogol' },
      { name: 'Súper Messi', username: 'supermessi' },
      { name: 'Táctico MX', username: 'tactico_mx' },
      { name: 'Chicharito Fan', username: 'chicha_fan' },
      { name: 'Golazo Regio', username: 'golazo_regio' },
      { name: 'Maga del Balón', username: 'maga_balon' },
      { name: 'Rompe Redes', username: 'romperedes' },
      { name: 'Defensa Férrea', username: 'defensa_ferrea' },
      { name: 'Estratega Real', username: 'estratega_real' },
      { name: 'Capi Cruz', username: 'capicruz' }
    ];

    // Fetch all available matches
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('qui_matches')
      .select('id, home_score, away_score, status');

    if (matchesError || !matches) {
      throw new Error(matchesError?.message || 'No hay partidos en la base de datos.');
    }

    const seededUsers = [];

    // 5. Seed users & predictions
    for (let i = 0; i < mockPlayers.length; i++) {
      const player = mockPlayers[i];
      const email = `${player.username}@quimundial.test`;

      // Create authentication profile bypass confirmation
      const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'password_test_123',
        email_confirm: true,
        user_metadata: {
          full_name: player.name,
          username: player.username
        }
      });

      if (createError || !userData?.user) {
        console.error(`Error creating ${email}:`, createError?.message);
        continue;
      }

      const userId = userData.user.id;
      seededUsers.push({ id: userId, name: player.name });

      // Active state is set automatically to false by trigger, we override it to active
      await supabaseAdmin
        .from('qui_profiles')
        .update({ 
          is_active: true,
          username: player.username,
          full_name: player.name
        })
        .eq('id', userId);

      // Generate randomized predictions
      const predictionsToInsert = matches.map(match => {
        // Semi-realistic predictions: higher probability of 0, 1, 2, 3 goals
        const homePred = Math.floor(Math.random() * 4);
        const awayPred = Math.floor(Math.random() * 4);

        let points = 0;
        let isExact = false;

        if (match.status === 'finished' && match.home_score !== null && match.away_score !== null) {
          const realWinner = match.home_score > match.away_score ? 'home' : match.home_score < match.away_score ? 'away' : 'draw';
          const predWinner = homePred > awayPred ? 'home' : homePred < awayPred ? 'away' : 'draw';

          if (homePred === match.home_score && awayPred === match.away_score) {
            points = ptsExact;
            isExact = true;
          } else if (realWinner === predWinner) {
            points = realWinner === 'draw' ? ptsDraw : ptsWinner;
          }
        }

        return {
          user_id: userId,
          match_id: match.id,
          home_prediction: homePred,
          away_prediction: awayPred,
          points_earned: points,
          is_exact: isExact
        };
      });

      // Insert predictions
      const { error: predInsertError } = await supabaseAdmin
        .from('qui_predictions')
        .insert(predictionsToInsert);

      if (predInsertError) {
        console.error(`Error inserting predictions for ${player.username}:`, predInsertError.message);
        continue;
      }

      // 6. Recalculate standing statistics for the mock user
      const { data: userPreds } = await supabaseAdmin
        .from('qui_predictions')
        .select(`
          points_earned,
          is_exact,
          home_prediction,
          away_prediction,
          qui_matches!inner(home_score, away_score)
        `)
        .eq('user_id', userId);

      let totalPoints = 0;
      let exactCount = 0;
      let totalGoalDiffError = 0;

      userPreds?.forEach((up: any) => {
        totalPoints += (up.points_earned || 0);
        if (up.is_exact) exactCount++;

        const predDiff = up.home_prediction - up.away_prediction;
        const realDiff = up.qui_matches.home_score - up.qui_matches.away_score;
        totalGoalDiffError += Math.abs(predDiff - realDiff);
      });

      await supabaseAdmin
        .from('qui_profiles')
        .update({
          points: totalPoints,
          exact_scores: exactCount,
          goal_difference: totalGoalDiffError
        })
        .eq('id', userId);
    }

    return NextResponse.json({ 
      success: true, 
      message: `¡Clonación exitosa! Se inyectaron ${seededUsers.length} participantes de prueba con predicciones aleatorias activas.`,
      users: seededUsers
    });
  } catch (err: any) {
    console.error('Error seeding test users:', err.message);
    return NextResponse.json({ error: `Internal Server Error: ${err.message}` }, { status: 500 });
  }
}
