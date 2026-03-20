import { createClient } from '@/lib/supabase/server'
import CourseCard from '@/components/CourseCard'
import { GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default async function MisCursosPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return <div className="p-8">Por favor inicia sesión.</div>
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

    // Filtrar para mostrar solo los comprados
    const misCursos = cursos?.filter(c => comprasIds.includes(c.id)) || []

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex items-center space-x-3 mb-8">
                    <div className="bg-blue-600 p-2 rounded-lg">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mis Cursos Comprados</h1>
                </div>

                {misCursos.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {misCursos.map((curso: any) => (
                            <CourseCard
                                key={curso.id}
                                course={curso}
                                isPagado={true}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center bg-white p-16 rounded-3xl border border-dashed border-gray-300 shadow-sm mt-8">
                        <div className="mx-auto h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                            <GraduationCap className="h-10 w-10 text-blue-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Aún no tienes cursos</h3>
                        <p className="text-gray-500 text-lg max-w-md mx-auto mb-8">Explora nuestro catálogo para encontrar el curso perfecto para ti e impulsa tu carrera.</p>
                        <Link href="/dashboard" className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors">
                            Explorar Catálogo
                        </Link>
                    </div>
                )}
            </div>
        </div>
    )
}
