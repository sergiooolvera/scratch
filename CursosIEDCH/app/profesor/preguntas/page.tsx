import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import PreguntasClient from './PreguntasClient'

export const dynamic = 'force-dynamic'

export default async function PreguntasPage() {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('ie_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile?.rol !== 'profesor' && profile?.rol !== 'admin') {
        redirect('/dashboard')
    }

    // Admin client con service role para bypass de RLS
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Obtener todas las preguntas
    const { data: todasPreguntas, error: errPreguntas } = await supabaseAdmin
        .from('ie_preguntas_respuestas')
        .select('*')
        .order('created_at', { ascending: false })

    if (errPreguntas) {
        console.error('Error preguntas:', JSON.stringify(errPreguntas))
    }

    // 2. Obtener todos los cursos relevantes
    const { data: todosCursos } = await supabaseAdmin
        .from('ie_cursos')
        .select('id, titulo, creado_por')

    // 3. Obtener nombres/emails de alumnos via auth admin (bypass total de RLS)
    const userIdsConPreguntas = [...new Set(todasPreguntas?.map(p => p.user_id) || [])]
    const perfilesMap: Record<string, string> = {}
    for (const uid of userIdsConPreguntas) {
        try {
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(uid)
            // Intentar primero el nombre del perfil, si no el email del auth user
            const { data: perfil } = await supabaseAdmin
                .from('ie_profiles')
                .select('nombre')
                .eq('id', uid)
                .single()
            perfilesMap[uid] = perfil?.nombre || authUser?.email || 'Alumno sin nombre'
        } catch {
            perfilesMap[uid] = 'Alumno sin nombre'
        }
    }

    // Build courses lookup map
    const cursosMap: Record<string, any> = {}
    todosCursos?.forEach(c => { cursosMap[c.id] = c })

    // 4. Cruzar datos y filtrar
    let preguntasFormateadas: any[] = []

    if (todasPreguntas && todosCursos) {
        preguntasFormateadas = todasPreguntas
            .filter(p => {
                if (profile?.rol === 'admin') return true
                const cursoDelProf = cursosMap[p.curso_id]
                return cursoDelProf?.creado_por === user!.id
            })
            .map(p => ({
                ...p,
                curso_titulo: cursosMap[p.curso_id]?.titulo || 'Curso Desconocido',
                alumno_nombre: perfilesMap[p.user_id] || 'Alumno sin nombre'
            }))
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Dudas de Alumnos</h1>
            <p className="text-gray-600 mb-8">Aquí aparecerán las dudas directas de los estudiantes que están tomando tus cursos.</p>
            
            <PreguntasClient preguntas={preguntasFormateadas} />
        </div>
    )
}
