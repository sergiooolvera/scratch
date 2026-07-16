'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Academia {
    id: string
    nombre: string
    logo_url: string | null
    color_principal: string | null
    alumnosCount: number
}

interface PopularAcademiesClientProps {
    academias: Academia[]
}

export default function PopularAcademiesClient({ academias }: PopularAcademiesClientProps) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleIngresar = (id: string) => {
        if (loadingId) return
        setLoadingId(id)
        router.push(`/academias/${id}`)
    }

    return (
        <div className="space-y-5">
            {academias.map((academia) => {
                const iniciales = academia.nombre
                    .split(' ')
                    .map((w: string) => w[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()

                const isLoading = loadingId === academia.id

                return (
                    <div key={academia.id} className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3.5 min-w-0">
                            {academia.logo_url ? (
                                <img 
                                    src={academia.logo_url} 
                                    alt={academia.nombre} 
                                    className="h-11 w-11 rounded-xl object-cover border border-zinc-100 flex-shrink-0"
                                />
                            ) : (
                                <div 
                                    className="h-11 w-11 rounded-xl flex items-center justify-center text-white font-bold text-xs flex-shrink-0"
                                    style={{ backgroundColor: academia.color_principal || '#6366f1' }}
                                >
                                    {iniciales}
                                </div>
                            )}
                            <div className="min-w-0">
                                <h4 className="font-extrabold text-zinc-800 text-xs truncate leading-tight">
                                    {academia.nombre}
                                </h4>
                                <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                                    {academia.alumnosCount.toLocaleString()} alumnos
                                </p>
                            </div>
                        </div>

                        <button 
                            type="button"
                            disabled={loadingId !== null}
                            onClick={() => handleIngresar(academia.id)}
                            className={`border font-bold text-[11px] px-3.5 py-1.5 rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 ${
                                isLoading 
                                    ? 'border-indigo-300 bg-indigo-50 text-indigo-500 cursor-not-allowed'
                                    : loadingId !== null
                                        ? 'border-zinc-200 text-zinc-450 cursor-not-allowed opacity-50'
                                        : 'border-indigo-200 text-indigo-600 hover:bg-indigo-50 cursor-pointer active:scale-95'
                            }`}
                        >
                            {isLoading && (
                                <svg className="animate-spin h-3.5 w-3.5 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                            )}
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}
