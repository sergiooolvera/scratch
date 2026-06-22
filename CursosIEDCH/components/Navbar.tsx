'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { LogOut, GraduationCap, LayoutDashboard, UserPlus, Users, BookOpen, BadgeCheck, MessageSquare, User, ChevronDown, Menu, X, Landmark, HandCoins, Building2, FolderHeart, Plus, ClipboardList, FileText } from 'lucide-react'
import NotificationBell from './NotificationBell'

export default function Navbar() {
    const supabase = createClient()
    const router = useRouter()
    const pathname = usePathname()
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isProfMenuOpen, setIsProfMenuOpen] = useState(false)
    const [isFinMenuOpen, setIsFinMenuOpen] = useState(false)
    const [isInstMenuOpen, setIsInstMenuOpen] = useState(false)
    const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false)
    const [isEstudiosMenuOpen, setIsEstudiosMenuOpen] = useState(false)

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

        const handleProfileUpdate = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('ie_profiles').select('*').eq('id', user.id).single()
                setProfile(data)
            }
        }

        window.addEventListener('profile-updated', handleProfileUpdate)

        return () => {
            authListener.subscription.unsubscribe()
            window.removeEventListener('profile-updated', handleProfileUpdate)
        }
    }, [supabase, router])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        // El onAuthStateChange manejará el router.push y refresh
    }

    const navItemClass = (path: string) =>
        `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${pathname.startsWith(path) ? 'bg-blue-50/70 text-blue-600 font-semibold' : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'}`

    const navBgClass = 'bg-white/90 backdrop-blur-md';

    const getNavbarBorderColor = () => {
        if (!user && !profile) return 'border border-gray-150/60';
        const rol = profile?.rol || 'alumno';
        if (['alumno', 'financiero'].includes(rol)) return 'border border-blue-100/70';
        if (['instructor', 'capacitador'].includes(rol)) return 'border border-emerald-100/70';
        if (['institucion'].includes(rol)) return 'border border-orange-100/70';
        if (rol === 'admin') return 'border border-purple-100/70';
        return 'border border-gray-150/60';
    };

    const navBorderClass = getNavbarBorderColor();

    return (
        <div className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-gray-100/60 py-2.5 px-4 sm:px-6 lg:px-8 print:hidden flex items-center justify-between">
            <div className="max-w-7xl mx-auto w-full flex items-center justify-between relative h-14">
                
                {/* IZQUIERDA: Logo EGAC | Portal */}
                <div className="flex-shrink-0 flex items-center z-10">
                    <a href="https://grupoegac.com" className="flex items-center space-x-2">
                        <img src="/logoegac.jpg" alt="Logo" className="h-13 w-auto object-contain rounded-lg transition-transform duration-200 hover:scale-105" />
                        <span className="hidden sm:inline-block h-8 w-[1px] bg-gray-200 mx-2"></span>
                        <span className="hidden lg:inline text-sm font-bold text-gray-400 uppercase tracking-widest mt-0.5">Portal</span>
                    </a>
                </div>

                {/* CENTRO: Menú de Navegación (Cápsula flotante compacta para Desktop) */}
                {user && (
                    <nav className={`hidden md:flex relative pointer-events-auto bg-white/60 ${navBorderClass} rounded-full shadow-sm px-4 py-1.5 items-center justify-center transition-all duration-300 z-10`}>
                        {/* Contenedor de Ondas con overflow-hidden para no sobresalir de las esquinas redondeadas */}
                        <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none z-0">
                            {/* Onda 1 */}
                            <svg className="absolute -bottom-4 -left-10 w-[120%] h-10 opacity-15 text-blue-200 fill-current" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 24C120 24 240 48 360 48C480 48 600 24 720 24C840 24 960 48 1080 48C1200 48 1320 24 1440 24V74H0V24Z" />
                            </svg>
                            {/* Onda 2 */}
                            <svg className="absolute -bottom-2 -right-10 w-[130%] h-12 opacity-10 text-indigo-200 fill-current" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 48C120 48 240 24 360 24C480 24 600 48 720 48C840 48 960 24 1080 24C1200 24 1320 48 1440 48V74H0V48Z" />
                            </svg>
                        </div>
                        
                        <div className="relative z-10 flex items-center h-12">
                            <div className="flex">
                                {user && (
                                    <div className="hidden md:flex items-center space-x-2">
                                {profile?.rol !== 'admin' && (
                                    <Link href="/dashboard" className={navItemClass('/dashboard')}>
                                        <LayoutDashboard className="h-4 w-4" /> <span>Catálogo</span>
                                    </Link>
                                )}
                                {profile?.rol !== 'admin' && (
                                     <div className="relative group">
                                         <button
                                             onClick={() => setIsEstudiosMenuOpen(!isEstudiosMenuOpen)}
                                             className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all duration-200 ${
                                                 pathname.startsWith('/mis-cursos')
                                                     ? 'text-blue-600 bg-blue-50/70 font-semibold'
                                                     : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                             }`}
                                         >
                                             <GraduationCap className="h-4 w-4" /> <span>Mis Estudios</span> <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isEstudiosMenuOpen ? 'rotate-180' : ''}`} />
                                         </button>
                                         <div className={`absolute left-0 mt-1 w-52 rounded-xl shadow-xl bg-white ring-1 ring-black/5 transition-all duration-200 z-[100] ${isEstudiosMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible'}`}>
                                             <div className="py-1.5 bg-white rounded-xl border border-gray-100/80 divide-y divide-gray-50" role="menu">
                                                 <Link href="/mis-cursos" onClick={() => setIsEstudiosMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 transition-colors rounded-lg mx-1 my-0.5">
                                                     <GraduationCap className="h-4 w-4 text-gray-400" /> Mis Cursos
                                                 </Link>
                                                 <Link href="/mis-cursos/revision-examenes" onClick={() => setIsEstudiosMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 transition-colors rounded-lg mx-1 my-0.5">
                                                     <BadgeCheck className="h-4 w-4 text-gray-400" /> Mis Exámenes
                                                 </Link>
                                                 <Link href="/mis-cursos/cuestionarios" onClick={() => setIsEstudiosMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 transition-colors rounded-lg mx-1 my-0.5">
                                                     <ClipboardList className="h-4 w-4 text-gray-400" /> Mis Cuestionarios
                                                 </Link>
                                                 <Link href="/mis-cursos/tareas" onClick={() => setIsEstudiosMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 transition-colors rounded-lg mx-1 my-0.5">
                                                     <FileText className="h-4 w-4 text-gray-400" /> Mis Tareas
                                                 </Link>
                                                 <Link href="/mis-cursos/expediente" onClick={() => setIsEstudiosMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 transition-colors rounded-lg mx-1 my-0.5">
                                                     <FolderHeart className="h-4 w-4 text-gray-400" /> Mi Expediente
                                                 </Link>
                                             </div>
                                         </div>
                                     </div>
                                 )}
                                {profile?.rol === 'financiero' && (
                                     <div className="relative group">
                                         <button
                                             onClick={() => setIsFinMenuOpen(!isFinMenuOpen)}
                                             className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all duration-200 ${
                                                 pathname.startsWith('/financiero')
                                                     ? 'text-blue-600 bg-blue-50/70 font-semibold'
                                                     : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                             }`}
                                         >
                                             <Landmark className="h-4 w-4" /> <span>Finanzas</span> <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isFinMenuOpen ? 'rotate-180' : ''}`} />
                                         </button>
                                         <div className={`absolute left-0 mt-1 w-56 rounded-xl shadow-xl bg-white ring-1 ring-black/5 transition-all duration-200 z-[100] ${isFinMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible'}`}>
                                             <div className="py-1.5 bg-white rounded-xl border border-gray-100/80 divide-y divide-gray-50" role="menu">
                                                 <Link href="/financiero" onClick={() => setIsFinMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 transition-colors rounded-lg mx-1 my-0.5">
                                                     <LayoutDashboard className="h-4 w-4 text-gray-400" /> Dashboard Financiero
                                                 </Link>
                                                 <Link href="/financiero/colaboradores" onClick={() => setIsFinMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 transition-colors rounded-lg mx-1 my-0.5">
                                                     <HandCoins className="h-4 w-4 text-gray-400" /> Pago de Colaboradores
                                                 </Link>
                                             </div>
                                         </div>
                                     </div>
                                 )}
                                {profile?.rol === 'institucion' && false && (
                                     <div className="relative group">
                                        <button
                                            onClick={() => setIsInstMenuOpen(!isInstMenuOpen)}
                                            className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-indigo-600 hover:bg-gray-50 focus:outline-none"
                                        >
                                            <Building2 className="h-4 w-4" /> <span>Panel Institución</span> <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isInstMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        <div className={`absolute left-0 mt-0 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-200 z-[100] pt-2 ${isInstMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible group-hover:opacity-100 group-hover:visible'}`}>
                                            <div className="py-1 bg-white rounded-md border border-gray-100" role="menu">
                                                <Link href="/institucion/registrar-actividad" onClick={() => setIsInstMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700">Registrar Actividad</Link>
                                                <Link href="/institucion/expediente" onClick={() => setIsInstMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700">Ver Expediente</Link>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                {(profile?.rol === 'instructor' || profile?.rol === 'capacitador' || profile?.rol === 'institucion') && (
                                     <>
                                         <div className="relative group">
                                             <button 
                                                 onClick={() => setIsProfMenuOpen(!isProfMenuOpen)}
                                                 className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all duration-200 ${
                                                     pathname.startsWith('/profesor') && !pathname.startsWith('/profesor/subir-curso')
                                                         ? 'text-blue-600 bg-blue-50/70 font-semibold'
                                                         : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                                 }`}
                                             >
                                                 <BookOpen className="h-4 w-4" /> <span>{profile?.rol === 'capacitador' ? 'Panel Capacitador' : 'Panel Instructor'}</span> <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isProfMenuOpen ? 'rotate-180' : ''}`} />
                                             </button>
                                             <div className={`absolute left-0 mt-1 w-52 rounded-xl shadow-xl bg-white ring-1 ring-black/5 transition-all duration-200 z-[100] ${isProfMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible'}`}>
                                                 <div className="py-1.5 bg-white rounded-xl border border-gray-100/80 divide-y divide-gray-50" role="menu">
                                                     <Link href="/profesor/cursos" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Mis Cursos Creados</Link>
                                                     <Link href="/profesor/preguntas" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Dudas de Alumnos</Link>
                                                     <Link href="/profesor/revision-examen" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Revisión de Exámenes</Link>
                                                     <Link href="/profesor/revision-cuestionarios" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Revisión de Cuestionarios</Link>
                                                     <Link href="/profesor/revision-tareas" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Revisión de Tareas</Link>
                                                     {(profile?.rol === 'instructor' || profile?.rol === 'institucion') && (
                                                          <Link href="/profesor/ventas" onClick={() => setIsProfMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Mis Ventas</Link>
                                                      )}
                                                 </div>
                                             </div>
                                         </div>
                                         <Link href="/profesor/subir-curso" className="flex items-center space-x-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0">
                                             <Plus className="h-4 w-4" /> <span>Subir Curso</span>
                                         </Link>
                                     </>
                                 )}
                                {profile?.rol === 'vendedor' && (
                                    <Link href="/profesor/ventas" className={navItemClass('/profesor/ventas')}>
                                        <HandCoins className="h-4 w-4" /> <span>Mis Ventas</span>
                                    </Link>
                                )}
                                {profile?.rol === 'admin' && (
                                     <div className="relative group">
                                         <button
                                             onClick={() => setIsAdminMenuOpen(!isAdminMenuOpen)}
                                             className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium focus:outline-none transition-all duration-200 ${
                                                 pathname.startsWith('/admin')
                                                     ? 'text-blue-600 bg-blue-50/70 font-semibold'
                                                     : 'text-gray-600 hover:text-blue-600 hover:bg-gray-50'
                                             }`}
                                         >
                                             <Users className="h-4 w-4" /> <span>Panel Admin</span> <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${isAdminMenuOpen ? 'rotate-180' : ''}`} />
                                         </button>
                                         <div className={`absolute left-0 mt-1 w-52 rounded-xl shadow-xl bg-white ring-1 ring-black/5 transition-all duration-200 z-[100] ${isAdminMenuOpen ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible group-hover:opacity-100 group-hover:translate-y-0 group-hover:visible'}`}>
                                             <div className="py-1.5 bg-white rounded-xl border border-gray-100/80 divide-y divide-gray-50" role="menu">
                                                 <Link href="/admin/usuarios" onClick={() => setIsAdminMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Usuarios y Cursos</Link>
                                                 <Link href="/admin/validaciones" onClick={() => setIsAdminMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Validar Identidades</Link>
                                                 <Link href="/admin/solicitudes" onClick={() => setIsAdminMenuOpen(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50/60 hover:text-blue-600 rounded-lg mx-1 my-0.5 transition-colors">Solicitudes de Ajuste</Link>
                                             </div>
                                         </div>
                                     </div>
                                 )}
                            </div>
                        )}
                    </div>
                </div>
            </nav>
            )}

            {/* DERECHA: Acciones del Usuario en Desktop (Fuera del menú flotante, fondo blanco) */}
            <div className="hidden md:flex items-center space-x-3 z-10">
                {user ? (
                    <>
                        <div className="flex flex-col items-end mr-1">
                            <span className="text-sm font-semibold text-gray-800">
                                {profile?.nombre || user.email}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${
                                profile?.rol === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                ['instructor', 'capacitador'].includes(profile?.rol) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                profile?.rol === 'institucion' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                profile?.rol === 'financiero' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                                {profile?.rol || 'Alumno'}
                            </span>
                        </div>
                        <NotificationBell userId={user.id} />
                        <Link href="/perfil" className="p-1 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-800 rounded-full transition-colors border border-transparent overflow-hidden flex items-center justify-center w-9 h-9" title="Mi Perfil">
                            {(profile?.fotografia_perfil || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                <img src={profile?.fotografia_perfil || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt="Perfil" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <User className="h-5 w-5" />
                            )}
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center px-4 py-1.5 text-xs font-bold text-red-600 hover:text-white border border-red-200 hover:border-red-600 hover:bg-red-600 rounded-full transition-all duration-200"
                            title="Salir"
                        >
                            <LogOut className="h-4 w-4 mr-1" />
                            <span>Salir</span>
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

            {/* MÓVIL: Acciones y Botón de Menú (Fuera del menú flotante, fondo blanco) */}
            <div className="md:hidden flex items-center space-x-2 z-10">
                {!user && (
                    <Link href="/validar" className="p-2 text-orange-500" title="Validar">
                        <BadgeCheck className="h-6 w-6" />
                    </Link>
                )}
                {user && <NotificationBell userId={user.id} />}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="p-2 rounded-md text-gray-600 hover:text-blue-600 hover:bg-gray-100 focus:outline-none"
                >
                    {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

                {/* Mobile Menu Content (flotante, absoluto, de ancho completo) */}
                {isMenuOpen && (
                    <div className={`absolute top-16 left-0 right-0 w-full md:hidden rounded-2xl ${navBorderClass} bg-white/95 backdrop-blur-md shadow-xl z-50 overflow-hidden pointer-events-auto`}>
                        {/* Contenedor de Ondas con overflow-hidden para no sobresalir de las esquinas redondeadas */}
                        <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none z-0">
                            {/* Onda 1 */}
                            <svg className="absolute -bottom-4 -left-10 w-[120%] h-10 opacity-15 text-blue-200 fill-current" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 24C120 24 240 48 360 48C480 48 600 24 720 24C840 24 960 48 1080 48C1200 48 1320 24 1440 24V74H0V24Z" />
                            </svg>
                            {/* Onda 2 */}
                            <svg className="absolute -bottom-2 -right-10 w-[130%] h-12 opacity-10 text-indigo-200 fill-current" viewBox="0 0 1440 74" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0 48C120 48 240 24 360 24C480 24 600 48 720 48C840 48 960 24 1080 24C1200 24 1320 48 1440 48V74H0V48Z" />
                            </svg>
                        </div>
                        <div className="relative z-10 px-2 pt-2 pb-3 space-y-1">
                        {user ? (
                            <>
                                <div className="px-4 py-3 border-b border-gray-100/60 mb-2 flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full overflow-hidden bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                        {(profile?.fotografia_perfil || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                            <img src={profile?.fotografia_perfil || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt="Perfil" className="w-full h-full object-cover" />
                                        ) : (
                                            <User className="h-5 w-5 text-blue-600" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{profile?.nombre || user.email}</p>
                                        <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${
                                            profile?.rol === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                            ['instructor', 'capacitador'].includes(profile?.rol) ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                            profile?.rol === 'institucion' ? 'bg-orange-50 text-orange-700 border border-orange-100' :
                                            profile?.rol === 'financiero' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                            'bg-blue-50 text-blue-700 border border-blue-100'
                                        }`}>
                                            {profile?.rol || 'Alumno'}
                                        </span>
                                    </div>
                                </div>
                                {profile?.rol !== 'admin' && (
                                    <>
                                        <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 mx-2 transition-colors">
                                            <LayoutDashboard className="h-5 w-5 text-gray-400" /> <span>Catálogo</span>
                                        </Link>
                                        <Link href="/mis-cursos" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 mx-2 transition-colors">
                                            <GraduationCap className="h-5 w-5 text-gray-400" /> <span>Mis Cursos</span>
                                        </Link>
                                        <Link href="/mis-cursos/revision-examenes" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 mx-2 transition-colors">
                                            <BadgeCheck className="h-5 w-5 text-gray-400" /> <span>Mis Exámenes</span>
                                        </Link>
                                        <Link href="/mis-cursos/cuestionarios" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 mx-2 transition-colors">
                                            <ClipboardList className="h-5 w-5 text-gray-400" /> <span>Mis Cuestionarios</span>
                                        </Link>
                                        <Link href="/mis-cursos/tareas" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 mx-2 transition-colors">
                                            <FileText className="h-5 w-5 text-gray-400" /> <span>Mis Tareas</span>
                                        </Link>
                                        <Link href="/mis-cursos/expediente" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 mx-2 transition-colors">
                                            <FolderHeart className="h-5 w-5 text-gray-400" /> <span>Mi Expediente</span>
                                        </Link>
                                    </>
                                )}
                                {profile?.rol === 'financiero' && (
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Finanzas</div>
                                        <Link href="/financiero" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Dashboard Financiero</Link>
                                        <Link href="/financiero/colaboradores" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Pago de Colaboradores</Link>
                                    </div>
                                )}
                                {profile?.rol === 'institucion' && false && (
                                     <div className="space-y-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-indigo-400 uppercase tracking-wider">Panel Institución</div>
                                        <Link href="/institucion/registrar-actividad" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-indigo-50 border-l-2 border-transparent hover:border-indigo-500">Registrar Actividad</Link>
                                        <Link href="/institucion/expediente" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-indigo-50 border-l-2 border-transparent hover:border-indigo-500">Ver Expediente</Link>
                                    </div>
                                )}
                                {(profile?.rol === 'instructor' || profile?.rol === 'capacitador' || profile?.rol === 'institucion') && (
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Panel {profile?.rol === 'capacitador' ? 'Capacitador' : 'Instructor'}</div>
                                        <div className="px-3 py-1">
                                            <Link href="/profesor/subir-curso" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center space-x-1.5 w-full py-2.5 px-4 rounded-xl text-base font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md transition-all duration-200">
                                                <Plus className="h-5 w-5" /> <span>Subir Curso</span>
                                            </Link>
                                        </div>
                                        <Link href="/profesor/cursos" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Mis Cursos Creados</Link>
                                        <Link href="/profesor/preguntas" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Dudas de Alumnos</Link>
                                        <Link href="/profesor/revision-examen" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Revisión de Exámenes</Link>
                                        <Link href="/profesor/revision-cuestionarios" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Revisión de Cuestionarios</Link>
                                        <Link href="/profesor/revision-tareas" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Revisión de Tareas</Link>
                                        {(profile?.rol === 'instructor' || profile?.rol === 'institucion') && (
                                            <Link href="/profesor/ventas" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Mis Ventas</Link>
                                        )}
                                    </div>
                                )}
                                {profile?.rol === 'vendedor' && (
                                    <Link href="/profesor/ventas" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">
                                        <HandCoins className="h-5 w-5" /> <span>Mis Ventas</span>
                                    </Link>
                                )}
                                {profile?.rol === 'admin' && (
                                    <div className="space-y-1">
                                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Panel Admin</div>
                                        <Link href="/admin/usuarios" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Usuarios y Cursos</Link>
                                        <Link href="/admin/validaciones" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Validar Identidades</Link>
                                        <Link href="/admin/solicitudes" onClick={() => setIsMenuOpen(false)} className="block pl-10 pr-4 py-2 text-base font-medium text-gray-600 hover:bg-gray-50 border-l-2 border-transparent hover:border-blue-500">Solicitudes de Ajuste</Link>
                                    </div>
                                )}
                                <Link href="/perfil" onClick={() => setIsMenuOpen(false)} className="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 mx-2 transition-colors">
                                    <User className="h-5 w-5 text-gray-400" /> <span>Mi Perfil</span>
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="w-full text-left flex items-center space-x-3 px-4 py-2.5 rounded-lg text-base font-medium text-red-600 hover:bg-red-50/70 mx-2 transition-colors"
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
            </div>
        </div>
    )
}
