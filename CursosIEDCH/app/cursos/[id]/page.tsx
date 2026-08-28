import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import CourseHero from './CourseHero'
import CourseSyllabus from './CourseSyllabus'
import CourseCompetencies from './CourseCompetencies'
import CourseInstructorCard from './CourseInstructorCard'
import CourseReviews from './CourseReviews'
import CourseProcessSteps from './CourseProcessSteps'
import ExploreBanner from './ExploreBanner'
import CourseActions from './CourseActions'
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
        title: `${curso.titulo} | EGAC Cursos`,
        description: cleanDescription,
        openGraph: {
            title: curso.titulo,
            description: cleanDescription,
            url: shareUrl,
            siteName: 'EGAC Portal',
            images: [
                {
                    url: imageUrl,
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

    // 1. Obtener la información del curso
    const { data: curso } = await supabase
        .from('ie_cursos')
        .select('*')
        .eq('id', id)
        .single()

    if (!curso) {
        notFound()
    }

    // 2. Comprobar la sesión del usuario
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Variables de estado del usuario respecto al curso
    let compra = null
    let esCreadoPorInstructor = false
    let creatorVerificado = true
    let instructorNombre = curso.instructor || 'Dr. Juan Carlos Ramírez'
    let instructorEspecialidad = 'Enfermero Especialista en Cuidados Domiciliarios'
    let instructorBio = 'Enfermero con más de 10 años de experiencia en atención domiciliaria y docencia. Especialista en cuidados del adulto mayor y manejo de pacientes crónicos.'
    let instructorFoto = null
    let instructorNivel = null
    let instructorExp = null
    let instructorInst = null
    let instructorCedula = null
    let isPagado = false
    let pagoCompleto = false
    let isAprobado = false

    if (curso?.creado_por) {
        const { data: creatorProfile } = await supabase
            .from('ie_profiles')
            .select('rol, verificado, nombre, apellido_paterno, apellido_materno, profesion_especialidad, presentacion_profesional, fotografia_perfil, nivel_academico, anos_experiencia, institucion_labora, cedula_profesional')
            .eq('id', curso.creado_por)
            .single()

        if (creatorProfile) {
            esCreadoPorInstructor = creatorProfile.rol === 'instructor'
            if (creatorProfile.verificado !== undefined && creatorProfile.verificado !== null) {
                creatorVerificado = creatorProfile.verificado
            }
            if (creatorProfile.nombre) {
                instructorNombre = [creatorProfile.nombre, creatorProfile.apellido_paterno, creatorProfile.apellido_materno].filter(Boolean).join(' ')
            }
            if (creatorProfile.profesion_especialidad) {
                instructorEspecialidad = creatorProfile.profesion_especialidad
            }
            if (creatorProfile.presentacion_profesional) {
                instructorBio = creatorProfile.presentacion_profesional
            }
            if (creatorProfile.fotografia_perfil) {
                instructorFoto = creatorProfile.fotografia_perfil
            }
            if (creatorProfile.nivel_academico) {
                instructorNivel = creatorProfile.nivel_academico
            }
            if (creatorProfile.anos_experiencia) {
                instructorExp = creatorProfile.anos_experiencia
            }
            if (creatorProfile.institucion_labora) {
                instructorInst = creatorProfile.institucion_labora
            }
            if (creatorProfile.cedula_profesional) {
                instructorCedula = creatorProfile.cedula_profesional
            }
        }
    }

    if (user) {
        const maestroId = 'f160fe4d-5461-44c5-b868-51f1f0cae4c2'
        const allowedEmails = ['sergio.olver@gmail.com', 'maestro@iedch.com']
        const userEmail = user?.email?.toLowerCase()

        if (curso.creado_por === maestroId) {
            if (!userEmail || !allowedEmails.includes(userEmail)) {
                notFound()
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

        if (curso.requiere_examen) {
            const { data: examenRow } = await supabase
                .from('ie_examenes')
                .select('id')
                .eq('curso_id', id)
                .is('modulo_id', null)
                .single()

            if (examenRow) {
                const { data: resultRow } = await supabase
                    .from('ie_resultados_examenes')
                    .select('aprobado')
                    .eq('examen_id', examenRow.id)
                    .eq('user_id', user.id)
                    .eq('aprobado', true)
                    .limit(1)

                if (resultRow && resultRow.length > 0) {
                    isAprobado = true
                }
            }
        }
    }

    const constanciaRequierePago = ((curso.requiere_pago_completo || false) || (esCreadoPorInstructor && curso.precio === 0)) && !pagoCompleto

    const esCerrada = curso.modalidad === 'cerrada'
    let limiteDate: Date | null = null
    if (curso.limite_inscripcion) {
        const [y, m, d] = curso.limite_inscripcion.split('-').map(Number)
        limiteDate = new Date(y, m - 1, d, 23, 59, 59, 999)
    }
    const haExpirado = esCerrada && limiteDate && (new Date() > limiteDate)

    return (
        <div className="min-h-screen bg-slate-50/50 py-6 px-4 sm:px-6 lg:px-8">
            <div className="max-w-[1400px] mx-auto">
                {/* Botón de Compartir */}
                <div className="flex justify-end mb-3">
                    <ShareButton title={curso.titulo} />
                </div>

                {/* Alerta de Inscripciones Cerradas si aplica */}
                {haExpirado && !isPagado && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3">
                        <div className="bg-rose-100 p-2 rounded-full text-rose-600 shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h4 className="text-rose-900 font-bold text-base">Inscripciones Cerradas</h4>
                            <p className="text-rose-700 text-sm mt-1">El periodo de inscripción para este curso finalizó.</p>
                        </div>
                    </div>
                )}

                {/* Grid Superior de 2 Columnas (Contenido Principal + Checkout Card) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Columna Izquierda: Hero y Grid de 3 Tarjetas en fila */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* 1. Hero Superior */}
                        <CourseHero
                            titulo={curso.titulo}
                            descripcion={curso.descripcion}
                            duracion={curso.duracion}
                            modalidad={curso.modalidad === 'cerrada' ? 'Modalidad cerrada' : 'En línea'}
                            imagenUrl={curso.imagen_url}
                        />

                        {/* 2. Grid de 3 Tarjetas en una sola fila (Temario, Competencias, Instructor) */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                            <CourseSyllabus
                                temario={curso.temario}
                                descripcionDefault={curso.descripcion}
                            />
                            <CourseCompetencies
                                competencias={curso.competencias}
                                beneficiosFallback={curso.beneficios}
                            />
                            <CourseInstructorCard
                                nombre={instructorNombre}
                                especialidad={instructorEspecialidad}
                                presentacion={instructorBio}
                                fotografiaUrl={instructorFoto}
                                verificado={creatorVerificado}
                                nivelAcademico={instructorNivel}
                                anosExperiencia={instructorExp}
                                institucionLabora={instructorInst}
                                cedulaProfesional={instructorCedula}
                            />
                        </div>
                    </div>

                    {/* Columna Derecha: Tarjeta de Compra / Accesos Sticky */}
                    <div className="lg:col-span-4">
                        <div id="tour-informacion-curso">
                            <CourseActions
                                cursoId={curso.id}
                                isPagado={isPagado}
                                pagoCompleto={pagoCompleto}
                                constanciaRequierePago={constanciaRequierePago}
                                isAprobado={isAprobado}
                                requiereExamen={curso.requiere_examen}
                                userId={user?.id || ''}
                                precioCurso={curso.precio}
                                montoPagado={compra?.monto_pagado || 0}
                                esCreadoPorInstructor={esCreadoPorInstructor}
                                mostrarExamenFinal={curso.mostrar_examen_final !== undefined ? curso.mostrar_examen_final : true}
                                mostrarConstancia={curso.mostrar_constancia !== undefined ? curso.mostrar_constancia : true}
                            />
                        </div>
                    </div>
                </div>

                {/* Secciones de Ancho Completo (Full Width) */}
                <div className="w-full space-y-6 mt-6">
                    {/* 3. Valoraciones y opiniones */}
                    <div id="tour-opiniones-curso">
                        <CourseReviews
                            cursoId={curso.id}
                            isPagado={isPagado}
                            currentUserId={user?.id || ''}
                        />
                    </div>

                    {/* 4. Proceso de 5 pasos para la constancia */}
                    <CourseProcessSteps />

                    {/* 5. Banner Inferior: Explorar todos los cursos */}
                    <ExploreBanner />
                </div>
            </div>
        </div>
    )
}
