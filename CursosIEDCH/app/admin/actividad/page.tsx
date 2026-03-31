'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend
} from 'recharts'
import { Users, BookOpen, ShoppingCart, FileText } from 'lucide-react'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AdminActividadPage() {
    const supabase = createClient()
    const [stats, setStats] = useState({ usuarios: 0, cursos: 0, compras: 0, examenes: 0 })
    const [dataCursos, setDataCursos] = useState<any[]>([])
    const [dataMeses, setDataMeses] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchStats() }, [])

    const fetchStats = async () => {
        // Conteos
        const [{ count: usuarios }, { count: cursos }, { count: examenes }] = await Promise.all([
            supabase.from('ie_profiles').select('*', { count: 'exact', head: true }),
            supabase.from('ie_cursos').select('*', { count: 'exact', head: true }),
            supabase.from('ie_resultados_examenes').select('*', { count: 'exact', head: true }),
        ])

        // Compras con info de curso (para gráficos)
        const { data: compras } = await supabase
            .from('ie_compras')
            .select('id, fecha_compra, curso_id, pago_completo, monto_pagado')
            .eq('pagado', true)

        // Cursos (para mapear títulos y precios)
        const { data: cursosData } = await supabase
            .from('ie_cursos')
            .select('id, titulo, precio')

        const cursoMap: Record<string, any> = {}
        cursosData?.forEach(c => { cursoMap[c.id] = c })

        // Ventas por curso
        const porCurso: Record<string, any> = {}
        compras?.forEach(c => {
            const curso = cursoMap[c.curso_id]
            const titulo = curso?.titulo || 'Desconocido'
            if (!porCurso[titulo]) porCurso[titulo] = { nombre: titulo, ventas: 0, monto: 0 }
            porCurso[titulo].ventas += 1
            const fallback = c.pago_completo === false ? 0 : (curso?.precio || 0);
            const monto = c.monto_pagado !== null && c.monto_pagado !== undefined 
                ? Number(c.monto_pagado) 
                : Number(fallback);
            porCurso[titulo].monto += monto
        })
        const cursosSorted = Object.values(porCurso)
            .sort((a: any, b: any) => b.ventas - a.ventas)
            .slice(0, 6) as any[]

        const porMes: Record<string, any> = {}
        compras?.forEach(c => {
            if (!c.fecha_compra) return
            const d = new Date(c.fecha_compra)
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
            const label = d.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })
            const curso = cursoMap[c.curso_id]
            if (!porMes[key]) porMes[key] = { key, label, ventas: 0, monto: 0 }
            porMes[key].ventas += 1
            const fallback = c.pago_completo === false ? 0 : (curso?.precio || 0);
            const monto = c.monto_pagado !== null && c.monto_pagado !== undefined 
                ? Number(c.monto_pagado) 
                : Number(fallback);
            porMes[key].monto += monto
        })
        const mesesSorted = Object.values(porMes)
            .sort((a: any, b: any) => a.key.localeCompare(b.key)) as any[]

        setStats({
            usuarios: usuarios || 0,
            cursos: cursos || 0,
            compras: compras?.length || 0,
            examenes: examenes || 0,
        })
        setDataCursos(cursosSorted)
        setDataMeses(mesesSorted)
        setLoading(false)
    }

    const kpis = [
        { label: 'Total Usuarios', value: stats.usuarios, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Total Cursos', value: stats.cursos, icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50' },
        { label: 'Compras Realizadas', value: stats.compras, icon: ShoppingCart, color: 'text-amber-600', bg: 'bg-amber-50' },
        { label: 'Exámenes Presentados', value: stats.examenes, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    ]

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando estadísticas...</div>

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Actividad y Estadísticas</h1>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                {kpis.map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="bg-white rounded-xl shadow border border-gray-100 p-5 flex items-center gap-4">
                        <div className={`${bg} ${color} p-3 rounded-xl`}>
                            <Icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">{label}</p>
                            <p className={`text-3xl font-extrabold ${color}`}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Gráficos */}
            {stats.compras > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Ventas por curso — Barras */}
                    <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                        <h2 className="text-base font-semibold text-gray-700 mb-4">Ventas por Curso (Top 6)</h2>
                        <ResponsiveContainer width="100%" height={240}>
                            <BarChart data={dataCursos} margin={{ top: 4, right: 12, left: 0, bottom: 60 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="nombre" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" interval={0} />
                                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                <Tooltip formatter={(v: any) => [`${v} alumnos`, 'Ventas']} />
                                <Bar dataKey="ventas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Ingresos por mes — Línea */}
                    <div className="bg-white rounded-xl shadow border border-gray-100 p-6">
                        <h2 className="text-base font-semibold text-gray-700 mb-4">Ingresos por Mes (MXN)</h2>
                        {dataMeses.length > 1 ? (
                            <ResponsiveContainer width="100%" height={240}>
                                <LineChart data={dataMeses} margin={{ top: 4, right: 24, left: 0, bottom: 4 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                                    <YAxis tick={{ fontSize: 11 }} />
                                    <Tooltip formatter={(v: any) => [`$${Number(v).toFixed(2)}`, 'Ingresos']} />
                                    <Legend />
                                    <Line type="monotone" dataKey="monto" name="MXN" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-60 flex items-center justify-center text-gray-400 text-sm">
                                Se necesitan datos de más de 1 mes para mostrar la tendencia.
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
