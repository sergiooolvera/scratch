const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('c:\\Users\\sergi\\.gemini\\antigravity\\scratch\\CursosIEDCH\\.env.local', 'utf-8');
const lines = envFile.split('\n');
const envVars = {};
lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        envVars[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/"/g, '');
    }
});

const supabase = createClient(envVars['NEXT_PUBLIC_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY']);

async function fixYareli() {
    // Buscar su profile ID
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    const yareli = users.find(u => u.email === 'yaregudy31@gmail.com');
    if (!yareli) {
        console.log("No se encontró el usuario Yareli en auth");
        return;
    }
    console.log("Yareli ID:", yareli.id);

    // Buscar si tiene compras
    const { data: compras } = await supabase.from('ie_compras').select('*').eq('user_id', yareli.id);
    console.log("Compras actuales:", compras);

    // Obtener el curso de "Fundamentos..."
    const { data: cursos } = await supabase.from('ie_cursos').select('id, titulo').ilike('titulo', '%Fundamentos%');
    console.log("Cursos fundamentos encontrados:", cursos);

    if (cursos.length > 0) {
        const cursoId = cursos[0].id;
        // Si no tiene la de fundamentos, agregarla
        const tieneCurso = compras.find(c => c.curso_id === cursoId);
        if (!tieneCurso) {
            console.log("Agregando compra a Yareli...");
            const { error: insertError } = await supabase.from('ie_compras').insert({
                user_id: yareli.id,
                curso_id: cursoId,
                pagado: true,
                pago_completo: true
            });
            if (insertError) console.error("Error al insertar:", insertError);
            else console.log("Compra insertada exitosamente.");
        } else {
            console.log("Yareli YA TIENE la compra registrada en la BD.");
        }
    }
}

fixYareli();
