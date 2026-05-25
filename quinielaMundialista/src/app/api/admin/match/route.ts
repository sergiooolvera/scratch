import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const { matchId, homeScore, awayScore, adminId, matches } = await req.json();

    if (!adminId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos.' }, { status: 400 });
    }

    // 1. Verify that the requester is an admin
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Operación no autorizada. Requiere rol de Administrador.' }, { status: 403 });
    }

    // Normalize inputs into an array of match updates
    let updates: { matchId: string; homeScore: number; awayScore: number }[] = [];
    if (matches && Array.isArray(matches)) {
      updates = matches;
    } else if (matchId !== undefined && homeScore !== undefined && awayScore !== undefined) {
      updates = [{ matchId, homeScore: Number(homeScore), awayScore: Number(awayScore) }];
    } else {
      return NextResponse.json({ error: 'Faltan parámetros de partidos para actualizar.' }, { status: 400 });
    }

    // 2. Fetch the system settings to get active scoring points configuration
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from('qui_system_settings')
      .select('*')
      .eq('id', 'points_config')
      .single();

    if (settingsError || !settings) {
      return NextResponse.json({ error: 'No se pudo cargar la configuración de puntuación.' }, { status: 500 });
    }

    const ptsExact = Number(settings.points_exact_score);
    const ptsWinner = Number(settings.points_correct_winner);
    const ptsDraw = Number(settings.points_correct_draw);
    const ptsIncorrect = Number(settings.points_incorrect);

    // Process each match score and predictions
    for (const update of updates) {
      const { matchId: mId, homeScore: hScore, awayScore: aScore } = update;

      // 3. Update the match score and set status to finished in qui_matches
      const { error: matchUpdateError } = await supabaseAdmin
        .from('qui_matches')
        .update({
          home_score: hScore,
          away_score: aScore,
          status: 'finished'
        })
        .eq('id', mId);

      if (matchUpdateError) throw matchUpdateError;

      // 4. Fetch all user predictions for this match
      const { data: predictions, error: predsError } = await supabaseAdmin
        .from('qui_predictions')
        .select('*')
        .eq('match_id', mId);

      if (predsError) throw predsError;

      // 5. Evaluate points for each prediction and save them
      if (predictions && predictions.length > 0) {
        for (const pred of predictions) {
          let points = ptsIncorrect;
          let isExact = false;

          const pHome = Number(pred.home_prediction);
          const pAway = Number(pred.away_prediction);

          // Actual outcomes
          const realWinner = hScore > aScore ? 'home' : hScore < aScore ? 'away' : 'draw';
          const predWinner = pHome > pAway ? 'home' : pHome < pAway ? 'away' : 'draw';

          if (pHome === hScore && pAway === aScore) {
            // Exact score
            points = ptsExact;
            isExact = true;
          } else if (realWinner === predWinner) {
            // Correct winner or correct draw
            if (realWinner === 'draw') {
              points = ptsDraw;
            } else {
              points = ptsWinner;
            }
          }

          // Save prediction outcome
          await supabaseAdmin
            .from('qui_predictions')
            .update({
              points_earned: points,
              is_exact: isExact
            })
            .eq('id', pred.id);
        }
      }
    }

    // 6. Recalculate total points, exact scores, and goal difference for ALL profiles
    // We fetch all active users
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('qui_profiles')
      .select('id');

    if (profilesError) throw profilesError;

    for (const prof of profiles) {
      // Fetch all predictions of this specific user that correspond to FINISHED matches
      const { data: userPreds, error: userPredsError } = await supabaseAdmin
        .from('qui_predictions')
        .select(`
          points_earned,
          is_exact,
          home_prediction,
          away_prediction,
          qui_matches!inner(home_score, away_score)
        `)
        .eq('user_id', prof.id);

      if (userPredsError) continue;

      let totalPoints = 0;
      let exactCount = 0;
      let totalPredGoals = 0;
      let totalRealGoals = 0;

      userPreds?.forEach((up: any) => {
        // Solo considerar partidos finalizados (que ya tienen marcador oficial registrado)
        if (up.qui_matches.home_score === null || up.qui_matches.away_score === null) {
          return;
        }

        totalPoints += (up.points_earned || 0);
        if (up.is_exact) exactCount++;

        totalPredGoals += (Number(up.home_prediction) + Number(up.away_prediction));
        totalRealGoals += (Number(up.qui_matches.home_score) + Number(up.qui_matches.away_score));
      });

      const totalGoalDiff = Math.abs(totalPredGoals - totalRealGoals);

      // Update the user's standing metrics
      await supabaseAdmin
        .from('qui_profiles')
        .update({
          points: totalPoints,
          exact_scores: exactCount,
          goal_difference: totalGoalDiff
        })
        .eq('id', prof.id);
    }

    // 7. Generate dynamic scoring recap notifications for all users for each match
    for (const update of updates) {
      const { matchId: mId, homeScore: hScore, awayScore: aScore } = update;
      try {
        // Fetch match details for the notification message
        const { data: matchData } = await supabaseAdmin
          .from('qui_matches')
          .select('home_team, away_team')
          .eq('id', mId)
          .single();
        
        const homeTeamName = matchData?.home_team || 'Local';
        const awayTeamName = matchData?.away_team || 'Visitante';

        // Fetch all predictions for this match again to get exact prediction numbers
        const { data: matchPredictions } = await supabaseAdmin
          .from('qui_predictions')
          .select('user_id, home_prediction, away_prediction')
          .eq('match_id', mId);
        
        const predictionMap = new Map();
        matchPredictions?.forEach((p: any) => {
          predictionMap.set(p.user_id, p);
        });

        // Fetch final rankings sorted by tie-breakers
        const { data: updatedRankings } = await supabaseAdmin
          .from('qui_profiles')
          .select('id, points')
          .order('points', { ascending: false })
          .order('exact_scores', { ascending: false })
          .order('goal_difference', { ascending: true });

        if (updatedRankings) {
          for (let i = 0; i < updatedRankings.length; i++) {
            const prof = updatedRankings[i];
            const rank = i + 1;
            const pred = predictionMap.get(prof.id);
            
            let notifMsg = '';
            if (pred) {
              const pHome = Number(pred.home_prediction);
              const pAway = Number(pred.away_prediction);
              
              let pointsEarned = 0;
              let matchOutcomeText = 'errado';
              
              const realWinner = hScore > aScore ? 'home' : hScore < aScore ? 'away' : 'draw';
              const predWinner = pHome > pAway ? 'home' : pHome < pAway ? 'away' : 'draw';
              
              if (pHome === hScore && pAway === aScore) {
                pointsEarned = ptsExact;
                matchOutcomeText = 'Exacto';
              } else if (realWinner === predWinner) {
                if (realWinner === 'draw') {
                  pointsEarned = ptsDraw;
                  matchOutcomeText = 'Resultado correcto (Empate)';
                } else {
                  pointsEarned = ptsWinner;
                  matchOutcomeText = 'Resultado correcto (Ganador)';
                }
              } else {
                pointsEarned = ptsIncorrect;
                matchOutcomeText = 'Errado';
              }
              
              notifMsg = `Marcador oficial: ${homeTeamName} ${hScore} - ${aScore} ${awayTeamName}. Tu pronóstico: ${pHome} - ${pAway} (${matchOutcomeText}). Sumaste +${pointsEarned} pts. Ocupas el puesto #${rank} con ${prof.points} pts.`;
            } else {
              notifMsg = `Marcador oficial: ${homeTeamName} ${hScore} - ${aScore} ${awayTeamName}. No registraste pronóstico para este partido (+0 pts). Ocupas el puesto #${rank} con ${prof.points} pts.`;
            }

            // Insert notification
            await supabaseAdmin
              .from('qui_notifications')
              .insert({
                user_id: prof.id,
                message: notifMsg,
                read: false
              });
          }
        }
      } catch (notifErr: any) {
        console.error('Failed to generate notifications:', notifErr.message);
      }
    }

    return NextResponse.json({ success: true, message: 'Resultados procesados y clasificaciones actualizadas exitosamente.' });
  } catch (err: any) {
    console.error('Error inside match API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
