import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseCard from '@/components/CourseCard'
import { BookMarked, User, Search } from 'lucide-react'
import Link from 'next/link'

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

    if (profile?.rol === 'institucion') {
        redirect('/institucion/registrar-actividad')
    }

    const { data: cursos } = await supabase
        .from('ie_cursos')
        .select('*')
        .eq('estado', 'aprobado')

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
        { id: 'todas', label: 'Todas las Áreas', icon: '🌐', color: 'indigo' },
        { id: 'desarrollo', label: 'Desarrollo Humano', icon: '🧠', color: 'purple' },
        { id: 'salud', label: 'Salud y Medicina', icon: '🩺', color: 'emerald' },
        { id: 'arte', label: 'Arte y Cultura', icon: '🎨', color: 'pink' },
        { id: 'tecnologia', label: 'Tecnología y Ciencia', icon: '💻', color: 'blue' },
        { id: 'educacion', label: 'Educación', icon: '📚', color: 'amber' },
    ]

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans">
            <div className="bg-white border-b border-gray-200 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <div className="flex items-center space-x-4">
                        <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shadow-inner">
                            <User className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                ¡Hola de nuevo, {profile?.nombre || user.email}!
                            </h1>
                            <p className="mt-1 text-lg text-gray-500">
                                Rol actual: <span className="font-semibold capitalize text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{profile?.rol || 'Alumno'}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
                    <div className="flex items-center space-x-3">
                        <BookMarked className="h-7 w-7 text-indigo-600" />
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Catálogo de Cursos</h2>
                    </div>
                    
                    {/* Barra de Búsqueda */}
                    <form action="/dashboard" method="GET" className="relative w-full md:w-96">
                        {activeCategory !== 'todas' && (
                            <input type="hidden" name="category" value={activeCategory} />
                        )}
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Buscar curso o instructor..."
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black shadow-sm"
                        />
                    </form>
                </div>

                {/* Fila de Píldoras de Categoría */}
                <div className="flex flex-wrap gap-2.5 mb-10 overflow-x-auto pb-2 scrollbar-none">
                    {categorias.map((cat) => {
                        const isSelected = activeCategory === cat.id
                        const linkUrl = `/dashboard?category=${cat.id}${query ? `&q=${query}` : ''}`
                        
                        // Personalización del badge según la selección
                        let badgeStyle = "bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300"
                        if (isSelected) {
                            if (cat.id === 'todas') badgeStyle = "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            if (cat.id === 'desarrollo') badgeStyle = "bg-purple-600 border-purple-600 text-white shadow-sm"
                            if (cat.id === 'salud') badgeStyle = "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                            if (cat.id === 'arte') badgeStyle = "bg-pink-600 border-pink-600 text-white shadow-sm"
                            if (cat.id === 'tecnologia') badgeStyle = "bg-blue-600 border-blue-600 text-white shadow-sm"
                            if (cat.id === 'educacion') badgeStyle = "bg-amber-600 border-amber-600 text-white shadow-sm"
                        }

                        return (
                            <Link 
                                href={linkUrl} 
                                key={cat.id}
                                scroll={false}
                                className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${badgeStyle}`}
                            >
                                <span className="text-base">{cat.icon}</span>
                                <span>{cat.label}</span>
                            </Link>
                        )
                    })}
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
                    <div className="text-center bg-white p-16 rounded-3xl border border-dashed border-gray-300 shadow-sm">
                        <div className="mx-auto h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                            <BookMarked className="h-10 w-10 text-gray-400" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No se encontraron cursos</h3>
                        <p className="text-gray-500 text-base max-w-md mx-auto">No hay cursos disponibles en la categoría seleccionada bajo los criterios actuales de búsqueda.</p>
                        <Link href="/dashboard" className="mt-5 inline-block text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-5 py-2 rounded-full">
                            Ver todos los cursos
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}

