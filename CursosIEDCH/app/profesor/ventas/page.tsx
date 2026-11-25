'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
    ArrowLeft,
    Search,
    ShoppingCart,
    Calendar,
    Clock,
    DollarSign,
    Landmark,
    CreditCard,
    TrendingUp,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Ticket,
    CheckCircle2,
    BookOpen,
    ExternalLink,
    X,
    FileSpreadsheet,
    ShieldCheck
} from 'lucide-react'
import {
    calcularSimulacionGanancias,
    REGIMENES_SIMULADOR,
    RegimenFiscalSimulador
} from '@/lib/simulador-ganancias'

interface VentaItem {
    id: string
    created: number
    paid_at: number | null
    fecha_compra: string
    alumno_nombre: string
    curso_id: string
    curso_titulo: string
    curso_modalidad: string
    curso_limite_inscripcion: string | null
    monto: number
    payment_status: 'paid' | 'unpaid'
    method: string
    origin: string
}

interface DesgloseLoteItem {
    cursoId: string
    cursoTitulo: string
    periodoMes: string
    periodoLabel: string
    modalidad: string
    limite_inscripcion: string | null
    created_at?: string
    ventasPagadas: number
    alumnosCupones: number
    montoNetoTotal: number
    ultimaVentaFecha: Date
    fechaCorte: Date
    fechaPago: Date
    fechaPagoStr: string
    fechaCorteStr: string
    desglose: {
        ventasBrutas: number
        ventaBrutaSubtotal: number
        ivaTrasladadoAlumnos: number
        totalDeduccionStripe: number
        baseDistribuible: number
        participacionEgacTotal: number
        participacionBrutaInstructor: number
        retencionISR: number
        retencionIVA: number
        liquidacionNetaTotal: number
        alumnosPagados: number
    }
}

export default function ProfesorVentasPage() {
    const router = useRouter()
    const supabase = createClient()

    const [cursos, setCursos] = useState<any[]>([])
    const [rawVentas, setRawVentas] = useState<VentaItem[]>([])
    const [loadingCursos, setLoadingCursos] = useState(true)
    const [loadingSearch, setLoadingSearch] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [userProfile, setUserProfile] = useState<any>(null)
    const [perfilIncompleto, setPerfilIncompleto] = useState(false)

    // Filtros de búsqueda superiores
    const [filtroAlumno, setFiltroAlumno] = useState('')
    const [filtroCurso, setFiltroCurso] = useState('')
    const [filtroAnio, setFiltroAnio] = useState('')
    const [filtroMes, setFiltroMes] = useState('')

    // Filtro por método de pago exclusivo para el grid de ventas
    const [filtroMetodoPago, setFiltroMetodoPago] = useState('todos')

    // Paginación
    const [pageSize, setPageSize] = useState(5)
    const [currentPage, setCurrentPage] = useState(1)

    // Modal de desglose de simulación financiera
    const [modalDesgloseItem, setModalDesgloseItem] = useState<DesgloseLoteItem | null>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoadingCursos(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Validar perfil
            const resP = await fetch('/api/perfil')
            const resultP = await resP.json()
            const prof = resultP.data
            if (prof) {
                setUserProfile(prof)
                if (prof.rol === 'instructor' || prof.rol === 'vendedor' || prof.rol === 'institucion') {
                    if (!prof.telefono || !prof.banco || !prof.clabe) {
                        setPerfilIncompleto(true)
                    }
                }
            }

            // Cargar cursos creados por el instructor
            const { data: cursosData } = await supabase
                .from('ie_cursos')
                .select('id, titulo, modalidad, limite_inscripcion, created_at, precio')
                .eq('creado_por', user.id)

            if (cursosData) {
                setCursos(cursosData.sort((a, b) => a.titulo.localeCompare(b.titulo)))
            }
        } catch (e) {
            console.error('Error fetching initial data:', e)
        } finally {
            setLoadingCursos(false)
        }
    }

    // Régimen fiscal activo
    const regimenKey: RegimenFiscalSimulador = useMemo(() => {
        const rf = userProfile?.regimen_fiscal
        if (rf === 'con_rfc') return 'PERSONA_FISICA'
        if (rf === 'persona_moral') return 'PERSONA_MORAL'
        return 'SIN_RFC'
    }, [userProfile])

    const metadataRegimen = REGIMENES_SIMULADOR[regimenKey]

    // Determina si el instructor cuenta con verificación
    const esVerificado = Boolean(userProfile?.verificado)

    // Consulta de ventas a la API
    const ejecutarBusqueda = async () => {
        setLoadingSearch(true)
        setHasSearched(true)
        setCurrentPage(1)

        try {
            const res = await fetch('/api/admin/stripe-sessions')
            const result = await res.json()
            if (res.ok && Array.isArray(result.data)) {
                const mapped: VentaItem[] = result.data.map((t: any) => {
                    const rawDate = t.paid_at || t.created || Math.floor(Date.now() / 1000)
                    return {
                        id: t.id,
                        created: t.created,
                        paid_at: t.paid_at,
                        fecha_compra: new Date(rawDate * 1000).toISOString(),
                        alumno_nombre: t.customer_name || 'Desconocido',
                        curso_id: t.curso_id || '',
                        curso_titulo: t.curso_titulo || 'Curso',
                        curso_modalidad: t.curso_modalidad || 'abierta',
                        curso_limite_inscripcion: t.curso_limite_inscripcion || null,
                        monto: Number(t.amount) || 0,
                        payment_status: t.payment_status === 'paid' ? 'paid' : 'unpaid',
                        method: t.method || 'Tarjeta',
                        origin: t.origin || 'Stripe'
                    }
                }).sort((a: VentaItem, b: VentaItem) => b.created - a.created)

                setRawVentas(mapped)
            } else {
                console.error('Error fetching transactions:', result.error)
            }
        } catch (err) {
            console.error('Fetch error:', err)
        } finally {
            setLoadingSearch(false)
        }
    }

    // Filtrar ventas por alumno, curso, periodo y MÉTODO DE PAGO
    const ventasFiltradas = useMemo(() => {
        if (!hasSearched) return []

        return rawVentas.filter(v => {
            // Filtro por Curso
            if (filtroCurso && v.curso_titulo !== filtroCurso && v.curso_id !== filtroCurso) {
                return false
            }

            // Filtro por Alumno
            if (filtroAlumno.trim()) {
                const query = filtroAlumno.toLowerCase().trim()
                if (!v.alumno_nombre.toLowerCase().includes(query)) {
                    return false
                }
            }

            // Filtro por Año
            if (filtroAnio) {
                const f = new Date(v.fecha_compra)
                if (String(f.getFullYear()) !== filtroAnio) {
                    return false
                }
            }

            // Filtro por Mes
            if (filtroMes) {
                const f = new Date(v.fecha_compra)
                const mo = String(f.getMonth() + 1).padStart(2, '0')
                if (mo !== filtroMes) {
                    return false
                }
            }

            // Filtro por Método de Pago en el Grid de Ventas
            if (filtroMetodoPago !== 'todos') {
                const m = (v.method || '').toLowerCase()
                if (filtroMetodoPago === 'tarjeta' && !m.includes('tarjeta')) return false
                if (filtroMetodoPago === 'oxxo' && !m.includes('oxxo')) return false
                if (filtroMetodoPago === 'transferencia' && !(m.includes('transferencia') || m.includes('depósito') || m.includes('manual'))) return false
                if (filtroMetodoPago === 'cupon' && !(m.includes('cupón') || m.includes('beca'))) return false
            }

            return true
        })
    }, [rawVentas, filtroCurso, filtroAlumno, filtroAnio, filtroMes, filtroMetodoPago, hasSearched])

    // Cálculo de fechas de corte y dispersión según Modalidad y Verificación
    const calcularCorteYPagoCurso = (curso: {
        modalidad?: string
        limite_inscripcion?: string | null
        created_at?: string
    }, fechaRef?: Date) => {
        const esCerrada = curso.modalidad === 'cerrada'
        let fechaCorte: Date

        if (esCerrada) {
            if (curso.limite_inscripcion) {
                const [y, m, d] = curso.limite_inscripcion.split('-').map(Number)
                const lim = new Date(y, m - 1, d)
                // Modalidad cerrada: límite de inscripción + 7 días (gracia de pagos OXXO/aclaraciones)
                fechaCorte = new Date(lim)
                fechaCorte.setDate(lim.getDate() + 7)
            } else {
                const base = curso.created_at ? new Date(curso.created_at) : new Date()
                fechaCorte = new Date(base)
                fechaCorte.setDate(base.getDate() + 37)
            }
        } else {
            // Modalidad abierta: principio a fin de mes.
            const ref = fechaRef ? new Date(fechaRef) : new Date()
            fechaCorte = new Date(ref.getFullYear(), ref.getMonth() + 1, 0)
        }

        // Plazo de pago: 15 días posteriores al corte si es VERIFICADO, 30 días si NO es verificado
        const diasDispersion = esVerificado ? 15 : 30
        const fechaPago = new Date(fechaCorte)
        fechaPago.setDate(fechaCorte.getDate() + diasDispersion)

        return { fechaCorte, fechaPago, diasDispersion }
    }

    // Catálogo de meses para el selector de Mes
    const MESES_OPCIONES = [
        { value: '', label: 'Todos los meses' },
        { value: '01', label: 'Enero' },
        { value: '02', label: 'Febrero' },
        { value: '03', label: 'Marzo' },
        { value: '04', label: 'Abril' },
        { value: '05', label: 'Mayo' },
        { value: '06', label: 'Junio' },
        { value: '07', label: 'Julio' },
        { value: '08', label: 'Agosto' },
        { value: '09', label: 'Septiembre' },
        { value: '10', label: 'Octubre' },
        { value: '11', label: 'Noviembre' },
        { value: '12', label: 'Diciembre' },
    ]

    // Lista dinámica de años disponibles para el selector de Año
    const aniosDisponibles = useMemo(() => {
        const aniosSet = new Set<string>()
        aniosSet.add('2026')
        aniosSet.add('2025')
        const currentYear = new Date().getFullYear()
        aniosSet.add(String(currentYear))

        rawVentas.forEach(v => {
            const d = new Date(v.fecha_compra)
            if (!isNaN(d.getTime())) {
                aniosSet.add(String(d.getFullYear()))
            }
        })

        return Array.from(aniosSet).sort((a, b) => b.localeCompare(a))
    }, [rawVentas])

    // Cálculo de Pagos Pendientes agrupados por Curso y Periodo de Corte Mensual (en Modalidad Abierta)
    const pagosPendientesPorCurso = useMemo<DesgloseLoteItem[]>(() => {
        if (!hasSearched) return []

        const agrupados: Record<string, {
            cursoId: string
            cursoTitulo: string
            periodoMes: string
            periodoLabel: string
            modalidad: string
            limite_inscripcion: string | null
            created_at?: string
            ventasPagadas: number
            alumnosCupones: number
            montoNetoTotal: number
            ultimaVentaFecha: Date
            desglose: {
                ventasBrutas: number
                ventaBrutaSubtotal: number
                ivaTrasladadoAlumnos: number
                totalDeduccionStripe: number
                baseDistribuible: number
                participacionEgacTotal: number
                participacionBrutaInstructor: number
                retencionISR: number
                retencionIVA: number
                liquidacionNetaTotal: number
                alumnosPagados: number
            }
        }> = {}

        // Para agrupar los lotes contables, consideramos las ventas asociadas al curso, año y mes
        const ventasParaLotes = rawVentas.filter(v => {
            if (filtroCurso && v.curso_titulo !== filtroCurso && v.curso_id !== filtroCurso) return false
            if (filtroAlumno.trim()) {
                if (!v.alumno_nombre.toLowerCase().includes(filtroAlumno.toLowerCase().trim())) return false
            }
            if (filtroAnio) {
                const f = new Date(v.fecha_compra)
                if (String(f.getFullYear()) !== filtroAnio) return false
            }
            if (filtroMes) {
                const f = new Date(v.fecha_compra)
                const mo = String(f.getMonth() + 1).padStart(2, '0')
                if (mo !== filtroMes) return false
            }
            return true
        })

        ventasParaLotes.forEach(v => {
            const cursoEncontrado = cursos.find(c => c.titulo === v.curso_titulo || c.id === v.curso_id)
            const mod = cursoEncontrado?.modalidad || v.curso_modalidad || 'abierta'
            const fechaCompra = new Date(v.fecha_compra)

            let key: string
            let periodoLabel: string
            let periodoMes: string

            if (mod === 'cerrada') {
                key = `${v.curso_id || v.curso_titulo}_cerrada`
                periodoMes = 'cerrada'
                periodoLabel = 'Modalidad Cerrada'
            } else {
                // Modalidad abierta: agrupar por mes natural de corte
                const yyyy = fechaCompra.getFullYear()
                const mm = String(fechaCompra.getMonth() + 1).padStart(2, '0')
                periodoMes = `${yyyy}-${mm}`
                const nombreMes = fechaCompra.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                periodoLabel = `Corte ${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)}`
                key = `${v.curso_id || v.curso_titulo}_${periodoMes}`
            }

            if (!agrupados[key]) {
                agrupados[key] = {
                    cursoId: v.curso_id,
                    cursoTitulo: v.curso_titulo,
                    periodoMes,
                    periodoLabel,
                    modalidad: mod,
                    limite_inscripcion: cursoEncontrado?.limite_inscripcion || v.curso_limite_inscripcion || null,
                    created_at: cursoEncontrado?.created_at,
                    ventasPagadas: 0,
                    alumnosCupones: 0,
                    montoNetoTotal: 0,
                    ultimaVentaFecha: fechaCompra,
                    desglose: {
                        ventasBrutas: 0,
                        ventaBrutaSubtotal: 0,
                        ivaTrasladadoAlumnos: 0,
                        totalDeduccionStripe: 0,
                        baseDistribuible: 0,
                        participacionEgacTotal: 0,
                        participacionBrutaInstructor: 0,
                        retencionISR: 0,
                        retencionIVA: 0,
                        liquidacionNetaTotal: 0,
                        alumnosPagados: 0
                    }
                }
            }

            if (fechaCompra > agrupados[key].ultimaVentaFecha) {
                agrupados[key].ultimaVentaFecha = fechaCompra
            }

            const esCuponCero = v.monto === 0 || v.method.toLowerCase().includes('cupón') || v.method.toLowerCase().includes('beca')
            if (esCuponCero && v.monto === 0) {
                agrupados[key].alumnosCupones += 1
            }

            // Solo las compras pagadas suman al monto a liquidar
            if (v.payment_status === 'paid' && v.monto > 0) {
                const sim = calcularSimulacionGanancias({
                    regimen: regimenKey,
                    precioLista: v.monto,
                    alumnos: 1
                })
                agrupados[key].ventasPagadas += 1
                agrupados[key].montoNetoTotal += sim.liquidacionNetaTotal

                const d = agrupados[key].desglose
                d.ventasBrutas += sim.ventasBrutas
                d.ventaBrutaSubtotal += sim.ventaBrutaSubtotal
                d.ivaTrasladadoAlumnos += sim.ivaTrasladadoAlumnos
                d.totalDeduccionStripe += sim.totalDeduccionStripe
                d.baseDistribuible += sim.baseDistribuible
                d.participacionEgacTotal += sim.participacionEgacTotal
                d.participacionBrutaInstructor += sim.participacionBrutaInstructor
                d.retencionISR += sim.retencionISR
                d.retencionIVA += sim.retencionIVA
                d.liquidacionNetaTotal += sim.liquidacionNetaTotal
                d.alumnosPagados += 1
            }
        })

        return Object.values(agrupados)
            .filter(item => item.ventasPagadas > 0 || item.alumnosCupones > 0)
            .map(item => {
                const { fechaPago, fechaCorte } = calcularCorteYPagoCurso({
                    modalidad: item.modalidad,
                    limite_inscripcion: item.limite_inscripcion,
                    created_at: item.created_at
                }, item.ultimaVentaFecha)

                return {
                    ...item,
                    fechaCorte,
                    fechaPago,
                    fechaPagoStr: fechaPago.toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    }),
                    fechaCorteStr: fechaCorte.toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric'
                    })
                }
            })
            .sort((a, b) => a.fechaPago.getTime() - b.fechaPago.getTime())
    }, [rawVentas, filtroCurso, filtroAlumno, filtroAnio, filtroMes, cursos, regimenKey, esVerificado, hasSearched])

    // KPIs Generales
    const kpiVentasRegistradas = ventasFiltradas.length

    const kpiMontoPendiente = useMemo(() => {
        return pagosPendientesPorCurso.reduce((sum, item) => sum + item.montoNetoTotal, 0)
    }, [pagosPendientesPorCurso])

    const kpiPagosPendientes = pagosPendientesPorCurso.length

    const kpiProximoPago = useMemo(() => {
        if (pagosPendientesPorCurso.length === 0) return 'Sin fecha'
        return pagosPendientesPorCurso[0].fechaPagoStr
    }, [pagosPendientesPorCurso])

    // Paginación de ventas
    const totalPages = Math.max(1, Math.ceil(ventasFiltradas.length / pageSize))
    const ventasPaginadas = useMemo(() => {
        const start = (currentPage - 1) * pageSize
        return ventasFiltradas.slice(start, start + pageSize)
    }, [ventasFiltradas, currentPage, pageSize])

    const formatMoneda = (val: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(val)
    }

    const renderMetodoBadge = (metodoStr: string) => {
        const m = (metodoStr || '').toLowerCase()
        if (m.includes('oxxo')) {
            return (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded bg-red-600 text-white font-black text-[9px] tracking-wider uppercase">
                        OXXO
                    </span>
                    <span>OXXO</span>
                </div>
            )
        }
        if (m.includes('transferencia') || m.includes('depósito') || m.includes('manual')) {
            return (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Landmark className="w-4 h-4 text-sky-600" />
                    <span>Transferencia</span>
                </div>
            )
        }
        if (m.includes('cupón') || m.includes('beca')) {
            return (
                <div className="flex items-center gap-1.5 font-medium text-slate-700">
                    <Ticket className="w-4 h-4 text-purple-600" />
                    <span>{m.includes('100%') ? 'Cupón 100%' : 'Cupón'}</span>
                </div>
            )
        }
        return (
            <div className="flex items-center gap-1.5 font-medium text-slate-700">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                <span>Tarjeta</span>
            </div>
        )
    }

    const initialLetra = userProfile?.nombre ? userProfile.nombre.charAt(0).toUpperCase() : 'S'
    const titularNombre = `${userProfile?.nombre || ''} ${userProfile?.apellido_paterno || ''} ${userProfile?.apellido_materno || ''}`.trim() || 'Titular no registrado'
    const maskedClabe = userProfile?.clabe ? `**** **** **** ${userProfile.clabe.slice(-4)}` : '**** **** **** ----'
    const maskedCuenta = userProfile?.clabe && userProfile.clabe.length >= 10
        ? `**** **** **** ${userProfile.clabe.slice(6, 10)}`
        : '**** **** **** ----'

    return (
        <div className="min-h-screen bg-[#F8F9FE] text-slate-800 font-sans pb-16">
            {/* Header Superior con Botón Regresar y Título del Curso */}
            <header className="bg-white border-b border-purple-100/70 sticky top-0 z-30 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.back()}
                            className="p-2 rounded-xl text-slate-600 hover:text-purple-700 hover:bg-purple-50 transition"
                            title="Regresar"
                            data-testid="btn-regresar"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight" data-testid="header-curso-titulo">
                            {filtroCurso ? `Curso: ${filtroCurso}` : 'Ventas'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            {initialLetra}
                        </div>
                        <span className="text-xs font-semibold text-slate-500 hidden sm:inline-block">Ventas</span>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
                {/* Alerta de Perfil Incompleto si faltan datos bancarios */}
                {perfilIncompleto && (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start justify-between gap-4 text-amber-900 shadow-xs">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <strong>Datos bancarios incompletos:</strong> Para recibir las dispersiones de tus pagos es indispensable capturar tu banco, titular y CLABE interbancaria en tu perfil.
                            </div>
                        </div>
                        <Link
                            href="/perfil"
                            className="text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl transition whitespace-nowrap"
                        >
                            Completar Perfil →
                        </Link>
                    </div>
                )}

                {/* Barra de Filtros y Búsqueda */}
                <section className="bg-white rounded-2xl p-5 shadow-xs border border-purple-100/60" data-testid="seccion-filtros">
                    <div className="flex items-center gap-2 text-purple-700 font-bold text-sm mb-4">
                        <TrendingUp className="w-4 h-4" />
                        <span>Ventas</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                        {/* Buscar por nombre de alumno */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                Buscar por nombre
                            </label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={filtroAlumno}
                                    onChange={(e) => setFiltroAlumno(e.target.value)}
                                    placeholder="Nombre del alumno"
                                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
                                    data-testid="input-buscar-alumno"
                                />
                            </div>
                        </div>

                        {/* Buscar por curso */}
                        <div className="md:col-span-3">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                Buscar por curso
                            </label>
                            <div className="relative">
                                <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <select
                                    value={filtroCurso}
                                    onChange={(e) => setFiltroCurso(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition appearance-none cursor-pointer"
                                    data-testid="select-buscar-curso"
                                >
                                    <option value="">Todos los cursos</option>
                                    {cursos.map(c => (
                                        <option key={c.id} value={c.titulo}>
                                            {c.titulo} ({c.modalidad === 'cerrada' ? 'Cerrada' : 'Abierta'})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Buscar por Año */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                Año
                            </label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <select
                                    value={filtroAnio}
                                    onChange={(e) => setFiltroAnio(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition appearance-none cursor-pointer"
                                    data-testid="select-buscar-anio"
                                >
                                    <option value="">Todos los años</option>
                                    {aniosDisponibles.map(yr => (
                                        <option key={yr} value={yr}>
                                            {yr}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Buscar por Mes */}
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-600 mb-1.5">
                                Mes
                            </label>
                            <div className="relative">
                                <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <select
                                    value={filtroMes}
                                    onChange={(e) => setFiltroMes(e.target.value)}
                                    className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition appearance-none cursor-pointer"
                                    data-testid="select-buscar-mes"
                                >
                                    {MESES_OPCIONES.map(m => (
                                        <option key={m.value} value={m.value}>
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Botón Buscar */}
                        <div className="md:col-span-2 flex justify-end">
                            <button
                                onClick={ejecutarBusqueda}
                                disabled={loadingSearch}
                                className="w-full flex items-center justify-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-sm transition hover:shadow-md disabled:opacity-50"
                                data-testid="btn-buscar"
                            >
                                <Search className="w-4 h-4" />
                                <span>{loadingSearch ? 'Buscando...' : 'Buscar'}</span>
                            </button>
                        </div>
                    </div>
                </section>

                {/* Fila de 4 KPIs Principales */}
                <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" data-testid="kpis-resumen">
                    {/* KPI 1: Ventas Registradas */}
                    <div className="bg-white rounded-2xl p-4.5 border border-purple-100/60 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Ventas registradas</p>
                            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight" data-testid="kpi-ventas-registradas">
                                {hasSearched ? kpiVentasRegistradas : '--'}
                            </p>
                        </div>
                    </div>

                    {/* KPI 2: Próximo Pago */}
                    <div className="bg-white rounded-2xl p-4.5 border border-purple-100/60 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Próximo pago</p>
                            <p className="text-base sm:text-lg font-black text-slate-900 tracking-tight" data-testid="kpi-proximo-pago">
                                {hasSearched ? kpiProximoPago : '--/--/----'}
                            </p>
                        </div>
                    </div>

                    {/* KPI 3: Pagos Pendientes */}
                    <div className="bg-white rounded-2xl p-4.5 border border-purple-100/60 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <Clock className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Pagos pendientes</p>
                            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight" data-testid="kpi-pagos-pendientes">
                                {hasSearched ? kpiPagosPendientes : '--'}
                            </p>
                        </div>
                    </div>

                    {/* KPI 4: Monto Pendiente */}
                    <div className="bg-white rounded-2xl p-4.5 border border-purple-100/60 shadow-xs flex items-center gap-3.5">
                        <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Monto pendiente</p>
                            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight text-emerald-600" data-testid="kpi-monto-pendiente">
                                {hasSearched ? formatMoneda(kpiMontoPendiente) : '$0.00'}
                            </p>
                        </div>
                    </div>
                </section>

                {/* Fila Intermedia: 2 Bloques (Datos Bancarios + Pagos Pendientes por Curso) */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Panel Izquierdo: Datos bancarios registrados */}
                    <div className="lg:col-span-5 bg-white rounded-2xl p-5 border border-purple-100/60 shadow-xs flex flex-col justify-between" data-testid="panel-datos-bancarios">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm">
                                    <Landmark className="w-4 h-4 text-purple-600" />
                                    <span>Datos bancarios registrados</span>
                                </div>
                                {/* Badge de Verificado / No verificado */}
                                {esVerificado ? (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200" data-testid="badge-verificado">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        VERIFICADO
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-100 text-amber-800 border border-amber-200" data-testid="badge-no-verificado">
                                        <AlertCircle className="w-3 h-3 text-amber-600" />
                                        NO VERIFICADO
                                    </span>
                                )}
                            </div>

                            <div className="bg-slate-50/80 rounded-xl p-4 border border-slate-100 flex items-start gap-4">
                                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center flex-shrink-0">
                                    <Landmark className="w-6 h-6" />
                                </div>
                                <div className="space-y-1.5 text-xs text-slate-600 flex-1">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-400">Banco:</span>
                                        <span className="font-bold text-slate-900">{userProfile?.banco || 'No registrado'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-400">Titular:</span>
                                        <span className="font-bold text-slate-900 truncate max-w-[170px]" title={titularNombre}>
                                            {titularNombre}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-400">Cuenta:</span>
                                        <span className="font-mono font-bold text-slate-900">{maskedCuenta}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-slate-400">CLABE:</span>
                                        <span className="font-mono font-bold text-slate-900">{maskedClabe}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Nota informativa de plazos y verificación */}
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
                            {esVerificado ? (
                                <p className="text-emerald-700 font-medium">
                                    ✓ <strong>Beneficio de Verificación:</strong> Tus pagos se procesan y dispersan <strong>15 días posteriores</strong> a la fecha de corte.
                                </p>
                            ) : (
                                <p className="text-amber-800 font-medium">
                                    ⚠️ <strong>Cuenta No Verificada:</strong> Tus pagos se programan a <strong>30 días (al mes)</strong>. Completa tu verificación en tu perfil para recibir pagos cada 15 días.{' '}
                                    <Link href="/perfil" className="underline font-bold text-amber-900 hover:text-purple-700">
                                        Verificar aquí
                                    </Link>
                                </p>
                            )}
                            <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                                <span>Régimen Fiscal Activo: <strong className="text-slate-800" data-testid="regimen-activo-titulo">{metadataRegimen.titulo}</strong></span>
                                <Link href="/perfil" className="text-purple-600 hover:text-purple-800 font-bold hover:underline">
                                    Cambiar Régimen Fiscal →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Panel Derecho: Pagos pendientes por curso con Desglose y Separación por Corte Mensual */}
                    <div className="lg:col-span-7 bg-white rounded-2xl p-5 border border-purple-100/60 shadow-xs flex flex-col justify-between" data-testid="panel-pagos-pendientes-curso">
                        <div>
                            <div className="flex items-center gap-2 text-slate-900 font-extrabold text-sm mb-4">
                                <CreditCard className="w-4 h-4 text-purple-600" />
                                <span>Pagos pendientes por curso</span>
                            </div>

                            {/* Tabla compacta de pagos pendientes */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                                            <th className="pb-2.5 font-bold">Monto a pagar</th>
                                            <th className="pb-2.5 font-bold">Curso / Periodo</th>
                                            <th className="pb-2.5 font-bold text-center">Ventas</th>
                                            <th className="pb-2.5 font-bold">Fecha límite</th>
                                            <th className="pb-2.5 font-bold text-center">Estatus</th>
                                            <th className="pb-2.5 font-bold text-right">Desglose</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {pagosPendientesPorCurso.length > 0 ? (
                                            pagosPendientesPorCurso.map((item, idx) => (
                                                <tr key={`${item.cursoId}_${item.periodoMes}_${idx}`} className="hover:bg-purple-50/30 transition">
                                                    {/* Monto Neto */}
                                                    <td className="py-3 font-black text-sm text-slate-900">
                                                        {formatMoneda(item.montoNetoTotal)}
                                                    </td>

                                                    {/* Curso y Periodo de Corte */}
                                                    <td className="py-3 font-semibold text-slate-800">
                                                        <div>{item.cursoTitulo}</div>
                                                        <div className="text-[10px] text-purple-700 font-bold tracking-tight">
                                                            {item.periodoLabel}
                                                        </div>
                                                    </td>

                                                    {/* Ventas con y sin costo */}
                                                    <td className="py-3 text-center">
                                                        <div className="flex flex-col items-center">
                                                            <span className="font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                                                                {item.ventasPagadas} ventas
                                                            </span>
                                                            {item.alumnosCupones > 0 && (
                                                                <span className="text-[10px] text-slate-400 mt-0.5" title="Inscripciones con cupón 100% / beca ($0.00)">
                                                                    +{item.alumnosCupones} cupón
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>

                                                    {/* Fecha Límite */}
                                                    <td className="py-3 text-slate-600 font-medium">
                                                        {item.fechaPagoStr}
                                                    </td>

                                                    {/* Estatus */}
                                                    <td className="py-3 text-center">
                                                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                                            Pendiente
                                                        </span>
                                                    </td>

                                                    {/* Link de Desglose para abrir pantalla emergente */}
                                                    <td className="py-3 text-right">
                                                        <button
                                                            onClick={() => setModalDesgloseItem(item)}
                                                            className="inline-flex items-center gap-1 text-[#7C3AED] hover:text-[#6D28D9] font-bold py-1 px-2.5 rounded-lg bg-purple-50 hover:bg-purple-100 transition"
                                                            data-testid={`btn-desglose-${item.cursoId}`}
                                                            title="Ver desglose financiero de esta liquidación"
                                                        >
                                                            <span>Desglose</span>
                                                            <ExternalLink className="w-3.5 h-3.5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="py-8 text-center text-slate-400">
                                                    {hasSearched
                                                        ? 'No tienes liquidaciones pendientes para los cursos consultados.'
                                                        : 'Realiza una búsqueda para calcular los pagos pendientes.'}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Leyenda explicativa de cortes */}
                        <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex flex-wrap items-center justify-between gap-2">
                            <span>* <strong>Modalidad Abierta:</strong> Desglose por mes natural (1 al último día).</span>
                            <span>* <strong>Modalidad Cerrada:</strong> Cierre de inscripción + 7 días.</span>
                        </div>
                    </div>
                </section>

                {/* Tabla Inferior: Ventas con Filtro por Método de Pago */}
                <section className="bg-white rounded-2xl p-5 border border-purple-100/60 shadow-xs" data-testid="seccion-tabla-ventas">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-2 text-slate-900 font-extrabold text-base">
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                            <span>Ventas</span>
                        </div>

                        {/* Controles del Grid: Filtro por Método de Pago + Paginación */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            {/* Filtro por Método de Pago solicitado */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-medium">Método de pago:</span>
                                <select
                                    value={filtroMetodoPago}
                                    onChange={(e) => {
                                        setFiltroMetodoPago(e.target.value)
                                        setCurrentPage(1)
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500 cursor-pointer"
                                    data-testid="select-filtro-metodo-pago"
                                >
                                    <option value="todos">Todos los métodos</option>
                                    <option value="tarjeta">Tarjeta</option>
                                    <option value="oxxo">OXXO</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="cupon">Cupón</option>
                                </select>
                            </div>

                            {/* Selector de cantidad por página */}
                            <div className="flex items-center gap-1.5">
                                <span className="text-slate-500 font-medium">Mostrar:</span>
                                <select
                                    value={pageSize}
                                    onChange={(e) => {
                                        setPageSize(Number(e.target.value))
                                        setCurrentPage(1)
                                    }}
                                    className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-purple-500"
                                    data-testid="select-page-size"
                                >
                                    <option value={5}>5 por página</option>
                                    <option value={10}>10 por página</option>
                                    <option value={20}>20 por página</option>
                                    <option value={50}>50 por página</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="text-slate-400 font-bold border-b border-slate-100 pb-2">
                                    <th className="pb-3 font-bold">Nombre</th>
                                    <th className="pb-3 font-bold">Fecha</th>
                                    <th className="pb-3 font-bold">Hora</th>
                                    <th className="pb-3 font-bold">Curso</th>
                                    <th className="pb-3 font-bold">Método de pago</th>
                                    <th className="pb-3 font-bold">Monto</th>
                                    <th className="pb-3 font-bold text-right">Estatus</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {ventasPaginadas.length > 0 ? (
                                    ventasPaginadas.map((v) => {
                                        const dateObj = new Date(v.fecha_compra)
                                        const fechaStr = dateObj.toLocaleDateString('es-MX', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric'
                                        })
                                        const horaStr = dateObj.toLocaleTimeString('es-MX', {
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })
                                        const inicial = v.alumno_nombre.charAt(0).toUpperCase()

                                        return (
                                            <tr key={v.id} className="hover:bg-purple-50/20 transition">
                                                {/* Alumno con Avatar */}
                                                <td className="py-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold flex items-center justify-center text-xs flex-shrink-0">
                                                            {inicial}
                                                        </div>
                                                        <span className="font-bold text-slate-900">{v.alumno_nombre}</span>
                                                    </div>
                                                </td>

                                                {/* Fecha */}
                                                <td className="py-3 text-slate-600 font-medium">{fechaStr}</td>

                                                {/* Hora */}
                                                <td className="py-3 text-slate-500 font-medium">{horaStr}</td>

                                                {/* Curso */}
                                                <td className="py-3 text-slate-700 font-semibold">{v.curso_titulo}</td>

                                                {/* Método de Pago */}
                                                <td className="py-3">
                                                    {renderMetodoBadge(v.method)}
                                                </td>

                                                {/* Monto */}
                                                <td className="py-3 font-black text-slate-900">
                                                    {formatMoneda(v.monto)}
                                                </td>

                                                {/* Estatus */}
                                                <td className="py-3 text-right">
                                                    {v.payment_status === 'paid' ? (
                                                        <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200" data-testid="status-pagado">
                                                            Pagado
                                                        </span>
                                                    ) : (
                                                        <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200" data-testid="status-pendiente">
                                                            Pendiente
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        )
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center text-slate-400">
                                            {hasSearched
                                                ? 'No se encontraron ventas para los criterios y método de pago seleccionados.'
                                                : 'Aplica tus filtros y presiona Buscar para listar las ventas registradas.'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer con Paginación */}
                    {ventasFiltradas.length > 0 && (
                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4 text-xs">
                            <span className="text-slate-500 font-medium">
                                Mostrando {(currentPage - 1) * pageSize + 1} a{' '}
                                {Math.min(currentPage * pageSize, ventasFiltradas.length)} de{' '}
                                {ventasFiltradas.length} ventas
                            </span>

                            {/* Controles de Navegación de Página */}
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    data-testid="btn-prev-page"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>

                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`w-7 h-7 rounded-lg font-bold text-xs transition ${
                                            currentPage === pageNumber
                                                ? 'bg-[#7C3AED] text-white'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}

                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                                    data-testid="btn-next-page"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>

                            <select
                                value={pageSize}
                                onChange={(e) => {
                                    setPageSize(Number(e.target.value))
                                    setCurrentPage(1)
                                }}
                                className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-semibold focus:outline-none"
                            >
                                <option value={5}>5 por página</option>
                                <option value={10}>10 por página</option>
                                <option value={20}>20 por página</option>
                            </select>
                        </div>
                    )}
                </section>
            </main>

            {/* Modal Emergente de Desglose Financiero de Simulación */}
            {modalDesgloseItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150" data-testid="modal-desglose">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Cabecera del Modal */}
                        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-6 relative flex-shrink-0">
                            <button
                                onClick={() => setModalDesgloseItem(null)}
                                className="absolute top-5 right-5 text-white/80 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition"
                                data-testid="btn-cerrar-modal"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="flex items-center gap-2 mb-1.5">
                                <FileSpreadsheet className="w-5 h-5 text-purple-200" />
                                <span className="text-xs font-black uppercase tracking-wider text-purple-200">
                                    Simulación Financiera Oficial EGAC 2026
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-black tracking-tight" data-testid="modal-desglose-titulo">
                                Desglose de Liquidación Neta
                            </h2>
                            <p className="text-xs text-purple-100 mt-1">
                                {modalDesgloseItem.cursoTitulo} • <span className="font-bold underline">{modalDesgloseItem.periodoLabel}</span>
                            </p>
                        </div>

                        {/* Contenido scrolleable */}
                        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
                            {/* Card Destacada: Liquidación Neta */}
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4.5 flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                                        Monto Neto a Depositar en Banco:
                                    </p>
                                    <p className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight" data-testid="modal-desglose-monto-neto">
                                        {formatMoneda(modalDesgloseItem.montoNetoTotal)} <span className="text-xs font-bold text-emerald-600">MXN</span>
                                    </p>
                                    <p className="text-[11px] text-emerald-700 mt-0.5">
                                        Fecha estimada de pago: <strong>{modalDesgloseItem.fechaPagoStr}</strong> ({esVerificado ? '15 días tras corte' : '30 días tras corte'})
                                    </p>
                                </div>
                                <div className="text-right">
                                    <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold bg-white text-emerald-800 border border-emerald-300 shadow-2xs">
                                        Régimen: {metadataRegimen.titulo}
                                    </span>
                                    <p className="text-[10px] text-slate-500 mt-1">
                                        Depósito a: <strong>{userProfile?.banco}</strong> (CLABE: {maskedClabe})
                                    </p>
                                </div>
                            </div>

                            {/* Tabla / Lista de Desglose Matemático */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-2.5">
                                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center justify-between">
                                    <span>Concepto Contable</span>
                                    <span>Importe</span>
                                </h3>

                                {/* 1. Ventas brutas */}
                                <div className="flex justify-between items-center py-1">
                                    <div>
                                        <span className="font-semibold text-slate-800">1. Ventas Brutas ({modalDesgloseItem.ventasPagadas} alumnos con pago)</span>
                                        <p className="text-[10px] text-slate-500">Monto total pagado por alumnos</p>
                                    </div>
                                    <span className="font-bold text-slate-900 text-sm">
                                        {formatMoneda(modalDesgloseItem.desglose.ventasBrutas)}
                                    </span>
                                </div>

                                {/* 2. Deducción de pasarela */}
                                <div className="flex justify-between items-center py-1 text-rose-700">
                                    <div>
                                        <span className="font-semibold">2. Comisión Pasarela Stripe</span>
                                        <p className="text-[10px] text-slate-500">3.6% + $3.00 MXN fijas por transacción + 16% IVA</p>
                                    </div>
                                    <span className="font-bold">
                                        -{formatMoneda(modalDesgloseItem.desglose.totalDeduccionStripe)}
                                    </span>
                                </div>

                                {/* 3. Base Distribuible */}
                                <div className="flex justify-between items-center py-1 border-t border-slate-200 pt-2 font-semibold">
                                    <div>
                                        <span className="text-slate-800">3. Base Distribuible (70% Instructor / 30% Plataforma)</span>
                                        <p className="text-[10px] text-slate-500">Ventas subtotal menos pasarela de pago</p>
                                    </div>
                                    <span className="text-slate-900">
                                        {formatMoneda(modalDesgloseItem.desglose.baseDistribuible)}
                                    </span>
                                </div>

                                {/* 4. Participación Bruta del Instructor */}
                                <div className="flex justify-between items-center py-1 text-purple-700 font-bold">
                                    <div>
                                        <span>4. Participación Bruta Instructor (70%)</span>
                                        <p className="text-[10px] text-slate-500 font-normal">Base bruta antes de impuestos SAT</p>
                                    </div>
                                    <span>
                                        {formatMoneda(modalDesgloseItem.desglose.participacionBrutaInstructor)}
                                    </span>
                                </div>

                                {/* 5. Retención ISR */}
                                <div className="flex justify-between items-center py-1 text-rose-700">
                                    <div>
                                        <span className="font-semibold">5. Retención ISR ({regimenKey === 'SIN_RFC' ? '20% Art. 113-A' : '2.5% Reforma 2026'})</span>
                                        <p className="text-[10px] text-slate-500">{metadataRegimen.descripcionISR}</p>
                                    </div>
                                    <span className="font-bold">
                                        -{formatMoneda(modalDesgloseItem.desglose.retencionISR)}
                                    </span>
                                </div>

                                {/* 6. Retención IVA */}
                                <div className="flex justify-between items-center py-1 text-rose-700">
                                    <div>
                                        <span className="font-semibold">6. Retención IVA ({regimenKey === 'SIN_RFC' ? '100% IVA' : '50% IVA'})</span>
                                        <p className="text-[10px] text-slate-500">{metadataRegimen.descripcionIVA}</p>
                                    </div>
                                    <span className="font-bold">
                                        -{formatMoneda(modalDesgloseItem.desglose.retencionIVA)}
                                    </span>
                                </div>

                                {/* Total Neto */}
                                <div className="flex justify-between items-center py-2.5 border-t-2 border-slate-300 font-black text-sm text-emerald-700">
                                    <span>Liquidación Neta Final (Efectivo a recibir)</span>
                                    <span>{formatMoneda(modalDesgloseItem.montoNetoTotal)} MXN</span>
                                </div>
                            </div>

                            {/* Nota de cupones si existen */}
                            {modalDesgloseItem.alumnosCupones > 0 && (
                                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-purple-900 text-[11px] flex items-start gap-2">
                                    <Ticket className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <strong>Inscripciones con Cupón 100% / Beca:</strong> Se registraron{' '}
                                        <strong>{modalDesgloseItem.alumnosCupones}</strong> accesos otorgados con costo de $0.00 MXN. Estos alumnos tienen acceso completo al curso pero no generan importe monetario a liquidar.
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer del Modal */}
                        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end flex-shrink-0">
                            <button
                                onClick={() => setModalDesgloseItem(null)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2 rounded-xl text-xs shadow-sm transition"
                            >
                                Entendido / Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
