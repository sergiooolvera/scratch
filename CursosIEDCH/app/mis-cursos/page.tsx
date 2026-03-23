import { createClient } from '@/lib/supabase/server'
import CourseCard from '@/components/CourseCard'
import { GraduationCap, Search } from 'lucide-react'
import Link from 'next/link'

export default async function MisCursosPage({ searchParams }: { searchParams: { q?: string, compra_exitosa?: string, pago_pendiente?: string, voucher?: string } }) {
    const query = searchParams.q?.toLowerCase() || ''
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

    // Filtrar para mostrar solo los comprados y que coincidan con la búsqueda
    let misCursos = cursos?.filter(c => comprasIds.includes(c.id)) || []
    if (query) {
        misCursos = misCursos.filter(c => 
            c.titulo?.toLowerCase().includes(query) || 
            c.instructor?.toLowerCase().includes(query)
        )
    }

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div className="flex items-center space-x-3">
                        <div className="bg-blue-600 p-2 rounded-lg">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Mis Cursos Comprados</h1>
                    </div>
                    <form action="/mis-cursos" method="GET" className="relative w-full md:w-96">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            name="q"
                            defaultValue={query}
                            placeholder="Buscar en mis cursos..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-full leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-black shadow-sm"
                        />
                    </form>
                </div>

                {searchParams?.pago_pendiente === 'true' && (
                    <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-md">
                        <div className="flex">
                            <div className="ml-3 flex-1 flex flex-col sm:flex-row items-start sm:items-center justify-between">
                                <div>
                                    <h3 className="text-sm font-medium text-yellow-800">✅ Tu voucher se generó exitosamente</h3>
                                    <p className="text-sm text-yellow-700 mt-1 max-w-3xl">Si elegiste pagar en OXXO, recuerda que el pago puede tardar de 1 a 2 días hábiles en procesarse en nuestro sistema posterior a liquidarse en la caja. Una vez completado, tu curso aparecerá aquí automáticamente.</p>
                                </div>
                                {searchParams.voucher && (
                                    <div className="mt-4 sm:mt-0 flex-shrink-0">
                                        <a href={searchParams.voucher} target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-yellow-900 bg-yellow-200 hover:bg-yellow-300 transition-colors shadow-sm">
                                            Ver e Imprimir Ticket OXXO
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

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
