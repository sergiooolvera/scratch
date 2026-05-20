'use client'

import { useState, useEffect } from 'react'
import ContentViewer from './ContentViewer'
import { PlayCircle, FileText, CheckCircle, Award, HelpCircle, AlertCircle, Sparkles } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Recurso = {
    id: string;
    modulo_id: string;
    titulo: string;
    url_contenido: string;
    orden: number;
}

type Modulo = {
    id: string;
    titulo: string;
    url_contenido?: string;
    recursos?: Recurso[];
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
    userId
}: {
    playlist: Modulo[],
    requiereExamen?: boolean,
    urlExamen?: string | null,
    cursoId: string,
    userId: string
}) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [activeRecursoIndex, setActiveRecursoIndex] = useState(0)
    const [modalMensaje, setModalMensaje] = useState<string | null>(null)
    const [modulosVistos, setModulosVistos] = useState<string[]>([])
    const [savingProgress, setSavingProgress] = useState(false)
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

    useEffect(() => {
        fetchProgreso()
        fetchExamenesModulares()
    }, [cursoId, userId])

    // Reset modular exam UI states and active resource when active module changes
    useEffect(() => {
        setMostrarExamenActivo(false)
        setRespuestasExamen({})
        setExplicacionesExamen({})
        setResultadoExamen(null)
        setActiveRecursoIndex(0)
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
            if (!modulosVistos.includes(currentId)) {
                setModulosVistos([...modulosVistos, currentId])
            }
            // Advance to next if not last
            if (currentIndex < playlist.length - 1) {
                setCurrentIndex(currentIndex + 1)
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

                                {currentItem.recursos && currentItem.recursos.length > 0 ? (
                                    <ContentViewer url={currentItem.recursos[activeRecursoIndex].url_contenido} />
                                ) : currentItem.url_contenido ? (
                                    <ContentViewer url={currentItem.url_contenido} />
                                ) : (
                                    <div className="w-full flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-dashed border-gray-300 shadow-sm">
                                        <AlertCircle className="h-12 w-12 text-gray-300 mb-3 animate-pulse" />
                                        <h4 className="text-base font-bold text-gray-700 mb-1">Sin material de estudio</h4>
                                        <p className="text-gray-500 text-sm text-center max-w-sm">Este módulo no requiere o no cuenta con materiales adjuntos en esta sección.</p>
                                    </div>
                                )}
                                
                                <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
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

                                return (
                                    <li key={item.id || index}>
                                        <button
                                            onClick={() => {
                                                setCurrentIndex(index)
                                                setActiveRecursoIndex(0)
                                            }}
                                            className={`w-full text-left px-4 py-4 flex items-start transition-colors hover:bg-gray-50 ${isActive ? 'bg-blue-50/75 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                                        >
                                            {isVisto ? (
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
                                                {hasExam && (
                                                    <span className={`inline-flex items-center gap-1 mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                                        isExamPassed
                                                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                        : 'bg-amber-50 text-amber-600 border border-amber-200'
                                                    }`}>
                                                        <Sparkles className="h-3 w-3" />
                                                        {isExamPassed ? 'Examen listo' : 'Tiene Examen'}
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                        {recursos.length > 0 && (
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
