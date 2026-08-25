import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, TrendingUp, Search, Clock, FileText } from 'lucide-react'
import CourseCard from '@/components/CourseCard'

export default async function PopularCourses() {
  const supabase = await createClient()

  const MAESTRO_ID = 'f160fe4d-5461-44c5-b868-51f1f0cae4c2'

  // Fetch published courses, limit to 4 to match the design roughly
  const { data: courses, error } = await supabase
    .from('ie_cursos')
    .select(`
      id, titulo, descripcion, instructor, precio, estado, es_super_curso, categoria, imagen_url, duracion,
      profesor:ie_profiles!creado_por (
        nombre, apellido_paterno, apellido_materno, fotografia_perfil, verificado, rol
      )
    `)
    .eq('estado', 'aprobado')
    .neq('creado_por', MAESTRO_ID)
    .limit(4)

  const formatBadgeDuracion = (duracion?: string | null) => {
    if (!duracion || !duracion.trim()) return '20 HRS'
    const numMatch = duracion.match(/\d+/)
    if (numMatch) {
      const num = parseInt(numMatch[0], 10)
      return `${num} ${num === 1 ? 'HR' : 'HRS'}`
    }
    return duracion.toUpperCase()
  }

  // Fetch distinct categories from ie_cursos
  const { data: dbCursosCategories } = await supabase
    .from('ie_cursos')
    .select('categoria')
    .eq('estado', 'aprobado')
    .neq('creado_por', MAESTRO_ID)

  const baseCategories = [
    { value: 'todas', label: 'Todas las categorías' },
    { value: 'salud', label: 'Salud' },
    { value: 'negocios', label: 'Negocios' },
    { value: 'tecnologia', label: 'Tecnología' },
    { value: 'desarrollo', label: 'Desarrollo Personal' },
    { value: 'idiomas', label: 'Idiomas' },
    { value: 'arte', label: 'Arte y Diseño' },
    { value: 'ciencias', label: 'Ciencias' },
    { value: 'educacion', label: 'Educación' },
  ]

  const existingValues = new Set(baseCategories.map(c => c.value.toLowerCase()))
  const extraCategories: { value: string; label: string }[] = []

  if (dbCursosCategories) {
    dbCursosCategories.forEach(row => {
      if (row.categoria && row.categoria.trim()) {
        const val = row.categoria.trim()
        const valLower = val.toLowerCase()
        if (!existingValues.has(valLower)) {
          existingValues.add(valLower)
          extraCategories.push({ value: valLower, label: val })
        }
      }
    })
  }

  const allCategories = [...baseCategories, ...extraCategories]

  return (
    <section className="pt-2 pb-8 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Search Bar Area */}
        <form action="/cursos" method="GET" className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-grow flex items-center bg-gray-50 rounded-lg px-4 py-3 w-full">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input 
              type="text" 
              name="q"
              placeholder="Buscar cursos, temas o palabras clave..." 
              className="bg-transparent border-none outline-none w-full text-gray-700"
            />
          </div>
          <div className="flex gap-4 w-full md:w-auto">
            <select name="category" className="bg-gray-50 border-none outline-none text-gray-700 py-3 px-4 rounded-lg flex-grow md:flex-grow-0 cursor-pointer text-sm font-medium">
              {allCategories.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <select name="academies" className="bg-gray-50 border-none outline-none text-gray-700 py-3 px-4 rounded-lg flex-grow md:flex-grow-0 cursor-pointer text-sm font-medium">
              <option value="">Todas las academias</option>
              <option value="verificadas">Academias verificadas</option>
            </select>
          </div>
          <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium w-full md:w-auto transition-colors">
            Buscar
          </button>
        </form>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#310ea0] rounded-full flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Cursos populares</h2>
              <p className="text-gray-500 mt-1 text-sm md:text-base">Descubre los cursos más elegidos por nuestra comunidad.</p>
            </div>
          </div>
          <Link href="/cursos" className="hidden md:flex items-center bg-[#310ea0] hover:bg-[#25097a] text-white px-6 py-3 rounded-xl font-medium transition-colors whitespace-nowrap">
            Explorar todos los cursos 
            <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>

        <div className="flex flex-col xl:flex-row gap-6 items-start">
          {/* Course Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 flex-grow">
            {courses && courses.map((course: any) => {
              const imageUrl = course.imagen_url && course.imagen_url.trim() ? course.imagen_url : '/mundo.jpeg'
              const duracionBadge = formatBadgeDuracion(course.duracion)

              return (
              <div key={course.id} className={`bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col group ${course.es_super_curso ? 'sm:col-span-2 lg:col-span-2' : ''}`}>
                <div className="relative aspect-[16/10]">
                  <Image src={imageUrl} alt={course.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 bg-[#310ea0]/90 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center tracking-wider">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{duracionBadge}</span>
                  </div>
                </div>
                
                <div className="p-5 flex flex-col flex-grow justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 leading-snug">{course.titulo}</h3>
                    
                    {course.descripcion && (
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                        {course.descripcion}
                      </p>
                    )}

                    <div className="flex items-center gap-1.5 mb-4 text-[11px] text-gray-500 w-max">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Constancia + Microcredencial</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="font-extrabold text-[#310ea0] text-lg">
                      {course.precio > 0 ? `$${course.precio} MXN` : 'Gratis'}
                    </span>
                    <Link href={`/cursos/${course.id}`} className="text-xs font-bold text-[#310ea0] hover:bg-indigo-50 border border-[#310ea0] px-4 py-2 rounded-lg transition-colors">
                      Ver curso
                    </Link>
                  </div>
                </div>
              </div>
              )
            })}
          </div>

          {/* Aval Académico Banner */}
          <div className="bg-gradient-to-b from-[#f99300] to-[#f59e0b] rounded-2xl p-6 sm:p-8 text-white flex flex-col items-center justify-center text-center shadow-xl shadow-orange-500/20 xl:w-[320px] flex-shrink-0">
            <div className="mb-4">
              <svg className="w-16 h-16 sm:w-20 sm:h-20 text-white opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 14v7" />
              </svg>
            </div>
            <h2 className="text-3xl font-black mb-3 leading-tight tracking-wide">AVAL<br/>ACADÉMICO</h2>
            <p className="text-orange-50 text-[15px] mb-6 leading-relaxed">
              Nuestros cursos cuentan con respaldo de instituciones educativas y organismos especializados.
            </p>
            <button className="bg-white text-orange-600 font-bold px-6 py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors w-full">
              Conoce más <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </section>
  )
}
