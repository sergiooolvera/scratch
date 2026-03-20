import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BotonDescarga from './BotonDescarga'
import CertificadoDocument from '@/components/CertificadoDocument'

export default async function CertificadoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Verify course & exam
    const { data: curso } = await supabase.from('ie_cursos').select('id, titulo, duracion, vigencia_anos').eq('id', id).single()
    if (!curso) notFound()

    const { data: examenRow } = await supabase.from('ie_examenes').select('id').eq('curso_id', id).single()
    if (!examenRow) notFound()

    // Verify they actually passed
    const { data: resultRow } = await supabase
        .from('ie_resultados_examenes')
        .select('id, aprobado, created_at')
        .eq('examen_id', examenRow.id)
        .eq('user_id', user.id)
        .eq('aprobado', true)
        .order('created_at', { ascending: false })
        .limit(1)

    if (!resultRow || resultRow.length === 0) {
        redirect(`/cursos/${id}/contenido`)
    }

    const { data: profile } = await supabase.from('ie_profiles').select('nombre').eq('id', user.id).single()
    const alumnoNombre = profile?.nombre || 'Alumno'

    // Formatting date
    const fechaAprobacion = new Date(resultRow[0].created_at);
    const opcionesFecha: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    const fechaFormateada = fechaAprobacion.toLocaleDateString('es-MX', opcionesFecha);

    // Formatting Folio: use the full UUID for exact validation match
    const folioVenta = resultRow[0].id.toUpperCase();

    const vigAnos = curso.vigencia_anos || 3;
    const fechaVig = new Date(fechaAprobacion);
    fechaVig.setFullYear(fechaVig.getFullYear() + vigAnos);
    const vigStr = fechaVig.toLocaleDateString('es-MX', opcionesFecha);

    return (
        <div className="bg-gray-100 min-h-[calc(100vh-64px)] py-12 flex flex-col items-center justify-start relative">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-[#0f172a] to-transparent opacity-90 z-0" />

            <div className="max-w-6xl w-full px-4 z-10">
                <Link
                    href={`/cursos/${id}/contenido`}
                    className="inline-flex items-center text-sm font-medium text-blue-100 hover:text-white mb-8 transition-colors font-sans bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al curso
                </Link>

                <div className="flex justify-start sm:justify-center w-full overflow-x-auto pb-6">
                    {/* Contenedor principal de la constancia imitando una hoja horizontal (landscape) premium */}
                    <CertificadoDocument
                        id="certificado-content"
                        alumnoNombre={alumnoNombre}
                        cursoTitulo={curso.titulo}
                        cursoDuracion={curso.duracion}
                        fechaAprobacion={fechaFormateada}
                        folio={folioVenta}
                        vigenciaStr={vigStr}
                        qrUrl={`https://cursos-iedch.vercel.app/validar?folio=${resultRow[0].id}`}
                        className="shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]"
                    />
                </div>

                <div className="flex justify-center mt-12 mb-20 font-sans z-10 relative">
                    <BotonDescarga />
                </div>
            </div>
        </div>
    )
}
