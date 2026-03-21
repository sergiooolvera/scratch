'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, History, Calendar } from 'lucide-react'

export default function HistorialCursoPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [historial, setHistorial] = useState<any[]>([])
    const [cursoInfo, setCursoInfo] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const supabase = createClient()

    useEffect(() => {
        const fetchData = async () => {
            // Get course info
            const { data: curso } = await supabase
                .from('ie_cursos')
                .select('titulo')
                .eq('id', id)
                .single()
            setCursoInfo(curso)

            // Get history with user profile relation if possible, or just raw data
            const { data: history } = await supabase
                .from('ie_curso_historial')
                .select('*, perfiles:ie_profiles(nombre)')
                .eq('curso_id', id)
                .order('created_at', { ascending: false })

            if (history) setHistorial(history)
            
            setLoading(false)
        }
        fetchData()
    }, [id, supabase])

    if (loading) return (
        <div className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50 p-8">
            <div className="text-gray-500 animate-pulse text-lg">Cargando historial...</div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans p-6 sm:p-10">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center space-x-4 mb-8">
                    <Link href="/profesor/cursos" className="p-2 bg-white rounded-full text-gray-500 hover:text-gray-900 shadow-sm border">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <History className="h-8 w-8 mr-3 text-blue-600" /> Historial de Cambios
                        </h1>
                        <p className="text-gray-500 mt-1">Curso: {cursoInfo?.titulo || 'Desconocido'}</p>
                    </div>
                </div>

                {historial.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No hay cambios registrados</h3>
                        <p className="text-gray-500 mt-1">Aún no has editado la información de este curso.</p>
                    </div>
                ) : (
                    <div className="relative border-l border-blue-200 ml-4 space-y-8 pb-4">
                        {historial.map((registro, idx) => {
                            const date = new Date(registro.created_at)
                            return (
                                <div key={registro.id || idx} className="relative pl-8">
                                    <div className="absolute -left-2.5 top-1.5 h-5 w-5 rounded-full bg-blue-100 border-4 border-white shadow-sm flex items-center justify-center">
                                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                                    </div>
                                    
                                    <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-100 relative">
                                        <div className="absolute top-4 right-4 text-xs font-semibold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md flex items-center">
                                            <Calendar className="h-3 w-3 mr-1.5" />
                                            {date.toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        <p className="text-sm font-medium text-blue-600 mb-1">
                                            {registro.perfiles?.nombre || 'Instructor'} <span className="text-gray-400 font-normal">actualizó el curso</span>
                                        </p>
                                        <p className="text-gray-800 text-base leading-relaxed mt-2 pr-28">
                                            "{registro.detalles_cambio}"
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
