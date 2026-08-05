'use client'

import { useState, useEffect, use, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { eliminarAcademiaAction, getAcademiaDetallesAction } from '@/app/actions/academias'
import { 
    Users, 
    BookOpen, 
    Lightbulb,
    ArrowDown,
    ArrowRight,
    Loader2,
    Settings,
    Search,
    Calendar,
    DollarSign,
    Tag,
    ChevronRight,
    Plus,
    Mail,
    Phone,
    Layers
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function AcademiaDetallePage({ params }: PageProps) {
    const { id } = use(params)
    const router = useRouter()
    const supabase = createClient()

    // Estados de base de datos
    const [academia, setAcademia] = useState<any>(null)
    const [grupos, setGrupos] = useState<any[]>([])
    const [cursos, setCursos] = useState<any[]>([])
    const [alumnos, setAlumnos] = useState<any[]>([])

    // Estados de UI y control
    const [loading, setLoading] = useState(true)
    const [tieneCursos, setTieneCursos] = useState(false)
    const [eliminando, setEliminando] = useState(false)
    const [activeTab, setActiveTab] = useState<'cursos' | 'alumnos' | 'grupos' | 'guia'>('guia')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                // Llamar a la acción de servidor segura
                const res = await getAcademiaDetallesAction(id, user.id)
                if (!res.success || !res.data) {
                    console.error('Error cargando academia:', res.error)
                    router.push('/profesor')
                    return
                }

                const { academia: ac, grupos: grps, cursos: curs, alumnos: als } = res.data
                setAcademia(ac)
                setGrupos(grps || [])
                setCursos(curs || [])
                setAlumnos(als || [])
                setTieneCursos(curs && curs.length > 0)

                // Decidir pestaña inicial por defecto
                if ((grps && grps.length > 0) || (curs && curs.length > 0) || (als && als.length > 0)) {
                    if (curs && curs.length > 0) {
                        setActiveTab('cursos')
                    } else if (als && als.length > 0) {
                        setActiveTab('alumnos')
                    } else {
                        setActiveTab('grupos')
                    }
                } else {
                    setActiveTab('guia')
                }
            } catch (e) {
                console.error('Error cargando academia:', e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [id])

    async function handleEliminarAcademia() {
        if (tieneCursos) {
            alert('No se puede eliminar la academia porque ya tiene cursos asociados en su categoría.')
            return
        }

        if (!confirm(`¿Estás seguro de que deseas eliminar la academia "${academia.nombre}"? Esta acción no se puede deshacer.`)) {
            return
        }

        setEliminando(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('Debes iniciar sesión para realizar esta acción.')
                setEliminando(false)
                return
            }

            const res = await eliminarAcademiaAction(id, user.id)
            if (!res.success) {
                throw new Error(res.error)
            }

            window.location.href = '/profesor'
        } catch (e: any) {
            console.error('Error eliminando academia:', e)
            alert(e.message || 'Ocurrió un error al intentar eliminar la academia.')
        } finally {
            setEliminando(false)
        }
    }

    // Filtrar Cursos
    const filteredCursos = useMemo(() => {
        if (!searchTerm.trim()) return cursos
        const q = searchTerm.toLowerCase().trim()
        return cursos.filter(c => 
            c.titulo.toLowerCase().includes(q) || 
            c.categoria.toLowerCase().includes(q) ||
            c.estado.toLowerCase().includes(q)
        )
    }, [cursos, searchTerm])

    // Filtrar Alumnos
    const filteredAlumnos = useMemo(() => {
        if (!searchTerm.trim()) return alumnos
        const q = searchTerm.toLowerCase().trim()
        return alumnos.filter(a => 
            a.nombre.toLowerCase().includes(q) || 
            a.email.toLowerCase().includes(q) ||
            a.telefono.includes(q) ||
            a.origenes.some((o: string) => o.toLowerCase().includes(q))
        )
    }, [alumnos, searchTerm])

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-slate-400 mt-2">Cargando detalles de la academia...</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] font-sans antialiased text-slate-800 pb-16 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                
                {/* Cabecera / Breadcrumb */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Link href="/profesor" className="hover:text-indigo-600 transition-colors">
                            Panel del Profesor
                        </Link>
                        <span>/</span>
                        <span className="text-slate-600 font-medium">Academias</span>
                        <span>/</span>
                        <span className="text-slate-600 font-semibold">{academia?.nombre}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Botón de Editar Academia */}
                        <Link
                            href={`/profesor/academias/${id}/editar`}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-700 text-xs font-bold transition-all shadow-2xs"
                        >
                            <Settings className="h-3.5 w-3.5" />
                            Editar Academia
                        </Link>

                        {/* Botón de Eliminar Academia */}
                        <button
                            onClick={handleEliminarAcademia}
                            disabled={eliminando}
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                                tieneCursos
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700'
                            }`}
                            title={tieneCursos ? "No puedes eliminar una academia con cursos asociados" : "Eliminar esta academia"}
                        >
                            {eliminando ? 'Eliminando...' : 'Eliminar Academia'}
                        </button>
                    </div>
                </div>

                {/* Cabecera con Logo y Título */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 mb-8 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-2xs">
                    {academia?.logo_url ? (
                        <img 
                            src={academia.logo_url} 
                            alt={academia.nombre} 
                            className="h-20 w-20 rounded-2xl object-cover border border-slate-150 shadow-sm shrink-0" 
                        />
                    ) : (
                        <div 
                            className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shrink-0 shadow-sm" 
                            style={{ backgroundColor: academia?.color_principal || '#6366f1' }}
                        >
                            {academia?.nombre.substring(0, 2).toUpperCase()}
                        </div>
                    )}
                    <div className="text-center sm:text-left flex-1 min-w-0">
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            Academia Activa
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2 truncate">
                            {academia?.nombre}
                        </h1>
                        <p className="text-slate-500 mt-1.5 text-sm max-w-3xl leading-relaxed">
                            {academia?.descripcion || 'Gestiona los grupos, cursos y alumnos inscritos en tu academia.'}
                        </p>
                    </div>
                </div>

                {/* Grid de Tarjetas de Métricas de la Academia */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                            <BookOpen className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">Cursos en Academia</p>
                            <p className="text-2xl font-black text-slate-800 mt-0.5">{cursos.length}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                            <Users className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">Alumnos Registrados</p>
                            <p className="text-2xl font-black text-slate-800 mt-0.5">{alumnos.length}</p>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                            <Layers className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-medium tracking-wide">Grupos Activos</p>
                            <p className="text-2xl font-black text-slate-800 mt-0.5">{grupos.length}</p>
                        </div>
                    </div>
                </div>

                {/* Selector de Pestañas */}
                <div className="flex border-b border-slate-200 mb-6 gap-2 overflow-x-auto pb-px scrollbar-none">
                    <button 
                        onClick={() => { setActiveTab('cursos'); setSearchTerm(''); }}
                        className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                            activeTab === 'cursos' 
                                ? 'border-indigo-600 text-indigo-600' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        <BookOpen className="h-4.5 w-4.5" />
                        Cursos ({cursos.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('alumnos'); setSearchTerm(''); }}
                        className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                            activeTab === 'alumnos' 
                                ? 'border-emerald-600 text-emerald-600' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        <Users className="h-4.5 w-4.5" />
                        Alumnos ({alumnos.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('grupos'); setSearchTerm(''); }}
                        className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                            activeTab === 'grupos' 
                                ? 'border-amber-600 text-amber-600' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        <Layers className="h-4.5 w-4.5" />
                        Grupos ({grupos.length})
                    </button>
                    <button 
                        onClick={() => { setActiveTab('guia'); setSearchTerm(''); }}
                        className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-all shrink-0 ${
                            activeTab === 'guia' 
                                ? 'border-slate-700 text-slate-700' 
                                : 'border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300'
                        }`}
                    >
                        <Lightbulb className="h-4.5 w-4.5" />
                        Guía de Inicio
                    </button>
                </div>

                {/* Contenido de Pestaña Activa */}
                <div className="space-y-6">
                    
                    {/* Búsqueda en caso de Cursos o Alumnos */}
                    {(activeTab === 'cursos' || activeTab === 'alumnos') && (
                        <div className="relative mb-6">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400">
                                <Search className="h-4.5 w-4.5" />
                            </span>
                            <input
                                type="text"
                                placeholder={activeTab === 'cursos' ? 'Buscar cursos por título o categoría...' : 'Buscar alumnos por nombre, correo u origen...'}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-white pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium text-slate-800"
                            />
                        </div>
                    )}

                    {/* PESTAÑA: CURSOS */}
                    {activeTab === 'cursos' && (
                        <div className="space-y-4">
                            {filteredCursos.length > 0 ? (
                                filteredCursos.map((curso) => (
                                    <div 
                                        key={curso.id} 
                                        className="p-5 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:shadow-xs"
                                    >
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
                                                <BookOpen className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-900 text-base leading-snug truncate" title={curso.titulo}>
                                                    {curso.titulo}
                                                </h4>
                                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-slate-400">
                                                    <span className="font-semibold flex items-center gap-1">
                                                        <Tag className="h-3.5 w-3.5" /> {curso.categoria || 'Sin Categoría'}
                                                    </span>
                                                    <span className="text-slate-200 font-normal select-none">|</span>
                                                    <span className="flex items-center gap-1 font-medium">
                                                        <Calendar className="h-3.5 w-3.5" /> Creado: {formatDate(curso.created_at)}
                                                    </span>
                                                </div>
                                                {/* Grupos del curso */}
                                                <div className="flex flex-wrap gap-1.5 mt-2.5">
                                                    {curso.grupos?.map((gNombre: string, index: number) => (
                                                        <span key={index} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                            Grupo: {gNombre}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0">
                                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                                curso.estado === 'aprobado'
                                                    ? 'bg-emerald-50 text-emerald-600'
                                                    : 'bg-amber-50 text-amber-600'
                                            }`}>
                                                {curso.estado === 'aprobado' ? 'Publicado' : 'Borrador'}
                                            </span>
                                            <span className="font-black text-slate-800 text-sm flex items-center sm:mt-1">
                                                <DollarSign className="h-3.5 w-3.5 text-slate-400" />
                                                {formatPrice(curso.precio)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 text-slate-400 text-sm">
                                    No se encontraron cursos en esta academia.
                                </div>
                            )}
                        </div>
                    )}

                    {/* PESTAÑA: ALUMNOS */}
                    {activeTab === 'alumnos' && (
                        <div className="space-y-4">
                            {filteredAlumnos.length > 0 ? (
                                filteredAlumnos.map((alumno) => (
                                    <div 
                                        key={alumno.id} 
                                        className="p-5 bg-white border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:shadow-xs"
                                    >
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className="h-10 w-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100 font-bold">
                                                {alumno.nombre.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-bold text-slate-900 text-base leading-snug truncate">
                                                    {alumno.nombre}
                                                </h4>
                                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1.5 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1.5 font-mono truncate max-w-[240px]">
                                                        <Mail className="h-3.5 w-3.5 text-slate-400" /> {alumno.email}
                                                    </span>
                                                    <span className="hidden sm:inline text-slate-200 font-normal select-none">|</span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Phone className="h-3.5 w-3.5 text-slate-400" /> {alumno.telefono}
                                                    </span>
                                                </div>
                                                {/* Origenes/Grupos */}
                                                <div className="flex flex-wrap gap-1.5 mt-3">
                                                    {alumno.origenes?.map((org: string, index: number) => (
                                                        <span key={index} className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                                            org.startsWith('Directo') 
                                                                ? 'bg-slate-100 text-slate-600' 
                                                                : 'bg-emerald-50 text-emerald-600'
                                                        }`}>
                                                            {org}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0 border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 text-[11px] text-slate-400 font-medium">
                                            <span className="flex items-center gap-1 sm:mt-1">
                                                <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                                Inscrito: {formatDate(alumno.fechaInscripcion)}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 text-slate-400 text-sm">
                                    No se encontraron alumnos registrados en esta academia.
                                </div>
                            )}
                        </div>
                    )}

                    {/* PESTAÑA: GRUPOS */}
                    {activeTab === 'grupos' && (
                        <div className="space-y-4">
                            <div className="flex justify-end mb-2">
                                <Link 
                                    href={`/profesor/academias/${id}/grupos`}
                                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors shadow-2xs"
                                >
                                    <Plus className="h-4 w-4" /> Administrar y Crear Grupos
                                </Link>
                            </div>
                            
                            {grupos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {grupos.map((grupo) => (
                                        <Link 
                                            key={grupo.id}
                                            href={`/profesor/academias/${id}/grupos/${grupo.id}`}
                                            className="p-5 bg-white border border-slate-200/80 rounded-3xl flex items-center justify-between hover:shadow-md hover:border-slate-300 transition group"
                                        >
                                            <div className="flex items-center gap-4 min-w-0">
                                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 border border-indigo-100 overflow-hidden flex items-center justify-center shrink-0">
                                                    {grupo.imagen_url ? (
                                                        <img src={grupo.imagen_url} alt={grupo.nombre} className="h-full w-full object-cover" />
                                                    ) : (
                                                        <Users className="h-6 w-6 text-indigo-600" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-base leading-snug truncate group-hover:text-indigo-600 transition-colors">
                                                        {grupo.nombre}
                                                    </h4>
                                                    <p className="text-xs text-slate-400 mt-1 truncate max-w-[200px]">
                                                        {grupo.descripcion || 'Sin descripción'}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-white rounded-3xl border border-slate-200/80 text-slate-400 text-sm">
                                    No has creado ningún grupo en esta academia.
                                </div>
                            )}
                        </div>
                    )}

                    {/* PESTAÑA: GUÍA DE INICIO */}
                    {activeTab === 'guia' && (
                        <div className="space-y-6">
                            {/* Título de ayuda */}
                            <div className="mb-2 text-center sm:text-left">
                                <h3 className="text-lg font-bold text-slate-900">Guía de puesta en marcha</h3>
                                <p className="text-slate-500 text-xs mt-0.5">Sigue estos pasos para comenzar a ofrecer clases en tu academia.</p>
                            </div>
                            
                            {/* Paso 1: Crear Grupo */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 hover:shadow-md hover:border-indigo-500/20 transition-all group">
                                <div className="flex items-center gap-5 flex-1">
                                    <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 shadow-xs shadow-indigo-100 group-hover:scale-105 transition-transform duration-300">
                                        <Users className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-indigo-600 tracking-wide uppercase">Paso 1</span>
                                        <h3 className="text-xl font-bold text-slate-900">Crear grupo</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                                            Crea un grupo para agregar a tus alumnos y comenzar a organizar tus clases.
                                        </p>
                                    </div>
                                </div>
                                <Link 
                                    href={`/profesor/academias/${id}/grupos`}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl shadow-xs transition-colors shrink-0"
                                >
                                    Crear grupo <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>

                            {/* Conector */}
                            <div className="flex justify-center">
                                <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                                    <ArrowDown className="h-4 w-4" />
                                </div>
                            </div>

                            {/* Paso 2: Crear Curso para Grupo */}
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center gap-6 hover:shadow-md hover:border-emerald-500/20 transition-all group">
                                <div className="flex items-center gap-5 flex-1">
                                    <div className="h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-xs shadow-emerald-100 group-hover:scale-105 transition-transform duration-300">
                                        <BookOpen className="h-8 w-8" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xs font-bold text-emerald-600 tracking-wide uppercase">Paso 2</span>
                                        <h3 className="text-xl font-bold text-slate-900">Crear curso para grupo</h3>
                                        <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                                            Crea tu curso y asígnalo al grupo que acabas de crear.
                                        </p>
                                    </div>
                                </div>
                                <Link 
                                    href={`/profesor/academias/${id}/grupos`}
                                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-6 py-3.5 rounded-2xl shadow-xs transition-colors shrink-0"
                                >
                                    Crear curso para grupo <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    )}

                </div>

                {/* ¿Qué Sigue? */}
                <div className="mt-8 bg-slate-100/50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex items-start gap-4">
                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Lightbulb className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">¿Qué sigue?</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Después de asociar tus cursos y grupos, podrás agregar contenido interactivo, evaluaciones y emitir constancias/certificados a tus alumnos aprobados.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
