'use client'

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
    calificacion?: number | string;
    mostrarCalificacionConstancia?: boolean;
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
    className = "",
    calificacion = "",
    mostrarCalificacionConstancia = true
}: CertificadoDocumentProps) {
    return (
        <div
            id={id}
            ref={documentRef}
            className={`bg-white relative mx-auto overflow-hidden flex shrink-0 min-w-[1056px] ${className}`}
            style={{ 
                width: '1056px', 
                height: '816px', 
                boxSizing: 'border-box'
            }}
        >
            {/* Left Sidebar */}
            <div className="w-[280px] bg-[#0B1A3F] h-full flex flex-col items-center justify-between py-16 shrink-0 relative z-30">
                {/* Globe Logo */}
                <div className="w-[140px] flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="130" height="130" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="0.75" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        {/* Longitudes */}
                        <ellipse cx="12" cy="12" rx="3.33" ry="10" />
                        <ellipse cx="12" cy="12" rx="6.66" ry="10" />
                        <line x1="12" y1="2" x2="12" y2="22" />
                        {/* Latitudes */}
                        <line x1="2" y1="12" x2="22" y2="12" />
                        <line x1="2.32" y1="9.5" x2="21.68" y2="9.5" />
                        <line x1="3.34" y1="7" x2="20.66" y2="7" />
                        <line x1="5.39" y1="4.5" x2="18.61" y2="4.5" />
                        <line x1="2.32" y1="14.5" x2="21.68" y2="14.5" />
                        <line x1="3.34" y1="17" x2="20.66" y2="17" />
                        <line x1="5.39" y1="19.5" x2="18.61" y2="19.5" />
                    </svg>
                </div>
                
                {/* QR Code Block */}
                <div className="bg-white p-3 flex flex-col items-center rounded-sm">
                    <QRCodeCanvas 
                        value={qrUrl} 
                        size={100} 
                        level="L"
                        includeMargin={false}
                    />
                    <p className="text-[11px] font-bold text-black font-sans mt-2 tracking-wide">
                        Microdencial
                    </p>
                </div>
            </div>

            {/* Right Content Area */}
            <div className="flex-1 relative flex flex-col px-[60px] pt-[60px] pb-[40px] bg-white">
                
                {/* Watermark Background */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 pr-[50px] overflow-hidden">
                    <img src="/constancia_watermark.png" alt="watermark" className="w-[950px] max-w-none opacity-100" />
                </div>

                {/* Header Row */}
                <div className="flex justify-between items-center w-full z-20">
                    <p className="text-[13.5px] leading-snug font-bold text-black max-w-[450px] font-sans">
                        El Instituto Educativo De Especialidades Para La Conducta y el Desarrollo Humano S.C<br/>
                        a través del Ecosistema Global de Acreditación y Certificación.
                    </p>
                    <div className="flex items-center">
                        <img src="/logoegac.jpg" alt="EGAC Logo" className="h-[110px] object-contain" onError={(e) => { e.currentTarget.style.display = 'none' }} />
                    </div>
                </div>

                {/* Main Center Content */}
                <div className="flex-1 flex flex-col items-center justify-center w-full z-20 mt-4">
                    <p className="text-[14px] text-black font-sans tracking-wide">Emite la presente:</p>
                    
                    <h1 className="text-[#0B1A3F] text-[58px] font-serif tracking-[0.1em] mt-1">
                        CONSTANCIA
                    </h1>
                    
                    <p className="text-[14px] text-black font-sans mt-5">a:</p>
                    
                    {/* Alumno Name */}
                    <h2 
                        className={`text-[#0B1A3F] mt-2 font-normal leading-none whitespace-nowrap overflow-hidden text-ellipsis px-4 max-w-[700px] text-center ${alumnoNombre.length > 30 ? 'text-[50px]' : alumnoNombre.length > 22 ? 'text-[60px]' : 'text-[70px]'}`}
                        style={{ fontFamily: "'Brush Script MT', 'Great Vibes', cursive, serif" }}
                    >
                        {alumnoNombre}
                    </h2>
                    
                    {/* Name Underline */}
                    <div className="w-[85%] border-b border-black mt-2"></div>

                    {/* Course Section */}
                    <p className="text-[14px] text-black font-sans mt-6">
                        Por haber acreditado la capacitación:
                    </p>
                    
                    <h3 className="text-[20px] font-bold text-black uppercase mt-1 text-center px-4 max-w-[700px] italic">
                        “{cursoTitulo}”
                    </h3>

                    {/* Details Grid */}
                    <div className="flex justify-between items-start w-[85%] mt-12 text-[15px] font-sans text-black">
                        {/* Left Column - Takes up available space */}
                        <div className="flex flex-col text-left gap-1 flex-1 pr-6">
                            <p className="leading-snug text-justify">
                                <span className="font-semibold">Valor curricular:</span> {cursoDuracion || '5 Horas'}
                            </p>
                            <p className="mt-1">{fechaAprobacion}</p>
                        </div>
                        
                        {/* Right Column - Fixed maximum width for Folio to wrap correctly */}
                        <div className="flex flex-col text-left w-[300px] shrink-0">
                            <p className="break-words leading-snug">
                                <span className="font-semibold">Folio:</span> <span className="break-all">{folio}</span>
                            </p>
                            {mostrarCalificacionConstancia && calificacion && (
                                <div className="mt-1 flex items-center justify-between">
                                    <span className="font-semibold">Dominio demostrado:</span>
                                    <span className="text-red-600 font-bold border border-red-500 px-3 ml-2">{calificacion}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Signature Area */}
                <div className="flex flex-col items-center z-20 mt-auto">
                    <img
                        src="/firma.png"
                        alt="Firma Director"
                        className="h-[60px] object-contain mb-1"
                    />
                    <div className="border-t border-black w-[500px] pt-1.5 text-center">
                        <p className="text-[11px] font-sans text-black">
                            D. EN E. Irvin Rodolfo Tapia Bernabé
                        </p>
                        <p className="text-[12px] font-bold font-sans text-black">
                            Director Académico del IEDCH
                        </p>
                        <p className="text-[9px] font-sans text-black mt-0.5 leading-tight">
                            Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    )
}
