'use client'

import { useState } from 'react'
import { FileText, CheckCircle, Award, Clock, ArrowRight, BookOpen, User, Star, Filter, Edit } from 'lucide-react'
import { calificarCuestionario } from './actions'

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

export default function RevisionCuestionariosClient({ entregas: initialEntregas, cursos = [] }: { entregas: Entrega[], cursos?: any[] }) {
    const [entregas, setEntregas] = useState<Entrega[]>(initialEntregas)
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null)
    const [selectedCurso, setSelectedCurso] = useState<string>('')
    const [filtroEstado, setFiltroEstado] = useState<'pendientes' | 'evaluados' | 'todos'>('pendientes')

    // Form states
    const [evaluacionesLocales, setEvaluacionesLocales] = useState<Record<string, Evaluacion>>({})
    const [submitting, setSubmitting] = useState(false)
    const [mensaje, setMensaje] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [showSuccessModal, setShowSuccessModal] = useState(false)

    // Courses list for filter dropdown
    // Si pasamos los cursos como prop, usamos esos, sino los inferimos de las entregas
    const cursosDisponibles = cursos.length > 0 
        ? cursos 
        : Array.from(
            new Set(entregas.map(e => JSON.stringify({ id: e.curso_id, titulo: e.curso_titulo })))
        ).map(str => JSON.parse(str))

    const handleSelectEntrega = (ent: Entrega) => {
        setSelectedEntrega(ent)
        setEvaluacionesLocales(ent.evaluaciones || {})
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
        
        // Validate all questions have etiqueta
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
            
            // Update local state
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

    // Entregas of selected course
    const entregasDelCurso = selectedCurso 
        ? entregas.filter(e => {
            if (e.curso_id !== selectedCurso) return false;
            if (filtroEstado === 'pendientes') return e.estado !== 'evaluado';
            if (filtroEstado === 'evaluados') return e.estado === 'evaluado';
            return true;
        }) 
        : []

    // Group by module
    const modulosDelCurso = Array.from(
        new Set(entregasDelCurso.map(e => JSON.stringify({ id: e.modulo_id, titulo: e.modulo_titulo })))
    ).map(str => JSON.parse(str))

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Lista de Entregas (Izquierda) */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* Course Selection */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Selecciona un Curso:</label>
                    <select 
                        value={selectedCurso} 
                        onChange={(e) => { setSelectedCurso(e.target.value); setSelectedEntrega(null); }}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white"
                    >
                        <option value="">-- Elige un curso --</option>
                        {cursosDisponibles.map((c: any) => (
                            <option key={c.id} value={c.id}>{c.titulo}</option>
                        ))}
                    </select>
                </div>

                {selectedCurso && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-gray-900">Cuestionarios del curso</h2>
                            <select
                                value={filtroEstado}
                                onChange={(e) => { setFiltroEstado(e.target.value as any); setSelectedEntrega(null); }}
                                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-1.5 text-sm text-black bg-white"
                            >
                                <option value="pendientes">Pendientes</option>
                                <option value="evaluados">Evaluados</option>
                                <option value="todos">Todos</option>
                            </select>
                        </div>
                        {modulosDelCurso.length === 0 ? (
                            <p className="text-gray-500 text-sm">Este curso no tiene entregas de cuestionarios todavía.</p>
                        ) : (
                            <div className="space-y-4">
                                {modulosDelCurso.map(modulo => {
                                    const entregasModulo = entregasDelCurso.filter(e => e.modulo_id === modulo.id)
                                    return (
                                        <div key={modulo.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                                            <div className="px-3 py-2 bg-white border-b border-gray-100">
                                                <p className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                                    <BookOpen className="h-4 w-4 text-blue-600" />
                                                    {modulo.titulo}
                                                </p>
                                            </div>
                                            <div className="p-2 space-y-2">
                                                {entregasModulo.map(ent => {
                                                    const isSelected = selectedEntrega?.id === ent.id
                                                    return (
                                                        <button
                                                            key={ent.id}
                                                            onClick={() => handleSelectEntrega(ent)}
                                                            className={`w-full text-left p-3 rounded-lg border transition-colors flex justify-between items-center ${isSelected ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100 hover:bg-gray-100'}`}
                                                        >
                                                            <div>
                                                                <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                                                                    <User className="h-3.5 w-3.5 text-gray-500" />
                                                                    {ent.alumno_nombre}
                                                                </p>
                                                                <p className="text-xs text-gray-500" suppressHydrationWarning>
                                                                    {new Date(ent.created_at).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                {ent.estado === 'evaluado' ? (
                                                                    <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-full flex items-center gap-1">
                                                                        <Award className="h-4 w-4" />
                                                                        Evaluado
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-3.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black rounded-full flex items-center gap-1">
                                                                        <Clock className="h-4 w-4" />
                                                                        Pendiente
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Panel de Revisión (Derecha) */}
            <div className="lg:col-span-1">
                {selectedEntrega ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-4rem)] sticky top-8">
                        <div className="p-6 border-b border-gray-100 bg-zinc-50/50">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
                                <Edit className="h-5 w-5 text-blue-600" />
                                Detalle del Cuestionario
                            </h2>
                            <p className="text-xs text-gray-500 font-medium mb-4">
                                Revisa las respuestas del alumno y asigna una evaluación a cada una.
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Alumno</p>
                                    <p className="text-sm font-bold text-gray-800">{selectedEntrega.alumno_nombre}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Módulo</p>
                                    <p className="text-sm font-bold text-gray-800">{selectedEntrega.modulo_titulo}</p>
                                </div>
                            </div>
                        </div>

                        {/* Listado de Preguntas */}
                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            <form onSubmit={handleCalificar} className="space-y-6">
                                
                                {mensaje && mensaje.type === 'error' && (
                                    <div className="p-3.5 rounded-xl text-xs font-bold border bg-red-50 border-red-200 text-red-800">
                                        {mensaje.text}
                                    </div>
                                )}

                                <div className="space-y-8">
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

                                            {/* Grading block per question */}
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
                ) : (
                    <div className="bg-zinc-50 border-2 border-dashed border-gray-300 rounded-3xl p-12 text-center text-gray-400 mt-10">
                        <Edit className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <h3 className="text-lg font-bold text-gray-800 mb-1">Ningún cuestionario seleccionado</h3>
                        <p className="text-sm font-medium">Selecciona un cuestionario de la lista de la izquierda para comenzar a evaluarlo pregunta por pregunta.</p>
                    </div>
                )}
            </div>

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md transition-opacity">
                    <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full mx-4 text-center transform scale-100 transition-transform">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                            <CheckCircle className="h-10 w-10 text-emerald-500" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">¡Guardado!</h3>
                        <p className="text-sm font-medium text-gray-500 mb-8 px-2">Las evaluaciones han sido guardadas correctamente en el sistema.</p>
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
