'use client'

import { GraduationCap, X, BookOpen, Shield, Award, CheckCircle2, Landmark, FileText, ShieldCheck, Info, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { useEffect } from 'react'

interface AvalAcademicoModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function AvalAcademicoModal({ isOpen, onClose }: AvalAcademicoModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 relative shadow-2xl overflow-hidden border border-slate-100 my-8 transition-all transform animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Map Image Background in Top Right corner */}
        <div className="absolute top-0 right-0 w-64 sm:w-80 h-64 sm:h-80 pointer-events-none opacity-85 mix-blend-multiply overflow-hidden rounded-tr-3xl">
          <Image
            src="/images/mapa_americas_aval.jpg"
            alt="Mapa del Continente Americano Aval Académico"
            fill
            className="object-contain object-top-right transform translate-x-10 -translate-y-6"
            priority
          />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-700 bg-gray-50 hover:bg-gray-100 p-2 rounded-full transition-colors z-10"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="relative z-10 mb-6 pr-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="relative">
              <GraduationCap className="w-10 h-10 text-orange-500 transform -rotate-6" />
              <div className="h-1 w-8 bg-orange-500 rounded-full mt-0.5"></div>
            </div>
            <h2 id="modal-title" className="text-3xl font-extrabold text-[#310ea0]">
              Aval <span className="text-[#6355ff]">académico</span>
            </h2>
          </div>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Nuestros cursos cuentan con respaldo de{' '}
            <strong className="text-[#310ea0] font-bold">
              instituciones educativas y organismos especializados.
            </strong>
          </p>
        </div>

        {/* Respaldo Académico Card */}
        <div className="bg-[#f3f6ff] rounded-2xl p-5 border border-indigo-100/80 mb-6 relative z-10 shadow-xs">
          <h3 className="text-lg font-bold text-[#310ea0] mb-3">
            Respaldo académico
          </h3>

          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0 bg-white p-3 rounded-xl shadow-xs border border-indigo-100/50 flex items-center justify-center text-[#310ea0]">
              <div className="relative">
                <BookOpen className="w-7 h-7 text-[#310ea0]" />
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-orange-500 rounded-full"></div>
              </div>
            </div>
            <div className="border-l border-indigo-200/60 pl-4">
              <h4 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C.
              </h4>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                Institución constituida legalmente y vinculada al desarrollo de programas de formación y capacitación.
              </p>
            </div>
          </div>

          {/* Badges Pill */}
          <div className="bg-[#e9efff] rounded-xl py-2.5 px-3 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-semibold text-[#310ea0] border border-indigo-100">
            <div className="flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-600" />
              <span>Valor curricular</span>
            </div>
            <span className="text-indigo-300">•</span>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-600" />
              <span>Respaldo académico</span>
            </div>
            <span className="text-indigo-300">•</span>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>Constancia verificable</span>
            </div>
          </div>
        </div>

        {/* ¿Qué significa para el estudiante? Section */}
        <div className="relative z-10 mb-6">
          <h3 className="text-base font-bold text-[#310ea0] mb-3">
            ¿Qué significa para el estudiante?{' '}
            <span className="text-indigo-600 font-medium text-sm">(Nuevas oportunidades laborales)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {/* Feature 1 */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs flex items-start gap-2.5 sm:flex-col sm:items-start">
              <div className="bg-orange-50 p-2 rounded-lg text-orange-500 flex-shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-700 font-medium leading-snug">
                Identificación de la institución que respalda el programa
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs flex items-start gap-2.5 sm:flex-col sm:items-start">
              <div className="bg-orange-50 p-2 rounded-lg text-orange-500 flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-700 font-medium leading-snug">
                Información del curso y horas de formación
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs flex items-start gap-2.5 sm:flex-col sm:items-start">
              <div className="bg-orange-50 p-2 rounded-lg text-orange-500 flex-shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <p className="text-xs text-slate-700 font-medium leading-snug">
                Constancia con código único de verificación
              </p>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-indigo-50/80 rounded-xl p-3 text-xs text-indigo-900 flex items-start gap-2.5 border border-indigo-100">
            <div className="bg-[#5c4beb] text-white rounded-full p-1 flex-shrink-0 mt-0.5">
              <Info className="w-3.5 h-3.5" />
            </div>
            <p className="leading-relaxed">
              El aval académico y el valor curricular corresponden a las condiciones indicadas en la ficha de cada curso.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 relative z-10 border-t border-slate-100">
          <Link
            href="/cursos"
            onClick={onClose}
            className="w-full sm:w-auto bg-[#ff6b00] hover:bg-[#e05e00] text-white font-bold px-6 py-3.5 rounded-full shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 text-sm text-center"
          >
            <span>Ver cursos con aval académico</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            onClick={onClose}
            className="w-full sm:w-auto text-[#6355ff] hover:text-[#310ea0] font-bold px-5 py-3 rounded-full hover:bg-indigo-50 transition-colors text-sm text-center cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
