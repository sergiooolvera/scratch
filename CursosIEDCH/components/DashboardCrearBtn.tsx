'use client'

import { useState } from 'react'
import PerfilCheckModal from './PerfilCheckModal'

interface DashboardCrearBtnProps {
    href: string
    className: string
    children: React.ReactNode
    perfilIncompleto: boolean
    rol: string
}

export default function DashboardCrearBtn({ 
    href, 
    className, 
    children, 
    perfilIncompleto, 
    rol 
}: DashboardCrearBtnProps) {
    const [modalOpen, setModalOpen] = useState(false)

    const handleClick = (e: React.MouseEvent) => {
        if (perfilIncompleto) {
            e.preventDefault()
            setModalOpen(true)
        }
    }

    return (
        <>
            <a 
                href={href} 
                onClick={handleClick} 
                className={className}
            >
                {children}
            </a>

            <PerfilCheckModal 
                isOpen={modalOpen} 
                onClose={() => setModalOpen(false)} 
                redirectUrl={href} 
                rol={rol} 
            />
        </>
    )
}
