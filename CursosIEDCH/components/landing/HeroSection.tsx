import { Play, ArrowRight, ShieldCheck, ChevronRight } from 'lucide-react'
import Image from 'next/image'

export default function HeroSection() {
  return (
    <section id="home" className="relative bg-[#0b1b36] pt-20 pb-10 lg:pt-28 lg:pb-12 overflow-hidden">
      {/* Background abstract elements if any */}
      <div className="absolute inset-0 z-0 opacity-20">
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
            <div className="bg-indigo-700/80 backdrop-blur-md rounded-2xl p-6 border border-indigo-500/30 flex items-center gap-6 max-w-md group hover:bg-indigo-600/80 transition-colors cursor-pointer">
              <div className="flex-shrink-0 bg-blue-500 rounded-xl p-3">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <div className="flex-grow">
                <h3 className="font-semibold text-lg text-white mb-1">Verifica la autenticidad de tu constancia</h3>
                <p className="text-indigo-200 text-sm">Ingresa el código único de tu constancia para comprobar su validez.</p>
              </div>
              <ChevronRight className="w-6 h-6 text-indigo-300 group-hover:text-white transition-colors" />
            </div>
          </div>

          {/* Right Video Content */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 aspect-video bg-gray-900 group">
              <Image 
                src="/images/cover_bg_1.jpg" 
                alt="Video Thumbnail" 
                fill 
                className="object-cover opacity-60"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-5 shadow-lg shadow-indigo-600/50 transform group-hover:scale-110 transition-all">
                  <Play className="w-10 h-10 ml-1" fill="currentColor" />
                </button>
              </div>

              <div className="absolute top-6 left-6 flex items-center gap-3">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-lg border border-white/20 flex items-center gap-2">
                   <span className="font-bold text-white tracking-wider">GRUPO EGAC</span>
                   <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
              </div>

              <div className="absolute bottom-6 left-6 text-white">
                <h3 className="text-2xl font-bold mb-2">Bienvenido a EGAC</h3>
                <p className="text-gray-300 max-w-sm text-sm">Conoce nuestra misión, visión y el impacto que generamos.</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
