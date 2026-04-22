import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Lock, CreditCard } from 'lucide-react'
import BotonDescarga from './BotonDescarga'
import CertificadoDocument from '@/components/CertificadoDocument'

export default async function CertificadoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // 1. Obtener datos del curso
    const { data: curso } = await supabase
        .from('ie_cursos')
        .select('id, titulo, duracion, vigencia_anos, requiere_pago_completo, requiere_examen')
        .eq('id', id)
        .single()
    
    if (!curso) notFound()

    // 2. Obtener datos de la compra
    const { data: compra } = await supabase
        .from('ie_compras')
        .select('*')
        .eq('curso_id', id)
        .eq('user_id', user.id)
        .eq('pagado', true)
        .single()

    if (!compra) {
        redirect(`/cursos/${id}/contenido`)
    }

    const requiereExamen = curso.requiere_examen !== false
    let folioVenta = ''
    let createdDate = ''
    let idParaQR = ''

    if (requiereExamen) {
        const { data: examenRow } = await supabase.from('ie_examenes').select('id').eq('curso_id', id).single()
        if (!examenRow) notFound()

        const { data: rows } = await supabase
            .from('ie_resultados_examenes')
            .select('id, aprobado, created_at')
            .eq('examen_id', examenRow.id)
            .eq('user_id', user.id)
            .eq('aprobado', true)
            .order('created_at', { ascending: false })
            .limit(1)
        
        if (!rows || rows.length === 0) {
            redirect(`/cursos/${id}/contenido`)
        }
        
        folioVenta = rows[0].id.toUpperCase()
        createdDate = rows[0].created_at
        idParaQR = rows[0].id
    } else {
        // CURSO SIN EXAMEN: El folio es el ID de la compra
        folioVenta = compra.id.toUpperCase()
        createdDate = compra.created_at
        idParaQR = compra.id
    }

    const cursoPagoRequerido = curso.requiere_pago_completo || false
    const pagoCompleto = cursoPagoRequerido ? (compra?.pago_completo || false) : true

    const { data: profile } = await supabase.from('ie_profiles').select('nombre, apellido_paterno, apellido_materno').eq('id', user.id).single()
    const alumnoNombre = profile ? `${profile.nombre || ''} ${profile.apellido_paterno || ''} ${profile.apellido_materno || ''}`.replace(/\s+/g, ' ').trim() || 'Alumno' : 'Alumno'

    // Formateo de fecha
    const fechaAprobacion = new Date(createdDate);
    const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const fechaFormateada = fechaAprobacion.toLocaleDateString('es-MX', opcionesFecha);

    const vigAnos = curso.vigencia_anos || 3;
    const fechaVig = new Date(fechaAprobacion);
    fechaVig.setFullYear(fechaVig.getFullYear() + vigAnos);
    const vigStr = fechaVig.toLocaleDateString('es-MX', opcionesFecha);

    return (
        <div className="bg-gray-100 min-h-[calc(100vh-64px)] py-12 flex flex-col items-center justify-start relative">
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#0f172a] to-transparent opacity-90 z-0" />

            <div className="max-w-6xl w-full px-4 z-10">
                <Link
                    href={`/cursos/${id}/contenido`}
                    className="inline-flex items-center text-sm font-medium text-blue-100 hover:text-white mb-8 transition-colors font-sans bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al curso
                </Link>

                {!pagoCompleto ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="bg-white p-8 rounded-3xl shadow-lg max-w-md w-full border border-amber-200">
                            <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
                                <Lock className="h-8 w-8 text-amber-500" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900 mb-3 text-center">Constancia pendiente de pago</h2>
                            <p className="text-gray-600 text-sm mb-3 leading-relaxed text-center">
                                ¡Felicidades por completar el curso! Pero utilizaste un cupón de descuento. Para descargar tu constancia deberás cubrir el valor total del curso.
                            </p>
                            <div className="grid grid-cols-1 gap-3">
                                <Link href={`/cursos/${id}`} className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm">
                                    <CreditCard className="w-4 h-4 mr-2" />
                                    Ir a Pagar el Curso Completo
                                </Link>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="flex justify-start sm:justify-center w-full overflow-x-auto pb-6">
                            <CertificadoDocument
                                id="certificado-content"
                                alumnoNombre={alumnoNombre}
                                cursoTitulo={curso.titulo}
                                cursoDuracion={curso.duracion}
                                fechaAprobacion={fechaFormateada}
                                folio={folioVenta}
                                vigenciaStr={vigStr}
                                qrUrl={`https://cursos-iedch.vercel.app/validar?folio=${idParaQR}`}
                                className="shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]"
                            />
                        </div>

                        <div className="flex justify-center mt-12 mb-20 font-sans z-10 relative">
                            <BotonDescarga 
                                userEmail={user.email || ''} 
                                cursoTitulo={curso.titulo} 
                                cursoId={curso.id} 
                                folio={folioVenta}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
