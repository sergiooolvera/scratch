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
            className={`bg-white relative mx-auto overflow-hidden flex flex-col shrink-0 min-w-[1056px] ${className}`}
            style={{ width: '1056px', height: '816px', boxSizing: 'border-box', fontFamily: 'Georgia, serif' }}
        >
            {/* Left Vertical Black Line */}
            <div className="absolute left-[100px] top-0 bottom-0 w-[4px] bg-black z-10"></div>

            {/* Top Navy Blue Header Bar (Image Banner) */}
            <div className="absolute top-[40px] left-0 right-0 z-0 bg-[#002060]">
                <img src="/encabezado-modelo3.png" alt="Encabezado IEDCH" className="w-full h-auto block" />
            </div>

            {/* Bottom Left Circles */}
            <div className="absolute bottom-[40px] left-[50px] z-20">
                <div className="w-[200px] h-[200px] bg-[#8a8a8a] rounded-full"></div>
                <div className="w-[120px] h-[120px] bg-[#002060] rounded-full absolute -bottom-[20px] -right-[20px]"></div>
            </div>

            {/* Main Content Area */}
            <div className="relative z-30 flex flex-col items-center justify-start h-full pt-[160px] pb-12 px-24">
                
                {/* Emitter Text */}
                <p className="text-center text-[17px] leading-snug text-black max-w-4xl tracking-wide">
                    El Instituto Educativo De Especialidades Para La Conducta y el Desarrollo Humano S.C<br/>
                    a través de su centro de capacitación y acreditación profesional emite la presente:
                </p>

                {/* CONSTANCIA */}
                <h1 className="mt-4 text-[60px] font-normal tracking-wide text-black">
                    CONSTANCIA
                </h1>

                <p className="mt-0 text-xl text-black font-semibold">a:</p>

                {/* Name */}
                <h2 className="mt-2 text-[52px] text-black tracking-wide leading-tight">
                    {alumnoNombre}
                </h2>

                {/* Course Details */}
                <p className="mt-6 text-[20px] text-black">
                    Por haber acreditado el Curso:
                </p>
                <h3 className="mt-2 text-[26px] font-bold text-black uppercase text-center max-w-4xl tracking-wide leading-tight">
                    “{cursoTitulo}”
                </h3>

                <p className="mt-6 text-[20px] font-bold text-red-600 font-sans tracking-wide">
                    Valor curricular: {cursoDuracion || '40 horas'}
                </p>

                <p className="mt-1 text-[20px] font-bold text-black font-sans tracking-wide">
                    {fechaAprobacion}
                </p>

            </div>

            {/* Signature Area (Absolute to guarantee space) */}
            <div className="absolute bottom-[50px] left-0 right-0 flex flex-col items-center w-full z-30">
                <div className="w-[360px] border-t-2 border-black pt-2 text-center">
                    <p className="font-serif font-bold text-black uppercase text-sm tracking-widest leading-loose">
                        Ramón Mendez Lopez
                    </p>
                    <p className="text-[14px] font-sans text-black font-semibold">
                        Director académico del IEDCH
                    </p>
                    <p className="text-[12px] italic mt-0.5 font-serif text-black leading-tight">
                        Instituto Educativo de Especialidades para la Conducta y el<br/>Desarrollo Humano S.C
                    </p>
                </div>
            </div>

            {/* QR Code and Folio (Bottom Right Absolute) */}
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
                    <p className="text-[11px] font-bold text-black font-sans mt-1 leading-tight w-full">
                        Vigencia hasta: {vigenciaStr}
                    </p>
                </div>
            </div>
        </div>
    )
}
