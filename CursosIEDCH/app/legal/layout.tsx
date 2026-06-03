'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, FileText, GraduationCap, ArrowLeft, Scale } from 'lucide-react'

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const links = [
    {
      href: '/legal/aviso-privacidad',
      label: 'Aviso de Privacidad',
      icon: ShieldCheck,
      desc: 'Protección y manejo de datos personales'
    },
    {
      href: '/legal/terminos-uso',
      label: 'Términos de Uso',
      icon: FileText,
      desc: 'Reglas generales para todos los usuarios'
    },
    {
      href: '/legal/terminos-creadores',
      label: 'Términos para Creadores',
      icon: GraduationCap,
      desc: 'Lineamientos para instructores y creadores'
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50/50 pb-16 font-sans">
      {/* Premium Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 py-12 text-white shadow-md">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(59,130,246,0.2),transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Link href="/register" className="inline-flex items-center text-blue-200 hover:text-white mb-6 text-sm font-medium transition-all group">
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Volver al registro
          </Link>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm border border-blue-400/20">
              <Scale className="w-6 h-6 text-blue-300" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-slate-100">
              Centro Legal
            </h1>
          </div>
          <p className="text-blue-200 max-w-xl text-sm sm:text-base">
            Consulta nuestras políticas de privacidad, términos de uso de la plataforma y acuerdos de creador del Grupo EGAC.
          </p>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          
          {/* Sticky Sidebar Navigation */}
          <aside className="lg:col-span-1 lg:sticky lg:top-8 space-y-4">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-3 mb-3">
                Documentos Legales
              </h2>
              <nav className="space-y-1">
                {links.map((link) => {
                  const Icon = link.icon
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`group flex items-start p-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 font-medium'
                          : 'text-slate-650 hover:bg-slate-50 hover:text-slate-900 border-l-4 border-transparent'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mr-3 mt-0.5 flex-shrink-0 transition-colors ${
                        isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-650'
                      }`} />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{link.label}</span>
                        <span className={`text-xs mt-0.5 leading-relaxed ${
                          isActive ? 'text-blue-500/80' : 'text-slate-400 group-hover:text-slate-500'
                        }`}>
                          {link.desc}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>
            
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50/50 rounded-2xl p-5 border border-indigo-100/50">
              <h3 className="text-sm font-bold text-indigo-900 mb-2">¿Tienes alguna duda?</h3>
              <p className="text-xs text-indigo-700 leading-relaxed mb-3">
                Si requieres asistencia legal, aclaración de términos o solicitudes sobre tus datos, puedes contactarnos.
              </p>
              <a 
                href="mailto:soporte@egac.edu.mx" 
                className="inline-flex text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                soporte@egac.edu.mx
              </a>
            </div>
          </aside>

          {/* Main Content Area */}
          <main className="lg:col-span-3 bg-white rounded-2xl p-6 md:p-10 shadow-sm border border-slate-100">
            {children}
          </main>

        </div>
      </div>
    </div>
  )
}
