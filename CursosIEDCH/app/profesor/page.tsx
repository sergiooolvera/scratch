import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { 
    Users, 
    BookOpen, 
    Award, 
    TrendingUp, 
    ChevronRight, 
    HelpCircle, 
    Heart, 
    Activity, 
    FileText, 
    CheckCircle2, 
    PlusCircle,
    Building2,
    GraduationCap,
    ArrowUpRight
} from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function ProfesorDashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('ie_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Validar rol del profesor/instructor/capacitador/institución/admin
    const rol = profile?.rol || 'alumno'
    const rolesAutorizados = ['admin', 'instructor', 'capacitador', 'institucion']
    if (!rolesAutorizados.includes(rol)) {
        redirect('/dashboard')
    }

    // --- CONSULTAS A BASE DE DATOS PARA MÉTRICAS REALES ---
    const maestroId = 'f160fe4d-5461-44c5-b868-51f1f0cae4c2';
    const allowedEmails = ['sergio.olver@gmail.com', 'maestro@iedch.com'];
    const userEmail = user?.email?.toLowerCase();

    const creadoresIds = [user.id];
    if (userEmail && allowedEmails.includes(userEmail)) {
        creadoresIds.push(maestroId);
    }
    
    // 1. Obtener cursos del profesor
    const { data: cursos } = await supabase
        .from('ie_cursos')
        .select('id, titulo, precio, estado, requiere_examen, created_at')
        .in('creado_por', creadoresIds)

    const cursoIds = cursos?.map(c => c.id) || []
    const totalCursosPlataforma = cursos?.filter(c => c.estado === 'aprobado').length || 0

    // 2. Obtener compras de esos cursos (alumnos y certificados de plataforma)
    let totalAlumnosPlataforma = 0
    let totalCertificadosPlataforma = 0
    
    if (cursoIds.length > 0) {
        // Alumnos únicos
        const { data: compras } = await supabase
            .from('ie_compras')
            .select('user_id')
            .in('curso_id', cursoIds)
            .eq('pagado', true)

        if (compras) {
            totalAlumnosPlataforma = new Set(compras.map(c => c.user_id)).size
        }

        // Cursos divididos por requerimiento de examen
        const cursosConExamen = cursos?.filter(c => c.requiere_examen === true).map(c => c.id) || []
        const cursosSinExamen = cursos?.filter(c => c.requiere_examen === false).map(c => c.id) || []

        // Certificados para cursos SIN examen (cada compra pagada es un certificado inmediato)
        if (cursosSinExamen.length > 0) {
            const { count: comprasSinExamenCount } = await supabase
                .from('ie_compras')
                .select('*', { count: 'exact', head: true })
                .in('curso_id', cursosSinExamen)
                .eq('pagado', true)
            
            totalCertificadosPlataforma += (comprasSinExamenCount || 0)
        }

        // Certificados para cursos CON examen (exámenes aprobados)
        if (cursosConExamen.length > 0) {
            const { count: examenesAprobadosCount } = await supabase
                .from('ie_examenes_usuario')
                .select('*', { count: 'exact', head: true })
                .in('curso_id', cursosConExamen)
                .eq('aprobado', true)
            
            totalCertificadosPlataforma += (examenesAprobadosCount || 0)
        }
    }

    // 3. Obtener datos de actividades si el rol es institución
    let totalAlumnosActividad = 0
    let totalActividades = 0
    let totalCertificadosActividad = 0
    let actividadesList: any[] = []

    if (rol === 'institucion') {
        const { data: actividades } = await supabase
            .from('ie_actividad_institucion')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (actividades) {
            actividadesList = actividades
            totalActividades = actividades.length
            const actIds = actividades.map(a => a.id)

            if (actIds.length > 0) {
                // Alumnos registrados en esas actividades
                const { data: alumnosAct } = await supabase
                    .from('ie_actividad_alumnos')
                    .select('id, folio_constancia')
                    .in('actividad_id', actIds)

                if (alumnosAct) {
                    totalAlumnosActividad = alumnosAct.length
                    totalCertificadosActividad = alumnosAct.filter(a => a.folio_constancia).length
                }
            }
        }
    }

    // 4. Obtener historial de modificaciones realizadas en los cursos del profesor
    let historialCambios: any[] = []
    if (cursoIds.length > 0) {
        const { data: historial } = await supabase
            .from('ie_curso_historial')
            .select('detalles_cambio, created_at, curso_id')
            .in('curso_id', cursoIds)
            .order('created_at', { ascending: false })
            .limit(10)
        
        if (historial) historialCambios = historial
    }

    // 5. Consolidar actividades del instructor / institución
    const actividadesRecientes: any[] = []

    // A. Cursos registrados/creados
    cursos?.forEach(c => {
        if (c.created_at) {
            actividadesRecientes.push({
                id: `curso-${c.id}`,
                tipo: 'curso_creado',
                titulo: 'Curso registrado',
                detalle: c.titulo,
                fecha: new Date(c.created_at)
            })
        }
    })

    // B. Modificaciones del historial
    historialCambios.forEach((h, idx) => {
        const cursoAsoc = cursos?.find(c => c.id === h.curso_id)
        if (h.created_at) {
            actividadesRecientes.push({
                id: `hist-${idx}-${h.created_at}`,
                tipo: 'curso_modificado',
                titulo: 'Curso editado',
                detalle: `${h.detalles_cambio} en "${cursoAsoc?.titulo || 'Curso'}"`,
                fecha: new Date(h.created_at)
            })
        }
    })

    // C. Actividades presenciales registradas (instituciones)
    if (rol === 'institucion') {
        actividadesList.forEach(a => {
            if (a.created_at) {
                actividadesRecientes.push({
                    id: `act-${a.id}`,
                    tipo: 'actividad_creada',
                    titulo: 'Actividad registrada',
                    detalle: a.nombre_actividad,
                    fecha: new Date(a.created_at)
                })
            }
        })
    }

    // Ordenar por fecha de forma descendente y tomar las 5 más recientes
    const actividadesOrdenadas = actividadesRecientes
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime())
        .slice(0, 5)

    // Helper para formatear tiempo relativo en español
    const getRelativeTime = (date: Date) => {
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffSec = Math.floor(diffMs / 1000)
        const diffMin = Math.floor(diffSec / 60)
        const diffHr = Math.floor(diffMin / 60)
        const diffDays = Math.floor(diffHr / 24)

        if (diffSec < 60) return 'Hace unos momentos'
        if (diffMin < 60) return `Hace ${diffMin} min`
        if (diffHr < 24) return `Hace ${diffHr} hora${diffHr > 1 ? 's' : ''}`
        if (diffDays < 7) return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`
        return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
    }

    // --- CONSOLIDAR MÉTRICAS REALES ---
    const stats = {
        alumnos: totalAlumnosPlataforma + totalAlumnosActividad,
        cursos: (rol === 'institucion') ? (totalCursosPlataforma + totalActividades) : totalCursosPlataforma,
        certificados: totalCertificadosPlataforma + totalCertificadosActividad
    }

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] font-sans antialiased text-slate-800 pb-16">
            {/* Header del Dashboard */}
            <div className="bg-white border-b border-slate-200/80 shadow-xs">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                Panel de Control
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-2">
                                ¡Hola, {profile?.nombre || user.email}!
                            </h1>
                            <p className="text-sm text-slate-500 mt-1">
                                Gestiona tus programas académicos, cursos e instructores.
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400">Rol de Acceso</p>
                            <p className="text-sm font-bold text-slate-700 capitalize mt-0.5 bg-slate-100 px-3 py-1 rounded-lg inline-block border border-slate-200">
                                {rol === 'institucion' ? '🏢 Institución' : rol === 'capacitador' ? '👨‍🏫 Capacitador' : '🎓 Instructor'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                {/* 1. Fila Superior: Banners de Creación */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Banner Crear Academia */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50/70 to-emerald-100/40 rounded-3xl border border-emerald-500/10 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:shadow-md hover:border-emerald-500/20 transition-all group">
                        <div className="flex-1 space-y-4 z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
                                    <Building2 className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-emerald-950">Crear Academia</h3>
                            </div>
                            <p className="text-sm text-emerald-800 leading-relaxed max-w-xs">
                                Crea tu academia con tu identidad, agrega instructores y ofrece programas.
                            </p>
                            <Link 
                                href={rol === 'institucion' ? "/institucion/crear" : "#"}
                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                            >
                                Crear Academia <PlusCircle className="h-4 w-4" />
                            </Link>
                        </div>
                        {/* Ilustración de la Escuela */}
                        <div className="relative w-full sm:w-36 h-28 flex items-end justify-center sm:justify-end select-none pointer-events-none transition-transform duration-300 group-hover:scale-105">
                            <svg className="w-32 h-28 text-emerald-600/90" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="25" y="40" width="50" height="50" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2"/>
                                <path d="M15 40L50 15L85 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                <rect x="42" y="65" width="16" height="25" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="2"/>
                                <circle cx="50" cy="40" r="6" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="1.5"/>
                                <line x1="15" y1="90" x2="85" y2="90" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                                <path d="M68 15V5M68 5H75M68 9H73" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                        </div>
                    </div>

                    {/* Banner Crear Curso */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-50/70 to-indigo-100/40 rounded-3xl border border-indigo-500/10 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 hover:shadow-md hover:border-indigo-500/20 transition-all group">
                        <div className="flex-1 space-y-4 z-10">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
                                    <BookOpen className="h-6 w-6" />
                                </div>
                                <h3 className="text-xl sm:text-2xl font-bold text-indigo-950">Crear Curso</h3>
                            </div>
                            <p className="text-sm text-indigo-800 leading-relaxed max-w-xs">
                                Diseña y publica cursos de forma rápida y sencilla.
                            </p>
                            <Link 
                                href="/profesor/subir-curso"
                                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                            >
                                Crear Curso <PlusCircle className="h-4 w-4" />
                            </Link>
                        </div>
                        {/* Ilustración de la Laptop y el Birrete */}
                        <div className="relative w-full sm:w-36 h-28 flex items-end justify-center sm:justify-end select-none pointer-events-none transition-transform duration-300 group-hover:scale-105">
                            <svg className="w-36 h-24 text-indigo-600/90" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect x="20" y="10" width="80" height="50" rx="4" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="2.5"/>
                                <rect x="10" y="60" width="100" height="8" rx="2" fill="currentColor" stroke="currentColor" strokeWidth="2.5"/>
                                <line x1="45" y1="64" x2="75" y2="64" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                <polygon points="60,25 75,32 60,39 45,32" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M50,34.5 V42 C50,45 70,45 70,42 V34.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <path d="M75,32 V43" stroke="currentColor" strokeWidth="1.5"/>
                                <circle cx="75" cy="43" r="2" fill="currentColor"/>
                            </svg>
                        </div>
                    </div>
                </div>

                {/* 2. Sección: Resumen Rápido */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 tracking-tight">
                        Resumen rápido
                    </h2>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        {/* Alumnos */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                                <Users className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-slate-400 font-medium tracking-wide">Alumnos</p>
                                <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.alumnos.toLocaleString()}</p>
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                                    ↑ 12% <span className="text-slate-400 font-normal">vs mes anterior</span>
                                </span>
                            </div>
                        </div>

                        {/* Cursos Publicados */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-slate-400 font-medium tracking-wide">Cursos publicados</p>
                                <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.cursos}</p>
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                                    ↑ 8% <span className="text-slate-400 font-normal">vs mes anterior</span>
                                </span>
                            </div>
                        </div>

                        {/* Certificados Emitidos */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4 hover:shadow-md transition-shadow">
                            <div className="h-12 w-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                <Award className="h-6 w-6" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs text-slate-400 font-medium tracking-wide">Certificados emitidos</p>
                                <p className="text-2xl font-black text-slate-800 mt-0.5">{stats.certificados.toLocaleString()}</p>
                                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 mt-0.5">
                                    ↑ 15% <span className="text-slate-400 font-normal">vs mes anterior</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Sección: Fila Inferior 50/50 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Columna Izquierda: Mis Academias */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                                <h3 className="font-bold text-slate-900 text-lg">Mis academias</h3>
                                <Link href="#" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors">
                                    Ver todas (3)
                                </Link>
                            </div>

                            <div className="space-y-4">
                                {/* Academia 1 */}
                                <Link href="#" className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 rounded-2xl transition border border-transparent hover:border-slate-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-indigo-950 flex items-center justify-center text-white">
                                            <Heart className="h-6 w-6 fill-white" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                                Academia de Salud EGAC
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                12 cursos <span className="mx-1.5 text-slate-300">•</span> 745 alumnos
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </Link>

                                {/* Academia 2 */}
                                <Link href="#" className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 rounded-2xl transition border border-transparent hover:border-slate-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
                                            AE
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                                                Academia de Enfermería
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                8 cursos <span className="mx-1.5 text-slate-300">•</span> 320 alumnos
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </Link>

                                {/* Academia 3 */}
                                <Link href="#" className="flex items-center justify-between p-3.5 hover:bg-slate-50/80 rounded-2xl transition border border-transparent hover:border-slate-100 group">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                            AU
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
                                                Academia de Urgencias
                                            </h4>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                4 cursos <span className="mx-1.5 text-slate-300">•</span> 183 alumnos
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                </Link>
                            </div>
                        </div>

                        {/* Link al listado de cursos actuales */}
                        <div className="mt-8 border-t border-slate-100 pt-4">
                            <Link 
                                href="/profesor/cursos" 
                                className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs py-3 rounded-xl transition-all"
                            >
                                Gestionar Todos mis Cursos Creados <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Columna Derecha: Actividad Reciente */}
                    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
                        <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-100">
                            <h3 className="font-bold text-slate-900 text-lg">Actividad reciente</h3>
                        </div>

                        <div className="space-y-4">
                            {actividadesOrdenadas.length > 0 ? (
                                actividadesOrdenadas.map((act) => {
                                    let iconBg = 'bg-slate-50'
                                    let iconColor = 'text-slate-600'
                                    let IconComponent = BookOpen

                                    if (act.tipo === 'curso_creado') {
                                        iconBg = 'bg-indigo-50'
                                        iconColor = 'text-indigo-600'
                                        IconComponent = BookOpen
                                    } else if (act.tipo === 'curso_modificado') {
                                        iconBg = 'bg-amber-50'
                                        iconColor = 'text-amber-600'
                                        IconComponent = FileText
                                    } else if (act.tipo === 'actividad_creada') {
                                        iconBg = 'bg-emerald-50'
                                        iconColor = 'text-emerald-600'
                                        IconComponent = Building2
                                    }

                                    return (
                                        <div key={act.id} className="flex items-start justify-between p-2 rounded-xl">
                                            <div className="flex items-center gap-3.5 min-w-0">
                                                <div className={`h-10 w-10 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} shrink-0`}>
                                                    <IconComponent className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="font-bold text-slate-900 text-xs">{act.titulo}</h5>
                                                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-[200px] sm:max-w-xs md:max-w-md">
                                                        {act.detalle}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] text-slate-400 shrink-0 font-medium ml-2">
                                                {getRelativeTime(act.fecha)}
                                            </span>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-sm">
                                    No hay actividades recientes registradas.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Minimalista */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
                    <div>
                        © {new Date().getFullYear()} EGAC. Todos los derechos reservados.
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="#" className="flex items-center gap-1 hover:text-slate-600 transition-colors">
                            <HelpCircle className="h-3.5 w-3.5" /> Ayuda
                        </Link>
                        <Link href="#" className="hover:text-slate-600 transition-colors">
                            Soporte
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    )
}
