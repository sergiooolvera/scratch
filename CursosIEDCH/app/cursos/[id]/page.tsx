import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CourseActions from './CourseActions'

export default async function CursoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: curso } = await supabase
        .from('ie_cursos')
        .select('*')
        .eq('id', id)
        .single()

    if (!curso) {
        notFound()
    }

    const { data: compra } = await supabase
        .from('ie_compras')
        .select('*')
        .eq('curso_id', id)
        .eq('user_id', user.id)
        .single()

    const isPagado = compra?.pagado || false

    let isAprobado = false;

    // Check if the course requires an exam
    if (curso.requiere_examen) {
        const { data: examenRow } = await supabase.from('ie_examenes').select('id').eq('curso_id', id).single();
        if (examenRow) {
            const { data: resultRow } = await supabase
                .from('ie_resultados_examenes')
                .select('aprobado')
                .eq('examen_id', examenRow.id)
                .eq('user_id', user.id)
                .eq('aprobado', true)
                .limit(1);
            if (resultRow && resultRow.length > 0) {
                isAprobado = true;
            }
        }
    } else {
        // If it doesn't require an exam, maybe they just get the certificate after completing?
        // But the user said "If approved, show certificate". 
        // For now, if no exam is required, we leave isAprobado false or deal with it if needed later.
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white shadow rounded-lg p-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{curso.titulo}</h1>
                <p className="text-gray-600 mb-6">{curso.descripcion}</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Instructor</h3>
                        <p className="mt-1 text-sm text-gray-900">{curso.instructor}</p>
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-gray-500">Duración</h3>
                        <p className="mt-1 text-sm text-gray-900">{curso.duracion}</p>
                    </div>
                    <div className="col-span-2">
                        <h3 className="text-sm font-medium text-gray-500">Beneficios</h3>
                        <p className="mt-1 text-sm text-gray-900">{curso.beneficios}</p>
                    </div>
                    {!isPagado && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-500">Precio</h3>
                            <p className="mt-1 text-lg font-bold text-gray-900">${curso.precio}</p>
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-200 pt-6">
                    <CourseActions
                        cursoId={curso.id}
                        isPagado={isPagado}
                        isAprobado={isAprobado}
                        requiereExamen={curso.requiere_examen}
                        userId={user.id}
                    />
                </div>
            </div>
        </div>
    )
}
