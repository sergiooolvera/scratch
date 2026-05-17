'use client'

import { useState, useEffect, useRef } from 'react'
import { submitExamen } from './actions'
import { CheckCircle, AlertTriangle, ArrowLeft, Clock, Shield } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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
    cursoTitulo,
    tiempoLimite,
    seguridadAumentada,
    maxCambiosPantalla = 3
}: {
    cursoId: string,
    preguntas: PreguntaFormateada[],
    cursoTitulo: string,
    tiempoLimite?: number | null,
    seguridadAumentada?: boolean,
    maxCambiosPantalla?: number
}) {
    const router = useRouter()
    const [respuestas, setRespuestas] = useState<Record<string, string>>({})
    const [loading, setLoading] = useState(false)
    const [resultado, setResultado] = useState<{
        success: boolean;
        calificacion?: number;
        aprobado?: boolean;
        minAprobacion?: number;
        error?: string;
    } | null>(null)

    const [tiempoRestante, setTiempoRestante] = useState<number | null>(null)
    const [examenIniciado, setExamenIniciado] = useState(false)
    const [cambiosRealizados, setCambiosRealizados] = useState(0)
    const [explicaciones, setExplicaciones] = useState<Record<string, string>>({})
    const [mostrarBloqueo, setMostrarBloqueo] = useState(false)
    const lastBloqueoTime = useRef(0)
    const enviandoRef = useRef(false)

    const handleSelectOption = (preguntaId: string, opcionTexto: string) => {
        setRespuestas(prev => ({ ...prev, [preguntaId]: opcionTexto }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (Object.keys(respuestas).length < preguntas.length) {
            alert('Por favor responde todas las preguntas antes de enviar.');
            return;
        }

        await finalizarExamen();
    }

    const handleSubmitAutomated = async () => {
        await finalizarExamen();
    }

    const finalizarExamen = async () => {
        setLoading(true)
        const res = await submitExamen(cursoId, respuestas, explicaciones) as any
        setResultado(res)
        setLoading(false)
        router.refresh()
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    }

    const handleIniciarExamen = () => {
        setExamenIniciado(true);
        if (tiempoLimite) {
            setTiempoRestante(tiempoLimite * 60);
        }
        if (seguridadAumentada) {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {
                    alert('Por favor activa la pantalla completa manualmente para continuar.');
                });
            }
        }
    }

    useEffect(() => {
        if (!examenIniciado) return;

        let interval: NodeJS.Timeout | null = null;
        if (tiempoRestante !== null && tiempoRestante > 0) {
            interval = setInterval(() => {
                setTiempoRestante(prev => {
                    if (prev !== null && prev <= 1) {
                        clearInterval(interval!);
                        alert('¡El tiempo se ha agotado! El examen se enviará automáticamente.');
                        handleSubmitAutomated();
                        return 0;
                    }
                    return prev !== null ? prev - 1 : null;
                });
            }, 1000);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [examenIniciado]);

    const activarBloqueo = () => {
        const now = Date.now();
        if (now - lastBloqueoTime.current < 1000) {
            return;
        }
        lastBloqueoTime.current = now;
        
        setMostrarBloqueo(true);
        setCambiosRealizados(prev => prev + 1);
    }

    const regresarAPantallaCompleta = () => {
        document.documentElement.requestFullscreen().then(() => {
            setMostrarBloqueo(false);
        }).catch(() => {
            alert('No se pudo entrar en pantalla completa. Inténtalo de nuevo.');
        });
    }

    useEffect(() => {
        if (!examenIniciado || !seguridadAumentada) return;

        const handleVisibilityChange = () => {
            if (document.hidden) {
                activarBloqueo();
            }
        };

        const handleFullscreenChange = () => {
            if (!document.fullscreenElement) {
                activarBloqueo();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [examenIniciado, seguridadAumentada, maxCambiosPantalla]);

    // Effect to handle automatic submission when limit is reached
    useEffect(() => {
        if (examenIniciado && seguridadAumentada && cambiosRealizados >= maxCambiosPantalla) {
            if (enviandoRef.current) return;
            enviandoRef.current = true;
            
            alert('Has superado el límite de cambios de pantalla o pantalla completa. El examen se enviará automáticamente.');
            handleSubmitAutomated();
        }
    }, [cambiosRealizados, maxCambiosPantalla, examenIniciado, seguridadAumentada]);

    if ((seguridadAumentada || tiempoLimite) && !examenIniciado) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 text-center">
                    <Shield className="mx-auto h-12 w-12 text-blue-600 mb-4" />
                    <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Preparación para el Examen</h2>
                    <p className="text-gray-600 mb-6">{cursoTitulo}</p>
                    
                    <div className="space-y-4 mb-8">
                        {tiempoLimite && (
                            <div className="flex items-center justify-center gap-2 text-gray-700">
                                <Clock className="h-5 w-5 text-gray-500" />
                                <span>Tiempo límite: <strong>{tiempoLimite} minutos</strong></span>
                            </div>
                        )}
                        {seguridadAumentada && (
                            <div className="bg-orange-50 border border-orange-200 p-4 rounded-xl text-orange-800 text-sm">
                                <p className="font-bold mb-1">🔒 Seguridad Aumentada Activada</p>
                                <p>
                                    Este examen requiere pantalla completa. Si sales de ella o cambias de pestaña más de <strong>{maxCambiosPantalla} veces</strong>, el examen se enviará automáticamente.
                                </p>
                            </div>
                        )}
                    </div>
                    
                    <button 
                        onClick={handleIniciarExamen}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                        Comenzar Examen
                    </button>
                    <div className="mt-4">
                        <Link href={`/cursos/${cursoId}/contenido`} className="text-sm text-gray-500 hover:text-gray-700">
                            Volver al curso
                        </Link>
                    </div>
                </div>
            </div>
        )
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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
            <Link
                href={`/cursos/${cursoId}/contenido`}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
            >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Regresar al curso y abandonar examen
            </Link>

            <div className="bg-white shadow-xl rounded-2xl overflow-hidden border border-gray-100 pt-8 pb-12 px-8 sm:px-12">
                <div className="mb-8 border-b border-gray-100 pb-6 text-center relative">
                    {tiempoRestante !== null && (
                        <div className="absolute top-0 right-0 bg-red-50 border border-red-200 text-red-700 px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.floor(tiempoRestante / 60)}:{(tiempoRestante % 60).toString().padStart(2, '0')}
                        </div>
                    )}
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

                            <div className="mt-4 pl-2 sm:pl-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Explica tu respuesta (Opcional):</label>
                                <textarea 
                                    value={explicaciones[p.id] || ''} 
                                    onChange={(e) => setExplicaciones(prev => ({ ...prev, [p.id]: e.target.value }))} 
                                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" 
                                    rows={2}
                                    placeholder="Escribe aquí tu justificación..."
                                />
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
                {mostrarBloqueo && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-50 flex flex-col items-center justify-center text-white p-6">
                        <Shield className="h-16 w-16 text-orange-500 mb-4" />
                        <h2 className="text-3xl font-bold mb-2">Pantalla Completa Requerida</h2>
                        <p className="text-gray-300 mb-6 text-center max-w-md">
                            Has salido del modo de pantalla completa o has cambiado de ventana. 
                            Para continuar con el examen, debes regresar a pantalla completa.
                            <br/>
                            <span className="text-orange-400 font-bold">Intento {cambiosRealizados} de {maxCambiosPantalla}</span>
                        </p>
                        <button
                            onClick={regresarAPantallaCompleta}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-bold transition-colors"
                        >
                            Regresar a Pantalla Completa
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
