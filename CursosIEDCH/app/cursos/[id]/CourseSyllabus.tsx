'use client'

import React, { useState } from 'react'
import { Bookmark, ChevronDown, ChevronUp } from 'lucide-react'

interface ModuloTemario {
    titulo?: string
    temas?: string[]
}

interface CourseSyllabusProps {
    temario?: ModuloTemario[] | null
    descripcionDefault?: string
    competenciasFallback?: string[]
}

export default function CourseSyllabus({
    temario,
    descripcionDefault = '',
    competenciasFallback = []
}: CourseSyllabusProps) {
    const [expanded, setExpanded] = useState(false)

    const hasStructuredTemario = Array.isArray(temario) && temario.length > 0

    let topicsList: { numero: string; titulo: string; subtemas?: string[] }[] = []

    if (hasStructuredTemario) {
        topicsList = (temario as ModuloTemario[]).map((mod, idx) => ({
            numero: String(idx + 1).padStart(2, '0'),
            titulo: mod.titulo || `Módulo ${idx + 1}`,
            subtemas: Array.isArray(mod.temas) ? mod.temas.filter((t) => t && t.trim().length > 0) : []
        }))
    } else if (competenciasFallback.length > 0) {
        topicsList = competenciasFallback.map((comp, idx) => ({
            numero: String(idx + 1).padStart(2, '0'),
            titulo: comp
        }))
    } else {
        topicsList = [
            { numero: '01', titulo: 'Fundamentos del cuidado y marco normativo' },
            { numero: '02', titulo: 'Valoración inicial y signos vitales' },
            { numero: '03', titulo: 'Higiene, confort y movilización' },
            { numero: '04', titulo: 'Prevención de lesiones y complicaciones' },
            { numero: '05', titulo: 'Administración segura de procedimientos' },
            { numero: '06', titulo: 'Atención integral del paciente y familia' }
        ]
    }

    const itemsLimit = 6
    const displayedTopics = expanded ? topicsList : topicsList.slice(0, itemsLimit)
    const hasMore = topicsList.length > itemsLimit || (hasStructuredTemario && topicsList.some(t => t.subtemas && t.subtemas.length > 0))

    return (
        <div id="temario-curso" className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
            <div>
                {/* Encabezado */}
                <div className="flex items-center gap-2 mb-4 pb-1">
                    <Bookmark className="w-4 h-4 text-indigo-700 shrink-0" />
                    <h3 className="text-sm sm:text-base font-extrabold text-[#1e1b4b]">
                        Temario del curso
                    </h3>
                </div>

                {/* Lista de temas numerados con píldora azul */}
                <div className="space-y-3">
                    {displayedTopics.map((topic, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#1e1b4b] text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                {topic.numero}
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-800 leading-snug">
                                    {topic.titulo}
                                </p>
                                {expanded && topic.subtemas && topic.subtemas.length > 0 && (
                                    <ul className="mt-1.5 pl-3 list-disc space-y-0.5 text-[11px] text-slate-500">
                                        {topic.subtemas.map((sub, sIdx) => (
                                            <li key={sIdx}>{sub}</li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Enlace para expandir/colapsar */}
            {hasMore && (
                <div className="mt-4 pt-2">
                    <button
                        type="button"
                        onClick={() => setExpanded(!expanded)}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 transition-colors"
                    >
                        <span>{expanded ? 'Ocultar temario' : 'Ver temario completo'}</span>
                        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                </div>
            )}
        </div>
    )
}
