'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareButtonProps {
    title: string
}

export default function ShareButton({ title }: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        // Agregamos un parámetro a la URL para forzar a WhatsApp a refrescar la caché de la imagen
        const baseUrl = window.location.href.split('?')[0]
        const url = `${baseUrl}?ref=share`
        
        const shareText = `🎓 *Te recomiendo este curso:* \n✨ ${title}\n\n👉 ¡Inscríbete y aprende a tu propio ritmo!`

        if (navigator.share) {
            try {
                await navigator.share({
                    text: shareText + `\n\n` + url
                    // Omitimos 'url' y 'title' por separado porque algunas versiones de WhatsApp 
                    // lo concatenan raro. Pasando todo en 'text' nos aseguramos del formato.
                })
            } catch (error) {
                console.log('Compartir cancelado o no disponible', error)
            }
        } else {
            try {
                // Si copiamos al portapapeles, también usamos el texto enriquecido
                await navigator.clipboard.writeText(shareText + `\n\n` + url)
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
