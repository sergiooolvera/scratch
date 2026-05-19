'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import { FileDown, ArrowLeft, Printer, GraduationCap, BookOpen, Clock, Calendar, MapPin, User, Building, ShieldCheck, Lock } from 'lucide-react'

const CornerOrnament = ({ className }: { className?: string }) => (
    <svg className={`w-16 h-16 pointer-events-none ${className}`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Outer Gold Border Line segment */}
        <path d="M0 0 H64" stroke="#d4af37" strokeWidth={1.5} />
        <path d="M0 0 V64" stroke="#d4af37" strokeWidth={1.5} />

        {/* Inner Navy Border Line segment */}
        <path d="M8 8 H64" stroke="#0a1128" strokeWidth={3} />
        <path d="M8 8 V64" stroke="#0a1128" strokeWidth={3} />

        {/* Thin Gold Border Line segment */}
        <path d="M16 16 H64" stroke="#d4af37" strokeWidth={1} strokeOpacity={0.7} />
        <path d="M16 16 V64" stroke="#d4af37" strokeWidth={1} strokeOpacity={0.7} />

        {/* Outer Corner Accent Square */}
        <rect x="0" y="0" width="12" height="12" fill="#d4af37" />
        <path d="M6 2 L10 6 L6 10 L2 6 Z" fill="#0a1128" />

        {/* Center Corner Star Ornament (at 20,20) */}
        <path d="M20 12 L24 20 L20 28 L16 20 Z" fill="#d4af37" />
        <path d="M12 20 L20 24 L28 20 L20 16 Z" fill="#d4af37" />
        <circle cx="20" cy="20" r="2" fill="#0a1128" />
    </svg>
)

export default function CertificadoActividadPage() {
    const params = useParams()
    const router = useRouter()
    const supabase = createClient()
    const [actividad, setActividad] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [originUrl, setOriginUrl] = useState('')

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOriginUrl(window.location.origin)
        }
    }, [])

    useEffect(() => {
        const fetchActividad = async () => {
            const { data } = await supabase
                .from('ie_actividad_institucion')
                .select(`
                    *,
                    ie_profiles:user_id ( nombre )
                `)
                .eq('id', params.id)
                .single()
            
            setActividad(data)
            setLoading(false)
        }
        
        if (params.id) {
            fetchActividad()
        }
    }, [params.id])

    if (loading) return <div className="p-8 text-center text-gray-500">Generando certificado...</div>
    if (!actividad) return <div className="p-8 text-center text-red-500">Actividad no encontrada</div>

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 min-h-screen bg-gray-100 flex flex-col items-center">
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=Inter:wght@400;500;600;700&display=swap');
            `}} />
            <style dangerouslySetInnerHTML={{__html: `
                .font-playfair { font-family: 'Playfair Display', serif; }
                .font-inter { font-family: 'Inter', sans-serif; }
                .cert-bg { background-color: #ffffff; }
                .text-navy { color: #0f172a; }
                .text-gold { color: #d4af37; }
                .bg-navy { background-color: #0a1128; }

                /* Border and Frame Styles */
                .cert-border-outer {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    right: 16px;
                    bottom: 16px;
                    border: 1.5px solid #d4af37;
                    pointer-events: none;
                    z-index: 10;
                }
                .cert-border-inner {
                    position: absolute;
                    top: 24px;
                    left: 24px;
                    right: 24px;
                    bottom: 24px;
                    border: 3px solid #0a1128;
                    pointer-events: none;
                    z-index: 10;
                }
                .cert-border-thin {
                    position: absolute;
                    top: 32px;
                    left: 32px;
                    right: 32px;
                    bottom: 32px;
                    border: 1px solid #d4af37;
                    opacity: 0.7;
                    pointer-events: none;
                    z-index: 10;
                }
                .cert-corner-tl {
                    position: absolute;
                    top: 16px;
                    left: 16px;
                    z-index: 15;
                    pointer-events: none;
                }
                .cert-corner-tr {
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    z-index: 15;
                    pointer-events: none;
                    transform: rotate(90deg);
                }
                .cert-corner-br {
                    position: absolute;
                    bottom: 16px;
                    right: 16px;
                    z-index: 15;
                    pointer-events: none;
                    transform: rotate(180deg);
                }
                .cert-corner-bl {
                    position: absolute;
                    bottom: 16px;
                    left: 16px;
                    z-index: 15;
                    pointer-events: none;
                    transform: rotate(270deg);
                }

                @media print {
                    @page { 
                        margin: 0; 
                        size: letter portrait; 
                    }
                    html, body {
                        height: 100% !important;
                        overflow: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    body { 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact; 
                        background: white !important;
                    }
                    /* Ocultar de manera ultra-específica elementos de pantalla globales */
                    html body nav,
                    html body header,
                    html body footer,
                    html body #navbar,
                    html body .print\:hidden,
                    html body button,
                    nav,
                    header,
                    footer {
                        display: none !important;
                        height: 0 !important;
                        opacity: 0 !important;
                        visibility: hidden !important;
                    }
                    /* Forzar al contenedor a ocupar exactamente la hoja carta sin duplicarse */
                    .print-cert-container {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 215.9mm !important;
                        height: 279.4mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        background: white !important;
                        page-break-inside: avoid !important;
                        page-break-after: avoid !important;
                    }
                }
            `}} />

            {/* Action Bar */}
            <div className="w-full flex justify-between items-center mb-8 print:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <button 
                    onClick={() => router.push('/institucion/expediente')}
                    className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 font-medium transition"
                >
                    <ArrowLeft className="h-5 w-5" /> Volver al Expediente
                </button>
                <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition shadow-sm"
                >
                    <Printer className="h-5 w-5" /> Imprimir / PDF
                </button>
            </div>

            {/* Certificado Container - Formato Vertical */}
            <div className="print-cert-container w-full max-w-[800px] cert-bg shadow-2xl print:shadow-none relative overflow-hidden flex flex-col font-inter" 
                 style={{ aspectRatio: '8.5 / 11' }}>
                
                {/* Marco de Certificado */}
                <div className="cert-border-outer" />
                <div className="cert-border-inner" />
                <div className="cert-border-thin" />

                {/* Esquinas Decorativas */}
                <CornerOrnament className="cert-corner-tl" />
                <CornerOrnament className="cert-corner-tr" />
                <CornerOrnament className="cert-corner-br" />
                <CornerOrnament className="cert-corner-bl" />
                
                <div className="flex flex-col px-16 pt-16 pb-16 h-full relative z-20 print:justify-center">
                    
                    {/* Header */}
                    <div className="text-center mb-4">
                        <p className="text-gray-700 font-medium tracking-widest text-[12px] uppercase">
                            INSTITUTO EDUCATIVO DE ESPECIALIDADES<br/>PARA LA CONDUCTA Y EL DESARROLLO HUMANO S.C.
                        </p>
                        <div className="flex items-center justify-center my-3 opacity-80">
                            <div className="h-[1.5px] bg-gradient-to-r from-transparent via-gold/80 to-gold w-40"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-gold mx-3 shadow-sm"></div>
                            <div className="h-[1.5px] bg-gradient-to-l from-transparent via-gold/80 to-gold w-40"></div>
                        </div>
                        <h1 className="text-[56px] leading-none font-playfair font-bold text-navy tracking-wider mt-3">
                            CERTIFICADO
                        </h1>
                    </div>

                    {/* Textos descriptivos */}
                    <div className="text-center text-xs sm:text-sm text-gray-700 leading-relaxed max-w-2xl mx-auto space-y-2.5 mb-6">
                        <p>
                            El presente certificado hace constar que la actividad descrita fue realizada conforme a las características previamente señaladas, desarrollándose de manera adecuada para fines de capacitación, actualización y formación profesional.
                        </p>
                        <p className="hidden sm:block">
                            Asimismo, el Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C. avala su impartición y reconoce su validez institucional como una actividad orientada al fortalecimiento académico y profesional de los participantes.
                        </p>
                    </div>

                    {/* Columnas: Detalles y Verificación */}
                    <div className="flex gap-8 flex-1">
                        
                        {/* Detalles de la actividad */}
                        <div className="flex-1 border-t border-gray-200">
                            {[
                                { icon: GraduationCap, label: 'Tipo de Actividad', value: actividad.tipo_actividad },
                                { icon: BookOpen, label: 'Nombre de la actividad', value: actividad.nombre_actividad },
                                { icon: Clock, label: 'Duración', value: actividad.duracion },
                                { icon: Calendar, label: 'Fecha de ejecución', value: new Date(actividad.fecha_ejecucion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' }) },
                                { icon: MapPin, label: 'Ubicación', value: actividad.ubicacion || 'México' },
                                { icon: User, label: 'Autor / Facilitador', value: actividad.autor },
                                { icon: Building, label: 'Institución', value: actividad.ie_profiles?.nombre },
                                { icon: Building, label: 'Institución que acredita', value: actividad.institucion_acredita }
                            ].map((item, idx, arr) => (
                                <div key={idx} className={`flex flex-col py-1 ${idx !== arr.length - 1 ? 'border-b border-gray-200' : ''}`}>
                                    <div className="flex items-center mb-0.5">
                                        <div className="bg-navy rounded-full p-1 mr-2 flex-shrink-0">
                                            <item.icon className="h-3.5 w-3.5 text-white" />
                                        </div>
                                        <div className="font-bold text-sm text-gray-800">
                                            {item.label}:
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-700 break-words pl-8">
                                        {item.value}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Caja de Verificación */}
                        <div className="w-64 flex-shrink-0 border-[1.5px] border-gray-300 rounded-lg p-4 flex flex-col items-center text-center bg-white h-fit">
                            <div className="bg-navy text-white text-xs font-bold py-1.5 px-6 rounded-md uppercase tracking-wider mb-2 -mt-7 shadow-sm">
                                Folio Único
                            </div>
                            <p className="text-gold font-bold text-lg mb-4">
                                IEECDH-{actividad.id.split('-')[0].toUpperCase()}
                            </p>
                            
                            <div className="w-full h-[1px] bg-gray-200 mb-4 relative">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                            </div>

                            <p className="text-[10px] font-bold text-gray-800 uppercase tracking-wider mb-1">
                                Código de Verificación
                            </p>
                            <div className="border border-gray-300 rounded-md py-1.5 px-4 w-full mb-4">
                                <p className="text-sm font-bold text-gray-800 tracking-widest">{actividad.id.split('-')[1].toUpperCase()}</p>
                            </div>

                            <div className="w-full h-[1px] bg-gray-200 mb-4 relative">
                                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                            </div>

                            <p className="text-[10px] font-bold text-gray-800 mb-1">VERIFICACIÓN</p>
                            <p className="text-[10px] text-gray-500 mb-4 leading-tight">
                                Escanea el código QR<br/>para validar la autenticidad<br/>de este certificado.
                            </p>

                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${originUrl || 'https://plataforma.secna.mx'}/validar?folio=IEECDH-${actividad.id.split('-')[0].toUpperCase()}`} 
                                alt="QR Code" 
                                className="w-26 h-26 mb-3 border p-1"
                            />

                            <div className="bg-navy text-white text-[9px] font-bold py-1.5 px-4 rounded-md flex items-center gap-1.5 uppercase">
                                <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Documento Verificado
                            </div>
                        </div>

                    </div>

                    {/* Footer / Firmas */}
                    <div className="mt-auto grid grid-cols-3 items-center border-t border-gray-300 pt-5">
                        <div className="col-span-1"></div>
                        <div className="col-span-1 flex justify-center">
                            <img 
                                src="/logotiposello.jpg" 
                                alt="Sello Institucional" 
                                className="w-24 h-24 object-contain"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden w-28 h-28 rounded-full border-[1.5px] border-gray-400 p-1 flex items-center justify-center relative">
                                <div className="absolute inset-1.5 rounded-full border-[1.5px] border-gray-400 border-dashed"></div>
                                <div className="text-center">
                                    <p className="text-[5px] font-bold uppercase tracking-widest text-gray-600">Registro Público</p>
                                    <div className="h-[1px] bg-gray-400 w-10 mx-auto my-0.5"></div>
                                    <p className="text-[8px] font-bold text-navy">No. {actividad.id.split('-')[0].substring(0, 5).toUpperCase()}</p>
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 flex justify-end items-start gap-3 pr-4">
                            <img 
                                src="/candado.jpg" 
                                alt="Seguridad" 
                                className="h-11 w-auto object-contain mt-1"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                            />
                            <div className="hidden bg-yellow-50 p-1.5 rounded-lg border border-yellow-200/50">
                                <Lock className="h-6 w-6 text-gold" strokeWidth={1.5} />
                            </div>
                            
                            <div>
                                <p className="text-xs text-gray-700 font-medium mb-2 leading-tight">
                                    Este documento ha sido emitido<br/>
                                    electrónicamente y cuenta con<br/>
                                    validez institucional.
                                </p>
                                <p className="text-xs font-bold text-navy tracking-wider uppercase">
                                    Documento<br/>Verificable
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    )
}
