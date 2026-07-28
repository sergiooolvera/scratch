'use client'

import { GraduationCap, Building2, UserCheck, Clock, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PerfilCheckModalProps {
    isOpen: boolean
    onClose: () => void
    redirectUrl: string
    rol: string
}

export default function PerfilCheckModal({ isOpen, onClose, redirectUrl, rol }: PerfilCheckModalProps) {
    const router = useRouter()

    if (!isOpen) return null

    const handleRedirect = () => {
        router.push(`/perfil?redirect=${encodeURIComponent(redirectUrl)}`)
        onClose()
    }

    const esInstitucion = rol === 'institucion'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            {/* Backdrop con desenfoque de vidrio (Glassmorphism) */}
            <div 
                className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity" 
                onClick={onClose}
            />

            {/* Tarjeta del Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-md w-full p-6 sm:p-8 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200 z-10">
                {/* Botón de cerrar superior */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-50 transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Encabezado e Icono Decorativo */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="relative">
                        <div className={`h-16 w-16 ${esInstitucion ? 'bg-emerald-50 text-emerald-600' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center shadow-inner`}>
                            {esInstitucion ? (
                                <Building2 className="h-8 w-8" />
                            ) : (
                                <GraduationCap className="h-8 w-8" />
                            )}
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-green-500 text-white rounded-full p-1 border-2 border-white shadow-xs">
                            <UserCheck className="h-3.5 w-3.5" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                            ¡Bienvenido(a)!
                        </h3>
                        <p className={`text-xs font-bold uppercase tracking-wider ${esInstitucion ? 'text-emerald-600' : 'text-indigo-600'}`}>
                            {esInstitucion ? 'Identidad de la Organización' : 'Identidad del Instructor'}
                        </p>
                    </div>
                </div>

                {/* Contenido del Mensaje */}
                <div className="mt-6 space-y-4 text-center">
                    <p className="text-sm text-slate-600 leading-relaxed">
                        Antes de iniciar, dedicaremos unos minutos a registrar tu identidad profesional o institucional para brindarte una experiencia más confiable y personalizada.
                    </p>

                    <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-500 mx-auto">
                        <Clock className="h-4 w-4 text-indigo-500" />
                        <span>Tiempo estimado: 2 minutos</span>
                    </div>
                </div>

                {/* Botones de Acción */}
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="sm:order-1 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm px-5 py-3 rounded-full transition-colors flex-1"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleRedirect}
                        className={`sm:order-2 ${esInstitucion ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white font-semibold text-sm px-5 py-3 rounded-full shadow-md transition-colors flex-1`}
                    >
                        Completar Perfil
                    </button>
                </div>
            </div>
        </div>
    )
}
