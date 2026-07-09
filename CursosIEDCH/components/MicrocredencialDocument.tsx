'use client'

import { QRCodeSVG } from 'qrcode.react'

interface MicrocredencialDocumentProps {
    alumnoNombre: string;
    cursoTitulo: string;
    cursoDescripcion: string;
    cursoDuracion?: string | null;
    fechaAprobacion: string;
    fechaVigencia: string;
    folio: string;
    qrVerificacionUrl: string;
    documentRef?: React.Ref<HTMLDivElement>;
    className?: string;
}

export default function MicrocredencialDocument({
    alumnoNombre,
    cursoTitulo,
    cursoDescripcion,
    cursoDuracion,
    fechaAprobacion,
    fechaVigencia,
    folio,
    qrVerificacionUrl,
    documentRef,
    className = ""
}: MicrocredencialDocumentProps) {
    const defaultDesc = "Capacitación enfocada en el desarrollo de competencias específicas y habilidades aplicables de forma práctica en el ámbito profesional, evaluada conforme a los criterios académicos establecidos.";
    const descripcionFinal = cursoDescripcion?.trim() || defaultDesc;

    return (
        <div
            ref={documentRef}
            className={`bg-white relative mx-auto overflow-hidden flex flex-col justify-between shrink-0 p-8 border-[3px] border-black ${className}`}
            style={{ width: '816px', height: '1056px', boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
            {/* Double Border Design (Inner Line) */}
            <div className="absolute inset-2 border border-black pointer-events-none z-[5]" />

            <div className="relative z-10 w-full h-full flex flex-col justify-between p-6">
                
                {/* 1. ANVERSO DE LA MICROCREDENCIAL (FRENTE) - RENDERED AS A PREMIUM CARD CONTAINER */}
                <div className="flex justify-center mt-4">
                    <div 
                        className="bg-white border border-slate-300 rounded-xl shadow-[0_4px_20px_rgba(0,0,0,0.08)] p-4 flex flex-col justify-between relative overflow-hidden"
                        style={{ width: '560px', height: '354px', boxSizing: 'border-box' }}
                    >
                        {/* Top blue accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#002060]" />

                        {/* Card Header */}
                        <div className="flex justify-between items-start mt-1">
                            <div className="flex flex-col">
                                <h3 className="text-[17px] font-black text-slate-800 tracking-wider uppercase leading-none">
                                    MICROCREDENCIAL
                                </h3>
                                <span className="text-[8px] font-black text-slate-400 tracking-[0.25em] uppercase mt-1 leading-none">
                                    DE CAPACITACIÓN
                                </span>
                            </div>
                            <img src="/logoegac.jpg" alt="EGAC" className="h-8 object-contain rounded" />
                        </div>

                        {/* Card Body Grid */}
                        <div className="grid grid-cols-12 gap-3 mt-4 items-stretch flex-grow">
                            {/* Left Area (Details) */}
                            <div className="col-span-8 flex flex-col justify-start pr-2 border-r border-slate-100 space-y-2.5">
                                <div>
                                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Otorgada a:
                                    </span>
                                    <h4 className="text-[14.5px] font-black text-slate-900 leading-tight uppercase truncate mt-0.5" title={alumnoNombre}>
                                        {alumnoNombre}
                                    </h4>
                                </div>

                                <div>
                                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Por su participación en la capacitación:
                                    </span>
                                    <h5 className="text-[11.5px] font-bold text-slate-950 leading-snug line-clamp-2 mt-0.5">
                                        {cursoTitulo}
                                    </h5>
                                </div>

                                <div>
                                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Descripción de la capacitación:
                                    </span>
                                    <p className="text-[7.8px] text-slate-650 leading-relaxed line-clamp-6 mt-0.5 text-justify">
                                        {descripcionFinal}
                                    </p>
                                </div>
                            </div>


                            {/* Right Area (Folio, QR, Dates) */}
                            <div className="col-span-4 pl-1.5 flex flex-col justify-between items-center text-center">
                                <div className="w-full text-left">
                                    <span className="text-[7.5px] font-bold text-slate-400 uppercase tracking-wider block">
                                        Folio:
                                    </span>
                                    <span className="text-[8.5px] font-mono font-bold text-slate-805 block truncate" title={folio}>
                                        {folio.substring(0, 18)}
                                    </span>
                                </div>

                                <div className="my-auto flex flex-col items-center">
                                    <QRCodeSVG
                                        value={qrVerificacionUrl}
                                        size={78}
                                        level="M"
                                        includeMargin={false}
                                    />
                                    <span className="text-[7px] font-bold text-slate-450 uppercase tracking-wider mt-1.5 block">
                                        Verifica esta credencial<br/>escaneando el código QR
                                    </span>
                                </div>

                                <div className="w-full text-left">
                                    <div className="flex justify-between text-[7.5px] text-slate-400 font-bold uppercase tracking-wider">
                                        <span>Horas:</span>
                                        <span>Vigencia:</span>
                                    </div>
                                    <div className="flex justify-between text-[9px] font-bold text-slate-850 leading-none mt-0.5">
                                        <span>{cursoDuracion || '45 horas'}</span>
                                        <span>{fechaVigencia}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[8.5px] text-slate-500 font-semibold mt-2">
                            <span className="flex items-center">
                                🌐 www.grupoegac.com
                            </span>
                            <span>
                                Prestigio verificable.
                            </span>
                            <div className="flex items-center space-x-1 font-bold text-slate-700">
                                <span>GRUPO</span>
                                <span className="text-blue-900">EGAC</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. RED FOLIO HEADER */}
                <div className="text-center mt-6">
                    <p className="text-red-600 font-bold text-sm tracking-wider uppercase font-mono">
                        FOLIO: {folio}
                    </p>
                </div>

                {/* 3. REVERSO LEGAL PARAGRAPHS (RENDERED DIRECTLY ON SHEET BODY) */}
                <div className="px-10 text-[11px] leading-relaxed text-slate-700 space-y-4 text-justify mt-4">
                    <p>
                        La presente microcredencial constituye una acreditación digital verificable que reconoce los conocimientos, habilidades, competencias o resultados de aprendizaje alcanzados por su titular.
                    </p>
                    <p>
                        Emitida a través del Ecosistema Global de Acreditación y Certificación (EGAC), plataforma tecnológica desarrollada por el Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C., inscrito en el Registro Público bajo el número 14,525 (2020).
                    </p>
                    <p>
                        Esta acreditación forma parte de un sistema de reconocimiento de logros de aprendizaje con fines académicos, profesionales y laborales. Su emisión tiene carácter informativo y curricular, y constituye evidencia digital de las actividades de formación, capacitación, actualización o evaluación realizadas por su titular.
                    </p>
                    <p>
                        La autenticidad de este documento podrá verificarse mediante los mecanismos digitales establecidos por la entidad emisora. Su alteración, reproducción o uso indebido podrá afectar su validez y proceso de verificación.
                    </p>
                </div>

                {/* 4. SIGNATURE AND WEBSITE QR SECTION */}
                <div className="flex justify-between items-end px-10 mt-8">
                    {/* Left Column: Website QR code */}
                    <div className="flex items-center space-x-4">
                        <QRCodeSVG
                            value="https://grupoegac.com"
                            size={76}
                            level="L"
                            includeMargin={false}
                        />
                        <div className="flex flex-col text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            <span>Portal corporativo</span>
                            <span className="text-blue-900 mt-0.5">grupoegac.com</span>
                        </div>
                    </div>

                    {/* Right Column: Signature Block */}
                    <div className="flex flex-col items-center w-[300px] text-center">
                        {/* Signature Image */}
                        <div className="h-[42px] flex items-center justify-center">
                            <img
                                src="/firma.png"
                                alt="Firma Director General"
                                className="h-[52px] object-contain opacity-95 -translate-y-3"
                            />
                        </div>
                        <div className="border-t border-black w-full pt-1.5 mt-1">
                            <p className="text-[10px] font-bold text-slate-900 uppercase tracking-widest leading-none">
                                DIRECTOR GENERAL
                            </p>
                            <p className="text-[10.5px] font-bold text-slate-900 uppercase tracking-wide mt-1.5 leading-none">
                                LIC. JUAN MANUEL DE LA LUZ SIERRA
                            </p>
                        </div>
                    </div>
                </div>

                {/* 5. BOTTOM SLOGAN */}
                <div className="text-center mt-6 mb-2">
                    <p className="text-[11px] text-slate-400 italic font-medium font-serif tracking-wider">
                        Perseverar. Resistir. Trascender
                    </p>
                </div>

            </div>
        </div>
    )
}
