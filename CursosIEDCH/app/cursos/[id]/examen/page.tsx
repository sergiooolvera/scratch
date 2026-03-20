import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import ExamenClient from './ExamenClient'

export default async function ExamenContenidoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify purchase
    const { data: compra } = await supabase
        .from('ie_compras')
        .select('*')
        .eq('curso_id', id)
        .eq('user_id', user.id)
        .eq('pagado', true)
        .single()

    if (!compra) {
        redirect(`/cursos/${id}`)
    }

    // Fetch course details
    const { data: curso } = await supabase
        .from('ie_cursos')
        .select('*')
        .eq('id', id)
        .single()

    if (!curso) {
        notFound()
    }

    if (!curso.requiere_examen) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center text-gray-700">
                <h1 className="text-3xl font-bold mb-4">No hay examen disponible</h1>
                <p>Este curso no cuenta con un examen final configurado.</p>
                <a href={`/cursos/${id}/contenido`} className="text-blue-600 hover:underline mt-6 inline-block">Volver al contenido</a>
            </div>
        );
    }

    // Fetch the exam
    const { data: examen, error: exmError } = await supabase
        .from('ie_examenes')
        .select('id')
        .eq('curso_id', id)
        .single()

    if (exmError || !examen) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center text-red-700">
                <h1 className="text-3xl font-bold mb-4">Error cargando evaluación</h1>
                <p>El maestro indicó que requiere examen, pero no se ha cargado el formulario interactivo.</p>
                <a href={`/cursos/${id}/contenido`} className="text-blue-600 hover:underline mt-6 inline-block">Volver al contenido</a>
            </div>
        );
    }

    // Fetch ONLY the questions, explicitly avoiding `respuesta_correcta` so it doesn't leak to the client bundle
    const { data: preguntas, error: pregError } = await supabase
        .from('ie_preguntas')
        .select('id, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, orden')
        .eq('examen_id', examen.id)
        .order('orden', { ascending: true })

    if (pregError || !preguntas || preguntas.length === 0) {
        return (
            <div className="max-w-3xl mx-auto px-4 py-12 text-center text-red-700">
                <h1 className="text-3xl font-bold mb-4">Error cargando preguntas</h1>
                <p>No se encontraron las preguntas del examen asociadas a este curso.</p>
                <a href={`/cursos/${id}/contenido`} className="text-blue-600 hover:underline mt-6 inline-block">Volver al contenido</a>
            </div>
        );
    }

    /* Format to ensure type safety */
    const preguntasFormateadas = preguntas.map(p => ({
        id: p.id,
        pregunta: p.pregunta,
        opcion_a: p.opcion_a,
        opcion_b: p.opcion_b,
        opcion_c: p.opcion_c,
        opcion_d: p.opcion_d
    }));


    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans">
            <ExamenClient
                cursoId={id}
                cursoTitulo={curso.titulo}
                preguntas={preguntasFormateadas}
            />
        </div>
    )
}
