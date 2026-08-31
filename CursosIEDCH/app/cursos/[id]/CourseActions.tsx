'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    X,
    UploadCloud,
    Ticket,
    CreditCard,
    ArrowLeftRight,
    Store,
    ShieldCheck,
    Award,
    Headphones,
    MessageCircle,
    Lock,
    PlayCircle,
    FileCheck,
    AlertCircle,
    Tag,
    ArrowRight
} from 'lucide-react'

export default function CourseActions({
    cursoId,
    isPagado,
    pagoCompleto,
    constanciaRequierePago,
    isAprobado,
    requiereExamen,
    userId,
    precioCurso,
    montoPagado,
    esCreadoPorInstructor = false,
    mostrarExamenFinal = true,
    mostrarConstancia = true
}: {
    cursoId: string
    isPagado: boolean
    pagoCompleto: boolean
    constanciaRequierePago: boolean
    isAprobado: boolean
    requiresExamen?: boolean
    requiereExamen: boolean
    userId: string
    precioCurso?: number
    montoPagado?: number
    esCreadoPorInstructor?: boolean
    mostrarExamenFinal?: boolean
    mostrarConstancia?: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [showCupon, setShowCupon] = useState(false)
    const [showEfectivo, setShowEfectivo] = useState(false)
    const [showOxxo, setShowOxxo] = useState(false)
    const [showFaqModal, setShowFaqModal] = useState(false)

    // Constancia State
    const [showPagoConstancia, setShowPagoConstancia] = useState(false)
    const [showTransferFormForConstancia, setShowTransferFormForConstancia] = useState(false)
    const [showOxxoForConstancia, setShowOxxoForConstancia] = useState(false)
    const [showCuponForConstancia, setShowCuponForConstancia] = useState(false)

    // Cupón State
    const [cuponCodigo, setCuponCodigo] = useState('')
    const [cuponError, setCuponError] = useState('')
    const [cuponSuccess, setCuponSuccess] = useState('')

    // Referido State
    const [referralCode, setReferralCode] = useState('')
    const [referralValid, setReferralValid] = useState<boolean | null>(null)
    const [referralId, setReferralId] = useState<string | null>(null)
    const [referralNombre, setReferralNombre] = useState('')
    const [referralError, setReferralError] = useState('')
    const [checkingReferral, setCheckingReferral] = useState(false)

    // Efectivo State
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [pagoMensaje, setPagoMensaje] = useState('')

    // Pago constancia State
    const [fileConstancia, setFileConstancia] = useState<File | null>(null)
    const [uploadingConstancia, setUploadingConstancia] = useState(false)
    const [pagoConstanciaMensaje, setPagoConstanciaMensaje] = useState('')

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search)
            if (params.get('payConstancia') === 'true') {
                setShowPagoConstancia(true)
                setTimeout(() => {
                    const el = document.getElementById('pago-constancia-seccion')
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth' })
                    }
                }, 150)
            }
        }
    }, [])

    const handleComprarStrípe = async (cuponCode?: string, esConstancia: boolean = false) => {
        if (!userId) {
            router.push(`/login?next=/cursos/${cursoId}`)
            return
        }
        setLoading(true)
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cursoId,
                    userId,
                    cuponCodigo: cuponCode,
                    esConstancia,
                    referralCode: referralValid ? referralCode.trim().toUpperCase() : undefined
                })
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else if (data.success) {
                if (esConstancia) {
                    router.push(`/cursos/${cursoId}/certificado`)
                } else {
                    router.refresh()
                }
                setLoading(false)
            } else {
                throw new Error(data.error || 'No se recibió URL de pago')
            }
        } catch (error: any) {
            console.error(error)
            alert(`Error al iniciar el pago: ${error.message}`)
            setLoading(false)
        }
    }

    const handleVerificarReferral = async () => {
        if (!referralCode.trim()) return
        setCheckingReferral(true)
        setReferralValid(null)
        setReferralNombre('')
        setReferralError('')
        try {
            const res = await fetch(`/api/validate-referral?code=${encodeURIComponent(referralCode.trim().toUpperCase())}`)
            const data = await res.json()
            if (data.valid) {
                setReferralValid(true)
                setReferralId(data.id)
                setReferralNombre(data.nombre)
            } else {
                setReferralValid(false)
                setReferralError(data.error || 'Código inválido')
            }
        } catch {
            setReferralValid(false)
            setReferralError('Error al verificar el código')
        } finally {
            setCheckingReferral(false)
        }
    }

    const handleCanjearCupon = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!cuponCodigo.trim()) return

        setLoading(true)
        setCuponError('')
        setCuponSuccess('')

        try {
            const { data: cupon, error } = await supabase
                .from('ie_cupones')
                .select('*')
                .eq('codigo', cuponCodigo.trim().toUpperCase())
                .eq('activo', true)
                .single()

            if (error || !cupon) {
                setCuponError('Cupón inválido o expirado.')
                setLoading(false)
                return
            }

            if (cupon.curso_id && cupon.curso_id !== cursoId) {
                setCuponError('Este cupón no es válido para este curso.')
                setLoading(false)
                return
            }

            if (cupon.descuento_porcentaje === 100) {
                await handleComprarStrípe(cupon.codigo, showCuponForConstancia)
            } else {
                setCuponSuccess(`¡Cupón de ${cupon.descuento_porcentaje}% aplicado!`)
                await handleComprarStrípe(cupon.codigo, showCuponForConstancia)
            }
        } catch (error: any) {
            console.error(error)
            setCuponError('Error al validar el cupón.')
            setLoading(false)
        }
    }

    const handleSubirPago = async (e: React.FormEvent, metodo: string = 'transferencia') => {
        e.preventDefault()
        if (!file) {
            setPagoMensaje('Por favor, selecciona la imagen o PDF del comprobante.')
            return
        }

        setUploading(true)
        setPagoMensaje('')

        try {
            const fileExt = file.name.split('.').pop()
            const fileName = `${cursoId}-${Math.random()}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('comprobantes')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath)
            const publicURL = data.publicUrl

            const res = await fetch('/api/report-payment-auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cursoId,
                    userId,
                    publicURL,
                    filePath,
                    metodo,
                    notas: metodo === 'oxxo' ? 'Pago reportado por OXXO' : '',
                    esConstancia: false,
                    referredBy: referralValid ? referralId : null
                })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ error: 'Error al procesar el comprobante' }))
                throw new Error(errData.error || errData.details || 'Error al procesar el comprobante')
            }

            setPagoMensaje('¡Comprobante enviado con éxito y curso habilitado!')
            setFile(null)
            router.refresh()

            setTimeout(() => {
                setShowEfectivo(false)
                setShowOxxo(false)
                setPagoMensaje('')
            }, 2500)
        } catch (error: any) {
            console.error(error)
            setPagoMensaje('Hubo un error al subir el comprobante. Inténtalo de nuevo.')
        } finally {
            setUploading(false)
        }
    }

    const handleSubirPagoConstancia = async (e: React.FormEvent, metodo: string = 'transferencia') => {
        e.preventDefault()
        if (!fileConstancia) {
            setPagoConstanciaMensaje('Por favor, selecciona el archivo del comprobante.')
            return
        }

        setUploadingConstancia(true)
        setPagoConstanciaMensaje('')

        try {
            const fileExt = fileConstancia.name.split('.').pop()
            const fileName = `constancia-${cursoId}-${Math.random()}.${fileExt}`
            const filePath = `${userId}/${fileName}`

            const { error: uploadError } = await supabase.storage
                .from('comprobantes')
                .upload(filePath, fileConstancia)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath)
            const publicURL = data.publicUrl

            const res = await fetch('/api/report-payment-auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cursoId,
                    userId,
                    publicURL,
                    filePath,
                    metodo,
                    notas: `Pago complementario para constancia - ${metodo}`,
                    esConstancia: true
                })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ details: 'Error desconocido' }))
                throw new Error(errData.details || 'Error al procesar la constancia')
            }

            setPagoConstanciaMensaje('¡Comprobante enviado y constancia habilitada!')
            setFileConstancia(null)
            router.refresh()
        } catch (error: any) {
            console.error(error)
            setPagoConstanciaMensaje(error.message || 'Hubo un error al subir el comprobante.')
        } finally {
            setUploadingConstancia(false)
        }
    }

    const valorPrecio = precioCurso !== undefined && Number(precioCurso) > 0 ? Number(precioCurso) : 399
    const puedeVerConstancia = !constanciaRequierePago

    return (
        <div className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] sticky top-6 space-y-6">
            {/* Si NO está pagado: Checkout Card */}
            {!isPagado ? (
                <>
                    {/* Encabezado y Precio */}
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700">
                            Acceso al programa completo
                        </p>
                        <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl sm:text-4xl font-black text-[#1e1b4b] tracking-tight">
                                ${valorPrecio.toLocaleString('es-MX')}
                            </span>
                            <span className="text-sm font-bold text-slate-500">
                                MXN
                            </span>
                        </div>
                    </div>

                    {/* Referido si está disponible */}
                    <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2.5 text-xs">
                        <label className="flex items-center gap-1 font-bold text-slate-700 mb-1">
                            <Tag className="w-3 h-3 text-indigo-700" />
                            ¿Código de referido? <span className="text-slate-400 font-normal">(opcional)</span>
                        </label>
                        <div className="flex gap-1.5">
                            <input
                                type="text"
                                placeholder="Ej: CARLOS247"
                                value={referralCode}
                                onChange={(e) => {
                                    setReferralCode(e.target.value.toUpperCase())
                                    setReferralValid(null)
                                    setReferralNombre('')
                                    setReferralError('')
                                }}
                                className="flex-1 rounded-md text-xs px-2.5 py-1 border uppercase bg-white focus:outline-none focus:border-indigo-500"
                                maxLength={15}
                            />
                            {referralCode.trim() && referralValid === null && (
                                <button
                                    type="button"
                                    onClick={handleVerificarReferral}
                                    disabled={checkingReferral}
                                    className="px-2.5 py-1 bg-indigo-700 text-white text-[10px] font-bold rounded-md hover:bg-indigo-800 disabled:opacity-60 transition"
                                >
                                    {checkingReferral ? '...' : 'Validar'}
                                </button>
                            )}
                            {referralValid !== null && (
                                <button
                                    type="button"
                                    onClick={() => { setReferralCode(''); setReferralValid(null); setReferralNombre(''); setReferralError('') }}
                                    className="text-slate-400 hover:text-slate-600 px-1"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        {referralValid === true && (
                            <p className="text-[10px] text-emerald-600 mt-1 font-bold">✓ Referido por: {referralNombre}</p>
                        )}
                        {referralValid === false && (
                            <p className="text-[10px] text-rose-500 mt-1 font-medium">✕ {referralError}</p>
                        )}
                    </div>

                    {/* Botones de Métodos de Pago */}
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-slate-700">Elige tu método de pago</p>

                        {/* Botón 1: Tarjeta / OXXO Stripe */}
                        <button
                            onClick={() => {
                                if (!userId) {
                                    router.push(`/login?next=/cursos/${cursoId}`)
                                    return
                                }
                                handleComprarStrípe()
                            }}
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-[#2510a3] hover:bg-[#1e0d86] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                        >
                            <CreditCard className="w-4 h-4" />
                            <span>Pagar con Tarjeta / OXXO</span>
                        </button>

                        {/* Botón 2: Transferencia */}
                        <button
                            onClick={() => {
                                if (!userId) {
                                    router.push(`/login?next=/cursos/${cursoId}`)
                                    return
                                }
                                setShowEfectivo(!showEfectivo); setShowOxxo(false); setShowCupon(false);
                            }}
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-[#00875a] hover:bg-[#00704a] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                        >
                            <ArrowLeftRight className="w-4 h-4" />
                            <span>Pagar con Transferencia</span>
                        </button>

                        {/* Botón 3: OXXO */}
                        <button
                            onClick={() => {
                                if (!userId) {
                                    router.push(`/login?next=/cursos/${cursoId}`)
                                    return
                                }
                                setShowOxxo(!showOxxo); setShowEfectivo(false); setShowCupon(false);
                            }}
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-white bg-[#dc2626] hover:bg-[#b91c1c] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                        >
                            <Store className="w-4 h-4" />
                            <span>Reportar Pago Oxxo</span>
                        </button>

                        {/* Botón 4: Cupón */}
                        <button
                            onClick={() => {
                                if (!userId) {
                                    router.push(`/login?next=/cursos/${cursoId}`)
                                    return
                                }
                                setShowCupon(!showCupon); setShowEfectivo(false); setShowOxxo(false);
                            }}
                            disabled={loading}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-extrabold text-[#78350f] bg-[#fbbd23] hover:bg-[#f59e0b] shadow-xs flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-50"
                        >
                            <Ticket className="w-4 h-4" />
                            <span>Tengo un Cupón</span>
                        </button>
                    </div>

                    {/* Modales desplegables para pagos */}
                    {showCupon && (
                        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-amber-900">Canjear Cupón o Beca</span>
                                <button onClick={() => setShowCupon(false)} className="text-amber-700 hover:text-amber-900">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <form onSubmit={handleCanjearCupon} className="flex gap-1.5">
                                <input
                                    type="text"
                                    placeholder="Ej: BECA100"
                                    value={cuponCodigo}
                                    onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                                    className="flex-1 rounded-md border border-amber-300 px-2.5 py-1 uppercase bg-white text-xs focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={loading || !cuponCodigo.trim()}
                                    className="bg-amber-900 hover:bg-black text-white font-bold px-3 py-1 rounded-md text-xs"
                                >
                                    Aplicar
                                </button>
                            </form>
                            {cuponError && <p className="text-rose-600 font-medium text-[11px]">{cuponError}</p>}
                            {cuponSuccess && <p className="text-emerald-600 font-medium text-[11px]">{cuponSuccess}</p>}
                        </div>
                    )}

                    {showEfectivo && (
                        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900">Transferencia Bancaria</span>
                                <button onClick={() => setShowEfectivo(false)} className="text-slate-400 hover:text-slate-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="bg-white p-2.5 rounded-md border border-slate-200 space-y-0.5 font-mono text-[10px]">
                                <p><strong>Banco:</strong> Santander</p>
                                <p><strong>CLABE:</strong> 014427220010568729</p>
                                <p><strong>Titular:</strong> Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C</p>
                            </div>
                            <form onSubmit={(e) => handleSubirPago(e, 'transferencia')} className="space-y-2">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="text-xs w-full"
                                />
                                <button
                                    type="submit"
                                    disabled={uploading || !file}
                                    className="w-full bg-[#00875a] hover:bg-[#00704a] text-white font-bold py-1.5 rounded-md transition disabled:opacity-50 text-xs"
                                >
                                    {uploading ? 'Enviando...' : 'Enviar Comprobante'}
                                </button>
                            </form>
                            {pagoMensaje && (
                                <p className={`text-center font-medium text-[11px] ${pagoMensaje.includes('error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {pagoMensaje}
                                </p>
                            )}
                        </div>
                    )}

                    {showOxxo && (
                        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs space-y-2.5 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <span className="font-bold text-red-900">Depósito en OXXO</span>
                                <button onClick={() => setShowOxxo(false)} className="text-red-400 hover:text-red-600">
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <p className="text-slate-600 text-[10px]">
                                Realiza tu pago en cualquier tienda OXXO y sube tu ticket aquí.
                            </p>
                            <form onSubmit={(e) => handleSubirPago(e, 'oxxo')} className="space-y-2">
                                <input
                                    type="file"
                                    accept="image/*,.pdf"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                    className="text-xs w-full"
                                />
                                <button
                                    type="submit"
                                    disabled={uploading || !file}
                                    className="w-full bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold py-1.5 rounded-md transition disabled:opacity-50 text-xs"
                                >
                                    {uploading ? 'Enviando...' : 'Enviar Comprobante OXXO'}
                                </button>
                            </form>
                            {pagoMensaje && (
                                <p className={`text-center font-medium text-[11px] ${pagoMensaje.includes('error') ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {pagoMensaje}
                                </p>
                            )}
                        </div>
                    )}
                </>
            ) : (
                /* VISTA PARA ALUMNO YA INSCRITO */
                <div className="space-y-4">
                    <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800">
                        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div>
                            <p className="text-xs font-bold">¡Ya estás inscrito en este curso!</p>
                            <p className="text-[11px] text-emerald-700">Acceso activo e ilimitado.</p>
                        </div>
                    </div>

                    <Link
                        href={`/cursos/${cursoId}/contenido`}
                        className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-[#2510a3] hover:bg-[#1e0d86] shadow-sm flex items-center justify-center gap-2 transition active:scale-98"
                    >
                        <PlayCircle className="w-4 h-4" />
                        <span>Continuar al Curso</span>
                    </Link>

                    {requiereExamen && !isAprobado && mostrarExamenFinal && (
                        <Link
                            href={`/cursos/${cursoId}/examen`}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-2 transition"
                        >
                            <FileCheck className="w-4 h-4" />
                            <span>Realizar Examen Final</span>
                        </Link>
                    )}

                    {mostrarConstancia && (
                        puedeVerConstancia ? (
                            <Link
                                href={`/cursos/${cursoId}/certificado`}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 flex items-center justify-center gap-2 transition"
                            >
                                <Award className="w-4 h-4" />
                                <span>Ver y Descargar Constancia</span>
                            </Link>
                        ) : (
                            <button
                                onClick={() => setShowPagoConstancia(!showPagoConstancia)}
                                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 flex items-center justify-center gap-2 transition"
                            >
                                <Lock className="w-4 h-4" />
                                <span>Liberar Constancia Verificable</span>
                            </button>
                        )
                    )}
                </div>
            )}

            {/* Badges de Confianza e Información Inferiores */}
            <div className="space-y-4 pt-4 border-t border-slate-100 text-xs">
                {/* 1. Pago 100% seguro */}
                <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 stroke-[1.75]" />
                    </div>
                    <div>
                        <p className="font-bold text-slate-900">Pago 100% seguro</p>
                        <p className="text-[11px] text-slate-500">Tus datos están protegidos</p>
                    </div>
                </div>

                {/* 2. Constancia con valor curricular */}
                <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldCheck className="w-3.5 h-3.5 stroke-[1.75]" />
                    </div>
                    <div className="space-y-1 flex-1">
                        <p className="font-bold text-slate-900 leading-snug">
                            Tu constancia tiene valor curricular verificable
                        </p>
                        <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                            Incluye un código único que permite verificar su autenticidad en línea al instante.
                        </p>
                    </div>
                </div>

                {/* 3. Dudas y Soporte */}
                <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                        <Headphones className="w-3.5 h-3.5 stroke-[1.75]" />
                    </div>
                    <div className="space-y-2 flex-1">
                        <div>
                            <p className="font-bold text-slate-900">¿Tienes dudas?</p>
                            <p className="text-[11px] text-slate-500">Nuestro equipo está listo para ayudarte.</p>
                        </div>
                        <button
                            onClick={() => setShowFaqModal(true)}
                            className="w-full py-1.5 px-3 border border-slate-200 rounded-lg text-[11px] font-bold text-slate-700 hover:text-indigo-700 hover:border-indigo-200 bg-white flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                        >
                            <span>Ir a Preguntas Frecuentes</span>
                            <ArrowRight className="w-3 h-3 text-slate-400" />
                        </button>
                    </div>
                </div>
            </div>



            {/* Modal: Preguntas Frecuentes y Soporte */}
            {showFaqModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-4">
                        <button
                            onClick={() => setShowFaqModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Headphones className="w-5 h-5 text-indigo-600" />
                            Preguntas Frecuentes y Soporte
                        </h3>
                        <div className="space-y-3 text-xs text-slate-600">
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="font-bold text-slate-900 mb-1">¿Cuándo tengo acceso al curso?</p>
                                <p>El acceso es inmediato tras confirmarse el pago por tarjeta/OXXO o validarse tu comprobante de transferencia.</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                                <p className="font-bold text-slate-900 mb-1">¿La constancia es válida ante instituciones?</p>
                                <p>Sí, cuenta con valor curricular, registro institucional y folio con código QR verificable en línea las 24 horas.</p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                <p className="font-bold text-slate-900">¿Necesitas ayuda personalizada?</p>
                                <p>Escríbenos a nuestro equipo de atención y soporte académico en cualquiera de nuestros canales oficiales de EGAC.</p>
                                <a
                                    href="https://wa.me/527298184978"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs transition-colors shadow-xs"
                                >
                                    <MessageCircle className="w-4 h-4" />
                                    WhatsApp Business: +52 (729) 818-4978
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
