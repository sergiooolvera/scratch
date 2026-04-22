const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkCols() {
    const { data, error } = await supabase.from('ie_resultados_examenes').select('*').limit(1)
    if (data && data[0]) {
        console.log('Columns in ie_resultados_examenes:', Object.keys(data[0]))
    } else {
        console.log('No data or error:', error)
    }
}

checkCols()
