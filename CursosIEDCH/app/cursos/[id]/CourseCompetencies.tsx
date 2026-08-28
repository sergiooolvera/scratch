'use client'

import React from 'react'
import { Target, CheckCircle2 } from 'lucide-react'
import { parseCompetenciasList } from '@/components/CompetenciasDisplay'

interface CourseCompetenciesProps {
    competencias?: string | null
    beneficiosFallback?: string | null
}

export default function CourseCompetencies({
    competencias,
    beneficiosFallback
}: CourseCompetenciesProps) {
    let items = parseCompetenciasList(competencias)

    if (items.length === 0 && beneficiosFallback && beneficiosFallback.trim()) {
        items = parseCompetenciasList(beneficiosFallback)
    }

    if (items.length === 0) {
        items = [
            'Aplicar cuidados básicos de enfermería en el domicilio con enfoque en la seguridad del paciente.',
            'Identificar y prevenir riesgos, lesiones y complicaciones.',
            'Brindar higiene, confort y movilización segura.',
            'Administrar medicamentos con seguridad y ética.',
            'Atender de manera integral y humanizada al paciente y su familia.'
        ]
    }

    return (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
            <div>
                {/* Encabezado */}
                <div className="flex items-center gap-2 mb-4 pb-1">
                    <Target className="w-4 h-4 text-indigo-700 shrink-0" />
                    <h3 className="text-sm sm:text-base font-extrabold text-[#1e1b4b]">
                        Competencias que desarrollarás
                    </h3>
                </div>

                {/* Lista de competencias */}
                <div className="space-y-3">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                            <div className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5 border border-indigo-100">
                                <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.2]" />
                            </div>
                            <p className="text-xs text-slate-700 leading-snug flex-1">
                                {item}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
