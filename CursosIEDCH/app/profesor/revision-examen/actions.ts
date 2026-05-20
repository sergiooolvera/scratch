'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function getResultadosExamen(cursoId: string) {
    // 1. Authenticate user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    // 2. Verify that the user is the creator of the course
    const { data: curso, error: cursoError } = await supabase
        .from('ie_cursos')
        .select('creado_por')
        .eq('id', cursoId)
        .single()

    if (cursoError || !curso) {
        return { error: 'Curso no encontrado' }
    }

    if (curso.creado_por !== user.id) {
        return { error: 'No eres el profesor de este curso' }
    }

    // 3. Fetch results using admin client to bypass RLS
    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: examenes, error: examenesError } = await supabaseAdmin
        .from('ie_examenes')
        .select('id, modulo_id, min_aprobacion')
        .eq('curso_id', cursoId)

    if (examenesError) {
        return { error: 'Error al buscar exámenes: ' + examenesError.message }
    }

    if (!examenes || examenes.length === 0) {
        return { success: true, data: [], preguntas: [] }
    }

    const examenIds = examenes.map(e => e.id)
    const moduloIds = examenes.map(e => e.modulo_id).filter(Boolean)

    const { data: modulos } = moduloIds.length > 0
        ? await supabaseAdmin
            .from('ie_curso_modulos')
            .select('id, titulo, orden')
            .in('id', moduloIds)
        : { data: [] }

    const examenMeta = new Map(examenes.map(examen => {
        const modulo = modulos?.find(m => m.id === examen.modulo_id)
        return [examen.id, {
            id: examen.id,
            modulo_id: examen.modulo_id,
            titulo: modulo ? `Módulo ${modulo.orden || ''}: ${modulo.titulo}`.trim() : 'Examen final',
            tipo: modulo ? 'modular' : 'final',
            orden: modulo?.orden || 0
        }]
    }))

    const examenesOrdenados = Array.from(examenMeta.values()).sort((a: any, b: any) => {
        if (a.tipo !== b.tipo) return a.tipo === 'final' ? -1 : 1
        return (a.orden || 0) - (b.orden || 0)
    })

    const { data: res, error: resError } = await supabaseAdmin
        .from('ie_resultados_examenes')
        .select('*')
        .in('examen_id', examenIds)
        .order('created_at', { ascending: false })

    if (resError) {
        return { error: 'Error al buscar resultados: ' + resError.message }
    }

    const { data: preguntas } = await supabaseAdmin
        .from('ie_preguntas')
        .select('*')
        .in('examen_id', examenIds)
        .order('orden', { ascending: true })

    if (res && res.length > 0) {
        const userIds = res.map(r => r.user_id);
        const { data: profiles } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre')
            .in('id', userIds);

        const resWithProfiles = res.map(r => {
            const profile = profiles?.find(p => p.id === r.user_id);
            return {
                ...r,
                examen: examenMeta.get(r.examen_id),
                ie_profiles: profile
            };
        });

        return { success: true, data: resWithProfiles, preguntas: preguntas || [], examenes: examenesOrdenados };
    }

    return { success: true, data: [], preguntas: preguntas || [], examenes: examenesOrdenados };
}
