import { Quote, ArrowRight, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function Testimonials() {
  const testimonials = [
    {
      text: '"Gracias a EGAC pude obtener una constancia avalada que me ayudó a conseguir mejores oportunidades laborales."',
      name: 'María López',
      stars: 5,
      avatar: '/images/test1.jpg' // Assuming we don't have these, we'll use a placeholder or initials
    },
    {
      text: '"Los cursos son claros, prácticos y con contenido de calidad. La constancia tiene un gran valor curricular."',
      name: 'José Ramírez',
      stars: 5,
      avatar: '/images/test2.jpg'
    },
    {
      text: '"Me encantó la plataforma, es fácil de usar y los cursos realmente aportan a mi desarrollo profesional."',
      name: 'Ana González',
      stars: 5,
      avatar: '/images/test3.jpg'
    },
    {
      text: '"El aval académico me dio la confianza de que mi certificación tiene validez y prestigio."',
      name: 'Carlos Méndez',
      stars: 5,
      avatar: '/images/test4.jpg'
    }
  ]

  return (
    <section className="pt-8 pb-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex justify-between items-end mb-12">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
              <Quote className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Lo que dicen nuestros estudiantes</h2>
              <p className="text-gray-500 mt-1">Historias reales de personas que ya transformaron su futuro con EGAC.</p>
            </div>
          </div>
          <Link href="#testimonios" className="hidden md:flex items-center text-indigo-600 hover:text-indigo-800 font-medium group transition-colors">
            Ver todos los testimonios 
            <ArrowRight className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, idx) => (
            <div key={idx} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col h-full">
              <p className="text-gray-700 italic flex-grow mb-6 text-sm leading-relaxed">
                {t.text}
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  <span className="text-indigo-600 font-bold">{t.name.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">{t.name}</h4>
                  <div className="flex text-amber-400 mt-0.5">
                    {[...Array(t.stars)].map((_, i) => (
                      <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* WhatsApp FAB */}
      <a href="https://wa.me/5211234567890" target="_blank" rel="noopener noreferrer" className="fixed bottom-6 right-6 bg-white rounded-full p-2 pr-6 shadow-xl border border-gray-100 flex items-center gap-3 hover:shadow-2xl hover:scale-105 transition-all z-50 group">
        <div className="bg-green-500 w-12 h-12 rounded-full flex items-center justify-center">
          <MessageCircle className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">¿Tienes dudas?</p>
          <p className="text-gray-500 text-xs">Escríbenos por WhatsApp</p>
        </div>
      </a>
    </section>
  )
}
