import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import RevisionTareasClient from './RevisionTareasClient'

export const dynamic = 'force-dynamic'

export default async function RevisionTareasPage() {
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

    if (profile?.rol !== 'instructor' && profile?.rol !== 'admin' && profile?.rol !== 'capacitador' && profile?.rol !== 'institucion') {
        redirect('/dashboard')
    }

    // Admin client con service role para bypass de RLS
    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Obtener todas las entregas de tareas
    const { data: todasEntregas, error: errEntregas } = await supabaseAdmin
        .from('ie_preguntas_respuestas')
        .select('*')
        .like('pregunta', 'TAREA_ENTREGA:%')
        .order('created_at', { ascending: false })

    if (errEntregas) {
        console.error('Error entregas:', JSON.stringify(errEntregas))
    }

    // 2. Obtener todos los cursos
    const { data: todosCursos } = await supabaseAdmin
        .from('ie_cursos')
        .select('id, titulo, creado_por')

    // 3. Obtener todos los módulos para mapear títulos
    const { data: todosModulos } = await supabaseAdmin
        .from('ie_curso_modulos')
        .select('id, titulo, curso_id')

    // 4. Obtener nombres/emails de alumnos via auth admin
    const userIdsConEntregas = [...new Set(todasEntregas?.map(e => e.user_id) || [])]
    const perfilesMap: Record<string, string> = {}
    for (const uid of userIdsConEntregas) {
        try {
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(uid)
            const { data: perfil } = await supabaseAdmin
                .from('ie_profiles')
                .select('nombre, apellido_paterno, apellido_materno')
                .eq('id', uid)
                .single()
            perfilesMap[uid] = `${perfil?.nombre || ''} ${perfil?.apellido_paterno || ''} ${perfil?.apellido_materno || ''}`.replace(/\s+/g, ' ').trim() || authUser?.email || 'Alumno sin nombre'
        } catch {
            perfilesMap[uid] = 'Alumno sin nombre'
        }
    }

    // Build lookups
    const cursosMap: Record<string, any> = {}
    todosCursos?.forEach(c => { cursosMap[c.id] = c })

    const modulosMap: Record<string, string> = {}
    todosModulos?.forEach(m => { modulosMap[m.id] = m.titulo })

    // 5. Cruzar datos y filtrar
    let entregasFormateadas: any[] = []

    if (todasEntregas && todosCursos) {
        entregasFormateadas = todasEntregas
            .filter(e => {
                if (profile?.rol === 'admin') return true
                const cursoDelProf = cursosMap[e.curso_id]
                return cursoDelProf?.creado_por === user!.id
            })
            .map(e => {
                const parts = e.pregunta.split('::')
                const header = parts[0]
                const modId = header.replace('TAREA_ENTREGA:', '').replace('[', '').replace(']', '')
                
                let payload: any = {}
                try {
                    payload = JSON.parse(parts.slice(1).join('::'))
                } catch (err) {
                    console.error('Error parsing entrega json:', err)
                }

                return {
                    id: e.id,
                    curso_id: e.curso_id,
                    curso_titulo: cursosMap[e.curso_id]?.titulo || 'Curso Desconocido',
                    modulo_id: modId,
                    modulo_titulo: modulosMap[modId] || 'Módulo Desconocido',
                    alumno_nombre: perfilesMap[e.user_id] || 'Alumno sin nombre',
                    explicacion: payload.explicacion || '',
                    archivos: payload.archivos || [],
                    calificacion: payload.calificacion,
                    retroalimentacion: payload.retroalimentacion || '',
                    created_at: e.created_at,
                    responded_at: e.responded_at
                }
            })
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Revisión de Tareas Modulares</h1>
            <p className="text-gray-500 text-sm mb-8">Califica los proyectos, entregables y prácticas enviadas por tus alumnos por cada módulo.</p>
            
            <RevisionTareasClient entregas={entregasFormateadas} />
        </div>
    )
}
