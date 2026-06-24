'use client'

import { QRCodeCanvas } from 'qrcode.react'

interface CertificadoModelo2Props {
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

export default function CertificadoModelo2({
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
}: CertificadoModelo2Props) {
    return (
        <div
            id={id}
            ref={documentRef}
            className={`bg-white relative mx-auto overflow-hidden flex flex-col shrink-0 min-w-[1056px] ${className}`}
            style={{ width: '1056px', height: '816px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
        >
            {/* Left Vertical Black Line */}
            <div className="absolute left-[100px] top-0 bottom-0 w-[4px] bg-black z-[5]"></div>

            {/* Top Navy Blue Header Bar */}
            <div className="absolute z-[15] bg-[#002060] flex items-center justify-between px-12" style={{ top: '35px', left: '-2px', right: '-2px', height: '77px' }}>
                <div className="flex items-center gap-5">
                    <img src="/logoconstancia.png" alt="Logo Constancia" className="h-[52px] object-contain rounded" />
                    <p className="text-[16px] font-bold leading-tight uppercase tracking-wider text-white font-sans">
                        Ecosistema Global de Acreditación y Certificación
                    </p>
                </div>
                {mostrarLogoConstancia && logoUrl && (
                    <div className="h-[52px] w-[120px] bg-white flex items-center justify-center p-1 rounded shadow-sm">
                        <img src={logoUrl} alt="Logo Institución" className="max-w-full max-h-full object-contain" />
                    </div>
                )}
            </div>

            {/* Bottom Left Circles */}
            <div className="absolute bottom-[40px] left-[50px] z-20">
                <div className="w-[200px] h-[200px] bg-[#8a8a8a] rounded-full"></div>
                <div className="w-[120px] h-[120px] bg-[#002060] rounded-full absolute -bottom-[20px] -right-[20px]"></div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-30 flex flex-col items-center justify-start h-full pt-[160px] pb-4 px-24">
                
                {/* Emitter Text */}
                <p className="text-center text-[15px] leading-snug text-black max-w-4xl tracking-wide uppercase font-bold">
                    El Instituto Educativo De Especialidades Para La Conducta y el Desarrollo Humano S.C<br/>
                    <span className="font-normal normal-case text-[14px]">a través del Ecosistema Global de Acreditación y Certificación.</span>
                </p>

                <p className="mt-2 text-[14px] text-black font-sans tracking-wide">Otorga la siguiente</p>

                {/* CONSTANCIA */}
                <h1 className="mt-2 text-[56px] font-normal tracking-wide text-black">
                    CONSTANCIA
                </h1>

                <p className="mt-0 text-lg text-black font-semibold">a:</p>

                {/* Name */}
                <h2 className="mt-1 text-[48px] text-black tracking-wide leading-tight text-center truncate w-full px-4" style={{ fontFamily: "'Brush Script MT', 'Great Vibes', cursive, Georgia, serif" }}>
                    {alumnoNombre}
                </h2>

                {/* Course Details */}
                <p className="mt-4 text-[17px] text-black">
                    Por haber acreditado la capacitación:
                </p>
                <h3 
                    className={`mt-1 font-bold text-black uppercase text-center max-w-[900px] tracking-wide leading-tight line-clamp-2 px-4 ${cursoTitulo.length > 45 ? 'text-[20px]' : 'text-[24px]'}`}
                    title={cursoTitulo}
                >
                    “{cursoTitulo}”
                </h3>

                {/* Info details grid */}
                <div className="flex justify-between items-start w-[80%] mt-8 text-[14px] font-sans text-black">
                    {/* Left Column */}
                    <div className="flex flex-col text-left gap-1 flex-1 pr-6">
                        <p className="leading-snug">
                            <span className="font-semibold">Valor curricular:</span> {cursoDuracion || '40 Horas'}
                        </p>
                        <p className="mt-0.5">{fechaAprobacion}</p>
                    </div>
                    
                    {/* Right Column */}
                    <div className="flex flex-col text-left w-[280px] shrink-0">
                        <p className="break-words leading-snug">
                            <span className="font-semibold">Folio:</span> <span className="break-all">{folio}</span>
                        </p>
                        {mostrarCalificacionConstancia && calificacion && (
                            <div className="mt-0.5 flex items-center justify-between">
                                <span className="font-semibold">Dominio demostrado:</span>
                                <span className="text-red-600 font-bold border border-red-500 px-3 ml-2">{calificacion}</span>
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Signature Area */}
            <div className="absolute bottom-[55px] left-0 right-0 flex flex-col items-center w-full z-30">
                <div className="w-[480px] text-center">
                    {/* Firma del director */}
                    <div className="h-[70px] mb-1">
                        <img src="/firma.png" alt="Firma Director" className="mx-auto h-full object-contain" />
                    </div>
                    <div className="border-t border-black pt-1.5">
                        <p className="font-sans font-bold text-black text-[12px] tracking-wider leading-tight">
                            Lic. Juan Manuel De la luz Sierra
                        </p>
                        <p className="text-[12px] font-semibold text-black font-sans leading-tight mt-0.5">
                            Director General
                        </p>
                        <p className="text-[9px] mt-0.5 font-sans text-black leading-tight">
                            Instituto Educativo de Especialdiades para la Conducta y el Desarrollo Humano S.C.
                        </p>
                    </div>
                </div>
            </div>

            {/* QR Code and Folio */}
            <div className="absolute bottom-[40px] right-[40px] flex flex-col items-center z-30">
                <QRCodeCanvas 
                    value={qrUrl} 
                    size={100} 
                    level="L"
                    includeMargin={false}
                />
                <div className="mt-2 text-center w-[220px]">
                    <p className="text-[11px] font-bold text-black font-sans leading-tight">
                        Vigencia: {vigenciaStr}
                    </p>
                </div>
            </div>
        </div>
    )
}
