'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, BookOpen, User, CheckCircle, XCircle, AlertTriangle, Eye, EyeOff, Lock, MessageSquare, Award, Clock, Download } from 'lucide-react'

// Helper function to match student's answer in respuestas_detalle even if the question ID has changed
function obtenerDetalleRespuesta(p: any, index: number, respuestasDetalle: any, todasPreguntas: any[]) {
    if (!respuestasDetalle) return undefined;

    // 1. Exact ID match (standard case)
    if (respuestasDetalle[p.id]) {
        return respuestasDetalle[p.id];
    }

    // Fallback cases if question IDs changed
    const keys = Object.keys(respuestasDetalle);

    // 2. If the total number of questions is equal, we can assume exact alignment by index/order
    if (keys.length === todasPreguntas.length) {
        const fallbackKey = keys[index];
        if (fallbackKey && respuestasDetalle[fallbackKey]) {
            return respuestasDetalle[fallbackKey];
        }
    }

    // 3. Heuristic option-text matching for multiple choice questions
    if (p.tipo_pregunta !== 'respuesta_libre') {
        const normalize = (s: string) => s?.trim().toLowerCase() ?? '';
        const opcionesPregunta = [
            normalize(p.opcion_a),
            normalize(p.opcion_b),
            normalize(p.opcion_c),
            normalize(p.opcion_d)
        ].filter(Boolean);

        for (const key of keys) {
            const det = respuestasDetalle[key];
            if (det && det.respuesta_texto) {
                const ansTextNorm = normalize(det.respuesta_texto);
                if (opcionesPregunta.includes(ansTextNorm)) {
                    return det;
                }
            }
        }
    }

    // 4. General fallback by index if nothing else succeeded
    const fallbackKeyGeneral = keys[index];
    if (fallbackKeyGeneral && respuestasDetalle[fallbackKeyGeneral]) {
        return respuestasDetalle[fallbackKeyGeneral];
    }

    return undefined;
}

export default function AlumnoRevisionExamenesPage() {
    const [resultados, setResultados] = useState<any[]>([])
    const [selectedResultado, setSelectedResultado] = useState<any>(null)
    const [preguntas, setPreguntas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // 1. Fetch student's exam results
            const { data: resData, error: resError } = await supabase
                .from('ie_resultados_examenes')
                .select('*, ie_examenes(id, curso_id, modulo_id)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (resError) {
                console.error(resError)
                setLoading(false)
                return
            }

            if (!resData || resData.length === 0) {
                setResultados([])
                setLoading(false)
                return
            }

            // 2. Fetch course titles and visibility settings
            const cursoIds = Array.from(new Set(resData.map(r => r.ie_examenes?.curso_id).filter(Boolean)))
            const { data: cursosData } = await supabase
                .from('ie_cursos')
                .select('id, titulo, mostrar_revision_examen')
                .in('id', cursoIds)

            // 3. Fetch modular titles if any
            const moduloIds = Array.from(new Set(resData.map(r => r.ie_examenes?.modulo_id).filter(Boolean)))
            const { data: modulosData } = moduloIds.length > 0
                ? await supabase
                    .from('ie_curso_modulos')
                    .select('id, titulo, orden')
                    .in('id', moduloIds)
                : { data: [] }

            // 4. Format results
            const resultadosFormateados = resData.map(r => {
                const curso = cursosData?.find(c => c.id === r.ie_examenes?.curso_id)
                const modulo = modulosData?.find(m => m.id === r.ie_examenes?.modulo_id)
                return {
                    ...r,
                    curso: curso || { titulo: 'Curso Desconocido', mostrar_revision_examen: false },
                    examenTitulo: modulo ? `Módulo ${modulo.orden || ''}: ${modulo.titulo}`.trim() : 'Examen final',
                    tipoExamen: modulo ? 'modular' : 'final'
                }
            })

            setResultados(resultadosFormateados)

            // 5. Fetch all questions for presented exams
            const examenIds = resData.map(r => r.examen_id)
            const { data: pregs } = await supabase
                .from('ie_preguntas')
                .select('*')
                .in('examen_id', examenIds)
                .order('orden', { ascending: true })

            setPreguntas(pregs || [])
            setLoading(false)
        }
        fetchData()
    }, [supabase])

    const handleDownload = async () => {
        if (!selectedResultado) return;

        const preguntasResultado = preguntas.filter(p => p.examen_id === selectedResultado.examen_id);
        const fecha = new Date(selectedResultado.created_at).toLocaleString();
        const calificacion = selectedResultado.calificacion;
        const aprobado = selectedResultado.aprobado ? 'APROBADO' : 'REPROBADO';
        const cursoTitulo = selectedResultado.curso?.titulo || 'Curso';
        const examenTitulo = selectedResultado.examenTitulo || 'Examen';

        const element = document.createElement('div');
        element.style.fontFamily = 'sans-serif';
        element.style.padding = '20px';
        element.style.color = '#1a1a1a';

        let content = `
            <div style="margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
                <h1 style="color: #1e3a8a; margin-bottom: 5px;">Revisión de Examen</h1>
                <p style="margin: 3px 0;"><strong>Curso:</strong> ${cursoTitulo}</p>
                <p style="margin: 3px 0;"><strong>Evaluación:</strong> ${examenTitulo}</p>
                <p style="margin: 3px 0;"><strong>Fecha:</strong> ${fecha}</p>
                <p style="margin: 3px 0;"><strong>Calificación:</strong> ${calificacion}% (${aprobado})</p>
            </div>
        `;

        const detalleGral = selectedResultado.respuestas_detalle || {}
        if (detalleGral.retroalimentacion_profesor) {
            content += `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; color: #1e3a8a;">
                    <p style="margin: 0 0 5px 0; font-weight: bold; font-size: 1.05em;">Retroalimentación del Profesor:</p>
                    <p style="margin: 0; font-style: italic; line-height: 1.4;">${detalleGral.retroalimentacion_profesor}</p>
                </div>
            `;
        }

        preguntasResultado.forEach((p, index) => {
            const detalle = obtenerDetalleRespuesta(p, index, selectedResultado.respuestas_detalle, preguntasResultado);
            const isMultipleChoice = p.tipo_pregunta !== 'respuesta_libre';

            let optionsHtml = '';
            if (isMultipleChoice) {
                optionsHtml = '<div style="margin-left: 20px; font-size: 0.9em; color: #374151; margin-bottom: 12px; display: flex; flex-direction: column; gap: 6px;">';
                ['A', 'B', 'C', 'D'].forEach(opc => {
                    const opcKey = `opcion_${opc.toLowerCase()}` as 'opcion_a' | 'opcion_b' | 'opcion_c' | 'opcion_d';
                    const opcTexto = p[opcKey];
                    if (!opcTexto) return;

                    const isSelected = detalle?.respuesta === opc;
                    const isCorrect = p.respuesta_correcta?.trim().toUpperCase() === opc;

                    let bgStyle = 'background-color: #ffffff; border: 1px solid #e5e7eb;';
                    let bullet = `<strong style="color: #9ca3af;">${opc}:</strong>`;

                    if (isSelected && isCorrect) {
                        bgStyle = 'background-color: #ecfdf5; border: 2px solid #34d399; color: #064e3b; font-weight: 500;';
                        bullet = `<strong style="color: #059669;">✓ ${opc}:</strong>`;
                    } else if (isSelected && !isCorrect) {
                        bgStyle = 'background-color: #fff5f5; border: 2px solid #f87171; color: #7f1d1d;';
                        bullet = `<strong style="color: #dc2626;">✗ ${opc}:</strong>`;
                    } else if (!isSelected && isCorrect) {
                        bgStyle = 'background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #064e3b; font-weight: 500;';
                        bullet = `<strong style="color: #059669;">✓ ${opc}:</strong>`;
                    }

                    optionsHtml += `
                        <div style="padding: 8px 12px; margin-bottom: 4px; border-radius: 8px; ${bgStyle}">
                            ${bullet} <span style="margin-left: 6px;">${opcTexto}</span>
                        </div>
                    `;
                });
                optionsHtml += '</div>';
            }

            let respuestaAlumnoHtml = '';
            if (isMultipleChoice) {
                respuestaAlumnoHtml = `
                    <p style="margin: 5px 0;"><strong>Tu respuesta:</strong> ${detalle?.respuesta || 'No respondida'} - ${detalle?.respuesta_texto || ''}</p>
                `;
            } else {
                respuestaAlumnoHtml = `
                    <p style="margin: 5px 0;"><strong>Tu respuesta escrita:</strong></p>
                    <div style="margin-left: 20px; padding: 10px; background: #f3f4f6; border-radius: 6px; font-style: italic; border: 1px solid #e5e7eb; margin-bottom: 8px;">
                        ${detalle?.respuesta_texto || 'No respondida'}
                    </div>
                `;
            }

            let califAbiertaHtml = '';
            if (!isMultipleChoice && detalle?.calificacion_abierta) {
                califAbiertaHtml = `
                    <p style="margin: 5px 0; color: #d97706; font-weight: bold;">
                        Calificación del profesor: <span style="background: #fef3c7; padding: 2px 8px; border-radius: 9999px;">${detalle.calificacion_abierta}</span>
                    </p>
                `;
            }

            content += `
                <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
                    <p><strong>${index + 1}. ${p.pregunta}</strong></p>
                    ${optionsHtml}
                    ${respuestaAlumnoHtml}
                    ${califAbiertaHtml}
                    <p style="color: ${detalle ? (detalle.correcta ? '#059669' : '#dc2626') : '#6b7280'}; font-weight: bold; margin: 5px 0;">
                        ${detalle ? (detalle.correcta ? '✓ Correcta' : '✗ Incorrecta') : '⚠️ No respondida'}
                    </p>
                    <div style="font-style: italic; color: #4b5563; margin-top: 8px; background: #fff; padding: 8px; border-radius: 4px; border: 1px solid #e5e7eb;">
                        <strong>Tu justificación:</strong> ${detalle?.explicacion || 'Sin explicación.'}
                    </div>
                </div>
            `;
        });

        element.innerHTML = content;

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin:       0.5,
                filename:     `Revision_Examen_${cursoTitulo.replace(/\s+/g, '_')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            } as any;

            html2pdf().from(element).set(opt).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            // Fallback download
            const blob = new Blob([element.innerHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Revision_Examen_${cursoTitulo.replace(/\s+/g, '_')}.html`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    const preguntasResultadoSeleccionado = selectedResultado
        ? preguntas.filter(p => p.examen_id === selectedResultado.examen_id)
        : []

    if (loading) return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-zinc-50">
            <div className="text-gray-500 animate-pulse text-lg">Cargando evaluaciones...</div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans p-6 sm:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/mis-cursos"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a mis cursos
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <Award className="h-8 w-8 mr-3 text-blue-600" /> Historial de Evaluaciones
                    </h1>
                    <p className="text-gray-500 mt-2">Consulta tus resultados, repasa tus respuestas y lee las notas de tus profesores.</p>
                </div>

                {resultados.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center max-w-lg mx-auto mt-12">
                        <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-gray-900">Sin exámenes presentados</h3>
                        <p className="text-gray-500 mt-2 leading-relaxed">Aún no has realizado ninguna evaluación en tus cursos activos. Cuando presentes un examen final o modular, tus resultados aparecerán en esta sección.</p>
                        <Link href="/mis-cursos" className="mt-6 inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors">
                            Ir a estudiar
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sidebar: Resultados List */}
                        <div className="lg:col-span-1 space-y-4">
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock className="h-4.5 w-4.5 text-zinc-500" /> Mis Intentos
                                </h2>
                                <div className="space-y-3">
                                    {resultados.map((r: any) => {
                                        const revisionHabilitada = r.curso?.mostrar_revision_examen || false;
                                        const isSelected = selectedResultado?.id === r.id;

                                        return (
                                            <div
                                                key={r.id}
                                                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                                                    isSelected 
                                                        ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-100' 
                                                        : 'bg-white border-gray-100 hover:bg-gray-50'
                                                }`}
                                            >
                                                <div className="flex justify-between items-start mb-2 gap-2">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 text-sm line-clamp-1">{r.curso?.titulo}</h3>
                                                        <p className="text-xs text-blue-700 font-semibold mt-0.5">{r.examenTitulo}</p>
                                                    </div>
                                                    <span className={`text-xs font-black px-2 py-0.5 rounded-full whitespace-nowrap ${
                                                        r.aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                    }`}>
                                                        {r.calificacion}%
                                                    </span>
                                                </div>

                                                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                                                    <span className="text-[11px] text-gray-400 font-medium">
                                                        {new Date(r.created_at).toLocaleDateString()}
                                                    </span>

                                                    {revisionHabilitada ? (
                                                        <button
                                                            onClick={() => setSelectedResultado(r)}
                                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition ${
                                                                isSelected 
                                                                    ? 'bg-blue-600 text-white shadow-sm' 
                                                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                                            }`}
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                            {isSelected ? 'Viendo' : 'Ver Detalles'}
                                                        </button>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100" title="Revisión desactivada por el docente">
                                                            <Lock className="h-3 w-3" />
                                                            Cerrado
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Main Content: Detalle del Examen */}
                        <div className="lg:col-span-2">
                            {selectedResultado ? (
                                <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in duration-300">
                                    <div className="border-b pb-4 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                        <div>
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 mb-2 uppercase tracking-wide">
                                                {selectedResultado.tipoExamen === 'final' ? 'Examen Final' : 'Examen Modular'}
                                            </span>
                                            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
                                                {selectedResultado.curso?.titulo}
                                            </h2>
                                            <p className="text-sm font-semibold text-zinc-500 mt-1">
                                                {selectedResultado.examenTitulo}
                                            </p>
                                            <div className="flex flex-wrap items-center gap-3 mt-3">
                                                <p className="text-xs text-gray-400">
                                                    Fecha: {new Date(selectedResultado.created_at).toLocaleString()}
                                                </p>
                                                <button
                                                    onClick={handleDownload}
                                                    className="inline-flex items-center gap-1 px-3 py-1 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs font-bold rounded-lg transition"
                                                >
                                                    <Download className="h-3.5 w-3.5" /> Descargar PDF
                                                </button>
                                            </div>
                                        </div>
                                        <div className={`text-center px-5 py-2.5 rounded-xl flex-shrink-0 w-full sm:w-auto ${
                                            selectedResultado.aprobado ? 'bg-green-50 text-green-700 border border-green-150' : 'bg-red-50 text-red-700 border border-red-150'
                                        }`}>
                                            <p className="text-4xl font-black">{selectedResultado.calificacion}%</p>
                                            <p className="text-xs font-bold uppercase tracking-wider mt-0.5">{selectedResultado.aprobado ? 'Aprobado' : 'Reprobado'}</p>
                                        </div>
                                    </div>

                                    {/* Retroalimentación del Profesor */}
                                    {selectedResultado.respuestas_detalle?.retroalimentacion_profesor && (
                                        <div className="mb-8 p-5 bg-gradient-to-r from-blue-50/70 to-blue-50/30 border border-blue-200 rounded-2xl flex items-start gap-3.5 shadow-sm">
                                            <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-sm text-blue-950">Nota de retroalimentación de tu profesor:</p>
                                                <p className="text-sm text-blue-900 mt-1 italic whitespace-pre-wrap leading-relaxed">
                                                    "{selectedResultado.respuestas_detalle.retroalimentacion_profesor}"
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {(!selectedResultado.respuestas_detalle || Object.keys(selectedResultado.respuestas_detalle).length === 0) && (
                                        <div className="mb-6 p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-sm text-amber-900">Desglose Histórico No Disponible</p>
                                                <p className="text-xs text-amber-850 mt-1 leading-relaxed">
                                                    Este examen se presentó antes de las últimas actualizaciones del sistema. La calificación oficial de <strong>{selectedResultado.calificacion}%</strong> está registrada en tu expediente, pero el desglose pregunta por pregunta no está disponible en la base de datos histórica.
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        {preguntasResultadoSeleccionado.map((p, index) => {
                                            const detalle = obtenerDetalleRespuesta(p, index, selectedResultado.respuestas_detalle, preguntasResultadoSeleccionado);
                                            return (
                                                <div key={p.id} className="bg-gray-50 rounded-xl p-5 border border-zinc-150 relative">
                                                    <div className="flex justify-between items-start gap-4 mb-3">
                                                        <h3 className="font-bold text-gray-900 text-sm sm:text-base pr-20">
                                                            <span className="text-blue-600 mr-1">{index + 1}.</span> {p.pregunta}
                                                        </h3>
                                                        <div className="absolute top-5 right-5">
                                                            {detalle ? (
                                                                detalle.correcta ? (
                                                                    <span className="flex items-center text-green-600 text-xs font-black gap-1 bg-green-50 px-3 py-1 rounded-full border border-green-150 shadow-sm">
                                                                        <CheckCircle className="h-3.5 w-3.5" /> Correcta
                                                                    </span>
                                                                ) : (
                                                                    <span className="flex items-center text-red-600 text-xs font-black gap-1 bg-red-50 px-3 py-1 rounded-full border border-red-150 shadow-sm">
                                                                        <XCircle className="h-3.5 w-3.5" /> Incorrecta
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span className="flex items-center text-gray-500 text-xs font-black gap-1 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                                                                    <AlertTriangle className="h-3.5 w-3.5" /> Sin Respuesta
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {p.tipo_pregunta !== 'respuesta_libre' ? (
                                                        <div className="text-sm space-y-2 mb-3 mt-4">
                                                            {['A', 'B', 'C', 'D'].map(opc => {
                                                                const opcKey = `opcion_${opc.toLowerCase()}` as 'opcion_a' | 'opcion_b' | 'opcion_c' | 'opcion_d';
                                                                const opcTexto = p[opcKey];
                                                                if (!opcTexto) return null;

                                                                const isSelected = detalle?.respuesta === opc;
                                                                const isCorrect = p.respuesta_correcta?.trim().toUpperCase() === opc;

                                                                let bgClass = 'bg-white border border-gray-200 text-gray-700';
                                                                let badge = null;
                                                                let viñeta = <span className="font-bold text-gray-400">{opc}:</span>;

                                                                if (isSelected && isCorrect) {
                                                                    bgClass = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-950 font-medium shadow-sm';
                                                                    viñeta = <span className="font-extrabold text-emerald-600 flex items-center gap-1">✓ {opc}:</span>;
                                                                    badge = (
                                                                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                                                                            Tu respuesta (Correcta)
                                                                        </span>
                                                                    );
                                                                } else if (isSelected && !isCorrect) {
                                                                    bgClass = 'bg-rose-50 border-2 border-rose-400 text-rose-950 shadow-sm';
                                                                    viñeta = <span className="font-extrabold text-rose-600 flex items-center gap-1">✗ {opc}:</span>;
                                                                    badge = (
                                                                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
                                                                            Tu respuesta (Incorrecta)
                                                                        </span>
                                                                    );
                                                                } else if (!isSelected && isCorrect) {
                                                                    bgClass = 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium';
                                                                    viñeta = <span className="font-extrabold text-emerald-600 flex items-center gap-1">✓ {opc}:</span>;
                                                                    badge = (
                                                                        <span className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-150">
                                                                            Respuesta Correcta
                                                                        </span>
                                                                    );
                                                                }

                                                                return (
                                                                    <div key={opc} className={`p-3 rounded-xl flex items-center justify-between transition-all ${bgClass}`}>
                                                                        <div className="flex items-center gap-2">
                                                                            {viñeta}
                                                                            <span>{opcTexto}</span>
                                                                        </div>
                                                                        <div>{badge}</div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white p-4 rounded-xl border border-gray-200 mb-3 mt-4 space-y-2">
                                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tu respuesta escrita:</p>
                                                            <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-gray-900 leading-relaxed whitespace-pre-wrap font-medium">
                                                                {detalle?.respuesta_texto || 'No respondida'}
                                                            </div>

                                                            {detalle?.calificacion_abierta && (
                                                                <div className="mt-3 flex items-center gap-2 pt-2 border-t border-dashed border-gray-100">
                                                                    <span className="text-xs font-bold text-gray-500">Evaluación de respuesta abierta:</span>
                                                                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                                                                        detalle.calificacion_abierta === 'Excelente' 
                                                                            ? 'bg-green-100 text-green-700 border-green-200' 
                                                                            : detalle.calificacion_abierta === 'Buena' 
                                                                                ? 'bg-blue-100 text-blue-700 border-blue-200' 
                                                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                                                    }`}>
                                                                        {detalle.calificacion_abierta}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    <div className="bg-white p-3.5 rounded-xl border border-gray-200 mt-3.5 shadow-sm">
                                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Tu justificación técnica:</p>
                                                        <p className="text-xs sm:text-sm text-gray-800 italic leading-relaxed">
                                                            {detalle?.explicacion || 'No proporcionaste explicación.'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-white p-16 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                                    <BookOpen className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                                    <h3 className="text-xl font-bold text-gray-900">Selecciona una evaluación</h3>
                                    <p className="mt-1 max-w-sm mx-auto text-sm leading-relaxed">Elige uno de tus intentos de evaluación en la lista de la izquierda para ver el desglose de preguntas y comentarios detallados.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
