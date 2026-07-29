'use client'

import { X, GraduationCap, Building2, Mail, Phone, MapPin, Briefcase, Award, CheckCircle2, Calendar } from 'lucide-react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ProfesorProfile {
    nombre: string
    apellido_paterno?: string
    apellido_materno?: string
    fotografia_perfil?: string
    verificado?: boolean
    rol?: string
    clave_cct?: string
    organizacion_tipo?: string
    correo_adicional?: string
    telefono?: string
    representante_nombre?: string
    representante_cargo?: string
    descripcion_institucional?: string
    profesion_especialidad?: string
    nivel_academico?: string
    anos_experiencia?: string | number
    presentacion_profesional?: string
    estado_municipio?: string
}

interface CreatorProfileModalProps {
    isOpen: boolean
    onClose: () => void
    profile: ProfesorProfile | null
}

export default function CreatorProfileModal({ isOpen, onClose, profile }: CreatorProfileModalProps) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!isOpen || !profile || !mounted) return null

    const rol = profile.rol || 'instructor'
    const esInstitucion = rol === 'institucion'

    // Obtener nombre completo
    const nombreCompleto = esInstitucion 
        ? profile.nombre 
        : `${profile.nombre} ${profile.apellido_paterno || ''} ${profile.apellido_materno || ''}`.trim()

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop con efecto blur premium */}
            <div 
                className="fixed inset-0 bg-slate-950/40 backdrop-blur-md transition-opacity duration-300"
                onClick={onClose}
            />

            {/* Contenedor del Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-300 z-10 my-8">
                
                {/* Botón de Cerrar Superior Flotante */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 text-white/80 hover:text-white hover:scale-110 p-2 rounded-full bg-slate-900/30 backdrop-blur-xs hover:bg-slate-900/50 transition-all cursor-pointer"
                    aria-label="Cerrar modal"
                >
                    <X className="h-4.5 w-4.5" />
                </button>

                {/* Banner de Cabecera con degradado premium */}
                <div className={`h-36 w-full relative ${
                    esInstitucion 
                        ? 'bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600' 
                        : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500'
                }`}>
                    {/* Efecto decorativo abstracto en el banner */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_60%)]" />
                </div>

                {/* Contenido Principal con avatar superpuesto */}
                <div className="px-6 pb-6 pt-16 relative">
                    
                    {/* Avatar superpuesto */}
                    <div className="absolute -top-16 left-6 h-28 w-28 rounded-full overflow-hidden bg-white p-1.5 shadow-xl border border-slate-100">
                        <div className="h-full w-full rounded-full overflow-hidden bg-slate-100 flex items-center justify-center">
                            {profile.fotografia_perfil ? (
                                <img 
                                    src={profile.fotografia_perfil} 
                                    alt={nombreCompleto} 
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                esInstitucion ? (
                                    <Building2 className="h-12 w-12 text-slate-400" />
                                ) : (
                                    <GraduationCap className="h-12 w-12 text-slate-400" />
                                )
                            )}
                        </div>
                    </div>

                    {/* Nombre y Badge de Verificación */}
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                            {nombreCompleto}
                        </h2>
                        {profile.verificado && (
                            <span 
                                className="inline-flex items-center text-blue-500 bg-blue-50 rounded-full p-0.5" 
                                title="Perfil Verificado por IEDCH"
                            >
                                <CheckCircle2 className="h-5 w-5 fill-current text-blue-500 stroke-white" />
                            </span>
                        )}
                    </div>

                    {/* Subtítulo / Rol */}
                    <p className={`text-sm font-bold uppercase tracking-wider ${
                        esInstitucion ? 'text-emerald-600' : 'text-indigo-600'
                    } mb-5`}>
                        {esInstitucion ? 'Institución Educativa' : 'Instructor Certificado'}
                    </p>

                    {/* Sección de Campos de Datos Rápidos */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        
                        {esInstitucion ? (
                            <>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/70">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Tipo de Organización</p>
                                        <p className="text-sm font-semibold text-slate-700">{profile.organizacion_tipo || 'No especificado'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/70">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <Award className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Clave CCT</p>
                                        <p className="text-sm font-mono font-semibold text-slate-700">{profile.clave_cct || 'No especificado'}</p>
                                    </div>
                                </div>

                                <div className="sm:col-span-2 flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/70">
                                    <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                                        <Briefcase className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Representante Legal</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {profile.representante_nombre} 
                                            {profile.representante_cargo ? ` (${profile.representante_cargo})` : ''}
                                        </p>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/70">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Briefcase className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Especialidad</p>
                                        <p className="text-sm font-semibold text-slate-700 truncate max-w-[170px]" title={profile.profesion_especialidad}>
                                            {profile.profesion_especialidad || 'No especificado'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/70">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <GraduationCap className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Nivel Académico</p>
                                        <p className="text-sm font-semibold text-slate-700">{profile.nivel_academico || 'No especificado'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/70">
                                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                        <Calendar className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Experiencia</p>
                                        <p className="text-sm font-semibold text-slate-700">
                                            {profile.anos_experiencia ? `${profile.anos_experiencia} años` : 'No especificado'}
                                        </p>
                                    </div>
                                </div>

                                {profile.estado_municipio && (
                                    <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-2xl transition-all hover:bg-slate-100/70">
                                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-bold text-slate-400">Ubicación</p>
                                            <p className="text-sm font-semibold text-slate-700 truncate max-w-[170px]" title={profile.estado_municipio}>
                                                {profile.estado_municipio}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Descripción o Presentación Profesional */}
                    <div className="mb-6">
                        <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2">
                            {esInstitucion ? 'Sobre la Institución' : 'Biografía Profesional'}
                        </h3>
                        <div className="bg-slate-50/50 border border-slate-100/80 rounded-2xl p-4">
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                                {esInstitucion 
                                    ? profile.descripcion_institucional 
                                    : profile.presentacion_profesional}
                            </p>
                        </div>
                    </div>

                    {/* Datos de Contacto (si existen) */}
                    {(profile.correo_adicional || profile.telefono) && (
                        <div className="border-t border-slate-100 pt-5">
                            <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-3">
                                Información de Contacto
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-6 text-sm text-slate-600">
                                {profile.correo_adicional && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="h-4.5 w-4.5 text-slate-400" />
                                        <a href={`mailto:${profile.correo_adicional}`} className="hover:text-indigo-600 transition-colors font-medium">
                                            {profile.correo_adicional}
                                        </a>
                                    </div>
                                )}
                                {profile.telefono && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="h-4.5 w-4.5 text-slate-400" />
                                        <a href={`tel:${profile.telefono}`} className="hover:text-indigo-600 transition-colors font-medium">
                                            {profile.telefono}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer del Modal */}
                <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm shadow-xs transition-all duration-200 cursor-pointer ${
                            esInstitucion 
                                ? 'bg-emerald-600 hover:bg-emerald-700 hover:shadow-emerald-100 text-white' 
                                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-100 text-white'
                        }`}
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </div>,
        document.body
    )
}
