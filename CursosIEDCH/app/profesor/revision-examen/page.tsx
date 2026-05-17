'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, BookOpen, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'
import { getResultadosExamen } from './actions'

export default function RevisionExamenPage() {
    const [cursos, setCursos] = useState<any[]>([])
    const [selectedCurso, setSelectedCurso] = useState<string>('')
    const [resultados, setResultados] = useState<any[]>([])
    const [selectedResultado, setSelectedResultado] = useState<any>(null)
    const [preguntas, setPreguntas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchCursos = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Fetch courses by this professor that require an exam
            const { data } = await supabase
                .from('ie_cursos')
                .select('id, titulo')
                .eq('creado_por', user.id)
                .eq('requiere_examen', true)
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
                return
            }

            setLoading(true)
            // Fetch exam for the selected course
            const { success, data, error } = await getResultadosExamen(selectedCurso);

            if (success && data) {
                setResultados(data);
                
                // Fetch questions to show question text later
                const { data: examen } = await supabase
                    .from('ie_examenes')
                    .select('id')
                    .eq('curso_id', selectedCurso)
                    .single()

                if (examen) {
                    const { data: pregs } = await supabase
                        .from('ie_preguntas')
                        .select('*')
                        .eq('examen_id', examen.id)
                        .order('orden', { ascending: true })
                    
                    if (pregs) setPreguntas(pregs)
                }
            } else if (error) {
                console.error(error);
                setResultados([]);
            }
            setLoading(false)
        }
        fetchResultados()
    }, [selectedCurso, supabase])

    const handleDownload = async () => {
        if (!selectedResultado) return;

        const alumno = selectedResultado.ie_profiles?.nombre || 'Alumno';
        const fecha = new Date(selectedResultado.created_at).toLocaleString();
        const calificacion = selectedResultado.calificacion;
        const aprobado = selectedResultado.aprobado ? 'APROBADO' : 'REPROBADO';

        // Create a temporary element to hold the HTML
        const element = document.createElement('div');
        element.style.fontFamily = 'sans-serif';
        element.style.padding = '20px';
        element.style.color = '#1a1a1a';

        let content = `
            <div style="margin-bottom: 20px; border-bottom: 2px solid #e5e7eb; padding-bottom: 15px;">
                <h1 style="color: #1e3a8a;">Reporte de Examen</h1>
                <p><strong>Alumno:</strong> ${alumno}</p>
                <p><strong>Fecha:</strong> ${fecha}</p>
                <p><strong>Calificación:</strong> ${calificacion}% (${aprobado})</p>
            </div>
            <div>
        `;

        preguntas.forEach((p, index) => {
            const detalle = selectedResultado.respuestas_detalle?.[p.id];
            content += `
                <div style="margin-bottom: 15px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; background-color: #f9fafb;">
                    <p><strong>${index + 1}. ${p.pregunta}</strong></p>
                    <div style="margin-left: 20px; font-size: 0.9em; color: #4b5563;">
                        <p>A: ${p.opcion_a}</p>
                        <p>B: ${p.opcion_b}</p>
                        <p>C: ${p.opcion_c}</p>
                        <p>D: ${p.opcion_d}</p>
                    </div>
                    <p><strong>Respuesta del alumno:</strong> ${detalle?.respuesta || 'No respondida'}</p>
                    <p style="color: ${detalle?.correcta ? '#059669' : '#dc2626'}; font-weight: bold;">
                        ${detalle?.correcta ? '✓ Correcta' : '✗ Incorrecta'}
                    </p>
                    ${!detalle?.correcta ? `<p><strong>Respuesta correcta:</strong> ${p.respuesta_correcta}</p>` : ''}
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
            };

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
                    <div className="lg:col-span-1 space-y-6">
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
                                <h2 className="font-bold text-gray-900 mb-4">Exámenes Contestados</h2>
                                {resultados.length === 0 ? (
                                    <p className="text-gray-500 text-sm">Nadie ha contestado este examen aún.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {resultados.map(r => (
                                            <button
                                                key={r.id}
                                                onClick={() => setSelectedResultado(r)}
                                                className={`w-full text-left p-3 rounded-lg border transition-colors flex justify-between items-center ${selectedResultado?.id === r.id ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-100 hover:bg-gray-100'}`}
                                            >
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm flex items-center gap-1">
                                                        <User className="h-3.5 w-3.5 text-gray-500" />
                                                        {r.ie_profiles?.nombre || 'Alumno'}
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
                        )}
                    </div>

                    {/* Main Content: Detalle del Examen */}
                    <div className="lg:col-span-2">
                        {selectedResultado ? (
                            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-sm border border-gray-100">
                                <div className="border-b pb-4 mb-6 flex justify-between items-center">
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900">
                                            Detalle de: {selectedResultado.ie_profiles?.nombre || 'Alumno'}
                                        </h2>
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

                                <div className="space-y-6">
                                    {preguntas.map((p, index) => {
                                        const detalle = selectedResultado.respuestas_detalle?.[p.id];
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

                                                <div className="text-sm space-y-1 mb-3">
                                                    <p className={`p-2 rounded ${detalle?.respuesta === 'A' ? (detalle.correcta ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-white'}`}>
                                                        <span className="font-bold">A:</span> {p.opcion_a}
                                                    </p>
                                                    <p className={`p-2 rounded ${detalle?.respuesta === 'B' ? (detalle.correcta ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-white'}`}>
                                                        <span className="font-bold">B:</span> {p.opcion_b}
                                                    </p>
                                                    <p className={`p-2 rounded ${detalle?.respuesta === 'C' ? (detalle.correcta ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-white'}`}>
                                                        <span className="font-bold">C:</span> {p.opcion_c}
                                                    </p>
                                                    <p className={`p-2 rounded ${detalle?.respuesta === 'D' ? (detalle.correcta ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200') : 'bg-white'}`}>
                                                        <span className="font-bold">D:</span> {p.opcion_d}
                                                    </p>
                                                </div>

                                                {!detalle?.correcta && (
                                                    <p className="text-xs text-gray-600 mb-3">
                                                        <span className="font-semibold text-green-600">Respuesta correcta:</span> {p.respuesta_correcta}
                                                    </p>
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
