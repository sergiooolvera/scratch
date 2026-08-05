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
        const url = `${baseUrl}?ref=share2`
        
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
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-md hover:shadow-lg active:scale-95 cursor-pointer ${
                copied 
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20" 
                    : "bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-indigo-600/25 hover:scale-[1.02]"
            }`}
            title="Compartir curso"
        >
            {copied ? (
                <>
                    <Check className="h-4 w-4 text-white animate-bounce" />
                    <span>¡Enlace copiado!</span>
                </>
            ) : (
                <>
                    <Share2 className="h-4 w-4 text-white" />
                    <span>Compartir</span>
                </>
            )}
        </button>
    )
}
