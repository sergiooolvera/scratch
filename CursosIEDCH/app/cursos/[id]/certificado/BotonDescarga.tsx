'use client'

import { Download } from 'lucide-react'

export default function BotonDescarga() {
    const handleDownload = async () => {
        const [htmlToImage, jsPDF] = await Promise.all([
            import('html-to-image'),
            import('jspdf').then(mod => mod.jsPDF)
        ]);

        const element = document.getElementById('certificado-content');
        if (!element) return;

        try {
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
            pdf.save('Constancia_IEDCH.pdf');
        } catch (error: any) {
            console.error('Error generando PDF:', error);
            alert('Hubo un error al generar el PDF: ' + (error?.message || String(error)));
        }
    }

    return (
        <button
            onClick={handleDownload}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-bold rounded-lg shadow-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform transform hover:scale-105"
        >
            <Download className="mr-2 h-5 w-5" />
            Obtener Constancia
        </button>
    )
}
