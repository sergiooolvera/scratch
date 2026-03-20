import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, PlayCircle, FileText, CheckCircle } from 'lucide-react'
import ContentViewer from './ContentViewer'
import PlaylistClient from './PlaylistClient' // We'll extract client logic to a child component
import CourseQA from './CourseQA'

export const dynamic = 'force-dynamic'

export default async function CursoContenidoPage({ params }: { params: Promise<{ id: string }> }) {
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

    // Get User Profile for Q&A name
    const { data: profile } = await supabase
        .from('ie_profiles')
        .select('nombre')
        .eq('id', user.id)
        .single()
    const userName = profile?.nombre || user.email || 'Estudiante'

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

    // Fetch modules if available
    const { data: modulos } = await supabase
        .from('ie_curso_modulos')
        .select('*')
        .eq('curso_id', id)
        .order('orden', { ascending: true })

    // Check exam status
    let examPassed = false;
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
                examPassed = true;
            }
        }
    }

    // Build the initial list of items. Support legacy courses (single url_contenido) or new modular ones.
    const hasModulos = modulos && modulos.length > 0;

    // Legacy fallback structure so we treat everything like a list
    const playlist = hasModulos ? modulos : curso.url_contenido ? [{
        id: 'main',
        titulo: curso.titulo,
        url_contenido: curso.url_contenido
    }] : []

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Link
                    href={`/cursos/${id}`}
                    className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al panel del curso
                </Link>

                <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between border-b border-gray-200 pb-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            {curso.titulo}
                        </h1>
                        <p className="text-gray-500 mt-1">Impartido por {curso.instructor}</p>
                    </div>
                    {curso.requiere_examen && (
                        <div className="mt-4 md:mt-0 space-y-2 text-right">
                            {examPassed ? (
                                <>
                                    <a
                                        href={`/cursos/${id}/certificado`}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        <FileText className="mr-2 h-4 w-4" />
                                        Descargar Constancia
                                    </a>
                                    <p className="text-xs text-green-600 font-medium">¡Examen aprobado!</p>
                                </>
                            ) : (
                                <>
                                    <Link
                                        href={`/cursos/${id}/examen`}
                                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Hacer Examen
                                    </Link>
                                    <p className="text-xs text-gray-500">Demuestra lo aprendido y obtén tu constancia.</p>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    {/* Main Content Viewer (Handled by client component for state) */}
                    <PlaylistClient
                        playlist={playlist}
                        requiereExamen={curso.requiere_examen}
                        urlExamen={curso.url_examen}
                    />
                </div>

                {/* Q&A Section */}
                <div className="mt-8">
                    <CourseQA cursoId={id} userId={user.id} userName={userName} />
                </div>
            </div>
        </div>
    )
}
