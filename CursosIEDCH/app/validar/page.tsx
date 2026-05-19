'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Search, BadgeCheck, FileText, Calendar, User, ShieldCheck, AlertCircle, Clock } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

function ValidacionContent() {
    const supabase = createClient()
    const searchParams = useSearchParams()
    const urlFolio = searchParams.get('folio') || ''

    const [folio, setFolio] = useState(urlFolio)
    const [loading, setLoading] = useState(false)
    const [resultado, setResultado] = useState<any>(null)
    const [error, setError] = useState('')
    const [searched, setSearched] = useState(false)

    useEffect(() => {
        if (urlFolio) {
            buscarFolio(urlFolio)
        }
    }, [urlFolio])

    const buscarFolio = async (folioABuscar: string) => {
        if (!folioABuscar.trim()) return

        setLoading(true)
        setError('')
        setResultado(null)
        setSearched(true)

        try {
            // Buscamos primero en ie_resultados_examenes (Certificados)
            let matchData = null;
            let cursoInfoData = null;
            let userData = null;

            const { data: examenData, error: examenError } = await supabase
                .from('ie_resultados_examenes')
                .select('id, created_at, calificacion, examen_id, user_id')
                .eq('id', folioABuscar.trim())
                .eq('aprobado', true)
                .single()

            if (!examenError && examenData) {
                // Es un folio de Certificado
                matchData = { ...examenData, tipo: 'curso' };

                const { data: cursoExamenData, error: ceError } = await supabase
                    .from('ie_examenes')
                    .select('curso_id')
                    .eq('id', examenData.examen_id)
                    .single()

                if (ceError) {
                    cursoInfoData = { titulo: `Error Examen: ${ceError.message}`, vigencia_anos: 3 }
                } else if (cursoExamenData?.curso_id) {
                    const { data: cursoData, error: cError } = await supabase.from('ie_cursos').select('titulo, vigencia_anos, duracion').eq('id', cursoExamenData.curso_id).single()
                    if (cError) {
                        cursoInfoData = { titulo: `Error Curso: ${cError.message}`, vigencia_anos: 3 }
                    } else {
                        cursoInfoData = cursoData
                    }
                }

                const { data: uData } = await supabase.from('ie_profiles').select('nombre').eq('id', examenData.user_id).single()
                userData = uData
            } else {
                // Si no se encuentra, buscamos en ie_examenes_usuario (Constancias)
                const { data: constanciaData, error: constError } = await supabase
                    .from('ie_examenes_usuario')
                    .select('id, fecha, calificacion, curso_id, user_id')
                    .eq('id', folioABuscar.trim())
                    .eq('aprobado', true)
                    .single()

                if (!constError && constanciaData) {
                    matchData = {
                        id: constanciaData.id,
                        created_at: constanciaData.fecha,
                        calificacion: constanciaData.calificacion,
                        tipo: 'curso'
                    }
                    const { data: cursoData } = await supabase.from('ie_cursos').select('titulo, vigencia_anos, duracion').eq('id', constanciaData.curso_id).single()
                    cursoInfoData = cursoData

                    const { data: uData } = await supabase.from('ie_profiles').select('nombre').eq('id', constanciaData.user_id).single()
                    userData = uData
                }
            }

            if (!matchData) {
                // Si no se encuentra, buscamos en ie_actividad_alumnos (Constancias Institucionales)
                const { data: actAlumnoData, error: actError } = await supabase
                    .from('ie_actividad_alumnos')
                    .select(`
                        id, created_at, folio_constancia, nombre_alumno,
                        actividad:ie_actividad_institucion(nombre_actividad, tipo_actividad, duracion, fecha_ejecucion, institucion_acredita)
                    `)
                    .eq('folio_constancia', folioABuscar.trim())
                    .single()

                if (!actError && actAlumnoData) {
                    const actividad = actAlumnoData.actividad as any
                    matchData = {
                        id: actAlumnoData.folio_constancia,
                        created_at: actividad?.fecha_ejecucion || actAlumnoData.created_at,
                        calificacion: 'Acreditado',
                        tipo: 'actividad_alumno',
                        institucion: actividad?.institucion_acredita
                    }
                    cursoInfoData = {
                        titulo: `${actividad?.tipo_actividad}: ${actividad?.nombre_actividad}`,
                        duracion: actividad?.duracion,
                        vigencia_anos: 3
                    }
                    userData = { nombre: actAlumnoData.nombre_alumno }
                }
            }

            if (!matchData) {
                // Buscamos en ie_compras (Inscripciones de cursos pagados)
                const { data: compraData, error: compraError } = await supabase
                    .from('ie_compras')
                    .select('id, user_id, curso_id, fecha_compra, pagado')
                    .eq('id', folioABuscar.trim())
                    .eq('pagado', true)
                    .single()

                if (!compraError && compraData) {
                    matchData = {
                        id: compraData.id,
                        created_at: compraData.fecha_compra,
                        calificacion: 'Acreditado / Inscrito',
                        tipo: 'curso'
                    }
                    const { data: cursoData } = await supabase.from('ie_cursos').select('titulo, vigencia_anos, duracion').eq('id', compraData.curso_id).single()
                    cursoInfoData = cursoData

                    const { data: uData } = await supabase.from('ie_profiles').select('nombre').eq('id', compraData.user_id).single()
                    userData = uData
                }
            }

            if (!matchData && folioABuscar.trim().toUpperCase().startsWith('IEECDH-')) {
                // Buscamos Constancia de Registro de Actividad Institucional
                const idPart = folioABuscar.trim().toUpperCase().replace('IEECDH-', '').toLowerCase()
                
                const { data: actData, error: actError } = await supabase
                    .from('ie_actividad_institucion')
                    .select('*, ie_profiles:user_id(nombre)')
                    .gte('id', `${idPart}-0000-0000-0000-000000000000`)
                    .lte('id', `${idPart}-ffff-ffff-ffff-ffffffffffff`)
                    .limit(1)
                    .single()

                if (!actError && actData) {
                    matchData = {
                        id: `IEECDH-${idPart.toUpperCase()}`,
                        created_at: actData.fecha_ejecucion,
                        calificacion: 'Acreditado Institucionalmente',
                        tipo: 'registro_actividad',
                        institucion: actData.institucion_acredita
                    }
                    cursoInfoData = {
                        titulo: `Registro de ${actData.tipo_actividad}: ${actData.nombre_actividad}`,
                        duracion: actData.duracion,
                        vigencia_anos: 5
                    }
                    userData = { nombre: actData.ie_profiles?.nombre || actData.institucion_acredita || 'Institución' }
                }
            }

            if (!matchData) {
                setError('No se encontró constancia con este número de folio, o fue ingresado incorrectamente.')
                setLoading(false)
                return
            }

            setResultado({
                folio: matchData.id,
                fecha: matchData.created_at,
                calificacion: matchData.calificacion,
                alumno: userData?.nombre || 'Alumno IEDCH',
                curso: cursoInfoData?.titulo || 'Curso no encontrado',
                vigencia_anos: cursoInfoData?.vigencia_anos || 3,
                duracion: cursoInfoData?.duracion || '40 horas',
                tipo: (matchData as any).tipo || 'curso',
                institucion: (matchData as any).institucion || null
            })

        } catch (err: any) {
            setError(err.message || 'Error al buscar el folio')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        buscarFolio(folio)
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col pt-12">
            <div className="max-w-3xl w-full mx-auto px-4 sm:px-6">

                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center bg-blue-100 p-4 rounded-full mb-4">
                        <ShieldCheck className="w-10 h-10 text-blue-700" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">Validación de Constancias</h1>
                    <p className="text-gray-600 max-w-xl mx-auto">
                        Verifica la autenticidad de una constancia o certificado emitido por el SECNA ingresando el número de Folio oficial.
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
                    <div className="p-6 sm:p-8">
                        <form onSubmit={handleSearch} className="flex max-w-xl mx-auto relative">
                            <div className="relative flex-grow">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Search className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={folio}
                                    onChange={(e) => setFolio(e.target.value)}
                                    placeholder="Ingresa el Folio (ej. xxxxxxxx-xxxx-...)"
                                    className="block w-full pl-11 pr-4 py-4 sm:text-lg border-2 border-gray-200 rounded-l-xl focus:ring-0 focus:border-blue-500 bg-gray-50 transition-colors"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 sm:px-8 rounded-r-xl transition-colors disabled:opacity-70 flex items-center"
                            >
                                {loading ? 'Buscando...' : 'Validar'}
                            </button>
                        </form>

                        {searched && error && (
                            <div className="mt-8 bg-red-50 border border-red-100 rounded-xl p-5 flex items-start mx-auto max-w-xl">
                                <AlertCircle className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="text-red-800 font-medium">Constancia no válida</h3>
                                    <p className="text-red-600 text-sm mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        {searched && resultado && (
                            <div className="mt-10 mx-auto max-w-2xl bg-white border-2 border-green-100 rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                                <div className="bg-green-50 px-6 py-4 border-b border-green-100 flex items-center">
                                    <div className="bg-green-100 p-2 rounded-full mr-3">
                                        <BadgeCheck className="w-6 h-6 text-green-600" />
                                    </div>
                                    <h3 className="text-green-800 font-bold text-lg">Constancia Válida y Oficial</h3>
                                </div>

                                <div className="p-6">
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <User className="w-4 h-4 mr-1.5" /> 
                                                {resultado.tipo === 'registro_actividad' ? 'Institución / Organizador' : 'Alumno Acreditado'}
                                            </dt>
                                            <dd className="text-xl font-bold text-gray-900 border-b pb-4">
                                                {resultado.alumno}
                                            </dd>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <FileText className="w-4 h-4 mr-1.5" /> 
                                                {resultado.tipo === 'curso' ? 'Nombre del Curso' : 'Nombre de la Actividad'}
                                            </dt>
                                            <dd className="text-lg font-medium text-gray-800 border-b pb-4">
                                                {resultado.curso}
                                            </dd>
                                        </div>

                                        {resultado.institucion && (
                                            <div className="sm:col-span-2">
                                                <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                    <ShieldCheck className="w-4 h-4 mr-1.5" /> 
                                                    Institución
                                                </dt>
                                                <dd className="text-lg font-medium text-gray-800 border-b pb-4">
                                                    {resultado.institucion}
                                                </dd>
                                            </div>
                                        )}

                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <Calendar className="w-4 h-4 mr-1.5" /> Fecha de Emisión
                                            </dt>
                                            <dd className="text-base text-gray-900 font-medium">
                                                {new Date(resultado.fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                            </dd>
                                        </div>

                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <Clock className="w-4 h-4 mr-1.5" /> Valor Curricular
                                            </dt>
                                            <dd className="text-base text-gray-900 font-medium border-b pb-4 sm:border-b-0 sm:pb-0">
                                                {resultado.duracion}
                                            </dd>
                                        </div>

                                        <div className="sm:col-span-1">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <ShieldCheck className="w-4 h-4 mr-1.5" /> Número de Folio
                                            </dt>
                                            <dd className="text-xs font-mono text-gray-600 font-medium bg-gray-50 p-1.5 rounded inline-block">
                                                {resultado.folio}
                                            </dd>
                                        </div>

                                        <div className="sm:col-span-2">
                                            <dt className="text-sm font-medium text-gray-500 flex items-center mb-1">
                                                <Calendar className="w-4 h-4 mr-1.5" /> Vigente Hasta
                                            </dt>
                                            <dd className="text-base font-semibold text-green-700">
                                                {(() => {
                                                    const d = new Date(resultado.fecha)
                                                    d.setFullYear(d.getFullYear() + (resultado.vigencia_anos || 3))
                                                    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                                                })()}
                                                <span className="ml-2 text-xs text-gray-400 font-normal">({resultado.vigencia_anos || 3} {resultado.vigencia_anos === 1 ? 'año' : 'años'} de vigencia)</span>
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <p className="text-center text-gray-500 text-sm mb-12">
                    El Servicio Nacional de Evaluación y Registro Laboral avala la autenticidad de los datos mostrados en esta plataforma oficial.
                </p>
            </div>
        </div>
    )
}

export default function ValidacionPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-gray-50 flex items-center justify-center p-8"><p className="text-gray-500">Cargando validador...</p></div>}>
            <ValidacionContent />
        </Suspense>
    )
}
