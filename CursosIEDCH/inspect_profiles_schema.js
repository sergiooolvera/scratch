require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');

async function run() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
        const { data, error } = await supabase.from('ie_profiles').select('*').limit(1);
        if (error) {
            console.error("Error fetching ie_profiles:", error);
        } else if (data && data.length > 0) {
            console.log("Columns in ie_profiles:", Object.keys(data[0]));
        } else {
            console.log("ie_profiles table is empty, trying to inspect schema via PostgREST metadata.");
            const res = await fetch(`${supabaseUrl}/rest/v1/`, {
                headers: {
                    'apikey': supabaseServiceKey,
                    'Authorization': `Bearer ${supabaseServiceKey}`
                }
            });
            const schema = await res.json();
            if (schema && schema.definitions && schema.definitions.ie_profiles) {
                console.log("Columns from schema definition:", Object.keys(schema.definitions.ie_profiles.properties));
            } else {
                console.log("Could not read schema. Complete response keys:", Object.keys(schema));
            }
        }
    } catch (e) {
        console.error("Inspection error:", e);
    }
}

run();
