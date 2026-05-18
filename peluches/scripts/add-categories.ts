import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

// Cargar variables de entorno desde .env.local
dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function addCategories() {
  const newCategories = [
    { name: 'San Valentín', slug: 'san-valentin' },
    { name: 'Día de las Madres', slug: 'dia-madres' },
    { name: 'Bautizos', slug: 'bautizos' },
    { name: 'Navidad', slug: 'navidad' }
  ]

  console.log('Insertando nuevas categorías...')
  const { error } = await supabase.from('pl_categories').upsert(newCategories, { onConflict: 'slug' })
  
  if (error) {
    console.error('Error inserting categories:', error)
  } else {
    console.log('Categorías añadidas exitosamente!')
  }
}

addCategories()
