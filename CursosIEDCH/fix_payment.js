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
const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = envVars['SUPABASE_SERVICE_ROLE_KEY']  || envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
const supabase = createClient(supabaseUrl, supabaseKey);

const userId = '5a907de8-787f-45b8-9359-144e4dabfd76';
const cursoId = 'd7675de6-2d12-4aa5-8517-0f645ac839bc';

async function registerPurchase() {
    console.log(`Checking purchase for userId: ${userId}, cursoId: ${cursoId}`);
    const { data: existing, error: errCheck } = await supabase
        .from('ie_compras')
        .select('*')
        .eq('user_id', userId)
        .eq('curso_id', cursoId)
        .single();

    if (existing) {
        console.log("Purchase already exists, updating to 'pagado: true'");
        const { error: errUpdate } = await supabase
            .from('ie_compras')
            .update({ pagado: true, pago_completo: true })
            .eq('id', existing.id);
        if (errUpdate) console.error("Error updating:", errUpdate);
        else console.log("Purchase updated successfully.");
    } else {
        console.log("Purchase does not exist, creating new record.");
        const { error: errInsert } = await supabase
            .from('ie_compras')
            .insert({
                user_id: userId,
                curso_id: cursoId,
                pagado: true,
                pago_completo: true,
                fecha_compra: new Date().toISOString()
            });
        if (errInsert) console.error("Error inserting:", errInsert);
        else console.log("Purchase created successfully.");
    }
}
registerPurchase();
