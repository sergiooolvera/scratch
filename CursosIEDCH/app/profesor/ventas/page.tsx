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

        const { data: misCursos, error: cursosError } = await supabase
            .from('ie_cursos')
            .select('id, titulo, precio, porcentaje_profesor')
            .eq('creado_por', user.id)

        console.log('[ventas] misCursos:', misCursos, 'error:', cursosError)

        if (!misCursos || misCursos.length === 0) {
            setVentas([])
            setLoading(false)
            return
        }

        const cursoIds = misCursos.map(c => c.id)

        const { data: comprasData, error } = await supabase
            .from('ie_compras')
            .select(`id, fecha_compra, curso_id, user_id, monto_pagado, pago_completo`)
            .in('curso_id', cursoIds)
            .eq('pagado', true)
            .order('fecha_compra', { ascending: false })

        if (error) {
            console.error('Error fetching sales:', error)
            setLoading(false)
            return
        }

        if (comprasData) {
            let total = 0
            const misVentasMapping = comprasData.map((compra: any) => {
                const cursoRef = misCursos.find(c => c.id === compra.curso_id)
                const fallback = compra.pago_completo === false ? 0 : (cursoRef?.precio || 0);
                // Si existe monto_pagado, lo usamos. Si compran viejo sin él, cae al precio original o 0 si usó cupón total
                const montoPagadoPorAlumno = compra.monto_pagado !== null && compra.monto_pagado !== undefined 
                    ? Number(compra.monto_pagado) 
                    : Number(fallback)
                
                total += montoPagadoPorAlumno;
                return { ...compra, curso_titulo: cursoRef?.titulo || 'Desconocido', monto: montoPagadoPorAlumno }
            })

            const userIds = [...new Set(misVentasMapping.map(v => v.user_id))]
            const { data: usersData } = await supabase
                .from('ie_profiles')
                .select('id, nombre, apellido_paterno, apellido_materno')
                .in('id', userIds)

            const ventasCompletas = misVentasMapping.map(venta => {
                const u = usersData?.find(user => user.id === venta.user_id)
                const nombreCompleto = u 
                    ? `${u.nombre || ''} ${u.apellido_paterno || ''} ${u.apellido_materno || ''}`.replace(/\s+/g, ' ').trim() 
                    : 'Alumno (No encontrado)';
                return { ...venta, alumno_nombre: nombreCompleto }
            })

            setVentas(ventasCompletas)
            setTotalMonto(total)
        }
        setLoading(false)
    }

    // ── Omitimos datos de gráficos ────────────────────────────────

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando reporte de ventas...</div>
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Ventas de Cursos</h1>

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
