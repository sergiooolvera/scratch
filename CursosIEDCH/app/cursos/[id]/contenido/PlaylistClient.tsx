'use client'

import { useState, useEffect } from 'react'
import ContentViewer from './ContentViewer'
import { PlayCircle, FileText, CheckCircle, Award, HelpCircle, AlertCircle, Sparkles, Lock, X } from 'lucide-react'
import { notifyProfesorTaskSubmission } from '@/app/actions/taskNotifications'
import { createClient } from '@/lib/supabase/client'

type Recurso = {
    id: string;
    modulo_id: string;
    titulo: string;
    url_contenido: string;
    orden: number;
    descargable?: boolean;
}

type Modulo = {
    id: string;
    titulo: string;
    url_contenido?: string;
    recursos?: Recurso[];
    descargable?: boolean;
    requiere_cuestionario?: boolean;
    cuestionarioPreguntas?: any[];
    cuestionarioRespuestas?: any[];
}

type ExamenModular = {
    id: string;
    min_aprobacion: number;
    preguntas: {
        id: string;
        pregunta: string;
        opcion_a: string;
        opcion_b: string;
        opcion_c: string;
        opcion_d: string;
        tipo_pregunta?: string;
    }[];
    aprobado: boolean;
}

export default function PlaylistClient({
    playlist,
    requiereExamen,
    urlExamen,
    cursoId,
    userId,
    bloquearAvance = false,
    requiereTareasAvance = false,
    requiereExamenAvance = false
}: {
    playlist: Modulo[],
    requiereExamen?: boolean,
    urlExamen?: string | null,
    cursoId: string,
    userId: string,
    bloquearAvance?: boolean,
    requiereTareasAvance?: boolean,
    requiereExamenAvance?: boolean
}) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [activeRecursoIndex, setActiveRecursoIndex] = useState(0)
    const [modalMensaje, setModalMensaje] = useState<string | null>(null)
    const [modulosVistos, setModulosVistos] = useState<string[]>([])
    const [savingProgress, setSavingProgress] = useState(false)

    const isModuleLocked = (index: number): boolean => {
        if (!bloquearAvance || index === 0) return false;

        // Check if all previous modules are completed
        for (let i = 0; i < index; i++) {
            const prevMod = playlist[i];
            const prevModId = prevMod.id || `modulo-${i}`;

            // Rule 1: Previous module must be marked as seen/completed (visto)
            const wasVisto = modulosVistos.includes(prevModId);
            if (!wasVisto) return true;

            // Rule 2: If requiereTareasAvance is active, previous module must have a task submission (entrega)
            const hasTaskDef = !!tareasDef[prevModId];
            if (requiereTareasAvance && hasTaskDef) {
                const hasSubmission = !!entregas[prevModId];
                if (!hasSubmission) return true;
            }

            // Rule 3: If requiereExamenAvance is active, previous module must have an exam that is passed (aprobado)
            const hasExamDef = !!examenes[prevModId];
            if (requiereExamenAvance && hasExamDef) {
                const isPassed = examenes[prevModId].aprobado;
                if (!isPassed) return true;
            }
        }

        return false;
    }
    const supabase = createClient()

    // Modular exams state
    const [examenes, setExamenes] = useState<Record<string, ExamenModular>>({})
    const [loadingExamenes, setLoadingExamenes] = useState(true)
    const [mostrarExamenActivo, setMostrarExamenActivo] = useState(false)
    const [respuestasExamen, setRespuestasExamen] = useState<Record<string, string>>({})
    const [explicacionesExamen, setExplicacionesExamen] = useState<Record<string, string>>({})
    const [gradingExamen, setGradingExamen] = useState(false)
    const [resultadoExamen, setResultadoExamen] = useState<{
        success: boolean;
        calificacion?: number;
        aprobado?: boolean;
        minAprobacion?: number;
        error?: string;
    } | null>(null)

    // Tasks and submissions state
    const [tareasDef, setTareasDef] = useState<Record<string, { instrucciones: string, puntos: string }>>({})
    const [entregas, setEntregas] = useState<Record<string, { id: string, explicacion: string, archivos: string[], calificacion: number | null, retroalimentacion: string | null }>>({})
    const [cargandoTareas, setCargandoTareas] = useState(true)

    useEffect(() => {
        fetchProgreso()
        fetchExamenesModulares()
        fetchTareasYEntregas()
    }, [cursoId, userId])

    const fetchTareasYEntregas = async () => {
        setCargandoTareas(true)
        try {
            const defRes = await fetch(`/api/cursos/tareas-definicion?cursoId=${cursoId}`);
            const tasksData = defRes.ok ? await defRes.json() : [];

            const defMap: Record<string, { instrucciones: string, puntos: string }> = {}
            tasksData?.forEach((t: any) => {
                const parts = t.pregunta.split('::')
                const header = parts[0]
                const modId = header.replace('TAREA_DEFINICION:', '').replace('[', '').replace(']', '')
                try {
                    const payload = JSON.parse(parts.slice(1).join('::'))
                    defMap[modId] = payload
                } catch (e) {
                    console.error('Error parsing task payload', e)
                }
            })
            setTareasDef(defMap)

            const { data: submissionsData } = await supabase
                .from('ie_preguntas_respuestas')
                .select('*')
                .eq('curso_id', cursoId)
                .eq('user_id', userId)
                .like('pregunta', 'TAREA_ENTREGA:%');

            const subMap: Record<string, { id: string, explicacion: string, archivos: string[], calificacion: number | null, retroalimentacion: string | null }> = {}
            submissionsData?.forEach(s => {
                const parts = s.pregunta.split('::')
                const header = parts[0]
                const modId = header.replace('TAREA_ENTREGA:', '').replace('[', '').replace(']', '')
                try {
                    const payload = JSON.parse(parts.slice(1).join('::'))
                    subMap[modId] = {
                        id: s.id,
                        explicacion: payload.explicacion,
                        archivos: payload.archivos || [],
                        calificacion: payload.calificacion,
                        retroalimentacion: payload.retroalimentacion
                    }
                } catch (e) {
                    console.error('Error parsing submission payload', e)
                }
            })
            setEntregas(subMap)
        } catch (e) {
            console.error('Error cargando tareas modulares:', e)
        } finally {
            setCargandoTareas(false)
        }
    }

    const handleRemoveFile = (indexToRemove: number) => {
        setArchivosSeleccionados(prev => prev.filter((_, i) => i !== indexToRemove))
    }

    const handleEnviarTarea = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!explicacionTarea.trim()) {
            setModalMensaje('Por favor escribe una explicación para tu tarea.')
            return
        }

        setEnviandoTarea(true)
        try {
            const urlsArchivos: string[] = []
            
            if (archivosSeleccionados.length > 0) {
                setSubiendoArchivos(true)
                for (const file of archivosSeleccionados) {
                    const ext = file.name.split('.').pop()
                    const uniqueName = `tareas_entregas/${userId}_${currentItem.id}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`
                    
                    const { error: uploadError } = await supabase.storage
                        .from('cursos_contenido')
                        .upload(uniqueName, file)

                    if (uploadError) {
                        throw new Error(`Error al subir archivo "${file.name}": ${uploadError.message}`)
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('cursos_contenido')
                        .getPublicUrl(uniqueName)

                    urlsArchivos.push(publicUrl)
                }
                setSubiendoArchivos(false)
            }

            const submissionPayload = JSON.stringify({
                explicacion: explicacionTarea,
                archivos: urlsArchivos,
                calificacion: null,
                retroalimentacion: null
            })

            const definitionKey = `TAREA_ENTREGA:${currentItem.id}`;

            const { error: insertError } = await supabase
                .from('ie_preguntas_respuestas')
                .insert({
                    curso_id: cursoId,
                    user_id: userId,
                    pregunta: `${definitionKey}::${submissionPayload}`,
                    respuesta: 'TAREA_ENTREGA'
                })

            if (insertError) {
                throw new Error(insertError.message)
            }

            // Notificar al profesor
            try {
                // userName might not be available directly, but we can pass a generic or fetch it if needed. Let's use 'Un alumno' since we don't have user profile here easily, or we can just send the email if available. We'll let the action handle it if it wants, but we'll pass 'Un alumno'.
                await notifyProfesorTaskSubmission(cursoId, userId, 'Un alumno', currentItem.titulo || 'Módulo');
            } catch (err) {
                console.error('Error enviando notificación:', err)
            }

            setModalMensaje('¡Tu tarea ha sido entregada con éxito!')
            await fetchTareasYEntregas()
        } catch (err: any) {
            console.error('Error al entregar tarea:', err)
            setModalMensaje(err.message || 'Ocurrió un error al entregar la tarea.')
        } finally {
            setEnviandoTarea(false)
            setSubiendoArchivos(false)
        }
    }

    // Reset modular exam UI states and active resource when active module changes
    const [explicacionTarea, setExplicacionTarea] = useState('')
    const [archivosSeleccionados, setArchivosSeleccionados] = useState<File[]>([])
    const [enviandoTarea, setEnviandoTarea] = useState(false)
    const [subiendoArchivos, setSubiendoArchivos] = useState(false)

    // Cuestionarios Abiertos
    const [respuestasCuestionario, setRespuestasCuestionario] = useState<Record<string, string>>({})
    const [enviandoCuestionario, setEnviandoCuestionario] = useState(false)
    const [localCuestionarioRespuestas, setLocalCuestionarioRespuestas] = useState<Record<string, any>>({})
    const handleEnviarCuestionario = async (e: React.FormEvent) => {
        e.preventDefault()
        
        if (currentItem.cuestionarioPreguntas) {
            for (const preg of currentItem.cuestionarioPreguntas) {
                if (!respuestasCuestionario[preg.id]?.trim()) {
                    setModalMensaje('Por favor responde todas las preguntas del cuestionario antes de enviar.')
                    return
                }
            }
        }

        setEnviandoCuestionario(true)
        try {
            const respuestasArray = Object.entries(respuestasCuestionario).map(([preguntaId, respuesta]) => ({
                pregunta_id: preguntaId,
                user_id: userId,
                respuesta: respuesta
            }));

            const { error: insertError } = await supabase
                .from('ie_cuestionario_respuestas')
                .insert(respuestasArray)

            if (insertError) throw insertError

            // Notificar al profesor
            try {
                const { notifyProfesorCuestionarioSubmission } = await import('@/app/actions/taskNotifications')
                await notifyProfesorCuestionarioSubmission(cursoId, userId, 'Un alumno', currentItem.titulo || 'Módulo')
            } catch (err) {
                console.error('Error enviando notificación al profesor:', err)
            }

            setLocalCuestionarioRespuestas(prev => ({
                ...prev,
                [currentItem.id]: {
                    modulo_id: currentItem.id,
                    user_id: userId,
                    respuestas: respuestasCuestionario,
                    estado: 'entregado',
                    created_at: new Date().toISOString()
                }
            }))
            
            setModalMensaje('¡Cuestionario enviado con éxito! El profesor lo revisará pronto.')
        } catch (err: any) {
            console.error('Error al enviar cuestionario:', err)
            setModalMensaje('Ocurrió un error al enviar tus respuestas.')
        } finally {
            setEnviandoCuestionario(false)
        }
    }

    useEffect(() => {
        setMostrarExamenActivo(false)
        setRespuestasExamen({})
        setExplicacionesExamen({})
        setResultadoExamen(null)
        setActiveRecursoIndex(0)
        setExplicacionTarea('')
        setArchivosSeleccionados([])
        setEnviandoTarea(false)
        setSubiendoArchivos(false)
        setRespuestasCuestionario({})
        setEnviandoCuestionario(false)
    }, [currentIndex])

    const fetchProgreso = async () => {
        const { data } = await supabase
            .from('ie_progreso_modulos')
            .select('modulo_id')
            .eq('user_id', userId)
            .eq('curso_id', cursoId)
            .eq('visto', true)
        
        if (data) {
            setModulosVistos(data.map(p => p.modulo_id))
        }
    }

    const fetchExamenesModulares = async () => {
        setLoadingExamenes(true)
        try {
            // Fetch exams linked to modules of this course
            const { data: exams } = await supabase
                .from('ie_examenes')
                .select('id, modulo_id, min_aprobacion')
                .eq('curso_id', cursoId)
                .not('modulo_id', 'is', null)

            if (exams && exams.length > 0) {
                const examIds = exams.map(e => e.id)

                // Fetch questions for these exams
                const { data: qData } = await supabase
                    .from('ie_preguntas')
                    .select('id, examen_id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, orden, tipo_pregunta')
                    .in('examen_id', examIds)
                    .order('orden', { ascending: true })

                // Fetch user results for these exams
                const { data: resultsData } = await supabase
                    .from('ie_resultados_examenes')
                    .select('examen_id, calificacion, aprobado')
                    .eq('user_id', userId)
                    .in('examen_id', examIds)

                const questionsByExam: Record<string, any[]> = {}
                if (qData) {
                    qData.forEach(q => {
                        if (!questionsByExam[q.examen_id]) {
                            questionsByExam[q.examen_id] = []
                        }
                        questionsByExam[q.examen_id].push(q)
                    })
                }

                const passedExams = new Set<string>()
                if (resultsData) {
                    resultsData.forEach(r => {
                        if (r.aprobado) {
                            passedExams.add(r.examen_id)
                        }
                    })
                }

                const examMap: Record<string, ExamenModular> = {}
                exams.forEach(e => {
                    examMap[e.modulo_id] = {
                        id: e.id,
                        min_aprobacion: e.min_aprobacion,
                        preguntas: questionsByExam[e.id] || [],
                        aprobado: passedExams.has(e.id)
                    }
                })

                setExamenes(examMap)
            }
        } catch (e) {
            console.error('Error cargando exámenes modulares:', e)
        } finally {
            setLoadingExamenes(false)
        }
    }

    const marcarComoVisto = async () => {
        const currentId = playlist[currentIndex].id || `modulo-${currentIndex}`
        setSavingProgress(true)

        const { error } = await supabase
            .from('ie_progreso_modulos')
            .upsert({
                user_id: userId,
                curso_id: cursoId,
                modulo_id: currentId,
                visto: true
            }, { onConflict: 'user_id, curso_id, modulo_id' })

        if (!error) {
            const updatedVistos = modulosVistos.includes(currentId) 
                ? modulosVistos 
                : [...modulosVistos, currentId];
            
            setModulosVistos(updatedVistos);

            // Advance to next if not last
            if (currentIndex < playlist.length - 1) {
                const nextIndex = currentIndex + 1;
                
                // Manual check for the current module's requirements
                const hasTaskDef = !!tareasDef[currentId];
                const requiresTask = requiereTareasAvance && hasTaskDef && !entregas[currentId];
                
                const hasExamDef = !!examenes[currentId];
                const requiresExam = requiereExamenAvance && hasExamDef && (!examenes[currentId] || !examenes[currentId].aprobado);

                if (bloquearAvance && (requiresTask || requiresExam)) {
                    let reqMessage = "¡Tema completado! Sin embargo, para acceder al siguiente módulo debes ";
                    if (requiresTask && requiresExam) {
                        reqMessage += "entregar la tarea y aprobar el examen modular de este tema.";
                    } else if (requiresTask) {
                        reqMessage += "entregar la tarea de este módulo.";
                    } else {
                        reqMessage += "aprobar el examen de este módulo.";
                    }
                    setModalMensaje(reqMessage);
                } else {
                    setCurrentIndex(nextIndex);
                }
            }
        }
        setSavingProgress(false)
    }

    const handleSelectOption = (preguntaId: string, opcionTexto: string) => {
        setRespuestasExamen(prev => ({ ...prev, [preguntaId]: opcionTexto }))
    }

    const handleGradingExamen = async (e: React.FormEvent) => {
        e.preventDefault()
        const exam = examenes[currentItem.id]
        if (!exam) return

        if (Object.keys(respuestasExamen).length < exam.preguntas.length) {
            setModalMensaje('Por favor responde todas las preguntas antes de enviar.')
            return
        }

        setGradingExamen(true)
        try {
            const { submitExamenModular } = await import('../examen/actions')
            const res = await submitExamenModular(exam.id, respuestasExamen, explicacionesExamen)
            
            if (res.success) {
                setResultadoExamen(res)
                if (res.aprobado) {
                    setExamenes(prev => ({
                        ...prev,
                        [currentItem.id]: {
                            ...prev[currentItem.id],
                            aprobado: true
                        }
                    }))
                }
            } else {
                setResultadoExamen({
                    success: false,
                    error: res.error || 'Ocurrió un error al enviar el examen.'
                })
            }
        } catch (err: any) {
            setResultadoExamen({
                success: false,
                error: err.message || 'Error de red al enviar el examen.'
            })
        } finally {
            setGradingExamen(false)
        }
    }

    if (!playlist || playlist.length === 0) {
        return (
            <div className="col-span-full">
                <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
                    <p className="text-gray-500 text-lg">El contenido de este curso aún no está disponible.</p>
                </div>
            </div>
        )
    }

    const currentItem = playlist[currentIndex]
    const isSingleItem = playlist.length === 1

    // Checks for active modular exam
    const hasActiveExam = !!(currentItem.id && examenes[currentItem.id])
    const activeExam = currentItem.id ? examenes[currentItem.id] : null
    const activeExamPassed = activeExam ? activeExam.aprobado : false

    return (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 w-full">
            {/* Main Content Viewer (80%) */}
            <div className={`${isSingleItem ? 'lg:col-span-5' : 'lg:col-span-4'} flex flex-col`}>
                <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 flex-grow">
                    <div className="p-4 sm:p-6 border-b border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 mb-1">
                                {currentItem.titulo}
                            </h2>
                            {!isSingleItem && (
                                <p className="text-sm text-gray-500">Módulo {currentIndex + 1} de {playlist.length}</p>
                            )}
                        </div>
                        {hasActiveExam && (
                            <div className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-sm border ${
                                activeExamPassed
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                                <Award className="h-4 w-4" />
                                {activeExamPassed
                                    ? 'Examen de Módulo Aprobado'
                                    : 'Examen de Módulo Pendiente'}
                            </div>
                        )}
                    </div>

                    <div className="p-4 sm:p-6 bg-gray-50 flex flex-col items-center">
                        {mostrarExamenActivo && activeExam ? (
                            /* Modular quiz interface rendered directly inside content zone */
                            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-md border border-gray-100 p-6 sm:p-8 transition-all duration-300">
                                {resultadoExamen?.success ? (
                                    <div className="text-center py-6">
                                        {resultadoExamen.aprobado ? (
                                            <div className="space-y-6">
                                                <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="h-10 w-10 text-emerald-600" />
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-gray-900">¡Excelente trabajo! Examen Aprobado</h3>
                                                <div className="inline-block bg-emerald-50 border border-emerald-100 rounded-xl px-8 py-4">
                                                    <p className="text-sm text-emerald-600 font-medium">Calificación Obtenida</p>
                                                    <p className="text-5xl font-black text-emerald-600 mt-1">{resultadoExamen.calificacion}%</p>
                                                    <p className="text-xs text-gray-400 mt-2">Mínimo aprobatorio: {resultadoExamen.minAprobacion}%</p>
                                                </div>
                                                <p className="text-sm text-gray-600 max-w-md mx-auto">
                                                    Has superado el examen de este módulo. Ahora puedes marcarlo como completado para registrar tu progreso.
                                                </p>
                                                <div className="pt-4 flex justify-center gap-4">
                                                    <button
                                                        onClick={() => setMostrarExamenActivo(false)}
                                                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                                                    >
                                                        Ver Material de Estudio
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setMostrarExamenActivo(false)
                                                            marcarComoVisto()
                                                        }}
                                                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-md transition"
                                                    >
                                                        Marcar Módulo Completado
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                                    <AlertCircle className="h-10 w-10 text-red-600" />
                                                </div>
                                                <h3 className="text-2xl font-extrabold text-gray-900">Calificación insuficiente</h3>
                                                <div className="inline-block bg-red-50 border border-red-100 rounded-xl px-8 py-4">
                                                    <p className="text-sm text-red-600 font-medium">Calificación Obtenida</p>
                                                    <p className="text-5xl font-black text-red-500 mt-1">{resultadoExamen.calificacion}%</p>
                                                    <p className="text-xs text-gray-400 mt-2">Mínimo aprobatorio: {resultadoExamen.minAprobacion}%</p>
                                                </div>
                                                <p className="text-sm text-gray-600 max-w-md mx-auto">
                                                    No te preocupes. Revisa el material de estudio e inténtalo de nuevo cuando estés listo. No hay límites de tiempo.
                                                </p>
                                                <div className="pt-4 flex justify-center gap-4">
                                                    <button
                                                        onClick={() => setMostrarExamenActivo(false)}
                                                        className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                                                    >
                                                        Volver al Material
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setResultadoExamen(null)
                                                            setRespuestasExamen({})
                                                            setExplicacionesExamen({})
                                                        }}
                                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                                                    >
                                                        Reintentar Examen
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <form onSubmit={handleGradingExamen} className="space-y-6">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                                            <h3 className="text-lg font-bold text-gray-900">Examen de Comprensión</h3>
                                            <button
                                                type="button"
                                                onClick={() => setMostrarExamenActivo(false)}
                                                className="text-sm font-semibold text-blue-600 hover:underline"
                                            >
                                                Volver al material
                                            </button>
                                        </div>

                                        {resultadoExamen?.error && (
                                            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-4 text-sm font-medium">
                                                {resultadoExamen.error}
                                            </div>
                                        )}

                                        <div className="space-y-8 my-6">
                                            {activeExam.preguntas.map((p, idx) => (
                                                <div key={p.id} className="bg-zinc-50 rounded-xl p-5 border border-gray-200">
                                                    <h4 className="font-bold text-gray-900 mb-4 flex items-start gap-2">
                                                        <span className="text-blue-600 font-black">{idx + 1}.</span>
                                                        <span>{p.pregunta}</span>
                                                    </h4>
                                                    {p.tipo_pregunta === 'respuesta_libre' ? (
                                                        <div className="mt-1">
                                                            <textarea
                                                                value={respuestasExamen[p.id] || ''}
                                                                onChange={(e) => handleSelectOption(p.id, e.target.value)}
                                                                className="w-full text-sm rounded-xl border-gray-300 focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white focus:outline-none transition"
                                                                rows={4}
                                                                placeholder="Escribe tu respuesta libre aquí..."
                                                                required
                                                            />
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="grid grid-cols-1 gap-2.5">
                                                                {[p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d].filter(Boolean).map((opcion, oIdx) => (
                                                                    <label
                                                                        key={oIdx}
                                                                        className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors text-sm font-medium ${
                                                                            respuestasExamen[p.id] === opcion
                                                                                ? 'bg-blue-50 border-blue-400 text-blue-900 ring-1 ring-blue-400'
                                                                                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        <input
                                                                            type="radio"
                                                                            name={`pregunta_${p.id}`}
                                                                            value={opcion}
                                                                            checked={respuestasExamen[p.id] === opcion}
                                                                            onChange={() => handleSelectOption(p.id, opcion)}
                                                                            className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                                                                        />
                                                                        <span className="ml-3 block leading-relaxed">{opcion}</span>
                                                                    </label>
                                                                ))}
                                                            </div>

                                                            <div className="mt-3.5">
                                                                <label className="block text-xs font-semibold text-gray-500 mb-1">Explica tu respuesta (Opcional):</label>
                                                                <textarea 
                                                                    value={explicacionesExamen[p.id] || ''} 
                                                                    onChange={(e) => setExplicacionesExamen(prev => ({ ...prev, [p.id]: e.target.value }))} 
                                                                    className="w-full text-sm rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" 
                                                                    rows={2}
                                                                    placeholder="Escribe tu justificación..."
                                                                />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="pt-4 border-t border-gray-100 flex justify-center">
                                            <button
                                                type="submit"
                                                disabled={gradingExamen || Object.keys(respuestasExamen).length < activeExam.preguntas.length}
                                                className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-full shadow-lg transition-transform transform active:scale-95 flex items-center justify-center gap-2"
                                            >
                                                {gradingExamen ? 'Evaluando respuestas...' : 'Enviar Respuestas'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        ) : (
                            /* Normal module visual content view */
                            <div className="w-full space-y-6">
                                {currentItem.recursos && currentItem.recursos.length > 1 && (
                                    <div className="flex flex-wrap gap-2 pb-4 border-b border-gray-200">
                                        {currentItem.recursos.map((rec, rIdx) => {
                                            const isRecActive = rIdx === activeRecursoIndex;
                                            return (
                                                <button
                                                    key={rec.id || rIdx}
                                                    type="button"
                                                    onClick={() => setActiveRecursoIndex(rIdx)}
                                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                                                        isRecActive
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-[1.02]'
                                                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {rec.titulo}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}

                                <div className="mb-2">
                                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Material Didáctico
                                    </h3>
                                </div>

                                {currentItem.recursos && currentItem.recursos.length > 0 ? (
                                    <ContentViewer 
                                        url={currentItem.recursos[activeRecursoIndex].url_contenido} 
                                        titulo={currentItem.recursos[activeRecursoIndex].titulo}
                                        descargable={currentItem.recursos[activeRecursoIndex].descargable || false}
                                    />
                                ) : currentItem.url_contenido ? (
                                    <ContentViewer 
                                        url={currentItem.url_contenido} 
                                        titulo={currentItem.titulo}
                                        descargable={currentItem.descargable || false}
                                    />
                                ) : (
                                    <div className="w-full flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
                                        <AlertCircle className="h-12 w-12 text-gray-300 mb-3 animate-pulse" />
                                        <h4 className="text-base font-bold text-gray-700 mb-1">Sin material de estudio</h4>
                                        <p className="text-gray-500 text-sm text-center max-w-sm">Este módulo no requiere o no cuenta con materiales adjuntos en esta sección.</p>
                                    </div>
                                )}
                                
                                <div id="examen-section" className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
                                    {hasActiveExam && !activeExamPassed && (
                                        <button
                                            onClick={() => setMostrarExamenActivo(true)}
                                            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all duration-300"
                                        >
                                            <HelpCircle className="h-5 w-5" />
                                            Realizar Examen del Módulo
                                        </button>
                                    )}

                                    <button
                                        onClick={marcarComoVisto}
                                        disabled={
                                            savingProgress ||
                                            modulosVistos.includes(currentItem.id || `modulo-${currentIndex}`) ||
                                            (hasActiveExam && !activeExamPassed)
                                        }
                                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shadow-sm ${
                                            modulosVistos.includes(currentItem.id || `modulo-${currentIndex}`)
                                            ? 'bg-green-100 text-green-700 cursor-default border border-green-200'
                                            : (hasActiveExam && !activeExamPassed)
                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-300'
                                                : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                    >
                                        <CheckCircle className="h-5 w-5" />
                                        {modulosVistos.includes(currentItem.id || `modulo-${currentIndex}`)
                                            ? 'Tema Completado'
                                            : (hasActiveExam && !activeExamPassed)
                                                ? 'Completa el examen para finalizar este tema'
                                                : (savingProgress ? 'Marcando...' : 'Marcar como Visto y Continuar')}
                                    </button>
                                </div>

                                {/* Tarea / Entregable Modular */}
                                {currentItem.id && tareasDef[currentItem.id] && (
                                    <div id="tarea-section" className="mt-12 bg-zinc-50 border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6">
                                        <div className="flex items-center gap-3 border-2 border-amber-400 bg-amber-50/80 rounded-xl p-4 shadow-sm">
                                            <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-amber-900">Proyecto o Tarea Práctica</h3>
                                                <p className="text-xs text-amber-700/80">Completa y envía esta práctica modular para la revisión del tutor.</p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm">
                                                <h4 className="text-sm font-bold text-gray-800 mb-2">Instrucciones del Tutor:</h4>
                                                <p className="text-sm text-gray-650 whitespace-pre-wrap leading-relaxed">
                                                    {tareasDef[currentItem.id].instrucciones}
                                                </p>
                                                
                                                {tareasDef[currentItem.id].puntos && (
                                                    <div className="mt-4 pt-4 border-t border-gray-100">
                                                        <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Criterios de Evaluación / Puntos a Revisar:</h5>
                                                        <ul className="flex flex-col gap-3">
                                                            {tareasDef[currentItem.id].puntos.split(',').map((p, idx) => (
                                                                <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm font-medium text-gray-700">
                                                                    <div className="h-1.5 w-1.5 bg-amber-500 rounded-full mt-1.5 flex-shrink-0" />
                                                                    <span className="leading-relaxed whitespace-pre-wrap">{p.trim()}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {entregas[currentItem.id] ? (
                                                /* Ya entregada */
                                                <div className="bg-emerald-50/50 border border-emerald-250 rounded-xl p-5 sm:p-6 space-y-4">
                                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                                        <div className="flex items-center gap-2">
                                                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                                                            <span className="font-bold text-emerald-900 text-sm">Tarea Entregada con Éxito</span>
                                                        </div>
                                                        <div>
                                                            {entregas[currentItem.id].calificacion !== null ? (
                                                                <span className="px-4 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-full shadow-sm">
                                                                    Calificación: {entregas[currentItem.id].calificacion}/100
                                                                </span>
                                                            ) : (
                                                                <span className="px-4 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-full shadow-sm">
                                                                    Pendiente de Revisión
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="bg-white rounded-lg border border-emerald-100 p-4 space-y-3">
                                                        <div>
                                                            <h5 className="text-xs font-bold text-gray-400">Tu explicación:</h5>
                                                            <p className="text-sm text-gray-700 mt-1">{entregas[currentItem.id].explicacion}</p>
                                                        </div>

                                                        {entregas[currentItem.id].archivos && entregas[currentItem.id].archivos.length > 0 && (
                                                            <div className="pt-2 border-t border-gray-100">
                                                                <h5 className="text-xs font-bold text-gray-400 mb-2">Archivos adjuntos:</h5>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {entregas[currentItem.id].archivos.map((url, fIdx) => (
                                                                        <a
                                                                            key={fIdx}
                                                                            href={url}
                                                                            target="_blank"
                                                                            rel="noopener noreferrer"
                                                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 rounded-lg text-xs font-bold text-zinc-700 transition"
                                                                        >
                                                                            <FileText className="h-3.5 w-3.5" />
                                                                            <span>Ver archivo #{fIdx + 1}</span>
                                                                        </a>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {entregas[currentItem.id].calificacion !== null && (
                                                        <div className="bg-emerald-100/50 border border-emerald-200/80 rounded-lg p-4 space-y-1">
                                                            <h5 className="text-xs font-bold text-emerald-900">Retroalimentación del Instructor:</h5>
                                                            <p className="text-sm text-emerald-800 italic">
                                                                {entregas[currentItem.id].retroalimentacion || 'Sin comentarios adicionales.'}
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                /* Formulario de Entrega */
                                                <form onSubmit={handleEnviarTarea} className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 space-y-4">
                                                    <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 shadow-sm flex items-center gap-3">
                                                        <div className="bg-blue-500 text-white p-2 rounded-lg shadow-sm">
                                                            <FileText className="h-5 w-5" />
                                                        </div>
                                                        <h4 className="text-lg font-extrabold text-blue-900 tracking-wide uppercase">Datos de Tarea</h4>
                                                    </div>
                                                    
                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Explicación del trabajo realizado:</label>
                                                        <textarea
                                                            rows={4}
                                                            required
                                                            placeholder="Describe brevemente el desarrollo de tu tarea, aclaraciones o respuestas a las preguntas planteadas..."
                                                            value={explicacionTarea}
                                                            onChange={(e) => setExplicacionTarea(e.target.value)}
                                                            className="w-full text-sm rounded-xl border-gray-300 p-3 border bg-white text-black font-semibold"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-xs font-bold text-gray-500 mb-1">Adjuntar Archivos (Pruebas, Códigos o Capturas):</label>
                                                        <div className="flex flex-col gap-3">
                                                            <div className="relative border-2 border-dashed border-gray-300 hover:border-amber-500 transition rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer bg-zinc-50/50">
                                                                <input
                                                                    type="file"
                                                                    multiple
                                                                    onChange={(e) => {
                                                                        if (e.target.files) {
                                                                            setArchivosSeleccionados(prev => [...prev, ...Array.from(e.target.files!)])
                                                                        }
                                                                    }}
                                                                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                                                />
                                                                <FileText className="h-8 w-8 text-gray-400 mb-2" />
                                                                <p className="text-xs font-bold text-gray-600 text-center">Seleccionar Archivo(s)</p>
                                                                <p className="text-[10px] text-gray-400 text-center mt-1">Arrastra o haz clic para subir</p>
                                                            </div>

                                                            {archivosSeleccionados.length > 0 && (
                                                                <div className="space-y-1.5">
                                                                    <p className="text-xs font-bold text-gray-500">Archivos seleccionados:</p>
                                                                    <div className="flex flex-col gap-1">
                                                                        {archivosSeleccionados.map((file, fIdx) => (
                                                                            <div key={fIdx} className="flex items-center justify-between px-3 py-2 bg-zinc-50 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700">
                                                                                <span className="truncate max-w-[250px]">{file.name}</span>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleRemoveFile(fIdx)}
                                                                                    className="text-red-500 hover:text-red-700 font-bold transition ml-2"
                                                                                >
                                                                                    Eliminar
                                                                                </button>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-gray-100 flex justify-end">
                                                        <button
                                                            type="submit"
                                                            disabled={enviandoTarea}
                                                            className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-xs sm:text-sm"
                                                        >
                                                            {enviandoTarea ? (subiendoArchivos ? 'Subiendo archivos...' : 'Enviando...') : 'Enviar Tarea'}
                                                        </button>
                                                    </div>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Cuestionario Modular */}
                                {currentItem.id && currentItem.requiere_cuestionario && currentItem.cuestionarioPreguntas && currentItem.cuestionarioPreguntas.length > 0 && (
                                    <div id="cuestionario-section" className="mt-12 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                                        <div className="flex items-center gap-3 border-2 border-blue-400 bg-blue-50/80 rounded-xl p-4 shadow-sm">
                                            <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-sm">
                                                <FileText className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-blue-900">Cuestionario Abierto</h3>
                                                <p className="text-xs text-blue-700/80">Responde las siguientes preguntas. El profesor evaluará tus respuestas.</p>
                                            </div>
                                        </div>

                                        {(localCuestionarioRespuestas[currentItem.id] || (currentItem.cuestionarioRespuestas && currentItem.cuestionarioRespuestas.length > 0)) ? (
                                            (() => {
                                                const respuestaObj = localCuestionarioRespuestas[currentItem.id] || currentItem.cuestionarioRespuestas![0]
                                                return (
                                                    <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-5 sm:p-6 space-y-4">
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <CheckCircle className="h-5 w-5 text-blue-600" />
                                                            <span className="font-bold text-blue-900 text-sm">Cuestionario Enviado</span>
                                                        </div>
                                                        
                                                        <div className="space-y-4">
                                                            {currentItem.cuestionarioPreguntas.map((preg: any, idx: number) => {
                                                                const localAns = localCuestionarioRespuestas[currentItem.id]?.respuestas?.[preg.id]
                                                                const dbAnsObj = currentItem.cuestionarioRespuestas?.find((r: any) => r.pregunta_id === preg.id)
                                                                const answerText = localAns || dbAnsObj?.respuesta || 'Sin respuesta'
                                                                
                                                                return (
                                                                <div key={preg.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                                                                    <p className="text-sm font-bold text-gray-800">{idx + 1}. {preg.pregunta}</p>
                                                                    <div className="text-sm text-gray-700 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 whitespace-pre-wrap">
                                                                        {answerText}
                                                                    </div>
                                                                    
                                                                    {dbAnsObj?.calificacion && (
                                                                        <div className="mt-4 p-4 rounded-xl border bg-blue-50/30 flex items-start gap-4 shadow-sm">
                                                                            <div className="flex-1 space-y-2">
                                                                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                                                                    dbAnsObj.calificacion === 'Excelente' || dbAnsObj.calificacion === 'Buena' ? 'bg-green-100 text-green-700 border border-green-200' :
                                                                                    dbAnsObj.calificacion === 'Regular' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                                                                    'bg-red-100 text-red-700 border border-red-200'
                                                                                }`}>
                                                                                    Evaluación del Profesor: {dbAnsObj.calificacion}
                                                                                </span>
                                                                                {dbAnsObj.feedback && (
                                                                                    <p className="text-sm text-gray-700 italic border-l-2 border-blue-200 pl-3">"{dbAnsObj.feedback}"</p>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )})}
                                                        </div>
                                                    </div>
                                                )
                                            })()
                                        ) : (
                                            <form onSubmit={handleEnviarCuestionario} className="space-y-6">
                                                <div className="space-y-6">
                                                    {currentItem.cuestionarioPreguntas.map((preg: any, idx: number) => (
                                                        <div key={preg.id} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                                            <p className="text-sm font-bold text-gray-900 mb-3">{idx + 1}. {preg.pregunta}</p>
                                                            <textarea
                                                                rows={4}
                                                                required
                                                                placeholder="Escribe tu respuesta aquí..."
                                                                value={respuestasCuestionario[preg.id] || ''}
                                                                onChange={(e) => setRespuestasCuestionario(prev => ({ ...prev, [preg.id]: e.target.value }))}
                                                                className="w-full text-sm rounded-xl border-gray-300 p-3 border bg-white text-black focus:ring-blue-500 focus:border-blue-500"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-end pt-4 border-t border-gray-100">
                                                    <button
                                                        type="submit"
                                                        disabled={enviandoCuestionario}
                                                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 text-sm"
                                                    >
                                                        {enviandoCuestionario ? 'Enviando...' : 'Enviar Respuestas'}
                                                    </button>
                                                </div>
                                            </form>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Playlist Sidebar */}
            {!isSingleItem && (
                <div className="lg:col-span-1">
                    <div className="bg-white shadow-lg rounded-2xl border border-gray-100 overflow-hidden sticky top-8">
                        <div className="p-4 bg-gray-50 border-b border-gray-200">
                            <h3 className="font-bold text-gray-900 flex items-center">
                                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                                Contenido del Curso
                            </h3>
                        </div>
                        <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {playlist.map((item, index) => {
                                const isActive = index === currentIndex
                                const hasExam = !!(item.id && examenes[item.id])
                                const isExamPassed = hasExam ? examenes[item.id].aprobado : false
                                const isVisto = modulosVistos.includes(item.id || `modulo-${index}`)
                                const recursos = item.recursos || []
                                const locked = isModuleLocked(index)

                                return (
                                    <li key={item.id || index}>
                                        <button
                                            onClick={() => {
                                                if (locked) {
                                                    setModalMensaje('Este módulo se encuentra bloqueado. Para acceder, debes completar el material de estudio anterior, enviar tus tareas y/o aprobar el examen modular según corresponda.')
                                                    return
                                                }
                                                setCurrentIndex(index)
                                                setActiveRecursoIndex(0)
                                            }}
                                            className={`w-full text-left px-4 py-4 flex items-start transition-colors ${
                                                locked 
                                                ? 'opacity-40 cursor-not-allowed bg-zinc-50/50 hover:bg-zinc-50/50' 
                                                : `hover:bg-gray-50 ${isActive ? 'bg-blue-50/75 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`
                                            }`}
                                        >
                                            {locked ? (
                                                <Lock className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-gray-400" />
                                            ) : isVisto ? (
                                                <CheckCircle className="h-5 w-5 mt-0.5 mr-3 flex-shrink-0 text-green-500" />
                                            ) : (
                                                <PlayCircle className={`h-5 w-5 mt-0.5 mr-3 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                            )}
                                            <div className="flex-grow min-w-0">
                                                <p className={`text-sm font-medium truncate ${isActive ? 'text-blue-900' : 'text-gray-700'}`}>
                                                    {index + 1}. {item.titulo}
                                                </p>
                                                {recursos.length > 0 && (
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {recursos.length} recurso{recursos.length === 1 ? '' : 's'}
                                                    </p>
                                                )}
                                                <div className="flex flex-col items-start gap-1.5 mt-2">
                                                    {hasExam && (
                                                        <span 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (locked) return;
                                                                if (index !== currentIndex) {
                                                                    setCurrentIndex(index);
                                                                    setActiveRecursoIndex(0);
                                                                    setTimeout(() => document.getElementById('examen-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
                                                                } else {
                                                                    document.getElementById('examen-section')?.scrollIntoView({ behavior: 'smooth' });
                                                                }
                                                            }}
                                                            className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                                                            isExamPassed
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                            : 'bg-amber-50 text-amber-600 border border-amber-200'
                                                        }`}>
                                                            <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                            {isExamPassed ? 'Examen listo' : 'Tiene Examen'}
                                                        </span>
                                                    )}
                                                    {(item.requiere_cuestionario && item.cuestionarioPreguntas && item.cuestionarioPreguntas.length > 0) && (
                                                        <span 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (locked) return;
                                                                if (index !== currentIndex) {
                                                                    setCurrentIndex(index);
                                                                    setActiveRecursoIndex(0);
                                                                    setTimeout(() => document.getElementById('cuestionario-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
                                                                } else {
                                                                    document.getElementById('cuestionario-section')?.scrollIntoView({ behavior: 'smooth' });
                                                                }
                                                            }}
                                                            className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                                                            (item.cuestionarioRespuestas && item.cuestionarioRespuestas.length > 0)
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                            : 'bg-blue-50 text-blue-600 border border-blue-200'
                                                        }`}>
                                                            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                            {(item.cuestionarioRespuestas && item.cuestionarioRespuestas.length > 0) ? 'Cuest. Enviado' : 'Tiene Cuest.'}
                                                        </span>
                                                    )}
                                                    {(item.id && tareasDef[item.id]) && (
                                                        <span 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (locked) return;
                                                                if (index !== currentIndex) {
                                                                    setCurrentIndex(index);
                                                                    setActiveRecursoIndex(0);
                                                                    setTimeout(() => document.getElementById('tarea-section')?.scrollIntoView({ behavior: 'smooth' }), 300);
                                                                } else {
                                                                    document.getElementById('tarea-section')?.scrollIntoView({ behavior: 'smooth' });
                                                                }
                                                            }}
                                                            className={`inline-flex items-center gap-1 text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 transition-opacity ${
                                                            entregas[item.id]
                                                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                            : 'bg-purple-50 text-purple-600 border border-purple-200'
                                                        }`}>
                                                            <FileText className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                                                            {entregas[item.id] ? 'Tarea Enviada' : 'Tiene Tarea'}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                        {recursos.length > 0 && !locked && (
                                            <div className={`px-4 pb-3 pl-12 space-y-1 ${isActive ? 'bg-blue-50/75' : 'bg-white'}`}>
                                                {recursos.map((recurso, recursoIndex) => {
                                                    const isResourceActive = isActive && activeRecursoIndex === recursoIndex
                                                    return (
                                                        <button
                                                            key={recurso.id || `${item.id}-${recursoIndex}`}
                                                            type="button"
                                                            onClick={() => {
                                                                setCurrentIndex(index)
                                                                setActiveRecursoIndex(recursoIndex)
                                                            }}
                                                            className={`w-full text-left text-xs rounded-md px-2 py-1.5 transition-colors ${
                                                                isResourceActive
                                                                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                                                                    : 'text-gray-600 hover:bg-gray-100'
                                                            }`}
                                                        >
                                                            <span className="block truncate">{recursoIndex + 1}. {recurso.titulo || 'Recurso sin título'}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        )}
                                    </li>
                                )
                            })}
                        </ul>
                    </div>
                </div>
            )}

            {modalMensaje && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-100 transform scale-100 transition-all duration-300 animate-scaleUp">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-50 text-amber-500 mx-auto mb-4 border border-amber-200">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Atención</h3>
                        <p className="text-sm text-gray-600 text-center leading-relaxed mb-6">{modalMensaje}</p>
                        <div className="flex justify-center">
                            <button
                                type="button"
                                onClick={() => setModalMensaje(null)}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors"
                            >
                                Entendido
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
