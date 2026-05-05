'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'


export default function ProfesorVentasPage() {
    const [ventas, setVentas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [totalMonto, setTotalMonto] = useState(0)
    const [perfilIncompleto, setPerfilIncompleto] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchVentas()
    }, [])

    const fetchVentas = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Validar perfil
        const resP = await fetch('/api/perfil')
        const resultP = await resP.json()
        const prof = resultP.data
        if (prof && (prof.rol === 'profesor' || prof.rol === 'vendedor')) {
            if (!prof.telefono || !prof.banco || !prof.clabe) {
                setPerfilIncompleto(true)
                setLoading(false)
                return
            }
        }

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
            
            {perfilIncompleto ? (
                <div className="mt-12 bg-white border border-gray-200 rounded-3xl p-12 flex flex-col items-center text-center shadow-xl">
                    <div className="h-20 w-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-4">¡Acceso Restringido!</h2>
                    <p className="text-gray-600 mb-8 max-w-md text-lg">
                        Para visualizar tus reportes de ventas y comisiones, es obligatorio completar tu perfil con tu <strong>teléfono, banco y CLABE interbancaria</strong>.
                    </p>
                    <a 
                        href="/perfil"
                        className="bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold hover:bg-blue-700 transition-all shadow-lg hover:scale-105 active:scale-95"
                    >
                        Completar mi Perfil
                    </a>
                    <p className="mt-6 text-sm text-gray-400 font-medium uppercase tracking-widest">Falta agregar/actualizar información</p>
                </div>
            ) : (
                <>
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
            </>
            )}
        </div>
    )
}
