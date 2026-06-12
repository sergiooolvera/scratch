'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, BookOpen, User, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react'
import { getResultadosExamen, guardarRevisionExamenProfesor } from './actions'

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

export default function RevisionExamenPage() {
    const [cursos, setCursos] = useState<any[]>([])
    const [selectedCurso, setSelectedCurso] = useState<string>('')
    const [resultados, setResultados] = useState<any[]>([])
    const [examenes, setExamenes] = useState<any[]>([])
    const [selectedResultado, setSelectedResultado] = useState<any>(null)
    const [preguntas, setPreguntas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [retroalimentacionGeneral, setRetroalimentacionGeneral] = useState('')
    const [calificacionesPreguntas, setCalificacionesPreguntas] = useState<Record<string, string>>({})
    const [guardandoRevision, setGuardandoRevision] = useState(false)
    const [mensajeRevision, setMensajeRevision] = useState('')
    const supabase = createClient()

    useEffect(() => {
        const fetchCursos = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch courses by this professor. Some courses only have modular exams,
            // so filtering by requiere_examen would hide them from this review screen.
            const { data } = await supabase
                .from('ie_cursos')
                .select('id, titulo')
                .eq('creado_por', user.id)
                .order('created_at', { ascending: false })

            if (data) setCursos(data)
            setLoading(false)
        }
        fetchCursos()
    }, [supabase])

    useEffect(() => {
        const fetchResultados = async () => {
            if (!selectedCurso) {
                setResultados([])
                setExamenes([])
                setPreguntas([])
                return
            }

            setLoading(true)
            // Fetch exam for the selected course
            const { success, data, preguntas: preguntasExamen, examenes: examenesCurso, error } = await getResultadosExamen(selectedCurso);

            if (success && data) {
                setResultados(data);
                setExamenes(examenesCurso || [])
                setPreguntas(preguntasExamen || [])
            } else if (error) {
                setResultados([]);
                setExamenes([]);
                setPreguntas([]);
            }
            setLoading(false)
        }
        fetchResultados()
    }, [selectedCurso, supabase])

    useEffect(() => {
        if (selectedResultado) {
            const detalle = selectedResultado.respuestas_detalle || {}
            setRetroalimentacionGeneral(detalle.retroalimentacion_profesor || '')
            
            const initialCalifs: Record<string, string> = {}
            preguntas.forEach(p => {
                if (p.tipo_pregunta === 'respuesta_libre') {
                    const qDet = obtenerDetalleRespuesta(p, 0, detalle, preguntas)
                    initialCalifs[p.id] = qDet?.calificacion_abierta || ''
                }
            })
            setCalificacionesPreguntas(initialCalifs)
            setMensajeRevision('')
        } else {
            setRetroalimentacionGeneral('')
            setCalificacionesPreguntas({})
            setMensajeRevision('')
        }
    }, [selectedResultado, preguntas])

    const handleGuardarRevision = async () => {
        if (!selectedResultado) return
        setGuardandoRevision(true)
        setMensajeRevision('')
        
        try {
            const res = await guardarRevisionExamenProfesor(
                selectedResultado.id,
                retroalimentacionGeneral,
                calificacionesPreguntas
            )
            
            if (res.success) {
                setMensajeRevision('¡Revisión guardada con éxito!')
                
                const updatedDetalle = {
                    ...(selectedResultado.respuestas_detalle || {}),
                    retroalimentacion_profesor: retroalimentacionGeneral
                }
                Object.entries(calificacionesPreguntas).forEach(([pregId, calif]) => {
                    if (updatedDetalle[pregId]) {
                        updatedDetalle[pregId].calificacion_abierta = calif
                    } else {
                        updatedDetalle[pregId] = {
                            respuesta: '',
                            respuesta_texto: '',
                            explicacion: '',
                            correcta: true,
                            calificacion_abierta: calif
                        }
                    }
                })
                
                setSelectedResultado((prev: any) => ({
                    ...prev,
                    respuestas_detalle: updatedDetalle
                }))

                setResultados((prev: any[]) => prev.map(r => r.id === selectedResultado.id ? { ...r, respuestas_detalle: updatedDetalle } : r))
            } else {
                setMensajeRevision('Error: ' + res.error)
            }
        } catch (err: any) {
            setMensajeRevision('Error al guardar: ' + err.message)
        } finally {
            setGuardandoRevision(false)
        }
    }

    const handleDownload = async () => {
        if (!selectedResultado) return;

        const preguntasResultado = preguntas.filter(p => p.examen_id === selectedResultado.examen_id);
        const alumno = `${selectedResultado.ie_profiles?.nombre || ''} ${selectedResultado.ie_profiles?.apellido_paterno || ''} ${selectedResultado.ie_profiles?.apellido_materno || ''}`.replace(/\s+/g, ' ').trim() || 'Alumno';
        const fecha = new Date(selectedResultado.created_at).toLocaleString();
        const calificacion = selectedResultado.calificacion;
        const aprobado = selectedResultado.aprobado ? 'APROBADO' : 'REPROBADO';
        const examenTitulo = selectedResultado.examen?.titulo || 'Examen';

        // Create a temporary element to hold the HTML
        const element = document.createElement('div');
        element.style.fontFamily = 'sans-serif';
        element.style.padding = '20px';
        element.style.color = '#1a1a1a';

        const tieneDetalles = selectedResultado.respuestas_detalle && Object.keys(selectedResultado.respuestas_detalle).length > 0;

        let content = `
            <div style="margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
                <h1 style="color: #1e3a8a;">Reporte de Examen</h1>
                <p><strong>Examen:</strong> ${examenTitulo}</p>
                <p><strong>Alumno:</strong> ${alumno}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Calificación:</strong> ${calificacion}% (${aprobado})</p>
            </div>
        `;

        if (!tieneDetalles) {
            content += `
                <div style="margin-bottom: 20px; padding: 15px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; color: #78350f; font-family: sans-serif;">
                    <p style="margin: 0; font-weight: bold; font-size: 1.05em; color: #92400e;">Registro de Examen Histórico (Sin Desglose)</p>
                    <p style="margin: 5px 0 0 0; font-size: 0.85em; line-height: 1.4; color: #b45309;">
                        Este examen fue presentado el <strong>${new Date(selectedResultado.created_at).toLocaleDateString()}</strong>, antes de la actualización técnica que almacena el desglose detallado de respuestas en la base de datos.
                        La calificación de <strong>${calificacion}%</strong> está registrada formalmente en el expediente del alumno, pero las respuestas específicas no están disponibles en el historial del sistema.
                    </p>
                </div>
            `;
        }

        content += `<div>`;

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
                    let badge = '';

                    if (isSelected && isCorrect) {
                        bgStyle = 'background-color: #ecfdf5; border: 2px solid #34d399; color: #064e3b; font-weight: 500;';
                        bullet = `<strong style="color: #059669;">✓ ${opc}:</strong>`;
                        badge = '<span style="font-size: 0.8em; font-weight: bold; text-transform: uppercase; background-color: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; padding: 2px 6px; border-radius: 9999px; margin-left: 8px;">Respuesta del Alumno (Correcta)</span>';
                    } else if (isSelected && !isCorrect) {
                        bgStyle = 'background-color: #fff5f5; border: 2px solid #f87171; color: #7f1d1d;';
                        bullet = `<strong style="color: #dc2626;">✗ ${opc}:</strong>`;
                        badge = '<span style="font-size: 0.8em; font-weight: bold; text-transform: uppercase; background-color: #fee2e2; color: #991b1b; border: 1px solid #fca5a5; padding: 2px 6px; border-radius: 9999px; margin-left: 8px;">Respuesta del Alumno (Incorrecta)</span>';
                    } else if (!isSelected && isCorrect) {
                        bgStyle = 'background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #064e3b; font-weight: 500;';
                        bullet = `<strong style="color: #059669;">✓ ${opc}:</strong>`;
                        badge = '<span style="font-size: 0.8em; font-weight: bold; text-transform: uppercase; background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 2px 6px; border-radius: 9999px; margin-left: 8px;">Respuesta Correcta</span>';
                    }

                    optionsHtml += `
                        <div style="padding: 8px 12px; margin-bottom: 4px; border-radius: 8px; ${bgStyle} display: flex; align-items: center; justify-content: space-between;">
                            <div>
                                ${bullet} <span style="margin-left: 6px;">${opcTexto}</span>
                            </div>
                            <div>
                                ${badge}
                            </div>
                        </div>
                    `;
                });
                optionsHtml += '</div>';
            }

            let respuestaAlumnoHtml = '';
            if (isMultipleChoice) {
                respuestaAlumnoHtml = `
                    <p><strong>Respuesta del alumno:</strong> ${detalle?.respuesta || 'No respondida'} - ${detalle?.respuesta_texto || ''}</p>
                `;
            } else {
                respuestaAlumnoHtml = `
                    <p><strong>Respuesta escrita del alumno:</strong></p>
                    <div style="margin-left: 20px; padding: 10px; background: #f3f4f6; border-radius: 6px; font-style: italic; border: 1px solid #e5e7eb;">
                        ${detalle?.respuesta_texto || 'No respondida'}
                    </div>
                `;
            }

            content += `
                <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
                    <p><strong>${index + 1}. ${p.pregunta}</strong></p>
                    ${optionsHtml}
                    ${respuestaAlumnoHtml}
                    <p style="color: ${detalle ? (detalle.correcta ? '#059669' : '#dc2626') : '#6b7280'}; font-weight: bold;">
                        ${detalle ? (detalle.correcta ? '✓ Correcta' : '✗ Incorrecta') : '⚠️ No respondida'}
                    </p>
                    ${isMultipleChoice && !detalle?.correcta && p.respuesta_correcta ? `<p><strong>Respuesta correcta:</strong> ${p.respuesta_correcta}</p>` : ''}
                    <div style="font-style: italic; color: #4b5563; margin-top: 8px; background: #fff; padding: 10px; border-radius: 4px; border: 1px solid #e5e7eb;">
                        <strong>Justificación del alumno:</strong><br/>
                        ${detalle?.explicacion || 'No proporcionó explicación.'}
                    </div>
                </div>
            `;
        });

        content += `</div>`;
        element.innerHTML = content;

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin:       0.5,
                filename:     `Examen_${alumno.replace(/\s+/g, '_')}.pdf`,
                image:        { type: 'jpeg', quality: 0.98 },
                html2canvas:  { scale: 2 },
                jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
            } as any;

            html2pdf().from(element).set(opt).save();
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('No se pudo generar el PDF. Intentando descargar como HTML...');
            // Fallback to HTML download if pdf fails
            const blob = new Blob([element.innerHTML], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Examen_${alumno.replace(/\s+/g, '_')}.html`;
            a.click();
            URL.revokeObjectURL(url);
        }
    }

    const preguntasResultadoSeleccionado = selectedResultado
        ? preguntas.filter(p => p.examen_id === selectedResultado.examen_id)
        : []
    const examenesConResultados = examenes.map(examen => ({
        ...examen,
        resultados: resultados.filter(r => r.examen_id === examen.id)
    }))

    if (loading && cursos.length === 0) return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-zinc-50">
            <div className="text-gray-500 animate-pulse text-lg">Cargando...</div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans p-6 sm:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Link
                        href="/profesor/cursos"
                        className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a mis cursos
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                        <BookOpen className="h-8 w-8 mr-3 text-blue-600" /> Revisión de Exámenes
                    </h1>
                    <p className="text-gray-500 mt-2">Consulta las respuestas y explicaciones de tus alumnos.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Sidebar: Cursos y Alumnos */}
                    <div className="lg:col-span-1 space-y-6 sticky top-8 max-h-[calc(100vh-4rem)] overflow-y-auto pr-2">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Selecciona un Curso:</label>
                            <select 
                                value={selectedCurso} 
                                onChange={(e) => { setSelectedCurso(e.target.value); setSelectedResultado(null); }}
                                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white"
                            >
                                <option value="">-- Elige un curso --</option>
                                {cursos.map(c => (
                                    <option key={c.id} value={c.id}>{c.titulo}</option>
                                ))}
                            </select>
                        </div>

                        {selectedCurso && (
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                                <h2 className="font-bold text-gray-900 mb-4">Exámenes del curso</h2>
                                {examenesConResultados.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Este curso no tiene exámenes configurados.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {examenesConResultados.map(examen => (
                                            <div key={examen.id} className="border border-gray-100 rounded-xl overflow-hidden bg-gray-50">
                                                <div className="px-3 py-2 bg-white border-b border-gray-100">
                                                    <p className="text-sm font-bold text-gray-900">{examen.titulo}</p>
                                                    <p className="text-[11px] font-semibold text-gray-500 uppercase">{examen.tipo === 'final' ? 'Examen final' : 'Examen modular'}</p>
                                                </div>
                                                {examen.resultados.length === 0 ? (
                                                    <p className="px-3 py-3 text-xs text-gray-500">Sin alumnos todavía.</p>
                                                ) : (
                                                    <div className="p-2 space-y-2">
                                                        {examen.resultados.map((r: any) => (
                                                            <button
                                                                key={r.id}
                                                                onClick={() => setSelectedResultado(r)}
                                                                className={`w-full text-left p-3 rounded-lg border transition-colors flex justify-between items-center ${selectedResultado?.id === r.id ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-100 hover:bg-gray-100'}`}
                                                            >
                                                                <div>
                                                                    <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                                                                        <User className="h-3.5 w-3.5 text-gray-500" />
                                                                        {`${r.ie_profiles?.nombre || ''} ${r.ie_profiles?.apellido_paterno || ''} ${r.ie_profiles?.apellido_materno || ''}`.replace(/\s+/g, ' ').trim() || 'Alumno'}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">{new Date(r.created_at).toLocaleDateString()}</p>
                                                                </div>
                                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${r.aprobado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                                    {r.calificacion}%
                                                                </span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Main Content: Detalle del Examen */}
                    <div className="lg:col-span-2">
                        {selectedResultado ? (
                            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
                                <div className="border-b pb-4 mb-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Detalle de: {`${selectedResultado.ie_profiles?.nombre || ''} ${selectedResultado.ie_profiles?.apellido_paterno || ''} ${selectedResultado.ie_profiles?.apellido_materno || ''}`.replace(/\s+/g, ' ').trim() || 'Alumno'}
                                        </h2>
                                        <p className="text-sm font-semibold text-blue-700 mb-1">
                                            {selectedResultado.examen?.titulo || 'Examen'}
                                        </p>
                                        <p className="text-sm text-gray-500 mb-2">
                                            Fecha: {new Date(selectedResultado.created_at).toLocaleString()}
                                        </p>
                                        <button
                                            onClick={handleDownload}
                                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                                        >
                                            Descargar Examen
                                        </button>
                                    </div>
                                    <div className={`text-center px-4 py-2 rounded-xl ${selectedResultado.aprobado ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                        <p className="text-3xl font-black">{selectedResultado.calificacion}%</p>
                                        <p className="text-xs font-semibold uppercase">{selectedResultado.aprobado ? 'Aprobado' : 'Reprobado'}</p>
                                    </div>
                                </div>

                                {(!selectedResultado.respuestas_detalle || Object.keys(selectedResultado.respuestas_detalle).length === 0) && (
                                    <div className="mb-6 p-5 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="font-bold text-sm text-amber-900">Registro de Examen Histórico (Sin Desglose)</p>
                                            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                                                Este examen fue presentado el <strong>{new Date(selectedResultado.created_at).toLocaleDateString()}</strong>, antes de la actualización técnica que almacena el desglose detallado de respuestas en la base de datos.
                                                La calificación de <strong>{selectedResultado.calificacion}%</strong> está registrada formalmente en el expediente del alumno, pero las respuestas específicas no están disponibles en el historial. Por esta razón, el desglose de preguntas se muestra vacío.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-6">
                                    {preguntasResultadoSeleccionado.map((p, index) => {
                                        const detalle = obtenerDetalleRespuesta(p, index, selectedResultado.respuestas_detalle, preguntasResultadoSeleccionado);
                                        return (
                                            <div key={p.id} className="bg-gray-50 rounded-lg p-5 border border-gray-150">
                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-semibold text-gray-900">
                                                        <span className="text-blue-600 mr-1">{index + 1}.</span> {p.pregunta}
                                                    </h3>
                                                    {detalle ? (
                                                        detalle.correcta ? (
                                                            <span className="flex items-center text-green-600 text-xs font-bold gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                                                                <CheckCircle className="h-3.5 w-3.5" /> Correcta
                                                            </span>
                                                        ) : (
                                                            <span className="flex items-center text-red-600 text-xs font-bold gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                                                                <XCircle className="h-3.5 w-3.5" /> Incorrecta
                                                            </span>
                                                        )
                                                    ) : (
                                                        <span className="flex items-center text-gray-500 text-xs font-bold gap-1 bg-gray-100 px-2 py-0.5 rounded-full">
                                                            <AlertTriangle className="h-3.5 w-3.5" /> No respondida
                                                        </span>
                                                    )}
                                                </div>

                                                {p.tipo_pregunta !== 'respuesta_libre' ? (
                                                    <div className="text-sm space-y-2 mb-3">
                                                        {['A', 'B', 'C', 'D'].map(opc => {
                                                            const opcKey = `opcion_${opc.toLowerCase()}` as 'opcion_a' | 'opcion_b' | 'opcion_c' | 'opcion_d';
                                                            const opcTexto = p[opcKey];
                                                            if (!opcTexto) return null;

                                                            const isSelected = detalle?.respuesta === opc;
                                                            const isCorrect = p.respuesta_correcta?.trim().toUpperCase() === opc;

                                                            let bgClass = 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50';
                                                            let badge = null;
                                                            let viñeta = <span className="font-bold text-gray-400">{opc}:</span>;

                                                            if (isSelected && isCorrect) {
                                                                bgClass = 'bg-emerald-50 border-2 border-emerald-400 text-emerald-950 font-medium shadow-sm';
                                                                viñeta = <span className="font-extrabold text-emerald-600 flex items-center gap-1">✓ {opc}:</span>;
                                                                badge = (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                                                        ✓ Respuesta del Alumno (Correcta)
                                                                    </span>
                                                                );
                                                            } else if (isSelected && !isCorrect) {
                                                                bgClass = 'bg-rose-50 border-2 border-rose-400 text-rose-950 shadow-sm';
                                                                viñeta = <span className="font-extrabold text-rose-600 flex items-center gap-1">✗ {opc}:</span>;
                                                                badge = (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                                                                        ✗ Respuesta del Alumno (Incorrecta)
                                                                    </span>
                                                                );
                                                            } else if (!isSelected && isCorrect) {
                                                                bgClass = 'bg-emerald-50 border border-emerald-300 text-emerald-900 font-medium';
                                                                viñeta = <span className="font-extrabold text-emerald-600 flex items-center gap-1">✓ {opc}:</span>;
                                                                badge = (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                                                        ✓ Respuesta Correcta
                                                                    </span>
                                                                );
                                                            }

                                                            return (
                                                                <div key={opc} className={`p-3 rounded-xl flex items-center justify-between transition-all ${bgClass}`}>
                                                                    <div className="flex items-center gap-2">
                                                                        {viñeta}
                                                                        <span>{opcTexto}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-1.5">
                                                                        {badge}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <div className="bg-white p-4 rounded-xl border border-gray-200 mb-3 space-y-2">
                                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Respuesta escrita del alumno:</p>
                                                        <div className="p-3 rounded-lg bg-zinc-50 border border-zinc-200 text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                                                            {detalle?.respuesta_texto || 'No respondida'}
                                                        </div>
                                                        
                                                        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 mt-3">
                                                            <label className="block text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Calificación de Respuesta Libre:</label>
                                                            <select
                                                                value={calificacionesPreguntas[p.id] || ''}
                                                                onChange={(e) => {
                                                                    setCalificacionesPreguntas(prev => ({
                                                                        ...prev,
                                                                        [p.id]: e.target.value
                                                                    }))
                                                                }}
                                                                className="rounded-lg border-amber-250 shadow-sm focus:border-amber-500 focus:ring-amber-500 border p-2 text-sm text-black bg-white w-full sm:w-auto"
                                                            >
                                                                <option value="">-- Seleccionar Calificación --</option>
                                                                <option value="Excelente">Excelente</option>
                                                                <option value="Buena">Buena</option>
                                                                <option value="Regular">Regular</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="bg-white p-3 rounded-md border border-gray-200 mt-2">
                                                    <p className="text-xs font-semibold text-gray-500 mb-1">Explicación del alumno:</p>
                                                    <p className="text-sm text-gray-800 italic">
                                                        {detalle?.explicacion || 'No proporcionó explicación.'}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className="mt-8 border-t pt-6 space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        <MessageSquare className="h-5 w-5 text-blue-600" /> Retroalimentación y Notas del Profesor
                                    </h3>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nota general del profesor acerca del examen (opcional):</label>
                                        <textarea
                                            value={retroalimentacionGeneral}
                                            onChange={(e) => setRetroalimentacionGeneral(e.target.value)}
                                            rows={4}
                                            placeholder="Escribe comentarios, consejos o una nota final para el alumno..."
                                            className="w-full rounded-xl border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-3 text-black bg-white text-sm"
                                        />
                                    </div>
                                    <div className="flex items-center justify-between gap-4">
                                        <button
                                            type="button"
                                            disabled={guardandoRevision}
                                            onClick={handleGuardarRevision}
                                            className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-bold rounded-xl shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
                                        >
                                            {guardandoRevision ? 'Guardando...' : 'Guardar Calificación y Notas'}
                                        </button>
                                        {mensajeRevision && (
                                            <span className={`text-sm font-semibold ${mensajeRevision.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                                                {mensajeRevision}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center text-gray-500">
                                <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900">Selecciona un alumno</h3>
                                <p className="mt-1">Elige un alumno de la lista para ver el detalle de sus respuestas.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
