'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, CheckCircle, ArrowLeft, History, Activity, FileText, Plus } from 'lucide-react'
import Link from 'next/link'

type Modulo = {
    id?: string;
    titulo: string;
    tipo: 'video' | 'pdf' | 'html';
    url_contenido: string;
    archivoPdf: File | null;
}

type PreguntaParsed = {
    id?: string;
    pregunta: string;
    opcion_a: string;
    opcion_b: string;
    opcion_c: string;
    opcion_d: string;
    respuesta_correcta: string;
}

export default function EditarCursoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [formData, setFormData] = useState({
        titulo: '',
        descripcion: '',
        beneficios: '',
        duracion: '',
        precio: 0,
        instructor: '',
        reunion_url: '',
        nota_profesor: '',
    })

    const [vigenciaAnos, setVigenciaAnos] = useState<number>(3)
    const [estadoActual, setEstadoActual] = useState('')
    const [tieneBorrador, setTieneBorrador] = useState(false)
    const [modulos, setModulos] = useState<Modulo[]>([])
    const [requierePagoCompleto, setRequierePagoCompleto] = useState(false)
    
    // Exam state
    const [requiereExamen, setRequiereExamen] = useState(false)
    const [minAprobacion, setMinAprobacion] = useState(80)
    const [preguntasExtraidas, setPreguntasExtraidas] = useState<PreguntaParsed[]>([])
    const [isParsing, setIsParsing] = useState(false)
    const [archivoExamen, setArchivoExamen] = useState<File | null>(null)

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [mensaje, setMensaje] = useState('')
    const [historialMensaje, setHistorialMensaje] = useState('Se actualizaron datos generales del curso.')
    
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        const fetchCurso = async () => {
            const { data: curso, error } = await supabase
                .from('ie_cursos')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !curso) {
                setMensaje('No se encontró el curso.')
                setLoading(false)
                return
            }

            setFormData({
                titulo: curso.titulo,
                descripcion: curso.descripcion,
                beneficios: curso.beneficios,
                duracion: curso.duracion,
                precio: curso.precio,
                instructor: curso.instructor,
                reunion_url: curso.reunion_url || '',
                nota_profesor: curso.nota_profesor || '',
            })
            setVigenciaAnos(curso.vigencia_anos || 3)
            setEstadoActual(curso.estado)
            setRequierePagoCompleto(curso.requiere_pago_completo || false)
            setRequiereExamen(curso.requiere_examen || false)

            if (curso.cambios_pendientes && curso.estado === 'aprobado') {
                const borrador = curso.cambios_pendientes;
                setTieneBorrador(true)
                setFormData({
                    titulo: borrador.titulo || curso.titulo,
                    descripcion: borrador.descripcion || curso.descripcion,
                    beneficios: borrador.beneficios || curso.beneficios,
                    duracion: borrador.duracion || curso.duracion,
                    precio: borrador.precio || curso.precio,
                    instructor: borrador.instructor || curso.instructor,
                    reunion_url: borrador.reunion_url || curso.reunion_url || '',
                    nota_profesor: borrador.nota_profesor || curso.nota_profesor || '',
                })
                setVigenciaAnos(borrador.vigencia_anos || curso.vigencia_anos || 3)
                setRequiereExamen(borrador.requiere_examen !== undefined ? borrador.requiere_examen : (curso.requiere_examen || false))
                
                if (borrador.modulos) {
                    setModulos(borrador.modulos.map((m: any) => ({
                        id: m.id,
                        titulo: m.titulo,
                        tipo: m.tipo || (m.url_contenido && (m.url_contenido.includes('.pdf') ? 'pdf' : (m.url_contenido.includes('.htm') ? 'html' : 'video'))),
                        url_contenido: m.url_contenido,
                        archivoPdf: null,
                    })))
                }
                
                if (borrador.examen) {
                    setMinAprobacion(borrador.examen.min_aprobacion);
                    setPreguntasExtraidas(borrador.examen.preguntas || []);
                } else {
                    // Cargar examen original si hay borrador pero no del examen
                    const { data: exm } = await supabase.from('ie_examenes').select('*').eq('curso_id', id).single();
                    if (exm) {
                        setMinAprobacion(exm.min_aprobacion);
                        const { data: pregs } = await supabase.from('ie_preguntas').select('*').eq('examen_id', exm.id).order('orden', { ascending: true });
                        if (pregs) setPreguntasExtraidas(pregs);
                    }
                }

                setLoading(false)
                return
            }

            // Cargar Módulos normales si no hay borrador
            const { data: mods } = await supabase
                .from('ie_curso_modulos')
                .select('*')
                .eq('curso_id', id)
                .order('orden', { ascending: true })

            if (mods) {
                setModulos(mods.map(m => ({
                    id: m.id,
                    titulo: m.titulo,
                    tipo: m.url_contenido.includes('.pdf') ? 'pdf' : (m.url_contenido.includes('.htm') ? 'html' : 'video'),
                    url_contenido: m.url_contenido,
                    archivoPdf: null,
                })))
            }

            // Cargar Examen normal
            const { data: exm } = await supabase.from('ie_examenes').select('*').eq('curso_id', id).single();
            if (exm) {
                setMinAprobacion(exm.min_aprobacion);
                const { data: pregs } = await supabase.from('ie_preguntas').select('*').eq('examen_id', exm.id).order('orden', { ascending: true });
                if (pregs) setPreguntasExtraidas(pregs);
            }
            
            setLoading(false)
        }
        fetchCurso()
    }, [id, supabase])

    const handleAgregarModulo = () => {
        setModulos([...modulos, { titulo: '', tipo: 'video', url_contenido: '', archivoPdf: null }])
    }

    const handleEliminarModulo = async (index: number) => {
        const moduloAEliminar = modulos[index];
        if (moduloAEliminar.id) {
            const confirmar = window.confirm("¿Seguro que deseas borrar este módulo de la base de datos de manera permanente?");
            if (!confirmar) return;
            
            await supabase.from('ie_curso_modulos').delete().eq('id', moduloAEliminar.id);
        }
        setModulos(modulos.filter((_, i) => i !== index))
    }

    const handleModuloChange = (index: number, field: keyof Modulo, value: any) => {
        const nuevosModulos = [...modulos]
        nuevosModulos[index] = { ...nuevosModulos[index], [field]: value }

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMensaje('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        if (modulos.length === 0) {
            setMensaje('El curso debe tener al menos un módulo.')
            setSaving(false)
            return
        }

        for (const m of modulos) {
            if (!m.titulo || (m.tipo === 'video' && !m.url_contenido) || (m.tipo !== 'video' && !m.url_contenido && !m.archivoPdf)) {
                setMensaje('Completa los datos de todos los módulos nuevos.')
                setSaving(false)
                return
            }
        }

        const modulosFinales = []
        for (let i = 0; i < modulos.length; i++) {
            let finalUrl = modulos[i].url_contenido;

            // Subir documento (PDF/HTML) si es uno nuevo
            if (modulos[i].tipo !== 'video' && modulos[i].archivoPdf) {
                const file = modulos[i].archivoPdf as File;
                const fileExt = file.name.split('.').pop()
                const fileName = `modulo_${id}_${i}_${Date.now()}.${fileExt}`

                const ext = (fileExt || '').toLowerCase()
                const contentType = ext === 'pdf'
                    ? 'application/pdf'
                    : (ext === 'html' || ext === 'htm' || file.type === 'text/html')
                        ? 'text/html; charset=utf-8'
                        : (file.type || 'application/octet-stream')

                const { error: upErr } = await supabase.storage.from('cursos_contenido').upload(fileName, file, { contentType })
                if (upErr) {
                    setMensaje('Error subiendo contenido: ' + upErr.message)
                    setSaving(false)
                    return
                }
                finalUrl = supabase.storage.from('cursos_contenido').getPublicUrl(fileName).data.publicUrl
            }

            modulosFinales.push({
                id: modulos[i].id,
                curso_id: id,
                titulo: modulos[i].titulo,
                tipo: modulos[i].tipo,
                url_contenido: finalUrl,
                orden: i + 1
            });
        }

        if (estadoActual === 'aprobado') {
            setMensaje('Actualizando datos en el borrador...')
            const borrador = {
                titulo: formData.titulo,
                descripcion: formData.descripcion,
                beneficios: formData.beneficios,
                duracion: formData.duracion,
                precio: Number(formData.precio),
                instructor: formData.instructor,
                vigencia_anos: vigenciaAnos,
                requiere_pago_completo: requierePagoCompleto,
                reunion_url: formData.reunion_url?.trim() || null,
                nota_profesor: formData.nota_profesor?.trim() || null,
                modulos: modulosFinales,
                requiere_examen: requiereExamen,
                examen: requiereExamen ? {
                    min_aprobacion: minAprobacion,
                    preguntas: preguntasExtraidas.map((p, idx) => ({ ...p, orden: idx + 1 }))
                } : null
            }
            const { error: errorDraft } = await supabase.from('ie_cursos').update({ cambios_pendientes: borrador }).eq('id', id)
            if (errorDraft) {
                setMensaje('Error al guardar el borrador: ' + errorDraft.message)
                setSaving(false)
                return
            }
        } else {
            setMensaje('Actualizando información básica...')
            const { error: errorUpdate } = await supabase
                .from('ie_cursos')
                .update({
                    titulo: formData.titulo,
                    descripcion: formData.descripcion,
                    beneficios: formData.beneficios,
                    duracion: formData.duracion,
                    precio: Number(formData.precio),
                    instructor: formData.instructor,
                    vigencia_anos: vigenciaAnos,
                    requiere_pago_completo: requierePagoCompleto,
                    reunion_url: formData.reunion_url?.trim() || null,
                    nota_profesor: formData.nota_profesor?.trim() || null,
                    requiere_examen: requiereExamen,
                    estado: 'pendiente', 
                })
                .eq('id', id)

            if (errorUpdate) {
                setMensaje('Error al actualizar el curso: ' + errorUpdate.message)
                setSaving(false)
                return
            }

            setMensaje('Guardando módulos...')
            for (const mod of modulosFinales) {
                const moduloPayload = {
                    curso_id: mod.curso_id,
                    titulo: mod.titulo,
                    url_contenido: mod.url_contenido,
                    orden: mod.orden
                };
                if (mod.id) {
                    await supabase.from('ie_curso_modulos').update(moduloPayload).eq('id', mod.id)
                } else {
                    await supabase.from('ie_curso_modulos').insert(moduloPayload)
                }
            }

            // Guardar Examen
            if (requiereExamen) {
                setMensaje('Actualizando examen final...')
                let { data: exm } = await supabase.from('ie_examenes').select('id').eq('curso_id', id).single()
                if (!exm) {
                    const { data: newExm } = await supabase.from('ie_examenes').insert({ curso_id: id, min_aprobacion: minAprobacion }).select().single()
                    exm = newExm
                } else {
                    await supabase.from('ie_examenes').update({ min_aprobacion: minAprobacion }).eq('id', exm.id)
                }

                if (exm) {
                    // Reemplazar preguntas
                    await supabase.from('ie_preguntas').delete().eq('examen_id', exm.id)
                    const pregsParaInsertar = preguntasExtraidas.map((p, idx) => ({
                        examen_id: exm!.id,
                        pregunta: p.pregunta,
                        opcion_a: p.opcion_a,
                        opcion_b: p.opcion_b,
                        opcion_c: p.opcion_c,
                        opcion_d: p.opcion_d,
                        respuesta_correcta: p.respuesta_correcta,
                        orden: idx + 1
                    }))
                    await supabase.from('ie_preguntas').insert(pregsParaInsertar)
                }
            }
        }

        // Registrar Historial
        setMensaje('Registrando en el historial de cambios...')
        await supabase.from('ie_curso_historial').insert({
            curso_id: id,
            modificado_por: user.id,
            detalles_cambio: historialMensaje || 'Actualización de datos, módulos y/o examen del curso',
        })

        alert('Editado correctamente. Esperando a la validación.')
        router.push('/profesor/cursos')
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando curso...</div>

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center space-x-4 mb-6">
                <Link href="/profesor/cursos" className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-900 shadow-sm border">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Editar Curso</h1>
                <span className={`px-3 py-1 text-xs font-bold rounded-full capitalize ${estadoActual === 'aprobado' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {estadoActual}
                </span>
            </div>

            <div className="bg-white shadow rounded-lg p-6 lg:p-8">
                {mensaje && (
                    <div className={`mb-6 p-4 rounded-md border ${mensaje.includes('Error') ? 'bg-red-50 border-red-200 text-red-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                        <p className="font-medium text-sm">{mensaje}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Información Básica */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2">1. Información Básica</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Título del Curso</label>
                                <input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                <textarea name="descripcion" required value={formData.descripcion} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Duración</label>
                                <input type="text" name="duracion" required value={formData.duracion} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-black bg-white" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Precio de Venta (MXN)</label>
                                <input type="number" step="0.01" name="precio" required min="0" value={formData.precio} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-black bg-white" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700">Beneficios</label>
                                <textarea name="beneficios" required value={formData.beneficios} onChange={handleChange} rows={2} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-black bg-white" />
                            </div>

                            {/* Clase en Vivo y Notas */}
                            <div className="col-span-2 border-t pt-4 mt-2">
                                <h3 className="text-md font-bold text-gray-800 mb-4 flex items-center">
                                    <Activity className="h-5 w-5 mr-2 text-blue-500" /> Clase en Vivo / Avisos (Opcional)
                                </h3>
                                <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-100">
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Enlace de Reunión (Zoom, Meet, etc.)</label>
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
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-1 mt-2">
                                            <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider">Nota o Aviso para Alumnos</label>
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
                                            rows={2} 
                                            placeholder="Ej: La siguiente clase será a las 5pm..." 
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 text-black bg-white" 
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vigencia Constancia (Años)</label>
                                <select value={vigenciaAnos} onChange={(e) => setVigenciaAnos(Number(e.target.value))} className="mt-1 block w-full rounded-md border-gray-300 p-2 border bg-white text-black">
                                    <option value={1}>1 año</option>
                                    <option value={2}>2 años</option>
                                    <option value={3}>3 años</option>
                                    <option value={5}>5 años</option>
                                    <option value={10}>10 años</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
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
                        </div>
                    </div>

                    {/* Módulos */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2 flex justify-between items-center">
                            <span>2. Módulos Temáticos</span>
                        </h2>
                        
                        <div className="space-y-4">
                            {modulos.map((modulo, index) => (
                                <div key={index} className="bg-gray-50 border border-gray-200 p-4 rounded-lg shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-700 mb-3 flex justify-between items-center">
                                        <span>Módulo {index + 1} {modulo.id ? '(Existente)' : '(Nuevo)'}</span>
                                        <button type="button" onClick={() => handleEliminarModulo(index)} className="text-red-500 hover:text-red-700 text-xs flex items-center">
                                            <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                                        </button>
                                    </h3>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="block text-xs font-semibold text-gray-600 mb-1">Título</label>
                                            <input type="text" required value={modulo.titulo} onChange={(e) => handleModuloChange(index, 'titulo', e.target.value)} className="w-full text-sm border-gray-300 rounded p-2 border text-black bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-600 mb-2">Formato</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center text-sm"><input type="radio" checked={modulo.tipo === 'video'} onChange={() => handleModuloChange(index, 'tipo', 'video')} className="mr-2" /> Video</label>
                                                <label className="flex items-center text-sm"><input type="radio" checked={modulo.tipo === 'pdf'} onChange={() => handleModuloChange(index, 'tipo', 'pdf')} className="mr-2" /> PDF</label>
                                                <label className="flex items-center text-sm"><input type="radio" checked={modulo.tipo === 'html'} onChange={() => handleModuloChange(index, 'tipo', 'html')} className="mr-2" /> HTML</label>
                                            </div>
                                        </div>
                                        <div>
                                            {modulo.tipo === 'video' ? (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">URL del Video</label>
                                                    <input type="url" required value={modulo.url_contenido} onChange={(e) => handleModuloChange(index, 'url_contenido', e.target.value)} className="w-full text-sm border-gray-300 rounded p-2 border text-black bg-white" />
                                                </div>
                                            ) : (
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                                        {modulo.tipo === 'html'
                                                            ? 'Cargar Nuevo Archivo HTML (Opcional si ya existe)'
                                                            : 'Cargar Nuevo Archivo PDF (Opcional si ya existe)'}
                                                    </label>
                                                    {modulo.id && <p className="text-xs text-blue-600 truncate mb-1">Actual: {modulo.url_contenido}</p>}
                                                    <input
                                                        type="file"
                                                        accept={modulo.tipo === 'html' ? '.html,.htm,text/html' : '.pdf,application/pdf'}
                                                        onChange={(e) => handleModuloChange(index, 'archivoPdf', e.target.files?.[0] || null)}
                                                        className="w-full text-sm text-gray-500 border p-1 border-gray-300 rounded bg-white"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={handleAgregarModulo} className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 font-medium hover:border-blue-400 text-sm">
                                + Agregar Módulo
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
                                <div className="mt-4 sm:pl-6 border-l-0 sm:border-l-2 border-green-300 space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Calificación Mínima Aprobatoria (0 - 100)</label>
                                            <input type="number" min="0" max="100" value={minAprobacion} onChange={(e) => setMinAprobacion(Number(e.target.value))} className="w-full sm:w-32 rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 border p-2 text-black bg-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">Sugerencia: Cargar PDF para extraer preguntas</label>
                                            <input type="file" accept=".pdf,application/pdf" onChange={handleUploadExamenHelper} disabled={isParsing} className="block w-full text-xs text-gray-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-white file:text-green-700 hover:file:bg-green-100 border border-green-300 rounded bg-white p-1" />
                                            {isParsing && <p className="text-[10px] font-bold text-green-600 mt-1 animate-pulse italic">Analizando...</p>}
                                        </div>
                                    </div>

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

                                        <div className="space-y-4">
                                            {preguntasExtraidas.map((p, i) => (
                                                <div key={i} className="bg-white p-4 rounded-lg border border-green-100 shadow-sm relative">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleEliminarPreguntaManual(i)}
                                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                    
                                                    <div className="grid grid-cols-1 gap-4">
                                                        <div className="col-span-full">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full">#{i + 1}</span>
                                                                <label className="text-[10px] font-bold text-gray-500 uppercase">Pregunta</label>
                                                            </div>
                                                            <input 
                                                                type="text" 
                                                                value={p.pregunta} 
                                                                onChange={(e) => handlePreguntaChange(i, 'pregunta', e.target.value)}
                                                                className="w-full text-sm font-medium border-0 border-b border-gray-100 focus:border-green-500 outline-none px-0 pb-1 bg-transparent text-black"
                                                            />
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3">
                                                            {(['a', 'b', 'c', 'd'] as const).map(opt => (
                                                                <div key={opt}>
                                                                    <label className="block text-[10px] font-bold text-gray-400 uppercase">Opción {opt.toUpperCase()}</label>
                                                                    <input 
                                                                        type="text" 
                                                                        value={(p as any)[`opcion_${opt}`]} 
                                                                        onChange={(e) => handlePreguntaChange(i, `opcion_${opt}` as any, e.target.value)}
                                                                        className="w-full text-xs border-0 border-b border-gray-50 focus:border-green-400 outline-none px-0 py-1 bg-transparent text-black"
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="flex items-center gap-4 pt-2">
                                                            <label className="text-xs font-bold text-gray-600 italic">Correcta:</label>
                                                            <div className="flex gap-4">
                                                                {['A', 'B', 'C', 'D'].map(letter => (
                                                                    <label key={letter} className="flex items-center gap-1 cursor-pointer">
                                                                        <input 
                                                                            type="radio" 
                                                                            name={`correct_edit_${i}`} 
                                                                            checked={p.respuesta_correcta === letter}
                                                                            onChange={() => handlePreguntaChange(i, 'respuesta_correcta', letter)}
                                                                            className="h-3 w-3 text-green-600"
                                                                        />
                                                                        <span className="text-xs font-bold text-gray-700">{letter}</span>
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

                    {/* Nota de Historial */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2 flex items-center">
                            <History className="h-5 w-5 mr-2 text-gray-500" /> 4. Nota de Actualización
                        </h2>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Describe brevemente qué cambiaste (Se guardará en el historial):
                        </label>
                        <input 
                            type="text" 
                            required 
                            value={historialMensaje} 
                            onChange={(e) => setHistorialMensaje(e.target.value)}
                            placeholder="Ej. Se actualizó el precio y se añadió el módulo 5."
                            className="block w-full border-gray-300 rounded-md p-3 text-sm border text-black bg-blue-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <div className="pt-6 border-t border-gray-200">
                        {estadoActual === 'aprobado' || tieneBorrador ? (
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700">
                                            <strong>Estás editando un borrador:</strong> Este curso actualmente está aprobado y público. Los cambios que guardes aquí se almacenarán como un borrador pendiente de revisión por el administrador, sin afectar la versión pública ni a tus alumnos actuales hasta que se apruebe.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                                <div className="flex">
                                    <div className="ml-3">
                                        <p className="text-sm text-yellow-700">
                                            <strong>Importante:</strong> Al guardar los cambios, el curso pasará a estado <strong>Pendiente de Aprobación</strong>. Dejará de mostrarse en el catálogo principal hasta que un administrador revise y apruebe las modificaciones.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <button type="submit" disabled={saving} className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
                            {saving ? 'Guardando cambios...' : (estadoActual === 'aprobado' ? 'Guardar Borrador y Solicitar Revisión' : 'Guardar Cambios y Solicitar Revisión')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
