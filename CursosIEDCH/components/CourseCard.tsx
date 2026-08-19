'use client'

import Link from 'next/link'
import { Sparkles, User, Heart } from 'lucide-react'
import { useState, useEffect } from 'react'
import CreatorProfileModal from './CreatorProfileModal'

interface Course {
    id: string
    titulo: string
    descripcion: string
    instructor: string
    precio: number
    estado: string
    es_super_curso?: boolean
    categoria?: string
    imagen_url?: string
    profesor?: {
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
}

const isProfileComplete = (prof: Course['profesor']) => {
    if (!prof) return false
    const rol = prof.rol || 'instructor'
    if (rol === 'institucion') {
        return !!(
            prof.nombre &&
            prof.clave_cct &&
            prof.organizacion_tipo &&
            prof.correo_adicional &&
            prof.telefono &&
            prof.representante_nombre &&
            prof.representante_cargo &&
            prof.descripcion_institucional
        )
    } else {
        return !!(
            prof.nombre &&
            prof.apellido_paterno &&
            prof.profesion_especialidad &&
            prof.nivel_academico &&
            prof.anos_experiencia &&
            prof.presentacion_profesional
        )
    }
}


const catLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    salud: { label: '🩺 Salud', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    negocios: { label: '💼 Negocios', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    tecnologia: { label: '💻 Tecnología', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    desarrollo: { label: '😊 Desarrollo Personal', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
    idiomas: { label: '🌐 Idiomas', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
    mas: { label: '💬 Más', bg: 'bg-zinc-50', text: 'text-zinc-700', border: 'border-zinc-200' },
    // Compatibilidad con categorías anteriores
    arte: { label: '🎨 Arte y Cultura', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    educacion: { label: '📚 Educación', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
}
export default function CourseCard({ course, isPagado }: { course: Course; isPagado?: boolean }) {
    const isSuper = !!course.es_super_curso
    const cat = catLabels[course.categoria || 'desarrollo'] || catLabels.desarrollo
    const [isWished, setIsWished] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const canShowProfile = isProfileComplete(course.profesor)

    const handleProfileClick = (e: React.MouseEvent) => {
        if (canShowProfile) {
            e.preventDefault()
            e.stopPropagation()
            setIsModalOpen(true)
        }
    }

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const wished = JSON.parse(localStorage.getItem('ie_deseos') || '[]')
            setIsWished(wished.includes(course.id))
        }

        const handleWishChange = () => {
            const wished = JSON.parse(localStorage.getItem('ie_deseos') || '[]')
            setIsWished(wished.includes(course.id))
        }

        window.addEventListener('wishlist-updated', handleWishChange)
        return () => window.removeEventListener('wishlist-updated', handleWishChange)
    }, [course.id])

    const toggleWish = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (typeof window !== 'undefined') {
            const wished = JSON.parse(localStorage.getItem('ie_deseos') || '[]')
            let newWished: string[]
            if (wished.includes(course.id)) {
                newWished = wished.filter((id: string) => id !== course.id)
                setIsWished(false)
            } else {
                newWished = [...wished, course.id]
                setIsWished(true)
            }
            localStorage.setItem('ie_deseos', JSON.stringify(newWished))
            window.dispatchEvent(new Event('wishlist-updated'))
        }
    }

    return (
        <div
            className={
                `relative bg-white overflow-hidden shadow rounded-lg flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 ` +
                (isSuper ? 'ring-2 ring-amber-300 sm:col-span-2 lg:col-span-2 rounded-2xl shadow-lg' : '')
            }
        >
            {!isPagado && (
                <button
                    onClick={toggleWish}
                    className="absolute top-3 right-3 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-gray-400 hover:text-rose-500 shadow-md backdrop-blur-xs transition-all duration-200 hover:scale-110 active:scale-95 border border-zinc-100"
                    title={isWished ? 'Quitar de mi lista' : 'Agregar a mi lista'}
                >
                    <Heart className={`h-4.5 w-4.5 transition-colors ${isWished ? 'fill-rose-500 text-rose-500' : 'text-zinc-400'}`} />
                </button>
            )}
            {isSuper && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-fuchsia-500 to-indigo-500" />
            )}

            <div className={isSuper ? 'px-5 py-6 sm:p-7 flex-grow' : 'px-4 py-5 sm:p-6 flex-grow'}>
                {/* Flex contenedor para alinear contenido (izq) e imagen (der) */}
                <div className="flex gap-4 items-start justify-between">
                    <div className="flex-1 min-w-0">
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-3.5">
                            {isSuper && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm uppercase tracking-wider">
                                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                    Super Curso
                                </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs uppercase tracking-wider ${cat.bg} ${cat.text} ${cat.border}`}>
                                {cat.label}
                            </span>
                        </div>

                        {/* Título */}
                        <h3 className={isSuper ? 'text-xl leading-7 font-extrabold text-gray-900' : 'text-lg leading-6 font-bold text-gray-900'}>
                            {course.titulo}
                        </h3>

                        {/* Descripción */}
                        <p className={isSuper ? 'mt-2 text-sm text-gray-600 line-clamp-3' : 'mt-1.5 max-w-2xl text-sm text-gray-500 line-clamp-2'}>
                            {course.descripcion ? `Esta capacitación está orientada a la adquisición y actualización de conocimientos relacionados con, ${course.descripcion}` : ''}
                        </p>

                        {/* Perfil del Profesor */}
                        <div 
                            onClick={handleProfileClick}
                            className={`mt-4 flex items-center gap-2.5 ${canShowProfile ? 'cursor-pointer group/prof' : ''}`}
                            title={canShowProfile ? 'Ver perfil del creador' : undefined}
                        >
                            <div className={`h-8 w-8 rounded-full overflow-hidden bg-zinc-100 flex items-center justify-center border border-zinc-200 shadow-xs flex-shrink-0 transition-transform duration-200 ${canShowProfile ? 'group-hover/prof:scale-105' : ''}`}>
                                {course.profesor?.fotografia_perfil ? (
                                    <img
                                        src={course.profesor.fotografia_perfil}
                                        alt={course.profesor.nombre || course.instructor}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <User className="h-4.5 w-4.5 text-zinc-500" />
                                )}
                            </div>
                            <span className={`text-sm font-medium flex items-center gap-1 transition-colors duration-200 ${canShowProfile ? 'group-hover/prof:text-indigo-600' : ''} ${isSuper ? 'text-indigo-700 font-semibold' : 'text-zinc-700'}`}>
                                <span>{course.profesor?.nombre || course.instructor || 'Instructor'}</span>
                                {course.profesor?.verificado && (
                                    <span className="text-blue-500 flex-shrink-0" title="Verificado">
                                        <svg className="w-3.5 h-3.5 fill-current inline-block" viewBox="0 0 24 24">
                                            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                    </span>
                                )}
                            </span>
                        </div>
                    </div>

                    {/* Imagen sutil del Curso en la parte derecha */}
                    <div className={
                        `flex-shrink-0 rounded-lg overflow-hidden border border-zinc-100 shadow-xs bg-zinc-50 transition-transform duration-300 hover:scale-[1.03] ` +
                        (isSuper 
                            ? 'w-24 h-24 sm:w-36 sm:h-36' 
                            : 'w-20 h-20 sm:w-24 sm:h-24')
                    }>
                        <img
                            src={course.imagen_url || '/mundo.jpeg'}
                            alt={course.titulo}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className={(isSuper ? 'bg-gradient-to-r from-amber-50 via-white to-indigo-50 ' : 'bg-gray-50 ') + 'px-4 py-4 sm:px-6 mt-auto flex flex-col gap-2'}>
                {/* Visualización del Precio */}
                <div className="flex items-center justify-between px-1 mb-1">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Inversión</span>
                    <span className="text-base font-extrabold text-indigo-700">
                        {course.precio && Number(course.precio) > 0 ? `$${Number(course.precio).toLocaleString('es-MX')} MXN` : 'Gratuito'}
                    </span>
                </div>

                <Link
                    href={isPagado ? `/cursos/${course.id}/contenido` : `/cursos/${course.id}`}
                    className={
                        'w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-bold rounded-full shadow-sm text-white transition-all duration-200 ' +
                        (isSuper
                            ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-100'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-100')
                    }
                >
                    {isPagado ? 'Ir a Curso' : 'Ver Detalles'}
                </Link>
                {isPagado && (
                    <Link
                        href={`/cursos/${course.id}`}
                        className="w-full flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-bold rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                    >
                        Ver Detalles / Calificar
                    </Link>
                )}
            </div>

            {canShowProfile && (
                <CreatorProfileModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    profile={course.profesor || null}
                />
            )}
        </div>
    )
}
