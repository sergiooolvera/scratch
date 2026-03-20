'use client'

import { useState, useMemo } from 'react'
import { responderPregunta } from './actions'
import { CheckCircle, Clock, BookOpen, User, Reply, Filter } from 'lucide-react'

export default function PreguntasClient({ preguntas }: { preguntas: any[] }) {
    const [submittingId, setSubmittingId] = useState<string | null>(null)
    const [respuestasInputs, setRespuestasInputs] = useState<{ [key: string]: string }>({})
    const [feedbackMsg, setFeedbackMsg] = useState<{ id: string, msg: string, type: 'success' | 'error' } | null>(null)
    const [filtroCurso, setFiltroCurso] = useState<string>('todos')
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'pendientes' | 'respondidas'>('todos')

    const cursoOptions = useMemo(() => {
        const seen = new Set<string>()
        const opts: { id: string, titulo: string }[] = []
        preguntas.forEach(p => {
            if (!seen.has(p.curso_id)) {
                seen.add(p.curso_id)
                opts.push({ id: p.curso_id, titulo: p.curso_titulo })
            }
        })
        return opts
    }, [preguntas])

    const preguntasFiltradas = useMemo(() => {
        return preguntas.filter(p => {
            const coincideCurso = filtroCurso === 'todos' || p.curso_id === filtroCurso
            const coincideEstado =
                filtroEstado === 'todos' ||
                (filtroEstado === 'pendientes' && !p.respuesta) ||
                (filtroEstado === 'respondidas' && !!p.respuesta)
            return coincideCurso && coincideEstado
        })
    }, [preguntas, filtroCurso, filtroEstado])

    const handleResponder = async (id: string) => {
        const res = respuestasInputs[id]
        if (!res?.trim()) return

        setSubmittingId(id)
        setFeedbackMsg(null)
        try {
            await responderPregunta(id, res)
            setFeedbackMsg({ id, msg: '¡Respuesta publicada con éxito!', type: 'success' })
            setRespuestasInputs(prev => ({ ...prev, [id]: '' }))
        } catch (error: any) {
            setFeedbackMsg({ id, msg: error.message, type: 'error' })
        }
        setSubmittingId(null)
        setTimeout(() => setFeedbackMsg(null), 3000)
    }

    if (!preguntas || preguntas.length === 0) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-300 p-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">¡Bandeja Limpia!</h3>
                <p className="mt-2 text-gray-500">Ningún alumno ha enviado dudas por el momento. Buen trabajo.</p>
            </div>
        )
    }

    const pendientesFiltradas = preguntasFiltradas.filter(p => !p.respuesta)
    const respondidasFiltradas = preguntasFiltradas.filter(p => p.respuesta)

    return (
        <div className="space-y-6">

            {/* Barra de filtros */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-wrap gap-4 items-center">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                    <Filter className="h-4 w-4" />
                    Filtrar:
                </div>

                {/* Filtro por curso */}
                <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-400" />
                    <select
                        value={filtroCurso}
                        onChange={(e) => setFiltroCurso(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="todos">Todos los cursos</option>
                        {cursoOptions.map(c => (
                            <option key={c.id} value={c.id}>{c.titulo}</option>
                        ))}
                    </select>
                </div>

                {/* Filtro por estado */}
                <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm">
                    {(['todos', 'pendientes', 'respondidas'] as const).map(estado => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`px-4 py-1.5 capitalize transition-colors ${
                                filtroEstado === estado
                                    ? 'bg-blue-600 text-white font-semibold'
                                    : 'bg-white text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            {estado === 'todos' ? 'Todos' : estado === 'pendientes' ? 'Pendientes' : 'Respondidas'}
                        </button>
                    ))}
                </div>

                <span className="ml-auto text-sm text-gray-400">
                    {preguntasFiltradas.length} resultado{preguntasFiltradas.length !== 1 ? 's' : ''}
                </span>
            </div>

            {preguntasFiltradas.length === 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-dashed border-gray-200 p-10 text-center text-gray-500">
                    No hay preguntas que coincidan con los filtros seleccionados.
                </div>
            )}

            {/* Pendientes */}
            {(filtroEstado === 'todos' || filtroEstado === 'pendientes') && pendientesFiltradas.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-amber-500" />
                        Pendientes de Responder ({pendientesFiltradas.length})
                    </h2>
                    {pendientesFiltradas.map((p) => (
                        <div key={p.id} className="bg-white border-l-4 border-amber-400 shadow-sm rounded-r-xl overflow-hidden">
                            <div className="p-6">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                            <BookOpen className="h-4 w-4" />
                                            <span className="font-semibold text-blue-700">{p.curso_titulo}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span>{p.alumno_nombre}</span>
                                            <span>•</span>
                                            <span>{new Date(p.created_at).toLocaleDateString()} a las {new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 self-start">
                                        Requiere Acción
                                    </span>
                                </div>

                                <p className="text-gray-900 text-lg mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    "{p.pregunta}"
                                </p>

                                <div className="space-y-3">
                                    <label className="block text-sm font-semibold text-gray-700">Tu respuesta:</label>
                                    <textarea
                                        rows={3}
                                        value={respuestasInputs[p.id] || ''}
                                        onChange={(e) => setRespuestasInputs(prev => ({ ...prev, [p.id]: e.target.value }))}
                                        placeholder="Escribe la solución a su duda..."
                                        className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-3 border"
                                        disabled={submittingId === p.id}
                                    />
                                    <div className="flex items-center justify-between">
                                        <div>
                                            {feedbackMsg && feedbackMsg.id === p.id && (
                                                <span className={`text-sm font-medium ${feedbackMsg.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {feedbackMsg.msg}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => handleResponder(p.id)}
                                            disabled={submittingId === p.id || !respuestasInputs[p.id]?.trim()}
                                            className="inline-flex items-center px-5 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-colors"
                                        >
                                            {submittingId === p.id ? 'Guardando...' : (
                                                <>
                                                    <Reply className="mr-2 h-4 w-4" />
                                                    Enviar Respuesta
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Respondidas */}
            {(filtroEstado === 'todos' || filtroEstado === 'respondidas') && respondidasFiltradas.length > 0 && (
                <div className="space-y-4 pt-8 border-t border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        Historial de Respuestas ({respondidasFiltradas.length})
                    </h2>
                    <div className="grid gap-4">
                        {respondidasFiltradas.map((p) => (
                            <div key={p.id} className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 opacity-90">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">{p.curso_titulo}</span>
                                    <span className="text-xs text-gray-500">{new Date(p.responded_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2"><span className="font-semibold text-gray-700">{p.alumno_nombre}</span> preguntó:</p>
                                <p className="text-gray-800 italic text-sm mb-4 border-l-2 border-gray-300 pl-3">"{p.pregunta}"</p>
                                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                    <p className="text-sm font-semibold text-green-800 mb-1">Tú respondiste:</p>
                                    <p className="text-sm text-green-900 whitespace-pre-wrap">{p.respuesta}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
