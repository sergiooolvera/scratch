const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('crypto'); // If not available, we will just use native crypto

const supabaseUrl = 'https://gyyrcilivzqxzgkcgzfe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd5eXJjaWxpdnpxeHpna2NnemZlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODg2MzE1OCwiZXhwIjoyMDk0NDM5MTU4fQ.LfpFHmGDw6HSefIDIM4bU04bmeEu7MAVcahH9GcNCTY';
const supabase = createClient(supabaseUrl, supabaseKey);

const additionalGroups = [
  { name: 'Grupo E', teams: [{ n: 'Argentina', f: 'ar' }, { n: 'Japón', f: 'jp' }, { n: 'Egipto', f: 'eg' }, { n: 'Suecia', f: 'se' }] },
  { name: 'Grupo F', teams: [{ n: 'Francia', f: 'fr' }, { n: 'Nigeria', f: 'ng' }, { n: 'Irán', f: 'ir' }, { n: 'Chile', f: 'cl' }] },
  { name: 'Grupo G', teams: [{ n: 'España', f: 'es' }, { n: 'Senegal', f: 'sn' }, { n: 'Costa Rica', f: 'cr' }, { n: 'Serbia', f: 'rs' }] },
  { name: 'Grupo H', teams: [{ n: 'Inglaterra', f: 'gb-eng' }, { n: 'Argelia', f: 'dz' }, { n: 'Ecuador', f: 'ec' }, { n: 'Ucrania', f: 'ua' }] },
  { name: 'Grupo I', teams: [{ n: 'Portugal', f: 'pt' }, { n: 'Costa de Marfil', f: 'ci' }, { n: 'Perú', f: 'pe' }, { n: 'Gales', f: 'gb-wls' }] },
  { name: 'Grupo J', teams: [{ n: 'Alemania', f: 'de' }, { n: 'Camerún', f: 'cm' }, { n: 'Venezuela', f: 've' }, { n: 'Noruega', f: 'no' }] },
  { name: 'Grupo K', teams: [{ n: 'Países Bajos', f: 'nl' }, { n: 'Mali', f: 'ml' }, { n: 'Uruguay', f: 'uy' }, { n: 'Polonia', f: 'pl' }] },
  { name: 'Grupo L', teams: [{ n: 'Italia', f: 'it' }, { n: 'Ghana', f: 'gh' }, { n: 'Colombia', f: 'co' }, { n: 'Dinamarca', f: 'dk' }] },
];

async function seedMissingMatches() {
  let baseDate = new Date('2026-06-15T12:00:00Z'); // Start on June 15th for the subsequent groups
  
  const matchesToInsert = [];

  for (const group of additionalGroups) {
    const t = group.teams;
    // 6 matches per group
    const pairings = [
      [t[0], t[1]],
      [t[2], t[3]],
      [t[0], t[2]],
      [t[3], t[1]],
      [t[3], t[0]],
      [t[1], t[2]]
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
    // Shift date by 1 day for next group
    baseDate = new Date(baseDate.getTime() + (24 * 60 * 60 * 1000));
  }

  console.log(`Inyectando ${matchesToInsert.length} partidos...`);
  const { data, error } = await supabase.from('qui_matches').insert(matchesToInsert);
  
  if (error) {
    console.error('Error insertando partidos:', error);
  } else {
    console.log('✅ Partidos inyectados con éxito.');
  }
}

seedMissingMatches();
