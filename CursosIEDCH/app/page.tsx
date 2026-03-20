import Link from 'next/link'
import { BookOpen, GraduationCap, ShieldCheck, LayoutDashboard } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <div className="bg-gradient-to-br from-blue-50 to-white min-h-[calc(100vh-64px)] font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-extrabold tracking-tight text-slate-900 sm:text-7xl">
          El conocimiento que transformará tu futuro
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg tracking-tight text-slate-700">
          Únete a la plataforma líder de educación en línea. Aprende de los mejores profesionales, presenta exámenes interactivos y obtén constancias con valor curricular instantáneas.
        </p>
        <div className="mt-10 flex justify-center gap-x-6">
          {user ? (
            <Link
              href="/dashboard"
              className="group inline-flex items-center justify-center rounded-full py-3 px-8 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-blue-600 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900 shadow-lg shadow-blue-200 transition-all"
            >
              <LayoutDashboard className="h-5 w-5 mr-2" />
              Ir a mi Panel Principal
            </Link>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="group inline-flex items-center justify-center rounded-full py-3 px-8 text-sm font-semibold focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 bg-blue-600 text-white hover:bg-slate-700 hover:text-slate-100 active:bg-slate-800 active:text-slate-300 focus-visible:outline-slate-900 shadow-lg shadow-blue-200 transition-all"
              >
                Explorar Cursos
              </Link>
              <Link
                href="/register"
                className="group inline-flex ring-1 ring-slate-200 items-center justify-center rounded-full py-3 px-8 text-sm font-semibold focus:outline-none hover:ring-slate-300 active:bg-slate-100 active:text-slate-600 focus-visible:outline-blue-600 focus-visible:ring-slate-300 text-slate-900 transition-all"
              >
                Registrarse Gratis
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="h-14 w-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
              <BookOpen className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Cursos de Excelencia</h3>
            <p className="text-slate-600">Material didáctico moderno preparado por profesionales de la industria.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="h-14 w-14 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Evaluación Contínua</h3>
            <p className="text-slate-600">Mide tu conocimiento con nuestros exámenes interactivos al concluir cada módulo.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="h-14 w-14 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-600 mb-6">
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Constancias PDF</h3>
            <p className="text-slate-600">Al aprobar obtienes automáticamente un diploma con valor curricular listo para imprimir.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
