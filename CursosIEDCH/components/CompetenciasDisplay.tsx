'use client'

import React from 'react'
import { Bookmark } from 'lucide-react'

interface CompetenciasDisplayProps {
    competencias?: string | null;
    className?: string;
    titulo?: string;
    introduccion?: string;
}

export function parseCompetenciasList(competenciasStr?: string | null): string[] {
    if (!competenciasStr || !competenciasStr.trim()) return [];
    return competenciasStr
        .split('\n')
        .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^[•\-\*]\s*/, '').trim())
        .filter(line => line.length > 0);
}

export default function CompetenciasDisplay({
    competencias,
    className = '',
    titulo = 'Competencias abordadas',
    introduccion = 'La presente capacitación incluyó contenidos orientados al desarrollo de competencias relacionadas con:'
}: CompetenciasDisplayProps) {
    const items = parseCompetenciasList(competencias);

    if (items.length === 0) return null;

    return (
        <div className={`space-y-3.5 ${className}`}>
            {/* Encabezado con ícono */}
            <div className="flex items-center gap-2">
                <Bookmark className="w-5 h-5 text-[#0b1b36] shrink-0" />
                <h4 className="text-base sm:text-lg font-bold text-[#0b1b36] tracking-tight">
                    {titulo}
                </h4>
            </div>

            {/* Texto de introducción */}
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                {introduccion}
            </p>

            {/* Lista de competencias con círculos numerados estilizados */}
            <div className="space-y-0 divide-y divide-gray-200/80 border-t border-gray-200/80 pt-1">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-4 py-3.5 first:pt-3 last:pb-1">
                        <div className="w-8 h-8 rounded-full bg-[#0b1b36] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm mt-0.5">
                            {idx + 1}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed flex-1 text-justify pt-1">
                            {item}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}
