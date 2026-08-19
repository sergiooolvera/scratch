import { createClient } from '@/lib/supabase/server'
import { FolderHeart, Award, ShieldCheck, Download, GraduationCap } from 'lucide-react'
import Link from 'next/link'

export default async function ExpedientePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <div className="flex min-h-[calc(100vh-64px)] items-center justify-center p-8 bg-zinc-50">
                <div className="text-gray-500 font-medium text-lg">Por favor inicia sesión.</div>
            </div>
        )
    }

    // 1. Obtener compras pagadas del alumno
    const { data: compras } = await supabase
        .from('ie_compras')
        .select('*')
        .eq('user_id', user.id)
        .eq('pagado', true)

    if (!compras || compras.length === 0) {
        return <EmptyState />
    }

    const comprasIds = compras.map(c => c.curso_id)

    // 2. Obtener los detalles de los cursos comprados
    const { data: cursos } = await supabase
        .from('ie_cursos')
        .select('id, titulo, descripcion, duracion, requiere_pago_completo, requiere_examen, creado_por, mostrar_constancia')
        .in('id', comprasIds)

    if (!cursos || cursos.length === 0) {
        return <EmptyState />
    }

    // 3. Obtener los perfiles de los creadores de los cursos para validar el rol (instructor vs capacitador)
    const creadorIds = Array.from(new Set(cursos.map(c => c.creado_por).filter(Boolean)))
    const { data: creadores } = await supabase
        .from('ie_profiles')
        .select('id, rol')
        .in('id', creadorIds)
    // 4. Obtener exámenes de los cursos comprados
    const { data: examenes } = await supabase
        .from('ie_examenes')
        .select('id, curso_id')
        .in('curso_id', comprasIds)

    const examenIds = examenes?.map(e => e.id) || []

    // 5. Obtener resultados aprobados de exámenes para el usuario
    const { data: resultadosExamenes } = examenIds.length > 0
        ? await supabase
            .from('ie_resultados_examenes')
            .select('id, examen_id, aprobado, created_at, calificacion')
            .eq('user_id', user.id)
            .eq('aprobado', true)
            .in('examen_id', examenIds)
        : { data: [] }

    // 6. Obtener constancias generales (para cursos sin examen)
    const { data: examenesAprobados } = await supabase
        .from('ie_examenes_usuario')
        .select('*')
        .eq('user_id', user.id)
        .eq('aprobado', true)

    // 7. Filtrar y construir la lista de expediente (cursos con constancia desbloqueada)
    const cursosCertificados = cursos.map(curso => {
        // Si el curso tiene explícitamente mostrar_constancia === false, no ofrece constancia
        if (curso.mostrar_constancia === false) return null

        const compra = compras.find(c => c.curso_id === curso.id)
        if (!compra) return null

        // Validar si requiere pago completo (rol creador es instructor, o requiere_pago_completo del curso es true)
        const creador = creadores?.find(p => p.id === curso.creado_por)
        const esCreadoPorInstructor = creador?.rol === 'instructor'
        const cursoPagoRequerido = (curso.requiere_pago_completo || false) || esCreadoPorInstructor
        const pagoCompleto = cursoPagoRequerido ? (compra.pago_completo || false) : true

        if (!pagoCompleto) return null

        let fechaAcreditacion = ''
        let ordenFecha = 0

        // Validar examen si aplica
        if (curso.requiere_examen) {
            const examenCurso = examenes?.find(e => e.curso_id === curso.id)
            const resultado = examenCurso ? resultadosExamenes?.find(r => r.examen_id === examenCurso.id && r.aprobado === true) : null
            const examenUsuario = examenesAprobados?.find(ex => ex.curso_id === curso.id && ex.aprobado === true)

            if (!resultado && !examenUsuario) return null // No ha aprobado el examen

            const examen = resultado || examenUsuario
            const rawDate = (examen as any).created_at || (examen as any).fecha
            if (rawDate) {
                const dateStr = rawDate.split('T')[0]
                const [y, m, d] = dateStr.split('-').map(Number)
                const localDate = new Date(y, m - 1, d)
                fechaAcreditacion = localDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                ordenFecha = localDate.getTime()
            }
        } else {
            // Si no requiere examen, se acredita al comprarlo (con control de desfase)
            const examenUsuario = examenesAprobados?.find(ex => ex.curso_id === curso.id && ex.aprobado === true)
            const rawDate = examenUsuario?.fecha || compra.fecha_compra
            if (rawDate) {
                const dateStr = rawDate.split('T')[0]
                const [y, m, d] = dateStr.split('-').map(Number)
                const localDate = new Date(y, m - 1, d)
                fechaAcreditacion = localDate.toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                ordenFecha = localDate.getTime()
            }
        }

        return {
            id: curso.id,
            titulo: curso.titulo,
            descripcion: curso.descripcion,
            duracion: curso.duracion || '40 horas',
            fechaAcreditacion,
            ordenFecha
        }
    }).filter(Boolean).sort((a: any, b: any) => b.ordenFecha - a.ordenFecha)

    if (cursosCertificados.length === 0) {
        return <EmptyState />
    }

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans py-12">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-10 gap-4 border-b border-zinc-200 pb-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 p-3 rounded-2xl shadow-md text-white">
                            <FolderHeart className="h-7 w-7" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Mi Expediente Académico</h1>
                            <p className="text-gray-500 text-sm mt-1 font-medium">Aquí encontrarás las constancias y microcredenciales oficiales de tus cursos aprobados.</p>
                        </div>
                    </div>
                </div>

                {/* Grid List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {cursosCertificados.map((curso: any) => (
                        <div 
                            key={curso.id} 
                            className="bg-white rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group"
                        >
                            <div className="p-6 sm:p-8">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 uppercase tracking-wide">
                                        <ShieldCheck className="w-4 h-4" /> Acreditado
                                    </div>
                                    <span className="text-zinc-400 text-xs font-bold font-mono uppercase tracking-wider">{curso.duracion}</span>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors">
                                    {curso.titulo}
                                </h3>
                                <p className="text-zinc-500 text-sm line-clamp-2 leading-relaxed mb-4">
                                    {curso.descripcion ? `Esta capacitación está orientada a la adquisición y actualización de conocimientos relacionados con, ${curso.descripcion}` : 'Sin descripción detallada disponible.'}
                                </p>
                                {curso.fechaAcreditacion && (
                                    <div className="text-xs text-zinc-400 font-medium bg-zinc-50 py-2 px-3 rounded-xl inline-block">
                                        Fecha de acreditación: <span className="font-semibold text-zinc-600">{curso.fechaAcreditacion}</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="bg-zinc-50/80 border-t border-zinc-100 p-4 sm:px-8 flex flex-col sm:flex-row gap-3">
                                <Link 
                                    href={`/cursos/${curso.id}/certificado`}
                                    className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-full hover:bg-blue-700 transition font-bold text-sm shadow-sm"
                                >
                                    <Award className="w-4 h-4" />
                                    Descargar Expediente
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

function EmptyState() {
    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
            <div className="text-center bg-white p-12 sm:p-16 rounded-3xl border border-dashed border-gray-300 shadow-sm max-w-lg w-full">
                <div className="mx-auto h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
                    <GraduationCap className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Expediente vacío</h3>
                <p className="text-gray-500 text-base max-w-sm mx-auto mb-8">
                    Aún no cuentas con constancias o microcredenciales desbloqueadas. Completa tus cursos y aprueba las evaluaciones correspondientes para verlas aquí.
                </p>
                <Link href="/mis-cursos" className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-sm font-bold rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors cursor-pointer">
                    Ir a Mis Cursos
                </Link>
            </div>
        </div>
    )
}
