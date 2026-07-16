import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseCard from '@/components/CourseCard'
import DashboardSearch from '@/components/DashboardSearch'
import PopularAcademiesClient from '@/components/PopularAcademiesClient'
import { BookMarked, User, Search, HeartPulse, Briefcase, Code, Smile, Globe, MoreHorizontal, CheckCircle2, ChevronRight, GraduationCap } from 'lucide-react'
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

    // --- CONSULTAR ACADEMIAS Y CALCULAR POPULARIDAD ---
    // 1. Obtener todas las academias
    const { data: rawAcademias } = await supabase
        .from('ie_academias')
        .select('id, nombre, logo_url, color_principal, subdominio')
        .eq('publica', true)

    // 2. Obtener todas las membresías directas alumno-academia
    const { data: todasLasMembresias } = await supabase
        .from('ie_academia_alumnos')
        .select('academia_id, user_id')

    // Calcular alumnos inscritos por academia de forma directa
    const academiasConAlumnos = rawAcademias?.map(academia => {
        const miembrosDeAcademia = todasLasMembresias?.filter(m => m.academia_id === academia.id) || []
        const alumnosUnicosCount = new Set(miembrosDeAcademia.map(m => m.user_id)).size

        return {
            ...academia,
            alumnosCount: Math.max(alumnosUnicosCount, 1)
        }
    }) || []

    // Ordenar por popularidad (más alumnos primero)
    academiasConAlumnos.sort((a, b) => b.alumnosCount - a.alumnosCount)

    // Si no hay suficientes academias en la base de datos, agregamos fallbacks con los datos representativos del mockup
    const academiasFallback = [
        {
            id: 'mock-1',
            nombre: 'Academia de Salud EGAC',
            alumnosCount: 1250,
            color_principal: '#10b981',
            subdominio: 'salud',
            logo_url: null,
            isMock: true
        },
        {
            id: 'mock-2',
            nombre: 'Academia de Negocios EGAC',
            alumnosCount: 980,
            color_principal: '#3b82f6',
            subdominio: 'negocios',
            logo_url: null,
            isMock: true
        },
        {
            id: 'mock-3',
            nombre: 'Academia de Tecnología EGAC',
            alumnosCount: 850,
            color_principal: '#6366f1',
            subdominio: 'tecnologia',
            logo_url: null,
            isMock: true
        },
        {
            id: 'mock-4',
            nombre: 'Academia de Idiomas EGAC',
            alumnosCount: 760,
            color_principal: '#f59e0b',
            subdominio: 'idiomas',
            logo_url: null,
            isMock: true
        }
    ]

    // Consolidar academias (si la BD está vacía o tiene pocas, completamos o usamos las mockups para mantener la estética requerida)
    const academiasMostradas = academiasConAlumnos.length > 0 ? academiasConAlumnos : academiasFallback


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
                                ¡Hola, {profile?.nombre || user.user_metadata?.full_name || user.email?.split('@')[0] || ''}! 👋
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

                {/* Layout Principal de 2 Columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Columna Izquierda: Cursos, Categorías, Buscador principal, etc. */}
                    <div className="lg:col-span-2 space-y-12">
                        {/* Banner Principal ("Aprende a tu ritmo") */}
                        <div className="relative overflow-hidden rounded-3xl bg-zinc-950 text-white shadow-xl border border-zinc-800/50 flex flex-col md:flex-row items-center min-h-[140px] md:min-h-[160px]">
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
                        <div>
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
                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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

                        {/* Banner inferior de Información rápida sobre academias */}
                        <div className="bg-white rounded-3xl p-6 border border-zinc-150/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                    <GraduationCap className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-zinc-900 text-sm">
                                        Sigue academias y accede a sus cursos
                                    </h4>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        Inscríbete a academias que te interesen y recibe novedades, cursos exclusivos y promociones.
                                    </p>
                                </div>
                            </div>
                            <Link 
                                href="/academias" 
                                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-md shadow-indigo-600/10"
                            >
                                Ver academias
                            </Link>
                        </div>
                    </div>

                    {/* Columna Derecha: Academias populares y Beneficios */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Tarjeta: Academias Populares */}
                        <div className="bg-white rounded-3xl border border-zinc-150/70 shadow-xs p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-base font-extrabold text-zinc-900 tracking-tight">
                                    Academias populares
                                </h3>
                                <Link 
                                    href="/academias" 
                                    className="text-indigo-600 hover:text-indigo-800 text-xs font-extrabold transition-colors"
                                >
                                    Ver todas
                                </Link>
                            </div>

                            <PopularAcademiesClient academias={academiasMostradas.slice(0, 4) as any} />
                        </div>

                        {/* Tarjeta: Beneficios */}
                        <div className="bg-slate-50 rounded-3xl border border-zinc-150/70 p-6 flex flex-col md:flex-row lg:flex-col items-center justify-between gap-6">
                            <div className="space-y-4 w-full">
                                <h3 className="text-xs font-black text-zinc-800 tracking-wide uppercase">
                                    ¿Qué obtienes al unirte a una academia?
                                </h3>
                                <ul className="space-y-3.5">
                                    {[
                                        'Acceso a cursos exclusivos',
                                        'Novedades y promociones',
                                        'Contenido de calidad',
                                        'Interacción con instructores'
                                    ].map((beneficio, idx) => (
                                        <li key={idx} className="flex items-center gap-2.5 text-xs text-zinc-650 font-bold">
                                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
                                            <span>{beneficio}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* Gráfico / Vector de la Escuela en Color Morado */}
                            <div className="relative w-36 h-28 flex items-end justify-center select-none pointer-events-none opacity-85">
                                <svg className="w-28 h-24 text-indigo-550" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="25" y="40" width="50" height="50" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2.5"/>
                                    <path d="M15 40L50 15L85 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                    <rect x="42" y="65" width="16" height="25" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2.5"/>
                                    <circle cx="50" cy="40" r="5" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5"/>
                                    <line x1="10" y1="90" x2="90" y2="90" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
                                    <path d="M68 15V5M68 5H75M68 9H73" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                </svg>
                            </div>
                        </div>

                        {/* Tarjeta inferior: Explorar más academias */}
                        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 text-white p-6 shadow-md border border-indigo-500/20 group">
                            {/* Birrete de fondo decorativo translúcido */}
                            <div className="absolute right-3 bottom-2 opacity-15 select-none pointer-events-none transition-transform duration-500 group-hover:scale-110">
                                <svg className="w-28 h-24 text-white" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polygon points="60,15 95,29 60,43 25,29" fill="currentColor" stroke="currentColor" strokeWidth="2"/>
                                    <path d="M40,34 V48 C40,54 80,54 80,48 V34" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                                    <path d="M95,29 V45" stroke="currentColor" strokeWidth="2"/>
                                    <circle cx="95" cy="45" r="3.5" fill="currentColor"/>
                                </svg>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <h4 className="font-extrabold text-sm text-white tracking-wide uppercase">
                                        Explora más academias
                                    </h4>
                                    <p className="text-indigo-100 text-xs mt-1.5 leading-relaxed max-w-[210px]">
                                        Encuentra la academia ideal para alcanzar tus metas.
                                    </p>
                                </div>
                                <Link 
                                    href="/academias"
                                    className="inline-block bg-white hover:bg-zinc-100 text-indigo-600 active:scale-95 font-bold text-xs px-6 py-2.5 rounded-xl shadow-sm transition-all cursor-pointer"
                                >
                                    Explorar academias
                                </Link>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
}

