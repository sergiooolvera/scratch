'use client'

import React, { useState } from 'react'
import { ShieldCheck, User, X, Briefcase, GraduationCap, Building2, FileBadge, ExternalLink } from 'lucide-react'

interface CourseInstructorCardProps {
    nombre?: string | null
    especialidad?: string | null
    presentacion?: string | null
    fotografiaUrl?: string | null
    verificado?: boolean
    nivelAcademico?: string | null
    anosExperiencia?: string | null
    institucionLabora?: string | null
    cedulaProfesional?: string | null
}

export default function CourseInstructorCard({
    nombre = 'Dr. Juan Carlos Ramírez',
    especialidad = 'Enfermero Especialista en Cuidados Domiciliarios',
    presentacion,
    fotografiaUrl,
    verificado = true,
    nivelAcademico,
    anosExperiencia,
    institucionLabora,
    cedulaProfesional
}: CourseInstructorCardProps) {
    const [showModal, setShowModal] = useState(false)

    const defaultBio = presentacion ||
        'Enfermero con más de 10 años de experiencia en atención domiciliaria y docencia. Especialista en cuidados del adulto mayor y manejo de pacientes crónicos.'

    return (
        <>
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col justify-between h-full">
                <div>
                    {/* Encabezado */}
                    <div className="flex items-center justify-between mb-4 pb-1">
                        <h3 className="text-sm sm:text-base font-extrabold text-[#1e1b4b]">
                            Instructor
                        </h3>
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="text-[11px] font-bold text-indigo-700 hover:text-indigo-900 flex items-center gap-1 transition-colors"
                        >
                            <span>Ver perfil</span>
                            <ExternalLink className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Contenido del Instructor */}
                    <div className="flex items-start gap-4">
                        {/* Foto circular con hover */}
                        <div
                            onClick={() => setShowModal(true)}
                            className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shrink-0 bg-slate-100 shadow-xs cursor-pointer hover:opacity-90 hover:scale-105 transition-all"
                        >
                            {fotografiaUrl ? (
                                <img
                                    src={fotografiaUrl}
                                    alt={nombre || 'Instructor'}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none'
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full bg-[#1e1b4b] text-white font-black text-lg flex items-center justify-center">
                                    {(nombre || 'EGAC').charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>

                        {/* Texto informativo */}
                        <div className="min-w-0 flex-1 space-y-1">
                            <h4
                                onClick={() => setShowModal(true)}
                                className="text-xs sm:text-sm font-black text-[#1e1b4b] leading-tight cursor-pointer hover:text-indigo-700 transition-colors"
                            >
                                {nombre || 'Instructor Titular'}
                            </h4>
                            <p className="text-[11px] font-bold text-indigo-700 leading-tight">
                                {especialidad || 'Especialista en Ciencias de la Salud'}
                            </p>
                            <p className="text-[11px] text-slate-600 leading-relaxed pt-1 line-clamp-3">
                                {defaultBio}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Badge de verificación inferior */}
                {verificado && (
                    <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-medium text-slate-600">
                        <div className="flex items-center gap-1.5">
                            <ShieldCheck className="w-4 h-4 text-indigo-700 stroke-[2]" />
                            <span>Instructor verificado por EGAC</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal de Información del Instructor */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto space-y-5 animate-in fade-in">
                        {/* Botón cerrar */}
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="text-center pb-2">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                                Perfil Académico del Docente
                            </span>
                        </div>

                        {/* Cabecera del modal con foto y nombre */}
                        <div className="flex flex-col items-center text-center space-y-3">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-indigo-200 shadow-md bg-slate-100">
                                {fotografiaUrl ? (
                                    <img
                                        src={fotografiaUrl}
                                        alt={nombre || 'Instructor'}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-[#1e1b4b] text-white font-black text-3xl flex items-center justify-center">
                                        {(nombre || 'EGAC').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1">
                                <h3 className="text-lg font-black text-slate-900 flex items-center justify-center gap-1.5">
                                    {nombre}
                                    {verificado && (
                                        <ShieldCheck className="w-4 h-4 text-indigo-700 fill-indigo-100" />
                                    )}
                                </h3>
                                <p className="text-xs font-bold text-indigo-700">
                                    {especialidad || 'Especialista Docente'}
                                </p>
                            </div>
                        </div>

                        {/* Metadatos / Badges del Docente */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                            {nivelAcademico && (
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                    <GraduationCap className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-medium">Nivel Académico</p>
                                        <p className="font-bold text-slate-800">{nivelAcademico}</p>
                                    </div>
                                </div>
                            )}

                            {anosExperiencia && (
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                    <Briefcase className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-medium">Experiencia</p>
                                        <p className="font-bold text-slate-800">{anosExperiencia} de trayectoria</p>
                                    </div>
                                </div>
                            )}

                            {institucionLabora && (
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:col-span-2">
                                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-medium">Institución / Hospital</p>
                                        <p className="font-bold text-slate-800">{institucionLabora}</p>
                                    </div>
                                </div>
                            )}

                            {cedulaProfesional && (
                                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs sm:col-span-2">
                                    <FileBadge className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <div>
                                        <p className="text-[10px] text-slate-400 font-medium">Cédula Profesional</p>
                                        <p className="font-bold text-slate-800">{cedulaProfesional}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Semblanza / Biografía completa */}
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                                Semblanza Profesional
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed text-justify bg-slate-50/60 p-3.5 rounded-xl border border-slate-100">
                                {defaultBio}
                            </p>
                        </div>

                        {/* Badge de validación */}
                        <div className="pt-2 text-center">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                                Docente verificado y avalado por el comité académico EGAC
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
