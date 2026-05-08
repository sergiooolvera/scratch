'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, AlertTriangle, Building2, CreditCard, PlusCircle, ArrowRight } from 'lucide-react'

export default function RegistrarActividadPage() {
    const [formData, setFormData] = useState({
        nombre: '',
        tipo: 'Curso',
        tipo_otro: '',
        duracion: '',
        fecha_ejecucion: '',
        ubicacion: '',
        facilitador: ''
    })
    const [archivos, setArchivos] = useState<File[]>([])
    const [creditos, setCreditos] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [redirecting, setRedirecting] = useState(false)
    const [mensaje, setMensaje] = useState('')
    
    // Modal states
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
    const [showCupon, setShowCupon] = useState(false)
    const [showTransfer, setShowTransfer] = useState(false)
    const [showOxxo, setShowOxxo] = useState(false)
    const [showStripeOptions, setShowStripeOptions] = useState(false)
    
    // Form states
    const [cuponCodigo, setCuponCodigo] = useState('')
    const [cuponError, setCuponError] = useState('')
    const [cuponSuccess, setCuponSuccess] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [uploading, setUploading] = useState(false)
    const [pagoMensaje, setPagoMensaje] = useState('')
    
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchCreditos()
    }, [])

    const fetchCreditos = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            router.push('/login')
            return
        }

        const { data } = await supabase
            .from('ie_institucion_creditos')
            .select('*')
            .eq('user_id', user.id)
            .single()

        setCreditos(data || { creditos_restantes: 0, plan_actual: 'Ninguno' })
        setLoading(false)
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMensaje('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const tipoFinal = formData.tipo === 'Otra' ? formData.tipo_otro : formData.tipo

        if (!formData.nombre || !tipoFinal || !formData.duracion || !formData.fecha_ejecucion || !formData.facilitador) {
            setMensaje('Error: Completa todos los campos obligatorios.')
            setSaving(false)
            return
        }

        if (!creditos || creditos.creditos_restantes <= 0) {
            setMensaje('Error: No tienes créditos o actividades disponibles. Por favor, adquiere un plan en la sección de "Planes para Actividades" para poder registrar constancias.')
            window.scrollTo({ top: 0, behavior: 'smooth' })
            setSaving(false)
            return
        }

        // Subir archivos de evidencia
        let archivosUrls: string[] = []
        if (archivos.length > 0) {
            try {
                for (const archivo of archivos) {
                    const fileExt = archivo.name.split('.').pop()
                    const fileName = `actividad-${user.id}-${Math.random()}.${fileExt}`
                    const filePath = `${user.id}/${fileName}`

                    const { error: uploadError } = await supabase.storage
                        .from('comprobantes')
                        .upload(filePath, archivo)

                    if (uploadError) throw uploadError

                    const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath)
                    archivosUrls.push(data.publicUrl)
                }
            } catch (err: any) {
                setMensaje('Error al subir los documentos: ' + err.message)
                setSaving(false)
                return
            }
        }

        const nuevaActividad = {
            user_id: user.id,
            nombre_actividad: formData.nombre,
            tipo_actividad: tipoFinal,
            duracion: formData.duracion,
            fecha_ejecucion: formData.fecha_ejecucion,
            ubicacion: formData.ubicacion || null,
            autor: formData.facilitador,
            institucion_acredita: 'INSTITUTO EDUCATIVO DE ESPECIALIDADES PARA LA CAPACITACION NACIONAL',
            fotos: archivosUrls, // Guardamos los URLs en la columna fotos
            pagado_con_credito: true,
            pago_estado: 'completado'
        }

        const { data: insertData, error: insertError } = await supabase
            .from('ie_actividad_institucion')
            .insert(nuevaActividad)
            .select()
            .single()
        
        if (insertError) {
            setMensaje('Error al registrar la actividad: ' + insertError.message)
            setSaving(false)
            return
        }

        // Descontar el crédito utilizado a través de una API segura
        await fetch('/api/deduct-credit', {
            method: 'POST',
        })

        setMensaje('¡Actividad registrada correctamente! Se descontó 1 crédito de tu plan. Generando tu constancia...')
        setArchivos([])
        setTimeout(() => {
            if (insertData?.id) {
                router.push(`/institucion/actividad/${insertData.id}/constancia`)
            } else {
                router.push('/institucion/expediente')
            }
        }, 2000)
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files)
            setArchivos(prev => [...prev, ...newFiles])
        }
        // Limpiamos el input para permitir volver a seleccionar el mismo archivo
        e.target.value = ''
    }

    const comprarPlan = async (planId: string, codigoCupon?: string, isSubscription: boolean = false) => {
        setRedirecting(true)
        setCuponError('')
        setCuponSuccess('')
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const res = await fetch('/api/checkout-institucion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, userId: user.id, cuponCodigo: codigoCupon, isSubscription }),
            })
            
            const data = await res.json()
            if (data.url) {
                window.location.href = data.url
            } else {
                setCuponError(data.error || 'Error al procesar la solicitud.')
                setRedirecting(false)
            }
        } catch (error) {
            console.error('Error al generar checkout:', error)
            setCuponError('Error de red al intentar conectar con la pasarela.')
            setRedirecting(false)
        }
    }

    const handleCanjearCupon = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!cuponCodigo.trim() || !selectedPlan) return
        await comprarPlan(selectedPlan, cuponCodigo.trim().toUpperCase())
    }

    const handleSubirPago = async (e: React.FormEvent, metodo: string) => {
        e.preventDefault()
        if (!file || !selectedPlan) {
            setPagoMensaje('Por favor, selecciona el comprobante.')
            return
        }

        setUploading(true)
        setPagoMensaje('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const fileExt = file.name.split('.').pop()
            const fileName = `inst-${selectedPlan}-${Math.random()}.${fileExt}`
            const filePath = `${user.id}/${fileName}`

            // Subir archivo
            const { error: uploadError } = await supabase.storage
                .from('comprobantes')
                .upload(filePath, file)

            if (uploadError) throw uploadError

            const { data } = supabase.storage.from('comprobantes').getPublicUrl(filePath)
            const publicURL = data.publicUrl

            // Enviar al nuevo endpoint
            const res = await fetch('/api/report-payment-institucion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPlan,
                    userId: user.id,
                    publicURL,
                    metodo,
                })
            })

            const responseData = await res.json()
            if (!res.ok) {
                throw new Error(responseData.error || 'Error al procesar el pago manual')
            }

            setPagoMensaje('¡Comprobante enviado con éxito y plan habilitado!')
            setFile(null)
            
            setTimeout(() => {
                router.push('/institucion/expediente')
            }, 2000)

        } catch (error: any) {
            console.error(error)
            setPagoMensaje('Hubo un error al subir el comprobante. Inténtalo de nuevo.')
        } finally {
            setUploading(false)
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando panel institucional...</div>

    const hasCredits = creditos?.creditos_restantes > 0;

    return (
        <div className="max-w-5xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8 flex items-center gap-2">
                <Building2 className="h-8 w-8 text-indigo-600" />
                Panel Institucional
            </h1>

            {/* Sección de Planes y Créditos */}
            <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100 mb-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-indigo-900 flex items-center gap-2">
                            <CreditCard className="h-6 w-6" /> Planes para Actividades
                        </h2>
                        <p className="text-indigo-700 mt-1">
                            Plan actual: <span className="font-bold">{creditos?.plan_actual || 'Ninguno'}</span>
                        </p>
                    </div>
                    <div className="bg-white px-6 py-3 rounded-xl shadow-sm border border-indigo-100 text-center">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Actividades Disponibles</p>
                        <p className={`text-3xl font-black ${creditos?.creditos_restantes > 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                            {creditos?.creditos_restantes || 0}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
                        <div>
                            <h3 className="font-black text-gray-800 text-lg">INDIVIDUAL</h3>
                            <p className="text-gray-500 text-sm mt-1">1 Certificado de actividad</p>
                            <p className="text-2xl font-bold text-gray-900 mt-3">$50 <span className="text-sm font-normal text-gray-500">MXN</span></p>
                        </div>
                        <button onClick={() => setSelectedPlan('individual')} className="mt-4 w-full bg-indigo-50 text-indigo-700 font-bold py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                            Comprar
                        </button>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-xl border border-indigo-900 shadow-md transform scale-105 z-10 flex flex-col justify-between">
                        <div>
                            <h3 className="font-black text-white text-lg">PRO</h3>
                            <p className="text-indigo-200 text-sm mt-1">10 Certificados (Suscripción mensual)</p>
                            <p className="text-3xl font-bold text-white mt-3">$400 <span className="text-sm font-normal text-indigo-200">MXN/mes</span></p>
                        </div>
                        <button onClick={() => setSelectedPlan('pro')} className="mt-4 w-full bg-white text-indigo-700 font-black py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm">
                            Suscribirse
                        </button>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:border-indigo-300 transition-all flex flex-col justify-between">
                        <div>
                            <h3 className="font-black text-gray-800 text-lg">ULTRA</h3>
                            <p className="text-gray-500 text-sm mt-1">100 Certificados (Suscripción mensual)</p>
                            <p className="text-2xl font-bold text-gray-900 mt-3">$3,000 <span className="text-sm font-normal text-gray-500">MXN/mes</span></p>
                        </div>
                        <button onClick={() => setSelectedPlan('ultra')} className="mt-4 w-full bg-indigo-50 text-indigo-700 font-bold py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                            Suscribirse
                        </button>
                    </div>
                </div>
                <p className="text-xs text-center text-indigo-400 mt-4 font-medium">Los paquetes tienen una vigencia de 3 meses.</p>

                {/* MODAL DE PAGO INSTITUCIONAL */}
                {selectedPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
                        <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in-95 my-8">
                            <button onClick={() => { setSelectedPlan(null); setShowCupon(false); setShowTransfer(false); setShowOxxo(false); setShowStripeOptions(false); setCuponError(''); setPagoMensaje(''); setFile(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                                <AlertTriangle className="h-5 w-5 hidden" /> {/* Just to keep lucide import used */}
                                <span className="text-xl font-bold">×</span>
                            </button>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Completar Pago</h2>
                            <p className="text-gray-600 mb-6">Selecciona tu método de pago para el plan <span className="font-bold uppercase text-indigo-600">{selectedPlan}</span>.</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                <button
                                    onClick={() => {
                                        if (selectedPlan === 'pro' || selectedPlan === 'ultra') {
                                            setShowStripeOptions(true);
                                            setShowOxxo(false);
                                            setShowTransfer(false);
                                            setShowCupon(false);
                                        } else {
                                            comprarPlan(selectedPlan);
                                        }
                                    }}
                                    disabled={redirecting || uploading}
                                    className="flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 transition"
                                >
                                    💳 Tarjeta / Oxxo (Stripe)
                                </button>
                                
                                <button
                                    onClick={() => { setShowTransfer(true); setShowOxxo(false); setShowCupon(false); setShowStripeOptions(false); }}
                                    disabled={redirecting || uploading}
                                    className="flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-green-600 hover:bg-green-700 transition"
                                >
                                    💵 Transferencia / Depósito
                                </button>

                                <button
                                    onClick={() => { setShowOxxo(true); setShowTransfer(false); setShowCupon(false); setShowStripeOptions(false); }}
                                    disabled={redirecting || uploading}
                                    className="flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition"
                                >
                                    🏪 Reportar Oxxo Manual
                                </button>

                                <button
                                    onClick={() => { setShowCupon(true); setShowTransfer(false); setShowOxxo(false); setShowStripeOptions(false); }}
                                    disabled={redirecting || uploading}
                                    className="flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-yellow-800 bg-yellow-100 hover:bg-yellow-200 transition"
                                >
                                    🎟️ Tengo un Cupón
                                </button>
                            </div>

                            {showStripeOptions && (
                                <div className="mt-2 p-4 bg-blue-50 border border-blue-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <h3 className="text-sm font-bold text-blue-900 mb-2">¿Cómo deseas procesar tu pago?</h3>
                                    <p className="text-sm text-blue-800 mb-4">Elige si prefieres un pago único por los próximos 3 meses, o suscribirte para renovar automáticamente cada mes.</p>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            onClick={() => comprarPlan(selectedPlan, undefined, false)}
                                            disabled={redirecting}
                                            className="w-full bg-white border border-blue-300 text-blue-700 font-bold py-3 rounded-lg hover:bg-blue-100 transition shadow-sm"
                                        >
                                            💳 Pago Único (Permite Oxxo y Tarjeta)
                                        </button>
                                        <button
                                            onClick={() => comprarPlan(selectedPlan, undefined, true)}
                                            disabled={redirecting}
                                            className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition shadow-sm"
                                        >
                                            🔄 Suscripción Mensual (Solo Tarjeta)
                                        </button>
                                    </div>
                                </div>
                            )}

                            {showCupon && (
                                <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Canjear Cupón Institucional</h3>
                                    <form onSubmit={handleCanjearCupon} className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Ej: BECAINST"
                                            value={cuponCodigo}
                                            onChange={(e) => setCuponCodigo(e.target.value.toUpperCase())}
                                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 uppercase px-3 py-2 border text-black bg-white"
                                        />
                                        <button
                                            type="submit"
                                            disabled={redirecting || !cuponCodigo.trim()}
                                            className="bg-gray-900 text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 disabled:opacity-50"
                                        >
                                            {redirecting ? '...' : 'Aplicar'}
                                        </button>
                                    </form>
                                    {cuponError && <p className="mt-2 text-sm text-red-600 font-medium">{cuponError}</p>}
                                    {cuponSuccess && <p className="mt-2 text-sm text-green-600 font-medium">{cuponSuccess}</p>}
                                </div>
                            )}

                            {showTransfer && (
                                <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <h3 className="text-sm font-bold text-gray-900 mb-2">Datos para Transferencia:</h3>
                                    <ul className="list-none space-y-1 font-mono bg-white p-3 rounded border border-gray-200 text-sm mb-4">
                                        <li><strong>Banco:</strong> BBVA Bancomer</li>
                                        <li><strong>Cuenta:</strong> 047 011 9024</li>
                                        <li><strong>CLABE:</strong> 012 180 00470119024 6</li>
                                        <li><strong>Titular:</strong> Sergio Olvera</li>
                                    </ul>
                                    <form onSubmit={(e) => handleSubirPago(e, 'transferencia')} className="flex flex-col gap-3">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer border border-gray-300 rounded-md p-1"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                        <button type="submit" disabled={uploading || !file} className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50 transition">
                                            {uploading ? 'Enviando...' : 'Subir Comprobante de Transferencia'}
                                        </button>
                                    </form>
                                    {pagoMensaje && <p className={`mt-2 text-sm font-medium ${pagoMensaje.includes('error') ? 'text-red-600' : 'text-green-600'}`}>{pagoMensaje}</p>}
                                </div>
                            )}

                            {showOxxo && (
                                <div className="mt-2 p-4 bg-red-50 border border-red-200 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <h3 className="text-sm font-bold text-red-900 mb-2">Reportar Pago en Oxxo Manual</h3>
                                    <p className="text-sm text-red-800 mb-4">Sube una foto clara de tu ticket de depósito Oxxo si no usaste el checkout automático.</p>
                                    <form onSubmit={(e) => handleSubirPago(e, 'oxxo')} className="flex flex-col gap-3">
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="text-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-red-100 file:text-red-800 hover:file:bg-red-200 cursor-pointer border border-red-300 bg-white rounded-md p-1"
                                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                                        />
                                        <button type="submit" disabled={uploading || !file} className="bg-red-600 text-white px-4 py-2 rounded-md font-medium hover:bg-red-700 disabled:opacity-50 transition">
                                            {uploading ? 'Enviando...' : 'Subir Ticket de Oxxo'}
                                        </button>
                                    </form>
                                    {pagoMensaje && <p className={`mt-2 text-sm font-medium ${pagoMensaje.includes('error') ? 'text-red-600' : 'text-green-600'}`}>{pagoMensaje}</p>}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Formulario de Registro */}
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 relative">
                {!hasCredits && !loading && (
                    <div className="absolute inset-0 z-10 bg-white/50 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-2xl">
                        <div className="bg-white p-6 rounded-xl shadow-xl border border-red-100 text-center max-w-sm transform -translate-y-4">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-50 mb-3">
                                <AlertTriangle className="h-6 w-6 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">Sin Actividades Disponibles</h3>
                            <p className="text-sm text-gray-600 mb-4">Adquiere un plan en la sección <strong>Planes para Actividades</strong> (arriba) para habilitar este formulario y registrar nuevas constancias.</p>
                            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-indigo-700 transition">
                                Ver Planes
                            </button>
                        </div>
                    </div>
                )}

                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b pb-4 flex items-center gap-2">
                    <PlusCircle className="h-6 w-6 text-gray-400" />
                    Registrar Nueva Actividad
                </h2>

                {/* MODAL DE MENSAJES (Sustituye al mensaje inline) */}
                {mensaje && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-60 p-4 animate-in fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center transform scale-100 animate-in zoom-in-95">
                            {mensaje.includes('Error') ? (
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                                    <AlertTriangle className="h-6 w-6 text-red-600" />
                                </div>
                            ) : (
                                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                                    <CheckCircle className="h-6 w-6 text-green-600" />
                                </div>
                            )}
                            <h3 className={`text-lg font-bold mb-2 ${mensaje.includes('Error') ? 'text-red-800' : 'text-green-800'}`}>
                                {mensaje.includes('Error') ? 'Ocurrió un problema' : '¡Éxito!'}
                            </h3>
                            <p className="text-gray-600 text-sm mb-6">{mensaje}</p>
                            
                            {mensaje.includes('Error') && (
                                <button
                                    onClick={() => setMensaje('')}
                                    className="w-full bg-gray-900 text-white font-bold py-2 rounded-lg hover:bg-gray-800 transition"
                                >
                                    Cerrar y Reintentar
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Nombre de la actividad <span className="text-red-500">*</span></label>
                            <input type="text" name="nombre" required value={formData.nombre} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black" placeholder="Ej. Diplomado en Liderazgo" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Actividad <span className="text-red-500">*</span></label>
                            <select name="tipo" value={formData.tipo} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black">
                                <option value="Curso">Curso</option>
                                <option value="Taller">Taller</option>
                                <option value="Capacitación">Capacitación</option>
                                <option value="Otra">Otra (Especificar)</option>
                            </select>
                        </div>

                        {formData.tipo === 'Otra' && (
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">Especificar Tipo <span className="text-red-500">*</span></label>
                                <input type="text" name="tipo_otro" required value={formData.tipo_otro} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black" placeholder="Ej. Seminario" />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Duración (Horas/Módulos) <span className="text-red-500">*</span></label>
                            <input type="text" name="duracion" required value={formData.duracion} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black" placeholder="Ej. 40 Horas" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Fecha de Ejecución <span className="text-red-500">*</span></label>
                            <input type="date" name="fecha_ejecucion" required value={formData.fecha_ejecucion} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black" />
                        </div>

                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Ubicación</label>
                            <input type="text" name="ubicacion" value={formData.ubicacion} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black" placeholder="Ej. Tuxtla Gutiérrez, Chiapas" />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-bold text-gray-700 mb-1">Autor / Facilitador <span className="text-red-500">*</span></label>
                            <input type="text" name="facilitador" required value={formData.facilitador} onChange={handleChange} className="block w-full border-gray-300 rounded-lg p-3 border focus:ring-indigo-500 focus:border-indigo-500 bg-white text-black" placeholder="Nombre completo del instructor" />
                        </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mt-6 space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Institución que acredita</label>
                            <input type="text" disabled value="INSTITUTO EDUCATIVO DE ESPECIALIDADES PARA LA CAPACITACION NACIONAL" className="block w-full border-gray-200 rounded-md p-2 border bg-gray-100 text-gray-600 text-sm font-medium" />
                        </div>
                        
                        <div className="pt-2 border-t border-gray-200">
                            <label className="block text-sm font-bold text-gray-700 mb-2">Documentos de Respaldo <span className="text-gray-400 font-normal">(Opcional)</span></label>
                            <p className="text-xs text-gray-500 mb-3">Sube fotografías, PDFs o evidencia que acredite la realización de esta actividad. Puedes seleccionar varios archivos uno por uno.</p>
                            
                            <div className="flex items-center gap-3 mb-3">
                                <label className="cursor-pointer bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-4 py-2 rounded-md font-semibold text-sm transition border border-indigo-100">
                                    + Añadir Archivo(s)
                                    <input 
                                        type="file" 
                                        multiple
                                        accept="image/*,.pdf" 
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>

                            {archivos.length > 0 && (
                                <ul className="space-y-2">
                                    {archivos.map((file, idx) => file ? (
                                        <li key={idx} className="flex items-center justify-between bg-white border border-gray-200 rounded-md p-2 text-sm text-gray-700">
                                            <span className="truncate max-w-[80%]">{file.name || 'Archivo sin nombre'}</span>
                                            <button 
                                                type="button" 
                                                onClick={() => setArchivos(prev => prev.filter((_, i) => i !== idx))}
                                                className="text-red-500 hover:text-red-700 px-2 font-bold"
                                            >
                                                ✕
                                            </button>
                                        </li>
                                    ) : null)}
                                </ul>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button 
                            type="submit" 
                            disabled={saving || !hasCredits}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-full font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            {saving ? 'Registrando...' : 'Registrar Actividad'} <ArrowRight className="h-5 w-5" />
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
