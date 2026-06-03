'use client'

import { QRCodeCanvas } from 'qrcode.react'

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
    const defaultDesc = "Acreditación digital que certifica que el titular ha completado satisfactoriamente los módulos de aprendizaje y evaluaciones correspondientes a esta capacitación profesional.";
    const descripcionFinal = cursoDescripcion?.trim() || defaultDesc;

    return (
        <div
            ref={documentRef}
            className={`bg-[#f8fafc] relative mx-auto overflow-hidden flex flex-col justify-between shrink-0 min-w-[1056px] p-10 border border-slate-200 ${className}`}
            style={{ width: '1056px', height: '816px', boxSizing: 'border-box', fontFamily: 'Inter, system-ui, sans-serif' }}
        >
            {/* Background Decorative Accents */}
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header Sheet Info */}
            <div className="flex justify-between items-center border-b border-slate-200 pb-5 z-10">
                <div className="flex items-center space-x-3">
                    <img src="/logoegac.jpg" alt="EGAC" className="h-10 object-contain rounded" />
                    <div>
                        <h2 className="text-sm font-bold text-slate-800 tracking-wide">Ecosistema Global de Acreditación y Certificación</h2>
                        <p className="text-[10px] text-slate-500 font-medium">Documento de Acreditación Digital • Formato de Credencial de Bolsillo</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-3 py-1 rounded-full uppercase tracking-wider">
                        Microcredencial Oficial
                    </span>
                </div>
            </div>

            {/* Cards Area (Side by side) */}
            <div className="flex justify-center items-center gap-10 my-auto z-10">
                
                {/* ANVERSO (FRONT SIDE) */}
                <div className="w-[470px] h-[296px] bg-white border border-slate-350 rounded-2xl shadow-md p-5 flex flex-col justify-between relative overflow-hidden shrink-0">
                    {/* Top blue border line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#002060]" />
                    
                    {/* Card Header */}
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                            <h3 className="text-[15px] font-black text-slate-800 tracking-wider uppercase leading-none">
                                MICROCREDENCIAL
                            </h3>
                            <span className="text-[9px] font-black text-slate-400 tracking-[0.25em] uppercase mt-1 leading-none">
                                DE CAPACITACIÓN
                            </span>
                        </div>
                        <img src="/logoegac.jpg" alt="EGAC" className="h-7 object-contain rounded" />
                    </div>

                    {/* Card Body */}
                    <div className="grid grid-cols-12 gap-2 mt-3 items-stretch flex-grow">
                        {/* Left Details */}
                        <div className="col-span-8 flex flex-col justify-between pr-2">
                            <div>
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Otorgada a:
                                </span>
                                <h4 className="text-[13px] font-bold text-slate-900 leading-snug uppercase truncate mt-0.5" title={alumnoNombre}>
                                    {alumnoNombre}
                                </h4>
                            </div>

                            <div className="mt-2">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Por su participación en la capacitación:
                                </span>
                                <h5 className="text-[10px] font-bold text-slate-950 leading-snug line-clamp-2 mt-0.5">
                                    {cursoTitulo}
                                </h5>
                            </div>

                            <div className="mt-2">
                                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Descripción:
                                </span>
                                <p className="text-[7.5px] text-slate-600 leading-relaxed line-clamp-3 mt-0.5">
                                    {descripcionFinal}
                                </p>
                            </div>
                        </div>

                        {/* Right Details + QR */}
                        <div className="col-span-4 border-l border-slate-100 pl-3 flex flex-col justify-between items-center text-center">
                            <div className="w-full text-left">
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Folio:
                                </span>
                                <span className="text-[8px] font-mono font-bold text-slate-800 block truncate" title={folio}>
                                    {folio.substring(0, 13)}...
                                </span>
                            </div>

                            <div className="my-auto flex flex-col items-center">
                                <QRCodeCanvas
                                    value={qrVerificacionUrl}
                                    size={68}
                                    level="M"
                                    includeMargin={false}
                                />
                                <span className="text-[6.5px] font-bold text-slate-450 uppercase tracking-wider mt-1 block">
                                    QR de Verificación
                                </span>
                            </div>

                            <div className="w-full text-left">
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-wider block">
                                    Horas:
                                </span>
                                <span className="text-[8px] font-bold text-slate-800 block leading-tight">
                                    {cursoDuracion || '45 Horas'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card Footer */}
                    <div className="border-t border-slate-100 pt-2 flex justify-between items-center text-[7.5px] text-slate-500 font-semibold mt-1">
                        <span className="flex items-center">
                            🌐 www.grupoegac.com
                        </span>
                        <span>
                            Emisión: {fechaAprobacion}
                        </span>
                        <span>
                            Vigencia: {fechaVigencia}
                        </span>
                    </div>
                </div>

                {/* REVERSO (BACK SIDE) */}
                <div className="w-[470px] h-[296px] bg-white border border-slate-355 rounded-2xl shadow-md p-5 flex flex-col justify-between relative overflow-hidden shrink-0">
                    {/* Top dark border line */}
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-800" />
                    
                    {/* Legal text paragraphs */}
                    <div className="text-[7px] sm:text-[7.5px] leading-relaxed text-slate-650 space-y-1.5 pr-1">
                        <p>
                            La presente microcredencial constituye una acreditación digital verificable que reconoce los conocimientos, habilidades, competencias o resultados de aprendizaje alcanzados por su titular.
                        </p>
                        <p>
                            Emitida a través del Ecosistema Global de Acreditación y Certificación (EGAC), plataforma tecnológica desarrollada por el Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C., inscrito en el Registro Público bajo el número 14,525 (2020).
                        </p>
                        <p>
                            Esta acreditación forma parte de un sistema de reconocimiento de logros de aprendizaje con fines académicos, profesionales y laborales. Su emisión tiene carácter informativo y curricular, y constituye evidencia digital de las actividades de formación.
                        </p>
                        <p>
                            La autenticidad de este documento podrá verificarse mediante los mecanismos digitales establecidos por la entidad emisora. Su alteración, reproducción o uso indebido podrá afectar su validez y proceso de verificación.
                        </p>
                    </div>

                    {/* Footer Row */}
                    <div className="border-t border-slate-100 pt-2 flex justify-between items-end mt-2">
                        {/* Signature & Director Details */}
                        <div className="flex flex-col items-start w-[240px]">
                            {/* Firma */}
                            <div className="h-[28px] flex items-center pl-2">
                                <img
                                    src="/firma.png"
                                    alt="Firma Director General"
                                    className="h-[32px] object-contain opacity-90"
                                />
                            </div>
                            <div className="border-t border-slate-400 w-full pt-1 mt-0.5">
                                <p className="text-[7.5px] font-bold text-slate-900 uppercase tracking-wide leading-none">
                                    LIC. JUAN MANUEL DE LA LUZ SIERRA
                                </p>
                                <p className="text-[6.5px] text-slate-500 font-bold uppercase tracking-wider mt-0.5 leading-none">
                                    DIRECTOR GENERAL - GRUPO EGAC
                                </p>
                            </div>
                        </div>

                        {/* Back side QR code for EGAC page */}
                        <div className="flex flex-col items-center text-center">
                            <QRCodeCanvas
                                value="https://grupoegac.com"
                                size={55}
                                level="L"
                                includeMargin={false}
                            />
                            <span className="text-[6px] font-bold text-slate-450 uppercase tracking-wider mt-1 block">
                                grupoegac.com
                            </span>
                        </div>
                    </div>
                </div>

            </div>

            {/* Instruction Footer Sheet */}
            <div className="border-t border-dashed border-slate-300 pt-4 text-center z-10">
                <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                    ✂️ Instrucciones de armado: Recorta las tarjetas por el borde sólido gris y dóblalas por la línea punteada central.
                </p>
                <div className="flex justify-center space-x-12 mt-2 text-[9px] text-slate-400 font-medium">
                    <span>ID de Verificación: {folio}</span>
                    <span>•</span>
                    <span>EGAC Blockchain Cert</span>
                </div>
            </div>
        </div>
    )
}
