'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, X, FileText, PlayCircle, Trash2 } from 'lucide-react'

type Curso = any;

export default function AdminCursosPage() {
    const [cursos, setCursos] = useState<Curso[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Preview Modal state
    const [previewCurso, setPreviewCurso] = useState<Curso | null>(null)
    const [previewModulos, setPreviewModulos] = useState<any[]>([])
    const [loadingPreview, setLoadingPreview] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchCursos()
    }, [])

    const fetchCursos = async () => {
        const { data } = await supabase.from('ie_cursos').select('*, creador:ie_profiles!creado_por(nombre)').order('created_at', { ascending: false })
        if (data) setCursos(data)
        setLoading(false)
    }

    const handleEstadoChange = async (cursoId: string, newEstado: string) => {
        let razon = '';
        if (newEstado === 'rechazado') {
            const inputRazon = prompt('Por favor, ingresa el motivo del rechazo del curso (este mensaje se enviará al usuario):');
            if (inputRazon === null) return;
            if (inputRazon.trim() === '') {
                alert('Debes ingresar un motivo para poder rechazar el curso.');
                return;
            }
            razon = inputRazon.trim();
        }

        const { error } = await supabase.from('ie_cursos').update({ estado: newEstado }).eq('id', cursoId)
        if (!error) {
            setCursos(cursos.map(c => c.id === cursoId ? { ...c, estado: newEstado } : c))

            if (newEstado === 'rechazado') {
                const cursoRechazado = cursos.find(c => c.id === cursoId);
                try {
                    const response = await fetch('/api/send-rejection-email', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            to: 'sergio.olver@gmail.com',
                            courseTitle: cursoRechazado?.titulo || 'Desconocido',
                            instructorName: cursoRechazado?.creador?.nombre || cursoRechazado?.instructor || 'Instructor',
                            reason: razon
                        })
                    });

                    if (response.ok) {
                        alert(`El curso fue rechazado y se ha enviado un correo a sergio.olver@gmail.com con el motivo.`);
                    } else {
                        const data = await response.json();
                        console.error('API Error:', data.error);
                        alert(`El curso se rechazó en la base de datos, pero hubo un error enviando el correo: ${data.error}`);
                    }
                } catch (err) {
                    console.error('Fetch Error:', err);
                    alert('El curso se rechazó, pero hubo un error intentando enviar el correo.');
                }
            }
        } else {
            alert('Error al actualizar el estado: ' + error.message)
        }
    }

    const handleEliminarCurso = async (cursoId: string) => {
        const confirmar = window.confirm("¿Estás seguro de querer eliminar este curso lógicamente? Desaparecerá del catálogo.");
        if (!confirmar) return;

        // 1. Verificar si tiene compras
        const { data: compras, error: errCompras } = await supabase
            .from('ie_compras')
            .select('id')
            .eq('curso_id', cursoId)
            .limit(1);

        if (errCompras) {
            alert("Error al verificar compras: " + errCompras.message);
            return;
        }

        if (compras && compras.length > 0) {
            alert("No se puede eliminar este curso porque ya ha sido comprado por alumnos.");
            return;
        }

        // 2. Si no hay compras, aplicar borrado lógico
        const { error } = await supabase.from('ie_cursos').update({ estado: 'eliminado' }).eq('id', cursoId);

        if (error) {
            alert("Error al eliminar el curso: " + error.message);
        } else {
            alert("Curso eliminado lógicamente con éxito.");
            setCursos(cursos.map(c => c.id === cursoId ? { ...c, estado: 'eliminado' } : c));
        }
    }

    const handleAprobarCambios = async (cursoId: string, draft: any) => {
        const confirmar = window.confirm("¿Aprobar y publicar estos cambios? Reemplazarán la versión actual del curso en el catálogo.");
        if (!confirmar) return;

        try {
            const res = await fetch('/api/admin/aprobar-borrador', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cursoId, draft })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error);
            }

            alert("Los cambios han sido aprobados y el curso está actualizado");
            fetchCursos();
        } catch (err: any) {
            alert("Error aprobando cambios: " + err.message);
        }
    }

    const handleRechazarCambios = async (cursoId: string) => {
        const confirmar = window.confirm("¿Rechazar estos cambios? El borrador se borrará pero la versión pública original seguirá intacta.");
        if (!confirmar) return;

        await supabase.from('ie_cursos').update({ cambios_pendientes: null }).eq('id', cursoId);
        alert("Borrador rechazado y eliminado.");
        fetchCursos();
    }

    const handleOpenPreview = async (curso: Curso) => {
        setPreviewCurso(curso)
        setLoadingPreview(true)

        // Fetch modules for this course
        const { data } = await supabase
            .from('ie_curso_modulos')
            .select('*')
            .eq('curso_id', curso.id)
            .order('orden', { ascending: true })

        setPreviewModulos(data || [])
        setLoadingPreview(false)
    }

    const closePreview = () => {
        setPreviewCurso(null)
        setPreviewModulos([])
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 relative">
            <h1 className="text-2xl font-bold mb-6">Revisión de Cursos</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar curso por título o instructor..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-black bg-white"
                />
            </div>

            {/* Modal Preview */}
            {previewCurso && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-75 overflow-y-auto">
                    <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
                        <div className="flex justify-between items-center p-5 border-b border-gray-200">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Previsualizando: {previewCurso.titulo}</h2>
                                <p className="text-sm text-gray-500 mt-1">Instructor: {previewCurso.instructor}</p>
                            </div>
                            <button onClick={closePreview} className="text-gray-400 hover:text-gray-600 transition p-1">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto bg-gray-50 flex-grow">
                            {/* Main format info */}
                            <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Información General</h3>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <p><span className="text-gray-500">Duración:</span> {previewCurso.duracion}</p>
                                    <p><span className="text-gray-500">Precio:</span> ${previewCurso.precio}</p>
                                    <p className="col-span-2"><span className="text-gray-500">Beneficios:</span> {previewCurso.beneficios}</p>
                                </div>
                            </div>

                            {/* Contenido (Módulos o Legacy Single URL) */}
                            <div className="mb-6 bg-white p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-3">Contenido (Videos / Documentos)</h3>
                                {loadingPreview ? (
                                    <p className="text-gray-500 text-sm py-4">Cargando material...</p>
                                ) : previewModulos.length > 0 ? (
                                    <ul className="divide-y divide-gray-100">
                                        {previewModulos.map((mod, i) => (
                                            <li key={i} className="py-3 flex items-start gap-3">
                                                <PlayCircle className="h-5 w-5 text-blue-500 mt-0.5" />
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">Módulo {i + 1}: {mod.titulo}</p>
                                                    <a href={mod.url_contenido} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                                                        {mod.url_contenido}
                                                    </a>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                ) : previewCurso.url_contenido ? (
                                    <div className="flex items-start gap-3 py-2">
                                        <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">Documento o Video Principal</p>
                                            <a href={previewCurso.url_contenido} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline text-xs break-all">
                                                {previewCurso.url_contenido}
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-red-500 text-sm">No se encontró contenido para este curso.</p>
                                )}
                            </div>

                            {/* Examen */}
                            {previewCurso.requiere_examen && previewCurso.url_examen && (
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h3 className="text-sm font-semibold text-green-900 uppercase tracking-wider mb-2">Examen / Constancia</h3>
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm text-green-800">El instructor requiere examen en PDF para este curso.</p>
                                        <a href={previewCurso.url_examen} target="_blank" rel="noopener noreferrer" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm font-medium shadow-sm transition">
                                            Ver PDF
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-gray-200 bg-white flex justify-end">
                            <button onClick={closePreview} className="px-5 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
                                Cerrar Previsualización
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Curso</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instructor</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado actual</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase text-center">Revisar Contenido</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acción</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {cursos.filter(c =>
                            c.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.instructor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            c.creador?.nombre?.toLowerCase().includes(searchTerm.toLowerCase())
                        ).filter(c => c.estado !== 'eliminado').map(c => (
                            <tr key={c.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{c.titulo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{c.creador?.nombre || c.instructor}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${c.precio}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${c.estado === 'aprobado' ? 'bg-green-100 text-green-800' : c.estado === 'pendiente' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                                        {c.estado}
                                    </span>
                                    {c.cambios_pendientes && (
                                        <span className="block mt-1 px-2 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                                            Borrador Pendiente
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button
                                        onClick={() => handleOpenPreview(c)}
                                        className="inline-flex items-center px-3 py-1.5 border border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-md text-xs font-medium transition-colors"
                                    >
                                        <Eye className="h-4 w-4 mr-1" /> Ver Módulos
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        {!c.cambios_pendientes && (
                                            <select
                                                value={c.estado}
                                                onChange={(e) => handleEstadoChange(c.id, e.target.value)}
                                                className="block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border text-black bg-white"
                                            >
                                                <option value="pendiente">Pendiente</option>
                                                <option value="aprobado">Aprobado</option>
                                                <option value="rechazado">Rechazado</option>
                                            </select>
                                        )}
                                        <button
                                            onClick={() => handleEliminarCurso(c.id)}
                                            className="text-red-600 hover:text-red-900 p-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors ml-auto"
                                            title="Eliminar curso lógicamente"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                    {c.cambios_pendientes && (
                                        <div className="flex gap-2 w-full mt-1">
                                            <button
                                                onClick={() => handleAprobarCambios(c.id, c.cambios_pendientes)}
                                                className="flex-1 bg-green-100 text-green-800 hover:bg-green-200 px-2 py-1.5 rounded text-xs font-bold transition-colors shadow-sm border border-green-200"
                                            >
                                                Aprobar Edición
                                            </button>
                                            <button
                                                onClick={() => handleRechazarCambios(c.id)}
                                                className="flex-1 bg-red-100 text-red-800 hover:bg-red-200 px-2 py-1.5 rounded text-xs font-bold transition-colors shadow-sm border border-red-200"
                                            >
                                                Rechazar Edición
                                            </button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {cursos.length === 0 && !loading && (
                            <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">No hay cursos creados</td></tr>
                        )}
                        {loading && <tr><td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Cargando...</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
