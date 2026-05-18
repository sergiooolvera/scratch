const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')
const path = require('path')

// Cargar variables de entorno desde .env.local
dotenv.config({ path: path.resolve(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno en .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createUsers() {
  const users = [
    { email: 'admin@ejemplo.com', password: 'password123', role: 'admin' },
    { email: 'cliente@ejemplo.com', password: 'password123', role: 'cliente' },
    { email: 'gestor@ejemplo.com', password: 'password123', role: 'gestor' }
  ]

  console.log('Creando usuarios de prueba...')

  for (const u of users) {
    // Intentar crear el usuario
    const { data, error } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { role: u.role }
    })

    if (error) {
      if (error.message.includes('already exists')) {
        console.log(`El usuario ${u.email} ya existe.`)
      } else {
        console.error(`Error creando ${u.email}:`, error.message)
      }
    } else {
      console.log(`✅ Usuario creado: ${u.email} con rol [${u.role}]`)
    }
  }
}

createUsers()
