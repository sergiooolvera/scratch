'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
    FileText, 
    CheckCircle, 
    Award, 
    Clock, 
    ArrowRight, 
    BookOpen, 
    User, 
    Filter, 
    Edit, 
    AlertCircle, 
    HelpCircle, 
    Users, 
    ExternalLink, 
    Eye 
} from 'lucide-react'
import { calificarCuestionario } from './actions'
import type { CuestionariosCursoInfo, ModuloCuestionarioInfo } from './page'

type Evaluacion = {
    etiqueta: string;
    retroalimentacion: string;
};

type Entrega = {
    id: string;
    curso_id: string;
    curso_titulo: string;
    modulo_id: string;
    modulo_titulo: string;
    alumno_nombre: string;
    alumno_verificado?: boolean;
    preguntas: any[];
    respuestas: Record<string, string>;
    evaluaciones: Record<string, Evaluacion>;
    estado: string;
    created_at: string;
    evaluado_at?: string;
}

const ETIQUETAS = [
    { id: 'Excelente', label: 'Excelente', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'Buena', label: 'Buena', color: 'bg-green-100 text-green-700 border-green-200' },
    { id: 'Regular', label: 'Regular', color: 'bg-amber-100 text-amber-700 border-amber-200' },
    { id: 'Area de Oportunidad', label: 'Área de Oportunidad', color: 'bg-red-100 text-red-700 border-red-200' }
]

export default function RevisionCuestionariosClient({ 
    entregas: initialEntregas, 
    cursos = [],
    cuestionariosInfo = {}
}: { 
    entregas: Entrega[], 
    cursos?: any[],
    cuestionariosInfo?: Record<string, CuestionariosCursoInfo>
}) {
    const [entregas, setEntregas] = useState<Entrega[]>(initialEntregas)
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null)
    const [selectedCurso, setSelectedCurso] = useState<string>('')
    const [filtroEstado, setFiltroEstado] = useState<'pendientes' | 'evaluados' | 'todos'>('pendientes')
    const [moduloVisualizandoPreguntas, setModuloVisualizandoPreguntas] = useState<ModuloCuestionarioInfo | null>(null)

    // Form states
    const [evaluacionesLocales, setEvaluacionesLocales] = useState<Record<string, Evaluacion>>({})
    const [submitting, setSubmitting] = useState(false)
    const [mensaje, setMensaje] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    // Cursos disponibles
    const cursosDisponibles = cursos.length > 0 
        ? cursos 
        : Array.from(
            new Set(entregas.map(e => JSON.stringify({ id: e.curso_id, titulo: e.curso_titulo })))
        ).map(str => JSON.parse(str))

    const infoCursoActual = selectedCurso ? cuestionariosInfo[selectedCurso] : null

    const handleSelectCurso = (cursoId: string) => {
        setSelectedCurso(cursoId)
        setSelectedEntrega(null)
        setMensaje(null)

        const info = cuestionariosInfo[cursoId]
        if (info && info.modulosConCuestionario.length > 0) {
            setModuloVisualizandoPreguntas(info.modulosConCuestionario[0])
        } else {
            setModuloVisualizandoPreguntas(null)
        }
    }

    const handleSelectEntrega = (ent: Entrega) => {
        setSelectedEntrega(ent)
        setModuloVisualizandoPreguntas(null)
        setEvaluacionesLocales(ent.evaluaciones || {})
        setMensaje(null)
    }

    const handleVerPreguntasModulo = (mod: ModuloCuestionarioInfo) => {
        setSelectedEntrega(null)
        setModuloVisualizandoPreguntas(mod)
        setMensaje(null)
    }

    const setEvaluacionField = (preguntaId: string, field: 'etiqueta' | 'retroalimentacion', value: string) => {
        setEvaluacionesLocales(prev => ({
            ...prev,
            [preguntaId]: {
                ...(prev[preguntaId] || { etiqueta: '', retroalimentacion: '' }),
                [field]: value
            }
        }))
    }

    const handleCalificar = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEntrega) return
        
        for (const p of selectedEntrega.preguntas) {
            if (!evaluacionesLocales[p.id]?.etiqueta) {
                setMensaje({ type: 'error', text: `Por favor selecciona una evaluación para la pregunta: "${p.pregunta}"` })
                return
            }
        }

        setSubmitting(true)
        setMensaje(null)
        try {
            await calificarCuestionario(selectedEntrega.id, evaluacionesLocales)
            
            const updated = entregas.map(ent => {
                if (ent.id === selectedEntrega.id) {
                    return {
                        ...ent,
                        estado: 'evaluado',
                        evaluaciones: evaluacionesLocales
                    }
                }
                return ent
            })
            setEntregas(updated)
            setSelectedEntrega(prev => prev ? { ...prev, estado: 'evaluado', evaluaciones: evaluacionesLocales } : null)
            setShowSuccessModal(true)
        } catch (err: any) {
            setMensaje({ type: 'error', text: err.message || 'Error al guardar la evaluación.' })
        } finally {
            setSubmitting(false)
        }
    }

    // Entregas filtradas del curso
    const entregasDelCurso = selectedCurso 
        ? entregas.filter(e => {
            if (e.curso_id !== selectedCurso) return false;
            if (filtroEstado === 'pendientes') return e.estado !== 'evaluado';
            if (filtroEstado === 'evaluados') return e.estado === 'evaluado';
            return true;
        }) 
        : []

    // Conteo global de entregas del curso sin filtro de estado
    const todasEntregasDelCurso = selectedCurso 
        ? entregas.filter(e => e.curso_id === selectedCurso) 
        : []
    const totalEvaluados = todasEntregasDelCurso.filter(e => e.estado === 'evaluado').length
    const totalPendientesRevision = todasEntregasDelCurso.filter(e => e.estado !== 'evaluado').length
    const totalPreguntasConfiguradas = infoCursoActual?.modulosConCuestionario.reduce((acc, m) => acc + m.preguntas.length, 0) || 0

    return (
        <div className="space-y-8">
            
            {/* 1. Selector de Curso */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            Selecciona un Curso para revisar o consultar cuestionarios:
                        </label>
                        <select 
                            value={selectedCurso} 
                            onChange={(e) => handleSelectCurso(e.target.value)}
                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-base font-semibold text-gray-900 bg-white"
                        >
                            <option value="">-- Elige un curso --</option>
                            {cursosDisponibles.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.titulo}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCurso && (
                        <div className="flex items-center gap-2 self-start md:self-end">
                            <Link
                                href={`/profesor/editar-curso/${selectedCurso}`}
                                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors border border-gray-200"
                            >
                                <Edit className="w-3.5 h-3.5" />
                                <span>Editar Cuestionarios en el Curso</span>
                                <ExternalLink className="w-3 h-3 text-gray-400" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Resumen Métrico del Curso */}
                {selectedCurso && infoCursoActual && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        {infoCursoActual.tieneCuestionarios ? (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                                        Cuestionario Abierto Configurado y Activo
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {infoCursoActual.modulosConCuestionario.length} módulo(s) con preguntas libres
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                                        <p className="text-[11px] font-bold text-blue-700 uppercase">Preguntas Activas</p>
                                        <p className="text-xl font-extrabold text-blue-900">{totalPreguntasConfiguradas}</p>
                                    </div>
                                    <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100">
                                        <p className="text-[11px] font-bold text-purple-700 uppercase">Alumnos Inscritos</p>
                                        <p className="text-xl font-extrabold text-purple-900">{infoCursoActual.totalAlumnos}</p>
                                    </div>
                                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                                        <p className="text-[11px] font-bold text-amber-700 uppercase">Por Evaluar</p>
                                        <p className="text-xl font-extrabold text-amber-900">{totalPendientesRevision}</p>
                                    </div>
                                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                                        <p className="text-[11px] font-bold text-emerald-700 uppercase">Evaluados</p>
                                        <p className="text-xl font-extrabold text-emerald-900">{totalEvaluados}</p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-200 rounded-xl">
                                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1 text-sm text-amber-900">
                                    <p className="font-bold">Este curso no tiene módulos con cuestionario de preguntas abiertas configurado.</p>
                                    <p className="text-xs text-amber-800 mt-0.5">
                                        Para agregar preguntas abiertas que tus alumnos deban responder y tú calificar, ve a la edición del curso, entra a cualquier módulo y marca la casilla <em>"¿Este módulo requiere un Cuestionario de preguntas abiertas?"</em>.
                                    </p>
                                </div>
                                <Link
                                    href={`/profesor/editar-curso/${selectedCurso}`}
                                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition whitespace-nowrap"
                                >
                                    Configurar Ahora
                                </Link>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. Cuerpo Principal */}
            {selectedCurso && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Columna Izquierda: Cuestionarios y Entregas */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* Listado de Módulos con Cuestionario */}
                        {infoCursoActual && infoCursoActual.tieneCuestionarios && (
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <FileText className="w-5 h-5 text-blue-600" />
                                            Cuestionarios y Entregas del Curso
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Revisa las preguntas configuradas o califica las respuestas enviadas por tus alumnos.
                                        </p>
                                    </div>

                                    {todasEntregasDelCurso.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <Filter className="w-3.5 h-3.5 text-gray-400" />
                                            <select
                                                value={filtroEstado}
                                                onChange={(e) => { setFiltroEstado(e.target.value as any); setSelectedEntrega(null); }}
                                                className="rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-1.5 text-xs text-black bg-white font-semibold"
                                            >
                                                <option value="pendientes">Pendientes de calificar</option>
                                                <option value="evaluados">Ya evaluados</option>
                                                <option value="todos">Todos los entregados</option>
                                            </select>
                                        </div>
                                    )}
                                </div>

                                {/* Módulos */}
                                <div className="space-y-6">
                                    {infoCursoActual.modulosConCuestionario.map((modulo) => {
                                        const entregasDelModulo = entregasDelCurso.filter(e => e.modulo_id === modulo.id)
                                        const todasEntregasModulo = todasEntregasDelCurso.filter(e => e.modulo_id === modulo.id)
                                        const isViewingPreguntas = moduloVisualizandoPreguntas?.id === modulo.id && !selectedEntrega

                                        return (
                                            <div key={modulo.id} className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                                                {/* Encabezado del Módulo */}
                                                <div className="p-4 bg-gradient-to-r from-gray-50 to-blue-50/30 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                                            <h3 className="font-bold text-gray-900 text-sm">{modulo.titulo}</h3>
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-1 pl-6">
                                                            {modulo.preguntas.length} pregunta(s) abierta(s) configuradas
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleVerPreguntasModulo(modulo)}
                                                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                                                            isViewingPreguntas 
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                                                                : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                                                        }`}
                                                    >
                                                        <Eye className="w-3.5 h-3.5" />
                                                        <span>Ver Preguntas ({modulo.preguntas.length})</span>
                                                    </button>
                                                </div>

                                                {/* Contenido: Entregas o Estado Sin Entregas */}
                                                <div className="p-4">
                                                    {todasEntregasModulo.length > 0 ? (
                                                        <div className="space-y-2">
                                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                                                                Entregas de alumnos ({entregasDelModulo.length}):
                                                            </p>
                                                            {entregasDelModulo.length === 0 ? (
                                                                <p className="text-xs text-gray-500 italic py-2">
                                                                    No hay entregas que coincidan con el filtro "{filtroEstado}".
                                                                </p>
                                                            ) : (
                                                                entregasDelModulo.map(ent => {
                                                                    const isSelected = selectedEntrega?.id === ent.id
                                                                    return (
                                                                        <button
                                                                            key={ent.id}
                                                                            type="button"
                                                                            onClick={() => handleSelectEntrega(ent)}
                                                                            className={`w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-center ${
                                                                                isSelected 
                                                                                    ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-500/30' 
                                                                                    : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50/70'
                                                                            }`}
                                                                        >
                                                                            <div>
                                                                                <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                                                                    <User className="h-3.5 w-3.5 text-gray-500" />
                                                                                    <span>{ent.alumno_nombre}</span>
                                                                                    {ent.alumno_verificado && (
                                                                                        <span className="text-blue-500 flex-shrink-0" title="Verificado">
                                                                                            <svg className="w-3.5 h-3.5 fill-current inline-block" viewBox="0 0 24 24">
                                                                                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                                                            </svg>
                                                                                        </span>
                                                                                    )}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500 mt-0.5" suppressHydrationWarning>
                                                                                    Enviado el {new Date(ent.created_at).toLocaleDateString()} a las {new Date(ent.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                                </p>
                                                                            </div>
                                                                            <div>
                                                                                {ent.estado === 'evaluado' ? (
                                                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full flex items-center gap-1">
                                                                                        <Award className="h-3.5 w-3.5" />
                                                                                        Evaluado
                                                                                    </span>
                                                                                ) : (
                                                                                    <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full flex items-center gap-1">
                                                                                        <Clock className="h-3.5 w-3.5" />
                                                                                        Pendiente
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </button>
                                                                    )
                                                                })
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {/* Banner explicativo elegante */}
                                                            <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                                                                <Clock className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                                                <div className="text-xs text-blue-900 leading-relaxed">
                                                                    <p className="font-bold text-sm text-blue-950 mb-1">
                                                                        Cuestionario Activo — En espera de respuestas de alumnos
                                                                    </p>
                                                                    <p>
                                                                        Este módulo tiene <strong>{modulo.preguntas.length} preguntas abiertas</strong> configuradas y visibles para los estudiantes en el reproductor del curso.
                                                                    </p>
                                                                    <p className="mt-1 text-blue-800">
                                                                        Actualmente ninguno de tus <strong>{infoCursoActual.totalAlumnos} alumnos inscritos</strong> ha enviado sus respuestas aún. En cuanto un alumno conteste desde el curso, su entrega aparecerá aquí automáticamente para que puedas evaluarla y retroalimentarla.
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            {/* Lista de Alumnos Inscritos */}
                                                            {infoCursoActual.alumnosInscritos.length > 0 && (
                                                                <div className="pt-2">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                                            <Users className="w-3.5 h-3.5 text-gray-400" />
                                                                            Alumnos inscritos en este curso ({infoCursoActual.alumnosInscritos.length}):
                                                                        </span>
                                                                        <span className="text-[11px] text-gray-400">
                                                                            0/{infoCursoActual.alumnosInscritos.length} entregados
                                                                        </span>
                                                                    </div>
                                                                    <div className="max-h-52 overflow-y-auto space-y-1.5 pr-1 border border-gray-100 rounded-xl p-2 bg-gray-50/50">
                                                                        {infoCursoActual.alumnosInscritos.map((alumno) => (
                                                                            <div 
                                                                                key={alumno.id} 
                                                                                className="px-3 py-2 bg-white rounded-lg border border-gray-100 flex items-center justify-between text-xs"
                                                                            >
                                                                                <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                                                                                    <User className="w-3 h-3 text-gray-400" />
                                                                                    {alumno.nombre}
                                                                                </span>
                                                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                                                                                    Pendiente de entrega
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna Derecha: Panel de Detalle / Revisión */}
                    <div className="lg:col-span-1">
                        
                        {/* CASO 1: Formulario de Evaluación de Entrega de Alumno */}
                        {selectedEntrega ? (
                            <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-4rem)] sticky top-8">
                                <div className="p-6 border-b border-gray-100 bg-zinc-50/50">
                                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                                        <Edit className="h-5 w-5 text-blue-600" />
                                        Calificar Cuestionario
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium mb-4">
                                        Revisa las respuestas del alumno y asigna una evaluación a cada una.
                                    </p>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Alumno</p>
                                            <div className="text-sm font-bold text-gray-800 flex items-center gap-1">
                                                <span>{selectedEntrega.alumno_nombre}</span>
                                                {selectedEntrega.alumno_verificado && (
                                                    <span className="text-blue-500 flex-shrink-0" title="Verificado">
                                                        <svg className="w-3.5 h-3.5 fill-current inline-block" viewBox="0 0 24 24">
                                                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                        </svg>
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Módulo</p>
                                            <p className="text-sm font-bold text-gray-800 line-clamp-2">{selectedEntrega.modulo_titulo}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Listado de Preguntas y Respuestas */}
                                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                                    <form onSubmit={handleCalificar} className="space-y-6">
                                        
                                        {mensaje && mensaje.type === 'error' && (
                                            <div className="p-3.5 rounded-xl text-xs font-bold border bg-red-50 border-red-200 text-red-800">
                                                {mensaje.text}
                                            </div>
                                        )}

                                        <div className="space-y-6">
                                            {selectedEntrega.preguntas.map((p, idx) => {
                                                const ev = evaluacionesLocales[p.id] || { etiqueta: '', retroalimentacion: '' };
                                                
                                                return (
                                                <div key={p.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                                                    <h4 className="text-sm font-bold text-gray-800">
                                                        {idx + 1}. {p.pregunta}
                                                    </h4>
                                                    
                                                    <div className="text-sm text-gray-700 whitespace-pre-wrap p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                                                        {selectedEntrega.respuestas[p.id] || <span className="italic text-gray-400">Sin respuesta</span>}
                                                    </div>

                                                    {/* Bloque de Calificación */}
                                                    <div className="pt-3 border-t border-gray-100 space-y-3">
                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-2">Evaluación de esta respuesta:</label>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {ETIQUETAS.map(et => (
                                                                    <button
                                                                        key={et.id}
                                                                        type="button"
                                                                        onClick={() => setEvaluacionField(p.id, 'etiqueta', et.id)}
                                                                        className={`p-2 rounded-xl text-xs font-bold transition-all border text-center ${
                                                                            ev.etiqueta === et.id 
                                                                            ? `${et.color} ring-2 ring-blue-500 shadow-sm` 
                                                                            : 'bg-zinc-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                                                                        }`}
                                                                    >
                                                                        {et.label}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-500 uppercase mb-1">Retroalimentación (Opcional):</label>
                                                            <textarea
                                                                rows={2}
                                                                value={ev.retroalimentacion}
                                                                onChange={(e) => setEvaluacionField(p.id, 'retroalimentacion', e.target.value)}
                                                                placeholder="Comentarios para el estudiante sobre esta respuesta..."
                                                                className="w-full text-sm rounded-xl border-gray-300 p-2.5 border bg-white text-black font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )})}
                                        </div>

                                        <div className="pt-4 sticky bottom-0 bg-white border-t border-gray-100 mt-4 pb-2">
                                            <button
                                                type="submit"
                                                disabled={submitting}
                                                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2"
                                            >
                                                <CheckCircle className="h-5 w-5" />
                                                {submitting ? 'Guardando...' : 'Guardar Evaluaciones'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        ) : moduloVisualizandoPreguntas ? (
                            /* CASO 2: Visualización de las Preguntas Configuradas del Cuestionario */
                            <div className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden sticky top-8 p-6 space-y-6">
                                <div>
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
                                        <Eye className="w-3.5 h-3.5" />
                                        Preguntas Configuradas
                                    </span>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {moduloVisualizandoPreguntas.titulo}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Estas son las {moduloVisualizandoPreguntas.preguntas.length} preguntas que tus alumnos deben responder en este módulo.
                                    </p>
                                </div>

                                <div className="space-y-3">
                                    {moduloVisualizandoPreguntas.preguntas.map((preg, idx) => (
                                        <div key={preg.id} className="p-4 bg-gray-50/80 rounded-xl border border-gray-200 space-y-1">
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                                                Pregunta #{idx + 1}
                                            </span>
                                            <p className="text-sm font-semibold text-gray-800 leading-snug">
                                                {preg.pregunta}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                                    <Link
                                        href={`/profesor/editar-curso/${selectedCurso}`}
                                        className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-xl text-center transition flex items-center justify-center gap-1.5"
                                    >
                                        <Edit className="w-3.5 h-3.5" />
                                        <span>Editar o Agregar Preguntas al Curso</span>
                                    </Link>
                                    <p className="text-[11px] text-gray-400 text-center">
                                        Las modificaciones se reflejan en tiempo real para todos los alumnos.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            /* CASO 3: Placeholder inicial */
                            <div className="bg-zinc-50 border-2 border-dashed border-gray-300 rounded-3xl p-10 text-center text-gray-400 mt-6">
                                <HelpCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <h3 className="text-base font-bold text-gray-700 mb-1">Ningún cuestionario seleccionado</h3>
                                <p className="text-xs font-medium text-gray-500">
                                    Selecciona un cuestionario o entrega de la lista izquierda para comenzar a revisarlo o evaluarlo.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal de Éxito al Guardar */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 text-center transform scale-100 transition-transform">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">¡Guardado!</h3>
                        <p className="text-sm font-medium text-gray-500 mb-8 px-2">Las evaluaciones han sido guardadas y el estudiante ha sido notificado.</p>
                        <button 
                            onClick={() => setShowSuccessModal(false)}
                            className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl active:scale-95"
                        >
                            Continuar
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
