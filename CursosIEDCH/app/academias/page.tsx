import React from 'react'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, GraduationCap, Users, BookOpen, Layers, ChevronRight } from 'lucide-react'
import PopularAcademiesClient from '@/components/PopularAcademiesClient'

export const dynamic = 'force-dynamic'

export default async function AcademiasListPage() {
    const supabase = await createClient()

    // 1. Obtener todas las academias
    const { data: rawAcademias } = await supabase
        .from('ie_academias')
        .select('*')

    // 2. Obtener todos los grupos
    const { data: rawGrupos } = await supabase
        .from('ie_grupos')
        .select('id, academia_id')
        .eq('activo', true)

    // 3. Obtener relaciones de cursos-grupos
    const { data: rawGrupoCursos } = await supabase
        .from('ie_grupo_cursos')
        .select('grupo_id, curso_id')

    // 4. Obtener todas las compras para conteo de alumnos
    const { data: todasLasCompras } = await supabase
        .from('ie_compras')
        .select('curso_id, user_id')
        .eq('pagado', true)

    const academiasConAlumnos = rawAcademias?.map(academia => {
        const gruposDeAcademia = rawGrupos?.filter(g => g.academia_id === academia.id) || []
        const grupoIds = gruposDeAcademia.map(g => g.id)

        const cursosDeGrupos = rawGrupoCursos?.filter(rgc => grupoIds.includes(rgc.grupo_id)) || []
        const cursoIds = cursosDeGrupos.map(cg => cg.curso_id)

        const comprasDeAcademia = todasLasCompras?.filter(compra => cursoIds.includes(compra.curso_id)) || []
        const alumnosUnicosCount = new Set(comprasDeAcademia.map(c => c.user_id)).size

        return {
            ...academia,
            alumnosCount: Math.max(alumnosUnicosCount, 1),
            cursosCount: cursoIds.length,
            gruposCount: gruposDeAcademia.length
        }
    }) || []

    const academiasFallback = [
        {
            id: 'mock-1',
            nombre: 'Academia de Salud EGAC',
            descripcion: 'Espacio de formación continua para profesionales y estudiantes del área de la salud.',
            alumnosCount: 1250,
            cursosCount: 12,
            gruposCount: 8,
            color_principal: '#10b981',
            logo_url: null
        },
        {
            id: 'mock-2',
            nombre: 'Academia de Negocios EGAC',
            descripcion: 'Aprende finanzas, administración y desarrollo empresarial con expertos.',
            alumnosCount: 980,
            cursosCount: 6,
            gruposCount: 4,
            color_principal: '#3b82f6',
            logo_url: null
        },
        {
            id: 'mock-3',
            nombre: 'Academia de Tecnología EGAC',
            descripcion: 'Cursos de desarrollo web, inteligencia artificial y herramientas digitales.',
            alumnosCount: 850,
            cursosCount: 9,
            gruposCount: 6,
            color_principal: '#6366f1',
            logo_url: null
        },
        {
            id: 'mock-4',
            nombre: 'Academia de Idiomas EGAC',
            descripcion: 'Domina inglés, francés y otros idiomas con metodología conversacional.',
            alumnosCount: 760,
            cursosCount: 4,
            gruposCount: 3,
            color_principal: '#f59e0b',
            logo_url: null
        }
    ]

    const academiasMostradas = academiasConAlumnos.length > 0 ? academiasConAlumnos : academiasFallback

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans pb-16">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700 text-xs font-bold mb-6 transition-colors bg-white px-3.5 py-2 rounded-xl border border-zinc-200 shadow-2xs cursor-pointer"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Volver al Dashboard
                </Link>

                <div className="flex items-center gap-3.5 mb-8">
                    <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shadow-xs">
                        <GraduationCap className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-zinc-950 tracking-tight">
                            Academias Disponibles
                        </h1>
                        <p className="text-xs text-zinc-500 font-medium">
                            Explora y únete a los espacios exclusivos de aprendizaje.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {academiasMostradas.map((academia) => {
                        const iniciales = academia.nombre
                            .split(' ')
                            .map((w: string) => w[0])
                            .join('')
                            .substring(0, 2)
                            .toUpperCase()

                        const color = academia.color_principal || '#6366f1'

                        return (
                            <div key={academia.id} className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between min-h-[200px]">
                                <div>
                                    <div className="flex items-center gap-4 mb-4">
                                        {academia.logo_url ? (
                                            <img src={academia.logo_url} alt={academia.nombre} className="h-14 w-14 rounded-2xl object-cover border border-zinc-100" />
                                        ) : (
                                            <div 
                                                className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-black text-sm"
                                                style={{ backgroundColor: color }}
                                            >
                                                {iniciales}
                                            </div>
                                        )}
                                        <div>
                                            <h3 className="font-extrabold text-zinc-900 text-sm leading-tight">
                                                {academia.nombre}
                                            </h3>
                                            <div className="flex items-center gap-3 text-[10px] text-zinc-400 font-bold mt-1">
                                                <span className="flex items-center gap-1">
                                                    <Users className="h-3.5 w-3.5" />
                                                    {academia.alumnosCount?.toLocaleString() || 1} alumnos
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-zinc-500 text-xs font-medium leading-relaxed mb-6 line-clamp-2">
                                        {academia.descripcion || 'Espacio de formación y desarrollo continuo con cursos y grupos de estudio.'}
                                    </p>
                                </div>

                                <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                                    <div className="flex gap-4 text-[10px] text-zinc-400 font-bold">
                                        <span>{academia.cursosCount || 0} cursos</span>
                                        <span>{academia.gruposCount || 0} grupos</span>
                                    </div>
                                    <Link 
                                        href={`/academias/${academia.id}`}
                                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-[11px] px-4 py-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-indigo-600/10 flex items-center gap-1"
                                    >
                                        Ingresar
                                        <ChevronRight className="h-3 w-3" />
                                    </Link>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
