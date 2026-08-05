'use client'

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { 
    Users, 
    BookOpen, 
    Award, 
    TrendingUp, 
    X, 
    Search, 
    ArrowUpRight, 
    Calendar,
    DollarSign,
    Tag,
    User,
    ChevronRight,
    Loader2
} from 'lucide-react'
import Link from 'next/link'

export interface DashboardAlumno {
    id: string
    nombre: string
    email: string
    tipo: 'plataforma' | 'academia' | 'actividad'
    contexto: string
    fechaInscripcion: string
}

export interface DashboardCurso {
    id: string
    titulo: string
    categoria: string
    precio: number
    estado: string
    created_at: string
}

interface DashboardStatsSectionProps {
    totalAlumnos: number
    totalCursos: number
    totalCertificados: number
    alumnosList: DashboardAlumno[]
    cursosList: DashboardCurso[]
}

export default function DashboardStatsSection({
    totalAlumnos,
    totalCursos,
    totalCertificados,
    alumnosList,
    cursosList
}: DashboardStatsSectionProps) {
    const [mounted, setMounted] = useState(false)
    const [activeDrawer, setActiveDrawer] = useState<'alumnos' | 'cursos' | null>(null)
    const [drawerSearch, setDrawerSearch] = useState('')
    const [isAnimating, setIsAnimating] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    const handleOpenDrawer = (type: 'alumnos' | 'cursos') => {
        setDrawerSearch('')
        setActiveDrawer(type)
        // Delay slight to trigger enter animation transition
        setTimeout(() => {
            setIsAnimating(true)
        }, 50)
    }

    const handleCloseDrawer = () => {
        setIsAnimating(false)
        // Wait for exit animation transition before unmounting
        setTimeout(() => {
            setActiveDrawer(null)
        }, 300)
    }

    // Cerrar con tecla Escape
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleCloseDrawer()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [])

    // Filtrar Alumnos
    const filteredAlumnos = useMemo(() => {
        if (!drawerSearch.trim()) return alumnosList
        const query = drawerSearch.toLowerCase().trim()
        return alumnosList.filter(al => 
            al.nombre.toLowerCase().includes(query) || 
            al.email.toLowerCase().includes(query) ||
            al.contexto.toLowerCase().includes(query)
        )
    }, [alumnosList, drawerSearch])

    // Filtrar Cursos
    const filteredCursos = useMemo(() => {
        if (!drawerSearch.trim()) return cursosList
        const query = drawerSearch.toLowerCase().trim()
        return cursosList.filter(cur => 
            cur.titulo.toLowerCase().includes(query) || 
            cur.categoria.toLowerCase().includes(query) ||
            cur.estado.toLowerCase().includes(query)
        )
    }, [cursosList, drawerSearch])

    // Formatear precios
    const formatPrice = (price: number) => {
        if (price === 0) return 'Gratis'
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(price)
    }

    // Formatear fecha
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr)
            return date.toLocaleDateString('es-MX', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        } catch {
            return dateStr
        }
    }

    return (
        <>
            {/* Grid de Tarjetas de Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {/* Alumnos */}
                <div 
                    onClick={() => handleOpenDrawer('alumnos')}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md hover:border-emerald-200 hover:scale-[1.01] transition-all duration-300 cursor-pointer group"
                >
                    <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400 font-medium tracking-wide">Alumnos</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{totalAlumnos.toLocaleString()}</p>
                        <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 mt-0.5">
                            Ver detalles <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </div>

                {/* Cursos Publicados */}
                <div 
                    onClick={() => handleOpenDrawer('cursos')}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md hover:border-indigo-200 hover:scale-[1.01] transition-all duration-300 cursor-pointer group"
                >
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400 font-medium tracking-wide">Cursos publicados</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{totalCursos}</p>
                        <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 mt-0.5">
                            Ver detalles <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </div>

                {/* Certificados Emitidos (No interactivo pero con estilo premium) */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                        <Award className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-medium tracking-wide">Certificados emitidos</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">{totalCertificados.toLocaleString()}</p>
                        <span className="text-[11px] font-medium text-slate-400 flex items-center gap-0.5 mt-0.5">
                            ↑ 15% <span className="text-slate-400 font-normal">vs mes anterior</span>
                        </span>
                    </div>
                </div>

                {/* Mis Ventas */}
                <Link href="/profesor/ventas" className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md hover:border-indigo-300 hover:scale-[1.01] transition-all duration-300 group">
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-100 transition-colors group-hover:scale-110 duration-300">
                        <TrendingUp className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-400 font-medium tracking-wide">Finanzas</p>
                        <p className="text-2xl font-black text-slate-800 mt-0.5">Mis ventas</p>
                        <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-0.5 mt-0.5">
                            Ir al detalle <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                        </span>
                    </div>
                </Link>
            </div>

            {/* Renderizado de los cajones laterales mediante Portals */}
            {mounted && activeDrawer && createPortal(
                <div className="fixed inset-0 z-50 overflow-hidden">
                    {/* Backdrop traslúcido con blur */}
                    <div 
                        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity duration-300 ease-in-out ${
                            isAnimating ? 'opacity-100' : 'opacity-0'
                        }`}
                        onClick={handleCloseDrawer}
                    />

                    <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
                        {/* Panel del Drawer */}
                        <div 
                            className={`w-screen max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out ${
                                isAnimating ? 'translate-x-0' : 'translate-x-full'
                            }`}
                        >
                            {/* Cabecera del Panel */}
                            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                        {activeDrawer === 'alumnos' ? (
                                            <>
                                                <Users className="h-5 w-5 text-emerald-600" />
                                                <span>Listado de Alumnos</span>
                                            </>
                                        ) : (
                                            <>
                                                <BookOpen className="h-5 w-5 text-indigo-600" />
                                                <span>Cursos Publicados</span>
                                            </>
                                        )}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        {activeDrawer === 'alumnos' 
                                            ? 'Visualiza a los alumnos inscritos en tus cursos.' 
                                            : 'Gestiona la lista de los cursos que has publicado.'
                                        }
                                    </p>
                                </div>
                                <button 
                                    onClick={handleCloseDrawer}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Buscador */}
                            <div className="p-4 bg-slate-50 border-b border-slate-100">
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                                        <Search className="h-4.5 w-4.5" />
                                    </span>
                                    <input
                                        type="text"
                                        placeholder={
                                            activeDrawer === 'alumnos' 
                                                ? 'Buscar por nombre, correo u origen...' 
                                                : 'Buscar por título o categoría...'
                                        }
                                        value={drawerSearch}
                                        onChange={(e) => setDrawerSearch(e.target.value)}
                                        className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                                    />
                                </div>
                            </div>

                            {/* Contenido (Listado) */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {activeDrawer === 'alumnos' ? (
                                    filteredAlumnos.length > 0 ? (
                                        filteredAlumnos.map((alumno) => (
                                            <div 
                                                key={alumno.id} 
                                                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4 transition-all hover:bg-slate-100/50 hover:border-slate-200"
                                            >
                                                <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 font-bold">
                                                    {alumno.nombre.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-bold text-slate-900 text-sm leading-tight truncate">
                                                        {alumno.nombre}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-1 font-mono truncate">
                                                        {alumno.email}
                                                    </p>
                                                    <div className="flex flex-wrap items-center gap-2 mt-2.5">
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                            alumno.tipo === 'plataforma' 
                                                                ? 'bg-indigo-50 text-indigo-600' 
                                                                : alumno.tipo === 'academia'
                                                                ? 'bg-emerald-50 text-emerald-600'
                                                                : 'bg-amber-50 text-amber-600'
                                                        }`}>
                                                            {alumno.tipo === 'plataforma' ? 'Plataforma' : alumno.tipo === 'academia' ? 'Academia' : 'Actividad'}
                                                        </span>
                                                        <span className="text-[10.5px] text-slate-400 font-medium truncate max-w-[200px]" title={alumno.contexto}>
                                                            {alumno.contexto}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end justify-between self-stretch text-[10px] text-slate-400 shrink-0 font-medium">
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {formatDate(alumno.fechaInscripcion)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-400 text-sm">
                                            No se encontraron alumnos con el término de búsqueda.
                                        </div>
                                    )
                                ) : (
                                    filteredCursos.length > 0 ? (
                                        filteredCursos.map((curso) => (
                                            <div 
                                                key={curso.id} 
                                                className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col gap-3 transition-all hover:bg-slate-100/50 hover:border-slate-200"
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="h-9 w-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                                            <BookOpen className="h-4.5 w-4.5" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-bold text-slate-900 text-sm leading-tight truncate" title={curso.titulo}>
                                                                {curso.titulo}
                                                            </h4>
                                                            <span className="inline-flex items-center gap-1 text-[10.5px] text-slate-400 font-semibold mt-1">
                                                                <Tag className="h-3 w-3" /> {curso.categoria || 'Sin Categoría'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider shrink-0 ${
                                                        curso.estado === 'aprobado'
                                                            ? 'bg-emerald-50 text-emerald-600'
                                                            : curso.estado === 'pendiente'
                                                            ? 'bg-amber-50 text-amber-600'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}>
                                                        {curso.estado === 'aprobado' ? 'Publicado' : curso.estado === 'pendiente' ? 'Pendiente' : 'Borrador'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between border-t border-slate-200/60 pt-3 mt-1 text-xs">
                                                    <span className="font-black text-slate-700 flex items-center">
                                                        <DollarSign className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                                        {formatPrice(curso.precio)}
                                                    </span>
                                                    <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Creado: {formatDate(curso.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-12 text-slate-400 text-sm">
                                            No se encontraron cursos con el término de búsqueda.
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    )
}
