'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Ticket,
    Plus,
    CheckCircle,
    XCircle
} from 'lucide-react'

export default function AdminCuponesPage() {
    const supabase = createClient()
    const [cupones, setCupones] = useState<any[]>([])
    const [cursos, setCursos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Form states
    const [codigo, setCodigo] = useState('')
    const [descuento, setDescuento] = useState(100)
    const [cursoId, setCursoId] = useState('')
    const [usos, setUsos] = useState('')

    // UI state
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [filtroTexto, setFiltroTexto] = useState('')

    useEffect(() => {
        fetchCursos()
        fetchCupones()
    }, [])

    const fetchCursos = async () => {
        const { data, error } = await supabase.from('ie_cursos').select('id, titulo')
        if (!error && data) {
            setCursos(data)
        }
    }

    const fetchCupones = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('ie_cupones')
            .select(`
                *,
                curso:curso_id (titulo)
            `)
            .order('fecha_creacion', { ascending: false })

        if (error) {
            console.error('Error fetching cupones', error)
        } else {
            setCupones(data || [])
        }
        setLoading(false)
    }

    const handleCreateCupon = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (!codigo.trim() || descuento < 1 || descuento > 100) {
            setError('Código y porcentaje (1-100) son requeridos.')
            return
        }

        const nuevoCupon = {
            codigo: codigo.trim().toUpperCase(),
            descuento_porcentaje: Math.floor(descuento),
            usos_disponibles: usos.trim() ? parseInt(usos.trim()) : null,
            curso_id: cursoId || null,
            activo: true
        }

        const { error: insertError } = await supabase
            .from('ie_cupones')
            .insert(nuevoCupon)

        if (insertError) {
            if (insertError.code === '23505') { // Unique constraint violation
                setError('Ese código de cupón ya existe.')
            } else {
                setError('Hubo un error al crear el cupón.')
            }
        } else {
            setSuccess('Cupón creado con éxito.')
            setCodigo('')
            setDescuento(100)
            setCursoId('')
            setUsos('')
            fetchCupones() // reload list
        }
    }

    const handleToggleActivo = async (id: string, currentlyActive: boolean) => {
        const { error } = await supabase
            .from('ie_cupones')
            .update({ activo: !currentlyActive })
            .eq('id', id)

        if (!error) {
            fetchCupones()
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Ticket className="w-6 h-6 mr-2 text-indigo-600" />
                    Gestión de Bonos y Cupones
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Panel de Creación */}
                <div className="col-span-1 bg-white rounded-lg shadow-sm border border-gray-200 p-6 h-fit">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Plus className="w-5 h-5 mr-1" /> Crear Nuevo Cupón</h2>

                    <form onSubmit={handleCreateCupon} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código (Ej. BECA100)</label>
                            <input
                                type="text"
                                value={codigo}
                                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 uppercase font-mono"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Porcentaje de Descuento (1-100%)</label>
                            <div className="flex items-center">
                                <input
                                    type="number"
                                    min="1" max="100"
                                    value={descuento}
                                    onChange={(e) => setDescuento(Number(e.target.value))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                />
                                <span className="ml-2 text-gray-500 font-bold">%</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">100% otorga el curso gratuito.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Aplica para Curso (Opcional)</label>
                            <select
                                value={cursoId}
                                onChange={(e) => setCursoId(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option value="">Todos los cursos (Sitio entero)</option>
                                {cursos.map(c => (
                                    <option key={c.id} value={c.id}>{c.titulo}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Si lo dejas en "Todos los cursos", funcionará para cualquier pago.</p>
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white font-medium py-2 rounded-md hover:bg-indigo-700 transition"
                        >
                            Crear Cupón
                        </button>
                    </form>

                    {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
                    {success && <p className="mt-4 text-sm text-green-600 bg-green-50 p-2 rounded">{success}</p>}
                </div>

                {/* Lista de Cupones */}
                <div className="col-span-1 md:col-span-2 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-bold text-gray-800">Cupones Existentes</h2>
                        <input
                            type="text"
                            placeholder="Buscar cupón o curso..."
                            value={filtroTexto}
                            onChange={(e) => setFiltroTexto(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm w-full sm:w-64"
                        />
                    </div>

                    {loading ? (
                        <div className="p-8 text-center text-gray-500">Cargando cupones...</div>
                    ) : cupones.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No hay cupones creados aún.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descuento</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso Asignado</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {cupones
                                        .filter(c => 
                                            c.codigo.toLowerCase().includes(filtroTexto.toLowerCase()) || 
                                            (c.curso?.titulo || '').toLowerCase().includes(filtroTexto.toLowerCase())
                                        )
                                        .map((c) => (
                                        <tr key={c.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="font-mono font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded">{c.codigo}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium">
                                                {c.descuento_porcentaje}%
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600">
                                                    {c.curso ? c.curso.titulo : <span className="text-gray-400 italic">Todos</span>}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {c.activo ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                        <CheckCircle className="w-3 h-3 mr-1" /> Activo
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <XCircle className="w-3 h-3 mr-1" /> Inactivo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => handleToggleActivo(c.id, c.activo)}
                                                    className={`text-sm ${c.activo ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'}`}
                                                >
                                                    {c.activo ? 'Desactivar' : 'Activar'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
