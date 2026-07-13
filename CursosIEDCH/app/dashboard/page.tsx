import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseCard from '@/components/CourseCard'
import DashboardSearch from '@/components/DashboardSearch'
import { BookMarked, User, Search, HeartPulse, Briefcase, Code, Smile, Globe, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string }> }) {
    const resolvedParams = await searchParams
    const query = resolvedParams.q?.toLowerCase() || ''
    const activeCategory = resolvedParams.category || 'todas'
    
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Por favor inicia sesión.</div>
    }

    const { data: profile } = await supabase.from('ie_profiles').select('*').eq('id', user.id).single()

    if (profile?.rol === 'admin') {
        redirect('/admin/usuarios')
    }

    if (profile?.rol === 'adminjr') {
        const permisos = Array.isArray(profile?.permisos_adminjr) ? profile.permisos_adminjr : []
        if (permisos.includes('usuarios')) redirect('/admin/usuarios')
        if (permisos.includes('validaciones')) redirect('/admin/validaciones')
        if (permisos.includes('cursos')) redirect('/admin/cursos')
        if (permisos.includes('cupones')) redirect('/admin/cupones')
        if (permisos.includes('pagos-manuales')) redirect('/admin/pagos-manuales')
        if (permisos.includes('pagos-oxxo')) redirect('/admin/pagos-oxxo')
        if (permisos.includes('transacciones')) redirect('/admin/transacciones')
        if (permisos.includes('solicitudes')) redirect('/admin/solicitudes')
        if (permisos.includes('actividad')) redirect('/admin/actividad')
        redirect('/perfil')
    }

    if (profile?.rol === 'institucion' || profile?.rol === 'instructor' || profile?.rol === 'capacitador') {
        redirect('/profesor')
    }

    const { data: rawCursos } = await supabase
        .from('ie_cursos')
        .select('*, profesor:ie_profiles!creado_por(nombre, fotografia_perfil)')
        .eq('estado', 'aprobado')

    const maestroId = 'f160fe4d-5461-44c5-b868-51f1f0cae4c2';
    const allowedEmails = ['sergio.olver@gmail.com', 'maestro@iedch.com'];
    const userEmail = user?.email?.toLowerCase();

    // Filter courses created by maestro to only be visible to allowed emails
    const cursos = rawCursos?.filter(c => {
        if (c.creado_por === maestroId) {
            return userEmail && allowedEmails.includes(userEmail);
        }
        return true;
    }) || [];

    const { data: compras } = await supabase
        .from('ie_compras')
        .select('curso_id')
        .eq('user_id', user.id)
        .eq('pagado', true)

    const comprasIds = compras?.map(c => c.curso_id) || []

    // 1. Filtrar para mostrar en Catálogo solo los que NO se han comprado
    let cursosDisponibles = cursos?.filter(c => !comprasIds.includes(c.id)) || []
    
    // 2. Filtrar por búsqueda de texto
    if (query) {
        cursosDisponibles = cursosDisponibles.filter(c => 
            c.titulo?.toLowerCase().includes(query) || 
            c.instructor?.toLowerCase().includes(query)
        )
    }

    // 3. Filtrar por Categoría seleccionada
    if (activeCategory !== 'todas') {
        cursosDisponibles = cursosDisponibles.filter(c => (c.categoria || 'desarrollo') === activeCategory)
    }

    // Super Cursos primero
    cursosDisponibles.sort((a: any, b: any) => {
        const sa = a.es_super_curso ? 1 : 0
        const sb = b.es_super_curso ? 1 : 0
        if (sb !== sa) return sb - sa
        const da = a.created_at ? new Date(a.created_at).getTime() : 0
        const db = b.created_at ? new Date(b.created_at).getTime() : 0
        return db - da
    })

    const categorias = [
        { id: 'salud', label: 'Salud', icon: HeartPulse, bgClass: 'bg-purple-50', textClass: 'text-purple-600', activeBg: 'bg-purple-600 border-purple-600 text-white' },
        { id: 'negocios', label: 'Negocios', icon: Briefcase, bgClass: 'bg-emerald-50', textClass: 'text-emerald-600', activeBg: 'bg-emerald-600 border-emerald-600 text-white' },
        { id: 'tecnologia', label: 'Tecnología', icon: Code, bgClass: 'bg-blue-50', textClass: 'text-blue-600', activeBg: 'bg-blue-600 border-blue-600 text-white' },
        { id: 'desarrollo', label: 'Desarrollo Personal', icon: Smile, bgClass: 'bg-orange-50', textClass: 'text-orange-600', activeBg: 'bg-orange-600 border-orange-600 text-white' },
        { id: 'idiomas', label: 'Idiomas', icon: Globe, bgClass: 'bg-indigo-50', textClass: 'text-indigo-600', activeBg: 'bg-indigo-600 border-indigo-600 text-white' },
        { id: 'todas', label: 'Más', icon: MoreHorizontal, bgClass: 'bg-zinc-100', textClass: 'text-zinc-600', activeBg: 'bg-zinc-700 border-zinc-700 text-white' },
    ]

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans pb-16">
            {/* Buscador superior y saludo en contenedor limpio */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div className="flex items-center space-x-3.5">
                        <div className="h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 shadow-inner overflow-hidden flex-shrink-0 border border-zinc-200">
                            {(profile?.fotografia_perfil || user?.user_metadata?.avatar_url || user?.user_metadata?.picture) ? (
                                <img src={profile?.fotografia_perfil || user?.user_metadata?.avatar_url || user?.user_metadata?.picture} alt="Avatar" className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-6 w-6" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">
                                ¡Hola, {profile?.nombre || user.user_metadata?.full_name || user.email.split('@')[0]}! 👋
                            </h1>
                            <p className="text-xs text-gray-500">
                                Rol: <span className="font-semibold capitalize text-indigo-600">{profile?.rol || 'Alumno'}</span>
                            </p>
                        </div>
                    </div>
                    <div className="w-full md:w-96">
                        <DashboardSearch defaultValue={query} activeCategory={activeCategory} />
                    </div>
                </div>

                {/* Banner Principal ("Aprende a tu ritmo") */}
                <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white mb-12 shadow-xl border border-zinc-800/50 flex flex-col md:flex-row items-center min-h-[140px] md:min-h-[160px]">
                    {/* Lado izquierdo (Texto) */}
                    <div className="p-4 md:p-6 z-10 w-full md:w-3/5 flex flex-col justify-center items-start">
                        <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-white mb-2 leading-tight">
                            Aprende a tu ritmo,<br />certifícate y crece.
                        </h2>
                        <p className="text-zinc-300 text-xs md:text-sm max-w-md mb-4 leading-relaxed">
                            Miles de cursos en diferentes áreas impartidos por expertos del sector salud y profesional.
                        </p>
                        <Link
                            href="/dashboard?category=todas"
                            scroll={false}
                            className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold py-2 px-4 rounded-xl transition-all shadow-lg shadow-indigo-600/30 text-xs cursor-pointer"
                        >
                            Explorar cursos
                        </Link>
                    </div>
                    {/* Lado derecho (Imagen) */}
                    <div className="relative w-full md:w-2/5 h-32 md:h-full min-h-[110px] md:absolute md:right-0 md:top-0 md:bottom-0 overflow-hidden">
                        <img 
                            src="/hero_student_banner.png" 
                            alt="Estudiante" 
                            className="w-full h-full object-cover object-center md:object-right select-none pointer-events-none"
                        />
                        {/* Gradiente para fundir la imagen con el fondo oscuro */}
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-zinc-950 via-transparent to-transparent"></div>
                    </div>
                </div>

                {/* Sección "Explora por categorías" */}
                <div className="mb-12">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">Explora por categorías</h3>
                        <Link 
                            href="/dashboard?category=todas" 
                            scroll={false}
                            className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition-colors"
                        >
                            Ver todas
                        </Link>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                        {categorias.map((cat) => {
                            const isSelected = activeCategory === cat.id
                            const linkUrl = `/dashboard?category=${cat.id}${query ? `&q=${query}` : ''}`
                            const Icon = cat.icon

                            return (
                                <Link 
                                    href={linkUrl} 
                                    key={cat.id}
                                    scroll={false}
                                    className={`flex flex-col items-center justify-center p-6 bg-white rounded-2xl border transition-all duration-200 hover:shadow-md hover:scale-[1.03] cursor-pointer ${
                                        isSelected 
                                            ? 'border-indigo-600 ring-4 ring-indigo-500/10 shadow-sm' 
                                            : 'border-zinc-100 hover:border-zinc-200 shadow-sm'
                                    }`}
                                >
                                    <div className={`h-14 w-14 rounded-full flex items-center justify-center mb-4 transition-transform duration-200 group-hover:scale-110 ${
                                        isSelected ? 'bg-indigo-600 text-white' : cat.bgClass
                                    }`}>
                                        <Icon className={`h-7 w-7 ${isSelected ? 'text-white' : cat.textClass}`} />
                                    </div>
                                    <span className="text-zinc-900 font-bold text-sm text-center leading-tight">{cat.label}</span>
                                </Link>
                            )
                        })}
                    </div>
                </div>

                {/* Sección "Cursos populares" o Resultados */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-extrabold text-zinc-900 tracking-tight">
                            {query || activeCategory !== 'todas' ? 'Resultados de búsqueda' : 'Cursos populares'}
                        </h3>
                        {cursosDisponibles.length > 0 && (
                            <Link 
                                href="/dashboard?category=todas" 
                                scroll={false}
                                className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition-colors"
                            >
                                Ver todas
                            </Link>
                        )}
                    </div>

                    {cursosDisponibles.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            {cursosDisponibles.map((curso: any) => (
                                <CourseCard
                                    key={curso.id}
                                    course={curso}
                                    isPagado={false}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center bg-white p-16 rounded-3xl border border-dashed border-zinc-200 shadow-sm">
                            <div className="mx-auto h-20 w-20 bg-zinc-50 rounded-full flex items-center justify-center mb-6">
                                <BookMarked className="h-10 w-10 text-zinc-400" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-900 mb-2">No se encontraron cursos</h3>
                            <p className="text-zinc-500 text-base max-w-md mx-auto">No hay cursos disponibles en la categoría seleccionada bajo los criterios actuales de búsqueda.</p>
                            <Link href="/dashboard" className="mt-5 inline-block text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-5 py-2 rounded-full">
                                Ver todos los cursos
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

