'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Download, ChevronLeft, Lock, BadgeCheck } from 'lucide-react'
import Link from 'next/link'
import CertificadoDocument from '@/components/CertificadoDocument'

export default function ConstanciaPage({ params }: { params: Promise<{ id: string }> }) {
    const [curso, setCurso] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [examen, setExamen] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const constanciaRef = useRef<HTMLDivElement>(null)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadData() {
            const { id } = await params
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            const { data: prof } = await supabase.from('ie_profiles').select('*').eq('id', user.id).single()
            const { data: cur } = await supabase.from('ie_cursos').select('*').eq('id', id).single()

            const { data: compra } = await supabase
                .from('ie_compras')
                .select('*')
                .eq('curso_id', id)
                .eq('user_id', user.id)
                .eq('pagado', true)
                .single()

            if (!compra) {
                router.push(`/cursos/${id}`)
                return
            }

            // Tomar el último examen en caso de que haya múltiples intentos guardados por falta de restricción única
            const { data: exList } = await supabase
                .from('ie_examenes_usuario')
                .select('*')
                .eq('user_id', user.id)
                .eq('curso_id', id)
                .eq('aprobado', true)
                .order('fecha', { ascending: false })
                .limit(1)

            const ex = exList?.[0]

            if (!ex?.aprobado) {
                if (cur.requiere_examen === false) {
                    const { data: newEx } = await supabase
                        .from('ie_examenes_usuario')
                        .insert({
                            user_id: user.id,
                            curso_id: id,
                            calificacion: 100,
                            aprobado: true
                        })
                        .select()
                        .single()
                        
                    setProfile(prof)
                    setCurso(cur)
                    setExamen(newEx)
                    setLoading(false)
                    return
                }

                setCurso(cur)
                setLoading(false)
                return
            }

            setProfile(prof)
            setCurso(cur)
            setExamen(ex)
            setLoading(false)
        }
        loadData()
    }, [params, router, supabase])

    const handleDownloadPDF = async () => {
        if (!constanciaRef.current) return
        try {
            const canvas = await html2canvas(constanciaRef.current, {
                scale: 2,
                useCORS: true,
                logging: true,
                backgroundColor: '#fdfbf7', // Color papel viejo ligero
                windowWidth: 1056,
                width: 1056,
                height: 816
            })
            const imgData = canvas.toDataURL('image/png')
            const pdf = new jsPDF('landscape', 'mm', 'a4')
            const pdfWidth = pdf.internal.pageSize.getWidth()
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width
            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
            pdf.save(`Constancia_${curso?.titulo.replace(/\s+/g, '_')}.pdf`)
        } catch (error: any) {
            console.error('Error generando PDF', error)
            alert('Hubo un error al generar el PDF: ' + (error?.message || String(error)))
        }
    }

    if (loading) return (
        <div className="flex min-h-screen items-center justify-center p-8">
            <div className="text-gray-500 animate-pulse text-lg">Cargando certificado...</div>
        </div>
    )

    if (!examen?.aprobado) return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 flex items-center justify-center p-4">
            <div className="bg-white p-12 rounded-3xl shadow-sm text-center max-w-lg border border-gray-200">
                <div className="mx-auto h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <Lock className="h-10 w-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Aún no puedes obtener tu constancia</h2>
                <p className="text-gray-500 mb-8 leading-relaxed">Debes completar y acreditar el examen del curso <span className="font-semibold text-gray-700">{curso?.titulo}</span> con al menos 80% de aciertos para desbloquear tu constancia curricular.</p>
                <Link href={`/cursos/${curso?.id}`} className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 transition font-medium inline-block shadow-sm">
                    Volver al Curso
                </Link>
            </div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans py-8">
            <div className="max-w-[1100px] mx-auto px-4">

                <Link href={`/cursos/${curso?.id}`} className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-6 font-medium">
                    <ChevronLeft className="h-4 w-4 mr-1" /> Volver al Curso
                </Link>

                <div className="mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                        <div className="bg-yellow-100 p-3 rounded-full text-yellow-700">
                            <BadgeCheck className="h-8 w-8" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Tu Constancia Digital</h1>
                            <p className="text-gray-500 text-sm mt-1">Lista para imprimir o descargar en formato PDF de alta resolución.</p>
                        </div>
                    </div>
                    <button
                        onClick={handleDownloadPDF}
                        className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-full hover:bg-blue-700 transition shadow-md font-medium"
                    >
                        <Download className="h-4 w-4" />
                        <span>Descargar PDF</span>
                    </button>
                </div>

                {/* CONTENEDOR DE LA CONSTANCIA */}
                <div className="overflow-x-auto p-4 flex justify-center bg-gray-300 rounded-xl shadow-inner border border-gray-400">
                    {(() => {
                        const fechaEmision = new Date(examen?.fecha || new Date())
                        const vigAnos = curso?.vigencia_anos || 3
                        const fechaVig = new Date(fechaEmision)
                        fechaVig.setFullYear(fechaVig.getFullYear() + vigAnos)
                        const vigStr = fechaVig.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                        const fechaAp = fechaEmision.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                        const qrValue = `https://cursos-iedch.vercel.app/validar?folio=${examen?.id}`
                        
                        return (
                            <CertificadoDocument
                                alumnoNombre={profile ? `${profile.nombre || ''} ${profile.apellido_paterno || ''} ${profile.apellido_materno || ''}`.replace(/\s+/g, ' ').trim() || profile.email : 'Estudiante'}
                                cursoTitulo={curso?.titulo || 'Nombre del Curso'}
                                cursoDuracion={curso?.duracion}
                                fechaAprobacion={fechaAp}
                                folio={String(examen?.id).toUpperCase() || '112233445'}
                                vigenciaStr={`${vigStr} (${vigAnos} ${vigAnos === 1 ? 'año' : 'años'})`}
                                qrUrl={qrValue}
                                documentRef={constanciaRef as any}
                            />
                        )
                    })()}
                </div>
            </div>
        </div>
    )
}
