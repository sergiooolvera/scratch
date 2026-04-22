'use client'

/* Forzar la carga de la fuente Montserrat */
import { Montserrat } from 'next/font/google'
const montserrat = Montserrat({ subsets: ['latin'], weight: ['400', '500', '700', '900'] })

import { QRCodeCanvas } from 'qrcode.react'

interface CertificadoDocumentProps {
    alumnoNombre: string;
    cursoTitulo: string;
    cursoDuracion?: string | null;
    fechaAprobacion: string;
    folio: string;
    vigenciaStr: string;
    qrUrl: string;
    id?: string;
    documentRef?: React.Ref<HTMLDivElement>;
    className?: string;
}

export default function CertificadoDocument({
    alumnoNombre,
    cursoTitulo,
    cursoDuracion,
    fechaAprobacion,
    folio,
    vigenciaStr,
    qrUrl,
    id,
    documentRef,
    className = ""
}: CertificadoDocumentProps) {
    return (
        <div
            id={id}
            ref={documentRef}
            className={`bg-white relative mx-auto overflow-hidden flex flex-col shrink-0 min-w-[1056px] ${montserrat.className} ${className}`}
            style={{ 
                width: '1056px', 
                height: '816px', 
                boxSizing: 'border-box', 
                color: '#0a1f44'
            }}
        >
            {/* Header Image (New SECNA Model) */}
            <div className="absolute top-0 left-0 right-0 z-10">
                <img src="/encabezado-modelo3.png" alt="Encabezado SECNA" className="w-full h-auto block" />
            </div>

            {/* Bottom Navy/Gold Curved Footer Decorative Layer */}
            <div className="absolute bottom-0 left-0 right-0 h-[100px] z-10 overflow-hidden pointer-events-none">
                <svg viewBox="0 0 1056 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full transform rotate-180">
                   <path d="M0 0H1056V40C800 80 250 10 0 60V0Z" fill="#002060" />
                   <path d="M0 60C250 10 800 80 1056 40V55C800 95 250 25 0 75V60Z" fill="#D4AF37" />
                </svg>
            </div>

            {/* Subtle Dot Pattern Left Background */}
            <div className="absolute top-0 left-0 bottom-0 w-[400px] opacity-[0.03] z-0 pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#000 1.5px, transparent 0)', backgroundSize: '24px 24px' }}>
            </div>

            {/* Main Content Area */}
            <div className="relative z-20 flex flex-col items-center justify-start h-full pt-[280px] pb-4 px-20 text-center">
                
                {/* Course Name Above Otorgado a: */}
                <h3 className="text-[44px] font-bold text-[#D4AF37] mb-2 tracking-wider uppercase text-center max-w-4xl break-words leading-tight">
                    {cursoTitulo}
                </h3>

                {/* Recipient Text */}
                <p className="text-[18px] text-gray-500 font-medium italic mt-4">Otorgado a:</p>
                
                {/* Student Name (Smaller font to fit one line) */}
                <h2 className="mt-2 text-[44px] font-bold text-[#002060] tracking-tight uppercase border-b-2 border-gray-100 pb-2 mb-4 whitespace-nowrap overflow-hidden">
                    {alumnoNombre}
                </h2>

                {/* Statement */}
                <p className="text-center text-[18px] text-gray-600 max-w-4xl font-medium">
                    Por acreditar satisfactoriamente las competencias laborales establecidas por SECNA.
                </p>

                {/* Information Area (Bottom Section) */}
                <div className="mt-auto w-full flex justify-between items-end pb-12 px-10">
                    
                    {/* Left: Signature and Dates */}
                    <div className="flex flex-col">
                        <div className="space-y-1 mb-8 border-l-4 border-[#D4AF37] pl-4 py-1 bg-gray-50 pr-8">
                            <p className="text-[14px] text-gray-600">
                                <strong className="text-[#002060]">Fecha de Emisión:</strong> {fechaAprobacion}
                            </p>
                            <p className="text-[14px] text-gray-600">
                                <strong className="text-[#002060]">Fecha de Caducidad:</strong> {vigenciaStr}
                            </p>
                            {cursoDuracion && (
                                <p className="text-[14px] text-gray-600">
                                    <strong className="text-[#002060]">Valor Curricular:</strong> {cursoDuracion}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex flex-col items-center w-[300px]">
                            <img 
                                src="/firma.png" 
                                alt="Firma" 
                                className="h-20 mb-[-10px] object-contain opacity-90"
                                onError={(e) => (e.currentTarget.style.visibility = 'hidden')}
                            />
                            <div className="w-full h-[1px] bg-[#002060] mb-2"></div>
                            <p className="font-bold text-[13px] uppercase tracking-wide text-center">
                                D. EN E. Irvin Rodolfo Tapia Bernabé
                            </p>
                            <p className="text-[12px] text-gray-500 font-semibold italic text-center">
                                Director Académico del Servicio Nacional de Evaluación y Registro Laboral
                            </p>
                        </div>
                    </div>

                    {/* Footer Accent Text */}
                    <div className="absolute left-0 right-0 bottom-4 text-center">
                         <p className="text-white text-[13px] font-bold tracking-[0.3em] uppercase z-20">
                             — Calificando Capacidades Laborales —
                         </p>
                    </div>

                    {/* Right: QR and Folio */}
                    <div className="flex flex-col items-center space-y-4">
                        <div className="bg-white p-2 border border-gray-100 shadow-sm rounded-lg">
                            <QRCodeCanvas 
                                value={qrUrl} 
                                size={110} 
                                level="H"
                                includeMargin={false}
                            />
                        </div>
                        <div className="text-right">
                             <p className="text-[11px] font-bold text-gray-400 tracking-widest uppercase mb-1">Folio de Seguridad</p>
                             <p className="text-[14px] font-black text-[#002060] tracking-wider bg-gray-50 px-3 py-1 border border-gray-100 italic">
                                SECNA-{folio}
                             </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}
