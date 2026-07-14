'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
    Users, 
    BookOpen, 
    Plus, 
    ChevronRight, 
    ArrowLeft,
    Lightbulb,
    X,
    Loader2
} from 'lucide-react'

interface Grupo {
    id: string
    nombre: string
    descripcion: string
    imagen_url?: string
    activo: boolean
    created_at: string
    alumnos_count?: number
    cursos_count?: number
}

interface PageProps {
    params: Promise<{ id: string }>
}

export default function MisGruposPage({ params }: PageProps) {
    const { id: academiaId } = use(params)
    const router = useRouter()
    const supabase = createClient()
    
    const [grupos, setGrupos] = useState<Grupo[]>([])
    const [loading, setLoading] = useState(true)
    const [academiaNombre, setAcademiaNombre] = useState('Academia')
    
    // Estado del Modal
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [nuevoNombre, setNuevoNombre] = useState('')
    const [nuevaDesc, setNuevaDesc] = useState('')
    const [imageFile, setImageFile] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string>('')
    const [creandoGrupo, setCreandoGrupo] = useState(false)
    const [error, setError] = useState('')

    // Cargar información inicial
    useEffect(() => {
        async function loadData() {
            try {
                // 1. Obtener nombre de la academia
                const { data: academia } = await supabase
                    .from('ie_academias')
                    .select('nombre')
                    .eq('id', academiaId)
                    .single()
                
                if (academia) {
                    setAcademiaNombre(academia.nombre)
                }

                // 2. Obtener grupos con conteo de relaciones
                const { data: gruposData, error: errGrupos } = await supabase
                    .from('ie_grupos')
                    .select(`
                        id,
                        nombre,
                        descripcion,
                        imagen_url,
                        activo,
                        created_at,
                        ie_grupo_alumnos(id),
                        ie_grupo_cursos(id)
                    `)
                    .eq('academia_id', academiaId)
                    .order('created_at', { ascending: false })

                if (errGrupos) throw errGrupos

                if (gruposData) {
                    const formatted: Grupo[] = gruposData.map((g: any) => ({
                        id: g.id,
                        nombre: g.nombre,
                        descripcion: g.descripcion,
                        imagen_url: g.imagen_url,
                        activo: g.activo,
                        created_at: g.created_at,
                        alumnos_count: g.ie_grupo_alumnos?.length || 0,
                        cursos_count: g.ie_grupo_cursos?.length || 0
                    }))
                    setGrupos(formatted)
                }
            } catch (e) {
                console.error('Error cargando grupos:', e)
            } finally {
                setLoading(false)
            }
        }
        loadData()
    }, [academiaId])

    // Manejar creación de grupo
    async function handleCrearGrupo(e: React.FormEvent) {
        e.preventDefault()
        if (!nuevoNombre.trim()) {
            setError('El nombre del grupo es obligatorio.')
            return
        }

        setCreandoGrupo(true)
        setError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            let uploadedUrl = ''
            if (imageFile) {
                const ext = imageFile.name.split('.').pop()
                const fileName = `grupo_${user.id}_${Date.now()}.${ext}`
                const { error: upErr } = await supabase.storage.from('perfiles').upload(fileName, imageFile)
                if (upErr) throw new Error('Error al subir la imagen: ' + upErr.message)
                uploadedUrl = supabase.storage.from('perfiles').getPublicUrl(fileName).data.publicUrl
            } else {
                // Imagen por defecto
                uploadedUrl = 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=300&q=80'
            }

            const { data: nuevoGrupo, error: errInsert } = await supabase
                .from('ie_grupos')
                .insert({
                    academia_id: academiaId,
                    creado_por: user.id,
                    nombre: nuevoNombre.trim(),
                    descripcion: nuevaDesc.trim(),
                    imagen_url: uploadedUrl,
                    activo: true
                })
                .select()
                .single()

            if (errInsert) throw errInsert

            if (nuevoGrupo) {
                const nuevo: Grupo = {
                    id: nuevoGrupo.id,
                    nombre: nuevoGrupo.nombre,
                    descripcion: nuevoGrupo.descripcion,
                    imagen_url: nuevoGrupo.imagen_url,
                    activo: nuevoGrupo.activo,
                    created_at: nuevoGrupo.created_at,
                    alumnos_count: 0,
                    cursos_count: 0
                }
                setGrupos(prev => [nuevo, ...prev])
                setIsModalOpen(false)
                setNuevoNombre('')
                setNuevaDesc('')
                setImageFile(null)
                setImagePreview('')
            }
        } catch (e: any) {
            setError(e.message || 'Ocurrió un error al crear el grupo.')
        } finally {
            setCreandoGrupo(false)
        }
    }

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] font-sans antialiased text-slate-800 pb-16 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                
                {/* Cabecera de Retorno */}
                <Link 
                    href={`/profesor/academias/${academiaId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Volver a {academiaNombre}
                </Link>

                {/* Fila del Título y Botón */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                            Mis Grupos
                        </h1>
                        <p className="text-slate-500 text-sm mt-1">
                            Aquí puedes ver y administrar todos los grupos de tu academia.
                        </p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-3 rounded-2xl shadow-xs transition-colors shrink-0"
                    >
                        <Plus className="h-4 w-4" /> Crear grupo
                    </button>
                </div>

                {/* Listado de Grupos */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                        <p className="text-sm text-slate-400 mt-2">Cargando grupos...</p>
                    </div>
                ) : grupos.length > 0 ? (
                    <div className="space-y-4">
                        {grupos.map((grupo, idx) => {
                            // Paleta de colores para los avatares
                            const colors = [
                                { bg: 'bg-indigo-50 shadow-indigo-100', text: 'text-indigo-600' },
                                { bg: 'bg-emerald-50 shadow-emerald-100', text: 'text-emerald-600' },
                                { bg: 'bg-amber-50 shadow-amber-100', text: 'text-amber-600' },
                                { bg: 'bg-sky-50 shadow-sky-100', text: 'text-sky-600' }
                            ]
                            const style = colors[idx % colors.length]

                            return (
                                <Link 
                                    key={grupo.id}
                                    href={`/profesor/academias/${academiaId}/grupos/${grupo.id}`}
                                    className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-5 flex flex-col sm:flex-row justify-between items-center gap-4 hover:shadow-md hover:border-slate-300 transition-all group w-full"
                                >
                                    <div className="flex items-center gap-4 flex-1 w-full">
                                        <div className="h-14 w-14 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300 border border-slate-200 animate-in fade-in">
                                            {grupo.imagen_url ? (
                                                <img 
                                                    src={grupo.imagen_url} 
                                                    alt={grupo.nombre} 
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Users className="h-7 w-7 text-indigo-600" />
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="text-lg font-bold text-slate-900 truncate">
                                                {grupo.nombre}
                                            </h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                                                <span className="flex items-center gap-0.5">
                                                    <Users className="h-3 w-3" /> {grupo.alumnos_count} {grupo.alumnos_count === 1 ? 'alumno' : 'alumnos'}
                                                </span>
                                                <span className="text-slate-300">•</span>
                                                <span className="flex items-center gap-0.5">
                                                    <BookOpen className="h-3 w-3" /> {grupo.cursos_count} {grupo.cursos_count === 1 ? 'curso' : 'cursos'}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between sm:justify-end gap-4 w-full sm:w-auto shrink-0">
                                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                                            Activo
                                        </span>
                                        <ChevronRight className="h-5 w-5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </Link>
                            )
                        })}
                    </div>
                ) : (
                    <div className="bg-white border border-slate-200/80 rounded-3xl py-12 px-4 text-center">
                        <div className="h-16 w-16 bg-slate-50 border border-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">No hay grupos creados</h3>
                        <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                            Crea tu primer grupo para comenzar a organizar tus cursos y alumnos de esta academia.
                        </p>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="mt-5 inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl shadow-xs transition-colors"
                        >
                            Crear primer grupo
                        </button>
                    </div>
                )}

                {/* ¿Qué Sigue? */}
                <div className="mt-8 bg-slate-100/50 border border-slate-200/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-start gap-4">
                        <div className="h-10 w-10 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                            <Lightbulb className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                            <h4 className="font-bold text-slate-900 text-sm">¿Qué sigue?</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Después de crear un grupo, puedes crear cursos para ese grupo.
                            </p>
                        </div>
                    </div>
                    <button className="text-xs font-semibold text-indigo-600 bg-white border border-slate-200 hover:bg-slate-50 hover:border-slate-300 px-4 py-2.5 rounded-xl transition-all shadow-2xs shrink-0 self-end sm:self-auto">
                        Ver guía rápida
                    </button>
                </div>

            </div>

            {/* Modal de Creación de Grupo */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-250">
                        <button 
                            onClick={() => setIsModalOpen(false)}
                            className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-950">
                                Crear Nuevo Grupo
                            </h2>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Completa la información básica para dar de alta el grupo en la academia.
                            </p>
                        </div>

                        <form onSubmit={handleCrearGrupo} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">
                                    Nombre del Grupo
                                </label>
                                <input 
                                    type="text" 
                                    value={nuevoNombre}
                                    onChange={(e) => setNuevoNombre(e.target.value)}
                                    placeholder="Ej. Enfermería Vespertino"
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">
                                    Descripción (Opcional)
                                </label>
                                <textarea 
                                    value={nuevaDesc}
                                    onChange={(e) => setNuevaDesc(e.target.value)}
                                    placeholder="Ej. Alumnos de tercer semestre, turno vespertino."
                                    rows={3}
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-slate-900 resize-none"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">
                                    Imagen del Grupo (Opcional)
                                </label>
                                <div className="flex items-center gap-4 bg-slate-50/50 border border-slate-100 p-3 rounded-2xl">
                                    {imagePreview ? (
                                        <div className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                            <img src={imagePreview} alt="Vista previa" className="h-full w-full object-cover" />
                                        </div>
                                    ) : (
                                        <div className="h-16 w-16 rounded-xl bg-slate-100 border border-dashed border-slate-300 flex items-center justify-center shrink-0">
                                            <Users className="h-6 w-6 text-slate-400" />
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <input 
                                            type="file" 
                                            accept="image/*"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0]
                                                if (file) {
                                                    setImageFile(file)
                                                    setImagePreview(URL.createObjectURL(file))
                                                }
                                            }}
                                            className="hidden"
                                            id="group-image-upload"
                                        />
                                        <label 
                                            htmlFor="group-image-upload"
                                            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer transition-all shadow-3xs"
                                        >
                                            Seleccionar archivo
                                        </label>
                                        <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o WEBP. Si se omite, se usará una por defecto.</p>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                                    {error}
                                </p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={creandoGrupo}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    {creandoGrupo ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Creando...
                                        </>
                                    ) : (
                                        'Crear Grupo'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
