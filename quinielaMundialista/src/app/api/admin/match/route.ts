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

    if (updates.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay partidos para actualizar.' });
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

    // Prepare match IDs
    const matchIds = updates.map(u => u.matchId);

    // 3. Update all matches using Promise.all to save time
    await Promise.all(updates.map(update => 
      supabaseAdmin
        .from('qui_matches')
        .update({
          home_score: update.homeScore,
          away_score: update.awayScore,
          status: 'finished'
        })
        .eq('id', update.matchId)
    ));

    // 4. Fetch all user predictions for THESE matches (paging to bypass 1000 limit)
    let allPredictions: any[] = [];
    let pagePreds = 0;
    const pageSize = 1000;
    let hasMorePreds = true;

    while (hasMorePreds) {
      const { data, error: predsError } = await supabaseAdmin
        .from('qui_predictions')
        .select('*')
        .in('match_id', matchIds)
        .range(pagePreds * pageSize, (pagePreds + 1) * pageSize - 1);

      if (predsError) throw predsError;
      if (!data || data.length === 0) {
        hasMorePreds = false;
      } else {
        allPredictions = allPredictions.concat(data);
        if (data.length < pageSize) {
          hasMorePreds = false;
        } else {
          pagePreds++;
        }
      }
    }

    // 5. Evaluate points for each prediction and save them
    if (allPredictions && allPredictions.length > 0) {
      const predictionsToUpdate = allPredictions.map((pred: any) => {
        const matchUpdate = updates.find(u => u.matchId === pred.match_id);
        if (!matchUpdate) return null;

        const { homeScore: hScore, awayScore: aScore } = matchUpdate;
        let points = ptsIncorrect;
        let isExact = false;

        const pHome = Number(pred.home_prediction);
        const pAway = Number(pred.away_prediction);

        const realWinner = hScore > aScore ? 'home' : hScore < aScore ? 'away' : 'draw';
        const predWinner = pHome > pAway ? 'home' : pHome < pAway ? 'away' : 'draw';

        if (pHome === hScore && pAway === aScore) {
          points = ptsExact;
          isExact = true;
        } else if (realWinner === predWinner) {
          if (realWinner === 'draw') {
            points = ptsDraw;
          } else {
            points = ptsWinner;
          }
        }

        return {
          id: pred.id,
          points_earned: points,
          is_exact: isExact
        };
      }).filter(Boolean);

      // Bulk update predictions (using Promise.all for safety instead of upsert if we miss fields)
      const chunkSize = 50;
      for (let i = 0; i < predictionsToUpdate.length; i += chunkSize) {
        const chunk = predictionsToUpdate.slice(i, i + chunkSize);
        await Promise.all(chunk.map((p: any) => 
          supabaseAdmin.from('qui_predictions').update({
            points_earned: p.points_earned,
            is_exact: p.is_exact
          }).eq('id', p.id)
        ));
      }
    }

    // 6. Recalculate total points, exact scores, and goal difference for ALL profiles (paging to bypass 1000 limit)
    let profiles: any[] = [];
    let pageProfiles = 0;
    const pageSizeProfiles = 1000;
    let hasMoreProfiles = true;

    while (hasMoreProfiles) {
      const { data, error: profilesError } = await supabaseAdmin
        .from('qui_profiles')
        .select('id')
        .range(pageProfiles * pageSizeProfiles, (pageProfiles + 1) * pageSizeProfiles - 1);

      if (profilesError) throw profilesError;
      if (!data || data.length === 0) {
        hasMoreProfiles = false;
      } else {
        profiles = profiles.concat(data);
        if (data.length < pageSizeProfiles) {
          hasMoreProfiles = false;
        } else {
          pageProfiles++;
        }
      }
    }

    let finishedPreds: any[] = [];
    let pageFinished = 0;
    const pageSizeFinished = 1000;
    let hasMoreFinished = true;

    while (hasMoreFinished) {
      const { data, error: finishedPredsError } = await supabaseAdmin
        .from('qui_predictions')
        .select(`
          user_id,
          points_earned,
          is_exact,
          home_prediction,
          away_prediction,
          match_id,
          qui_matches!inner(home_score, away_score, status)
        `)
        .eq('qui_matches.status', 'finished')
        .range(pageFinished * pageSizeFinished, (pageFinished + 1) * pageSizeFinished - 1);

      if (finishedPredsError) throw finishedPredsError;
      if (!data || data.length === 0) {
        hasMoreFinished = false;
      } else {
        finishedPreds = finishedPreds.concat(data);
        if (data.length < pageSizeFinished) {
          hasMoreFinished = false;
        } else {
          pageFinished++;
        }
      }
    }

    // Group predictions by user
    const userStats: Record<string, any> = {};
    profiles.forEach((p: any) => {
      userStats[p.id] = { totalPoints: 0, exactCount: 0, totalPredGoals: 0, totalRealGoals: 0 };
    });

    finishedPreds?.forEach((up: any) => {
      if (!userStats[up.user_id]) return;
      if (up.qui_matches.home_score === null || up.qui_matches.away_score === null) return;

      userStats[up.user_id].totalPoints += (up.points_earned || 0);
      if (up.is_exact) userStats[up.user_id].exactCount++;

      userStats[up.user_id].totalPredGoals += (Number(up.home_prediction) + Number(up.away_prediction));
      userStats[up.user_id].totalRealGoals += (Number(up.qui_matches.home_score) + Number(up.qui_matches.away_score));
    });

    // Prepare profile updates
    const profilesToUpdate = Object.keys(userStats).map((userId: string) => {
      const stats = userStats[userId];
      return {
        id: userId,
        points: stats.totalPoints,
        exact_scores: stats.exactCount,
        goal_difference: Math.abs(stats.totalPredGoals - stats.totalRealGoals)
      };
    });

    // Update profiles in chunks
    const profChunkSize = 50;
    for (let i = 0; i < profilesToUpdate.length; i += profChunkSize) {
      const chunk = profilesToUpdate.slice(i, i + profChunkSize);
      await Promise.all(chunk.map((prof: any) => 
        supabaseAdmin.from('qui_profiles').update({
          points: prof.points,
          exact_scores: prof.exact_scores,
          goal_difference: prof.goal_difference
        }).eq('id', prof.id)
      ));
    }

    // 7. Generate dynamic scoring recap notifications
    const { data: matchDetails } = await supabaseAdmin
      .from('qui_matches')
      .select('id, home_team, away_team')
      .in('id', matchIds);

    const matchMap: Record<string, any> = {};
    matchDetails?.forEach((m: any) => matchMap[m.id] = m);

    // Fetch final rankings (paging to bypass 1000 limit)
    let updatedRankings: any[] = [];
    let pageRankings = 0;
    const pageSizeRankings = 1000;
    let hasMoreRankings = true;

    while (hasMoreRankings) {
      const { data, error: rankingsError } = await supabaseAdmin
        .from('qui_profiles')
        .select('id, points')
        .order('points', { ascending: false })
        .order('exact_scores', { ascending: false })
        .order('goal_difference', { ascending: true })
        .range(pageRankings * pageSizeRankings, (pageRankings + 1) * pageSizeRankings - 1);

      if (rankingsError) throw rankingsError;
      if (!data || data.length === 0) {
        hasMoreRankings = false;
      } else {
        updatedRankings = updatedRankings.concat(data);
        if (data.length < pageSizeRankings) {
          hasMoreRankings = false;
        } else {
          pageRankings++;
        }
      }
    }

    const notificationsToInsert: any[] = [];

    if (updatedRankings && allPredictions) {
      for (const update of updates) {
        const mId = update.matchId;
        const hScore = update.homeScore;
        const aScore = update.awayScore;
        const matchData = matchMap[mId];
        
        if (!matchData) continue;

        const homeTeamName = matchData.home_team || 'Local';
        const awayTeamName = matchData.away_team || 'Visitante';

        const matchPreds = allPredictions.filter((p: any) => p.match_id === mId);
        const predictionMap = new Map();
        matchPreds.forEach((p: any) => predictionMap.set(p.user_id, p));

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

          notificationsToInsert.push({
            user_id: prof.id,
            message: notifMsg,
            read: false
          });
        }
      }
    }

    // Insert all notifications in chunks
    const notifChunkSize = 500;
    for (let i = 0; i < notificationsToInsert.length; i += notifChunkSize) {
      await supabaseAdmin
        .from('qui_notifications')
        .insert(notificationsToInsert.slice(i, i + notifChunkSize));
    }

    return NextResponse.json({ success: true, message: 'Resultados procesados y clasificaciones actualizadas exitosamente.' });
  } catch (err: any) {
    console.error('Error inside match API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
