'use client'

import { useState, useRef } from 'react'
import { Play, ShieldCheck, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function HeroSection() {
  const [hasStarted, setHasStarted] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play()
      setHasStarted(true)
    }
  }

  return (
    <section id="home" className="relative bg-[#0b1b36] pt-20 pb-10 lg:pt-28 lg:pb-12 overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/cover_bg_1_mexican.png"
          alt="Fondo EGAC"
          fill
          className="object-cover opacity-35 object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0b1b36] via-[#0b1b36]/80 to-[#0b1b36]/60" />
      </div>

      {/* Background abstract elements */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-50 transform translate-x-1/3 -translate-y-1/4"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Text Content */}
          <div className="text-white">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6">
              El presente <br className="hidden lg:block" />
              del futuro
            </h1>
            <p className="text-lg lg:text-xl text-gray-300 mb-10 max-w-lg">
              Formación, actualización y acreditación de competencias para impulsar tu desarrollo profesional y transformar tu futuro.
            </p>

            {/* Verifica tu constancia Card */}
            <Link href="/validar" className="bg-indigo-700/80 backdrop-blur-md rounded-2xl p-6 border border-indigo-500/30 flex items-center gap-6 max-w-md group hover:bg-indigo-600/80 transition-colors cursor-pointer block">
              <div className="flex-shrink-0 bg-blue-500 rounded-xl p-3">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-lg text-white mb-1">Verifica la autenticidad de tu constancia</h3>
                <p className="text-indigo-200 text-sm">Ingresa el código único de tu constancia para comprobar su validez.</p>
              </div>
              <ChevronRight className="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
            </Link>
          </div>

          {/* Right Video Content */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video bg-gray-900 group">
              <video
                ref={videoRef}
                src="/videoegac.mp4"
                poster="/images/videoegac_poster.jpg"
                playsInline
                preload="metadata"
                controls={hasStarted}
                onEnded={() => setHasStarted(false)}
                className="w-full h-full object-cover"
                aria-label="Video institucional de Grupo EGAC"
              >
                Tu navegador no soporta la reproducción de video.
              </video>

              {!hasStarted && (
                <div 
                  onClick={handlePlay}
                  className="absolute inset-0 bg-black/25 hover:bg-black/35 transition-colors flex items-center justify-center cursor-pointer group/btn"
                >
                  <button 
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handlePlay()
                    }}
                    aria-label="Reproducir video de Grupo EGAC"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-5 shadow-2xl shadow-indigo-600/60 transform group-hover/btn:scale-110 transition-transform flex items-center justify-center"
                  >
                    <Play className="w-10 h-10 ml-1 fill-white" />
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
