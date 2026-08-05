'use client'

import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'
import CourseCard from '@/components/CourseCard'
import { Heart, BookMarked, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function WishlistPage() {
    const supabase = createClient()
    const [user, setUser] = useState<any>(null)
    const [cursos, setCursos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [wishlistIds, setWishlistIds] = useState<string[]>([])

    // 1. Obtener usuario actual
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
        })

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [])

    // 2. Cargar IDs de la lista de deseos desde localStorage
    const loadWishlistFromStorage = () => {
        if (typeof window !== 'undefined') {
            const wished = JSON.parse(localStorage.getItem('ie_deseos') || '[]')
            setWishlistIds(wished)
        }
    }

    useEffect(() => {
        loadWishlistFromStorage()

        const handleWishChange = () => {
            loadWishlistFromStorage()
        }

        window.addEventListener('wishlist-updated', handleWishChange)
        return () => window.removeEventListener('wishlist-updated', handleWishChange)
    }, [])

    // 3. Consultar los cursos detallados de la base de datos cuando cambien los IDs o el usuario
    useEffect(() => {
        const fetchCursos = async () => {
            if (wishlistIds.length === 0) {
                setCursos([])
                setLoading(false)
                return
            }

            try {
                // Consultar cursos aprobados cuyos IDs estén en wishlistIds
                const { data: rawCursos, error } = await supabase
                    .from('ie_cursos')
                    .select('*, profesor:ie_profiles!creado_por(nombre, apellido_paterno, apellido_materno, fotografia_perfil, verificado, rol, clave_cct, organizacion_tipo, correo_adicional, telefono, representante_nombre, representante_cargo, descripcion_institucional, profesion_especialidad, nivel_academico, anos_experiencia, presentacion_profesional, estado_municipio)')
                    .eq('estado', 'aprobado')
                    .in('id', wishlistIds)

                if (error) {
                    console.error('Error cargando cursos de deseos:', error)
                } else if (rawCursos) {
                    // Si el usuario ya está autenticado, podemos filtrar u omitir cursos ya comprados (opcional, pero buena UX)
                    let userBoughtIds: string[] = []
                    if (user) {
                        const { data: compras } = await supabase
                            .from('ie_compras')
                            .select('curso_id')
                            .eq('user_id', user.id)
                            .eq('pagado', true)

                        if (compras) {
                            userBoughtIds = compras.map(c => c.curso_id)
                        }
                    }

                    // Filtrar para mostrar solo los que el usuario aún NO ha comprado pero sí tiene en deseos
                    const filtrados = rawCursos.filter(c => !userBoughtIds.includes(c.id))
                    setCursos(filtrados)
                }
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }

        fetchCursos()
    }, [wishlistIds, user])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-zinc-50">
                <Loader2 className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm font-semibold text-zinc-500">Cargando tu lista de deseos...</p>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-zinc-50 px-4">
                <div className="text-center max-w-md bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm">
                    <h3 className="text-xl font-extrabold text-zinc-900 mb-2">Inicia sesión</h3>
                    <p className="text-zinc-500 text-sm mb-6">Debes iniciar sesión como alumno para ver tus cursos guardados.</p>
                    <Link href="/login" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-full shadow-md transition-all">
                        Iniciar Sesión
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                {/* Cabecera */}
                <div className="flex items-center space-x-3 mb-8 border-b border-zinc-200/60 pb-6">
                    <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 shadow-inner">
                        <Heart className="h-6 w-6 fill-rose-500 text-rose-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-800 tracking-tight">Mi lista</h1>
                        <p className="text-xs text-gray-500">Cursos que te interesan y deseas adquirir más adelante</p>
                    </div>
                </div>

                {/* Contenido principal */}
                {cursos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {cursos.map((curso) => (
                            <CourseCard
                                key={curso.id}
                                course={curso}
                                isPagado={false}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white p-16 rounded-3xl border border-dashed border-zinc-200 shadow-sm max-w-2xl mx-auto mt-8">
                        <div className="mx-auto h-20 w-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                            <BookMarked className="h-10 w-10 text-rose-400" />
                        </div>
                        <h3 className="text-xl font-bold text-zinc-900 mb-2">Tu lista está vacía</h3>
                        <p className="text-zinc-500 text-sm max-w-md mx-auto mb-6">
                            Aún no has agregado ningún curso a tu lista. Explora nuestro catálogo y presiona el icono de corazón en los cursos que te interesen.
                        </p>
                        <Link href="/dashboard?catalog=true" className="inline-block text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:scale-95 px-6 py-3 rounded-xl shadow-lg shadow-indigo-600/10 transition-all cursor-pointer">
                            Ir al Catálogo de Cursos
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
