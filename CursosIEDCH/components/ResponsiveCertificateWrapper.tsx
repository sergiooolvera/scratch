'use client'

import { useState, useEffect, useRef } from 'react'

interface ResponsiveCertificateWrapperProps {
    children: React.ReactNode;
}

export default function ResponsiveCertificateWrapper({ children }: ResponsiveCertificateWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement
                if (parent) {
                    const parentWidth = parent.clientWidth
                    // Subtract dynamic padding/margin for a clean fit
                    const targetWidth = 1056
                    const padding = window.innerWidth < 640 ? 16 : 32
                    const availableWidth = Math.min(parentWidth - padding, targetWidth)
                    setScale(availableWidth / targetWidth)
                }
            }
        }

        handleResize()
        window.addEventListener('resize', handleResize)
        
        // Multi-stage timers to ensure correct width measurements on render
        const timer1 = setTimeout(handleResize, 50)
        const timer2 = setTimeout(handleResize, 300)

        return () => {
            window.removeEventListener('resize', handleResize)
            clearTimeout(timer1)
            clearTimeout(timer2)
        }
    }, [])

    return (
        <div 
            ref={containerRef} 
            className="w-full flex justify-center items-start overflow-hidden transition-all duration-200" 
            style={{ height: `${816 * scale}px` }}
        >
            <div 
                style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top center',
                    width: '1056px',
                    height: '816px',
                    flexShrink: 0
                }}
            >
                {children}
            </div>
        </div>
    )
}
