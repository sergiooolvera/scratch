'use server'

import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function moduloTieneExamenContestado(cursoId: string, moduloId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { error: 'No autorizado' }
    }

    const { data: curso } = await supabase
        .from('ie_cursos')
        .select('creado_por')
        .eq('id', cursoId)
        .single()

    if (!curso || curso.creado_por !== user.id) {
        return { error: 'No eres el profesor de este curso' }
    }

    const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: examen } = await supabaseAdmin
        .from('ie_examenes')
        .select('id')
        .eq('curso_id', cursoId)
        .eq('modulo_id', moduloId)
        .maybeSingle()

    if (!examen) {
        return { tieneResultados: false }
    }

    const { count, error } = await supabaseAdmin
        .from('ie_resultados_examenes')
        .select('id', { count: 'exact', head: true })
        .eq('examen_id', examen.id)

    if (error) {
        return { error: error.message }
    }

    return { tieneResultados: (count || 0) > 0 }
}
