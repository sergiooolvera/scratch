'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Clock, FileText, ArrowRight, BookOpen, GraduationCap, ChevronRight } from 'lucide-react'

function CursosContent() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const urlQuery = searchParams.get('q')?.toLowerCase().trim() || ''
    const urlCategory = searchParams.get('category') || 'todas'

    const [query, setQuery] = useState(urlQuery)
    const [activeCategory, setActiveCategory] = useState(urlCategory)
    const [rawCursos, setRawCursos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setQuery(urlQuery)
        setActiveCategory(urlCategory)
    }, [urlQuery, urlCategory])

    useEffect(() => {
        const fetchCursos = async () => {
            setLoading(true)
            const MAESTRO_ID = 'f160fe4d-5461-44c5-b868-51f1f0cae4c2'
            const { data } = await supabase
                .from('ie_cursos')
                .select(`
                    id, titulo, descripcion, instructor, precio, estado, es_super_curso, categoria, imagen_url, duracion, created_at,
                    profesor:ie_profiles!creado_por (
                        nombre, apellido_paterno, apellido_materno, fotografia_perfil, verificado, rol
                    )
                `)
                .eq('estado', 'aprobado')
                .neq('creado_por', MAESTRO_ID)

            setRawCursos(data || [])
            setLoading(false)
        }

        fetchCursos()
    }, [supabase])

    // Categorías dinámicas
    const baseCategories = [
        { value: 'todas', label: 'Todas las categorías' },
        { value: 'salud', label: 'Salud' },
        { value: 'negocios', label: 'Negocios' },
        { value: 'tecnologia', label: 'Tecnología' },
        { value: 'desarrollo', label: 'Desarrollo Personal' },
        { value: 'idiomas', label: 'Idiomas' },
        { value: 'arte', label: 'Arte y Diseño' },
        { value: 'ciencias', label: 'Ciencias' },
        { value: 'educacion', label: 'Educación' },
    ]

    const existingValues = new Set(baseCategories.map(c => c.value.toLowerCase()))
    const dbCategories: { value: string; label: string }[] = []

    if (rawCursos) {
        rawCursos.forEach(c => {
            if (c.categoria && c.categoria.trim()) {
                const val = c.categoria.trim()
                const valLower = val.toLowerCase()
                if (!existingValues.has(valLower)) {
                    existingValues.add(valLower)
                    dbCategories.push({ value: valLower, label: val })
                }
            }
        })
    }

    const allCategories = [...baseCategories, ...dbCategories]

    // Filtrar cursos
    let cursosFiltrados = rawCursos || []

    if (query) {
        cursosFiltrados = cursosFiltrados.filter(c => 
            c.titulo?.toLowerCase().includes(query) ||
            c.descripcion?.toLowerCase().includes(query) ||
            c.instructor?.toLowerCase().includes(query) ||
            c.categoria?.toLowerCase().includes(query)
        )
    }

    if (activeCategory !== 'todas') {
        const target = activeCategory.toLowerCase()
        cursosFiltrados = cursosFiltrados.filter(c => {
            const cat = (c.categoria || 'desarrollo').toLowerCase()
            return cat === target || cat.includes(target) || target.includes(cat)
        })
    }

    // Ordenar super cursos primero
    cursosFiltrados.sort((a, b) => {
        const sa = a.es_super_curso ? 1 : 0
        const sb = b.es_super_curso ? 1 : 0
        if (sb !== sa) return sb - sa
        const da = a.created_at ? new Date(a.created_at).getTime() : 0
        const db = b.created_at ? new Date(b.created_at).getTime() : 0
        return db - da
    })

    return (
        <div className="min-h-screen bg-slate-50 font-sans pb-16">
            {/* Header público */}
            <div className="bg-[#0b1b36] text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-3">
                        <Link href="/" className="hover:text-white transition-colors">Inicio</Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span>Catálogo de Cursos</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
                        Catálogo de Cursos y Capacitación
                    </h1>
                    <p className="text-slate-300 text-base max-w-2xl">
                        Explora nuestra oferta académica de cursos, programas de formación y certificaciones de competencias.
                    </p>
                </div>
            </div>

            {/* Secciones de Buscador y Resultados */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
                {/* Formulario de Búsqueda y Filtros */}
                <form action="/cursos" method="GET" className="bg-white rounded-2xl shadow-md border border-slate-200 p-4 mb-8 flex flex-col md:flex-row gap-4 items-center">
                    <div className="flex-grow flex items-center bg-slate-50 rounded-xl px-4 py-3 w-full border border-slate-200">
                        <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                        <input 
                            type="text" 
                            name="q"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Buscar cursos, temas o palabras clave..." 
                            className="bg-transparent border-none outline-none w-full text-slate-800 text-sm placeholder-slate-400"
                        />
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select 
                            name="category" 
                            value={activeCategory}
                            onChange={(e) => setActiveCategory(e.target.value)}
                            className="bg-slate-50 border border-slate-200 outline-none text-slate-700 py-3 px-4 rounded-xl flex-grow md:flex-grow-0 cursor-pointer text-sm font-medium focus:ring-2 focus:ring-indigo-500"
                        >
                            {allCategories.map(cat => (
                                <option key={cat.value} value={cat.value}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold w-full md:w-auto transition-colors shadow-sm text-sm">
                        Buscar Cursos
                    </button>
                </form>

                {/* Contador de resultados */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                        <span>Cursos Disponibles ({cursosFiltrados.length})</span>
                    </h2>
                    {query || activeCategory !== 'todas' ? (
                        <Link href="/cursos" className="text-xs font-semibold text-indigo-600 hover:underline">
                            Limpiar filtros
                        </Link>
                    ) : null}
                </div>

                {/* Grid de Cursos */}
                {loading ? (
                    <div className="p-12 text-center text-slate-500 font-medium">
                        Cargando catálogo de cursos...
                    </div>
                ) : cursosFiltrados.length === 0 ? (
                    <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto my-8">
                        <GraduationCap className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-slate-800 mb-2">No se encontraron cursos</h3>
                        <p className="text-slate-500 text-sm mb-6">
                            No hallamos cursos que coincidan con tu búsqueda. Intenta con otros términos o seleccionando otra categoría.
                        </p>
                        <Link href="/cursos" className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors inline-block">
                            Ver todos los cursos
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {cursosFiltrados.map((course: any) => {
                            const imageUrl = course.imagen_url && course.imagen_url.trim() ? course.imagen_url : '/mundo.jpeg'
                            const badgeDuracion = course.duracion ? course.duracion.toUpperCase() : (course.categoria?.toUpperCase() || 'CURSO')

                            return (
                                <div key={course.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
                                    <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
                                        <img 
                                            src={imageUrl} 
                                            alt={course.titulo} 
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                        />
                                        <div className="absolute top-3 left-3 bg-[#0b1b36]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center tracking-wider">
                                            <Clock className="w-3 h-3 mr-1 text-indigo-300" />
                                            <span>{badgeDuracion}</span>
                                        </div>
                                    </div>

                                    <div className="p-5 flex flex-col flex-grow justify-between">
                                        <div>
                                            <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 leading-snug group-hover:text-indigo-600 transition-colors">
                                                {course.titulo}
                                            </h3>
                                            
                                            <p className="text-xs text-slate-500 line-clamp-2 mb-3">
                                                {course.descripcion || 'Sin descripción disponible.'}
                                            </p>

                                            <div className="flex items-center gap-1.5 mb-4 text-[11px] text-slate-500 w-max">
                                                <FileText className="w-3.5 h-3.5 text-indigo-500" />
                                                <span>Constancia + Microcredencial</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <span className="font-extrabold text-indigo-600 text-lg">
                                                {course.precio > 0 ? `$${course.precio} MXN` : 'Gratis'}
                                            </span>
                                            <Link 
                                                href={`/cursos/${course.id}`} 
                                                className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 border border-indigo-600 px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1"
                                            >
                                                <span>Ver información</span>
                                                <ArrowRight className="w-3.5 h-3.5" />
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}

export default function CursosPublicPage() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-slate-500">Cargando catálogo...</div>}>
            <CursosContent />
        </Suspense>
    )
}
