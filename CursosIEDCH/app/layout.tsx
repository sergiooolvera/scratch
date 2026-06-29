import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Portal Cursos Grupo EGAC',
  description: 'Sistema Nacional de Evaluación y Registro Laboral',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Navbar />
        <main>{children}</main>
        
        {/* Botón Flotante de Comentarios y Sugerencias */}
        <div className="fixed bottom-6 right-6 z-40">
          <Link
            href="/comentarios"
            id="btn-comentarios-sugerencias"
            className="flex items-center gap-2 px-4 py-2.5 bg-white/90 hover:bg-white dark:bg-slate-900/90 dark:hover:bg-slate-900 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-full shadow-lg hover:shadow-xl text-slate-700 dark:text-slate-200 text-xs font-semibold tracking-wide transition-all duration-300 hover:-translate-y-1 hover:border-blue-300/50 group active:scale-95"
          >
            <MessageSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform duration-300" />
            <span>Comentarios y sugerencias</span>
          </Link>
        </div>
      </body>
    </html>
  )
}

