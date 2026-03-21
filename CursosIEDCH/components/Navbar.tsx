'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogOut, GraduationCap, LayoutDashboard, UserPlus, Users, BookOpen, BadgeCheck, MessageSquare, User, ChevronDown } from 'lucide-react'

export default function Navbar() {
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)

    useEffect(() => {
        const fetchUser = async (sessionUser: any) => {
            setUser(sessionUser)
            if (sessionUser) {
                const { data } = await supabase.from('ie_profiles').select('*').eq('id', sessionUser.id).single()
                setProfile(data)
            } else {
                setProfile(null)
            }
        }

        // Inicial carga
        supabase.auth.getSession().then(({ data: { session } }) => {
            fetchUser(session?.user ?? null)
        })

        // Escuchar cambios de estado (Login propio o en otra pestaña)
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            fetchUser(session?.user ?? null)
            if (event === 'SIGNED_OUT') {
                router.refresh()
                router.push('/login')
            } else if (event === 'SIGNED_IN') {
                router.refresh()
            }
        })

        return () => {
            authListener.subscription.unsubscribe()
        }
    }, [supabase, router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        // El onAuthStateChange manejará el router.push y refresh
    }

    const navItemClass = (path: string) =>
        `flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname.startsWith(path) ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`

    return (
        <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center">
                            <a href="https://iedch.vercel.app" className="flex items-center space-x-2 text-xl font-bold text-blue-700">
                                <GraduationCap className="h-8 w-8" />
                                <span className="hidden sm:inline">IEDCH Portal</span>
                            </a>
                        </div>
                        {user && (
                            <div className="ml-4 sm:ml-8 flex items-center space-x-1 sm:space-x-2">
                                {profile?.rol !== 'admin' && (
                                    <Link href="/dashboard" className={navItemClass('/dashboard')}>
                                        <LayoutDashboard className="h-4 w-4" /> <span>Catálogo</span>
                                    </Link>
                                )}
                                {profile?.rol !== 'admin' && (
                                    <Link href="/mis-cursos" className={navItemClass('/mis-cursos')}>
                                        <GraduationCap className="h-4 w-4" /> <span>Mis Cursos</span>
                                    </Link>
                                )}
                                {profile?.rol === 'profesor' && (
                                    <div className="relative group">
                                        <button className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 focus:outline-none">
                                            <BookOpen className="h-4 w-4" /> <span>Panel Profesor</span> <ChevronDown className="h-4 w-4 ml-1" />
                                        </button>
                                        <div className="absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[100] pt-2">
                                            <div className="py-1 bg-white rounded-md border border-gray-100" role="menu">
                                                <Link href="/profesor/cursos" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">Mis Cursos Creados</Link>
                                                <Link href="/profesor/subir-curso" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">Subir Curso</Link>
                                                <Link href="/profesor/preguntas" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">Dudas de Alumnos</Link>
                                                <Link href="/profesor/ventas" className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">Mis Ventas</Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {profile?.rol === 'admin' && (
                                    <Link href="/admin/usuarios" className={navItemClass('/admin')}>
                                        <Users className="h-4 w-4" /> <span>Admin Panel</span>
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center">
                        {user ? (
                            <div className="flex items-center space-x-2 sm:space-x-3">
                                <div className="hidden md:flex flex-col items-end mr-1">
                                    <span className="text-sm font-medium text-gray-900">
                                        {profile?.nombre || user.email}
                                    </span>
                                    <span className="text-xs text-gray-500 capitalize">{profile?.rol || 'Alumno'}</span>
                                </div>
                                <Link href="/perfil" className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 rounded-full transition-colors border border-transparent" title="Mi Perfil">
                                    <User className="h-5 w-5" />
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center justify-center p-2 text-red-600 hover:text-white border border-red-600 hover:bg-red-600 rounded-full transition-colors"
                                    title="Salir"
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span className="hidden lg:inline text-sm font-medium ml-1 mr-2 px-1">Salir</span>
                                </button>
                            </div>
                        ) : (
                            <div className="flex items-center space-x-3">
                                <Link href="/validar" className="text-sm font-medium text-gray-700 hover:text-blue-700 transition-colors flex items-center bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200">
                                    <BadgeCheck className="h-4 w-4 mr-1 text-blue-600" />
                                    <span className="hidden sm:inline">Competencias Acreditadas</span>
                                    <span className="sm:hidden">Validar</span>
                                </Link>
                                <Link href="/login" className="text-gray-600 hover:text-blue-600 px-4 py-2 rounded-full text-sm font-medium transition-colors border border-transparent hover:bg-gray-50">
                                    Entrar
                                </Link>
                                <Link href="/register" className="flex items-center space-x-1 bg-blue-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                                    <UserPlus className="h-4 w-4" />
                                    <span>Registrarse</span>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    )
}
