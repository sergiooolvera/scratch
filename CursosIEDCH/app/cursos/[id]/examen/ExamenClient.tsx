'use client'

import { useState } from 'react'
import { submitExamen } from './actions'
import { CheckCircle, AlertTriangle, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

type PreguntaFormateada = {
    id: string;
    pregunta: string;
    opcion_a: string;
    opcion_b: string;
    opcion_c: string;
    opcion_d: string;
}

export default function ExamenClient({
    cursoId,
    preguntas,
    cursoTitulo
}: {
    cursoId: string,
    preguntas: PreguntaFormateada[],
    cursoTitulo: string
}) {
    const [respuestas, setRespuestas] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [resultado, setResultado] = useState<{
        success: boolean;
        calificacion?: number;
        aprobado?: boolean;
        minAprobacion?: number;
        error?: string;
    } | null>(null)

    const handleSelectOption = (preguntaId: string, opcionTexto: string) => {
        setRespuestas(prev => ({ ...prev, [preguntaId]: opcionTexto }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Ensure all questions answered
        if (Object.keys(respuestas).length < preguntas.length) {
            alert('Por favor responde todas las preguntas antes de enviar.');
            return;
        }

        setLoading(true)
        const res = await submitExamen(cursoId, respuestas) as any
        setResultado(res)
        setLoading(false)
    }

    if (resultado?.success) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 text-center">
                    {resultado.aprobado ? (
                        <>
                            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">¡Felicidades, Aprobaste!</h2>
                            <p className="text-lg text-gray-600 mb-6">
                                Has completado el examen del curso <strong>{cursoTitulo}</strong>.
                            </p>
                            <div className="bg-gray-50 rounded-xl p-6 mb-8 inline-block shadow-inner">
                                <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-1">Calificación Obtenida</p>
                                <p className="text-5xl font-black text-green-600">{resultado.calificacion}%</p>
                                <p className="text-xs text-gray-400 mt-2">Puntuación mínima: {resultado.minAprobacion}%</p>
                            </div>
                            <div>
                                <Link href={`/cursos/${cursoId}/contenido`} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors">
                                    <ArrowLeft className="mr-2 h-5 w-5" /> Volver al Curso
                                </Link>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                                <AlertTriangle className="h-8 w-8 text-red-600" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Puntuación insuficiente</h2>
                            <p className="text-lg text-gray-600 mb-6">
                                No alcanzaste el mínimo aprobatorio requerido para este curso.
                            </p>
                            <div className="bg-gray-50 rounded-xl p-6 mb-8 inline-block shadow-inner border border-red-100">
                                <p className="text-sm text-gray-500 uppercase tracking-widest font-semibold mb-1">Calificación Obtenida</p>
                                <p className="text-5xl font-black text-red-500">{resultado.calificacion}%</p>
                                <p className="text-xs text-gray-400 mt-2">Puntuación mínima: {resultado.minAprobacion}%</p>
                            </div>
                            <div>
                                <button onClick={() => { setResultado(null); setRespuestas({}); }} className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                                    Reintentar Examen
                                </button>
                                <Link href={`/cursos/${cursoId}/contenido`} className="ml-4 inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800">
                                    Cancelar y Volver
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Link
                href={`/cursos/${cursoId}/contenido`}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Regresar al curso y abandonar examen
            </Link>

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 pt-8 pb-12 px-8 sm:px-12">
                <div className="mb-8 border-b border-gray-100 pb-6 text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Examen Final
                    </h1>
                    <p className="text-gray-500 text-lg">
                        {cursoTitulo}
                    </p>
                    <p className="text-sm text-blue-600 font-semibold mt-4">
                        Consta de {preguntas.length} preguntas.
                    </p>
                </div>

                {resultado?.error && (
                    <div className="mb-8 bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
                        <p className="text-sm font-medium flex items-center">
                            <AlertTriangle className="mr-2 h-5 w-5" /> {resultado.error}
                        </p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-10">
                    {preguntas.map((p, index) => (
                        <div key={p.id} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <h3 className="font-bold text-lg text-gray-900 mb-5">
                                <span className="text-blue-600 font-black mr-2">{index + 1}.</span> {p.pregunta}
                            </h3>

                            <div className="space-y-3 pl-2 sm:pl-6">
                                {[p.opcion_a, p.opcion_b, p.opcion_c, p.opcion_d].map((opcion, i) => (
                                    <label key={i} className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${respuestas[p.id] === opcion ? 'bg-blue-50 border-blue-400 ring-1 ring-blue-400' : 'bg-white border-gray-200 hover:bg-gray-100'}`}>
                                        <input
                                            type="radio"
                                            name={`pregunta_${p.id}`}
                                            value={opcion}
                                            checked={respuestas[p.id] === opcion}
                                            onChange={() => handleSelectOption(p.id, opcion)}
                                            className="mt-subtitle h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 flex-shrink-0"
                                        />
                                        <span className="ml-3 block text-sm font-medium text-gray-800 break-words">
                                            {opcion}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}

                    <div className="pt-8 border-t border-gray-200 flex justify-center">
                        <button
                            type="submit"
                            disabled={loading || Object.keys(respuestas).length < preguntas.length}
                            className="inline-flex justify-center items-center px-8 py-4 border border-transparent text-lg font-bold rounded-full shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform active:scale-95 w-full sm:w-auto"
                        >
                            {loading ? 'Calculando resultado...' : 'Enviar Respuestas y Finalizar'}
                        </button>
                    </div>
                    {Object.keys(respuestas).length < preguntas.length && (
                        <p className="text-center text-sm text-gray-500 mt-2">
                            Aún faltan {preguntas.length - Object.keys(respuestas).length} preguntas por responder.
                        </p>
                    )}
                </form>
            </div>
        </div>
    )
}
