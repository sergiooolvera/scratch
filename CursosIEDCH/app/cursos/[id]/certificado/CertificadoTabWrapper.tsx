'use client'

import { useState, useRef } from 'react'
import jsPDF from 'jspdf'
import { Download, BadgeCheck } from 'lucide-react'
import CertificadoDocument from '@/components/CertificadoDocument'
import MicrocredencialDocument from '@/components/MicrocredencialDocument'
import ResponsiveCertificateWrapper from '@/components/ResponsiveCertificateWrapper'

interface CertificadoTabWrapperProps {
    alumnoNombre: string;
    cursoTitulo: string;
    cursoDescripcion: string;
    cursoDuracion: string;
    fechaAprobacion: string;
    fechaAprobacionRaw: string;
    folio: string;
    vigenciaStr: string;
    vigAnos: number;
}

export default function CertificadoTabWrapper({
    alumnoNombre,
    cursoTitulo,
    cursoDescripcion,
    cursoDuracion,
    fechaAprobacion,
    fechaAprobacionRaw,
    folio,
    vigenciaStr,
    vigAnos
}: CertificadoTabWrapperProps) {
    const [activeTab, setActiveTab] = useState<'constancia' | 'microcredencial'>('constancia')
    const constanciaRef = useRef<HTMLDivElement>(null)
    const microcredencialRef = useRef<HTMLDivElement>(null)

    // Formato fecha abreviado para la microcredencial (DD/MM/YYYY)
    const dateObj = new Date(fechaAprobacionRaw)
    const vigDateObj = new Date(dateObj)
    vigDateObj.setFullYear(vigDateObj.getFullYear() + vigAnos)

    const pad = (n: number) => n.toString().padStart(2, '0')
    const fechaApAbrev = `${pad(dateObj.getDate())}/${pad(dateObj.getMonth() + 1)}/${dateObj.getFullYear()}`
    const fechaVigAbrev = `${pad(vigDateObj.getDate())}/${pad(vigDateObj.getMonth() + 1)}/${vigDateObj.getFullYear()}`

    const qrValue = `https://cursos-iedch.vercel.app/validar?folio=${folio}`

    const handleDownloadPDF = async () => {
        const element = constanciaRef.current;
        if (!element) return;
        try {
            const htmlToImage = await import('html-to-image');
            const dataUrl = await htmlToImage.toPng(element, { 
                quality: 1.0, 
                pixelRatio: 2,
                width: 1056,
                height: 816,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [element.offsetWidth, element.offsetHeight]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth, element.offsetHeight);
            pdf.save(`Constancia_${cursoTitulo.replace(/\s+/g, '_')}.pdf`);
        } catch (error: any) {
            console.error('Error generando PDF de la constancia:', error)
            alert('Hubo un error al generar el PDF de la constancia: ' + (error?.message || String(error)))
        }
    }

    const handleDownloadMicrocredencialPDF = async () => {
        const element = microcredencialRef.current;
        if (!element) return;
        try {
            const htmlToImage = await import('html-to-image');
            const dataUrl = await htmlToImage.toPng(element, { 
                quality: 1.0, 
                pixelRatio: 2,
                width: 816,
                height: 1056,
                style: {
                    transform: 'scale(1)',
                    transformOrigin: 'top left'
                }
            });

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [element.offsetWidth, element.offsetHeight]
            });

            pdf.addImage(dataUrl, 'PNG', 0, 0, element.offsetWidth, element.offsetHeight);
            pdf.save(`Microcredencial_${cursoTitulo.replace(/\s+/g, '_')}.pdf`);
        } catch (error: any) {
            console.error('Error generando PDF de la microcredencial:', error)
            alert('Hubo un error al generar el PDF de la microcredencial: ' + (error?.message || String(error)))
        }
    }


    return (
        <div className="w-full flex flex-col items-center">
            {/* Tabs Selector */}
            <div className="flex bg-slate-800/10 p-1.5 rounded-2xl mb-8 w-full max-w-sm border border-slate-200 z-10 relative">
                <button
                    onClick={() => setActiveTab('constancia')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                        activeTab === 'constancia' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                >
                    Constancia Oficial
                </button>
                <button
                    onClick={() => setActiveTab('microcredencial')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                        activeTab === 'microcredencial' 
                            ? 'bg-blue-600 text-white shadow-md' 
                            : 'text-slate-200 hover:text-white hover:bg-white/10'
                    }`}
                >
                    Microcredencial
                </button>
            </div>

            {/* Downloader Widget */}
            <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-center mb-8 gap-4 z-10 relative">
                <div className="flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                        <BadgeCheck className="h-7 w-7" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            {activeTab === 'constancia' ? 'Tu Constancia Digital' : 'Tu Microcredencial Digital'}
                        </h2>
                        <p className="text-sm text-slate-500 mt-0.5">
                            {activeTab === 'constancia' 
                                ? 'Constancia con valor curricular lista para imprimir o descargar en PDF.' 
                                : 'Acreditación en formato de bolsillo lista para recortar y doblar.'}
                        </p>
                    </div>
                </div>

                <button
                    onClick={activeTab === 'constancia' ? handleDownloadPDF : handleDownloadMicrocredencialPDF}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-bold rounded-full shadow-md text-white bg-blue-600 hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar PDF
                </button>
            </div>

            {activeTab === 'constancia' ? (
                <ResponsiveCertificateWrapper width={1056} height={816}>
                    <CertificadoDocument
                        documentRef={constanciaRef}
                        alumnoNombre={alumnoNombre}
                        cursoTitulo={cursoTitulo}
                        cursoDuracion={cursoDuracion}
                        fechaAprobacion={fechaAprobacion}
                        folio={folio}
                        vigenciaStr={vigenciaStr}
                        qrUrl={qrValue}
                        className="shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)]"
                    />
                </ResponsiveCertificateWrapper>
            ) : (
                <ResponsiveCertificateWrapper width={816} height={1056}>
                    <MicrocredencialDocument
                        documentRef={microcredencialRef}
                        alumnoNombre={alumnoNombre}
                        cursoTitulo={cursoTitulo}
                        cursoDescripcion={cursoDescripcion}
                        cursoDuracion={cursoDuracion}
                        fechaAprobacion={fechaApAbrev}
                        fechaVigencia={fechaVigAbrev}
                        folio={folio}
                        qrVerificacionUrl={qrValue}
                        className="shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200"
                    />
                </ResponsiveCertificateWrapper>
            )}

        </div>
    )
}
