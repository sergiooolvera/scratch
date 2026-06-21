import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const {
      adminId,
      points_exact_score,
      points_correct_winner,
      points_correct_draw,
      points_incorrect,
      lock_hours_before,
      ticket_cost,
      pool_accumulated,
      pct_first_place,
      pct_second_place,
      pct_third_place,
      seller_commission_1_10,
      seller_commission_11_25,
      seller_commission_26_up
    } = await req.json();

    if (!adminId) {
      return NextResponse.json({ error: 'Parámetro adminId faltante.' }, { status: 400 });
    }

    // 1. Verify admin role
    const { data: adminProfile, error: adminError } = await supabaseAdmin
      .from('qui_profiles')
      .select('is_admin')
      .eq('id', adminId)
      .single();

    if (adminError || !adminProfile || !adminProfile.is_admin) {
      return NextResponse.json({ error: 'Operación no autorizada.' }, { status: 403 });
    }

    const safeNum = (val: any, fallback: number) => (val !== undefined && val !== null && !isNaN(Number(val))) ? Number(val) : fallback;

    // 2. Perform updates to settings
    const { error: updateError } = await supabaseAdmin
      .from('qui_system_settings')
      .upsert({
        id: 'points_config',
        points_exact_score: safeNum(points_exact_score, 5),
        points_correct_winner: safeNum(points_correct_winner, 1),
        points_correct_draw: safeNum(points_correct_draw, 1),
        points_incorrect: safeNum(points_incorrect, 1),
        lock_hours_before: safeNum(lock_hours_before, 24),
        ticket_cost: safeNum(ticket_cost, 200.00),
        pool_accumulated: safeNum(pool_accumulated, 0.00),
        pct_first_place: safeNum(pct_first_place, 50),
        pct_second_place: safeNum(pct_second_place, 25),
        pct_third_place: safeNum(pct_third_place, 5),
        seller_commission_1_10: safeNum(seller_commission_1_10, 0.20),
        seller_commission_11_25: safeNum(seller_commission_11_25, 0.25),
        seller_commission_26_up: safeNum(seller_commission_26_up, 0.30),
      });

    if (updateError) throw updateError;

    // 3. Recalculate all predictions and profiles since points configuration changed
    const ptsExact = safeNum(points_exact_score, 5);
    const ptsWinner = safeNum(points_correct_winner, 1);
    const ptsDraw = safeNum(points_correct_draw, 1);
    const ptsIncorrect = safeNum(points_incorrect, 1);

    // Fetch all matches
    const { data: matches, error: matchesError } = await supabaseAdmin
      .from('qui_matches')
      .select('*');

    if (matchesError) throw matchesError;
    const matchesMap: Record<string, any> = {};
    matches?.forEach((m: any) => matchesMap[m.id] = m);

    // Fetch all predictions (paging to bypass 1000 limit)
    let allPredictions: any[] = [];
    let pagePreds = 0;
    const pageSize = 1000;
    let hasMorePreds = true;

    while (hasMorePreds) {
      const { data, error: predsError } = await supabaseAdmin
        .from('qui_predictions')
        .select('*')
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

    const predictionsToUpdate: any[] = [];
    allPredictions.forEach(pred => {
      const match = matchesMap[pred.match_id];
      if (!match || match.status !== 'finished') return;
      if (match.home_score === null || match.away_score === null) return;

      const hScore = Number(match.home_score);
      const aScore = Number(match.away_score);
      const pHome = Number(pred.home_prediction);
      const pAway = Number(pred.away_prediction);

      let points = ptsIncorrect;
      let isExact = false;

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

      if (pred.points_earned !== points || pred.is_exact !== isExact) {
        predictionsToUpdate.push({
          id: pred.id,
          points_earned: points,
          is_exact: isExact
        });
      }
    });

    // Update predictions in chunks
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

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('qui_profiles')
      .select('id');

    if (profilesError) throw profilesError;

    // Recalculate stats for all profiles
    const userStats: Record<string, any> = {};
    profiles.forEach((p: any) => {
      userStats[p.id] = { totalPoints: 0, exactCount: 0, totalPredGoals: 0, totalRealGoals: 0 };
    });

    // Fetch all finished predictions again to make sure we have the updated scores
    let finishedPreds: any[] = [];
    let pageFinished = 0;
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
        .range(pageFinished * pageSize, (pageFinished + 1) * pageSize - 1);

      if (finishedPredsError) throw finishedPredsError;
      if (!data || data.length === 0) {
        hasMoreFinished = false;
      } else {
        finishedPreds = finishedPreds.concat(data);
        if (data.length < pageSize) {
          hasMoreFinished = false;
        } else {
          pageFinished++;
        }
      }
    }

    finishedPreds.forEach((up: any) => {
      if (!userStats[up.user_id]) return;
      if (up.qui_matches.home_score === null || up.qui_matches.away_score === null) return;

      userStats[up.user_id].totalPoints += (up.points_earned || 0);
      if (up.is_exact) userStats[up.user_id].exactCount++;

      userStats[up.user_id].totalPredGoals += (Number(up.home_prediction) + Number(up.away_prediction));
      userStats[up.user_id].totalRealGoals += (Number(up.qui_matches.home_score) + Number(up.qui_matches.away_score));
    });

    const profilesToUpdate = Object.keys(userStats).map((userId: string) => {
      const stats = userStats[userId];
      return {
        id: userId,
        points: stats.totalPoints,
        exact_scores: stats.exactCount,
        goal_difference: Math.abs(stats.totalPredGoals - stats.totalRealGoals)
      };
    });

    for (let i = 0; i < profilesToUpdate.length; i += chunkSize) {
      const chunk = profilesToUpdate.slice(i, i + chunkSize);
      await Promise.all(chunk.map((prof: any) => 
        supabaseAdmin.from('qui_profiles').update({
          points: prof.points,
          exact_scores: prof.exact_scores,
          goal_difference: prof.goal_difference
        }).eq('id', prof.id)
      ));
    }

    return NextResponse.json({ success: true, message: 'Configuración actualizada y clasificaciones recalculadas correctamente.' });
  } catch (err: any) {
    console.error('Error inside config API:', err.message);
    return NextResponse.json({ error: `Internal server error: ${err.message}` }, { status: 500 });
  }
}
