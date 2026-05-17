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

    const { data: examen } = await supabaseAdmin
        .from('ie_examenes')
        .select('id')
        .eq('curso_id', cursoId)
        .single()

    if (!examen) {
        return { error: 'Examen no encontrado' }
    }

    const { data: res, error: resError } = await supabaseAdmin
        .from('ie_resultados_examenes')
        .select('*')
        .eq('examen_id', examen.id)
        .order('created_at', { ascending: false })

    if (resError) {
        return { error: 'Error al buscar resultados: ' + resError.message }
    }

    if (res && res.length > 0) {
        // Fetch profiles for these users
        const userIds = res.map(r => r.user_id);
        const { data: profiles } = await supabaseAdmin
            .from('ie_profiles')
            .select('id, nombre')
            .in('id', userIds);
        
        // Map profiles to results
        const resWithProfiles = res.map(r => {
            const profile = profiles?.find(p => p.id === r.user_id);
            return {
                ...r,
                ie_profiles: profile
            };
        });
        return { success: true, data: resWithProfiles };
    }

    return { success: true, data: [] };
}
