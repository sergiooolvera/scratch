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
    ChevronRight
} from 'lucide-react'

// Helper function to match student's answer in respuestas_detalle even if the question ID has changed
function obtenerDetalleRespuesta(p: any, index: number, respuestasDetalle: any, todasPreguntas: any[]) {
    if (!respuestasDetalle) return undefined;

    // 1. Exact ID match (standard case)
    if (respuestasDetalle[p.id]) {
        return respuestasDetalle[p.id];
    }

    // Fallback cases if question IDs changed
    const keys = Object.keys(respuestasDetalle);

    // 2. If the total number of questions is equal, we can assume exact alignment by index/order
    if (keys.length === todasPreguntas.length) {
        const fallbackKey = keys[index];
        if (fallbackKey && respuestasDetalle[fallbackKey]) {
            return respuestasDetalle[fallbackKey];
        }
    }

    // 3. Heuristic option-text matching for multiple choice questions
    if (p.tipo_pregunta !== 'respuesta_libre') {
        const normalize = (s: string) => s?.trim().toLowerCase() ?? '';
        const opcionesPregunta = [
            normalize(p.opcion_a),
            normalize(p.opcion_b),
            normalize(p.opcion_c),
            normalize(p.opcion_d)
        ].filter(Boolean);

        for (const key of keys) {
            const det = respuestasDetalle[key];
            if (det && det.respuesta_texto) {
                const ansTextNorm = normalize(det.respuesta_texto);
                if (opcionesPregunta.includes(ansTextNorm)) {
                    return det;
                }
            }
        }
    }

    // 4. General fallback by index if nothing else succeeded
    const fallbackKeyGeneral = keys[index];
    if (fallbackKeyGeneral && respuestasDetalle[fallbackKeyGeneral]) {
        return respuestasDetalle[fallbackKeyGeneral];
    }

    return undefined;
}

export default function AlumnoRevisionExamenesPage() {
    const [resultados, setResultados] = useState<any[]>([])
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [selectedModulo, setSelectedModulo] = useState<any>(null) // selected module ID or 'final'
    const [selectedResultado, setSelectedResultado] = useState<any>(null)
    const [preguntas, setPreguntas] = useState<any[]>([])
    const [modulos, setModulos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState<'all' | 'correct' | 'incorrect'>('all')
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    setLoading(false)
                    return
                }

                // 1. Fetch student's purchases (enrolled courses)
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
                    const { data: cData, error: cError } = await supabase
                        .from('ie_cursos')
                        .select('id, titulo, mostrar_revision_examen')
                        .in('id', enrolledCursoIds)
                    if (cError) console.error("Error fetching courses:", cError)
                    enrolledCoursesData = cData || []
                }
                setEnrolledCourses(enrolledCoursesData)

                // 3. Fetch student's exam results
                const { data: resData, error: resError } = await supabase
                    .from('ie_resultados_examenes')
                    .select('*, ie_examenes(id, curso_id, modulo_id)')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })

                if (resError) {
                    console.error("Error fetching exam results:", resError)
                    setLoading(false)
                    return
                }

                if (!resData || resData.length === 0) {
                    setResultados([])
                    setLoading(false)
                    return
                }

                // Fetch extra courses detail for historical results (if not in enrolled)
                const allCursoIdsFromResults = Array.from(new Set(resData.map(r => r.ie_examenes?.curso_id).filter(Boolean)))
                const missingCursoIds = allCursoIdsFromResults.filter(id => !enrolledCursoIds.includes(id))

                let allCursosData = [...enrolledCoursesData]
                if (missingCursoIds.length > 0) {
                    const { data: extraCursos } = await supabase
                        .from('ie_cursos')
                        .select('id, titulo, mostrar_revision_examen')
                        .in('id', missingCursoIds)
                    if (extraCursos) {
                        allCursosData = [...allCursosData, ...extraCursos]
                    }
                }

                // 4. Fetch modular titles if any
                const moduloIds = Array.from(new Set(resData.map(r => r.ie_examenes?.modulo_id).filter(Boolean)))
                const { data: modulosData } = moduloIds.length > 0
                    ? await supabase
                        .from('ie_curso_modulos')
                        .select('id, titulo, curso_id, orden')
                        .in('id', moduloIds)
                    : { data: [] }
                setModulos(modulosData || [])

                // 5. Format results
                const resultadosFormateados = resData.map(r => {
                    const curso = allCursosData?.find(c => c.id === r.ie_examenes?.curso_id)
                    const modulo = modulosData?.find(m => m.id === r.ie_examenes?.modulo_id)
                    return {
                        ...r,
                        curso: curso || { titulo: 'Curso Desconocido', mostrar_revision_examen: false },
                        examenTitulo: modulo ? `Módulo ${modulo.orden || ''}: ${modulo.titulo}`.trim() : 'Examen final',
                        tipoExamen: modulo ? 'modular' : 'final'
                    }
                })

                setResultados(resultadosFormateados)

                // 6. Fetch all questions for presented exams
                const examenIds = Array.from(new Set(resData.map(r => r.examen_id).filter(Boolean)))
                if (examenIds.length > 0) {
                    const { data: pregs } = await supabase
                        .from('ie_preguntas')
                        .select('*')
                        .in('examen_id', examenIds)
                        .order('orden', { ascending: true })

                    setPreguntas(pregs || [])
                }
            } catch (err) {
                console.error("General error in fetchData:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [supabase])

    // Find and merge all courses (active + historical)
    const enrolledIds = enrolledCourses.map(c => c.id)
    const allCourses: any[] = enrolledCourses.map(c => ({
        id: c.id,
        titulo: c.titulo,
        isHistorical: false
    }))
    resultados.forEach(r => {
        const cId = r.ie_examenes?.curso_id
        if (cId && !enrolledIds.includes(cId)) {
            const alreadyAdded = allCourses.some(c => c.id === cId)
            if (!alreadyAdded) {
                allCourses.push({
                    id: cId,
                    titulo: r.curso?.titulo || 'Curso Histórico',
                    isHistorical: true
                })
            }
        }
    })

    // Selected course attempts
    const courseAttempts = selectedCourse
        ? resultados.filter(r => r.ie_examenes?.curso_id === selectedCourse.id)
        : []

    // Active modulos for selected course that have exam attempts
    const courseModuloIdsWithAttempts = Array.from(new Set(
        courseAttempts.map(r => r.ie_examenes?.modulo_id).filter(Boolean)
    ))
    
    const activeCourseModulos = modulos
        .filter(m => m.curso_id === selectedCourse?.id && courseModuloIdsWithAttempts.includes(m.id))
        .sort((a, b) => (a.orden || 0) - (b.orden || 0))

    const hasFinalAttempts = courseAttempts.some(r => !r.ie_examenes?.modulo_id)
    const finalAttemptsCount = courseAttempts.filter(r => !r.ie_examenes?.modulo_id).length

    // Attempts for selected course and module
    const moduleAttempts = selectedCourse && selectedModulo
        ? courseAttempts.filter(r => (r.ie_examenes?.modulo_id || 'final') === selectedModulo)
        : []

    // Get selected module title
    const selectedModuloTitle = selectedModulo === 'final'
        ? 'Examen final'
        : modulos.find(m => m.id === selectedModulo)?.titulo 
            ? `Módulo ${modulos.find(m => m.id === selectedModulo)?.orden || ''}: ${modulos.find(m => m.id === selectedModulo)?.titulo}`.trim()
            : 'Módulo'

    // Questions of the selected attempt
    const preguntasResultadoSeleccionado = selectedResultado
        ? preguntas.filter(p => p.examen_id === selectedResultado.examen_id)
        : []

    // Calculate count stats for tabs
    const statsSelectedAttempt = selectedResultado ? preguntasResultadoSeleccionado.reduce((acc, p, idx) => {
        const det = obtenerDetalleRespuesta(p, idx, selectedResultado.respuestas_detalle, preguntasResultadoSeleccionado);
        if (det) {
            if (det.correcta) acc.correct++;
            else acc.incorrect++;
        } else {
            acc.incorrect++; // Unanswered counts as incorrect
        }
        acc.total++;
        return acc;
    }, { total: 0, correct: 0, incorrect: 0 }) : { total: 0, correct: 0, incorrect: 0 }

    // Filter questions based on selected tab
    const filteredPreguntas = preguntasResultadoSeleccionado.filter((p, index) => {
        const detalle = obtenerDetalleRespuesta(p, index, selectedResultado.respuestas_detalle, preguntasResultadoSeleccionado);
        const isCorrect = detalle?.correcta === true;
        if (activeFilter === 'correct') return isCorrect;
        if (activeFilter === 'incorrect') return !isCorrect;
        return true;
    });

    // General stats for welcome dashboard
    const promedioGeneral = resultados.length > 0 
        ? Math.round(resultados.reduce((sum, r) => sum + (r.calificacion || 0), 0) / resultados.length) 
        : 0

    // Tab styling helper
    const tabClass = (tab: 'all' | 'correct' | 'incorrect') => {
        const base = "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all duration-200 shadow-sm cursor-pointer border"
        if (activeFilter === tab) {
            if (tab === 'all') return `${base} bg-blue-600 border-blue-600 text-white`
            if (tab === 'correct') return `${base} bg-emerald-600 border-emerald-600 text-white`
            if (tab === 'incorrect') return `${base} bg-rose-600 border-rose-600 text-white`
        }
        if (tab === 'all') return `${base} bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50`
        if (tab === 'correct') return `${base} bg-white border-zinc-200 text-emerald-700 hover:bg-emerald-50/50 hover:border-emerald-250`
        if (tab === 'incorrect') return `${base} bg-white border-zinc-200 text-rose-700 hover:bg-rose-50/50 hover:border-rose-250`
    }

    if (loading) return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-zinc-50">
            <div className="text-gray-500 animate-pulse text-lg font-medium">Cargando evaluaciones...</div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans p-6 sm:p-10">
            <div className="max-w-5xl mx-auto">
                
                {/* Header Section */}
                <div className="mb-8">
                    <Link
                        href="/mis-cursos"
                        className="inline-flex items-center text-sm font-semibold text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a mis cursos
                    </Link>
                    <h1 className="text-3xl font-extrabold text-gray-900 flex items-center tracking-tight">
                        <Award className="h-8 w-8 mr-3 text-blue-600" /> Historial de Evaluaciones
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">Consulta tus resultados, repasa tus respuestas y analiza tus áreas de oportunidad.</p>
                </div>

                {/* Course Combobox Card */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <label htmlFor="course-select" className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Selecciona un curso</label>
                            <p className="text-xs text-zinc-500">Elige un curso para ver sus evaluaciones</p>
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
                                    setSelectedResultado(null)
                                } else {
                                    const found = allCourses.find(c => c.id === val)
                                    setSelectedCourse(found || null)
                                    setSelectedModulo(null)
                                    setSelectedResultado(null)
                                }
                                setActiveFilter('all')
                            }}
                            className="block w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer shadow-sm"
                        >
                            <option value="">-- Selecciona un curso --</option>
                            {allCourses.map((c) => {
                                const count = resultados.filter(r => r.ie_examenes?.curso_id === c.id).length
                                return (
                                    <option key={c.id} value={c.id}>
                                        {c.titulo} ({count} {count === 1 ? 'intento' : 'intentos'})
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                {/* Content Section */}
                {selectedCourse === null ? (
                    /* VIEW 1: WELCOME DASHBOARD STATS */
                    <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-zinc-200/85 text-center animate-in fade-in duration-300">
                        <div className="max-w-2xl mx-auto">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <GraduationCap className="h-8 w-8" />
                            </div>
                            
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                Historial de Evaluaciones y Exámenes
                            </h2>
                            <p className="text-gray-500 mt-3 text-sm sm:text-base leading-relaxed">
                                Aquí puedes ver un desglose completo de tus cursos y las evaluaciones que has realizado. Selecciona un curso en el menú superior para comenzar.
                            </p>

                            {resultados.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-10 text-left">
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between">
                                        <p className="text-xs text-gray-405 font-bold uppercase tracking-wider">Cursos Activos</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-gray-900">{enrolledCourses.length}</span>
                                            <span className="text-xs text-gray-405">inscritos</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between">
                                        <p className="text-xs text-gray-455 font-bold uppercase tracking-wider">Exámenes Realizados</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-gray-900">{resultados.length}</span>
                                            <span className="text-xs text-gray-455">intentos</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between">
                                        <p className="text-xs text-gray-455 font-bold uppercase tracking-wider">Promedio General</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-blue-600">{promedioGeneral}%</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between">
                                        <p className="text-xs text-gray-455 font-bold uppercase tracking-wider">Aprobados</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-green-600">
                                                {resultados.filter(r => r.aprobado).length}
                                            </span>
                                            <span className="text-xs text-gray-405">/ {resultados.length}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-8 p-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                    <p className="text-sm text-gray-550 font-medium">Aún no has realizado ninguna evaluación. Cuando presentes exámenes en tus cursos, tus calificaciones e intentos aparecerán organizados aquí.</p>
                                </div>
                            )}

                            <div className="mt-10 pt-8 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-400 font-semibold">
                                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                                <span>Por favor, selecciona un curso del menú de arriba para empezar</span>
                            </div>
                        </div>
                    </div>
                ) : selectedModulo === null ? (
                    /* VIEW 2: COURSE MODULES GRID */
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 animate-in fade-in duration-300">
                        {/* Course header */}
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-955 uppercase tracking-wide flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                    {selectedCourse.titulo}
                                </h2>
                                <p className="text-xs text-gray-550 mt-1.5 font-medium">Selecciona un módulo para ver los intentos de examen:</p>
                            </div>
                        </div>

                        {activeCourseModulos.length === 0 && !hasFinalAttempts ? (
                            <div className="text-center py-16 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                                <FileQuestion className="h-14 w-14 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-zinc-800">Sin exámenes contestados</h3>
                                <p className="text-xs text-zinc-455 mt-1.5 max-w-sm mx-auto leading-relaxed">
                                    Aún no has presentado ninguna evaluación modular o final para este curso. Cuando completes un examen, podrás repasar tus respuestas y retroalimentaciones aquí.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeCourseModulos.map((m: any) => {
                                    const count = courseAttempts.filter(r => r.ie_examenes?.modulo_id === m.id).length
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
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                    {count} {count === 1 ? 'intento' : 'intentos'}
                                                </span>
                                                <ChevronRight className="h-4.5 w-4.5 text-gray-300 group-hover:text-blue-500 transition group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    )
                                })}

                                {hasFinalAttempts && (
                                    <div
                                        onClick={() => setSelectedModulo('final')}
                                        className="p-4 rounded-xl border border-zinc-150 hover:border-blue-300 hover:bg-blue-50/20 bg-white transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4 group"
                                    >
                                        <div className="min-w-0">
                                            <span className="inline-block text-[9px] font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded uppercase tracking-wider mb-1 border border-blue-100">
                                                Examen Final
                                            </span>
                                            <h3 className="font-extrabold text-gray-900 text-sm group-hover:text-blue-700 transition">
                                                Examen de conocimiento general
                                            </h3>
                                        </div>
                                        <div className="flex items-center gap-2 flex-shrink-0">
                                            <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                                                {finalAttemptsCount} {finalAttemptsCount === 1 ? 'intento' : 'intentos'}
                                            </span>
                                            <ChevronRight className="h-4.5 w-4.5 text-gray-300 group-hover:text-blue-500 transition group-hover:translate-x-0.5" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : selectedResultado === null ? (
                    /* VIEW 3: MODULE ATTEMPTS LIST */
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 animate-in fade-in duration-300">
                        {/* Header and Back button */}
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-4">
                            <div>
                                <button 
                                    onClick={() => setSelectedModulo(null)} 
                                    className="text-xs font-bold text-gray-500 hover:text-gray-900 flex items-center gap-1 transition cursor-pointer mb-2"
                                >
                                    <ArrowLeft className="h-3.5 w-3.5" /> Volver a los módulos del curso
                                </button>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-950 uppercase tracking-wide flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                    {selectedModuloTitle}
                                </h2>
                                <p className="text-xs text-gray-550 mt-1.5 font-medium">Intentos de examen registrados para esta evaluación</p>
                            </div>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
                                {moduleAttempts.length} {moduleAttempts.length === 1 ? 'Intento' : 'Intentos'}
                            </span>
                        </div>

                        {/* List of attempts for this module */}
                        <div className="space-y-3">
                            {moduleAttempts.map((r: any, idx: number) => {
                                return (
                                    <div
                                        key={r.id}
                                        onClick={() => {
                                            setSelectedResultado(r)
                                            setActiveFilter('all')
                                        }}
                                        className="p-4 rounded-xl border border-zinc-150 hover:border-blue-300 hover:bg-blue-50/20 bg-white transition-all cursor-pointer shadow-sm flex items-center justify-between gap-4 group"
                                    >
                                        <div className="min-w-0">
                                            <span className="inline-block text-[9px] font-black bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded uppercase tracking-wider mb-1 border border-blue-100">
                                                Intento #{moduleAttempts.length - idx}
                                            </span>
                                            <h3 className="font-extrabold text-gray-900 text-sm sm:text-base group-hover:text-blue-700 transition">
                                                {r.examenTitulo}
                                            </h3>
                                            <p className="text-xs text-gray-450 mt-1 flex items-center gap-1 font-medium">
                                                <Clock className="h-3 w-3" />
                                                Presentado el: {new Date(r.created_at).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <span className={`text-sm sm:text-base font-black px-3 py-1 rounded-xl whitespace-nowrap inline-block ${
                                                    r.aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {r.calificacion}%
                                                </span>
                                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                                    {r.aprobado ? 'Aprobado' : 'Reprobado'}
                                                </p>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 transition group-hover:translate-x-1" />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    /* VIEW 4: DETAILED ATTEMPT REPORT */
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 animate-in fade-in duration-300">
                        
                        {/* Navigation back button */}
                        <button 
                            onClick={() => {
                                setSelectedResultado(null);
                                setActiveFilter('all');
                            }}
                            className="text-xs font-bold text-gray-555 hover:text-gray-900 flex items-center gap-1 transition cursor-pointer mb-5"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Volver a los intentos de {selectedModuloTitle}
                        </button>

                        {/* Exam header and score badge */}
                        <div className="border-b pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 mb-2 uppercase tracking-widest border border-blue-100">
                                    {selectedResultado.tipoExamen === 'final' ? 'Examen Final' : 'Examen Modular'}
                                </span>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                                    {selectedResultado.curso?.titulo}
                                </h2>
                                <p className="text-sm font-semibold text-zinc-550 mt-1">
                                    {selectedResultado.examenTitulo}
                                </p>
                                <p className="text-xs text-gray-455 mt-2 flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Presentado: {new Date(selectedResultado.created_at).toLocaleString()}
                                </p>
                            </div>
                            <div className={`text-center px-6 py-3 rounded-2xl flex-shrink-0 w-full sm:w-auto border ${
                                selectedResultado.aprobado 
                                    ? 'bg-green-50 text-green-700 border-green-200' 
                                    : 'bg-red-50 text-red-700 border-red-200'
                            }`}>
                                <p className="text-4xl font-black tracking-tight">{selectedResultado.calificacion}%</p>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1">{selectedResultado.aprobado ? 'Aprobado' : 'Reprobado'}</p>
                            </div>
                        </div>

                        {/* General Instructor Feedback */}
                        {selectedResultado.respuestas_detalle?.retroalimentacion_profesor && (
                            <div className="mb-6 p-5 bg-gradient-to-r from-blue-50/60 to-blue-50/15 border border-blue-200/80 rounded-2xl flex items-start gap-3.5 shadow-sm">
                                <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm text-blue-955 border-b border-blue-100 pb-1 mb-2">Nota de retroalimentación de tu instructor:</p>
                                    <p className="text-sm text-blue-900 italic whitespace-pre-wrap leading-relaxed">
                                        "{selectedResultado.respuestas_detalle.retroalimentacion_profesor}"
                                    </p>
                                </div>
                            </div>
                        )}

                        {(!selectedResultado.respuestas_detalle || Object.keys(selectedResultado.respuestas_detalle).length === 0) && (
                            <div className="mb-6 p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-3">
                                <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-bold text-sm text-amber-900">Desglose Histórico No Disponible</p>
                                    <p className="text-xs text-amber-805 mt-1 leading-relaxed">
                                        Este examen se presentó antes de las últimas actualizaciones del sistema. La calificación oficial de <strong>{selectedResultado.calificacion}%</strong> está registrada en tu expediente, pero el desglose pregunta por pregunta no está disponible en la base de datos histórica.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Filters tab bar */}
                        {preguntasResultadoSeleccionado.length > 0 && (
                            <div className="flex flex-wrap items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
                                <button 
                                    onClick={() => setActiveFilter('all')}
                                    className={tabClass('all')}
                                >
                                    <FileQuestion className="h-4 w-4" />
                                    Todas ({statsSelectedAttempt.total})
                                </button>
                                <button 
                                    onClick={() => setActiveFilter('correct')}
                                    className={tabClass('correct')}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Aprobadas ({statsSelectedAttempt.correct})
                                </button>
                                <button 
                                    onClick={() => setActiveFilter('incorrect')}
                                    className={tabClass('incorrect')}
                                >
                                    <XCircle className="h-4 w-4" />
                                    Reprobadas ({statsSelectedAttempt.incorrect})
                                </button>
                            </div>
                        )}

                        {/* Detailed Questions breakdown */}
                        <div className="space-y-6">
                            {filteredPreguntas.length === 0 ? (
                                <div className="text-center py-10 bg-zinc-50 border border-dashed border-zinc-200 rounded-xl">
                                    <AlertTriangle className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-gray-500">No hay preguntas registradas en esta categoría.</p>
                                </div>
                            ) : (
                                filteredPreguntas.map((p) => {
                                    const originalIndex = preguntasResultadoSeleccionado.findIndex(originalP => originalP.id === p.id)
                                    const detalle = obtenerDetalleRespuesta(p, originalIndex, selectedResultado.respuestas_detalle, preguntasResultadoSeleccionado);
                                    const isCorrect = detalle?.correcta === true;

                                    let cardBorderClass = "border-zinc-200 bg-white"
                                    let badgeElement = null

                                    if (detalle) {
                                        if (isCorrect) {
                                            cardBorderClass = "border-emerald-200 bg-emerald-50/10 hover:bg-emerald-50/20"
                                            badgeElement = (
                                                <span className="flex items-center text-emerald-700 text-[10px] font-black gap-1 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
                                                    <CheckCircle className="h-3.5 w-3.5" /> Aprobada
                                                </span>
                                            )
                                        } else {
                                            cardBorderClass = "border-rose-200 bg-rose-50/10 hover:bg-rose-50/20"
                                            badgeElement = (
                                                <span className="flex items-center text-rose-700 text-[10px] font-black gap-1 bg-rose-100 px-3 py-1 rounded-full border border-rose-200 shadow-sm">
                                                    <XCircle className="h-3.5 w-3.5" /> Reprobada
                                                </span>
                                            )
                                        }
                                    } else {
                                        cardBorderClass = "border-zinc-200 bg-zinc-50/30"
                                        badgeElement = (
                                            <span className="flex items-center text-gray-500 text-[10px] font-black gap-1 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                                <AlertTriangle className="h-3.5 w-3.5" /> Sin Respuesta
                                            </span>
                                        )
                                    }

                                    return (
                                        <div key={p.id} className={`border rounded-xl p-5 shadow-sm transition-all duration-200 relative ${cardBorderClass}`}>
                                            <div className="flex justify-between items-start gap-4 mb-4">
                                                <h3 className="font-extrabold text-gray-900 text-sm sm:text-base pr-24 leading-snug">
                                                    <span className="text-blue-600 mr-1">{originalIndex + 1}.</span> {p.pregunta}
                                                </h3>
                                                <div className="absolute top-5 right-5">
                                                    {badgeElement}
                                                </div>
                                            </div>

                                            {p.tipo_pregunta !== 'respuesta_libre' ? (
                                                <div className="text-sm space-y-2 mb-3 mt-4">
                                                    {['A', 'B', 'C', 'D'].map(opc => {
                                                        const opcKey = `opcion_${opc.toLowerCase()}` as 'opcion_a' | 'opcion_b' | 'opcion_c' | 'opcion_d';
                                                        const opcTexto = p[opcKey];
                                                        if (!opcTexto) return null;

                                                        const isSelected = detalle?.respuesta === opc;
                                                        const isCorrectOption = p.respuesta_correcta?.trim().toUpperCase() === opc;

                                                        let bgClass = 'bg-white border border-gray-200 text-gray-700'
                                                        let badge = null
                                                        let viñeta = <span className="font-bold text-gray-400">{opc}:</span>

                                                        if (isSelected && isCorrectOption) {
                                                            bgClass = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-955 font-medium shadow-sm'
                                                            viñeta = <span className="font-extrabold text-emerald-600 flex items-center gap-1">✓ {opc}:</span>
                                                            badge = (
                                                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-250">
                                                                    Tu respuesta (Correcta)
                                                                </span>
                                                            )
                                                        } else if (isSelected && !isCorrectOption) {
                                                            bgClass = 'bg-rose-50 border-2 border-rose-400 text-rose-955 shadow-sm'
                                                            viñeta = <span className="font-extrabold text-rose-600 flex items-center gap-1">✗ {opc}:</span>
                                                            badge = (
                                                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-250">
                                                                    Tu respuesta (Incorrecta)
                                                                </span>
                                                            )
                                                        } else if (!isSelected && isCorrectOption) {
                                                            bgClass = 'bg-emerald-50/60 border border-emerald-300 text-emerald-900 font-medium'
                                                            viñeta = <span className="font-extrabold text-emerald-600 flex items-center gap-1">✓ {opc}:</span>
                                                            badge = (
                                                                <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150">
                                                                    Respuesta Correcta
                                                                </span>
                                                            )
                                                        }

                                                        return (
                                                            <div key={opc} className={`p-3 rounded-xl flex items-center justify-between transition-all ${bgClass}`}>
                                                                <div className="flex items-center gap-2">
                                                                    {viñeta}
                                                                    <span className="font-medium">{opcTexto}</span>
                                                                </div>
                                                                <div>{badge}</div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            ) : (
                                                <div className="bg-white p-4 rounded-xl border border-gray-200 mb-3 mt-4 space-y-2">
                                                    <p className="text-xs font-bold text-gray-555 uppercase tracking-wider">Tu respuesta escrita:</p>
                                                    <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                                                        {detalle?.respuesta_texto || 'No respondida'}
                                                    </div>

                                                    {detalle?.calificacion_abierta && (
                                                        <div className="mt-3 flex items-center gap-2 pt-2 border-t border-dashed border-gray-100">
                                                            <span className="text-xs font-bold text-gray-550">Evaluación de respuesta abierta:</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                                detalle.calificacion_abierta === 'Excelente' 
                                                                    ? 'bg-green-100 text-green-700 border-green-200' 
                                                                    : detalle.calificacion_abierta === 'Buena' 
                                                                        ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                                                        : 'bg-amber-100 text-amber-700 border-amber-200'
                                                            }`}>
                                                                {detalle.calificacion_abierta}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="bg-white p-4 rounded-xl border border-zinc-150 mt-4 shadow-sm">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Tu justificación técnica:</p>
                                                <p className="text-xs sm:text-sm text-gray-800 italic leading-relaxed">
                                                    {detalle?.explicacion || 'No proporcionaste explicación.'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
