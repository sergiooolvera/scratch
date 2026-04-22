'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogOut, GraduationCap, LayoutDashboard, UserPlus, Users, BookOpen, BadgeCheck, MessageSquare, User, ChevronDown, Menu, X } from 'lucide-react'

export default function Navbar() {
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfMenuOpen, setIsProfMenuOpen] = useState(false)

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
                             <a href="https://iedch-2.vercel.app" className="flex items-center space-x-2">
                                <div className="flex flex-col space-y-[-4px] transform scale-75 origin-left">
                                    <div className="w-8 h-1.5 bg-[#D4AF37] skew-x-[-20deg]"></div>
                                    <div className="w-8 h-1.5 bg-[#002060] skew-x-[-20deg] ml-1"></div>
                                    <div className="w-8 h-1.5 bg-[#D4AF37] skew-x-[-20deg] ml-2"></div>
                                </div>
                                <span className="text-2xl font-black text-[#002060] tracking-tighter">SECNA</span>
                                <span className="hidden sm:inline-block h-6 w-[1px] bg-gray-200 mx-2"></span>
                                <span className="hidden lg:inline text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Portal</span>
                            </a>
                        </div>
                        {user && (
                            <div className="hidden md:flex ml-8 items-center space-x-2">
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
                                        <button 
                                            onClick={() => setIsProfMenuOpen(!isProfMenuOpen)}
                                            className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-blue-600 hover:bg-gray-50 focus:outline-none"
                                        >
                                            <BookOpen className="h-4 w-4" /> <span>Panel Profesor</span> <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isProfMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <div className={`absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-200 z-[100] pt-2 ${isProfMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                                            <div className="py-1 bg-white rounded-md border border-gray-100" role="menu">
                                                <Link href="/profesor/cursos" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">Mis Cursos Creados</Link>
                                                <Link href="/profesor/subir-curso" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">Subir Curso</Link>
                                                <Link href="/profesor/preguntas" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">Dudas de Alumnos</Link>
                                                <Link href="/profesor/ventas" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700">Mis Ventas</Link>
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
                        {/* Desktop User Menu */}
                        <div className="hidden md:flex items-center space-x-2">
                            {user ? (
                                <>
                                    <div className="flex flex-col items-end mr-1">
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
                                </>
                            ) : (
                                <div className="flex items-center space-x-3">
                                    <Link href="/validar" className="text-sm font-bold text-white transition-all flex items-center bg-orange-500 hover:bg-orange-600 active:scale-95 px-4 py-2 rounded-full shadow-md hover:shadow-orange-300 border border-orange-400">
                                        <BadgeCheck className="h-4 w-4 mr-1.5 text-white" />
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

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center space-x-2">
                            {!user && (
                                <Link href="/validar" className="p-2 text-orange-500" title="Validar">
                                    <BadgeCheck className="h-6 w-6" />
                                </Link>
                            )}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
                            >
                                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Content */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {user ? (
                            <>
                                <div className="px-3 py-2 border-b border-gray-50 mb-2">
                                    <p className="text-sm font-bold text-gray-900 truncate">{profile?.nombre || user.email}</p>
                                    <p className="text-xs text-gray-500 capitalize">{profile?.rol || 'Alumno'}</p>
                                </div>
                                {profile?.rol !== 'admin' && (
                                    <>
                                        <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                                            <LayoutDashboard className="h-5 w-5" /> <span>Catálogo</span>
                                        </Link>
                                        <Link href="/mis-cursos" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                                            <GraduationCap className="h-5 w-5" /> <span>Mis Cursos</span>
                                        </Link>
                                    </>
                                )}
                                {profile?.rol === 'profesor' && (
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Panel Profesor</div>
                                        <Link href="/profesor/cursos" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Mis Cursos Creados</Link>
                                        <Link href="/profesor/subir-curso" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Subir Curso</Link>
                                        <Link href="/profesor/preguntas" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Dudas de Alumnos</Link>
                                        <Link href="/profesor/ventas" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Mis Ventas</Link>
                                    </div>
                                )}
                                {profile?.rol === 'admin' && (
                                    <Link href="/admin/usuarios" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                                        <Users className="h-5 w-5" /> <span>Admin Panel</span>
                                    </Link>
                                )}
                                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                                    <User className="h-5 w-5" /> <span>Mi Perfil</span>
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="w-full text-left flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                                >
                                    <LogOut className="h-5 w-5" /> <span>Cerrar Sesión</span>
                                </button>
                            </>
                        ) : (
                            <div className="px-2 py-3 space-y-3">
                                <Link href="/validar" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center space-x-2 bg-orange-500 text-white px-4 py-3 rounded-xl font-bold">
                                    <BadgeCheck className="h-5 w-5" /> <span>Validar Competencias</span>
                                </Link>
                                <Link href="/login" onClick={() => setIsMenuOpen(false)} className="block text-center px-4 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 border border-gray-200">
                                    Entrar
                                </Link>
                                <Link href="/register" onClick={() => setIsMenuOpen(false)} className="block text-center px-4 py-2 rounded-md text-base font-medium bg-blue-600 text-white hover:bg-blue-700">
                                    Registrarse
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </nav>
    )
}
