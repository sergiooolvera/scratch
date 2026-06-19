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
    FileText,
    FileCode,
    Download
} from 'lucide-react'

export default function AlumnoRevisionTareasPage() {
    const [entregas, setEntregas] = useState<any[]>([])
    const [enrolledCourses, setEnrolledCourses] = useState<any[]>([])
    const [modulos, setModulos] = useState<any[]>([])
    const [selectedCourse, setSelectedCourse] = useState<any>(null)
    const [selectedEntrega, setSelectedEntrega] = useState<any>(null) // selected submission ID
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

                // 3. Fetch student's task submissions from ie_preguntas_respuestas
                const { data: submissionsData, error: subError } = await supabase
                    .from('ie_preguntas_respuestas')
                    .select('*')
                    .eq('user_id', user.id)
                    .like('pregunta', 'TAREA_ENTREGA:%')
                    .order('created_at', { ascending: false })

                if (subError) {
                    console.error("Error fetching submissions:", subError)
                    setLoading(false)
                    return
                }

                // 4. Parse the submissions and modules
                const parsedEntregas: any[] = []
                const moduloIds: string[] = []

                submissionsData?.forEach((e: any) => {
                    const parts = e.pregunta.split('::')
                    const header = parts[0]
                    const modId = header.replace('TAREA_ENTREGA:', '').replace('[', '').replace(']', '')
                    
                    let payload: any = {}
                    try {
                        payload = JSON.parse(parts.slice(1).join('::'))
                    } catch (err) {
                        console.error('Error parsing task payload:', err)
                    }

                    parsedEntregas.push({
                        id: e.id,
                        curso_id: e.curso_id,
                        modulo_id: modId,
                        explicacion: payload.explicacion || '',
                        archivos: payload.archivos || [],
                        calificacion: payload.calificacion,
                        retroalimentacion: payload.retroalimentacion || '',
                        created_at: e.created_at,
                        responded_at: e.responded_at
                    })

                    if (modId) {
                        moduloIds.push(modId)
                    }
                })
                setEntregas(parsedEntregas)

                // 5. Fetch modules info to get titles
                const uniqueModuloIds = Array.from(new Set(moduloIds))
                let modsData: any[] = []
                if (uniqueModuloIds.length > 0) {
                    const { data } = await supabase
                        .from('ie_curso_modulos')
                        .select('id, titulo, curso_id, orden')
                        .in('id', uniqueModuloIds)
                    modsData = data || []
                }
                setModulos(modsData)

                // Fetch extra courses detail for historical results (if not in enrolled)
                const allCursoIdsFromResults = Array.from(new Set(parsedEntregas.map(e => e.curso_id).filter(Boolean)))
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
                console.error("Error in fetchData for tasks:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [supabase])

    // Find and merge all courses (active + historical) that have submissions
    const enrolledIds = enrolledCourses.map(c => c.id)
    const allCourses: any[] = enrolledCourses.map(c => ({
        id: c.id,
        titulo: c.titulo,
        isHistorical: false
    }))

    // Add historical courses if any
    entregas.forEach(e => {
        if (e.curso_id && !enrolledIds.includes(e.curso_id)) {
            const alreadyAdded = allCourses.some(c => c.id === e.curso_id)
            if (!alreadyAdded) {
                allCourses.push({
                    id: e.curso_id,
                    titulo: 'Curso Histórico',
                    isHistorical: true
                })
            }
        }
    })

    // Selected course submissions list
    const courseEntregas = selectedCourse
        ? entregas.filter(e => e.curso_id === selectedCourse.id).map(e => {
            const mod = modulos.find(m => m.id === e.modulo_id)
            return {
                ...e,
                moduloTitulo: mod ? `Módulo ${mod.orden || ''}: ${mod.titulo}`.trim() : 'Módulo Desconocido'
            }
        })
        : []

    // Active modulos for selected course that have task submissions
    const activeCourseModulos = selectedCourse
        ? modulos
            .filter(m => m.curso_id === selectedCourse.id)
            .sort((a, b) => (a.orden || 0) - (b.orden || 0))
        : []

    // Selected submission details
    const selectedSubmissionData = selectedEntrega
        ? entregas.find(e => e.id === selectedEntrega)
        : null

    const selectedSubmissionModulo = selectedSubmissionData
        ? modulos.find(m => m.id === selectedSubmissionData.modulo_id)
        : null

    // Stats for welcome/empty view
    const totalEntregas = entregas.length
    const totalCalificadas = entregas.filter(e => e.calificacion !== undefined && e.calificacion !== null).length
    const promedioTareas = totalCalificadas > 0
        ? Math.round(entregas.reduce((sum, e) => sum + (e.calificacion || 0), 0) / totalCalificadas)
        : 0

    if (loading) return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-zinc-50">
            <div className="text-gray-500 animate-pulse text-lg font-medium">Cargando tareas...</div>
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
                        <FileText className="h-8 w-8 mr-3 text-blue-600" /> Mis Tareas
                    </h1>
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">Revisa tus entregas de proyectos, tareas modulares, calificaciones obtenidas y retroalimentaciones.</p>
                </div>

                {/* Course Selector Dropdown */}
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
                            <GraduationCap className="h-5 w-5" />
                        </div>
                        <div>
                            <label htmlFor="course-select" className="block text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">Selecciona un curso</label>
                            <p className="text-xs text-zinc-500">Elige un curso para ver tus tareas modulares</p>
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
                                    setSelectedEntrega(null)
                                } else {
                                    const found = allCourses.find(c => c.id === val)
                                    setSelectedCourse(found || null)
                                    setSelectedEntrega(null)
                                }
                            }}
                            className="block w-full px-3.5 py-2.5 bg-white border border-zinc-300 rounded-xl text-sm font-bold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer shadow-sm"
                        >
                            <option value="">-- Selecciona un curso --</option>
                            {allCourses.map((c) => {
                                const count = entregas.filter(e => e.curso_id === c.id).length
                                return (
                                    <option key={c.id} value={c.id}>
                                        {c.titulo} ({count} {count === 1 ? 'tarea' : 'tareas'})
                                    </option>
                                )
                            })}
                        </select>
                    </div>
                </div>

                {/* Content Area */}
                {selectedCourse === null ? (
                    /* VIEW 1: WELCOME SCREEN */
                    <div className="bg-white p-8 sm:p-12 rounded-2xl shadow-sm border border-zinc-200/85 text-center animate-in fade-in duration-300">
                        <div className="max-w-2xl mx-auto">
                            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner">
                                <FileText className="h-8 w-8" />
                            </div>
                            
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                Tus Tareas y Entregables
                            </h2>
                            <p className="text-gray-500 mt-3 text-sm sm:text-base leading-relaxed">
                                Selecciona un curso del menú desplegable superior para examinar los archivos que subiste, las calificaciones que te otorgó tu profesor y sus comentarios.
                            </p>

                            {totalEntregas > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-10 text-left max-w-xl mx-auto">
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between">
                                        <p className="text-xs text-gray-405 font-bold uppercase tracking-wider">Cursos Activos</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-gray-900">{enrolledCourses.length}</span>
                                            <span className="text-xs text-gray-405">inscritos</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between font-medium">
                                        <p className="text-xs text-gray-455 font-bold uppercase tracking-wider">Tareas Subidas</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-blue-600">{totalEntregas}</span>
                                            <span className="text-xs text-gray-405">entregas</span>
                                        </div>
                                    </div>
                                    <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-150 shadow-sm flex flex-col justify-between font-medium">
                                        <p className="text-xs text-gray-455 font-bold uppercase tracking-wider">Promedio de Tareas</p>
                                        <div className="flex items-baseline gap-1 mt-2">
                                            <span className="text-2xl font-black text-green-600">{promedioTareas}/100</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mt-8 p-6 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                    <p className="text-sm text-gray-550 font-medium">Aún no has subido ninguna tarea modular. Tus entregas se mostrarán aquí una vez completadas.</p>
                                </div>
                            )}

                            <div className="mt-10 pt-8 border-t border-zinc-100 flex items-center justify-center gap-2 text-xs text-zinc-400 font-semibold">
                                <Sparkles className="h-4 w-4 text-blue-500 animate-pulse" />
                                <span>Selecciona un curso en el menú superior para empezar</span>
                            </div>
                        </div>
                    </div>
                ) : selectedEntrega === null ? (
                    /* VIEW 2: COURSE MODULES GRID */
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 animate-in fade-in duration-300">
                        {/* Course Header */}
                        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-4">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-extrabold text-gray-955 uppercase tracking-wide flex items-center gap-2">
                                    <BookOpen className="h-6 w-6 text-blue-600" />
                                    {selectedCourse.titulo}
                                </h2>
                                <p className="text-xs text-gray-550 mt-1.5 font-medium">Selecciona un módulo para ver el detalle de tu tarea entregada:</p>
                            </div>
                            <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto">
                                {activeCourseModulos.length} {activeCourseModulos.length === 1 ? 'Tarea entregada' : 'Tareas entregadas'}
                            </span>
                        </div>

                        {/* Grid of modules */}
                        {activeCourseModulos.length === 0 ? (
                            <div className="text-center py-16 bg-zinc-50 border border-dashed border-zinc-200 rounded-2xl">
                                <FileQuestion className="h-14 w-14 text-zinc-300 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-zinc-800">Sin entregables registrados</h3>
                                <p className="text-xs text-zinc-455 mt-1.5 max-w-sm mx-auto leading-relaxed">
                                    Aún no has enviado ninguna tarea modular para este curso. Sube tus proyectos en la sección de clases y módulos.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeCourseModulos.map((m: any) => {
                                    const e = entregas.find(ent => ent.modulo_id === m.id && ent.curso_id === selectedCourse.id)
                                    if (!e) return null
                                    const calificada = e.calificacion !== undefined && e.calificacion !== null

                                    return (
                                        <div
                                            key={m.id}
                                            onClick={() => setSelectedEntrega(e.id)}
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
                                                    Entregado el: {new Date(e.created_at).toLocaleDateString()}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                {calificada ? (
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap inline-block ${
                                                        e.calificacion >= 70 
                                                            ? 'bg-green-50 text-green-700 border-green-200' 
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                        {e.calificacion}/100
                                                    </span>
                                                ) : (
                                                    <span className="text-[9px] font-black px-2 py-0.5 rounded-full border whitespace-nowrap inline-block bg-amber-50 text-amber-700 border-amber-200">
                                                        Pendiente
                                                    </span>
                                                )}
                                                <ChevronRight className="h-4.5 w-4.5 text-gray-300 group-hover:text-blue-500 transition group-hover:translate-x-0.5" />
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    /* VIEW 3: DETAILED SUBMISSION DETAILS AND GRADE */
                    <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-150 animate-in fade-in duration-300">
                        {/* Navigation back button */}
                        <button 
                            onClick={() => setSelectedEntrega(null)}
                            className="text-xs font-bold text-gray-555 hover:text-gray-900 flex items-center gap-1 transition cursor-pointer mb-5"
                        >
                            <ArrowLeft className="h-3.5 w-3.5" /> Volver a las tareas de {selectedCourse.titulo}
                        </button>

                        {/* Title and stats bar */}
                        {(() => {
                            const calificada = selectedSubmissionData.calificacion !== undefined && selectedSubmissionData.calificacion !== null
                            const modulo = modulos.find(m => m.id === selectedSubmissionData.modulo_id)
                            const modTitulo = modulo ? `Módulo ${modulo.orden || ''}: ${modulo.titulo}`.trim() : 'Módulo'

                            return (
                                <>
                                    <div className="border-b pb-5 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-[10px] font-black bg-blue-50 text-blue-700 mb-2 uppercase tracking-widest border border-blue-100">
                                                Tarea Modular
                                            </span>
                                            <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 leading-tight">
                                                {modTitulo}
                                            </h2>
                                            <p className="text-sm font-semibold text-zinc-550 mt-1">
                                                {selectedCourse.titulo}
                                            </p>
                                            <p className="text-xs text-gray-455 mt-2 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                Entregado: {new Date(selectedSubmissionData.created_at).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0 w-full sm:w-auto">
                                            {calificada ? (
                                                <div className={`text-center px-6 py-3 rounded-2xl border ${
                                                    selectedSubmissionData.calificacion >= 70 
                                                        ? 'bg-green-50 text-green-700 border-green-200' 
                                                        : 'bg-red-50 text-red-700 border-red-200'
                                                }`}>
                                                    <p className="text-4xl font-black tracking-tight">{selectedSubmissionData.calificacion}/100</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest mt-1">
                                                        {selectedSubmissionData.calificacion >= 70 ? 'Aprobada' : 'Reprobada'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="text-center px-6 py-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-250 font-bold text-sm">
                                                    Pendiente Calificar
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Student description / explanation */}
                                    <div className="mb-6 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl">
                                        <p className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-2">Descripción de tu entrega:</p>
                                        <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap font-medium">
                                            {selectedSubmissionData.explicacion || 'No proporcionaste descripción.'}
                                        </p>
                                    </div>

                                    {/* Submitted Files */}
                                    {selectedSubmissionData.archivos && selectedSubmissionData.archivos.length > 0 && (
                                        <div className="mb-6 p-5 bg-white border border-zinc-200 rounded-2xl">
                                            <p className="font-bold text-xs uppercase tracking-wider text-zinc-400 mb-3">Archivos adjuntos:</p>
                                            <div className="space-y-2">
                                                {selectedSubmissionData.archivos.map((archivo: any, idx: number) => {
                                                    const url = archivo.url || archivo;
                                                    const name = archivo.name || (typeof archivo === 'string' ? archivo.split('/').pop() : `Archivo_${idx + 1}`);

                                                    return (
                                                        <a 
                                                            key={idx}
                                                            href={url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer" 
                                                            className="flex items-center gap-3 p-3 bg-zinc-50 hover:bg-blue-50/50 rounded-xl border border-zinc-150 transition group cursor-pointer"
                                                        >
                                                            <div className="bg-white border border-zinc-200 p-2 rounded-lg text-zinc-500 group-hover:text-blue-600 transition shadow-inner">
                                                                <FileCode className="h-4.5 w-4.5" />
                                                            </div>
                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-xs sm:text-sm font-bold text-gray-800 truncate group-hover:text-blue-600 transition">{name}</p>
                                                                <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">Ver Archivo en nueva pestaña</p>
                                                            </div>
                                                            <ChevronRight className="h-4.5 w-4.5 text-gray-300 group-hover:text-blue-500 transition group-hover:translate-x-0.5" />
                                                        </a>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Instructor Feedback */}
                                    {selectedSubmissionData.retroalimentacion && (
                                        <div className="p-5 bg-gradient-to-r from-blue-50/60 to-blue-50/15 border border-blue-200/80 rounded-2xl flex items-start gap-3.5 shadow-sm">
                                            <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-sm text-blue-955 border-b border-blue-100 pb-1 mb-2">Comentarios de tu profesor:</p>
                                                <p className="text-sm text-blue-900 italic whitespace-pre-wrap leading-relaxed">
                                                    "{selectedSubmissionData.retroalimentacion}"
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )
                        })()}
                    </div>
                )}
            </div>
        </div>
    )
}
