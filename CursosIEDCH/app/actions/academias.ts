'use server'

import { createClient } from '@supabase/supabase-js'

export async function eliminarAcademiaAction(academiaId: string, userId: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Validar que la academia exista y que pertenezca al usuario que solicita el borrado
        const { data: academia, error: fetchErr } = await supabaseAdmin
            .from('ie_academias')
            .select('creado_por')
            .eq('id', academiaId)
            .single()

        if (fetchErr) throw fetchErr

        if (!academia || academia.creado_por !== userId) {
            return { success: false, error: 'No tienes permisos para eliminar esta academia.' }
        }

        // 2. Ejecutar la eliminación con service_role
        const { error: deleteErr } = await supabaseAdmin
            .from('ie_academias')
            .delete()
            .eq('id', academiaId)

        if (deleteErr) throw deleteErr

        return { success: true }
    } catch (error: any) {
        console.error('Error in eliminarAcademiaAction:', error)
        return { success: false, error: error.message || error }
    }
}

export async function getAcademiaDetallesAction(academiaId: string, userId: string) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // 1. Validar que la academia pertenezca al usuario (o sea el creador)
        const { data: academia, error: fetchErr } = await supabaseAdmin
            .from('ie_academias')
            .select('*')
            .eq('id', academiaId)
            .single()

        if (fetchErr) throw fetchErr

        if (!academia || academia.creado_por !== userId) {
            return { success: false, error: 'No tienes permisos para ver los detalles de esta academia.' }
        }

        // 2. Obtener grupos de la academia
        const { data: grupos, error: gruposErr } = await supabaseAdmin
            .from('ie_grupos')
            .select('*')
            .eq('academia_id', academiaId)
            .order('created_at', { ascending: false })

        if (gruposErr) throw gruposErr

        const grupoIds = grupos?.map(g => g.id) || []

        // 3. Obtener cursos asociados a los grupos de esta academia
        let cursos: any[] = []
        if (grupoIds.length > 0) {
            const { data: relCursos, error: relCursosErr } = await supabaseAdmin
                .from('ie_grupo_cursos')
                .select('grupo_id, ie_cursos(id, titulo, categoria, precio, estado, created_at)')
                .in('grupo_id', grupoIds)

            if (relCursosErr) throw relCursosErr

            // Formatear/aplanar cursos con su grupo asociado
            const cursosMap = new Map<string, any>()
            relCursos?.forEach((rc: any) => {
                if (rc.ie_cursos) {
                    const cursoId = rc.ie_cursos.id
                    const grupoAsoc = grupos.find(g => g.id === rc.grupo_id)
                    if (cursosMap.has(cursoId)) {
                        cursosMap.get(cursoId).grupos.push(grupoAsoc?.nombre || 'Grupo')
                    } else {
                        cursosMap.set(cursoId, {
                            ...rc.ie_cursos,
                            grupos: [grupoAsoc?.nombre || 'Grupo']
                        })
                    }
                }
            })
            cursos = Array.from(cursosMap.values())
        }

        // 4. Obtener alumnos directos de la academia
        const { data: alumnosDirectos, error: dirErr } = await supabaseAdmin
            .from('ie_academia_alumnos')
            .select('user_id, created_at')
            .eq('academia_id', academiaId)

        if (dirErr) throw dirErr

        // 5. Obtener alumnos de los grupos
        let alumnosGrupos: any[] = []
        if (grupoIds.length > 0) {
            const { data: grpAl, error: grpAlErr } = await supabaseAdmin
                .from('ie_grupo_alumnos')
                .select('user_id, grupo_id, created_at')
                .in('grupo_id', grupoIds)

            if (grpAlErr) throw grpAlErr
            alumnosGrupos = grpAl || []
        }

        // Consolidar IDs únicos de alumnos y guardar sus relaciones
        const studentMap = new Map<string, { user_id: string, fechaInscripcion: string, origenes: string[] }>()

        alumnosDirectos?.forEach((ad: any) => {
            studentMap.set(ad.user_id, {
                user_id: ad.user_id,
                fechaInscripcion: ad.created_at,
                origenes: ['Directo en Academia']
            })
        })

        alumnosGrupos.forEach((ag: any) => {
            const grupoAsoc = grupos.find(g => g.id === ag.grupo_id)
            const grupoNombre = grupoAsoc?.nombre || 'Grupo'
            if (studentMap.has(ag.user_id)) {
                if (!studentMap.get(ag.user_id)!.origenes.includes(`Grupo: ${grupoNombre}`)) {
                    studentMap.get(ag.user_id)!.origenes.push(`Grupo: ${grupoNombre}`)
                }
            } else {
                studentMap.set(ag.user_id, {
                    user_id: ag.user_id,
                    fechaInscripcion: ag.created_at,
                    origenes: [`Grupo: ${grupoNombre}`]
                })
            }
        })

        const studentIdsArray = Array.from(studentMap.keys())
        let alumnos: any[] = []

        if (studentIdsArray.length > 0) {
            // Obtener perfiles de los alumnos
            const { data: perfiles, error: perfErr } = await supabaseAdmin
                .from('ie_profiles')
                .select('id, nombre, apellido_paterno, apellido_materno, telefono, correo_adicional')
                .in('id', studentIdsArray)

            if (perfErr) throw perfErr

            // Obtener emails de auth
            const emailMap: Record<string, string> = {}
            const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
                perPage: 1000
            })
            authUsers?.users?.forEach((u: any) => {
                emailMap[u.id] = u.email || ''
            })

            // Consolidar alumnos
            alumnos = perfiles?.map((p: any) => {
                const relation = studentMap.get(p.id)!
                const nombreCompleto = `${p.nombre || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.replace(/\s+/g, ' ').trim()
                return {
                    id: p.id,
                    nombre: nombreCompleto || 'Estudiante',
                    email: emailMap[p.id] || p.correo_adicional || 'Sin correo',
                    telefono: p.telefono || 'Sin teléfono',
                    fechaInscripcion: relation.fechaInscripcion,
                    origenes: relation.origenes
                }
            }) || []
        }

        return {
            success: true,
            data: {
                academia,
                grupos,
                cursos,
                alumnos
            }
        }
    } catch (e: any) {
        console.error('Error in getAcademiaDetallesAction:', e)
        return { success: false, error: e.message || e }
    }
}
