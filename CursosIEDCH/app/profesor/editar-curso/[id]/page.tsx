'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, CheckCircle, ArrowLeft, History } from 'lucide-react'
import Link from 'next/link'

type Modulo = {
    id?: string;
    titulo: string;
    tipo: 'video' | 'pdf';
    url_contenido: string;
    archivoPdf: File | null;
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
    })

    const [vigenciaAnos, setVigenciaAnos] = useState<number>(3)
    const [estadoActual, setEstadoActual] = useState('')
    const [tieneBorrador, setTieneBorrador] = useState(false)
    const [modulos, setModulos] = useState<Modulo[]>([])
    const [requierePagoCompleto, setRequierePagoCompleto] = useState(false)
    
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
            })
            setVigenciaAnos(curso.vigencia_anos || 3)
            setEstadoActual(curso.estado)
            setRequierePagoCompleto(curso.requiere_pago_completo || false)

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
                })
                setVigenciaAnos(borrador.vigencia_anos || curso.vigencia_anos || 3)
                if (borrador.modulos) {
                    setModulos(borrador.modulos.map((m: any) => ({
                        id: m.id,
                        titulo: m.titulo,
                        tipo: m.tipo || (m.url_contenido && m.url_contenido.includes('.pdf') ? 'pdf' : 'video'),
                        url_contenido: m.url_contenido,
                        archivoPdf: null,
                    })))
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
                    tipo: m.url_contenido.includes('.pdf') ? 'pdf' : 'video',
                    url_contenido: m.url_contenido,
                    archivoPdf: null,
                })))
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
            if (value === 'pdf') nuevosModulos[index].url_contenido = ''
        }
        setModulos(nuevosModulos)
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
            if (!m.titulo || (m.tipo === 'video' && !m.url_contenido) || (m.tipo === 'pdf' && !m.url_contenido && !m.archivoPdf)) {
                setMensaje('Completa los datos de todos los módulos nuevos.')
                setSaving(false)
                return
            }
        }

        const modulosFinales = []
        for (let i = 0; i < modulos.length; i++) {
            let finalUrl = modulos[i].url_contenido;

            // Subir PDF si es uno nuevo
            if (modulos[i].tipo === 'pdf' && modulos[i].archivoPdf) {
                const file = modulos[i].archivoPdf as File;
                const fileExt = file.name.split('.').pop()
                const fileName = `modulo_${id}_${i}_${Date.now()}.${fileExt}`
                await supabase.storage.from('cursos_contenido').upload(fileName, file)
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
                modulos: modulosFinales
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
        }

        // Registrar Historial
        setMensaje('Registrando en el historial de cambios...')
        await supabase.from('ie_curso_historial').insert({
            curso_id: id,
            modificado_por: user.id,
            detalles_cambio: historialMensaje || 'Actualización de datos y/o módulos del curso',
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
                                                    <label className="block text-xs font-semibold text-gray-600 mb-1">Cargar Nuevo Archivo PDF (Opcional si ya existe)</label>
                                                    {modulo.id && <p className="text-xs text-blue-600 truncate mb-1">Actual: {modulo.url_contenido}</p>}
                                                    <input type="file" accept=".pdf" onChange={(e) => handleModuloChange(index, 'archivoPdf', e.target.files?.[0] || null)} className="w-full text-sm text-gray-500 border p-1 border-gray-300 rounded bg-white" />
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

                    {/* Nota de Historial */}
                    <div>
                        <h2 className="text-lg font-medium text-gray-900 mb-4 border-b pb-2 flex items-center">
                            <History className="h-5 w-5 mr-2 text-gray-500" /> 3. Nota de Actualización
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
