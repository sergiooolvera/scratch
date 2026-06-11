'use client'

import { useState } from 'react'
import { FileText, CheckCircle, Award, Clock, ArrowRight, BookOpen, User, Star, Filter, Edit, ExternalLink } from 'lucide-react'
import { calificarTarea } from './actions'

type Entrega = {
    id: string;
    curso_id: string;
    curso_titulo: string;
    modulo_id: string;
    modulo_titulo: string;
    alumno_nombre: string;
    explicacion: string;
    archivos: string[];
    calificacion: number | null;
    retroalimentacion: string;
    created_at: string;
    responded_at?: string;
}

export default function RevisionTareasClient({ entregas: initialEntregas }: { entregas: Entrega[] }) {
    const [entregas, setEntregas] = useState<Entrega[]>(initialEntregas)
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null)
    const [filterCurso, setFilterCurso] = useState('all')
    const [filterEstado, setFilterEstado] = useState('all') // 'all', 'pending', 'graded'

    // Form states
    const [calificacion, setCalificacion] = useState<number | ''>('')
    const [retroalimentacion, setRetroalimentacion] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [mensaje, setMensaje] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Courses list for filter dropdown
    const cursosDisponibles = Array.from(new Set(entregas.map(e => JSON.stringify({ id: e.curso_id, titulo: e.curso_titulo }))))
        .map(str => JSON.parse(str))

    const handleSelectEntrega = (ent: Entrega) => {
        setSelectedEntrega(ent)
        setCalificacion(ent.calificacion !== null ? ent.calificacion : '')
        setRetroalimentacion(ent.retroalimentacion || '')
        setMensaje(null)
    }

    const handleCalificar = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedEntrega) return
        if (calificacion === '' || Number(calificacion) < 0 || Number(calificacion) > 100) {
            setMensaje({ type: 'error', text: 'Por favor ingresa una calificación válida (0-100).' })
            return
        }

        setSubmitting(true)
        setMensaje(null)
        try {
            await calificarTarea(selectedEntrega.id, Number(calificacion), retroalimentacion)
            
            // Update local state
            const updated = entregas.map(e => {
                if (e.id === selectedEntrega.id) {
                    return {
                        ...e,
                        calificacion: Number(calificacion),
                        retroalimentacion
                    }
                }
                return e
            })
            setEntregas(updated)
            setSelectedEntrega(prev => prev ? { ...prev, calificacion: Number(calificacion), retroalimentacion } : null)
            setMensaje({ type: 'success', text: '¡Calificación guardada correctamente!' })
        } catch (err: any) {
            setMensaje({ type: 'error', text: err.message || 'Error al guardar la calificación.' })
        } finally {
            setSubmitting(false)
        }
    }

    // Apply filtering
    const filteredEntregas = entregas.filter(e => {
        if (filterCurso !== 'all' && e.curso_id !== filterCurso) return false
        if (filterEstado === 'pending' && e.calificacion !== null) return false
        if (filterEstado === 'graded' && e.calificacion === null) return false
        return true
    })

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle: List & Filters */}
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl border border-zinc-150 p-5 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="flex items-center gap-2 text-gray-700 font-bold">
                        <Filter className="h-5 w-5 text-blue-600" />
                        <span>Filtrar Entregas</span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                        <select
                            value={filterCurso}
                            onChange={(e) => setFilterCurso(e.target.value)}
                            className="text-xs rounded-xl border-gray-250 p-2.5 border bg-white text-gray-700 font-semibold focus:outline-none"
                        >
                            <option value="all">Todos los Cursos</option>
                            {cursosDisponibles.map(c => (
                                <option key={c.id} value={c.id}>{c.titulo}</option>
                            ))}
                        </select>

                        <select
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="text-xs rounded-xl border-gray-255 p-2.5 border bg-white text-gray-700 font-semibold focus:outline-none"
                        >
                            <option value="all">Todos los Estados</option>
                            <option value="pending">⏳ Pendiente de Revisión</option>
                            <option value="graded">✅ Calificadas</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-4">
                    {filteredEntregas.length === 0 ? (
                        <div className="text-center py-16 bg-white border border-dashed border-gray-300 rounded-2xl">
                            <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3 animate-pulse" />
                            <p className="text-gray-500 font-bold">No se encontraron entregas con los filtros seleccionados.</p>
                        </div>
                    ) : (
                        filteredEntregas.map(ent => {
                            const isSelected = selectedEntrega?.id === ent.id
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
                                            <span className="text-[10px] text-gray-400">
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
                                        {ent.calificacion !== null ? (
                                            <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-full flex items-center gap-1">
                                                <Award className="h-4 w-4" />
                                                Nota: {ent.calificacion}/100
                                            </span>
                                        ) : (
                                            <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black rounded-full flex items-center gap-1 animate-pulse">
                                                <Clock className="h-4 w-4" />
                                                Pendiente
                                            </span>
                                        )}

                                        <ArrowRight className="h-5 w-5 text-gray-400 hidden sm:block" />
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </div>

            {/* Right: Submission Details & Grading Panel */}
            <div className="lg:col-span-1">
                {selectedEntrega ? (
                    <div className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-md space-y-6 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto">
                        <div className="border-b border-gray-100 pb-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Edit className="h-5 w-5 text-blue-600" />
                                Detalle de Entrega
                            </h2>
                            <p className="text-xs text-gray-400 mt-1">Revisa el trabajo y asigna una calificación.</p>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <h4 className="text-xs font-bold text-gray-450 uppercase tracking-wider">Alumno</h4>
                                <p className="font-bold text-gray-900 mt-0.5">{selectedEntrega.alumno_nombre}</p>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-gray-455 uppercase tracking-wider">Módulo</h4>
                                <p className="font-semibold text-gray-700 mt-0.5">{selectedEntrega.modulo_titulo}</p>
                            </div>

                            <div className="bg-zinc-50 border border-gray-200 rounded-xl p-4 space-y-2">
                                <h4 className="text-xs font-bold text-gray-500">Explicación del alumno:</h4>
                                <p className="text-sm text-gray-650 whitespace-pre-wrap italic">
                                    "{selectedEntrega.explicacion}"
                                </p>
                            </div>

                            {selectedEntrega.archivos && selectedEntrega.archivos.length > 0 && (
                                <div className="space-y-2">
                                    <h4 className="text-xs font-bold text-gray-450 uppercase tracking-wider">Archivos Adjuntos</h4>
                                    <div className="flex flex-col gap-2">
                                        {selectedEntrega.archivos.map((url, idx) => (
                                            <a
                                                key={idx}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center justify-between px-3 py-2 bg-blue-50/30 hover:bg-blue-50/60 border border-blue-200 text-blue-700 rounded-xl text-xs font-bold transition"
                                            >
                                                <span className="truncate max-w-[200px]">Archivo de prueba #{idx + 1}</span>
                                                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Grading Form */}
                        <form onSubmit={handleCalificar} className="border-t border-gray-100 pt-6 space-y-4">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                                Calificar Proyecto
                            </h3>

                            {mensaje && (
                                <div className={`p-3.5 rounded-xl text-xs font-bold border ${
                                    mensaje.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                                }`}>
                                    {mensaje.text}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Calificación (0 - 100):</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    required
                                    value={calificacion}
                                    onChange={(e) => setCalificacion(e.target.value === '' ? '' : Number(e.target.value))}
                                    placeholder="Ej. 95"
                                    className="w-full text-sm rounded-xl border-gray-300 p-2.5 border bg-white text-black font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-600 mb-1">Retroalimentación / Comentarios:</label>
                                <textarea
                                    rows={4}
                                    value={retroalimentacion}
                                    onChange={(e) => setRetroalimentacion(e.target.value)}
                                    placeholder="Escribe comentarios de apoyo, correcciones o felicitaciones para el estudiante..."
                                    className="w-full text-sm rounded-xl border-gray-300 p-2.5 border bg-white text-black font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition"
                            >
                                {submitting ? 'Guardando...' : 'Guardar Calificación'}
                            </button>
                        </form>
                    </div>
                ) : (
                    <div className="bg-zinc-50 border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-400">
                        <Edit className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm font-semibold">Selecciona una entrega de la lista para comenzar a evaluarla.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
