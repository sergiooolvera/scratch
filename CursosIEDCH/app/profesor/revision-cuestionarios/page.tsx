import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import RevisionCuestionariosClient from './RevisionCuestionariosClient'

export const dynamic = 'force-dynamic'

export default async function RevisionCuestionariosPage() {
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

    const supabaseAdmin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Obtener todas las respuestas a cuestionarios
    const { data: todasEntregas, error: errEntregas } = await supabaseAdmin
        .from('ie_cuestionario_respuestas')
        .select('*')
        .order('created_at', { ascending: false })

    if (errEntregas) {
        console.error('Error entregas cuestionario:', JSON.stringify(errEntregas))
    }

    // 2. Obtener preguntas para mapear a modulos
    const preguntaIds = [...new Set(todasEntregas?.map(e => e.pregunta_id) || [])]
    const { data: preguntasBase } = await supabaseAdmin
        .from('ie_cuestionario_preguntas')
        .select('*')
        .in('id', preguntaIds)
        .order('orden', { ascending: true })

    const preguntaToModulo: Record<string, string> = {}
    preguntasBase?.forEach(p => { preguntaToModulo[p.id] = p.modulo_id })

    // 3. Obtener modulos
    const moduloIds = [...new Set(preguntasBase?.map(p => p.modulo_id) || [])]
    const { data: modulosInvolucrados } = await supabaseAdmin
        .from('ie_curso_modulos')
        .select('id, titulo, curso_id')
        .in('id', moduloIds)
    
    const cursoIds = [...new Set(modulosInvolucrados?.map(m => m.curso_id) || [])]

    // 4. Obtener cursos
    const { data: cursosInvolucrados } = await supabaseAdmin
        .from('ie_cursos')
        .select('id, titulo, creado_por')
        .in('id', cursoIds)

    // 5. Nombres de alumnos
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
    cursosInvolucrados?.forEach(c => { cursosMap[c.id] = c })

    const modulosMap: Record<string, any> = {}
    modulosInvolucrados?.forEach(m => { modulosMap[m.id] = m })

    const preguntasMap: Record<string, any> = {}
    preguntasBase?.forEach(p => { preguntasMap[p.id] = p })

    // 6. Agrupar entregas por user_id + modulo_id
    const entregasAgrupadas: Record<string, any[]> = {}
    todasEntregas?.forEach(e => {
        const modulo_id = preguntaToModulo[e.pregunta_id]
        if (!modulo_id) return
        const key = `${e.user_id}_${modulo_id}`
        if (!entregasAgrupadas[key]) {
            entregasAgrupadas[key] = []
        }
        entregasAgrupadas[key].push(e)
    })

    const entregasFormateadas: any[] = []

    for (const [key, group] of Object.entries(entregasAgrupadas)) {
        const [uid, modId] = key.split('_')
        const mod = modulosMap[modId]
        if (!mod) continue
        const cur = cursosMap[mod.curso_id]

        if (profile?.rol !== 'admin' && cur?.creado_por !== user.id) {
            continue
        }

        const respuestasObj: Record<string, string> = {}
        const evaluacionesObj: Record<string, { etiqueta: string, retroalimentacion: string }> = {}
        const preguntasArr: any[] = []
        
        group.forEach(r => {
            respuestasObj[r.pregunta_id] = r.respuesta
            evaluacionesObj[r.pregunta_id] = {
                etiqueta: r.calificacion || '',
                retroalimentacion: r.feedback || ''
            }
            if (preguntasMap[r.pregunta_id]) {
                preguntasArr.push(preguntasMap[r.pregunta_id])
            }
        })
        
        // Sort questions by orden
        preguntasArr.sort((a, b) => (a.orden || 0) - (b.orden || 0))

        const e = group[0]

        entregasFormateadas.push({
            id: key, // user_id + '_' + modulo_id
            curso_id: mod.curso_id,
            curso_titulo: cur?.titulo || 'Curso Desconocido',
            modulo_id: modId,
            modulo_titulo: mod.titulo || 'Módulo Desconocido',
            alumno_nombre: perfilesMap[uid] || 'Alumno sin nombre',
            preguntas: preguntasArr,
            respuestas: respuestasObj,
            evaluaciones: evaluacionesObj,
            estado: e.calificacion ? 'evaluado' : 'entregado',
            created_at: e.created_at,
            evaluado_at: e.responded_at
        })
    }
    
    entregasFormateadas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Revisión de Cuestionarios Abiertos</h1>
            <p className="text-gray-500 text-sm mb-8">Evalúa los cuestionarios de preguntas libres enviados por tus alumnos.</p>
            
            <RevisionCuestionariosClient entregas={entregasFormateadas} />
        </div>
    )
}
