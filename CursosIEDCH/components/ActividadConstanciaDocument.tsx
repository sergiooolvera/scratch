'use client'

import { QRCodeCanvas } from 'qrcode.react'

interface ActividadConstanciaDocumentProps {
    alumnoNombre: string;
    actividadNombre: string;
    actividadTipo: string;
    duracion: string;
    fechaAprobacion: string;
    facilitador: string;
    ubicacion: string;
    folio: string;
    qrUrl: string;
    id?: string;
    documentRef?: React.Ref<HTMLDivElement>;
    className?: string;
}

export default function ActividadConstanciaDocument({
    alumnoNombre,
    actividadNombre,
    actividadTipo,
    duracion,
    fechaAprobacion,
    facilitador,
    ubicacion,
    folio,
    qrUrl,
    id,
    documentRef,
    className = ""
}: ActividadConstanciaDocumentProps) {
    return (
        <div
            id={id}
            ref={documentRef}
            className={`bg-white relative mx-auto overflow-hidden flex flex-col shrink-0 min-w-[1056px] ${className}`}
            style={{ width: '1056px', height: '816px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
        >
            {/* Left Vertical Black Line - de arriba a abajo del certificado */}
            <div className="absolute left-[100px] top-0 bottom-0 w-[4px] bg-black z-[5]"></div>

            {/* Top Navy Blue Header Bar */}
            <div className="absolute z-[15] bg-[#002060]" style={{ top: '35px', left: '-2px', right: '-2px' }}>
                {/* Asumiendo que pueden usar el mismo encabezado o uno similar */}
                <img src="/encabezado-modelo3.png" alt="Encabezado IEDCH" className="w-full h-auto block" />
            </div>

            {/* Bottom Left Circles */}
            <div className="absolute bottom-[40px] left-[50px] z-20">
                <div className="w-[200px] h-[200px] bg-[#8a8a8a] rounded-full"></div>
                <div className="w-[120px] h-[120px] bg-[#002060] rounded-full absolute -bottom-[20px] -right-[20px]"></div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-30 flex flex-col items-center justify-start h-full pt-[160px] pb-4 px-24">
                
                {/* Emitter Text */}
                <p className="text-center text-[17px] leading-snug text-black max-w-4xl tracking-wide uppercase font-bold">
                    El INSTITUTO EDUCATIVO DE ESPECIALIDADES PARA LA CAPACITACION NACIONAL<br/>
                    <span className="font-normal normal-case">a través de su centro de capacitación y acreditación profesional emite la presente:</span>
                </p>

                {/* CONSTANCIA */}
                <h1 className="mt-4 text-[60px] font-normal tracking-wide text-black">
                    CONSTANCIA
                </h1>

                <p className="mt-0 text-xl text-black font-semibold">a:</p>

                {/* Name */}
                <h2 className="mt-2 text-[52px] text-black tracking-wide leading-tight text-center truncate w-full px-4">
                    {alumnoNombre}
                </h2>

                {/* Course Details */}
                <p className="mt-6 text-[20px] text-black">
                    Por haber acreditado el/la {actividadTipo}:
                </p>
                <h3 
                    className={`mt-2 font-bold text-black uppercase text-center max-w-[900px] tracking-wide leading-tight line-clamp-2 px-4 ${actividadNombre.length > 45 ? 'text-[22px]' : 'text-[28px]'}`}
                    title={actividadNombre}
                >
                    “{actividadNombre}”
                </h3>

                <p className="mt-4 text-[20px] font-bold text-red-600 font-sans tracking-wide">
                    Duración: {duracion}
                </p>
                <p className="mt-1 text-[18px] text-black font-sans tracking-wide font-medium">
                    Facilitador: <span className="font-bold">{facilitador}</span>
                </p>

                <p className="mt-2 text-[18px] font-bold text-black font-sans tracking-wide">
                    {ubicacion ? `${ubicacion}, ` : ''}{fechaAprobacion}
                </p>

            </div>

            {/* Signature Area */}
            <div className="absolute bottom-[50px] left-0 right-0 flex flex-col items-center w-full z-30">
                <div className="w-[480px] text-center">
                    {/* Firma del director */}
                    <div className="h-[80px] mb-1">
                        {/* Espacio para la firma, se podría agregar imagen real si existe */}
                        <img src="/firma.png" alt="Firma Director" className="mx-auto h-full object-contain opacity-80" />
                    </div>
                    <div className="border-t-2 border-black pt-2">
                        <p className="font-serif font-bold text-black uppercase text-[12px] tracking-widest leading-loose whitespace-nowrap">
                            L.C.P Sergio de Jesus Olvera Narcía
                        </p>
                        <p className="text-[14px] font-sans text-black font-semibold">
                            Director General
                        </p>
                        <p className="text-[12px] italic mt-0.5 font-serif text-black leading-tight">
                            Instituto Educativo de Especialidades para la Capacitación Nacional
                        </p>
                    </div>
                </div>
            </div>

            {/* QR Code and Folio */}
            <div className="absolute bottom-[40px] right-[40px] flex flex-col items-center z-30">
                <QRCodeCanvas 
                    value={qrUrl} 
                    size={110} 
                    level="L"
                    includeMargin={false}
                />
                <div className="mt-2 text-center w-[220px]">
                    <p className="text-[12px] font-bold text-red-600 font-sans uppercase tracking-widest break-all">
                        FOLIO: {folio.substring(0, 18)}
                    </p>
                </div>
            </div>
        </div>
    )
}
