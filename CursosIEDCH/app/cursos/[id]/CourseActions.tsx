'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { X, UploadCloud, Ticket, CreditCard, Banknote, AlertCircle, Lock, Store, Tag } from 'lucide-react'

export default function CourseActions({ cursoId, isPagado, pagoCompleto, constanciaRequierePago, isAprobado, requiereExamen, userId, precioCurso, montoPagado, esCreadoPorInstructor = false }: {
    cursoId: string,
    isPagado: boolean,
    pagoCompleto: boolean,
    constanciaRequierePago: boolean,
    isAprobado: boolean,
    requiereExamen: boolean,
    userId: string,
    precioCurso?: number,
    montoPagado?: number,
    esCreadoPorInstructor?: boolean
}) {
    const [loading, setLoading] = useState(false)
    const [showCupon, setShowCupon] = useState(false)
    const [showEfectivo, setShowEfectivo] = useState(false)
    const [showOxxo, setShowOxxo] = useState(false)
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

    const handleComprarStrípe = async (cuponCode?: string, esConstancia: boolean = false) => {
        setLoading(true)
        try {
            const res = await fetch('/api/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cursoId, userId, cuponCodigo: cuponCode, esConstancia, referralCode: referralValid ? referralCode.trim().toUpperCase() : undefined })
            })
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else if (data.success) {
                // If it was a 100% coupon, the API might just grant access and return success
                router.refresh()
            } else {
                throw new Error(data.error || 'No se recibió URL de Stripe')
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
            // Verificar si el cupón existe y es válido
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

            // Validar si el cupón es exclusivo de otro curso
            if (cupon.curso_id && cupon.curso_id !== cursoId) {
                setCuponError('Este cupón no es válido para este curso.')
                setLoading(false)
                return
            }

            if (cupon.descuento_porcentaje === 100) {
                // Bono del 100% - Aprobar inmediatamente vía backend en un endpoint o insertar directo si hay permiso
                // Para seguridad, lo mandaremos al checkout pero indicando que es gratis.
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
            // IMPORTANT: RLS policy requires the file to be in a folder matching the user's ID
            const filePath = `${userId}/${fileName}`

            // Subir archivo al bucket 'comprobantes'
            const { error: uploadError } = await supabase.storage
                .from('comprobantes')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            // Obtener la URL pública del archivo
            const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath)
            const publicURL = data.publicUrl

            // Enviar al nuevo endpoint de aprobación automática
            const res = await fetch('/api/report-payment-auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cursoId,
                    userId,
                    publicURL,
                    metodo,
                    notas: metodo === 'oxxo' ? 'Pago reportado por OXXO' : '',
                    esConstancia: false,
                    referredBy: referralValid ? referralId : null
                })
            })

            if (!res.ok) {
                throw new Error('Error al procesar el pago automático')
            }

            setPagoMensaje('¡Comprobante enviado con éxito y curso habilitado!')
            setFile(null)

            // Recargar para que vea el curso
            router.refresh()

            // Opcional: Cerrar modal después de un rato
            setTimeout(() => {
                setShowEfectivo(false)
                setShowOxxo(false)
                setPagoMensaje('')
            }, 3000)

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
            setPagoConstanciaMensaje('Por favor, selecciona la imagen o PDF del comprobante.')
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

            // Enviar al nuevo endpoint de aprobación automática para constancia
            const res = await fetch('/api/report-payment-auto', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cursoId,
                    userId,
                    publicURL,
                    metodo,
                    notas: `Pago complementario para constancia - ${metodo}`,
                    esConstancia: true
                })
            })

            if (!res.ok) {
                const errData = await res.json().catch(() => ({ details: 'Error desconocido' }))
                throw new Error(errData.details || 'Error al procesar el pago automático')
            }

            setPagoConstanciaMensaje('¡Comprobante enviado y constancia habilitada!')
            setFileConstancia(null)

            // Recargar para que vea el certificado habilitado
            router.refresh()

        } catch (error: any) {
            console.error(error)
            setPagoConstanciaMensaje(error.message || 'Hubo un error al subir el comprobante. Inténtalo de nuevo.')
        } finally {
            setUploadingConstancia(false)
        }
    }

    if (!isPagado) {
        if (esCreadoPorInstructor || precioCurso === 0) {
            return (
                <div className="w-full flex flex-col items-center p-6 bg-blue-50 border border-blue-100 rounded-2xl">
                    <p className="text-sm font-semibold text-blue-800 mb-4 text-center">
                        Este curso es gratuito para su estudio. Haz clic en el botón de abajo para inscribirte y comenzar a aprender de inmediato.
                    </p>
                    <button
                        onClick={() => handleComprarStrípe()}
                        disabled={loading}
                        className="w-full max-w-md flex items-center justify-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {loading ? 'Inscribiendo...' : 'Inscribirse Gratis'}
                    </button>
                </div>
            )
        }

        return (
            <div className="w-full space-y-4">
                {/* Campo de código de referido */}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                    <label className="flex items-center gap-2 text-sm font-medium text-indigo-700 mb-2">
                        <Tag className="w-4 h-4" />
                        ¿Tienes un código de referido? <span className="text-indigo-400 font-normal">(opcional)</span>
                    </label>
                    <div className="flex gap-2">
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
                            className={`flex-1 rounded-md shadow-sm text-sm px-3 py-2 border uppercase bg-white focus:ring-2 ${
                                referralValid === true ? 'border-green-400 focus:ring-green-200' :
                                referralValid === false ? 'border-red-400 focus:ring-red-200' :
                                'border-indigo-200 focus:ring-indigo-300 focus:border-indigo-400'
                            }`}
                            maxLength={15}
                        />
                        {referralCode.trim() && referralValid === null && (
                            <button
                                type="button"
                                onClick={handleVerificarReferral}
                                disabled={checkingReferral}
                                className="px-3 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors whitespace-nowrap"
                            >
                                {checkingReferral ? '...' : 'Verificar'}
                            </button>
                        )}
                        {referralValid !== null && (
                            <button type="button" onClick={() => { setReferralCode(''); setReferralValid(null); setReferralNombre(''); setReferralError('') }} className="text-gray-400 hover:text-gray-600 px-2">
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {referralValid === true && (
                        <p className="text-xs text-green-600 mt-1 font-medium">✓ Código válido — Referido por: {referralNombre}</p>
                    )}
                    {referralValid === false && (
                        <p className="text-xs text-red-500 mt-1 font-medium">✕ {referralError}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <button
                        onClick={() => handleComprarStrípe()}
                        disabled={loading}
                        className="flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
                    >
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pagar con Tarjeta/Oxxo
                    </button>

                    <button
                        onClick={() => { setShowEfectivo(true); setShowOxxo(false); setShowCupon(false); }}
                        disabled={loading}
                        className="flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition"
                    >
                        <Banknote className="w-5 h-5 mr-2" />
                        Pagar en Efectivo
                    </button>

                    <button
                        onClick={() => { setShowOxxo(true); setShowEfectivo(false); setShowCupon(false); }}
                        disabled={loading}
                        className="flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition"
                    >
                        <Store className="w-5 h-5 mr-2" />
                        Reportar Pago Oxxo
                    </button>

                    <button
                        onClick={() => { setShowCupon(true); setShowEfectivo(false); setShowOxxo(false); }}
                        disabled={loading}
                        className="flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition"
                    >
                        <Ticket className="w-5 h-5 mr-2" />
                        Tengo un Cupón
                    </button>
                </div>

                {/* MODAL CUPÓN */}
                {showCupon && (
                    <div className="mt-4 p-5 bg-white border border-gray-200 shadow-lg rounded-xl flex flex-col relative transition-all animate-in fade-in slide-in-from-top-4">
                        <button onClick={() => setShowCupon(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Canjear Cupón o Bono</h3>
                        <p className="text-sm text-gray-500 mb-4">Ingresa tu código promocional o bono del 100%.</p>
                        {constanciaRequierePago && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    <strong>Nota:</strong> Si pagas tu curso al 100% completo, la constancia está incluida. Si utilizas un cupón de descuento, el beneficio es solo para el curso; para recibir la constancia deberás cubrir el valor total de la misma al finalizar.
                                </p>
                            </div>
                        )}
                        <form onSubmit={handleCanjearCupon} className="flex flex-col sm:flex-row gap-2">
                            <input
                                type="text"
                                placeholder="Ej: BECA100"
                                value={cuponCodigo}
                                onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase px-4 py-3 sm:py-2 border"
                            />
                            <button
                                type="submit"
                                disabled={loading || !cuponCodigo.trim()}
                                className="w-full sm:w-auto bg-gray-900 text-white px-6 py-3 sm:py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                                Aplicar
                            </button>
                        </form>
                        {cuponError && <p className="mt-2 text-sm text-red-600 font-medium">{cuponError}</p>}
                        {cuponSuccess && <p className="mt-2 text-sm text-green-600 font-medium">{cuponSuccess}</p>}
                    </div>
                )}

                {/* MODAL EFECTIVO */}
                {showEfectivo && (
                    <div className="mt-4 p-6 bg-white border border-gray-200 shadow-xl rounded-xl flex flex-col relative transition-all animate-in fade-in slide-in-from-top-4">
                        <button onClick={() => setShowEfectivo(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 flex items-center"><Banknote className="mr-2 text-green-600" /> Pago por Transferencia o Depósito</h3>
                        <div className="bg-gray-50 p-4 rounded-md mb-4 border border-gray-100 text-sm text-gray-700">
                            <p className="mb-2 font-bold">Instrucciones de Pago:</p>
                            <p>Realiza un depósito bancario o transferencia interbancaria a la siguiente cuenta:</p>
                            <ul className="mt-2 list-none space-y-1 font-mono bg-white p-3 rounded border">
                                <li><strong>Banco:</strong> BBVA Bancomer</li>
                                <li><strong>Cuenta:</strong> 047 011 9024</li>
                                <li><strong>CLABE:</strong> 012 180 00470119024 6</li>
                                <li><strong>Titular:</strong> Sergio Olvera</li>
                            </ul>
                            <p className="mt-3 text-xs text-gray-500">Una vez realizado el pago, toma una foto del ticket o guarda el comprobante de transferencia y súbelo aquí.</p>
                        </div>

                        <form onSubmit={(e) => handleSubirPago(e, 'transferencia')} className="flex flex-col gap-4">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition cursor-pointer" onClick={() => document.getElementById('comprobante-upload')?.click()}>
                                <UploadCloud className="w-10 h-10 text-gray-400 mb-2" />
                                <span className="text-sm font-medium text-gray-600">
                                    {file ? file.name : 'Haz clic para seleccionar el comprobante'}
                                </span>
                                <input
                                    id="comprobante-upload"
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !file}
                                className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center transition"
                            >
                                {uploading ? 'Enviando...' : 'Enviar Comprobante para Revisión'}
                            </button>
                        </form>
                        {pagoMensaje && (
                            <p className={`mt-3 text-sm font-medium text-center ${pagoMensaje.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                                {pagoMensaje}
                            </p>
                        )}
                    </div>
                )}

                {/* MODAL OXXO */}
                {showOxxo && (
                    <div className="mt-4 p-6 bg-white border border-red-200 shadow-xl rounded-xl flex flex-col relative transition-all animate-in fade-in slide-in-from-top-4">
                        <button onClick={() => setShowOxxo(false)} className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center"><Store className="mr-2 text-red-600" /> Reportar Pago en Oxxo</h3>
                        
                        <p className="text-sm text-gray-600 mb-4">Sube una foto clara de tu ticket de depósito o transferencia recibida de Oxxo.</p>

                        <form onSubmit={(e) => handleSubirPago(e, 'oxxo')} className="flex flex-col gap-4">
                            <div className="border-2 border-dashed border-red-300 rounded-lg p-6 flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 transition cursor-pointer" onClick={() => document.getElementById('comprobante-oxxo-upload')?.click()}>
                                <UploadCloud className="w-10 h-10 text-red-400 mb-2" />
                                <span className="text-sm font-medium text-red-600">
                                    {file ? file.name : 'Haz clic para seleccionar tu ticket de Oxxo'}
                                </span>
                                <input
                                    id="comprobante-oxxo-upload"
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={uploading || !file}
                                className="w-full bg-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center transition"
                            >
                                {uploading ? 'Enviando...' : 'Enviar comprobante oxxo'}
                            </button>
                        </form>
                        {pagoMensaje && (
                            <p className={`mt-3 text-sm font-medium text-center ${pagoMensaje.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                                {pagoMensaje}
                            </p>
                        )}
                    </div>
                )}
            </div>
        )
    }

    // Determinar la URL de la constancia según si requiere examen o no
    const constanciaHref = `/cursos/${cursoId}/certificado`

    // Puede ver la constancia si: no requiere pago completo O ya pagó completo
    const puedeVerConstancia = !constanciaRequierePago

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
                <Link
                    href={`/cursos/${cursoId}/contenido`}
                    className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                    Tomar Curso
                </Link>

                {!requiereExamen ? (
                    puedeVerConstancia ? (
                        <Link
                            href={`/cursos/${cursoId}/certificado`}
                            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600"
                        >
                            Obtener Constancia
                        </Link>
                    ) : (
                        <button
                            onClick={() => setShowPagoConstancia(!showPagoConstancia)}
                            className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-amber-300 rounded-md shadow-sm text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 transition"
                        >
                            <Lock className="w-4 h-4" />
                            Obtener Constancia
                        </button>
                    )
                ) : !isAprobado ? (
                    <Link
                        href={`/cursos/${cursoId}/examen`}
                        className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                        Hacer Examen
                    </Link>
                ) : (
                    puedeVerConstancia ? (
                        <Link
                            href={`/cursos/${cursoId}/certificado`}
                            className="flex-1 flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600"
                        >
                            Obtener Constancia
                        </Link>
                    ) : (
                        <button
                            onClick={() => setShowPagoConstancia(!showPagoConstancia)}
                            className="flex-1 flex justify-center items-center gap-2 py-2 px-4 border border-amber-300 rounded-md shadow-sm text-sm font-medium text-amber-800 bg-amber-50 hover:bg-amber-100 transition"
                        >
                            <Lock className="w-4 h-4" />
                            Obtener Constancia
                        </button>
                    )
                )}
            </div>

            {/* BLOQUE DE PAGO PENDIENTE PARA CONSTANCIA */}
            {showPagoConstancia && !pagoCompleto && (
                <div className="mt-2 p-5 bg-amber-50 border border-amber-200 shadow-lg rounded-xl flex flex-col relative transition-all">
                    <button onClick={() => setShowPagoConstancia(false)} className="absolute top-3 right-3 text-amber-400 hover:text-amber-600"><X className="w-5 h-5" /></button>

                    <div className="flex items-start gap-3 mb-4">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <Lock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-amber-900">Constancia pendiente de pago</h3>
                            <p className="text-sm text-amber-800 mt-1 leading-relaxed">
                                {esCreadoPorInstructor ? (
                                    'Este curso es gratuito para su estudio. Para tener acceso a la constancia con valor curricular debes cubrir el costo de recuperación de $199 pesos (MXN).'
                                ) : (
                                    `Utilizaste un cupón de descuento para acceder al curso. Para recibir tu constancia deberás cubrir el monto restante` +
                                    (precioCurso !== undefined && montoPagado !== undefined ? ` ($${Math.max(0, precioCurso - montoPagado)} MXN)` : '') + '.'
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                        <button
                            onClick={() => handleComprarStrípe(undefined, true)}
                            disabled={loading}
                            className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
                        >
                            <CreditCard className="w-5 h-5 mr-2" />
                            Tarjeta/Oxxo
                        </button>
                        <button
                            onClick={() => { setShowTransferFormForConstancia(!showTransferFormForConstancia); setShowOxxoForConstancia(false); setShowCuponForConstancia(false); }}
                            className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition shadow-sm"
                        >
                            <Banknote className="w-5 h-5 mr-2" />
                            Transferencia
                        </button>
                        <button
                            onClick={() => { setShowOxxoForConstancia(!showOxxoForConstancia); setShowTransferFormForConstancia(false); setShowCuponForConstancia(false); }}
                            className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition shadow-sm"
                        >
                            <Store className="w-5 h-5 mr-2" />
                            Enviar comprobante oxxo
                        </button>
                        <button
                            onClick={() => { setShowCuponForConstancia(!showCuponForConstancia); setShowTransferFormForConstancia(false); setShowOxxoForConstancia(false); }}
                            className="flex items-center justify-center py-3 px-4 rounded-lg text-sm font-bold text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition shadow-sm"
                        >
                            <Ticket className="w-5 h-5 mr-2" />
                            Cupón
                        </button>
                    </div>

                    {/* Sección de transferencia */}
                    {showTransferFormForConstancia && (
                    <div id="constancia-efectivo-section" className="bg-white p-4 rounded-lg border border-amber-200 text-sm text-gray-700 mb-4 animate-in fade-in slide-in-from-top-2">
                        <p className="mb-2 font-bold text-gray-800">Datos para Transferencia:</p>
                        <ul className="list-none space-y-1 font-mono bg-gray-50 p-3 rounded border border-gray-200">
                            <li><strong>Banco:</strong> BBVA Bancomer</li>
                            <li><strong>Cuenta:</strong> 047 011 9024</li>
                            <li><strong>CLABE:</strong> 012 180 00470119024 6</li>
                            <li><strong>Titular:</strong> Sergio Olvera</li>
                            <li className="font-bold text-blue-700 mt-1"><strong>Monto a pagar:</strong> ${esCreadoPorInstructor ? 199 : Math.max(0, (precioCurso || 0) - (montoPagado || 0))} MXN</li>
                        </ul>

                        <form onSubmit={(e) => handleSubirPagoConstancia(e, 'transferencia')} className="flex flex-col gap-3 mt-4">
                            <div
                                className="border-2 border-dashed border-amber-300 rounded-lg p-4 flex flex-col items-center justify-center bg-amber-50 hover:bg-amber-100 transition cursor-pointer"
                                onClick={() => document.getElementById('comprobante-constancia-upload')?.click()}
                            >
                                <UploadCloud className="w-8 h-8 text-amber-400 mb-1" />
                                <span className="text-sm font-medium text-amber-700">
                                    {fileConstancia ? fileConstancia.name : 'Subir comprobante de pago'}
                                </span>
                                <input
                                    id="comprobante-constancia-upload"
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => setFileConstancia(e.target.files?.[0] || null)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={uploadingConstancia || !fileConstancia}
                                className="w-full bg-amber-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center transition"
                            >
                                {uploadingConstancia ? 'Enviando...' : 'Enviar Comprobante'}
                            </button>
                            {pagoConstanciaMensaje && (
                                <p className={`text-sm font-medium text-center ${pagoConstanciaMensaje.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                                    {pagoConstanciaMensaje}
                                </p>
                            )}
                        </form>
                    </div>
                    )}

                    {/* Sección de OXXO para constancia */}
                    {showOxxoForConstancia && (
                    <div className="bg-white p-4 rounded-lg border border-red-200 text-sm text-gray-700 mb-4 animate-in fade-in slide-in-from-top-2">
                        <p className="mb-2 font-bold text-gray-800 flex items-center"><Store className="mr-2 text-red-600 w-4 h-4" /> Reportar Pago en Oxxo:</p>
                        <p className="mb-4">Sube una foto clara de tu ticket de depósito o transferencia recibida de Oxxo.</p>

                        <form onSubmit={(e) => handleSubirPagoConstancia(e, 'oxxo')} className="flex flex-col gap-3 mt-4">
                            <div
                                className="border-2 border-dashed border-red-300 rounded-lg p-4 flex flex-col items-center justify-center bg-red-50 hover:bg-red-100 transition cursor-pointer"
                                onClick={() => document.getElementById('comprobante-constancia-oxxo-upload')?.click()}
                            >
                                <UploadCloud className="w-8 h-8 text-red-400 mb-1" />
                                <span className="text-sm font-medium text-red-700">
                                    {fileConstancia ? fileConstancia.name : 'Subir ticket de Oxxo'}
                                </span>
                                <input
                                    id="comprobante-constancia-oxxo-upload"
                                    type="file"
                                    accept="image/*,.pdf"
                                    className="hidden"
                                    onChange={(e) => setFileConstancia(e.target.files?.[0] || null)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={uploadingConstancia || !fileConstancia}
                                className="w-full bg-red-600 text-white px-5 py-3 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center transition"
                            >
                                {uploadingConstancia ? 'Enviando...' : 'Enviar comprobante oxxo'}
                            </button>
                            {pagoConstanciaMensaje && (
                                <p className={`text-sm font-medium text-center ${pagoConstanciaMensaje.includes('error') ? 'text-red-600' : 'text-green-600'}`}>
                                    {pagoConstanciaMensaje}
                                </p>
                            )}
                        </form>
                    </div>
                    )}

                    {/* Sección de Cupón para constancia */}
                    {showCuponForConstancia && (
                    <div className="bg-white p-4 rounded-lg border border-yellow-200 text-sm text-gray-700 mb-4 animate-in fade-in slide-in-from-top-2">
                        <p className="mb-2 font-bold text-gray-800">Canjear Cupón o Bono para Constancia:</p>
                        <form onSubmit={handleCanjearCupon} className="flex flex-col sm:flex-row gap-2 mt-2">
                            <input
                                type="text"
                                placeholder="Ej: BECA100"
                                value={cuponCodigo}
                                onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                                className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 uppercase px-4 py-2 border"
                            />
                            <button
                                type="submit"
                                disabled={loading || !cuponCodigo.trim()}
                                className="w-full sm:w-auto bg-gray-900 text-white px-6 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
                            >
                                Aplicar
                            </button>
                        </form>
                        {cuponError && <p className="mt-2 text-sm text-red-600 font-medium">{cuponError}</p>}
                        {cuponSuccess && <p className="mt-2 text-sm text-green-600 font-medium">{cuponSuccess}</p>}
                    </div>
                    )}
                </div>
            )}
        </div>
    )
}
