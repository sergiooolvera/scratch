import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { join } from 'path'

dotenv.config({ path: join(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
  const { data, error } = await supabase.from('pl_categories').select('*')
  console.log('Total Categories:', data?.length)
  data?.forEach(c => console.log(`Slug: ${c.slug} | Name: ${c.name}`))
  if (error) console.error('Error:', error)
}

check()
