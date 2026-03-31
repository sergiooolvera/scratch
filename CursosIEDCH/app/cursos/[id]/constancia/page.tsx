'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import jsPDF from 'jspdf'
import { Download, ChevronLeft, Lock, BadgeCheck, CreditCard, Banknote, UploadCloud } from 'lucide-react'
import Link from 'next/link'
import CertificadoDocument from '@/components/CertificadoDocument'

export default function ConstanciaPage({ params }: { params: Promise<{ id: string }> }) {
    const [curso, setCurso] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [examen, setExamen] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [pagoCompleto, setPagoCompleto] = useState(false)
    const [precioCurso, setPrecioCurso] = useState<number | undefined>(undefined)
    const [cursoId, setCursoId] = useState<string>('')
    const [userId, setUserId] = useState<string>('')
    const [showPagoForm, setShowPagoForm] = useState(false)
    const [fileComprobante, setFileComprobante] = useState<File | null>(null)
    const [uploadingComp, setUploadingComp] = useState(false)
    const [mensajePago, setMensajePago] = useState('')
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

            // Solo bloquear si el CURSO requiere pago completo Y el alumno no lo pagó completo
            const cursoPagoRequerido = cur?.requiere_pago_completo || false
            const alumnoPageCompleto = compra.pago_completo || false
            setPagoCompleto(!cursoPagoRequerido || alumnoPageCompleto) // true = puede ver constancia
            setPrecioCurso(cur?.precio)
            setCursoId(id)
            setUserId(user.id)

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
            const htmlToImage = await import('html-to-image');
            const dataUrl = await htmlToImage.toPng(constanciaRef.current, { 
                quality: 1.0, 
                pixelRatio: 2,
                width: 1056,
                height: 816,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [constanciaRef.current.offsetWidth, constanciaRef.current.offsetHeight]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, constanciaRef.current.offsetWidth, constanciaRef.current.offsetHeight);
            pdf.save(`Constancia_${curso?.titulo.replace(/\s+/g, '_')}.pdf`);
        } catch (error: any) {
            console.error('Error generando PDF', error)
            alert('Hubo un error al generar el PDF: ' + (error?.message || String(error)))
        }
    }

    const handleComprarStrípe = async () => {
        setUploadingComp(true)
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cursoId: cursoId, userId: userId })
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else if (data.success) {
                router.refresh()
            } else {
                throw new Error(data.error || 'No se recibió URL de Stripe')
            }
        } catch (error: any) {
            console.error(error)
            alert(`Error al iniciar el pago: ${error.message}`)
            setUploadingComp(false)
        }
    }

    const handleSubirComprobanteConstancia = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!fileComprobante) {
            setMensajePago('Por favor, selecciona la imagen o PDF del comprobante.')
            return
        }
        setUploadingComp(true)
        setMensajePago('')
        try {
            const fileExt = fileComprobante.name.split('.').pop()
            const fileName = `constancia-${cursoId}-${Math.random()}.${fileExt}`
            const filePath = `${userId}/${fileName}`
            const { error: uploadError } = await supabase.storage.from('comprobantes').upload(filePath, fileComprobante)
            if (uploadError) throw uploadError
            const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath)
            const { error: dbError } = await supabase.from('ie_pagos_manuales').insert({
                user_id: userId,
                curso_id: cursoId,
                comprobante_url: data.publicUrl,
                estado: 'pendiente',
                notas: 'Pago complementario para constancia (alumno usó cupón de descuento)'
            })
            if (dbError) throw dbError
            setMensajePago('¡Comprobante enviado! El administrador lo revisará y habilitará tu constancia pronto.')
            setFileComprobante(null)
        } catch (error: any) {
            console.error(error)
            setMensajePago('Hubo un error al subir el comprobante. Inténtalo de nuevo.')
        } finally {
            setUploadingComp(false)
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

    // Si el examen está aprobado pero el pago NO es completo, mostrar pantalla de pago
    if (!pagoCompleto) return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-3xl shadow-sm max-w-lg w-full border border-amber-200">
                <div className="mx-auto h-20 w-20 bg-amber-50 rounded-full flex items-center justify-center mb-5">
                    <Lock className="h-10 w-10 text-amber-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 text-center">Constancia pendiente de pago</h2>
                <p className="text-gray-600 mb-2 leading-relaxed text-center text-sm">
                    Utilizaste un cupón de descuento para acceder al curso <span className="font-semibold text-gray-800">{curso?.titulo}</span>.
                    Para recibir tu constancia deberás cubrir el valor total del curso
                    {precioCurso ? <strong> (${precioCurso} MXN)</strong> : ''}.
                </p>
                <p className="text-xs text-gray-500 text-center mb-6 italic">
                    “Si pagas tu curso al 100% completo, la constancia está incluida. Si utilizas un cupón de descuento, el beneficio es solo para el curso; para recibir la constancia deberás cubrir el valor total de la misma al finalizar.”
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    <button onClick={handleComprarStrípe} disabled={uploadingComp} className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pagar con Tarjeta
                    </button>
                    <button
                        onClick={() => setShowPagoForm(!showPagoForm)}
                        className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition shadow-sm"
                    >
                        <Banknote className="w-4 h-4 mr-2" />
                        Pagar Transferencia
                    </button>
                </div>

                {showPagoForm && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                        <p className="font-bold text-sm text-gray-800 mb-2">Datos para Transferencia:</p>
                        <ul className="list-none space-y-1 font-mono bg-white p-3 rounded border border-gray-200 text-sm mb-3">
                            <li><strong>Banco:</strong> BBVA Bancomer</li>
                            <li><strong>Cuenta:</strong> 0123456789</li>
                            <li><strong>CLABE:</strong> 012345678901234567</li>
                            <li><strong>Titular:</strong> Instituto Educativo S.C.</li>
                            {precioCurso && <li className="font-bold text-blue-700 mt-1"><strong>Monto:</strong> ${precioCurso} MXN</li>}
                        </ul>
                        <form onSubmit={handleSubirComprobanteConstancia} className="flex flex-col gap-3">
                            <div
                                className="border-2 border-dashed border-amber-300 rounded-lg p-4 flex flex-col items-center bg-white cursor-pointer hover:bg-amber-50 transition"
                                onClick={() => document.getElementById('comp-constancia')?.click()}
                            >
                                <UploadCloud className="w-8 h-8 text-amber-400 mb-1" />
                                <span className="text-sm text-amber-700">{fileComprobante ? fileComprobante.name : 'Subir comprobante de pago'}</span>
                                <input id="comp-constancia" type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => setFileComprobante(e.target.files?.[0] || null)} />
                            </div>
                            <button type="submit" disabled={uploadingComp || !fileComprobante} className="w-full bg-amber-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-amber-700 disabled:opacity-50 transition">
                                {uploadingComp ? 'Enviando...' : 'Enviar Comprobante'}
                            </button>
                            {mensajePago && <p className={`text-sm text-center font-medium ${mensajePago.includes('error') ? 'text-red-600' : 'text-green-700'}`}>{mensajePago}</p>}
                        </form>
                    </div>
                )}

                <Link href={`/cursos/${cursoId}`} className="mt-6 flex justify-center text-sm text-blue-600 hover:text-blue-800 font-medium">
                    ← Volver al Curso
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
