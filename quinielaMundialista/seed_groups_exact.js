const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';
const supabase = createClient(supabaseUrl, supabaseKey);

const additionalGroups = [
  { name: 'Grupo E', teams: [{ n: 'Alemania', f: 'de' }, { n: 'Curazao', f: 'cw' }, { n: 'Costa de Marfil', f: 'ci' }, { n: 'Ecuador', f: 'ec' }] },
  { name: 'Grupo F', teams: [{ n: 'Países Bajos', f: 'nl' }, { n: 'Japón', f: 'jp' }, { n: 'Suecia', f: 'se' }, { n: 'Túnez', f: 'tn' }] },
  { name: 'Grupo G', teams: [{ n: 'Bélgica', f: 'be' }, { n: 'Egipto', f: 'eg' }, { n: 'Irán', f: 'ir' }, { n: 'Nueva Zelanda', f: 'nz' }] },
  { name: 'Grupo H', teams: [{ n: 'España', f: 'es' }, { n: 'Cabo Verde', f: 'cv' }, { n: 'Arabia Saudita', f: 'sa' }, { n: 'Uruguay', f: 'uy' }] },
  { name: 'Grupo I', teams: [{ n: 'Francia', f: 'fr' }, { n: 'Senegal', f: 'sn' }, { n: 'Irak', f: 'iq' }, { n: 'Noruega', f: 'no' }] },
  { name: 'Grupo J', teams: [{ n: 'Argentina', f: 'ar' }, { n: 'Argelia', f: 'dz' }, { n: 'Austria', f: 'at' }, { n: 'Jordania', f: 'jo' }] },
  { name: 'Grupo K', teams: [{ n: 'Portugal', f: 'pt' }, { n: 'República Democrática del Congo', f: 'cd' }, { n: 'Uzbekistán', f: 'uz' }, { n: 'Colombia', f: 'co' }] },
  { name: 'Grupo L', teams: [{ n: 'Inglaterra', f: 'gb-eng' }, { n: 'Croacia', f: 'hr' }, { n: 'Ghana', f: 'gh' }, { n: 'Panamá', f: 'pa' }] },
];

async function seedMissingMatches() {
  // Start right after the Group D matches. Group D probably runs on day 4 or 5.
  // We'll just start at June 15, 2026.
  let baseDate = new Date('2026-06-15T12:00:00Z'); 
  
  const matchesToInsert = [];

  for (const group of additionalGroups) {
    const t = group.teams;
    // 6 matches per group
    const pairings = [
      [t[0], t[1]], // Team 1 vs Team 2
      [t[2], t[3]], // Team 3 vs Team 4
      [t[0], t[2]], // Team 1 vs Team 3
      [t[3], t[1]], // Team 4 vs Team 2
      [t[3], t[0]], // Team 4 vs Team 1
      [t[1], t[2]]  // Team 2 vs Team 3
    ];

    for (let i = 0; i < pairings.length; i++) {
      const matchTime = new Date(baseDate.getTime() + (i * 3 * 60 * 60 * 1000)); // 3 hours apart
      
      matchesToInsert.push({
        group_name: group.name,
        home_team: pairings[i][0].n,
        away_team: pairings[i][1].n,
        home_flag: pairings[i][0].f,
        away_flag: pairings[i][1].f,
        home_score: null,
        away_score: null,
        status: 'pending',
        match_time: matchTime.toISOString(),
      });
    }
    // Next group starts next day
    baseDate = new Date(baseDate.getTime() + (24 * 60 * 60 * 1000));
  }

  console.log(`Inyectando ${matchesToInsert.length} partidos a Supabase...`);
  const { data, error } = await supabase.from('qui_matches').insert(matchesToInsert);
  
  if (error) {
    console.error('❌ Error insertando partidos:', error);
  } else {
    console.log('✅ 48 Partidos inyectados con éxito. ¡Torneo completado!');
  }
}

seedMissingMatches();
