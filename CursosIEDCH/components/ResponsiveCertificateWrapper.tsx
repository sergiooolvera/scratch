'use client'

import { useState, useEffect, useRef } from 'react'

interface ResponsiveCertificateWrapperProps {
    children: React.ReactNode;
    width?: number;
    height?: number;
}

export default function ResponsiveCertificateWrapper({ 
    children, 
    width = 1056, 
    height = 816 
}: ResponsiveCertificateWrapperProps) {
    const containerRef = useRef<HTMLDivElement>(null)
    const [scale, setScale] = useState(1)

    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement
                if (parent) {
                    const parentWidth = parent.clientWidth
                    const padding = window.innerWidth < 640 ? 16 : 32
                    const availableWidth = Math.min(parentWidth - padding, width)
                    setScale(availableWidth / width)
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
    }, [width])

    return (
        <div 
            ref={containerRef} 
            className="w-full flex justify-center items-start overflow-hidden transition-all duration-200" 
            style={{ height: `${height * scale}px` }}
        >
            <div 
                style={{ 
                    transform: `scale(${scale})`, 
                    transformOrigin: 'top center',
                    width: `${width}px`,
                    height: `${height}px`,
                    flexShrink: 0
                }}
            >
                {children}
            </div>
        </div>
    )
}
