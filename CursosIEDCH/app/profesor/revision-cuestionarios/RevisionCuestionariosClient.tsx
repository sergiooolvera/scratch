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

export default function RevisionCuestionariosClient({ entregas: initialEntregas }: { entregas: Entrega[] }) {
    const [entregas, setEntregas] = useState<Entrega[]>(initialEntregas)
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null)
    const [filterCurso, setFilterCurso] = useState('all')
    const [filterEstado, setFilterEstado] = useState('all') // 'all', 'entregado', 'evaluado'

    // Form states
    const [evaluacionesLocales, setEvaluacionesLocales] = useState<Record<string, Evaluacion>>({})
    const [submitting, setSubmitting] = useState(false)
    const [mensaje, setMensaje] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Courses list for filter dropdown
    const cursosDisponibles = Array.from(new Set(entregas.map(e => JSON.stringify({ id: e.curso_id, titulo: e.curso_titulo }))))
        .map(str => JSON.parse(str as string))

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
            setMensaje({ type: 'success', text: '¡Evaluación guardada correctamente!' })
        } catch (err: any) {
            setMensaje({ type: 'error', text: err.message || 'Error al guardar la evaluación.' })
        } finally {
            setSubmitting(false)
        }
    }

    // Apply filtering
    const filteredEntregas = entregas.filter(e => {
        if (filterCurso !== 'all' && e.curso_id !== filterCurso) return false
        if (filterEstado !== 'all' && e.estado !== filterEstado) return false
        return true
    })

    return (
        <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Lista de Entregas (Izquierda) */}
            <div className="w-full lg:w-1/2 space-y-4">
                {/* Filters */}
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                    <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
                        <Filter className="h-4 w-4" /> Filtrar Cuestionarios
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select 
                            value={filterCurso} 
                            onChange={(e) => setFilterCurso(e.target.value)}
                            className="w-full bg-zinc-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los Cursos</option>
                            {cursosDisponibles.map((c: any) => (
                                <option key={c.id} value={c.id}>{c.titulo}</option>
                            ))}
                        </select>
                        <select 
                            value={filterEstado} 
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="w-full bg-zinc-50 border border-gray-300 rounded-lg px-3 py-2 text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="entregado">Pendiente de Revisión</option>
                            <option value="evaluado">Evaluado</option>
                        </select>
                    </div>
                </div>

                {filteredEntregas.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center text-gray-400">
                        <Clock className="h-10 w-10 mb-3 text-gray-300" />
                        <p className="font-semibold text-sm">No se encontraron cuestionarios con los filtros seleccionados.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredEntregas.map((ent) => {
                            const isSelected = selectedEntrega?.id === ent.id;
                            return (
                                <button
                                    key={ent.id}
                                    onClick={() => handleSelectEntrega(ent)}
                                    className={`w-full text-left p-5 bg-white hover:bg-zinc-50 border rounded-2xl shadow-sm transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                                        isSelected ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/10' : 'border-zinc-200'
                                    }`}
                                >
                                    <div className="space-y-1.5 flex-grow">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2 py-0.5 bg-zinc-100 border border-zinc-250 text-zinc-650 rounded text-[10px] font-black uppercase">
                                                {ent.curso_titulo}
                                            </span>
                                            <span className="text-[10px] text-gray-400" suppressHydrationWarning>
                                                {new Date(ent.created_at).toLocaleDateString()}
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                                            <User className="h-4 w-4 text-gray-400" />
                                            {ent.alumno_nombre}
                                        </h3>

                                        <p className="text-xs text-gray-550 font-semibold flex items-center gap-1">
                                            <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                                            {ent.modulo_titulo}
                                        </p>
                                    </div>

                                    <div className="flex-shrink-0 flex items-center gap-3">
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
                                        <ArrowRight className={`h-5 w-5 transition-transform ${isSelected ? 'text-blue-600 translate-x-1' : 'text-gray-300'}`} />
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Panel de Revisión (Derecha) */}
            <div className="w-full lg:w-1/2 sticky top-24">
                {selectedEntrega ? (
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-8rem)]">
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
                                
                                {mensaje && (
                                    <div className={`p-3.5 rounded-xl text-xs font-bold border ${
                                        mensaje.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                                    }`}>
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

                                <div className="pt-4 sticky bottom-0 bg-white border-t border-gray-100 mt-4">
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
        </div>
    )
}
