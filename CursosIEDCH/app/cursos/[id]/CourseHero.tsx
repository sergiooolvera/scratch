'use client'

import React from 'react'
import { Clock, Monitor, ShieldCheck } from 'lucide-react'
import { formatDuracion } from '@/utils/formatters'

interface CourseHeroProps {
    titulo: string
    descripcion?: string | null
    duracion?: string | number | null
    modalidad?: string | null
    imagenUrl?: string | null
}

export default function CourseHero({
    titulo,
    descripcion,
    duracion,
    modalidad = 'En línea',
    imagenUrl = '/mundo.jpeg'
}: CourseHeroProps) {

    const duracionFormateada = duracion ? formatDuracion(String(duracion)) : '20 horas'

    return (
        <div className="bg-white rounded-2xl p-6 sm:p-8 md:p-9 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] mb-6 transition-all">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 items-center justify-between">
                {/* Lado izquierdo: Información del Curso */}
                <div className="flex-1 w-full space-y-4">
                    {/* Badge superior */}
                    <div className="inline-flex items-center px-3 py-1 rounded-md bg-[#ede9fe] text-[#4c1d95] text-[11px] font-extrabold tracking-wider uppercase">
                        CURSO EN LÍNEA
                    </div>

                    {/* Título Principal */}
                    <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-black text-[#1e1b4b] tracking-tight leading-[1.2]">
                        {titulo}
                    </h1>

                    {/* Descripción */}
                    {descripcion && (
                        <p className="text-slate-600 text-xs sm:text-sm leading-relaxed text-justify">
                            {descripcion}
                        </p>
                    )}

                    {/* Fila de Características (Duración, Modalidad, Constancia) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
                        {/* Duración */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                                <Clock className="w-4 h-4 stroke-[1.75]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 leading-tight">{duracionFormateada}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Duración</p>
                            </div>
                        </div>

                        {/* Modalidad */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                                <Monitor className="w-4 h-4 stroke-[1.75]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 leading-tight">{modalidad || 'En línea'}</p>
                                <p className="text-[11px] text-slate-500 font-medium">Modalidad</p>
                            </div>
                        </div>

                        {/* Constancia */}
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full border border-indigo-200 text-indigo-700 flex items-center justify-center shrink-0">
                                <ShieldCheck className="w-4 h-4 stroke-[1.75]" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 leading-tight">Constancia con valor curricular verificable</p>
                                <p className="text-[11px] text-slate-500 font-medium">Código único de verificación</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Lado derecho: Tarjeta de Portada */}
                <div className="w-full lg:w-[380px] shrink-0">
                    <div className="relative group rounded-2xl overflow-hidden shadow-sm border border-slate-200 aspect-[16/10] bg-slate-900 flex items-center justify-center">
                        <img
                            src={imagenUrl || '/mundo.jpeg'}
                            alt={titulo}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
