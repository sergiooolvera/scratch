'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Filter, Calendar, BookOpen, User, DollarSign, ListOrdered, FileText, Search, AlertCircle, ShieldCheck, TrendingUp, Sparkles } from 'lucide-react'
import { calcularSimulacionGanancias, REGIMENES_SIMULADOR, RegimenFiscalSimulador } from '@/lib/simulador-ganancias'

export default function ProfesorVentasPage() {
    const [cursos, setCursos] = useState<any[]>([])
    const [rawVentas, setRawVentas] = useState<any[]>([])
    const [loadingCursos, setLoadingCursos] = useState(true)
    const [loadingSearch, setLoadingSearch] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)
    const [perfilIncompleto, setPerfilIncompleto] = useState(false)
    const [userProfile, setUserProfile] = useState<any>(null)
    const supabase = createClient()

    // Filtros de estado
    const [filtroCurso, setFiltroCurso] = useState('')
    const [filtroAlumno, setFiltroAlumno] = useState('')
    const [filtroFechaInicio, setFiltroFechaInicio] = useState('')
    const [filtroFechaFin, setFiltroFechaFin] = useState('')

    // Determina si al menos un filtro está seleccionado / activo
    const hayFiltroActivo = useMemo(() => {
        return !!filtroCurso || !!filtroAlumno.trim() || !!filtroFechaInicio || !!filtroFechaFin
    }, [filtroCurso, filtroAlumno, filtroFechaInicio, filtroFechaFin])

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        setLoadingCursos(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Validar perfil
        const resP = await fetch('/api/perfil')
        const resultP = await resP.json()
        const prof = resultP.data
        if (prof) {
            setUserProfile(prof)
        }
        if (prof && (prof.rol === 'instructor' || prof.rol === 'vendedor' || prof.rol === 'institucion')) {
            if (!prof.telefono || !prof.banco || !prof.clabe) {
                setPerfilIncompleto(true)
                setLoadingCursos(false)
                return
            }
        }

        // Cargar SOLO los títulos de cursos creados por el instructor actual para poblar el selector rápidamente
        try {
            const { data } = await supabase
                .from('ie_cursos')
                .select('id, titulo, modalidad, limite_inscripcion, created_at')
                .eq('estado', 'aprobado')
                .eq('creado_por', user.id)
            
            if (data) {
                setCursos(data.sort((a, b) => a.titulo.localeCompare(b.titulo)))
            }
        } catch (e) {
            console.error('Error fetching courses list:', e)
        } finally {
            setLoadingCursos(false)
        }
    }

    const buscarVentas = async () => {
        if (!hayFiltroActivo) {
            alert('Por favor, selecciona al menos un filtro antes de buscar.')
            return
        }

        setLoadingSearch(true)
        setHasSearched(true)

        try {
            const res = await fetch('/api/admin/stripe-sessions')
            const result = await res.json()
            if (res.ok) {
                // Stripe + Transferencias manuales aprobadas
                const txs = result.data.filter((t: any) => 
                    t.payment_status === 'paid' && 
                    (t.origin === 'Stripe' || t.origin === 'Stripe (Historial)' || t.origin === 'Manual')
                )
                
                const mappedVentas = txs.map((t: any) => {
                    return {
                        id: t.id,
                        fecha_compra_timestamp: (t.paid_at || t.created),
                        fecha_compra: new Date((t.paid_at || t.created) * 1000).toISOString(),
                        alumno_nombre: t.customer_name,
                        curso_titulo: t.curso_titulo,
                        monto: t.amount
                    }
                }).sort((a: any, b: any) => b.fecha_compra_timestamp - a.fecha_compra_timestamp)
                
                setRawVentas(mappedVentas)
            } else {
                console.error('Error fetching stripe sessions:', result.error)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoadingSearch(false)
        }
    }

    // Aplicar filtros a los datos cargados tras buscar
    const ventasFiltradas = useMemo(() => {
        if (!hasSearched) return []

        return rawVentas.filter(v => {
            // Filtro por Curso
            if (filtroCurso && v.curso_titulo !== filtroCurso) return false

            // Filtro por Alumno
            if (filtroAlumno.trim() && !v.alumno_nombre?.toLowerCase().includes(filtroAlumno.toLowerCase().trim())) {
                return false
            }

            // Filtro por Fecha Inicial
            if (filtroFechaInicio) {
                const fInicio = new Date(filtroFechaInicio + 'T00:00:00')
                if (new Date(v.fecha_compra) < fInicio) return false
            }

            // Filtro por Fecha Final
            if (filtroFechaFin) {
                const fFin = new Date(filtroFechaFin + 'T23:59:59')
                if (new Date(v.fecha_compra) > fFin) return false
            }

            return true
        })
    }, [rawVentas, filtroCurso, filtroAlumno, filtroFechaInicio, filtroFechaFin, hasSearched])

    // Cálculo financiero completo según el Régimen Fiscal activo
    const desgloseFinanciero = useMemo(() => {
        let regimenKey: RegimenFiscalSimulador = 'SIN_RFC'
        const rf = userProfile?.regimen_fiscal
        if (rf === 'con_rfc') {
            regimenKey = 'PERSONA_FISICA'
        } else if (rf === 'persona_moral') {
            regimenKey = 'PERSONA_MORAL'
        }

        const metadata = REGIMENES_SIMULADOR[regimenKey]

        let ventaBrutaTotal = 0
        let participacionBrutaTotal = 0
        let retencionISRTotal = 0
        let retencionIVATotal = 0
        let liquidacionNetaTotal = 0

        ventasFiltradas.forEach(v => {
            const monto = Number(v.monto) || 0
            if (monto > 0) {
                const sim = calcularSimulacionGanancias({
                    regimen: regimenKey,
                    precioLista: monto,
                    alumnos: 1
                })
                ventaBrutaTotal += sim.ventasBrutas
                participacionBrutaTotal += sim.participacionBrutaInstructor
                retencionISRTotal += sim.retencionISR
                retencionIVATotal += sim.retencionIVA
                liquidacionNetaTotal += sim.liquidacionNetaTotal
            }
        })

        return {
            regimenKey,
            metadata,
            ventaBrutaTotal,
            participacionBrutaTotal,
            retencionISRTotal,
            retencionIVATotal,
            liquidacionNetaTotal
        }
    }, [ventasFiltradas, userProfile])

    // Suma total de los montos brutos filtrados
    const totalMontoFiltrado = useMemo(() => {
        return desgloseFinanciero.ventaBrutaTotal
    }, [desgloseFinanciero])

    const limpiarFiltros = () => {
        setFiltroCurso('')
        setFiltroAlumno('')
        setFiltroFechaInicio('')
        setFiltroFechaFin('')
        setRawVentas([])
        setHasSearched(false)
    }

    if (loadingCursos) {
        return <div className="p-8 text-center text-gray-500 font-medium">Iniciando consulta de ventas...</div>
    }

    return (
         <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
            <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Mis Ventas de Cursos</h1>
            
            {/* Estado del Régimen Fiscal */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl p-4 mb-6 shadow-xs">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                        <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Régimen Fiscal Activo:</span>
                            <span className="text-sm font-extrabold text-gray-900" data-testid="regimen-activo-titulo">
                                {desgloseFinanciero.metadata.titulo}
                            </span>
                            <span className="text-xs text-gray-500 font-medium">({desgloseFinanciero.metadata.subtitulo})</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {desgloseFinanciero.metadata.resumenFiscal}
                        </p>
                    </div>
                </div>
                <a 
                    href="/perfil"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3.5 py-2 rounded-xl transition whitespace-nowrap"
                >
                    Cambiar Régimen Fiscal →
                </a>
            </div>

            {userProfile?.regimen_fiscal_estado === 'pendiente' && (
                <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 mb-6 text-sm flex items-start gap-2.5 shadow-xs">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600" />
                    <div>
                        <strong>Cambio de régimen en revisión:</strong> Has solicitado pasar al régimen <strong>{userProfile.regimen_fiscal_solicitado === 'con_rfc' ? 'Con RFC (Persona Física)' : 'Persona Moral'}</strong>. Mientras el administrador valida tu solicitud, tus ventas y liquidaciones se calculan bajo tu régimen activo ({desgloseFinanciero.metadata.titulo}).
                    </div>
                </div>
            )}
            
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
                    <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-8 text-sm">
                        <strong>Consulta Eficiente de Ventas:</strong> Para optimizar la velocidad del sistema, no se cargarán las transacciones hasta que selecciones un filtro y hagas clic en el botón de búsqueda.
                    </div>

                    {(() => {
                        // Si hay un curso filtrado, mostramos el mensaje de pago correspondiente
                        const cursoSeleccionado = cursos.find(c => c.titulo === filtroCurso)
                        if (!cursoSeleccionado) return null

                        const esCerrada = cursoSeleccionado.modalidad === 'cerrada'
                        if (esCerrada) {
                            if (!cursoSeleccionado.limite_inscripcion) {
                                return (
                                    <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 mb-8 text-sm flex items-start gap-2">
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <strong>Modalidad Cerrada:</strong> Aún no has definido una fecha límite de inscripción para este curso. Por favor edítalo para que se pueda calcular tu fecha de pago.
                                        </div>
                                    </div>
                                )
                            }
                            
                            const [y, m, d] = cursoSeleccionado.limite_inscripcion.split('-').map(Number)
                            const baseDate = new Date(y, m - 1, d)
                            
                            const d15 = new Date(baseDate)
                            d15.setDate(baseDate.getDate() + 15)
                            
                            const d16 = new Date(baseDate)
                            d16.setDate(baseDate.getDate() + 16)
                            
                            const d17 = new Date(baseDate)
                            d17.setDate(baseDate.getDate() + 17)

                            const formatMonthYear = (date: Date) => date.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })
                            const formatMonth = (date: Date) => date.toLocaleDateString('es-MX', { month: 'long' })

                            let fechaPagoFormateada = ""
                            const m1 = d15.getMonth()
                            const m2 = d16.getMonth()
                            const m3 = d17.getMonth()
                            const y1 = d15.getFullYear()
                            const y3 = d17.getFullYear()

                            if (m1 === m3 && y1 === y3) {
                                fechaPagoFormateada = `${d15.getDate()}, ${d16.getDate()} o ${d17.getDate()} de ${formatMonthYear(d15)}`
                            } else if (m1 !== m2 && m2 === m3) {
                                fechaPagoFormateada = `${d15.getDate()} de ${formatMonth(d15)}, ${d16.getDate()} o ${d17.getDate()} de ${formatMonthYear(d17)}`
                            } else if (m1 === m2 && m2 !== m3) {
                                fechaPagoFormateada = `${d15.getDate()}, ${d16.getDate()} de ${formatMonth(d15)} o ${d17.getDate()} de ${formatMonthYear(d17)}`
                            } else {
                                fechaPagoFormateada = `${d15.toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})}, ${d16.toLocaleDateString('es-MX', {day: 'numeric', month: 'short'})} o ${d17.toLocaleDateString('es-MX', {day: 'numeric', month: 'short', year: 'numeric'})}`
                            }

                            return (
                                <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl p-4 mb-8 text-sm flex items-start gap-2">
                                    <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5 text-indigo-600" />
                                    <div>
                                        <strong>Modalidad Cerrada:</strong> Al ser un curso de modalidad cerrada, tu pago se procesará 15 días después del cierre de inscripciones. <br />
                                        Tu pago llegará entre los días: <strong className="underline text-indigo-900">{fechaPagoFormateada}</strong>
                                    </div>
                                </div>
                            )
                        } else {
                            // Abierta: A partir de la fecha de creación del curso
                            // Usar el mes actual en el que nos encontramos para indicarle las fechas de pago correspondientes
                            const hoy = new Date()
                            const mesActualNombre = hoy.toLocaleDateString('es-MX', { month: 'long' })
                            const proximoMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
                            const proximoMesNombre = proximoMes.toLocaleDateString('es-MX', { month: 'long' })

                            // Obtener la fecha de creación del curso
                            const fechaCreacion = cursoSeleccionado.created_at ? new Date(cursoSeleccionado.created_at) : null
                            const fechaCreacionFormateada = fechaCreacion ? fechaCreacion.toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            }) : 'la fecha de creación'

                            return (
                                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-4 mb-8 text-sm flex items-start gap-2">
                                    <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-600" />
                                    <div>
                                        <strong>Modalidad Abierta:</strong> Para cursos de modalidad abierta, las comisiones se depositan de manera quincenal a partir de que se creó el curso ({fechaCreacionFormateada}). <br />
                                        Tu pago llegará entre los días: <strong className="underline text-emerald-900">15, 16 o 17 de {mesActualNombre}</strong> (para ventas del 1 al 15) y <strong className="underline text-emerald-900">30 de {mesActualNombre}, 1 o 2 de {proximoMesNombre}</strong> (para ventas del 16 al fin de mes).
                                    </div>
                                </div>
                            )
                        }
                    })()}

                    {/* Panel de Filtros */}
                    <div className="bg-white rounded-2xl border border-gray-250 p-6 shadow-sm mb-8">
                        <div className="flex items-center justify-between border-b border-gray-150 pb-4 mb-6">
                            <div className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-indigo-600" />
                                <h2 className="text-lg font-bold text-gray-800">Filtros de Búsqueda</h2>
                            </div>
                            {hayFiltroActivo && (
                                <button
                                    onClick={limpiarFiltros}
                                    className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition"
                                >
                                    Limpiar Filtros
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* Filtro por Curso */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                                    <span>Curso:</span>
                                </label>
                                <select
                                    value={filtroCurso}
                                    onChange={(e) => setFiltroCurso(e.target.value)}
                                    className="block w-full text-sm rounded-xl border border-gray-300 px-3 py-2 text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">-- Todos los Cursos --</option>
                                    {cursos.map((c) => (
                                        <option key={c.id} value={c.titulo}>{c.titulo}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro por Alumno */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <User className="h-3.5 w-3.5 text-gray-400" />
                                    <span>Alumno:</span>
                                </label>
                                <input
                                    type="text"
                                    value={filtroAlumno}
                                    onChange={(e) => setFiltroAlumno(e.target.value)}
                                    placeholder="Nombre del alumno..."
                                    className="block w-full text-sm rounded-xl border border-gray-300 px-3 py-2 text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>

                            {/* Filtro por Fecha Inicial */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    <span>Fecha Inicial:</span>
                                </label>
                                <input
                                    type="date"
                                    value={filtroFechaInicio}
                                    onChange={(e) => setFiltroFechaInicio(e.target.value)}
                                    className="block w-full text-sm rounded-xl border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>

                            {/* Filtro por Fecha Final */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                                    <span>Fecha Final:</span>
                                </label>
                                <input
                                    type="date"
                                    value={filtroFechaFin}
                                    onChange={(e) => setFiltroFechaFin(e.target.value)}
                                    className="block w-full text-sm rounded-xl border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                />
                            </div>
                        </div>

                        {/* Botón Buscar */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={buscarVentas}
                                disabled={loadingSearch || !hayFiltroActivo}
                                className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold shadow-md transition-all ${
                                    loadingSearch
                                    ? 'bg-blue-300 text-white cursor-wait'
                                    : !hayFiltroActivo
                                        ? 'bg-gray-150 text-gray-400 cursor-not-allowed border border-gray-200'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-[1.02]'
                                }`}
                            >
                                <Search className="h-5 w-5" />
                                <span>{loadingSearch ? 'Buscando ventas...' : 'Buscar Ventas'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Proyección condicional de datos */}
                    {loadingSearch ? (
                        <div className="flex flex-col items-center justify-center p-16 bg-white border border-gray-200 rounded-3xl shadow-sm">
                            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4" />
                            <p className="text-gray-500 text-sm font-medium">Buscando transacciones en la red...</p>
                        </div>
                    ) : hasSearched ? (
                        <>
                            {/* Tarjeta Destacada de Liquidación Neta y Deducciones Fiscales */}
                            <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 border border-slate-700/60" data-testid="desglose-financiero-card">
                                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-700/60 pb-5 mb-6">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                                                Modelo Oficial 70/30
                                            </span>
                                            <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-white font-semibold">
                                                {desgloseFinanciero.metadata.titulo}
                                            </span>
                                        </div>
                                        <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                            Liquidación Neta y Proyección Fiscal
                                        </h3>
                                        <p className="text-xs text-slate-300 mt-1 max-w-xl">
                                            {desgloseFinanciero.metadata.resumenFiscal}
                                        </p>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                                            {desgloseFinanciero.metadata.etiquetaLiquidacion}
                                        </span>
                                        <div className="text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight" data-testid="liquidacion-neta-total">
                                            ${desgloseFinanciero.liquidacionNetaTotal.toFixed(2)} <span className="text-base text-slate-300 font-medium">MXN</span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 mt-0.5">Efectivo depositado en cuenta bancaria</p>
                                    </div>
                                </div>

                                {/* Desglose detallado de las 4 columnas */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ventas Brutas</p>
                                        <p className="text-lg sm:text-xl font-black text-white" data-testid="monto-bruto-total">${desgloseFinanciero.ventaBrutaTotal.toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-400">Total pagado por alumnos</p>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Participación Bruta (70%)</p>
                                        <p className="text-lg sm:text-xl font-black text-indigo-300">${desgloseFinanciero.participacionBrutaTotal.toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-400">Base distribuible instructor</p>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-1">
                                            Retención ISR ({desgloseFinanciero.regimenKey === 'SIN_RFC' ? '20%' : '2.5%'})
                                        </p>
                                        <p className="text-lg sm:text-xl font-black text-rose-400">-${desgloseFinanciero.retencionISRTotal.toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-400">{desgloseFinanciero.metadata.descripcionISR}</p>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                                        <p className="text-[11px] font-bold text-rose-300 uppercase tracking-wider mb-1">
                                            Retención IVA ({desgloseFinanciero.regimenKey === 'SIN_RFC' ? '100%' : '50%'})
                                        </p>
                                        <p className="text-lg sm:text-xl font-black text-rose-400">-${desgloseFinanciero.retencionIVATotal.toFixed(2)}</p>
                                        <p className="text-[10px] text-slate-400">{desgloseFinanciero.metadata.descripcionIVA}</p>
                                    </div>
                                </div>

                                {desgloseFinanciero.regimenKey === 'SIN_RFC' && (
                                    <div className="mt-5 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
                                        <div className="flex items-center gap-2.5">
                                            <Sparkles className="w-5 h-5 text-amber-300 flex-shrink-0" />
                                            <span className="text-slate-200">
                                                💡 <strong>Tip fiscal:</strong> Configurando tu RFC en tu perfil, la retención de ISR disminuye del <strong>20% al 2.5%</strong> y la de IVA al 50%.
                                            </span>
                                        </div>
                                        <a 
                                            href="/perfil" 
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap shadow-sm"
                                        >
                                            Configurar mi RFC →
                                        </a>
                                    </div>
                                )}
                            </div>

                            {/* KPIs Rápidos */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                                        <DollarSign className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Ingresos Totales Brutos</p>
                                        <p className="text-2xl font-black text-blue-600">${totalMontoFiltrado.toFixed(2)}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">MXN (Filtrado)</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center">
                                        <ListOrdered className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total de Ventas</p>
                                        <p className="text-2xl font-black text-gray-900">{ventasFiltradas.length}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">compras registradas</p>
                                    </div>
                                </div>
                                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
                                    <div className="h-12 w-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center">
                                        <BookOpen className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cursos Activos</p>
                                        <p className="text-2xl font-black text-emerald-600">
                                            {new Set(ventasFiltradas.map(v => v.curso_titulo)).size}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-medium">con al menos 1 venta</p>
                                    </div>
                                </div>
                            </div>

                            {/* Tabla de ventas */}
                            <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-250">
                                <div className="px-6 py-4 border-b border-gray-150 flex items-center justify-between bg-white">
                                    <h2 className="text-base font-bold text-gray-800 flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-gray-500" />
                                        <span>Detalle de Ventas Filtradas</span>
                                    </h2>
                                    <span className="text-xs font-bold bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full">
                                        {ventasFiltradas.length} Registro(s)
                                    </span>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-8">#</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Alumno</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Curso</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">ID de Compra</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {ventasFiltradas.length > 0 ? (
                                                ventasFiltradas.map((venta, index) => (
                                                    <tr key={venta.id} className="hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 font-bold">{index + 1}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                            {new Date(venta.fecha_compra).toLocaleDateString('es-MX', {
                                                                year: 'numeric', month: 'short', day: 'numeric',
                                                                hour: '2-digit', minute: '2-digit'
                                                            })}
                                                        </td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{venta.alumno_nombre}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{venta.curso_titulo}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 font-black">${Number(venta.monto).toFixed(2)}</td>
                                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400 font-mono">{venta.id.split('-')[0]}...</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-16 text-center text-gray-400">
                                                        <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                                        </svg>
                                                        <p className="text-lg font-bold text-gray-700 mt-3">Sin resultados coincidentes</p>
                                                        <p className="text-sm text-gray-500 mt-1">Ninguna venta coincide con los criterios de búsqueda aplicados.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    ) : (
                        /* Placeholder amigable cuando no hay filtros aplicados */
                        <div className="bg-white border border-dashed border-gray-300 rounded-3xl p-16 flex flex-col items-center text-center shadow-inner">
                            <div className="h-16 w-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6">
                                <Filter className="h-8 w-8" />
                            </div>
                            <h3 className="text-xl font-extrabold text-gray-900 mb-2">Consulta de Ventas Protegida</h3>
                            <p className="text-gray-500 text-sm max-w-md mx-auto leading-relaxed">
                                Por favor selecciona al menos un filtro (Curso, Alumno o Rango de Fechas) en el panel superior y haz clic en <strong>Buscar Ventas</strong> para cargar la información del reporte.
                            </p>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
