'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, UserCheck, AlertCircle } from 'lucide-react'

export default function SolicitudesAjustePage() {
    const [solicitudes, setSolicitudes] = useState<any[]>([])
    const [solicitudesGamma, setSolicitudesGamma] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)
    const [processingGamma, setProcessingGamma] = useState<string | null>(null)
    const [errorGamma, setErrorGamma] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        Promise.all([fetchSolicitudes(), fetchSolicitudesGamma()]).finally(() => setLoading(false))
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
        }
    }

    const fetchSolicitudesGamma = async () => {
        try {
            const res = await fetch('/api/admin/solicitudes-gamma')
            const result = await res.json()
            if (res.ok) {
                setSolicitudesGamma(result.data || [])
            } else {
                console.error('Error fetching solicitudes gamma:', result.error)
            }
        } catch (error) {
            console.error('Fetch error:', error)
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

    const aprobarSolicitudGamma = async (userId: string) => {
        setProcessingGamma(userId)
        setErrorGamma(null)
        try {
            const res = await fetch('/api/admin/solicitudes-gamma', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })
            if (res.ok) {
                setSolicitudesGamma(prev => prev.filter(s => s.id !== userId))
            } else {
                const data = await res.json().catch(() => ({}))
                setErrorGamma('Error al aprobar: ' + (data.error || 'Desconocido'))
                console.error("API Error Response:", data)
            }
        } catch (error: any) {
            setErrorGamma('Error de conexión: ' + error.message)
            console.error("API Fetch Error:", error)
        } finally {
            setProcessingGamma(null)
        }
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
                Los siguientes usuarios (instructores o vendedores) han solicitado permiso para modificar sus datos bancarios y de contacto. Al aprobar, sus campos se desbloquearán temporalmente hasta que los guarden de nuevo.
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
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${solicitud.rol === 'instructor' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
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
            <div className="flex items-center gap-3 mt-12 mb-6">
                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                    <AlertCircle className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Solicitudes de Más Intentos (IA Gamma)</h2>
            </div>

            <p className="text-gray-600 mb-8 max-w-2xl">
                Los siguientes instructores han agotado sus intentos de generación de presentaciones con IA y solicitan más. Al aprobar, se sumarán 3 intentos adicionales a su límite actual.
            </p>

            {errorGamma && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-semibold">
                    {errorGamma}
                </div>
            )}

            <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Límite Actual</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {solicitudesGamma.length > 0 ? (
                                solicitudesGamma.map((solicitud) => (
                                    <tr key={solicitud.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900">{solicitud.nombre} {solicitud.apellido_paterno}</span>
                                                <span className="text-xs text-gray-500">ID: {solicitud.id.substring(0,8)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                                                {solicitud.limite_generaciones_gamma ?? 3} intentos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => aprobarSolicitudGamma(solicitud.id)}
                                                disabled={processingGamma === solicitud.id}
                                                className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                                            >
                                                {processingGamma === solicitud.id ? 'Aprobando...' : (
                                                    <>
                                                        <ShieldCheck className="w-4 h-4 mr-2" />
                                                        Aprobar (+3 Intentos)
                                                    </>
                                                )}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={3} className="px-6 py-16 text-center text-gray-500">
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
