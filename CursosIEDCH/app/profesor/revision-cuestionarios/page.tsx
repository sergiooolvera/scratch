import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import RevisionCuestionariosClient from './RevisionCuestionariosClient'

export const dynamic = 'force-dynamic'

export interface ModuloCuestionarioInfo {
    id: string;
    titulo: string;
    orden: number;
    preguntas: {
        id: string;
        modulo_id: string;
        pregunta: string;
        orden: number;
    }[];
}

export interface AlumnoInscritoInfo {
    id: string;
    nombre: string;
    verificado: boolean;
}

export interface CuestionariosCursoInfo {
    modulosConCuestionario: ModuloCuestionarioInfo[];
    alumnosInscritos: AlumnoInscritoInfo[];
    totalAlumnos: number;
    tieneCuestionarios: boolean;
}

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

    // 1. Obtener cursos del profesor (o todos si es admin)
    let queryCursos = supabaseAdmin.from('ie_cursos').select('id, titulo, creado_por, estado')
    if (profile?.rol !== 'admin') {
        queryCursos = queryCursos.eq('creado_por', user.id)
    }
    const { data: cursosDelProfesor } = await queryCursos.order('created_at', { ascending: false })
    const cursoIds = cursosDelProfesor?.map(c => c.id) || []

    // 2. Obtener módulos de esos cursos que requieran cuestionario
    const { data: modulosConCuestionarioRaw } = cursoIds.length > 0 ? await supabaseAdmin
        .from('ie_curso_modulos')
        .select('id, titulo, curso_id, orden, requiere_cuestionario')
        .in('curso_id', cursoIds)
        .eq('requiere_cuestionario', true)
        .order('orden', { ascending: true }) : { data: [] }

    const moduloIdsConCuestionario = modulosConCuestionarioRaw?.map(m => m.id) || []

    // 3. Obtener todas las preguntas de esos módulos
    const { data: todasPreguntasConfiguradas } = moduloIdsConCuestionario.length > 0 ? await supabaseAdmin
        .from('ie_cuestionario_preguntas')
        .select('id, modulo_id, pregunta, orden')
        .in('modulo_id', moduloIdsConCuestionario)
        .order('orden', { ascending: true }) : { data: [] }

    // 4. Obtener compras de alumnos inscritos en esos cursos
    const { data: comprasCursos } = cursoIds.length > 0 ? await supabaseAdmin
        .from('ie_compras')
        .select('user_id, curso_id')
        .in('curso_id', cursoIds)
        .eq('pagado', true) : { data: [] }

    // 5. Obtener todas las respuestas a cuestionarios
    const { data: todasEntregas, error: errEntregas } = await supabaseAdmin
        .from('ie_cuestionario_respuestas')
        .select('*')
        .order('created_at', { ascending: false })

    if (errEntregas) {
        console.error('Error entregas cuestionario:', JSON.stringify(errEntregas))
    }

    // 6. Obtener preguntas para las respuestas recibidas (si hay)
    const preguntaIdsEnEntregas = [...new Set(todasEntregas?.map(e => e.pregunta_id) || [])]
    const { data: preguntasDeEntregas } = preguntaIdsEnEntregas.length > 0 ? await supabaseAdmin
        .from('ie_cuestionario_preguntas')
        .select('*')
        .in('id', preguntaIdsEnEntregas)
        .order('orden', { ascending: true }) : { data: [] }

    const preguntaToModulo: Record<string, string> = {}
    preguntasDeEntregas?.forEach(p => { preguntaToModulo[p.id] = p.modulo_id })

    // 7. Módulos involucrados en las entregas
    const moduloIdsDeEntregas = [...new Set(preguntasDeEntregas?.map(p => p.modulo_id) || [])]
    const { data: modulosDeEntregas } = moduloIdsDeEntregas.length > 0 ? await supabaseAdmin
        .from('ie_curso_modulos')
        .select('id, titulo, curso_id')
        .in('id', moduloIdsDeEntregas) : { data: [] }

    // 8. Unificar perfiles de alumnos (tanto inscritos como con entregas)
    const todosUserIds = [...new Set([
        ...(todasEntregas?.map(e => e.user_id) || []),
        ...(comprasCursos?.map(c => c.user_id) || [])
    ])]

    const perfilesMap: Record<string, string> = {}
    const perfilesVerificadosMap: Record<string, boolean> = {}

    if (todosUserIds.length > 0) {
        const { data: profilesList } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre, apellido_paterno, apellido_materno, verificado')
            .in('id', todosUserIds)

        profilesList?.forEach(p => {
            const nombreCompleto = `${p.nombre || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.replace(/\s+/g, ' ').trim()
            perfilesMap[p.id] = nombreCompleto || 'Alumno sin nombre'
            perfilesVerificadosMap[p.id] = p.verificado || false
        })
    }

    // 9. Construir diccionarios
    const cursosMap: Record<string, any> = {}
    cursosDelProfesor?.forEach(c => { cursosMap[c.id] = c })

    const modulosMap: Record<string, any> = {}
    modulosDeEntregas?.forEach(m => { modulosMap[m.id] = m })
    modulosConCuestionarioRaw?.forEach(m => { modulosMap[m.id] = m })

    const preguntasMap: Record<string, any> = {}
    preguntasDeEntregas?.forEach(p => { preguntasMap[p.id] = p })
    todasPreguntasConfiguradas?.forEach(p => { preguntasMap[p.id] = p })

    // 10. Agrupar entregas por user_id + modulo_id
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
        
        preguntasArr.sort((a, b) => (a.orden || 0) - (b.orden || 0))
        const e = group[0]

        entregasFormateadas.push({
            id: key,
            curso_id: mod.curso_id,
            curso_titulo: cur?.titulo || 'Curso Desconocido',
            modulo_id: modId,
            modulo_titulo: mod.titulo || 'Módulo Desconocido',
            alumno_nombre: perfilesMap[uid] || 'Alumno sin nombre',
            alumno_verificado: perfilesVerificadosMap[uid] || false,
            preguntas: preguntasArr,
            respuestas: respuestasObj,
            evaluaciones: evaluacionesObj,
            estado: e.calificacion ? 'evaluado' : 'entregado',
            created_at: e.created_at,
            evaluado_at: e.responded_at
        })
    }
    
    entregasFormateadas.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    // 11. Armar cuestionariosInfo por curso
    const cuestionariosInfo: Record<string, CuestionariosCursoInfo> = {}
    for (const c of (cursosDelProfesor || [])) {
        const modsDelCurso = (modulosConCuestionarioRaw || []).filter(m => m.curso_id === c.id)
        const modulosFormateados: ModuloCuestionarioInfo[] = modsDelCurso.map(m => ({
            id: m.id,
            titulo: m.titulo,
            orden: m.orden || 0,
            preguntas: (todasPreguntasConfiguradas || []).filter(p => p.modulo_id === m.id)
        }))

        const comprasDelCurso = (comprasCursos || []).filter(comp => comp.curso_id === c.id)
        const alumnosDelCurso: AlumnoInscritoInfo[] = comprasDelCurso.map(comp => ({
            id: comp.user_id,
            nombre: perfilesMap[comp.user_id] || 'Alumno sin nombre',
            verificado: perfilesVerificadosMap[comp.user_id] || false
        }))

        cuestionariosInfo[c.id] = {
            modulosConCuestionario: modulosFormateados,
            alumnosInscritos: alumnosDelCurso,
            totalAlumnos: alumnosDelCurso.length,
            tieneCuestionarios: modulosFormateados.length > 0 && modulosFormateados.some(m => m.preguntas.length > 0)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Revisión de Cuestionarios Abiertos</h1>
            <p className="text-gray-500 text-sm mb-8">Evalúa los cuestionarios de preguntas libres enviados por tus alumnos y revisa las preguntas configuradas en tus cursos.</p>
            
            <RevisionCuestionariosClient 
                entregas={entregasFormateadas} 
                cursos={cursosDelProfesor || []} 
                cuestionariosInfo={cuestionariosInfo}
            />
        </div>
    )
}
