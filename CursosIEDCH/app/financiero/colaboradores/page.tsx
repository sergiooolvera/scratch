'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Users, DollarSign, Search, Filter, X, ChevronDown } from 'lucide-react'

interface Colaborador {
    id: string
    nombre: string
    rol: 'profesor' | 'vendedor' | 'institucion'
    referral_code: string | null
    curso_titulo: string
    ventas_con_referido: number
    ventas_sin_referido: number
    total_generado: number
    comision: number
}

interface Perfil {
    id: string
    nombre: string
    apellido_paterno: string
    rol: 'profesor' | 'vendedor' | 'institucion'
    referral_code: string | null
}

interface Curso {
    id: string
    titulo: string
    creado_por: string
    precio: number
}

const MESES = [
    { value: '1', label: 'Enero' }, { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' }, { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' }, { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' }, { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' }, { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' },
]

export default function PagoColaboradoresPage() {
    const [hasSearched, setHasSearched] = useState(false)
    const [loading, setLoading] = useState(false)
    const [loadingCatalog, setLoadingCatalog] = useState(true)

    const [perfiles, setPerfiles] = useState<Perfil[]>([])
    const [cursos, setCursos] = useState<Curso[]>([])

    const [filtroColaborador, setFiltroColaborador] = useState('')
    const [filtroRol, setFiltroRol] = useState('')
    const [filtroCurso, setFiltroCurso] = useState('')
    const [filtroMes, setFiltroMes] = useState('')
    const [filtroAnio, setFiltroAnio] = useState(String(new Date().getFullYear()))

    const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
    const [config, setConfig] = useState({ profesor_base: 0.30, profesor_referido: 0.40, vendedor_referido: 0.20 })

    const router = useRouter()
    const supabase = createClient()
    const anios = Array.from({ length: 3 }, (_, i) => String(new Date().getFullYear() - i))

    useEffect(() => { checkAccessAndLoadCatalog() }, [])

    const checkAccessAndLoadCatalog = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/login'); return }

        const { data: profile } = await supabase.from('ie_profiles').select('rol').eq('id', session.user.id).single()
        if (profile?.rol !== 'financiero') { router.push('/dashboard'); return }

        setLoadingCatalog(true)
        try {
            const { data: configData } = await supabase.from('ie_config_comisiones').select('key, value')
            const configMap: Record<string, number> = {}
            configData?.forEach(c => { configMap[c.key] = Number(c.value) })
            setConfig({
                profesor_base: configMap['profesor_base'] ?? 0.30,
                profesor_referido: configMap['profesor_referido'] ?? 0.40,
                vendedor_referido: configMap['vendedor_referido'] ?? 0.20,
            })

            const [{ data: perfilesData }, { data: cursosData }] = await Promise.all([
                supabase.from('ie_profiles').select('id, nombre, apellido_paterno, rol, referral_code').in('rol', ['profesor', 'vendedor', 'institucion']).eq('activo', true),
                supabase.from('ie_cursos').select('id, titulo, creado_por, precio')
            ])
            setPerfiles(perfilesData || [])
            setCursos(cursosData || [])
        } finally {
            setLoadingCatalog(false)
        }
    }

    const cursosDisponibles = filtroColaborador
        ? cursos.filter(c => c.creado_por === filtroColaborador)
        : filtroRol === 'vendedor'
            ? []
            : cursos

    const handleBuscar = async () => {
        setLoading(true)
        setHasSearched(true)

        try {
            // 1. Traer TODAS las transacciones desde Stripe (con referred_by incluido)
            const res = await fetch('/api/admin/stripe-sessions')
            const result = await res.json()
            if (!res.ok) throw new Error(result.error)

            // 2. Filtrar pagos completados: Stripe + Transferencias manuales aprobadas
            let txs: any[] = (result.data || []).filter((t: any) =>
                t.payment_status === 'paid' && (t.origin === 'Stripe' || t.origin === 'Manual')
            )

            // 3. Filtro de fecha (mes/año)
            if (filtroMes && filtroAnio) {
                const mes = parseInt(filtroMes)
                const anio = parseInt(filtroAnio)
                const desde = new Date(anio, mes - 1, 1).getTime() / 1000
                const hasta = new Date(anio, mes, 1).getTime() / 1000
                txs = txs.filter(t => {
                    const ts = t.paid_at || t.created
                    return ts >= desde && ts < hasta
                })
            } else if (filtroAnio) {
                const anio = parseInt(filtroAnio)
                const desde = new Date(anio, 0, 1).getTime() / 1000
                const hasta = new Date(anio + 1, 0, 1).getTime() / 1000
                txs = txs.filter(t => {
                    const ts = t.paid_at || t.created
                    return ts >= desde && ts < hasta
                })
            }

            // 4. Filtro de curso
            if (filtroCurso) {
                txs = txs.filter(t => t.curso_id === filtroCurso)
            }



            // 5. Perfiles a evaluar
            let perfilesFiltrados = [...perfiles]
            if (filtroColaborador) {
                perfilesFiltrados = perfilesFiltrados.filter(p => p.id === filtroColaborador)
            } else if (filtroRol) {
                perfilesFiltrados = perfilesFiltrados.filter(p => p.rol === filtroRol)
            }

            const cursoMap: Record<string, Curso> = {}
            cursos.forEach(c => { cursoMap[c.id] = c })

            const cfg = config
            const lineas: Colaborador[] = []

            perfilesFiltrados.forEach(p => {
                const nombre = `${p.nombre || ''} ${p.apellido_paterno || ''}`.trim()
                const ventasPorCurso: Record<string, { sinRef: number, conRef: number, total: number, comision: number }> = {}

                txs.forEach(t => {
                    const monto = t.amount || 0
                    const cursoId = t.curso_id
                    const curso = cursoMap[cursoId]
                    if (!curso) return

                    if (!ventasPorCurso[cursoId]) {
                        ventasPorCurso[cursoId] = { sinRef: 0, conRef: 0, total: 0, comision: 0 }
                    }

                    const esPropio = curso.creado_por === p.id
                    const esReferidoSuyo = t.referred_by === p.id

                    if (p.rol === 'profesor' || p.rol === 'institucion') {
                        if (esPropio) {
                            if (esReferidoSuyo) {
                                ventasPorCurso[cursoId].conRef++
                                ventasPorCurso[cursoId].comision += monto * cfg.profesor_referido
                            } else {
                                ventasPorCurso[cursoId].sinRef++
                                ventasPorCurso[cursoId].comision += monto * cfg.profesor_base
                            }
                            ventasPorCurso[cursoId].total += monto
                        } else if (esReferidoSuyo) {
                            ventasPorCurso[cursoId].conRef++
                            ventasPorCurso[cursoId].total += monto
                            ventasPorCurso[cursoId].comision += monto * cfg.vendedor_referido
                        }
                    } else if (p.rol === 'vendedor') {
                        if (esReferidoSuyo) {
                            ventasPorCurso[cursoId].conRef++
                            ventasPorCurso[cursoId].total += monto
                            ventasPorCurso[cursoId].comision += monto * cfg.vendedor_referido
                        }
                    }
                })

                Object.entries(ventasPorCurso).forEach(([cursoId, stats]) => {
                    if (stats.total > 0 || stats.conRef > 0) {
                        lineas.push({
                            id: p.id,
                            nombre,
                            rol: p.rol,
                            referral_code: p.referral_code,
                            curso_titulo: cursoMap[cursoId]?.titulo || 'Curso desconocido',
                            ventas_con_referido: stats.conRef,
                            ventas_sin_referido: stats.sinRef,
                            total_generado: stats.total,
                            comision: stats.comision
                        })
                    }
                })
            })

            const resultado = lineas.sort((a, b) => b.comision - a.comision)
            setColaboradores(resultado)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const limpiarFiltros = () => {
        setFiltroColaborador(''); setFiltroRol(''); setFiltroCurso('')
        setFiltroMes(''); setFiltroAnio(String(new Date().getFullYear()))
        setColaboradores([]); setHasSearched(false)
    }

    const fmt = (n: number) => `$${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN`
    const totalComisiones = colaboradores.reduce((s, c) => s + c.comision, 0)
    const labelMes = filtroMes ? MESES.find(m => m.value === filtroMes)?.label : null

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Pago de Colaboradores</h1>
                <p className="mt-1 text-sm text-gray-500">Comisiones calculadas sobre ventas reales de Stripe + referidos registrados en BD.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                    <p className="text-xs text-green-600 font-medium uppercase tracking-wide">Profesor (base)</p>
                    <p className="text-2xl font-bold text-green-700 mt-1">{(config.profesor_base * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-xs text-blue-600 font-medium uppercase tracking-wide">Profesor (referido propio)</p>
                    <p className="text-2xl font-bold text-blue-700 mt-1">{(config.profesor_referido * 100).toFixed(0)}%</p>
                </div>
                <div className="bg-purple-50 border border-purple-100 rounded-xl p-4">
                    <p className="text-xs text-purple-600 font-medium uppercase tracking-wide">Vendedor (referido)</p>
                    <p className="text-2xl font-bold text-purple-700 mt-1">{(config.vendedor_referido * 100).toFixed(0)}%</p>
                </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 mb-8">
                <div className="flex items-center gap-2 mb-5">
                    <Filter className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-base font-bold text-gray-800">Filtros de búsqueda</h2>
                </div>

                {loadingCatalog ? (
                    <div className="flex items-center gap-2 text-sm text-gray-400 py-4">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-400"></div>
                        Cargando catálogos...
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Tipo</label>
                            <div className="relative">
                                <select value={filtroRol} onChange={e => { setFiltroRol(e.target.value); setFiltroColaborador(''); setFiltroCurso('') }}
                                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-300 pr-8">
                                    <option value="">Todos</option>
                                    <option value="profesor">Profesor</option>
                                    <option value="vendedor">Vendedor</option>
                                </select>
                                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Colaborador</label>
                            <div className="relative">
                                <select value={filtroColaborador} onChange={e => { setFiltroColaborador(e.target.value); setFiltroCurso('') }}
                                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-300 pr-8">
                                    <option value="">Todos</option>
                                    {perfiles.filter(p => !filtroRol || p.rol === filtroRol).map(p => (
                                        <option key={p.id} value={p.id}>
                                            {`${p.nombre || ''} ${p.apellido_paterno || ''}`.trim() || 'Sin nombre'} ({p.rol})
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Curso</label>
                            <div className="relative">
                                <select value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}
                                    disabled={filtroRol === 'vendedor' && !filtroColaborador}
                                    className="w-full appearance-none border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-300 pr-8 disabled:bg-gray-50 disabled:text-gray-300">
                                    <option value="">Todos los cursos</option>
                                    {cursosDisponibles.map(c => <option key={c.id} value={c.id}>{c.titulo}</option>)}
                                </select>
                                <ChevronDown className="absolute right-2 top-3 w-4 h-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Período</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <select value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
                                        className="w-full appearance-none border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-300 pr-6">
                                        <option value="">Todo</option>
                                        {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-1 top-3 w-3 h-3 text-gray-400 pointer-events-none" />
                                </div>
                                <div className="relative w-20">
                                    <select value={filtroAnio} onChange={e => setFiltroAnio(e.target.value)}
                                        className="w-full appearance-none border border-gray-200 rounded-lg px-2 py-2.5 text-sm bg-white focus:ring-2 focus:ring-indigo-300 pr-5">
                                        {anios.map(a => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                    <ChevronDown className="absolute right-1 top-3 w-3 h-3 text-gray-400 pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100">
                    <button onClick={handleBuscar} disabled={loading || loadingCatalog}
                        className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm">
                        <Search className="w-4 h-4" />
                        {loading ? 'Calculando...' : 'Calcular Comisiones'}
                    </button>
                    {hasSearched && (
                        <button onClick={limpiarFiltros}
                            className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <X className="w-4 h-4" /> Limpiar
                        </button>
                    )}
                </div>
            </div>

            {!hasSearched && !loading && (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white border border-dashed border-gray-200 rounded-2xl">
                    <Filter className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-sm font-medium">Selecciona los filtros y presiona <span className="font-bold text-indigo-500">Calcular Comisiones</span></p>
                </div>
            )}

            {loading && (
                <div className="flex justify-center py-20">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
                </div>
            )}

            {hasSearched && !loading && (
                <>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 mb-6">
                        <div className="bg-amber-50 rounded-xl p-3">
                            <DollarSign className="w-7 h-7 text-amber-500" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total a pagar{labelMes && filtroAnio ? ` — ${labelMes} ${filtroAnio}` : filtroAnio ? ` — ${filtroAnio}` : ''}</p>
                            <p className="text-3xl font-extrabold text-gray-900">{fmt(totalComisiones)}</p>
                        </div>
                    </div>

                    <div className="bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Users className="w-5 h-5 text-indigo-500" />
                            <h2 className="text-lg font-bold text-gray-900">Desglose por Colaborador</h2>
                            <span className="ml-auto text-xs text-gray-400">{colaboradores.length} resultado(s)</span>
                        </div>

                        {colaboradores.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <Search className="w-10 h-10 mb-3 opacity-30" />
                                <p className="text-sm">Sin ventas en Stripe para el período y filtros seleccionados.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-4 text-left">Colaborador</th>
                                            <th className="px-6 py-4 text-left">Rol</th>
                                            <th className="px-6 py-4 text-left">Código</th>
                                            <th className="px-6 py-4 text-left">Curso</th>
                                            <th className="px-6 py-4 text-center">Ventas Sin Ref.</th>
                                            <th className="px-6 py-4 text-center">Ventas Con Ref.</th>
                                            <th className="px-6 py-4 text-right">Total Stripe</th>
                                            <th className="px-6 py-4 text-right">Comisión a Pagar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {colaboradores.map((col, idx) => (
                                            <tr key={`${col.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="font-bold text-gray-900">{col.nombre}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        (col.rol === 'profesor' || col.rol === 'institucion') ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                                                    }`}>
                                                        {col.rol}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {col.referral_code ? (
                                                        <span className="font-mono text-xs bg-yellow-50 text-yellow-700 px-2 py-1 rounded border border-yellow-100">
                                                            {col.referral_code}
                                                        </span>
                                                    ) : <span className="text-gray-400">-</span>}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-gray-600 max-w-[200px] truncate" title={col.curso_titulo}>
                                                        {col.curso_titulo}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-center text-gray-500 font-medium">{col.ventas_sin_referido}</td>
                                                <td className="px-6 py-4 text-center text-gray-500 font-medium">{col.ventas_con_referido}</td>
                                                <td className="px-6 py-4 text-right font-bold text-gray-900">{fmt(col.total_generado)}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="text-lg font-black text-green-600">{fmt(col.comision)}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                    <p className="mt-4 text-xs text-gray-400 text-right">
                        * Montos reales de Stripe · Referidos cruzados desde BD · Porcentajes configurables en <code className="bg-gray-100 px-1 rounded">ie_config_comisiones</code>
                    </p>
                </>
            )}
        </div>
    )
}
