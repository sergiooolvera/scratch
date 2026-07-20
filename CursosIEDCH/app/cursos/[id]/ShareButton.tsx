'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
    title: string
}

export default function ShareButton({ title }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        const url = window.location.href
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: `Te recomiendo este curso: ${title}`,
                    url: url
                })
            } catch (error) {
                // El usuario canceló o falló, ignoramos para no interrumpir la experiencia
                console.log('Compartir cancelado o no disponible', error)
            }
        } else {
            try {
                await navigator.clipboard.writeText(url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2500)
            } catch (err) {
                console.error('Error al copiar al portapapeles:', err)
            }
        }
    }

    return (
        <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-900 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            title="Compartir curso"
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-emerald-500 animate-bounce" />
                    <span className="text-emerald-600">¡Enlace copiado!</span>
                </>
            ) : (
                <>
                    <Share2 className="h-4 w-4 text-gray-500" />
                    <span>Compartir</span>
                </>
            )}
        </button>
    )
}
