'use client'

export default function ContentViewer({ url }: { url: string }) {
    // Determine if it's a PDF (checking extension or if it comes from supabase storage)
    const isPdf = url.toLowerCase().includes('.pdf') || url.includes('/storage/v1/object/public/')

    // Check if YouTube
    const isYouTube = url.includes('youtube.com') || url.includes('youtu.be')
    let youtubeId = ''
    if (isYouTube) {
        try {
            if (url.includes('youtube.com/watch?v=')) {
                youtubeId = new URL(url).searchParams.get('v') || ''
            } else if (url.includes('youtu.be/')) {
                youtubeId = url.split('youtu.be/')[1].split('?')[0]
            }
        } catch (e) { /* ignore parse error */ }
    }

    // Check if Vimeo
    const isVimeo = url.includes('vimeo.com')
    let vimeoId = ''
    if (isVimeo) {
        try {
            vimeoId = url.split('vimeo.com/')[1].split('?')[0]
        } catch (e) { /* ignore parse error */ }
    }

    if (isPdf) {
        return (
            <div className="w-full h-[80vh] min-h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
                <object
                    data={url}
                    type="application/pdf"
                    className="w-full h-full"
                >
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                        <p className="text-gray-600">Tu navegador no soporta la visualización de PDFs integrados.</p>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Descargar o Ver PDF
                        </a>
                    </div>
                </object>
            </div>
        )
    }

    if (isYouTube && youtubeId) {
        return (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-black">
                <iframe
                    src={`https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`}
                    title="YouTube video player"
                    className="absolute top-0 left-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        )
    }

    if (isVimeo && vimeoId) {
        return (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-black">
                <iframe
                    src={`https://player.vimeo.com/video/${vimeoId}?title=0&byline=0&portrait=0`}
                    className="absolute top-0 left-0 w-full h-full"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowFullScreen
                ></iframe>
            </div>
        )
    }

    // Fallback block for unsupported URLs
    return (
        <div className="text-center p-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-700 font-medium mb-4">El enlace del contenido no es un formato soportado para visualizar en línea o es un enlace externo.</p>
            <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
            >
                Abrir Enlace Externo
            </a>
        </div>
    )
}
