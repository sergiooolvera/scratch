import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, MessageCircle, Mail, MapPin, Phone } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-[#0b1b36] text-white pt-16 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          <div>
            <div className="bg-white inline-block rounded-md p-2 mb-6">
              <Image src="/images/logoGrupoEgac.jpeg" alt="Logo EGAC" width={120} height={40} className="h-10 w-auto" />
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              Transformando el futuro a través de la educación. Ofrecemos herramientas, validación y certificación para impulsar el desarrollo profesional.
            </p>
            <div className="flex gap-4">
              <a 
                href="https://www.facebook.com/share/1ATRDoAfoQ/?mibextid=wwXIfr" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Facebook EGAC"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-600 transition-colors"
              >
                <Facebook className="w-5 h-5 text-gray-300" />
              </a>
              <a 
                href="https://www.instagram.com/academy_egac?igsh=MW82OTczb2hoamI5bw%3D%3D&utm_source=qr" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Instagram EGAC"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-pink-600 transition-colors"
              >
                <Instagram className="w-5 h-5 text-gray-300" />
              </a>
              <a 
                href="https://wa.me/527298184978" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="WhatsApp EGAC"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-emerald-600 transition-colors"
              >
                <MessageCircle className="w-5 h-5 text-gray-300" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Plataforma</h4>
            <ul className="space-y-3">
              <li><Link href="/" className="text-gray-400 hover:text-white transition-colors text-sm">Inicio</Link></li>
              <li><Link href="/nosotros" className="text-gray-400 hover:text-white transition-colors text-sm">Nosotros</Link></li>
              <li><Link href="/cursos" className="text-gray-400 hover:text-white transition-colors text-sm">Catálogo de Cursos</Link></li>
              <li><Link href="/validar" className="text-gray-400 hover:text-white transition-colors text-sm">Validar Constancia</Link></li>
              <li><Link href="/preguntas-frecuentes" className="text-gray-400 hover:text-white transition-colors text-sm">Preguntas Frecuentes</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Participa</h4>
            <ul className="space-y-3">
              <li><Link href="/login" className="text-gray-400 hover:text-white transition-colors text-sm">Alumnos (Login)</Link></li>
              <li><Link href="/register?type=instructor" className="text-gray-400 hover:text-white transition-colors text-sm">Soy Instructor</Link></li>
              <li><Link href="/register?type=institucion" className="text-gray-400 hover:text-white transition-colors text-sm">Soy Institución</Link></li>
              <li><Link href="/contacto" className="text-gray-400 hover:text-white transition-colors text-sm">Contacto Directo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold mb-6">Contacto</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-indigo-400 mt-0.5" />
                <span className="text-gray-400 text-sm">Metepec, Estado de México</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-indigo-400" />
                <a href="https://wa.me/527298184978" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors text-sm">
                  +52 (729) 818-4978
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-indigo-400" />
                <a href="mailto:soporte@grupoegac.com" className="text-gray-400 hover:text-white transition-colors text-sm">
                  soporte@grupoegac.com
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm text-center md:text-left">
            &copy; {new Date().getFullYear()} Grupo EGAC. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/legal/aviso-privacidad" className="hover:text-white transition-colors">Aviso de Privacidad</Link>
            <Link href="/legal/terminos-uso" className="hover:text-white transition-colors">Términos y Condiciones</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
