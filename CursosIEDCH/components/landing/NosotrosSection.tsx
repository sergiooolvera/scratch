'use client'

import Image from 'next/image'
import { Target, Eye, ShieldCheck, Award, Building2, MapPin, Calendar, FileText } from 'lucide-react'

export default function NosotrosSection() {
  const valores = [
    { icon: '💡', name: 'Innovación' },
    { icon: '⭐', name: 'Excelencia' },
    { icon: '🤝', name: 'Integridad' },
    { icon: '🌱', name: 'Humanismo' },
    { icon: '👥', name: 'Colaboración' },
  ]

  return (
    <section id="nosotros" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold uppercase tracking-wider mb-4">
            <span>✨</span> Conócenos
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1b36] tracking-tight">
            Nuestra Identidad
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Descubre quiénes somos, nuestra trayectoria y el propósito que impulsa al Ecosistema Educativo EGAC.
          </p>
        </div>

        {/* Identity & Main Quote Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-[#0b1b36]">
              Transformando la educación a través de la innovación
            </h3>
            <p className="text-slate-600 leading-relaxed">
              El Ecosistema Educativo EGAC conecta el conocimiento de vanguardia con las necesidades reales del entorno profesional e institucional. Desarrollamos soluciones integrales de aprendizaje, acreditación y desarrollo de competencias.
            </p>
            <blockquote className="border-l-4 border-teal-500 pl-4 py-2 italic text-slate-700 bg-teal-50/50 rounded-r-lg font-medium">
              &quot;Lo que comenzó como un instituto, hoy es un ecosistema que integra aprendizaje, tecnología e innovación con visión de futuro.&quot;
            </blockquote>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-xl border border-slate-200 bg-white">
            <div className="relative h-72 sm:h-96 w-full">
              <Image
                src="/images/edu_collaboration.png"
                alt="Colaboración EGAC"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1b36]/80 via-transparent to-transparent" />
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-[#0b1b36]/90 backdrop-blur-md p-4 rounded-xl text-white border border-white/10">
              <span className="text-teal-400 font-bold text-lg block">EGAC</span>
              <p className="text-xs text-slate-300 mt-1">
                Innovación, tecnología e impacto real en Latinoamérica.
              </p>
            </div>
          </div>
        </div>

        {/* Misión y Visión Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          <div className="bg-white p-8 rounded-2xl shadow-md border-l-4 border-l-teal-500 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-teal-100 flex items-center justify-center text-teal-600 mb-6">
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#0b1b36] mb-3">Misión</h3>
            <p className="text-slate-600 leading-relaxed">
              Impulsar el desarrollo de personas y organizaciones mediante experiencias innovadoras de aprendizaje y crecimiento.
            </p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-md border-l-4 border-l-amber-500 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 mb-6">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-[#0b1b36] mb-3">Visión</h3>
            <p className="text-slate-600 leading-relaxed">
              Ser referentes en innovación, tecnología y transformación del aprendizaje en Latinoamérica.
            </p>
          </div>
        </div>

        {/* Valores */}
        <div className="text-center mb-16">
          <h3 className="text-2xl font-bold text-[#0b1b36] mb-2">Nuestros Valores</h3>
          <p className="text-slate-600 mb-8 max-w-xl mx-auto text-sm">
            Los pilares fundamentales que guían nuestro ecosistema y comunidad.
          </p>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {valores.map((v) => (
              <span
                key={v.name}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-slate-200 text-slate-800 text-sm font-semibold shadow-sm hover:border-indigo-300 hover:shadow transition-all"
              >
                <span>{v.icon}</span>
                <span>{v.name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Cultura & Ecosistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white p-8 rounded-2xl shadow-md border-t-4 border-teal-500 border border-slate-200">
            <h3 className="text-xl font-bold text-[#0b1b36] mb-3">Cultura Organizacional</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Fomentamos una cultura orientada a la innovación, la mejora continua y la generación de valor, donde las personas son el motor de la transformación.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl shadow-md border-t-4 border-[#0b1b36] border border-slate-200">
            <h3 className="text-xl font-bold text-[#0b1b36] mb-3">Nuestro Ecosistema</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              Integramos tecnología, conocimiento, certificación, capacitación e innovación en una plataforma diseñada para potenciar el crecimiento de personas, instituciones y organizaciones.
            </p>
          </div>
        </div>

        {/* Respaldo Institucional Section / Plaque */}
        <div className="pt-12 border-t border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6 space-y-4">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                Legalidad y Respaldo
              </span>
              <h3 className="text-3xl font-extrabold text-[#0b1b36]">
                Origen y Compromiso
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                Fundado en <strong className="text-[#0b1b36]">2020</strong>, el{' '}
                <strong className="text-[#0b1b36]">
                  Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C.
                </strong>{' '}
                nace con el propósito de contribuir al desarrollo de las personas y las organizaciones mediante la educación, la innovación y la tecnología.
              </p>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-base">
                A lo largo de su trayectoria, ha consolidado un <strong className="text-[#0b1b36]">portafolio de soluciones</strong> orientadas al fortalecimiento del aprendizaje, el desarrollo de competencias y la generación de oportunidades de crecimiento.
              </p>
            </div>

            {/* Plaque visual component */}
            <div className="lg:col-span-6">
              <div className="bg-gradient-to-br from-[#0b1b36] to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-2xl border border-amber-500/30 relative">
                <div className="border border-amber-400/40 rounded-xl p-6 relative bg-white/5 backdrop-blur-sm">
                  <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mx-auto mb-3 text-amber-300">
                      <Award className="w-6 h-6" />
                    </div>
                    <h4 className="text-amber-300 font-bold tracking-widest text-xs uppercase">
                      Respaldo Institucional
                    </h4>
                    <div className="w-16 h-0.5 bg-amber-400/50 mx-auto mt-2" />
                  </div>

                  <p className="text-center font-semibold text-slate-100 text-sm sm:text-base mb-6 leading-snug">
                    Instituto Educativo de Especialidades para la Conducta y el Desarrollo Humano S.C.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-start gap-2">
                      <Calendar className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-medium">Fundación</span>
                        <span className="font-semibold text-slate-200">10 de diciembre 2020</span>
                      </div>
                    </div>

                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-start gap-2">
                      <FileText className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-medium">Escritura Pública</span>
                        <span className="font-semibold text-slate-200">14,525</span>
                      </div>
                    </div>

                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-medium">Ubicación</span>
                        <span className="font-semibold text-slate-200">Metepec, Estado de México</span>
                      </div>
                    </div>

                    <div className="bg-white/5 p-3 rounded-lg border border-white/10 flex items-start gap-2">
                      <Building2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-slate-400 text-[10px] uppercase tracking-wider font-medium">RFC</span>
                        <span className="inline-block px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-mono font-bold text-xs mt-0.5">
                          IEE201210KE1
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
