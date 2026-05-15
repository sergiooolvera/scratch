import Link from 'next/link'
import { Sparkles } from 'lucide-react'

interface Course {
    id: string
    titulo: string
    descripcion: string
    instructor: string
    precio: number
    estado: string
    es_super_curso?: boolean
    categoria?: string
}

const catLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
    desarrollo: { label: '🧠 Desarrollo Humano', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
    salud: { label: '🩺 Salud y Medicina', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
    arte: { label: '🎨 Arte y Cultura', bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
    tecnologia: { label: '💻 Tecnología y Ciencia', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
    educacion: { label: '📚 Educación', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
}

export default function CourseCard({ course, isPagado }: { course: Course; isPagado?: boolean }) {
    const isSuper = !!course.es_super_curso
    const cat = catLabels[course.categoria || 'desarrollo'] || catLabels.desarrollo

    return (
        <div
            className={
                `relative bg-white overflow-hidden shadow rounded-lg flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-100 ` +
                (isSuper ? 'ring-2 ring-amber-300 sm:col-span-2 lg:col-span-2 rounded-2xl shadow-lg' : '')
            }
        >
            {isSuper && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-fuchsia-500 to-indigo-500" />
            )}

            <div className={isSuper ? 'px-5 py-6 sm:p-7 flex-grow' : 'px-4 py-5 sm:p-6 flex-grow'}>
                <div className="flex flex-wrap gap-2 mb-3.5">
                    {isSuper && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-sm uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                            Super Curso
                        </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border shadow-xs uppercase tracking-wider ${cat.bg} ${cat.text} ${cat.border}`}>
                        {cat.label}
                    </span>
                </div>

                <h3 className={isSuper ? 'text-xl leading-7 font-extrabold text-gray-900' : 'text-lg leading-6 font-bold text-gray-900'}>
                    {course.titulo}
                </h3>

                <p className={isSuper ? 'mt-2 text-sm text-gray-600 line-clamp-3' : 'mt-1.5 max-w-2xl text-sm text-gray-500 line-clamp-2'}>
                    {course.descripcion}
                </p>

                <div className={isSuper ? 'mt-4 flex items-center text-sm font-semibold text-indigo-700' : 'mt-3.5 flex items-center text-sm font-medium text-blue-600'}>
                    Instructor: {course.instructor}
                </div>
            </div>

            <div className={(isSuper ? 'bg-gradient-to-r from-amber-50 via-white to-indigo-50 ' : 'bg-gray-50 ') + 'px-4 py-4 sm:px-6 mt-auto'}>
                <Link
                    href={`/cursos/${course.id}`}
                    className={
                        'w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-bold rounded-full shadow-sm text-white transition-all duration-200 ' +
                        (isSuper
                            ? 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-100'
                            : 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-100')
                    }
                >
                    {isPagado ? 'Ir a Curso' : 'Ver Detalles'}
                </Link>
            </div>
        </div>
    )
}

