import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CourseCard from '@/components/CourseCard'
import { BookMarked, User, Search } from 'lucide-react'

export default async function DashboardPage({ searchParams }: { searchParams: { q?: string } }) {
    const query = searchParams.q?.toLowerCase() || ''
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Por favor inicia sesión.</div>
    }

    const { data: profile } = await supabase.from('ie_profiles').select('*').eq('id', user.id).single()

    if (profile?.rol === 'admin') {
        redirect('/admin/usuarios')
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

    // Filtrar para mostrar en Catálogo solo los que NO se han comprado y coincidan con la búsqueda
    let cursosDisponibles = cursos?.filter(c => !comprasIds.includes(c.id)) || []
    if (query) {
        cursosDisponibles = cursosDisponibles.filter(c => 
            c.titulo?.toLowerCase().includes(query) || 
            c.instructor?.toLowerCase().includes(query)
        )
    }

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
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center space-x-3 mb-4 md:mb-0">
                        <BookMarked className="h-7 w-7 text-indigo-600" />
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Catálogo de Cursos</h2>
                    </div>
                    <form action="/dashboard" method="GET" className="relative w-full md:w-96">
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
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Has explorado todos los cursos</h3>
                        <p className="text-gray-500 text-lg max-w-md mx-auto">No hay cursos nuevos disponibles en el catálogo en este momento. Revisa la pestaña de "Mis Cursos" para continuar aprendiendo.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
