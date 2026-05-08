const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const idToFind = 'd75ca314-df39-41e4-a670-ba6567f17cfa';

const knownTables = [
    'ie_profiles',
    'ie_cursos',
    'ie_examenes',
    'ie_resultados_examenes',
    'ie_examenes_usuario',
    'ie_actividad_institucion',
    'ie_actividad_alumnos',
    'ie_compras',
    'ie_pagos_manuales',
    'ie_pagos_oxxo',
    'ie_cupones',
    'ie_solicitudes_ajuste'
];

async function main() {
    console.log(`Searching for ID: ${idToFind} in known tables...\n`);
    for (const tableName of knownTables) {
        try {
            const { data, error } = await supabase
                .from(tableName)
                .select('*')
                .limit(1);

            if (error) {
                console.log(`Table ${tableName} skipped or error: ${error.message}`);
                continue;
            }

            if (!data || data.length === 0) {
                continue;
            }

            const columns = Object.keys(data[0]);
            for (const col of columns) {
                const { data: matched } = await supabase
                    .from(tableName)
                    .select('*')
                    .eq(col, idToFind);

                if (matched && matched.length > 0) {
                    console.log(`\n🎉 MATCH FOUND in table [${tableName}] under column [${col}]:`);
                    console.log(JSON.stringify(matched, null, 2));
                }
            }
        } catch (ex) {
            console.log(`Error searching ${tableName}:`, ex.message);
        }
    }
    console.log('\nSearch completed.');
}

main();
