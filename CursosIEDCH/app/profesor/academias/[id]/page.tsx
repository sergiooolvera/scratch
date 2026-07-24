'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { eliminarAcademiaAction } from '@/app/actions/academias'
import { 
    Users, 
    BookOpen, 
    Lightbulb,
    ArrowDown,
    ArrowRight,
    Loader2,
    Trash2,
    Settings
} from 'lucide-react'

export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default function AcademiaDetallePage({ params }: PageProps) {
    const { id } = use(params)
    const router = useRouter()
    const supabase = createClient()

    const [academia, setAcademia] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [tieneCursos, setTieneCursos] = useState(false)
    const [eliminando, setEliminando] = useState(false)

    useEffect(() => {
        async function loadData() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                // 1. Obtener la academia
                const { data: acData } = await supabase
                    .from('ie_academias')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (!acData) {
                    router.push('/profesor')
                    return
                }
                setAcademia(acData)

                // 2. Obtener los grupos de esta academia
                const { data: grupos } = await supabase
                    .from('ie_grupos')
                    .select('id')
                    .eq('academia_id', id)

                let tieneCursosAsociados = false
                if (grupos && grupos.length > 0) {
                    const grupoIds = grupos.map(g => g.id)
                    // Validar si alguno de estos grupos tiene cursos asignados
                    const { data: relCursos } = await supabase
                        .from('ie_grupo_cursos')
                        .select('id')
                        .in('grupo_id', grupoIds)
                        .limit(1)

                    if (relCursos && relCursos.length > 0) {
                        tieneCursosAsociados = true
                    }
                }
                setTieneCursos(tieneCursosAsociados)
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
            <div className="max-w-4xl mx-auto">
                
                {/* Cabecera / Breadcrumb */}
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Link href="/profesor" className="hover:text-indigo-600 transition-colors">
                            Panel del Profesor
                        </Link>
                        <span>/</span>
                        <span className="text-slate-600 font-medium">Academias</span>
                        <span>/</span>
                        <span className="text-slate-600 font-semibold">{academia.nombre}</span>
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

                {/* Título Principal */}
                <div className="mb-10 text-center sm:text-left">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                        ¡Tu academia está lista!
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm sm:text-base">
                        Sigue estos 2 pasos para empezar a enseñar en <span className="font-semibold text-slate-700">{academia.nombre}</span>.
                    </p>
                </div>

                {/* Contenedor de Pasos */}
                <div className="space-y-6">
                    
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

                {/* ¿Qué Sigue? */}
                <div className="mt-8 bg-slate-100/50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex items-start gap-4">
                    <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                        <Lightbulb className="h-5 w-5" />
                    </div>
                    <div className="space-y-1">
                        <h4 className="font-bold text-slate-900 text-sm">¿Qué sigue?</h4>
                        <p className="text-xs text-slate-500 leading-relaxed">
                            Después de crear tu curso, podrás agregar contenido, evaluaciones y emitir certificados.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
