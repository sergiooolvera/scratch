'use client'

import { useEffect, useMemo, useState } from 'react'
import { Maximize2 } from 'lucide-react'

export default function ContentViewer({ url, titulo = 'Documento de Estudio', descargable = false }: { url: string, titulo?: string, descargable?: boolean }) {
    const lowerUrl = url.toLowerCase()
    const tituloLimpio = titulo.trim()

    // Categorías
    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(lowerUrl)
    const isPpt = /\.(ppt|pptx)$/i.test(lowerUrl)
    const isOfficeOrArchive = /\.(doc|docx|xls|xlsx|zip|rar)$/i.test(lowerUrl)

    const isHtml = /\.(html?|xhtml)(?:[?#].*)?$/i.test(lowerUrl)

    const [htmlDoc, setHtmlDoc] = useState<string | null>(null)
    const [htmlError, setHtmlError] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }
        checkMobile()
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    const htmlViewerHref = useMemo(() => {
        const encoded = encodeURIComponent(url)
        return `/html-viewer?url=${encoded}`
    }, [url])

    useEffect(() => {
        if (!isHtml) return

        let cancelled = false
        setHtmlDoc(null)
        setHtmlError(null)

        const computeBaseHref = (rawUrl: string) => {
            try {
                const u = new URL(rawUrl)
                const path = u.pathname
                const idx = path.lastIndexOf('/')
                const dir = idx >= 0 ? path.slice(0, idx + 1) : '/'
                return `${u.origin}${dir}`
            } catch {
                return rawUrl
            }
        }

        const injectBaseTag = (html: string, baseHref: string) => {
            const baseTag = `<base href="${baseHref}">`

            if (/<base\b/i.test(html)) return html
            if (/<head\b[^>]*>/i.test(html)) {
                return html.replace(/<head\b[^>]*>/i, (m) => `${m}${baseTag}`)
            }
            if (/<html\b[^>]*>/i.test(html)) {
                return html.replace(/<html\b[^>]*>/i, (m) => `${m}<head>${baseTag}</head>`)
            }
            return `<!doctype html><html><head>${baseTag}</head><body>${html}</body></html>`
        }

        ;(async () => {
            try {
                const res = await fetch(url, { cache: 'no-store' })
                const text = await res.text()
                if (!res.ok) {
                    throw new Error(`HTTP ${res.status}`)
                }

                const baseHref = computeBaseHref(url)
                const finalDoc = injectBaseTag(text, baseHref)

                if (cancelled) return
                setHtmlDoc(finalDoc)
            } catch {
                if (cancelled) return
                setHtmlError('No se pudo cargar el contenido HTML.')
            }
        })()

        return () => {
            cancelled = true
        }
    }, [isHtml, url])
    
    // Determine if it's a PDF (checking extension, or if it's a Supabase file that is NOT an image nor an office doc)
    const isPdf = lowerUrl.includes('.pdf') || (url.includes('/storage/v1/object/public/') && !isImage && !isOfficeOrArchive && !isHtml)

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

    const isBunny = url.includes('mediadelivery.net') || url.includes('bunnycdn.com')

    if (isPpt) {
        return (
            <div className="w-full h-[60vh] md:h-[80vh] min-h-[400px] md:min-h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg relative transition-all duration-300 flex flex-col">
                <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                    className="w-full flex-1 border-0"
                    title="Visualizador de Presentación PPT"
                    allowFullScreen
                />
                <div className="bg-slate-50 border-t border-gray-150 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <p className="text-gray-500 font-sans text-center sm:text-left">
                        Puedes visualizar esta presentación PPT en pantalla completa{descargable ? ' o descargarla para verla localmente.' : '.'}
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <a
                            href={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
                        >
                            Pantalla Completa
                        </a>
                        {descargable && (
                            <a
                                href={url}
                                download
                                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                            >
                                Descargar
                            </a>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (isImage) {
        return (
            <div className="w-full flex justify-center items-center p-4 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 shadow-inner min-h-[400px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Contenido del curso" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-sm" />
            </div>
        )
    }

    if (isPdf && !isOfficeOrArchive) {
        if (isMobile) {
            return (
                <div className="w-full p-8 border border-gray-200 rounded-xl bg-white shadow-lg flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="bg-red-50 p-4 rounded-full mb-4">
                        <svg className="w-16 h-16 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{tituloLimpio}</h3>
                    <p className="text-sm text-gray-500 mb-6 max-w-xs leading-relaxed">
                        Este tema contiene una guía interactiva en formato PDF. Haz clic abajo para visualizarla en pantalla completa de forma fluida.
                    </p>
                    <a
                        href={descargable ? url : `/pdf-viewer?url=${encodeURIComponent(url)}&titulo=${encodeURIComponent(tituloLimpio)}&descargable=false`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full max-w-xs inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition shadow-md hover:shadow-lg animate-bounce"
                    >
                        Ver Pantalla Completa
                    </a>
                </div>
            )
        }

        return (
            <div className="w-full h-[80vh] min-h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg flex flex-col">
                <iframe
                    src={descargable ? url : `${url}#toolbar=0`}
                    className="w-full flex-1 border-0"
                    title="Visualizador de PDF"
                />
                <div className="bg-slate-50 border-t border-gray-150 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <p className="text-gray-500 font-sans text-center sm:text-left">
                        ¿Tienes problemas para ver el documento? Puedes visualizarlo en pantalla completa de forma directa.
                    </p>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <a
                            href={descargable ? url : `/pdf-viewer?url=${encodeURIComponent(url)}&titulo=${encodeURIComponent(tituloLimpio)}&descargable=false`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-transparent font-bold rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition"
                        >
                            Ver Pantalla Completa
                        </a>
                        {descargable && (
                            <a
                                href={url}
                                download
                                className="flex-1 sm:flex-none inline-flex items-center justify-center px-4 py-2 border border-gray-300 font-bold rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition"
                            >
                                Descargar
                            </a>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    if (isHtml) {
        return (
            <div className="relative w-full h-[60vh] md:h-[80vh] min-h-[400px] md:min-h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-inner">
                <a
                    href={htmlViewerHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Abrir contenido HTML en nueva ventana"
                    className="absolute top-3 right-3 z-10 inline-flex items-center justify-center w-10 h-10 rounded-lg bg-white/90 hover:bg-white border border-gray-200 shadow-sm"
                    title="Abrir en nueva ventana"
                >
                    <Maximize2 className="w-5 h-5 text-gray-700" />
                </a>

                {htmlError ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
                        <p className="text-gray-600">{htmlError}</p>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                            Abrir archivo
                        </a>
                    </div>
                ) : (
                    <iframe
                        srcDoc={htmlDoc || '<!doctype html><html><head></head><body style="font-family: ui-sans-serif, system-ui; padding: 16px;">Cargando...</body></html>'}
                        title="Contenido HTML"
                        className="w-full h-full"
                        // Unique origin sandbox to prevent access to the portal context.
                        sandbox="allow-scripts allow-forms allow-popups allow-modals"
                    />
                )}
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

    if (isBunny) {
        return (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-lg border border-gray-200 bg-black">
                <iframe
                    src={url}
                    className="absolute top-0 left-0 w-full h-full border-0"
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
