import Link from 'next/link'
import { siteConfig } from '@/config/site'

export default function Footer() {
  return (
    <footer className="bg-surface-container border-t border-outline-variant/30 w-full rounded-t-xl mt-12">
      <div className="py-16 px-margin-mobile md:px-margin-desktop flex flex-col md:flex-row justify-between items-start gap-12 max-w-container-max mx-auto">
        {/* Brand & Copyright */}
        <div className="flex flex-col gap-6 max-w-xs">
          <div className="font-display text-3xl font-black text-primary tracking-tighter flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-4xl">celebration</span>
            {siteConfig.name}
          </div>
          <p className="text-on-surface-variant leading-relaxed">
            Creando momentos dulces y abrazables para personas especiales en todo el mundo.
          </p>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-110 transition-transform" href="#"><span className="material-symbols-outlined text-lg">share</span></a>
            <a className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:scale-110 transition-transform" href="#"><span className="material-symbols-outlined text-lg">favorite</span></a>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="font-bold text-on-surface uppercase text-xs tracking-widest">Empresa</h4>
            <ul className="space-y-3 text-on-surface-variant">
              <li><Link className="hover:text-primary transition-colors" href="/sobre-nosotros">Sobre Nosotros</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/sobre-nosotros">Trabaja con nosotros</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/">Blog</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-on-surface uppercase text-xs tracking-widest">Soporte</h4>
            <ul className="space-y-3 text-on-surface-variant">
              <li><Link className="hover:text-primary transition-colors" href="/envios">Envíos</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/envios">Devoluciones</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/faq">FAQ</Link></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-on-surface uppercase text-xs tracking-widest">Legal</h4>
            <ul className="space-y-3 text-on-surface-variant">
              <li><Link className="hover:text-primary transition-colors" href="/terminos">Privacidad</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/terminos">Términos</Link></li>
              <li><Link className="hover:text-primary transition-colors" href="/terminos">Cookies</Link></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-outline-variant/20 py-8 text-center text-on-surface-variant text-sm">
        © 2024 {siteConfig.name}. Todos los derechos reservados. Hecho con ❤️ y mucha dulzura.
      </div>
    </footer>
  )
}
