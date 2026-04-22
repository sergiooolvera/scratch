'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Edit, BookOpen, Clock, Activity, History, Mail, Loader2 } from 'lucide-react'

export default function ProfesorCursosPage() {
    const [cursos, setCursos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [notifying, setNotifying] = useState<string | null>(null)
    const supabase = createClient()

    useEffect(() => {
        const fetchCursos = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data } = await supabase
                .from('ie_cursos')
                .select('*')
                .eq('creado_por', user.id)
                .order('created_at', { ascending: false })

            if (data) setCursos(data)
            setLoading(false)
        }
        fetchCursos()
    }, [supabase])

    const handleNotify = async (cursoId: string, titulo: string) => {
        try {
            setNotifying(cursoId)
            const res = await fetch('/api/profesor/notificar-reunion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cursoId })
            })
            const data = await res.json()
            if (res.ok) {
                alert(`✅ Notificación enviada con éxito a los alumnos de: ${titulo}`)
            } else {
                throw new Error(`${data.error}\n\nDetalles: ${data.details || 'Sin detalles extra'}`)
            }
        } catch (error: any) {
            alert(error.message)
        } finally {
            setNotifying(null)
        }
    }

    if (loading) return (
        <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-zinc-50">
            <div className="text-gray-500 animate-pulse text-lg">Cargando tus cursos...</div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans p-6 sm:p-10">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                            <BookOpen className="h-8 w-8 mr-3 text-blue-600" /> Mis Cursos Creados
                        </h1>
                        <p className="text-gray-500 mt-2">Gestiona y edita los cursos que has publicado.</p>
                    </div>
                    <Link href="/profesor/subir-curso" className="bg-blue-600 text-white px-5 py-2.5 rounded-full font-medium shadow-sm hover:bg-blue-700 transition">
                        + Subir Nuevo Curso
                    </Link>
                </div>

                {cursos.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                        <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No tienes cursos</h3>
                        <p className="text-gray-500 mt-1">Aún no has creado ningún curso.</p>
                    </div>
                ) : (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {cursos.map(curso => (
                            <div key={curso.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col hover:border-blue-200 transition">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-bold text-xl text-gray-900 leading-tight">{curso.titulo}</h3>
                                    {(curso.reunion_url || curso.nota_profesor) && (
                                        <button 
                                            onClick={() => handleNotify(curso.id, curso.titulo)}
                                            disabled={notifying === curso.id}
                                            title="Enviar por correo link de reunión y avisos a los alumnos inscritos"
                                            className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 flex items-center justify-center transition-colors disabled:opacity-50"
                                        >
                                            {notifying === curso.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                                        </button>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 space-y-1 mb-6 flex-grow">
                                    <p className="flex items-center"><Clock className="h-4 w-4 mr-1.5" /> {curso.duracion}</p>
                                    <p className="flex items-center"><Activity className="h-4 w-4 mr-1.5" /> Estado: <span className="ml-1 capitalize text-blue-600 font-medium">{curso.estado}</span></p>
                                    <p className="flex items-center font-semibold text-gray-700 mt-2">${curso.precio} MXN</p>
                                    {(curso.reunion_url || curso.nota_profesor) && (
                                        <p className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-full inline-block mt-2">
                                            ✓ Tiene info de reunión/avisos
                                        </p>
                                    )}
                                </div>
                                
                                <div className="flex space-x-2 mt-auto border-t border-gray-50 pt-4">
                                    <Link href={`/profesor/editar-curso/${curso.id}`} className="flex-1 flex justify-center items-center bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-100 transition">
                                        <Edit className="h-4 w-4 mr-1.5" /> Editar
                                    </Link>
                                    <Link href={`/profesor/cursos/${curso.id}/historial`} className="flex-1 flex justify-center items-center border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                                        <History className="h-4 w-4 mr-1.5" /> Historial
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
