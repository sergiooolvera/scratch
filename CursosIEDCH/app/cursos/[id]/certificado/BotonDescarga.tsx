'use client'

import { useState } from 'react'
import { Download, Mail, Loader2 } from 'lucide-react'

interface BotonDescargaProps {
    userEmail: string;
    cursoTitulo: string;
    cursoId: string;
    folio: string;
}

export default function BotonDescarga({ userEmail, cursoTitulo, cursoId, folio }: BotonDescargaProps) {
    const [sending, setSending] = useState(false)

    const generatePdf = async () => {
        const [htmlToImage, jsPDF] = await Promise.all([
            import('html-to-image'),
            import('jspdf').then(mod => mod.jsPDF)
        ]);

        const element = document.getElementById('certificado-content');
        if (!element) throw new Error('Contenedor de constancia no encontrado');

        const dataUrl = await htmlToImage.toJpeg(element, { 
            quality: 0.85, 
            pixelRatio: 1.5,
            width: 1056,
            height: 816,
            style: { transform: 'scale(1)', transformOrigin: 'top left' }
        });

        const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [element.offsetWidth, element.offsetHeight] });
        pdf.addImage(dataUrl, 'JPEG', 0, 0, element.offsetWidth, element.offsetHeight);
        return pdf;
    }

    const handleDownload = async () => {
        try {
            const pdf = await generatePdf();
            pdf.save('Constancia_IEDCH.pdf');
        } catch (error: any) {
            console.error('Error generando PDF:', error);
            alert('Hubo un error al generar el PDF: ' + (error?.message || String(error)));
        }
    }

    const handleSendEmail = async () => {
        if (!userEmail) {
            alert("No se encontró tu correo electrónico.");
            return;
        }

        try {
            setSending(true);
            const pdf = await generatePdf();
            const pdfBase64 = pdf.output('datauristring');

            const res = await fetch('/api/send-certificate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, cursoTitulo, cursoId, folio, pdfData: pdfBase64 })
            });

            const data = await res.json();
            if (res.ok && data.success) {
                alert("Constancia enviada");
            } else {
                const detailedError = data.details ? `${data.error} (${data.details})` : data.error;
                throw new Error(detailedError || "No se pudo enviar");
            }
        } catch (error: any) {
            console.error('Error enviando email:', error);
            alert('Hubo un error al enviar el correo: ' + (error?.message || String(error)));
        } finally {
            setSending(false);
        }
    }

    return (
        <div className="flex gap-4">
            <button
                onClick={handleDownload}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-lg shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
            >
                <Download className="mr-2 h-5 w-5" />
                Descargar Constancia
            </button>

            <button
                onClick={handleSendEmail}
                disabled={sending}
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-bold rounded-lg shadow-lg bg-white hover:bg-gray-50 text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-transform transform hover:scale-105"
            >
                {sending ? <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" /> : <Mail className="mr-2 h-5 w-5 text-blue-600" />}
                {sending ? 'Enviando...' : 'Enviar a correo'}
            </button>
        </div>
    )
}
