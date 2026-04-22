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
}

export default function CourseCard({ course, isPagado }: { course: Course; isPagado?: boolean }) {
    const isSuper = !!course.es_super_curso

    return (
        <div
            className={
                `relative bg-white overflow-hidden shadow rounded-lg flex flex-col ` +
                (isSuper ? 'ring-2 ring-amber-300 sm:col-span-2 lg:col-span-2 rounded-2xl shadow-lg' : '')
            }
        >
            {isSuper && (
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-400 via-fuchsia-500 to-indigo-500" />
            )}

            <div className={isSuper ? 'px-5 py-6 sm:p-7 flex-grow' : 'px-4 py-5 sm:p-6 flex-grow'}>
                {isSuper && (
                    <div className="mb-3">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Sparkles className="w-4 h-4" />
                            Super Curso
                        </span>
                    </div>
                )}

                <h3 className={isSuper ? 'text-xl leading-7 font-extrabold text-gray-900' : 'text-lg leading-6 font-medium text-gray-900'}>
                    {course.titulo}
                </h3>

                <p className={isSuper ? 'mt-2 text-sm text-gray-600 line-clamp-3' : 'mt-1 max-w-2xl text-sm text-gray-500 line-clamp-2'}>
                    {course.descripcion}
                </p>

                <div className={isSuper ? 'mt-4 flex items-center text-sm font-semibold text-indigo-700' : 'mt-3 flex items-center text-sm font-medium text-blue-600'}>
                    Instructor: {course.instructor}
                </div>
            </div>

            <div className={(isSuper ? 'bg-gradient-to-r from-amber-50 via-white to-indigo-50 ' : 'bg-gray-50 ') + 'px-4 py-4 sm:px-6 mt-auto'}>
                <Link
                    href={`/cursos/${course.id}`}
                    className={
                        'w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ' +
                        (isSuper
                            ? 'bg-indigo-600 hover:bg-indigo-700'
                            : 'bg-blue-600 hover:bg-blue-700')
                    }
                >
                    {isPagado ? 'Ir al Curso' : 'Ver Detalles'}
                </Link>
            </div>
        </div>
    )
}
