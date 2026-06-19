'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { 
    ArrowLeft, 
    BookOpen, 
    User, 
    CheckCircle, 
    XCircle, 
    AlertTriangle, 
    Lock, 
    MessageSquare, 
    Award, 
    Clock, 
    GraduationCap, 
    FileQuestion, 
    Sparkles,
    ChevronRight,
    ClipboardList
} from 'lucide-react'

export default function AlumnoRevisionCuestionariosPage() {
    const [respuestas, setRespuestas] = useState<any[]>([])
    const [preguntasCuestionarios, setPreguntasCuestionarios] = useState<any[]>([])
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
    const [modulos, setModulos] = useState<any[]>([])
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [selectedModulo, setSelectedModulo] = useState<any>(null) // selected modulo ID for detailed view
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                // 1. Fetch purchases (enrolled courses)
                const { data: comprasData, error: comprasError } = await supabase
                    .from('ie_compras')
                    .select('curso_id')
                    .eq('user_id', user.id)
                    .eq('pagado', true)

                if (comprasError) console.error("Error fetching purchases:", comprasError)
                const enrolledCursoIds = Array.from(new Set(comprasData?.map(c => c.curso_id).filter(Boolean) || []))

                // 2. Fetch course details
                let enrolledCoursesData: any[] = []
                if (enrolledCursoIds.length > 0) {
                    const { data: cData } = await supabase
                        .from('ie_cursos')
                        .select('id, titulo')
                        .in('id', enrolledCursoIds)
                    enrolledCoursesData = cData || []
                }
                setEnrolledCourses(enrolledCoursesData)

                // 3. Fetch student's questionnaire responses
                const { data: respData, error: respError } = await supabase
                    .from('ie_cuestionario_respuestas')
                    .select('*')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (respError) {
                    console.error("Error fetching questionnaire responses:", respError)
                    setLoading(false)
                    return
                }
                setRespuestas(respData || [])

                // 4. Fetch questions to map answers to modules
                const preguntaIds = Array.from(new Set(respData?.map(r => r.pregunta_id).filter(Boolean) || []))
                let pregsData: any[] = []
                if (preguntaIds.length > 0) {
                    const { data } = await supabase
                        .from('ie_cuestionario_preguntas')
                        .select('*')
                        .in('id', preguntaIds)
                        .order('orden', { ascending: true })
                    pregsData = data || []
                }
                setPreguntasCuestionarios(pregsData)

                // 5. Fetch modules involved in these questions
                const moduloIds = Array.from(new Set(pregsData.map(p => p.modulo_id).filter(Boolean)))
                let modsData: any[] = []
                if (moduloIds.length > 0) {
                    const { data } = await supabase
                        .from('ie_curso_modulos')
                        .select('id, titulo, curso_id, orden')
                        .in('id', moduloIds)
                    modsData = data || []
                }
                setModulos(modsData)

                // Fetch extra courses detail for historical results (if not in enrolled)
                const allCursoIdsFromResults = Array.from(new Set(modsData.map(m => m.curso_id).filter(Boolean)))
                const missingCursoIds = allCursoIdsFromResults.filter(id => !enrolledCursoIds.includes(id))

                let allCursosData = [...enrolledCoursesData]
                if (missingCursoIds.length > 0) {
                    const { data: extraCursos } = await supabase
                        .from('ie_cursos')
                        .select('id, titulo')
                        .in('id', missingCursoIds)
                    if (extraCursos) {
                        allCursosData = [...allCursosData, ...extraCursos]
                    }
                    setEnrolledCourses(allCursosData)
                }

            } catch (err) {
                console.error("Error in fetchData for cuestionarios:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [supabase])

    // Find and merge all courses (active + historical) that have answered questionnaires
    const enrolledIds = enrolledCourses.map(c => c.id)
    const allCourses: any[] = enrolledCourses.map(c => ({
        id: c.id,
        titulo: c.titulo,
        isHistorical: false
    }))

    // Add any extra historical courses from modulos that are not in enrolled
    modulos.forEach(m => {
        if (m.curso_id && !enrolledIds.includes(m.curso_id)) {
            const alreadyAdded = allCourses.some(c => c.id === m.curso_id)
            if (!alreadyAdded) {
                const resultsInThisCourse = respuestas.some(r => {
                    const q = preguntasCuestionarios.find(p => p.id === r.pregunta_id)
                    return q && q.modulo_id === m.id
                })
                if (resultsInThisCourse) {
                    allCourses.push({
                        id: m.curso_id,
                        titulo: 'Curso Histórico',
                        isHistorical: true
                    })
                }
            }
        }
    })

    // Selected course modules list
    const courseModulos = selectedCourse
        ? modulos.filter(m => m.curso_id === selectedCourse.id)
        : []

    // Filter modulos to show only those that have at least one answered question by the student
    const activeModulos = courseModulos.filter(m => {
        return respuestas.some(r => {
            const q = preguntasCuestionarios.find(p => p.id === r.pregunta_id)
            return q && q.modulo_id === m.id
        })
    })

    // Selected module's responses and questions details
    const selectedModuloData = selectedModulo
        ? modulos.find(m => m.id === selectedModulo)
        : null

    const selectedModuloPreguntas = selectedModulo
        ? preguntasCuestionarios.filter(p => p.modulo_id === selectedModulo)
        : []

    // General stats for empty/welcome state
    const totalRespuestas = respuestas.length
    const totalCuestionariosContestados = Array.from(new Set(
        respuestas.map(r => {
            const q = preguntasCuestionarios.find(p => p.id === r.pregunta_id)
            return q ? q.modulo_id : null
        }).filter(Boolean)
    )).length

    if (loading) return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-zinc-50">
            <div className="text-gray-500 animate-pulse text-lg font-medium">Cargando cuestionarios...</div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans p-6 sm:p-10">
            <div className="max-w-5xl mx-auto">
                
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/mis-cursos"
                        className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a mis cursos
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center tracking-tight">
                        <ClipboardList className="h-8 w-8 mr-3 text-blue-600" /> Mis Cuestionarios
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">Revisa tus cuestionarios completados, calificaciones de respuestas libres y retroalimentaciones.</p>
                </div>

                {/* Course Select Dropdown */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <label htmlFor="course-select" className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Selecciona un curso</label>
                            <p className="text-xs text-zinc-500">Elige un curso para ver tus cuestionarios</p>
                        </div>
                    </div>
                    <div className="w-full sm:w-80">
                        <select
                            id="course-select"
                            value={selectedCourse?.id || ''}
                            onChange={(e) => {
                                const val = e.target.value
                                if (!val) {
                                    setSelectedCourse(null)
                                    setSelectedModulo(null)
                                } else {
                                    const found = allCourses.find(c => c.id === val)
                                    setSelectedCourse(found || null)
                                    setSelectedModulo(null)
                                }
                            }}
                            className="block w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer shadow-sm"
                        >
                            <option value="">-- Selecciona un curso --</option>
                            {allCourses.map((c) => {
                                const courseMods = modulos.filter(m => m.curso_id === c.id)
                                const count = courseMods.filter(m => {
                                    return respuestas.some(r => {
                                        const q = preguntasCuestionarios.find(p => p.id === r.pregunta_id)
                                        return q && q.modulo_id === m.id
                                    })
                                }).length
                                return (
                                    <option key={c.id} value={c.id}>
                                        {c.titulo} ({count} {count === 1 ? 'cuestionario' : 'cuestionarios'})
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                {/* Content Pane */}
                {selectedCourse === null ? (
                    /* VIEW 1: WELCOME SCREEN */
                    <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-zinc-200/85 text-center animate-in fade-in duration-300">
                        <div className="max-w-2xl mx-auto">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <ClipboardList className="h-8 w-8" />
                            </div>
                            
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                Tus Cuestionarios Entregados
                            </h2>
                            <p className="text-gray-500 mt-3 text-sm sm:text-base leading-relaxed">
                                Selecciona un curso del desplegable de arriba para examinar tus entregas, los comentarios de revisión del docente y la calificación asignada a tus cuestionarios.
                            </p>

                            {totalRespuestas > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left max-w-xl mx-auto">
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between">
                                        <p className="text-xs text-gray-405 font-bold uppercase tracking-wider">Cursos Activos</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-gray-900">{enrolledCourses.length}</span>
                                            <span className="text-xs text-gray-405">inscritos</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between font-medium">
                                        <p className="text-xs text-gray-455 font-bold uppercase tracking-wider">Cuestionarios</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-blue-600">{totalCuestionariosContestados}</span>
                                            <span className="text-xs text-gray-405">contestados</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between font-medium">
                                        <p className="text-xs text-gray-455 font-bold uppercase tracking-wider">Respuestas</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-gray-900">{totalRespuestas}</span>
                                            <span className="text-xs text-gray-405">totales</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-8 p-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                    <p className="text-sm text-gray-550 font-medium">Aún no has respondido ningún cuestionario modular. Tus actividades se mostrarán aquí una vez completadas.</p>
                                </div>
                            )}

                            <div className="mt-10 pt-8 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-400 font-semibold">
                                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                                <span>Selecciona un curso en el menú superior para empezar</span>
                            </div>
                        </div>
                    </div>
                ) : selectedModulo === null ? (
                    /* VIEW 2: COURSE MODULES GRID */
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 animate-in fade-in duration-300">
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-955 uppercase tracking-wide flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                    {selectedCourse.titulo}
                                </h2>
                                <p className="text-xs text-gray-550 mt-1.5 font-medium">Selecciona un módulo para revisar tus cuestionarios:</p>
                            </div>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
                                {activeModulos.length} {activeModulos.length === 1 ? 'Cuestionario' : 'Cuestionarios'}
                            </span>
                        </div>

                        {activeModulos.length === 0 ? (
                            <div className="text-center py-16 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                                <FileQuestion className="h-14 w-14 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-zinc-800">Sin cuestionarios entregados</h3>
                                <p className="text-xs text-zinc-455 mt-1.5 max-w-sm mx-auto leading-relaxed">
                                    Aún no has respondido ningún cuestionario en este curso. Los cuestionarios aparecen al final de los módulos en las clases activas.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeModulos.map((m: any) => {
                                    const moduloRespuestas = respuestas.filter(r => {
                                        const q = preguntasCuestionarios.find(p => p.id === r.pregunta_id)
                                        return q && q.modulo_id === m.id
                                    })
                                    const sinCalificar = moduloRespuestas.some(r => !r.calificacion)

                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => setSelectedModulo(m.id)}
                                            className="p-4 rounded-xl border border-zinc-150 hover:border-blue-300 hover:bg-blue-50/20 bg-white transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4 group"
                                        >
                                            <div className="min-w-0">
                                                <span className="inline-block text-[9px] font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded uppercase tracking-wider mb-1 border border-blue-100">
                                                    Módulo {m.orden || ''}
                                                </span>
                                                <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-blue-700 transition truncate pr-2">
                                                    {m.titulo}
                                                </h3>
                                                <p className="text-[10px] text-gray-455 mt-1 flex items-center gap-1 font-medium">
                                                    <Clock className="h-3 w-3" />
                                                    {moduloRespuestas.length} respuestas
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap inline-block ${
                                                    sinCalificar 
                                                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                                        : 'bg-green-50 text-green-700 border-green-200'
                                                }`}>
                                                    {sinCalificar ? 'Pendiente' : 'Calificado'}
                                                </span>
                                                <ChevronRight className="h-4.5 w-4.5 text-gray-300 group-hover:text-blue-500 transition group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* VIEW 3: DETAILED MODULE QUESTIONS AND FEEDBACK */
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 animate-in fade-in duration-300">
                        {/* Navigation back button */}
                        <button 
                            onClick={() => setSelectedModulo(null)}
                            className="text-xs font-bold text-gray-555 hover:text-gray-900 flex items-center gap-1 transition cursor-pointer mb-5"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Volver a los cuestionarios de {selectedCourse.titulo}
                        </button>

                        {/* Title and Module details */}
                        <div className="border-b pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 mb-2 uppercase tracking-widest border border-blue-100">
                                    Módulo {selectedModuloData?.orden || ''}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                                    Cuestionario: {selectedModuloData?.titulo}
                                </h2>
                                <p className="text-sm font-semibold text-zinc-550 mt-1">
                                    {selectedCourse.titulo}
                                </p>
                            </div>
                        </div>

                        {/* Questions list */}
                        <div className="space-y-6">
                            {selectedModuloPreguntas.map((p, index) => {
                                const resp = respuestas.find(r => r.pregunta_id === p.id)
                                const calificado = resp?.calificacion

                                return (
                                    <div key={p.id} className="border border-zinc-200 rounded-xl p-5 shadow-sm bg-white hover:bg-zinc-50/20 transition-all duration-200 relative">
                                        <div className="flex justify-between items-start gap-4 mb-4">
                                            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base pr-28 leading-snug">
                                                <span className="text-blue-600 mr-1">{index + 1}.</span> {p.pregunta}
                                            </h3>
                                            <div className="absolute top-5 right-5">
                                                {calificado ? (
                                                    <span className={`flex items-center text-[10px] font-black gap-1 px-3 py-0.5 rounded-full border shadow-sm ${
                                                        resp.calificacion === 'Excelente' 
                                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                                            : resp.calificacion === 'Buena' 
                                                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                                : 'bg-amber-50 text-amber-700 border-amber-250'
                                                    }`}>
                                                        {resp.calificacion}
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center text-gray-500 text-[10px] font-black gap-1 bg-gray-100 px-3 py-0.5 rounded-full border border-gray-200">
                                                        <Clock className="h-3 w-3" /> Pendiente
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Student answer */}
                                        <div className="bg-zinc-50/50 p-4 rounded-xl border border-zinc-150 mb-3 space-y-1">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tu respuesta:</p>
                                            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                                                {resp?.respuesta_texto || 'No respondida'}
                                            </div>
                                        </div>

                                        {/* Instructor feedback (if exists) */}
                                        {resp?.feedback && (
                                            <div className="bg-blue-50/30 p-4 rounded-xl border border-blue-150/80 mt-3 shadow-sm flex gap-2.5 items-start">
                                                <MessageSquare className="h-4.5 w-4.5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-blue-900 uppercase tracking-wider">Retroalimentación del docente:</p>
                                                    <p className="text-xs sm:text-sm text-blue-950 italic mt-1 leading-relaxed">
                                                        "{resp.feedback}"
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
