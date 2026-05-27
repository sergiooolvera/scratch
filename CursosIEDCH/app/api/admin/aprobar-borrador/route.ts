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

        const { data: modulosActuales } = await supabaseAdmin
            .from('ie_curso_modulos')
            .select('id, titulo')
            .eq('curso_id', cursoId)

        const { data: examenesModularesActuales } = await supabaseAdmin
            .from('ie_examenes')
            .select('id, modulo_id')
            .eq('curso_id', cursoId)
            .not('modulo_id', 'is', null)

        const examenIds = (examenesModularesActuales || []).map((e: any) => e.id)
        const { data: resultadosModulares } = examenIds.length > 0
            ? await supabaseAdmin
                .from('ie_resultados_examenes')
                .select('examen_id')
                .in('examen_id', examenIds)
            : { data: [] }

        const examenesConResultados = new Set((resultadosModulares || []).map((r: any) => r.examen_id))
        const modulosProtegidos = new Set(
            (examenesModularesActuales || [])
                .filter((e: any) => examenesConResultados.has(e.id))
                .map((e: any) => e.modulo_id)
        )
        const draftModuloIds = new Set((modulos || []).map((m: any) => m.id).filter(Boolean))
        const modulosProtegidosEliminados = (modulosActuales || []).filter((m: any) => modulosProtegidos.has(m.id) && !draftModuloIds.has(m.id))

        if (modulosProtegidosEliminados.length > 0) {
            throw new Error(`No se puede aprobar el borrador porque intenta eliminar módulos con exámenes modulares contestados: ${modulosProtegidosEliminados.map((m: any) => m.titulo).join(', ')}`)
        }

        const modulosProtegidosSinExamen = (modulos || []).filter((m: any) => m.id && modulosProtegidos.has(m.id) && !m.examen)
        if (modulosProtegidosSinExamen.length > 0) {
            throw new Error(`No se puede aprobar el borrador porque intenta quitar exámenes modulares ya contestados en: ${modulosProtegidosSinExamen.map((m: any) => m.titulo).join(', ')}`)
        }

        // 1. Actualizar el curso base y limpiar el borrador
        const { data: cursoExistente, error: getErr } = await supabaseAdmin
            .from('ie_cursos')
            .select('creado_por')
            .eq('id', cursoId)
            .single()

        if (getErr) throw getErr
        const profesorId = cursoExistente?.creado_por;

        const { error: updateErr } = await supabaseAdmin.from('ie_cursos').update({
            ...cursoData,
            cambios_pendientes: null
        }).eq('id', cursoId)

        if (updateErr) throw updateErr

        // 2. Actualizar Módulos sin borrar los protegidos por resultados de alumnos.
        const modulosAEliminar = (modulosActuales || []).filter((m: any) => !draftModuloIds.has(m.id))
        if (modulosAEliminar.length > 0) {
            const { error: delErr } = await supabaseAdmin
                .from('ie_curso_modulos')
                .delete()
                .in('id', modulosAEliminar.map((m: any) => m.id))
            if (delErr) throw delErr
        }

        let nuevosModulosId: { id: string; orden: number }[] = [];
        if (modulos && modulos.length > 0) {
            for (const m of modulos) {
                const moduloPayload = {
                    curso_id: cursoId,
                    titulo: m.titulo,
                    url_contenido: m.url_contenido,
                    orden: m.orden
                }

                if (m.id) {
                    const { error: updModErr } = await supabaseAdmin
                        .from('ie_curso_modulos')
                        .update(moduloPayload)
                        .eq('id', m.id)
                    if (updModErr) throw updModErr
                    nuevosModulosId.push({ id: m.id, orden: m.orden })
                } else {
                    const { data: insertedMod, error: insErr } = await supabaseAdmin
                        .from('ie_curso_modulos')
                        .insert(moduloPayload)
                        .select('id, orden')
                        .single()
                    if (insErr) throw insErr
                    if (insertedMod) nuevosModulosId.push(insertedMod)
                }
            }

            // Insertar recursos de cada módulo en ie_modulo_recursos
            for (const m of modulos) {
                const matchMod = nuevosModulosId.find(item => item.orden === m.orden);
                if (matchMod) {
                    const moduloId = matchMod.id;
                    const recursosPayload = [];

                    await supabaseAdmin.from('ie_modulo_recursos').delete().eq('modulo_id', moduloId);

                    if (m.recursos && Array.isArray(m.recursos) && m.recursos.length > 0) {
                        m.recursos.forEach((r: any, rIdx: number) => {
                            recursosPayload.push({
                                modulo_id: moduloId,
                                titulo: r.titulo || 'Material del Módulo',
                                url_contenido: r.url_contenido || '',
                                orden: rIdx + 1,
                                descargable: !!r.descargable
                            });
                        });
                    } else if (m.url_contenido) {
                        // Fallback logic
                        recursosPayload.push({
                            modulo_id: moduloId,
                            titulo: 'Material del Módulo',
                            url_contenido: m.url_contenido,
                            orden: 1
                        });
                    }

                    if (recursosPayload.length > 0) {
                        const { error: recsErr } = await supabaseAdmin
                            .from('ie_modulo_recursos')
                            .insert(recursosPayload);
                        if (recsErr) throw recsErr;
                    }
                }
            }
        }

        // 3. Crear y Vincular Exámenes Modulares y Preguntas a partir del Borrador
        if (modulos && modulos.length > 0) {
            for (const m of modulos) {
                const matchMod = nuevosModulosId.find(item => item.orden === m.orden);
                if (matchMod) {
                    const moduloId = matchMod.id;
                    const { data: exmExistente } = await supabaseAdmin
                        .from('ie_examenes')
                        .select('id')
                        .eq('curso_id', cursoId)
                        .eq('modulo_id', moduloId)
                        .maybeSingle()

                    if (m.examen) {
                        const examPayload = {
                            curso_id: cursoId,
                            modulo_id: moduloId,
                            min_aprobacion: m.examen.min_aprobacion,
                            tiempo_limite: null,
                            seguridad_aumentada: false,
                            max_cambios_pantalla: 3,
                            intentos_permitidos: 3
                        }

                        let examenId = exmExistente?.id;
                        if (examenId) {
                            const { error: errExmMod } = await supabaseAdmin
                                .from('ie_examenes')
                                .update(examPayload)
                                .eq('id', examenId)
                            if (errExmMod) throw errExmMod
                        } else {
                            const { data: nuevoExmModular, error: errExmMod } = await supabaseAdmin
                            .from('ie_examenes')
                            .insert(examPayload)
                            .select('id')
                            .single()
                            if (errExmMod) throw errExmMod
                            examenId = nuevoExmModular?.id
                        }

                        // Insertar preguntas reactivas modulares en ie_preguntas
                        if (examenId && !examenesConResultados.has(examenId) && m.examen.preguntas && m.examen.preguntas.length > 0) {
                            await supabaseAdmin.from('ie_preguntas').delete().eq('examen_id', examenId)
                            const pregsModularParaInsertar = m.examen.preguntas.map((p: any) => {
                                const isLibre = p.tipo_pregunta === 'respuesta_libre';
                                return {
                                    examen_id: examenId,
                                    pregunta: p.pregunta,
                                    opcion_a: isLibre ? '' : (p.opcion_a || ''),
                                    opcion_b: isLibre ? '' : (p.opcion_b || ''),
                                    opcion_c: isLibre ? '' : (p.opcion_c || ''),
                                    opcion_d: isLibre ? '' : (p.opcion_d || ''),
                                    respuesta_correcta: isLibre ? 'A' : (p.respuesta_correcta || 'A'),
                                    tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                                    orden: p.orden
                                };
                            })
                            const { error: errPregsMod } = await supabaseAdmin
                                .from('ie_preguntas')
                                .insert(pregsModularParaInsertar)
                            
                            if (errPregsMod) throw errPregsMod
                        }
                    } else if (exmExistente && !examenesConResultados.has(exmExistente.id)) {
                        await supabaseAdmin.from('ie_examenes').delete().eq('id', exmExistente.id)
                    }

                    // Sincronizar Definiciones de Tareas
                    if (m.requiereTarea) {
                        const definitionKey = `TAREA_DEFINICION:${moduloId}`;
                        const definitionPayload = JSON.stringify({
                            instrucciones: m.tareaInstrucciones || '',
                            puntos: m.tareaPuntos || ''
                        });

                        const { data: existingDef } = await supabaseAdmin
                            .from('ie_preguntas_respuestas')
                            .select('id')
                            .eq('curso_id', cursoId)
                            .eq('respuesta', 'TAREA_DEFINICION')
                            .like('pregunta', `TAREA_DEFINICION:${moduloId}%`)
                            .maybeSingle();
                        
                        if (existingDef) {
                            await supabaseAdmin
                                .from('ie_preguntas_respuestas')
                                .update({ pregunta: `${definitionKey}::${definitionPayload}` })
                                .eq('id', existingDef.id);
                        } else if (profesorId) {
                            await supabaseAdmin
                                .from('ie_preguntas_respuestas')
                                .insert({
                                    curso_id: cursoId,
                                    user_id: profesorId,
                                    pregunta: `${definitionKey}::${definitionPayload}`,
                                    respuesta: 'TAREA_DEFINICION'
                                });
                        }
                    } else {
                        await supabaseAdmin
                            .from('ie_preguntas_respuestas')
                            .delete()
                            .eq('curso_id', cursoId)
                            .eq('respuesta', 'TAREA_DEFINICION')
                            .like('pregunta', `TAREA_DEFINICION:${moduloId}%`);
                    }
                }
            }
        }

        // 4. Actualizar Examen Final (modulo_id IS NULL)
        if (examen) {
            // Buscar si ya existe el examen final original
            let { data: exmExistente } = await supabaseAdmin
                .from('ie_examenes')
                .select('id')
                .eq('curso_id', cursoId)
                .is('modulo_id', null)
                .single()

            let examenId: string;

            if (exmExistente) {
                examenId = exmExistente.id;
                await supabaseAdmin.from('ie_examenes').update({ 
                    min_aprobacion: examen.min_aprobacion,
                    tiempo_limite: examen.tiempo_limite,
                    seguridad_aumentada: examen.seguridad_aumentada,
                    max_cambios_pantalla: examen.max_cambios_pantalla,
                    intentos_permitidos: examen.intentos_permitidos
                }).eq('id', examenId)
            } else {
                const { data: nuevoExm, error: nExError } = await supabaseAdmin
                    .from('ie_examenes')
                    .insert({ 
                        curso_id: cursoId, 
                        min_aprobacion: examen.min_aprobacion,
                        tiempo_limite: examen.tiempo_limite,
                        seguridad_aumentada: examen.seguridad_aumentada,
                        max_cambios_pantalla: examen.max_cambios_pantalla,
                        intentos_permitidos: examen.intentos_permitidos
                    })
                    .select()
                    .single()
                
                if (nExError) throw nExError
                examenId = nuevoExm.id
            }

            // Reemplazar preguntas del examen final
            await supabaseAdmin.from('ie_preguntas').delete().eq('examen_id', examenId)
            
            if (examen.preguntas && examen.preguntas.length > 0) {
                const pregsParaInsertar = examen.preguntas.map((p: any) => {
                    const isLibre = p.tipo_pregunta === 'respuesta_libre';
                    return {
                        examen_id: examenId,
                        pregunta: p.pregunta,
                        opcion_a: isLibre ? '' : (p.opcion_a || ''),
                        opcion_b: isLibre ? '' : (p.opcion_b || ''),
                        opcion_c: isLibre ? '' : (p.opcion_c || ''),
                        opcion_d: isLibre ? '' : (p.opcion_d || ''),
                        respuesta_correcta: isLibre ? 'A' : (p.respuesta_correcta || 'A'),
                        tipo_pregunta: p.tipo_pregunta || 'opcion_multiple',
                        orden: p.orden
                    };
                })
                await supabaseAdmin.from('ie_preguntas').insert(pregsParaInsertar)
            }
        } else {
            // Si el borrador no especifica examen final y requiere_examen es falso, eliminar examen final existente
            if (cursoData.requiere_examen === false) {
                await supabaseAdmin
                    .from('ie_examenes')
                    .delete()
                    .eq('curso_id', cursoId)
                    .is('modulo_id', null)
            }
        }

        // 5. AUTO-NOTIFY on draft approval
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
