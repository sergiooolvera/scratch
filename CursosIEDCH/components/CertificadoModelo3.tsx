'use client'

import { QRCodeCanvas } from 'qrcode.react'

interface CertificadoModelo3Props {
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
    logoUrl?: string | null;
    mostrarLogoConstancia?: boolean;
}

export default function CertificadoModelo3({
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
    mostrarCalificacionConstancia = true,
    logoUrl = null,
    mostrarLogoConstancia = false
}: CertificadoModelo3Props) {
    return (
        <div
            id={id}
            ref={documentRef}
            className={`bg-white relative mx-auto overflow-hidden flex flex-col shrink-0 min-w-[1056px] ${className}`}
            style={{ width: '1056px', height: '816px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
        >
            {/* Elegant Double Borders */}
            <div className="absolute inset-[25px] border-4 border-[#0B1A3F] z-10 pointer-events-none"></div>
            <div className="absolute inset-[32px] border border-[#0B1A3F] z-10 pointer-events-none"></div>

            {/* Corner Decorative Ornaments (CSS Lines) */}
            <div className="absolute top-[35px] left-[35px] w-6 h-6 border-t-2 border-l-2 border-[#0B1A3F] z-15"></div>
            <div className="absolute top-[35px] right-[35px] w-6 h-6 border-t-2 border-r-2 border-[#0B1A3F] z-15"></div>
            <div className="absolute bottom-[35px] left-[35px] w-6 h-6 border-b-2 border-l-2 border-[#0B1A3F] z-15"></div>
            <div className="absolute bottom-[35px] right-[35px] w-6 h-6 border-b-2 border-r-2 border-[#0B1A3F] z-15"></div>

            {/* Center Watermark SVG Globe (Faint Vector Background) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-5 opacity-[0.04] text-[#0B1A3F]">
                <svg xmlns="http://www.w3.org/2000/svg" width="550" height="550" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5">
                    <circle cx="12" cy="12" r="10"></circle>
                    <ellipse cx="12" cy="12" rx="3.33" ry="10" />
                    <ellipse cx="12" cy="12" rx="6.66" ry="10" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="2.32" y1="9.5" x2="21.68" y2="9.5" />
                    <line x1="3.34" y1="7" x2="20.66" y2="7" />
                    <line x1="2.32" y1="14.5" x2="21.68" y2="14.5" />
                    <line x1="3.34" y1="17" x2="20.66" y2="17" />
                </svg>
            </div>

            {/* Header logos and emitter row */}
            <div className="relative z-30 flex justify-between items-center w-full px-20 pt-16">
                {/* Left: IEDCH Logo */}
                <div className="w-[140px] flex items-center justify-start">
                    <img src="/logo.jpg" alt="IEDCH Logo" className="h-[75px] object-contain rounded" />
                </div>
                
                {/* Center: Emitter Details */}
                <div className="flex-1 text-center px-4 max-w-[550px]">
                    <p className="text-[12px] font-sans font-bold leading-normal text-gray-800 uppercase tracking-widest">
                        El Instituto Educativo De Especialidades Para La Conducta y el Desarrollo Humano S.C<br/>
                        <span className="text-[10px] lowercase font-normal italic tracking-wide text-gray-600">a través del Ecosistema Global de Acreditación y Certificación.</span>
                    </p>
                </div>

                {/* Right: Custom Institution Logo or Placeholder */}
                <div className="w-[140px] flex items-center justify-center">
                    {mostrarLogoConstancia && logoUrl ? (
                        <div className="h-[75px] w-full bg-white flex items-center justify-center p-1.5 rounded border border-gray-200 shadow-sm">
                            <img src={logoUrl} alt="Logo Institución" className="max-h-full max-w-full object-contain" />
                        </div>
                    ) : (
                        // Placeholder block to maintain layout spacing
                        <div className="w-[75px] h-[75px]"></div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-30 flex flex-col items-center justify-start flex-1 px-20 mt-6">
                
                <p className="text-[14px] text-gray-600 tracking-wider font-sans uppercase">otorga la presente</p>
                
                {/* CONSTANCIA */}
                <h1 className="text-[#0B1A3F] text-[56px] font-normal tracking-[0.15em] mt-1 font-serif">
                    CONSTANCIA
                </h1>

                <p className="text-[13px] text-gray-600 tracking-wider font-sans uppercase mt-4">a:</p>

                {/* Name */}
                <h2 className="mt-1 text-[54px] text-[#0B1A3F] tracking-wide leading-none text-center truncate max-w-[850px] px-4 font-normal" style={{ fontFamily: "'Brush Script MT', 'Great Vibes', cursive, Georgia, serif" }}>
                    {alumnoNombre}
                </h2>
                
                {/* Underline */}
                <div className="w-[70%] border-b border-[#0B1A3F] opacity-35 mt-3"></div>

                {/* Course details */}
                <p className="mt-5 text-[15px] text-gray-700 tracking-wide font-sans">
                    Por haber acreditado la capacitación:
                </p>
                <h3 
                    className={`mt-1 font-serif font-bold text-black uppercase text-center max-w-[850px] tracking-wide leading-tight line-clamp-2 px-4 ${cursoTitulo.length > 45 ? 'text-[20px]' : 'text-[24px]'}`}
                    title={cursoTitulo}
                >
                    “{cursoTitulo}”
                </h3>

                {/* Details Grid */}
                <div className="flex justify-between items-start w-[80%] mt-8 text-[13.5px] font-sans text-gray-800">
                    <div className="flex flex-col text-left gap-1 flex-1 pr-6">
                        <p className="leading-snug">
                            <span className="font-semibold text-black">Valor curricular:</span> {cursoDuracion || '40 Horas'}
                        </p>
                        <p className="mt-0.5">{fechaAprobacion}</p>
                    </div>
                    
                    <div className="flex flex-col text-left w-[280px] shrink-0">
                        <p className="break-words leading-snug">
                            <span className="font-semibold text-black">Folio:</span> <span className="break-all font-mono">{folio}</span>
                        </p>
                        {mostrarCalificacionConstancia && calificacion && (
                            <div className="mt-0.5 flex items-center justify-between">
                                <span className="font-semibold text-black">Dominio demostrado:</span>
                                <span className="text-red-600 font-bold border border-red-500 px-3 ml-2">{calificacion}</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Signature Area */}
            <div className="absolute bottom-[55px] left-0 right-0 flex flex-col items-center w-full z-30">
                <div className="w-[480px] text-center">
                    <div className="h-[65px] mb-1">
                        <img src="/firma.png" alt="Firma Director" className="mx-auto h-full object-contain" />
                    </div>
                    <div className="border-t border-gray-400 w-full pt-1.5">
                        <p className="font-sans font-bold text-[#0B1A3F] text-[12px] tracking-wide leading-tight">
                            D. EN E. Irvin Rodolfo Tapia Bernabé
                        </p>
                        <p className="text-[11px] font-semibold text-gray-700 font-sans leading-tight mt-0.5">
                            Director Académico del IEDCH
                        </p>
                        <p className="text-[8.5px] mt-0.5 font-sans text-gray-500 leading-tight">
                            Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C.
                        </p>
                    </div>
                </div>
            </div>

            {/* QR Code and Validity (Bottom Right Overlay) */}
            <div className="absolute bottom-[40px] right-[40px] flex flex-col items-center z-30">
                <QRCodeCanvas 
                    value={qrUrl} 
                    size={90} 
                    level="L"
                    includeMargin={false}
                />
                <div className="mt-1.5 text-center w-[200px]">
                    <p className="text-[10px] font-bold text-gray-600 font-sans leading-tight">
                        Vigencia: {vigenciaStr}
                    </p>
                </div>
            </div>
        </div>
    )
}
