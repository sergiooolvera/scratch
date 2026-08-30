import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { MessageSquare } from 'lucide-react'
import { GoogleAnalytics } from '@next/third-parties/google'
import Script from 'next/script'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Grupo EGAC- Academy',
  description: 'Sistema Nacional de Evaluación y Registro Laboral',
  icons: {
    icon: '/mundo.jpeg',
    shortcut: '/mundo.jpeg',
    apple: '/mundo.jpeg',
  },
  other: {
    google: 'notranslate',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" translate="no" className="notranslate">
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

        {/* Script de Microsoft Clarity */}
        {process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID && (
          <Script id="microsoft-clarity" strategy="afterInteractive">
            {`
              (function(c,l,a,r,i,t,y){
                  c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                  t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                  y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "${process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID}");
            `}
          </Script>
        )}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
