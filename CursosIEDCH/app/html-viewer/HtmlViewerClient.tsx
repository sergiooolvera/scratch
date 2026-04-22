'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ExternalLink, X } from 'lucide-react'

export default function HtmlViewerClient({ url }: { url: string }) {
    const [doc, setDoc] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    const baseHref = useMemo(() => {
        try {
            const u = new URL(url)
            const path = u.pathname
            const idx = path.lastIndexOf('/')
            const dir = idx >= 0 ? path.slice(0, idx + 1) : '/'
            return `${u.origin}${dir}`
        } catch {
            return url
        }
    }, [url])

    useEffect(() => {
        if (!url) return

        let cancelled = false
        setDoc(null)
        setError(null)

        const injectBaseTag = (html: string, base: string) => {
            const baseTag = `<base href="${base}">`
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
                if (!res.ok) throw new Error(`HTTP ${res.status}`)
                const finalDoc = injectBaseTag(text, baseHref)
                if (cancelled) return
                setDoc(finalDoc)
            } catch {
                if (cancelled) return
                setError('No se pudo cargar el contenido HTML.')
            }
        })()

        return () => {
            cancelled = true
        }
    }, [url, baseHref])

    if (!url) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-6">
                <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6 text-center">
                    <p className="text-gray-700 font-medium">
                        Falta el parametro <code className="font-mono">url</code>.
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-50 flex flex-col">
            <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-3 sm:px-4">
                <div className="flex items-center gap-2">
                    <Link
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                        title="Abrir archivo original"
                    >
                        <ExternalLink className="w-4 h-4" />
                        Abrir original
                    </Link>
                </div>
                <button
                    type="button"
                    onClick={() => window.close()}
                    className="inline-flex items-center justify-center w-10 h-10 rounded-lg hover:bg-gray-100 text-gray-700"
                    aria-label="Cerrar"
                    title="Cerrar"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1">
                {error ? (
                    <div className="h-full flex items-center justify-center p-8 text-center">
                        <div className="max-w-md w-full bg-white border border-gray-200 rounded-xl p-6">
                            <p className="text-gray-700 font-medium mb-4">{error}</p>
                            <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                            >
                                Abrir archivo
                            </a>
                        </div>
                    </div>
                ) : (
                    <iframe
                        title="HTML"
                        srcDoc={doc || '<!doctype html><html><head></head><body style="font-family: ui-sans-serif, system-ui; padding: 16px;">Cargando...</body></html>'}
                        className="w-full h-[calc(100vh-56px)] bg-white"
                        sandbox="allow-scripts allow-forms allow-popups allow-modals"
                    />
                )}
            </div>
        </div>
    )
}
