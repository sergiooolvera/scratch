import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
    try {
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        const { cursoId, draft } = await req.json()
        const { modulos, examen, ...cursoData } = draft

        // Campo controlado por Admin. Nunca debe venir del borrador del profesor.
        if ('es_super_curso' in cursoData) {
            delete (cursoData as any).es_super_curso
        }

        // 1. Actualizar el curso base y limpiar el borrador
        const { error: updateErr } = await supabaseAdmin.from('ie_cursos').update({
            ...cursoData,
            cambios_pendientes: null
        }).eq('id', cursoId)

        if (updateErr) throw updateErr

        // 2. Actualizar Módulos
        // Eliminar TODOS los módulos anteriores
        const { error: delErr } = await supabaseAdmin.from('ie_curso_modulos').delete().eq('curso_id', cursoId)
        if (delErr) throw delErr

        if (modulos && modulos.length > 0) {
            const newModulos = modulos.map((m: any) => ({
                curso_id: cursoId,
                titulo: m.titulo,
                url_contenido: m.url_contenido,
                orden: m.orden
            }))
            const { error: insErr } = await supabaseAdmin.from('ie_curso_modulos').insert(newModulos)
            if (insErr) throw insErr
        }

        // 3. Actualizar Examen (NUEVO)
        if (examen) {
            // Buscar si ya existe el examen
            let { data: exmExistente } = await supabaseAdmin
                .from('ie_examenes')
                .select('id')
                .eq('curso_id', cursoId)
                .single()

            let examenId: string;

            if (exmExistente) {
                examenId = exmExistente.id;
                await supabaseAdmin.from('ie_examenes').update({ min_aprobacion: examen.min_aprobacion }).eq('id', examenId)
            } else {
                const { data: nuevoExm, error: nExError } = await supabaseAdmin
                    .from('ie_examenes')
                    .insert({ curso_id: cursoId, min_aprobacion: examen.min_aprobacion })
                    .select()
                    .single()
                
                if (nExError) throw nExError
                examenId = nuevoExm.id
            }

            // Reemplazar preguntas
            await supabaseAdmin.from('ie_preguntas').delete().eq('examen_id', examenId)
            
            if (examen.preguntas && examen.preguntas.length > 0) {
                const pregsParaInsertar = examen.preguntas.map((p: any) => ({
                    examen_id: examenId,
                    pregunta: p.pregunta,
                    opcion_a: p.opcion_a,
                    opcion_b: p.opcion_b,
                    opcion_c: p.opcion_c,
                    opcion_d: p.opcion_d,
                    respuesta_correcta: p.respuesta_correcta,
                    orden: p.orden
                }))
                await supabaseAdmin.from('ie_preguntas').insert(pregsParaInsertar)
            }
        }

        // 4. AUTO-NOTIFY on draft approval
        try {
            // Obtener Alumnos Inscritos (Pagados)
            const { data: compras } = await supabaseAdmin
                .from('ie_compras')
                .select('user_id')
                .eq('curso_id', cursoId)
                .eq('pagado', true)

            if (compras && compras.length > 0) {
                const studentIds = compras.map(c => c.user_id)

                // Obtener datos FINALES del curso (por si el draft venía incompleto)
                const { data: cursoFinal } = await supabaseAdmin
                    .from('ie_cursos')
                    .select('titulo, reunion_url, nota_profesor')
                    .eq('id', cursoId)
                    .single()

                if (cursoFinal && (cursoFinal.reunion_url || cursoFinal.nota_profesor)) {
                    // Obtener Correos de Alumnos (Desde Auth via Admin)
                    const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({
                        perPage: 1000
                    })

                    if (allUsers) {
                        const emailMap: Record<string, string> = {}
                        allUsers.forEach(u => { emailMap[u.id] = u.email || '' })
                        const emails = studentIds.map(id => emailMap[id]).filter(e => !!e)

                        if (emails.length > 0) {
                            const { sendReunionNotification } = await import('@/lib/mail')
                            try {
                                await sendReunionNotification({
                                    emails, 
                                    cursoTitulo: cursoFinal.titulo, 
                                    reunionUrl: cursoFinal.reunion_url, 
                                    notaProfesor: cursoFinal.nota_profesor 
                                })
                                console.log('[AUTO_NOTIFY_SUCCESS] Notificaciones enviadas vía Node.js')
                            } catch (mailErr) {
                                console.error('[AUTO_NOTIFY_MAIL_ERROR]', mailErr)
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error('[AUTO-NOTIFY-ERROR]', e)
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 })
    }
}
