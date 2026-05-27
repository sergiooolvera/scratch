'use client'

import { useSearchParams, useRouter } from 'next/navigation'
import { ArrowLeft, Lock } from 'lucide-react'
import { useEffect, Suspense } from 'react'

function PDFViewerContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const url = searchParams.get('url') || ''
    const titulo = searchParams.get('titulo') || 'Documento de Estudio'
    const descargable = searchParams.get('descargable') === 'true'

    useEffect(() => {
        if (!descargable) {
            // Block right click
            const handleContextMenu = (e: MouseEvent) => e.preventDefault()
            document.addEventListener('contextmenu', handleContextMenu)

            // Block common print shortcuts (Ctrl+P, Cmd+P) and save shortcuts (Ctrl+S, Cmd+S)
            const handleKeyDown = (e: KeyboardEvent) => {
                if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P' || e.key === 's' || e.key === 'S')) {
                    e.preventDefault()
                    alert('La descarga e impresión de este material está deshabilitada por motivos de propiedad intelectual.')
                }
            }
            document.addEventListener('keydown', handleKeyDown)

            return () => {
                document.removeEventListener('contextmenu', handleContextMenu)
                document.removeEventListener('keydown', handleKeyDown)
            }
        }
    }, [descargable])

    if (!url) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6">
                <p className="text-gray-400">No se especificó ningún enlace de PDF válido.</p>
                <button onClick={() => router.back()} className="mt-4 bg-gray-800 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition">Volver</button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen w-screen bg-gray-950 text-white select-none">
            {/* Header bar */}
            <div className="flex items-center justify-between px-6 py-4 bg-gray-900 border-b border-gray-800">
                <button 
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span>Volver al curso</span>
                </button>
                <h1 className="text-base font-bold truncate max-w-lg">{titulo}</h1>
                <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 bg-gray-950 px-3 py-1.5 rounded-full border border-gray-800">
                    <Lock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Visualización Protegida</span>
                </div>
            </div>

            {/* Custom Print Blocking CSS */}
            {!descargable && (
                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        body { display: none !important; }
                    }
                    iframe {
                        user-select: none;
                        -webkit-user-select: none;
                    }
                `}} />
            )}

            {/* Main iframe container */}
            <div className="flex-1 w-full relative bg-gray-900">
                {/* Overlay to block right click inside the frame area */}
                {!descargable && (
                    <div 
                        className="absolute inset-0 bg-transparent pointer-events-none z-10"
                        onContextMenu={(e) => e.preventDefault()}
                    />
                )}
                <iframe
                    src={descargable ? url : `${url}#toolbar=0`}
                    className="w-full h-full border-0"
                    title="Visor PDF Protegido"
                />
            </div>
        </div>
    )
}

export default function PDFViewerPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center min-h-screen bg-gray-950 text-white">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
            </div>
        }>
            <PDFViewerContent />
        </Suspense>
    )
}
