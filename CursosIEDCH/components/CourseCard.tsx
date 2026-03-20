import Link from 'next/link'

interface Course {
    id: string
    titulo: string
    descripcion: string
    instructor: string
    precio: number
    estado: string
}

export default function CourseCard({ course, isPagado }: { course: Course; isPagado?: boolean }) {
    return (
        <div className="bg-white overflow-hidden shadow rounded-lg flex flex-col">
            <div className="px-4 py-5 sm:p-6 flex-grow">
                <h3 className="text-lg leading-6 font-medium text-gray-900">{course.titulo}</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500 line-clamp-2">{course.descripcion}</p>
                <div className="mt-3 flex items-center text-sm font-medium text-blue-600">
                    Instructor: {course.instructor}
                </div>
            </div>
            <div className="bg-gray-50 px-4 py-4 sm:px-6 mt-auto">
                <Link
                    href={`/cursos/${course.id}`}
                    className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                >
                    {isPagado ? 'Ir al Curso' : 'Ver Detalles'}
                </Link>
            </div>
        </div>
    )
}
