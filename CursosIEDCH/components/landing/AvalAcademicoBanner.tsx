'use client'

import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import AvalAcademicoModal from './AvalAcademicoModal'

export default function AvalAcademicoBanner() {
  const [isModalOpen, setIsModalOpen] = useState(false)

  return (
    <>
      <div 
        onClick={() => setIsModalOpen(true)}
        className="bg-gradient-to-b from-[#f99300] to-[#f59e0b] rounded-2xl p-6 sm:p-8 text-white flex flex-col items-center justify-center text-center shadow-xl shadow-orange-500/20 xl:w-[320px] flex-shrink-0 cursor-pointer hover:shadow-2xl hover:scale-[1.01] transition-all group"
      >
        <div className="mb-4 transform group-hover:scale-110 transition-transform">
          <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
          </svg>
        </div>
        <h2 className="text-3xl font-black mb-3 leading-tight tracking-wide">AVAL<br/>ACADÉMICO</h2>
        <p className="text-orange-50 text-[15px] mb-6 leading-relaxed">
          Nuestros cursos cuentan con respaldo de instituciones educativas y organismos especializados.
        </p>
        <button 
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setIsModalOpen(true)
          }}
          className="bg-white text-orange-600 font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors w-full shadow-md"
        >
          Conoce más <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <AvalAcademicoModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  )
}
