import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import CourseActions from './CourseActions'
import CourseReviews from './CourseReviews'
import ShareButton from './ShareButton'
import { Metadata } from 'next'
import { headers } from 'next/headers'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params
    const supabase = await createClient()
    const { data: curso } = await supabase
        .from('ie_cursos')
        .select('titulo, descripcion, imagen_url')
        .eq('id', id)
        .single()

    if (!curso) {
        return {}
    }

    const headersList = await headers()
    const host = headersList.get('host') || 'cursos.grupoegac.com'
    const protocol = host.includes('localhost') ? 'http' : 'https'
    const appUrl = `${protocol}://${host}`
    const shareUrl = `${appUrl}/cursos/${id}`
    
    let imageUrl = curso.imagen_url || '/mundo.jpeg'
    if (imageUrl.startsWith('/')) {
        imageUrl = `${appUrl}${imageUrl}`
    }

    const cleanDescription = (curso.descripcion || 'Aprende con nosotros en EGAC').replace(/\r?\n|\r/g, ' ')

    return {
        title: curso.titulo,
        description: cleanDescription,
        openGraph: {
            title: curso.titulo,
            description: cleanDescription,
            url: shareUrl,
            siteName: 'EGAC Portal',
            images: [
                {
                    url: imageUrl,
                    width: 1200,
                    height: 630,
                    alt: curso.titulo,
                }
            ],
            locale: 'es_MX',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: curso.titulo,
            description: cleanDescription,
            images: [imageUrl],
        }
    }
}

export default async function CursoDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()

    // 1. Obtener la información del curso primero para que esté disponible para el renderizado básico y los metadatos
    const { data: curso } = await supabase
        .from('ie_cursos')
        .select('*')
        .eq('id', id)
        .single()

    if (!curso) {
        notFound()
    }

    // 2. Comprobar si el solicitante es un bot o crawler de redes sociales
    const headersList = await headers()
    const userAgent = headersList.get('user-agent') || ''
    const isBot = /bot|facebookexternalhit|WhatsApp|telegram|slack|twitter|discord|crawl|spider/i.test(userAgent)

    // 3. Comprobar la sesión del usuario
    const { data: { user } } = await supabase.auth.getUser()

    // 4. Variables de estado del usuario respecto al curso
    let compra = null
    let esCreadoPorInstructor = false
    let isPagado = false
    let pagoCompleto = false
    let isAprobado = false

    if (curso?.creado_por) {
        const { data: creatorProfile } = await supabase
            .from('ie_profiles')
            .select('rol')
            .eq('id', curso.creado_por)
            .single()
        esCreadoPorInstructor = creatorProfile?.rol === 'instructor'
    }

    if (user) {
        const maestroId = 'f160fe4d-5461-44c5-b868-51f1f0cae4c2';
        const allowedEmails = ['sergio.olver@gmail.com', 'maestro@iedch.com'];
        const userEmail = user?.email?.toLowerCase();

        if (curso.creado_por === maestroId) {
            if (!userEmail || !allowedEmails.includes(userEmail)) {
                notFound();
            }
        }

        const { data: compraRes } = await supabase
            .from('ie_compras')
            .select('*')
            .eq('curso_id', id)
            .eq('user_id', user.id)
            .single()
        
        compra = compraRes
        isPagado = compra?.pagado || false
        pagoCompleto = compra?.pago_completo || false

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
        }
    }

    const constanciaRequierePago = ((curso.requiere_pago_completo || false) || (esCreadoPorInstructor && curso.precio === 0)) && !pagoCompleto

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="bg-white shadow rounded-lg p-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h1 className="text-3xl font-bold text-gray-900">{curso.titulo}</h1>
                    <div className="flex-shrink-0">
                        <ShareButton title={curso.titulo} />
                    </div>
                </div>
                <p className="text-gray-600 mb-6 text-justify">{curso.descripcion}</p>
 
                <div className="flex flex-col md:flex-row gap-8 mb-8">
                    {/* Información del Curso (izq) */}
                    <div className="flex-1 grid grid-cols-2 gap-4">
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
                            <p className="mt-1 text-sm text-gray-900 text-justify">{curso.beneficios}</p>
                        </div>
                        {curso.competencias && (
                            <div className="col-span-2">
                                <h3 className="text-sm font-medium text-gray-500">Competencias</h3>
                                <p className="mt-1 text-sm text-gray-900 whitespace-pre-wrap text-justify">{curso.competencias}</p>
                            </div>
                        )}
                        {!isPagado && (
                            <div className="col-span-2">
                                <h3 className="text-sm font-medium text-gray-500">Precio</h3>
                                <p className="mt-1 text-lg font-bold text-gray-900">
                                    {curso.precio && Number(curso.precio) > 0 ? `$${Number(curso.precio).toLocaleString('es-MX')}` : 'Gratuito'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Imagen del Curso (der) */}
                    <div className="w-full md:w-64 flex-shrink-0">
                        <div className="relative w-full aspect-square md:aspect-auto md:h-64 rounded-xl overflow-hidden border border-zinc-100 bg-zinc-50 shadow-sm">
                            <img
                                src={curso.imagen_url || '/mundo.jpeg'}
                                alt={curso.titulo}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
 
                <div className="border-t border-gray-200 pt-6">
                    {(() => {
                        const esCerrada = curso.modalidad === 'cerrada'
                        let limiteDate: Date | null = null
                        if (curso.limite_inscripcion) {
                            const [y, m, d] = curso.limite_inscripcion.split('-').map(Number)
                            limiteDate = new Date(y, m - 1, d, 23, 59, 59, 999)
                        }
                        const haExpirado = esCerrada && limiteDate && (new Date() > limiteDate)

                        if (haExpirado && !isPagado) {
                            const [y, m, d] = curso.limite_inscripcion.split('-').map(Number)
                            const dateLabel = new Date(y, m - 1, d).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                            return (
                                <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                                    <div className="bg-red-100 p-2 rounded-full text-red-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="text-red-900 font-bold text-base">Inscripciones Cerradas</h4>
                                        <p className="text-red-700 text-sm mt-1">El periodo de inscripción para este curso ha finalizado el día <strong>{dateLabel}</strong>.</p>
                                    </div>
                                </div>
                            )
                        }

                        if (!user) {
                            return (
                                <div className="text-center py-10 bg-zinc-50 rounded-xl border border-zinc-200 shadow-inner">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">¿Quieres tomar este curso?</h3>
                                    <p className="text-gray-600 mb-6 max-w-md mx-auto">Inicia sesión o crea una cuenta para inscribirte y comenzar a aprender hoy mismo a tu propio ritmo.</p>
                                    <a 
                                        href={`/login?next=/cursos/${curso.id}`} 
                                        className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all active:scale-95"
                                    >
                                        Iniciar Sesión o Registrarse
                                    </a>
                                </div>
                            )
                        }

                        return (
                            <CourseActions
                                cursoId={curso.id}
                                isPagado={isPagado}
                                pagoCompleto={pagoCompleto}
                                constanciaRequierePago={constanciaRequierePago}
                                isAprobado={isAprobado}
                                requiereExamen={curso.requiere_examen}
                                userId={user.id}
                                precioCurso={curso.precio}
                                montoPagado={compra?.monto_pagado || 0}
                                esCreadoPorInstructor={esCreadoPorInstructor}
                                mostrarExamenFinal={curso.mostrar_examen_final !== undefined ? curso.mostrar_examen_final : true}
                                mostrarConstancia={curso.mostrar_constancia !== undefined ? curso.mostrar_constancia : true}
                            />
                        )
                    })()}
                </div>
            </div>

            <CourseReviews 
                cursoId={curso.id}
                isPagado={isPagado}
                currentUserId={user?.id || ''}
            />
        </div>
    )
}
