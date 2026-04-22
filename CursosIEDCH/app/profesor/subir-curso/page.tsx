'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, FileText, CheckCircle, Activity, Plus } from 'lucide-react'

type Modulo = {
    titulo: string;
    tipo: 'video' | 'pdf' | 'html';
    url_contenido: string; // Used if type is video
    archivoPdf: File | null; // Used if type is pdf/html
}

type PreguntaParsed = {
    pregunta: string;
    opcion_a: string;
    opcion_b: string;
    opcion_c: string;
    opcion_d: string;
    respuesta_correcta: string;
}

export default function SubirCursoPage() {
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        beneficios: '',
        duracion: '',
        precio: 0,
        reunion_url: '',
        nota_profesor: '',
    })

    const [vigenciaAnos, setVigenciaAnos] = useState<number>(3)

    // Modules state (Mixed content)
    const [modulos, setModulos] = useState<Modulo[]>([{ titulo: '', tipo: 'video', url_contenido: '', archivoPdf: null }])

    // Exam state
    const [requiereExamen, setRequiereExamen] = useState(false)
    const [requierePagoCompleto, setRequierePagoCompleto] = useState(false)
    const [minAprobacion, setMinAprobacion] = useState(80)
    const [archivoExamen, setArchivoExamen] = useState<File | null>(null)
    const [preguntasExtraidas, setPreguntasExtraidas] = useState<PreguntaParsed[]>([])
    const [isParsing, setIsParsing] = useState(false)

    const [loading, setLoading] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const router = useRouter()
    const supabase = createClient()

    const handleAgregarModulo = () => {
        setModulos([...modulos, { titulo: '', tipo: 'video', url_contenido: '', archivoPdf: null }])
    }

    const handleEliminarModulo = (index: number) => {
        setModulos(modulos.filter((_, i) => i !== index))
    }

    const handleModuloChange = (index: number, field: keyof Modulo, value: any) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[index] = { ...nuevosModulos[index], [field]: value }

        // Reset the other field when switching types
        if (field === 'tipo') {
            if (value === 'video') nuevosModulos[index].archivoPdf = null
            if (value === 'pdf' || value === 'html') nuevosModulos[index].url_contenido = ''
        }

        setModulos(nuevosModulos)
    }

    const handleUploadExamenHelper = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;
        setArchivoExamen(file);
        setMensaje('');

        if (file) {
            setIsParsing(true);
            const formData = new FormData();
            formData.append('file', file);

            try {
                const response = await fetch('/api/parse-exam', {
                    method: 'POST',
                    body: formData,
                });

                const data = await response.json();

                if (response.ok && data.questions) {
                    // Append questions to existing ones instead of overwriting
                    setPreguntasExtraidas(prev => [...prev, ...data.questions]);
                    setMensaje(`¡Examen analizado! Se detectaron ${data.questions.length} preguntas adicionales.`);
                } else {
                    setMensaje('Error leyendo el PDF del examen: ' + (data.error || 'Formato no válido.'));
                }
            } catch (err) {
                setMensaje('Error de conexión al leer el PDF.');
            } finally {
                setIsParsing(false);
            }
        }
    }

    const handleAgregarPreguntaManual = () => {
        setPreguntasExtraidas([...preguntasExtraidas, {
            pregunta: '',
            opcion_a: '',
            opcion_b: '',
            opcion_c: '',
            opcion_d: '',
            respuesta_correcta: 'A'
        }]);
    }

    const handleEliminarPreguntaManual = (index: number) => {
        setPreguntasExtraidas(preguntasExtraidas.filter((_, i) => i !== index));
    }

    const handlePreguntaChange = (index: number, field: keyof PreguntaParsed, value: string) => {
        const nuevas = [...preguntasExtraidas];
        nuevas[index] = { ...nuevas[index], [field]: value };
        setPreguntasExtraidas(nuevas);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMensaje('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setLoading(false)
            return
        }

        // Validate modules
        if (modulos.length === 0) {
            setMensaje('Agrega al menos un módulo al curso.');
            setLoading(false)
            return
        }

        for (const m of modulos) {
            if (!m.titulo || (m.tipo === 'video' && !m.url_contenido) || (m.tipo !== 'video' && !m.archivoPdf)) {
                setMensaje('Por favor, completa los títulos y el contenido (URL o Archivo PDF) de todos los módulos.');
                setLoading(false)
                return
            }
        }

        // Validate exam status
        if (requiereExamen) {
            if (preguntasExtraidas.length === 0) {
                setMensaje('Has marcado que el curso requiere examen, por favor añade al menos una pregunta o sube un PDF.');
                setLoading(false)
                return
            }
            // Check if all questions are filled
            for (const p of preguntasExtraidas) {
                if (!p.pregunta || !p.opcion_a || !p.opcion_b || !p.respuesta_correcta) {
                    setMensaje('Por favor, completa todas las preguntas y al menos 2 opciones de respuesta (A y B).');
                    setLoading(false)
                    return
                }
            }
        }

        let firstUrlContenido = '';

        // 1. Crear el Curso en la base de datos primero (necesitamos el ID)
        setMensaje('Guardando información del curso...')
        
        const { data: profile } = await supabase.from('ie_profiles').select('*').eq('id', user.id).single()
        const instructorNombre = `${profile?.nombre || ''} ${profile?.apellido_paterno || ''} ${profile?.apellido_materno || ''}`.trim() || user.email;

        const cursoDraftObj: any = {
            ...formData,
            instructor: instructorNombre,
            url_contenido: 'processing', // Temporary placeholder
            precio: Number(formData.precio),
            estado: 'pendiente',
            creado_por: user.id,
            requiere_examen: requiereExamen,
            requiere_pago_completo: requierePagoCompleto,
            url_examen: null, // Deprecated effectively, but kept for legacy views
            vigencia_anos: vigenciaAnos,
            reunion_url: formData.reunion_url?.trim() || null,
            nota_profesor: formData.nota_profesor?.trim() || null
        }

        const { data: cursoGuardado, error: errorCurso } = await supabase.from('ie_cursos').insert(cursoDraftObj).select().single()

        if (errorCurso || !cursoGuardado) {
            setMensaje('Error al crear el curso en la base de datos: ' + errorCurso?.message)
            setLoading(false)
            return
        }

        // 2. Subir Pdfs de módulos si existen y guardarlos
        setMensaje('Subiendo contenidos y módulos...')
        const finalModulosObj = [];
        for (let i = 0; i < modulos.length; i++) {
            let finalUrl = modulos[i].url_contenido;
            if (modulos[i].tipo !== 'video' && modulos[i].archivoPdf) {
                const file = modulos[i].archivoPdf as File;
                const fileExt = file.name.split('.').pop()
                const fileName = `modulo_${cursoGuardado.id}_${i}_${Date.now()}.${fileExt}`

                const ext = (fileExt || '').toLowerCase()
                const contentType = ext === 'pdf'
                    ? 'application/pdf'
                    : (ext === 'html' || ext === 'htm' || file.type === 'text/html')
                        ? 'text/html; charset=utf-8'
                        : (file.type || 'application/octet-stream')

                const { error: uploadError } = await supabase.storage.from('cursos_contenido').upload(fileName, file, { contentType })
                if (uploadError) {
                    setMensaje(`Error subiendo el PDF del módulo ${i + 1}: ${uploadError.message}`);
                    setLoading(false);
                    return;
                }
                finalUrl = supabase.storage.from('cursos_contenido').getPublicUrl(fileName).data.publicUrl
            }

            if (i === 0) firstUrlContenido = finalUrl;

            finalModulosObj.push({
                curso_id: cursoGuardado.id,
                titulo: modulos[i].titulo,
                url_contenido: finalUrl,
                orden: i + 1
            });
        }

        const { error: errorModulos } = await supabase.from('ie_curso_modulos').insert(finalModulosObj)
        if (errorModulos) {
            setMensaje('Error guardando los módulos: ' + errorModulos.message)
            setLoading(false)
            return
        }

        // 3. Update Course with legacy first URL (so legacy view doesn't break)
        await supabase.from('ie_cursos').update({ url_contenido: firstUrlContenido }).eq('id', cursoGuardado.id);


        // 4. Crear el Examen Interactivo
        if (requiereExamen && preguntasExtraidas.length > 0) {
            setMensaje('Registrando preguntas del examen interactivo...')
            // Subir PDF original de examen también (opcional pero lo dejamos de respaldo como url_examen)
            let urlExamenPdf = null;
            if (archivoExamen) {
                const fExt = archivoExamen.name.split('.').pop()
                const fName = `examen_pdf_${cursoGuardado.id}_${Date.now()}.${fExt}`
                await supabase.storage.from('cursos_contenido').upload(fName, archivoExamen)
                urlExamenPdf = supabase.storage.from('cursos_contenido').getPublicUrl(fName).data.publicUrl
                await supabase.from('ie_cursos').update({ url_examen: urlExamenPdf }).eq('id', cursoGuardado.id);
            }

            // Insertar ie_examenes
            const { data: examenGuardado, error: errorExamen } = await supabase.from('ie_examenes').insert({
                curso_id: cursoGuardado.id,
                min_aprobacion: minAprobacion
            }).select().single()

            if (errorExamen) {
                setMensaje('El curso se creó, pero hubo un error generando el cuestionario reactivo.');
            } else if (examenGuardado) {
                // Insertar preguntas
                const preguntasAInsertar = preguntasExtraidas.map((p, pIndex) => ({
                    examen_id: examenGuardado.id,
                    pregunta: p.pregunta,
                    opcion_a: p.opcion_a,
                    opcion_b: p.opcion_b,
                    opcion_c: p.opcion_c,
                    opcion_d: p.opcion_d,
                    respuesta_correcta: p.respuesta_correcta,
                    orden: pIndex + 1
                }));
                await supabase.from('ie_preguntas').insert(preguntasAInsertar);
            }
        }

        alert('Creado correctamente. Esperando a la validación.')
        router.push('/profesor/cursos')
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">Subir Nuevo Curso</h1>
            <div className="bg-white shadow rounded-lg p-6 lg:p-8">
                {mensaje && (
                    <div className={`mb-6 p-4 rounded-md border ${mensaje.includes('Error') ? 'bg-red-50 border-red-200 text-red-800' : (mensaje.includes('Sube') || mensaje.includes('Subiendo') || mensaje.includes('Guardando') || mensaje.includes('analizado') ? 'bg-blue-50 border-blue-200 text-blue-800' : 'bg-green-50 border-green-200 text-green-800')}`}>
                        <p className="font-medium text-sm">{mensaje}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Información Básica */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">1. Información Básica</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Título del Curso</label>
                                <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                <textarea name="descripcion" required value={formData.descripcion} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" />
                            </div>
                        </div>
                    </div>

                    {/* Contenido Modular */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">2. Temario del Curso (Módulos)</h2>
                        <p className="text-sm text-gray-600 mb-4">Añade en orden las clases de tu curso. Cada clase puede ser un video externo o un archivo PDF de lectura.</p>

                        <div className="space-y-4">
                            {modulos.map((modulo, index) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg relative shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                                        Módulo {index + 1}
                                        {modulos.length > 1 && (
                                            <button type="button" onClick={() => handleEliminarModulo(index)} className="ml-auto text-red-500 hover:text-red-700 flex items-center text-xs">
                                                <Trash2 className="h-4 w-4 mr-1" /> Eliminar Módulo
                                            </button>
                                        )}
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-1 md:col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Título de la Clase / Lectura</label>
                                            <input type="text" required placeholder="Ej. Introducción a los algoritmos" value={modulo.titulo} onChange={(e) => handleModuloChange(index, 'titulo', e.target.value)} className="w-full text-sm border-gray-300 rounded p-2 border bg-white text-black" />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-2">Formato de este módulo</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center text-sm text-gray-800">
                                                    <input type="radio" checked={modulo.tipo === 'video'} onChange={() => handleModuloChange(index, 'tipo', 'video')} className="mr-2 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    Video (YouTube/Vimeo)
                                                </label>
                                                <label className="flex items-center text-sm text-gray-800">
                                                    <input type="radio" checked={modulo.tipo === 'pdf'} onChange={() => handleModuloChange(index, 'tipo', 'pdf')} className="mr-2 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    Documento (PDF)
                                                </label>
                                                <label className="flex items-center text-sm text-gray-800">
                                                    <input type="radio" checked={modulo.tipo === 'html'} onChange={() => handleModuloChange(index, 'tipo', 'html')} className="mr-2 border-gray-300 text-blue-600 focus:ring-blue-500" />
                                                    Web (HTML)
                                                </label>
                                            </div>
                                        </div>

                                        <div className="flex items-end">
                                            {modulo.tipo === 'video' ? (
                                                <div className="w-full">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">URL (YouTube o Vimeo)</label>
                                                    <input type="url" required placeholder="https://youtube.com/watch?v=..." value={modulo.url_contenido} onChange={(e) => handleModuloChange(index, 'url_contenido', e.target.value)} className="w-full text-sm border-gray-300 rounded p-2 border bg-white text-black" />
                                                </div>
                                            ) : (
                                                <div className="w-full">
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                        {modulo.tipo === 'html' ? 'Seleccionar HTML' : 'Seleccionar PDF'}
                                                    </label>
                                                    <input
                                                        type="file"
                                                        required
                                                        accept={modulo.tipo === 'html' ? '.html,.htm,text/html' : '.pdf,application/pdf'}
                                                        onChange={(e) => handleModuloChange(index, 'archivoPdf', e.target.files?.[0] || null)}
                                                        className="w-full text-sm text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 border p-1 border-gray-300 rounded bg-white"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}

                            <button type="button" onClick={handleAgregarModulo} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-medium hover:border-blue-400 hover:text-blue-600 transition-colors flex justify-center items-center text-sm">
                                + Agregar Objeto de Aprendizaje
                            </button>
                        </div>
                    </div>

                    {/* Examen Interactivo */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">3. Evaluación (Examen Final)</h2>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-5 shadow-sm">
                            <label className="flex items-center cursor-pointer mb-2">
                                <input type="checkbox" checked={requiereExamen} onChange={(e) => setRequiereExamen(e.target.checked)} className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded" />
                                <span className="ml-2 block text-sm font-bold text-green-900">
                                    Este curso requiere que el alumno apruebe un examen final
                                </span>
                            </label>

                            {requiereExamen && (
                                <div className="mt-4 pl-0 sm:pl-6 border-l-0 sm:border-l-2 border-green-300 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Calificación Mínima Aprobatoria (0 - 100)</label>
                                            <input type="number" min="0" max="100" value={minAprobacion} onChange={(e) => setMinAprobacion(Number(e.target.value))} className="w-full sm:w-32 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-black bg-white" />
                                            <p className="text-[10px] text-gray-500 mt-1 italic">Si el alumno saca al menos esta puntuación, aprueba.</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Cargar PDF (Automático)</label>
                                            <input type="file" accept=".pdf,application/pdf" onChange={handleUploadExamenHelper} disabled={isParsing} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-green-700 hover:file:bg-green-100 border border-green-300 rounded bg-white p-1" />
                                            {isParsing && <p className="text-[10px] font-bold text-green-600 mt-1 animate-pulse italic">Analizando PDF...</p>}
                                        </div>
                                    </div>

                                    {/* Manual Questions Section */}
                                    <div className="pt-4 border-t border-green-200">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-sm font-bold text-green-800 flex items-center gap-2">
                                                <FileText className="h-4 w-4" /> Preguntas del Examen ({preguntasExtraidas.length})
                                            </h3>
                                            <button 
                                                type="button" 
                                                onClick={handleAgregarPreguntaManual}
                                                className="bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-bold hover:bg-green-700 transition-colors flex items-center gap-1 shadow-sm"
                                            >
                                                <Plus className="h-3 w-3" /> Agregar Pregunta
                                            </button>
                                        </div>

                                        {preguntasExtraidas.length === 0 && !isParsing && (
                                            <div className="text-center py-8 bg-white/50 border-2 border-dashed border-green-200 rounded-lg">
                                                <p className="text-xs text-gray-500 italic">No hay preguntas aún. Sube un PDF o agrégalas manualmente.</p>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {preguntasExtraidas.map((p, i) => (
                                                <div key={i} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm hover:border-green-300 transition-all relative">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleEliminarPreguntaManual(i)}
                                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors"
                                                        title="Eliminar pregunta"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="col-span-full">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">#{i + 1}</span>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Texto de la Pregunta</label>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                required
                                                                value={p.pregunta} 
                                                                onChange={(e) => handlePreguntaChange(i, 'pregunta', e.target.value)}
                                                                placeholder="Ej. ¿Cuál es el componente encargado de...?"
                                                                className="w-full text-sm font-medium border-0 border-b-2 border-gray-50 focus:border-green-500 focus:ring-0 px-0 pb-1 bg-transparent text-black"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                                            {(['a', 'b', 'c', 'd'] as const).map(opt => (
                                                                <div key={opt}>
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold ${p.respuesta_correcta === opt.toUpperCase() ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                                            {opt.toUpperCase()}
                                                                        </span>
                                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Opción {opt.toUpperCase()}</label>
                                                                    </div>
                                                                    <input 
                                                                        type="text" 
                                                                        required={opt === 'a' || opt === 'b'} // At least 2 options
                                                                        value={(p as any)[`opcion_${opt}`]} 
                                                                        onChange={(e) => handlePreguntaChange(i, `opcion_${opt}` as any, e.target.value)}
                                                                        className="w-full text-xs border-0 border-b border-gray-50 focus:border-green-400 focus:ring-0 px-0 py-1 bg-transparent text-black"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex items-center gap-4 pt-4 border-t border-gray-50">
                                                            <label className="text-xs font-bold text-gray-600 italic">Respuesta Correcta:</label>
                                                            <div className="flex gap-4">
                                                                {['A', 'B', 'C', 'D'].map(letter => (
                                                                    <label key={letter} className="flex items-center gap-1.5 cursor-pointer group">
                                                                        <input 
                                                                            type="radio" 
                                                                            name={`correct_${i}`} 
                                                                            checked={p.respuesta_correcta === letter}
                                                                            onChange={() => handlePreguntaChange(i, 'respuesta_correcta', letter)}
                                                                            className="h-3 w-3 text-green-600 focus:ring-green-500 border-gray-300"
                                                                        />
                                                                        <span className={`text-xs font-bold transition-colors ${p.respuesta_correcta === letter ? 'text-green-700' : 'text-gray-400 group-hover:text-gray-600'}`}>
                                                                            {letter}
                                                                        </span>
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Detalles Adicionales */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">4. Detalles Adicionales</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duración Estructurada (Ej. "10 Horas", "5 Módulos")</label>
                                <input type="text" name="duracion" required value={formData.duracion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Precio de Venta (MXN)</label>
                                <div className="mt-1 relative rounded-md shadow-sm">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input type="number" step="0.01" name="precio" required min="0" value={formData.precio} onChange={handleChange} className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" placeholder="0.00" />
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vigencia de la Constancia</label>
                                <select
                                    value={vigenciaAnos}
                                    onChange={(e) => setVigenciaAnos(Number(e.target.value))}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white"
                                >
                                    <option value={1}>1 año</option>
                                    <option value={2}>2 años</option>
                                    <option value={3}>3 años</option>
                                    <option value={5}>5 años</option>
                                    <option value={10}>10 años</option>
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Tiempo de validez de la constancia a partir de su emisión.</p>
                            </div>
                        </div>
                        <div className="mb-4">
                            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm">
                                <label className="flex items-start cursor-pointer gap-3">
                                    <input
                                        type="checkbox"
                                        checked={requierePagoCompleto}
                                        onChange={(e) => setRequierePagoCompleto(e.target.checked)}
                                        className="h-4 w-4 mt-0.5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                    />
                                    <div>
                                        <span className="block text-sm font-semibold text-orange-900">
                                            Requiere el 100% del curso pagado para obtener constancia
                                        </span>
                                        <span className="block text-xs text-orange-700 mt-0.5">
                                            Si se activa, los alumnos que usen cupones de descuento deberán cubrir el valor total del curso antes de descargar su constancia.
                                        </span>
                                    </div>
                                </label>
                            </div>
                        </div>
                    {/* Clase en Vivo y Notas */}
                    <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 shadow-sm">
                        <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                            <Activity className="h-5 w-5 text-blue-600" /> 5. Clase en Vivo / Avisos (Opcional)
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Enlace de Reunión (Zoom, Meet, etc.)</label>
                                    {formData.reunion_url && (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, reunion_url: '' }))} className="text-[10px] text-red-500 hover:text-red-700 font-bold">
                                            ✕ LIMPIAR ENLACE
                                        </button>
                                    )}
                                </div>
                                <input 
                                    type="url" 
                                    name="reunion_url" 
                                    value={formData.reunion_url} 
                                    onChange={handleChange} 
                                    placeholder="https://zoom.us/j/..." 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" 
                                />
                                <p className="text-xs text-gray-500 mt-1 italic">Este enlace aparecerá destacado en el contenido del curso.</p>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Nota o Aviso para Alumnos</label>
                                    {formData.nota_profesor && (
                                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, nota_profesor: '' }))} className="text-[10px] text-red-500 hover:text-red-700 font-bold">
                                            ✕ QUITAR NOTA
                                        </button>
                                    )}
                                </div>
                                <textarea 
                                    name="nota_profesor" 
                                    value={formData.nota_profesor} 
                                    onChange={handleChange} 
                                    rows={3} 
                                    placeholder="Ej: La clase en vivo será el próximo viernes a las 6:00 PM..." 
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" 
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Beneficios / ¿Qué aprenderá el alumno?</label>
                        <textarea name="beneficios" required value={formData.beneficios} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" placeholder="Ej. Al finalizar este curso dominarás..." />
                    </div>
                    </div>

                    {/* Submit */}
                    <div className="pt-6 border-t border-gray-200">
                        <button type="submit" disabled={loading || isParsing || (requiereExamen && preguntasExtraidas.length === 0)} className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all shadow-lg active:scale-[0.98]">
                            {loading ? 'Subiendo archivos y registrando curso...' : 'Enviar Curso a Revisión'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
