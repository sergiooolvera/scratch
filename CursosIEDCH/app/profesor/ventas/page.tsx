'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'


export default function ProfesorVentasPage() {
    const [ventas, setVentas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [totalMonto, setTotalMonto] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        fetchVentas()
    }, [])

    const fetchVentas = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        try {
            const res = await fetch('/api/admin/stripe-sessions')
            const result = await res.json()
            if (res.ok) {
                // Stripe + Transferencias manuales aprobadas
                const txs = result.data.filter((t: any) => 
                    t.payment_status === 'paid' && 
                    (t.origin === 'Stripe' || t.origin === 'Stripe (Historial)' || t.origin === 'Manual')
                )
                
                let total = 0
                const mappedVentas = txs.map((t: any) => {
                    total += t.amount
                    return {
                        id: t.id,
                        fecha_compra_timestamp: (t.paid_at || t.created),
                        fecha_compra: new Date((t.paid_at || t.created) * 1000).toISOString(),
                        alumno_nombre: t.customer_name,
                        curso_titulo: t.curso_titulo,
                        monto: t.amount
                    }
                }).sort((a: any, b: any) => b.fecha_compra_timestamp - a.fecha_compra_timestamp)
                
                setVentas(mappedVentas)
                setTotalMonto(total)
            } else {
                console.error('Error fetching stripe sessions:', result.error)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    // ── Omitimos datos de gráficos ────────────────────────────────

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando reporte de ventas...</div>
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Ventas de Cursos</h1>
            
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-4 mb-8 text-sm">
                <strong>Nota:</strong> Incluye ventas de Stripe y transferencias/depósitos aprobados. Es un aproximado; falta hacer el corte final de cursos vendidos vs dinero ingresado.
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Ingresos Totales</p>
                    <p className="text-3xl font-extrabold text-blue-600">${totalMonto.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">MXN</p>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Total de Ventas</p>
                    <p className="text-3xl font-extrabold text-gray-900">{ventas.length}</p>
                    <p className="text-xs text-gray-400 mt-1">compras registradas</p>
                </div>
                <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                    <p className="text-sm font-medium text-gray-500 mb-1">Cursos Activos</p>
                    <p className="text-3xl font-extrabold text-emerald-600">
                        {new Set(ventas.map(v => v.curso_titulo)).size}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">con al menos 1 venta</p>
                </div>
            </div>

            {/* Graficos removidos por peticion */}

            {/* Tabla de ventas */}
            <div className="bg-white shadow rounded-xl overflow-hidden border border-gray-200">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h2 className="text-base font-semibold text-gray-700">Detalle de Ventas</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID de Compra</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ventas.length > 0 ? (
                                ventas.map((venta) => (
                                    <tr key={venta.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(venta.fecha_compra).toLocaleDateString('es-MX', {
                                                year: 'numeric', month: 'short', day: 'numeric',
                                                hour: '2-digit', minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{venta.alumno_nombre}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{venta.curso_titulo}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-medium">${Number(venta.monto).toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">{venta.id.split('-')[0]}...</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        <p className="text-lg font-medium">Aún no tienes ventas registradas</p>
                                        <p className="text-sm">Tus cursos vendidos aparecerán aquí.</p>
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
