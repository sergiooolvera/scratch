'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, MessageSquare, Clock, User, CheckCircle2 } from 'lucide-react'

type Pregunta = {
    id: string
    curso_id: string
    user_id: string
    pregunta: string
    respuesta: string | null
    created_at: string
    responded_at: string | null
}

export default function CourseQA({ cursoId, userId, userName }: { cursoId: string, userId: string, userName: string }) {
    const supabase = createClient()
    const [preguntas, setPreguntas] = useState<Pregunta[]>([])
    const [nuevaPregunta, setNuevaPregunta] = useState('')
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchPreguntas()
    }, [cursoId])

    const fetchPreguntas = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('ie_preguntas_respuestas')
            .select('*')
            .eq('curso_id', cursoId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching questions:', JSON.stringify(error, null, 2), error.message)
        } else {
            setPreguntas(data || [])
        }
        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!nuevaPregunta.trim()) return

        setSubmitting(true)
        const { data, error } = await supabase
            .from('ie_preguntas_respuestas')
            .insert([
                {
                    curso_id: cursoId,
                    user_id: userId,
                    pregunta: nuevaPregunta.trim(),
                }
            ])
            .select()
            .single()

        if (error) {
            console.error('Error sending question:', JSON.stringify(error, null, 2), error.message)
            alert('Error en la base de datos: Asegúrate de haber ejecutado el script SQL en Supabase para crear la tabla ie_preguntas_respuestas.')
        } else if (data) {
            setPreguntas([data, ...preguntas])
            setNuevaPregunta('')
        }
        setSubmitting(false)
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mt-8 overflow-hidden">
            <div className="bg-blue-50/50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Dudas y Respuestas del Instructor</h3>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                {/* Panel Izquierdo: Formulario e Historial (Ocupa 2/3) */}
                <div className="p-6 lg:col-span-2">
                    {/* Formulario para enviar pregunta */}
                    <form onSubmit={handleSubmit} className="mb-8">
                        <label htmlFor="pregunta" className="block text-sm font-medium text-gray-700 mb-2">
                            1. Antes de preguntar, revisa las dudas frecuentes a la derecha. Si no encuentras tu respuesta, ¡escríbela!
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                id="pregunta"
                                value={nuevaPregunta}
                                onChange={(e) => setNuevaPregunta(e.target.value)}
                                placeholder="Escribe tu pregunta al profesor aquí..."
                                disabled={submitting}
                                className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-4 py-3 bg-gray-50 disabled:opacity-50 border"
                            />
                            <button
                                type="submit"
                                disabled={!nuevaPregunta.trim() || submitting}
                                className="inline-flex items-center justify-center px-6 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                            >
                                {submitting ? (
                                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <span>Enviar</span>
                                        <Send className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </button>
                        </div>
                    </form>

                    {/* Lista de preguntas */}
                    <div className="space-y-6">
                        <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Tus consultas enviadas</h4>
                        
                        {loading ? (
                            <div className="animate-pulse flex space-x-4">
                                <div className="flex-1 space-y-4 py-1">
                                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 rounded"></div>
                                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                                    </div>
                                </div>
                            </div>
                        ) : preguntas.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                Aún no has hecho ninguna pregunta en este curso.
                            </div>
                        ) : (
                            preguntas.map((p) => (
                                <div key={p.id} className="bg-gray-50 rounded-lg p-5 border border-gray-100">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-2 mb-2 text-sm text-gray-500">
                                            <User className="h-4 w-4" />
                                            <span className="font-medium">{userName}</span>
                                            <span className="mx-1">•</span>
                                            <Clock className="h-4 w-4" />
                                            <span>{new Date(p.created_at).toLocaleDateString()}</span>
                                        </div>
                                        {!p.respuesta && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                Pendiente de respuesta
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-gray-900 font-medium text-base mb-4">{p.pregunta}</p>

                                    {p.respuesta && (
                                        <div className="mt-4 bg-white p-4 rounded-md border border-blue-100 shadow-sm relative before:absolute before:inset-y-0 before:left-0 before:w-1 before:bg-blue-500 before:rounded-l-md">
                                            <div className="flex items-center gap-2 mb-2">
                                                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                                                <span className="text-sm font-semibold text-blue-900">Respuesta del Instructor</span>
                                                <span className="text-xs text-gray-400 ml-auto">
                                                    {p.responded_at ? new Date(p.responded_at).toLocaleDateString() : ''}
                                                </span>
                                            </div>
                                            <p className="text-gray-700 text-sm whitespace-pre-wrap">{p.respuesta}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Panel Derecho: Preguntas Frecuentes (Ocupa 1/3) */}
                <div className="p-6 bg-slate-50/50">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center">
                        <MessageSquare className="h-4 w-4 mr-2 text-gray-500" />
                        Preguntas Frecuentes
                    </h4>
                    
                    <div className="space-y-4">
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <p className="font-semibold text-gray-800 text-sm mb-1">¿Cuándo obtengo mi constancia?</p>
                            <p className="text-xs text-gray-600">Al terminar de ver todos los videos y aprobar el examen final (si aplica) con la calificación mínima. Aparecerá en tu lista de "Mis Cursos".</p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <p className="font-semibold text-gray-800 text-sm mb-1">¿En cuánto tiempo responde el profesor?</p>
                            <p className="text-xs text-gray-600">Considera de 24 a 48 horas hábiles para recibir una respuesta, que aparecerá notificada aquí mismo.</p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <p className="font-semibold text-gray-800 text-sm mb-1">El video no reproduce / Se traba</p>
                            <p className="text-xs text-gray-600">Intenta bajar la calidad desde el reproductor. La plataforma se adapta a tu ancho de banda, pero requerirá una red estable.</p>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            <p className="font-semibold text-gray-800 text-sm mb-1">¿Los cursos caducan?</p>
                            <p className="text-xs text-gray-600">No, una vez adquirido, tendrás acceso de por vida a tu curso y al PDF de constancia.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
