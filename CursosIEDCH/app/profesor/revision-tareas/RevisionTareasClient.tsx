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

export default function RevisionTareasClient({ entregas: initialEntregas, cursos = [] }: { entregas: Entrega[], cursos?: any[] }) {
    const [entregas, setEntregas] = useState<Entrega[]>(initialEntregas)
    const [selectedEntrega, setSelectedEntrega] = useState<Entrega | null>(null)
    const [selectedCurso, setSelectedCurso] = useState<string>('')

    // Form states
    const [calificacion, setCalificacion] = useState<number | ''>('')
    const [retroalimentacion, setRetroalimentacion] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [mensaje, setMensaje] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    // Courses list for filter dropdown
    // Si pasamos los cursos como prop, usamos esos, sino los inferimos de las entregas
    const cursosDisponibles = cursos.length > 0 
        ? cursos 
        : Array.from(
            new Set(entregas.map(e => JSON.stringify({ id: e.curso_id, titulo: e.curso_titulo })))
        ).map(str => JSON.parse(str))

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

    // Entregas of selected course
    const entregasDelCurso = selectedCurso 
        ? entregas.filter(e => e.curso_id === selectedCurso) 
        : []

    // Group by module
    const modulosDelCurso = Array.from(
        new Set(entregasDelCurso.map(e => JSON.stringify({ id: e.modulo_id, titulo: e.modulo_titulo })))
    ).map(str => JSON.parse(str))

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left/Middle: List & Filters */}
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
                        {cursosDisponibles.map(c => (
                            <option key={c.id} value={c.id}>{c.titulo}</option>
                        ))}
                    </select>
                </div>

                {selectedCurso && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h2 className="font-bold text-gray-900 mb-4">Tareas del curso</h2>
                        {modulosDelCurso.length === 0 ? (
                            <p className="text-gray-500 text-sm">Este curso no tiene entregas de tareas todavía.</p>
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
                                                                <p className="text-xs text-gray-500">{new Date(ent.created_at).toLocaleDateString()}</p>
                                                            </div>
                                                            <div>
                                                                {ent.calificacion !== null ? (
                                                                    <span className="px-3.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-black rounded-full flex items-center gap-1">
                                                                        <Award className="h-4 w-4" />
                                                                        {ent.calificacion}%
                                                                    </span>
                                                                ) : (
                                                                    <span className="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-black rounded-full flex items-center gap-1 animate-pulse">
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
