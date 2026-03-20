import { QRCodeSVG } from 'qrcode.react'

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
            style={{ width: '1056px', height: '816px', boxSizing: 'border-box' }}
        >
            {/* Premium Gold/Navy Border */}
            <div className="absolute inset-4 border-[3px] border-[#1e3a8a] z-0 opacity-20"></div>
            <div className="absolute inset-5 border-[1px] border-[#1e3a8a] z-0 opacity-20"></div>
            <div className="absolute inset-8 border-[6px] border-double border-[#b49044] z-0 shadow-sm"></div>
            <div className="absolute inset-[34px] border-[1px] border-[#b49044] z-0 opacity-50"></div>

            {/* Subtle background pattern (watermark) */}
            <div className="absolute inset-0 opacity-[0.03] z-0" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e3a8a' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>

            {/* Content Container */}
            <div className="relative z-10 flex flex-col items-center justify-between h-full p-16 pt-16">

                {/* Header Section */}
                <div className="w-full relative flex justify-center items-start mt-2">
                    {/* Logotipos */}
                    <div className="absolute -top-4 left-6 w-28 h-28 object-contain flex items-center justify-center">
                        <img src="/logo-izquierdo.png" alt="" className="max-w-full max-h-full object-contain opacity-90" />
                        <div className="w-20 h-20 rounded-full border border-gray-100 flex items-center justify-center bg-gray-50/50 absolute -z-10 shadow-sm" style={{ mixBlendMode: 'multiply' }}></div>
                    </div>

                    <div className="text-center px-32 w-full mt-4">
                        <h2 className="text-xl font-serif font-bold text-[#1e3a8a] uppercase tracking-[0.10em] leading-relaxed mx-auto max-w-2xl">
                            El Instituto Educativo De Especialidades Para El Desarrollo Y La Conducta Humana S.C.
                        </h2>
                    </div>

                    <div className="absolute -top-4 right-6 w-28 h-28 object-contain flex items-center justify-center">
                        <img src="/logo-derecho.png" alt="" className="max-w-full max-h-full object-contain opacity-90" />
                    </div>
                </div>

                {/* Main Body */}
                <div className="text-center w-full mt-4 flex-grow flex flex-col justify-center">
                    <p className="text-[#64748b] tracking-[0.3em] uppercase text-sm font-semibold mb-4">Otorga la presente</p>

                    <div className="relative inline-block mx-auto mb-4">
                        <h1 className="text-6xl font-serif text-[#0f172a] uppercase tracking-[0.4em] pl-[0.4em] font-black" style={{ fontFamily: 'Georgia, serif', textShadow: '2px 2px 4px rgba(0,0,0,0.05)' }}>
                            Constancia
                        </h1>
                        <div className="h-[2px] w-48 bg-gradient-to-r from-transparent via-[#b49044] to-transparent mx-auto mt-6"></div>
                    </div>

                    <p className="mt-2 text-lg text-[#64748b] italic font-serif">a:</p>

                    <h2 className="mt-4 text-4xl font-serif text-[#1e3a8a] font-bold">
                        {alumnoNombre}
                    </h2>

                    <div className="mt-8 bg-[#fafaf9] px-12 py-6 rounded border border-[#b49044]/20 shadow-sm mx-auto max-w-3xl relative">
                        <p className="text-sm text-[#64748b] uppercase tracking-[0.2em] font-semibold">
                            Por haber acreditado el curso a distancia:
                        </p>

                        <h3 className="mt-4 text-3xl font-serif font-bold text-[#334155] leading-snug">
                            “{cursoTitulo}”
                        </h3>
                        
                        {cursoDuracion && (
                            <p className="mt-4 text-[#64748b] font-serif text-lg tracking-wide">
                                Con una duración acreditada de <span className="font-semibold text-[#334155]">{cursoDuracion}</span>.
                            </p>
                        )}
                        <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#b49044]"></div>
                        <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#b49044]"></div>
                    </div>

                    <p className="mt-8 text-[#64748b] font-serif text-lg">
                        Dada el <span className="font-semibold text-[#334155]">{fechaAprobacion}</span>
                    </p>
                </div>

                {/* Footer Section */}
                <div className="w-full flex justify-between items-end mt-auto px-12 pb-6">

                    {/* Signature Area */}
                    <div className="text-center w-80 relative">
                        <div className="border-t-[1px] border-gray-400 mb-3 w-64 mx-auto relative z-10"></div>
                        <p className="font-serif font-bold text-[#1e3a8a] uppercase text-sm tracking-widest relative z-10">Juan Manuel De La Luz Sierra</p>
                        <p className="text-xs text-[#64748b] uppercase tracking-wider mt-1 relative z-10">Director General del IEDCH</p>
                    </div>

                    {/* Folio Area */}
                    <div className="text-right pb-2 relative">
                        <div className="inline-block px-4 py-1 text-right">
                            <p className="text-[11px] font-mono font-bold text-gray-700 uppercase tracking-wider leading-snug bg-white/60 rounded px-1">
                                <span className="text-gray-500 font-sans text-[10px] mr-1">FOLIO:</span>
                                {folio.substring(0, 18)}
                                <br/>
                                <span className="text-[11px] font-sans font-bold text-gray-700 normal-case tracking-normal">
                                    Vigencia hasta: {vigenciaStr}
                                </span>
                            </p>
                        </div>
                        {/* QR Code Validation */}
                        <div className="absolute bottom-12 right-4">
                            <div className="p-2 bg-white rounded shadow-sm border border-gray-100 inline-block z-10">
                                <QRCodeSVG 
                                    value={qrUrl} 
                                    size={70} 
                                    level="L"
                                    includeMargin={false}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Gold Foil Accent bottom corner */}
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-[#b49044] to-transparent opacity-10 z-0"></div>
        </div>
    )
}
