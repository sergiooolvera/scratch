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

        // Fetch profile to get name
        const { data: profile } = await supabase
            .from('ie_profiles')
            .select('nombre')
            .eq('id', user.id)
            .single()

        const nombreProf = profile?.nombre || 'NombreDesconocidoParaFallo'

        // Fetch courses created by this professor or assigned to them in the text field
        const { data: misCursos } = await supabase
            .from('ie_cursos')
            .select('id, titulo, precio')
            .or(`creado_por.eq.${user.id},instructor.ilike.%${nombreProf}%`)

        if (!misCursos || misCursos.length === 0) {
            setVentas([])
            setLoading(false)
            return
        }

        const cursoIds = misCursos.map(c => c.id)

        // Fetch purchases for these courses
        const { data: comprasData, error } = await supabase
            .from('ie_compras')
            .select(`
                id,
                fecha_compra,
                curso_id,
                user_id
            `)
            .in('curso_id', cursoIds)
            .eq('pagado', true)
            .order('fecha_compra', { ascending: false })

        if (error) {
            console.error('Error fetching sales:', error)
            setLoading(false)
            return
        }

        if (comprasData) {
            // Map course titles manually
            let total = 0
            const misVentasMapping = comprasData.map((compra: any) => {
                const cursoRef = misCursos.find(c => c.id === compra.curso_id)
                const monto = cursoRef?.precio || 0 // Use the course price since it's not in the purchase row
                total += Number(monto)
                return {
                    ...compra,
                    curso_titulo: cursoRef?.titulo || 'Desconocido',
                    monto: monto
                }
            })

            // Fetch users info (optional, for explicit map if inner join requires schema changes)
            const userIds = [...new Set(misVentasMapping.map(v => v.user_id))]
            const { data: usersData } = await supabase
                .from('ie_profiles')
                .select('id, nombre')
                .in('id', userIds)

            const ventasCompletas = misVentasMapping.map(venta => {
                const u = usersData?.find(user => user.id === venta.user_id)
                return {
                    ...venta,
                    alumno_nombre: u?.nombre || 'Alumno (No encontrado)'
                }
            })

            setVentas(ventasCompletas)
            setTotalMonto(total)
        }
        setLoading(false)
    }

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando reporte de ventas...</div>
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">Mis Ventas de Cursos</h1>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-medium text-gray-500">Ingresos Totales (Monto Bruto)</h2>
                    <p className="text-4xl font-extrabold text-blue-600">${totalMonto.toFixed(2)} MXN</p>
                </div>
                <div className="text-right">
                    <h2 className="text-lg font-medium text-gray-500">Total de Ventas</h2>
                    <p className="text-3xl font-bold text-gray-900">{ventas.length}</p>
                </div>
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Alumno</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID de Compra</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {ventas.length > 0 ? (
                                ventas.map((venta) => (
                                    <tr key={venta.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(venta.fecha_compra).toLocaleDateString('es-MX', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {venta.alumno_nombre}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {venta.curso_titulo}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">
                                            {venta.id.split('-')[0]}...
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold text-right">
                                            ${Number(venta.monto).toFixed(2)}
                                        </td>
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
