import { createClient } from '@/lib/supabase/server'

export default async function AdminActividadPage() {
    const supabase = await createClient()

    const { count: countUsuarios } = await supabase.from('ie_profiles').select('*', { count: 'exact', head: true })
    const { count: countCursos } = await supabase.from('ie_cursos').select('*', { count: 'exact', head: true })
    const { count: countCompras } = await supabase.from('ie_compras').select('*', { count: 'exact', head: true })
    const { count: countExamenes } = await supabase.from('ie_examenes_usuario').select('*', { count: 'exact', head: true })

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Actividad y Estadísticas</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg border">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Usuarios</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{countUsuarios || 0}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg border">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Total Cursos</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{countCursos || 0}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg border">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Compras (Mock)</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{countCompras || 0}</dd>
                    </div>
                </div>
                <div className="bg-white overflow-hidden shadow rounded-lg border">
                    <div className="px-4 py-5 sm:p-6">
                        <dt className="text-sm font-medium text-gray-500 truncate">Exámenes presentados</dt>
                        <dd className="mt-1 text-3xl font-semibold text-gray-900">{countExamenes || 0}</dd>
                    </div>
                </div>
            </div>
        </div>
    )
}
