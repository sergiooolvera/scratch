'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react'

export default function SolicitudesAjustePage() {
    const [solicitudes, setSolicitudes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        fetchSolicitudes()
    }, [])

    const fetchSolicitudes = async () => {
        try {
            const res = await fetch('/api/admin/solicitudes-ajuste')
            const result = await res.json()
            if (res.ok) {
                setSolicitudes(result.data || [])
            } else {
                console.error('Error fetching solicitudes:', result.error)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const aprobarSolicitud = async (userId: string) => {
        setProcessing(userId)
        try {
            const res = await fetch('/api/admin/solicitudes-ajuste', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })
            if (res.ok) {
                // Remove from list
                setSolicitudes(prev => prev.filter(s => s.id !== userId))
            } else {
                const data = await res.json()
                alert('Error al aprobar: ' + data.error)
            }
        } catch (error) {
            alert('Error de conexión')
        }
        setProcessing(null)
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando solicitudes...</div>
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900">Solicitudes de Ajuste de Datos</h1>
            </div>

            <p className="text-gray-600 mb-8 max-w-2xl">
                Los siguientes usuarios (profesores o vendedores) han solicitado permiso para modificar sus datos bancarios y de contacto. Al aprobar, sus campos se desbloquearán temporalmente hasta que los guarden de nuevo.
            </p>

            <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha de Solicitud</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {solicitudes.length > 0 ? (
                                solicitudes.map((solicitud) => (
                                    <tr key={solicitud.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{solicitud.nombre} {solicitud.apellido_paterno}</span>
                                                <span className="text-xs text-gray-500">ID: {solicitud.id.substring(0,8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${solicitud.rol === 'profesor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                                                {solicitud.rol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(solicitud.created_at).toLocaleDateString('es-MX', {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => aprobarSolicitud(solicitud.id)}
                                                disabled={processing === solicitud.id}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition-colors"
                                            >
                                                {processing === solicitud.id ? 'Aprobando...' : (
                                                    <>
                                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                                        Habilitar Edición
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-16 text-center text-gray-500">
                                        <ShieldCheck className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                                        <p className="text-lg font-medium text-gray-900">No hay solicitudes pendientes</p>
                                        <p className="text-sm">Todo está al día.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
