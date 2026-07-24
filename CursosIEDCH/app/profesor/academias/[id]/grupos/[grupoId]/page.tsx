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
    Loader2,
    Check,
    BookmarkPlus
} from 'lucide-react'

interface Curso {
    id: string
    titulo: string
    categoria: string
    precio: number
    estado: string
}

interface Alumno {
    id: string
    nombre: string
    apellido_paterno: string
    email: string
}

interface PageProps {
    params: Promise<{ id: string; grupoId: string }>
}

export default function DetalleGrupoPage({ params }: PageProps) {
    const { id: academiaId, grupoId } = use(params)
    const router = useRouter()
    const supabase = createClient()
    
    const [grupoNombre, setGrupoNombre] = useState('Grupo')
    const [grupoDescripcion, setGrupoDescripcion] = useState('')
    const [grupoImagen, setGrupoImagen] = useState('')
    const [academiaNombre, setAcademiaNombre] = useState('Academia')
    const [loading, setLoading] = useState(true)
    
    // Listas principales del grupo
    const [cursosGrupo, setCursosGrupo] = useState<Curso[]>([])
    const [alumnosGrupo, setAlumnosGrupo] = useState<Alumno[]>([])

    // Modal para asociar cursos existentes
    const [isCursoModalOpen, setIsCursoModalOpen] = useState(false)
    const [todosCursos, setTodosCursos] = useState<Curso[]>([])
    const [cursosSeleccionados, setCursosSeleccionados] = useState<string[]>([])
    const [asociandoCursos, setAsociandoCursos] = useState(false)
    const [eliminandoGrupo, setEliminandoGrupo] = useState(false)

    async function handleEliminarGrupo() {
        if (cursosGrupo.length > 0) {
            alert('No se puede eliminar el grupo porque ya tiene cursos asociados.')
            return
        }

        if (!confirm(`¿Estás seguro de que deseas eliminar el grupo "${grupoNombre}"?`)) {
            return
        }

        setEliminandoGrupo(true)
        try {
            const { error: errDelete } = await supabase
                .from('ie_grupos')
                .delete()
                .eq('id', grupoId)

            if (errDelete) throw errDelete

            window.location.href = `/profesor/academias/${academiaId}/grupos`
        } catch (e) {
            console.error('Error al eliminar grupo:', e)
            alert('Ocurrió un error al intentar eliminar el grupo.')
        } finally {
            setEliminandoGrupo(false)
        }
    }

    // Modal para editar grupo
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [editNombre, setEditNombre] = useState('')
    const [editDesc, setEditDesc] = useState('')
    const [editImageFile, setEditImageFile] = useState<File | null>(null)
    const [editImagePreview, setEditImagePreview] = useState<string>('')
    const [guardandoGrupo, setGuardandoGrupo] = useState(false)
    const [editError, setEditError] = useState('')

    function abrirModalEditarGrupo() {
        setEditNombre(grupoNombre)
        setEditDesc(grupoDescripcion)
        setEditImagePreview(grupoImagen)
        setEditImageFile(null)
        setEditError('')
        setIsEditModalOpen(true)
    }

    async function handleEditarGrupo(e: React.FormEvent) {
        e.preventDefault()
        if (!editNombre.trim()) {
            setEditError('El nombre del grupo es obligatorio.')
            return
        }

        setGuardandoGrupo(true)
        setEditError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error('No autenticado')

            let uploadedUrl = grupoImagen
            if (editImageFile) {
                const ext = editImageFile.name.split('.').pop()
                const fileName = `grupo_${user.id}_${Date.now()}.${ext}`
                const { error: upErr } = await supabase.storage.from('perfiles').upload(fileName, editImageFile)
                if (upErr) throw new Error('Error al subir la imagen: ' + upErr.message)
                uploadedUrl = supabase.storage.from('perfiles').getPublicUrl(fileName).data.publicUrl
            }

            const { error: errUpdate } = await supabase
                .from('ie_grupos')
                .update({
                    nombre: editNombre.trim(),
                    descripcion: editDesc.trim(),
                    imagen_url: uploadedUrl
                })
                .eq('id', grupoId)

            if (errUpdate) throw errUpdate

            setGrupoNombre(editNombre.trim())
            setGrupoDescripcion(editDesc.trim())
            setGrupoImagen(uploadedUrl)
            setIsEditModalOpen(false)
        } catch (e: any) {
            setEditError(e.message || 'Ocurrió un error al actualizar el grupo.')
        } finally {
            setGuardandoGrupo(false)
        }
    }

    // Cargar datos
    useEffect(() => {
        async function loadAllData() {
            try {
                // 1. Obtener detalles del grupo y de la academia
                const { data: grupo } = await supabase
                    .from('ie_grupos')
                    .select('nombre, descripcion, imagen_url, ie_academias(nombre)')
                    .eq('id', grupoId)
                    .single()
                
                if (grupo) {
                    setGrupoNombre(grupo.nombre)
                    setGrupoDescripcion(grupo.descripcion || '')
                    setGrupoImagen(grupo.imagen_url || '')
                    if (grupo.ie_academias) {
                        setAcademiaNombre((grupo.ie_academias as any).nombre)
                    }
                }

                // 2. Obtener cursos actualmente asignados a este grupo
                const { data: relCursos } = await supabase
                    .from('ie_grupo_cursos')
                    .select('ie_cursos(id, titulo, categoria, precio, estado)')
                    .eq('grupo_id', grupoId)

                if (relCursos) {
                    const formattedCursos = relCursos
                        .map((rc: any) => rc.ie_cursos)
                        .filter(Boolean) as Curso[]
                    setCursosGrupo(formattedCursos)
                }

                // 3. Obtener alumnos asignados a este grupo
                const { data: relAlumnos } = await supabase
                    .from('ie_grupo_alumnos')
                    .select('ie_profiles(id, nombre, apellido_paterno, email)')
                    .eq('grupo_id', grupoId)

                if (relAlumnos) {
                    const formattedAlumnos = relAlumnos
                        .map((ra: any) => ra.ie_profiles)
                        .filter(Boolean) as Alumno[]
                    setAlumnosGrupo(formattedAlumnos)
                }
            } catch (e) {
                console.error('Error cargando detalles del grupo:', e)
            } finally {
                setLoading(false)
            }
        }
        loadAllData()
    }, [grupoId])

    // Cargar cursos del profesor disponibles para asociar
    async function abrirModalAsociarCursos() {
        setIsCursoModalOpen(true)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            // Obtener todos los cursos creados por el profesor
            const { data: cursosData } = await supabase
                .from('ie_cursos')
                .select('id, titulo, categoria, precio, estado')
                .eq('creado_por', user.id)

            if (cursosData) {
                // Filtrar los que ya pertenecen al grupo
                const idCursosEnGrupo = cursosGrupo.map(c => c.id)
                const disponibles = cursosData.filter(c => !idCursosEnGrupo.includes(c.id))
                setTodosCursos(disponibles)
            }
        } catch (e) {
            console.error('Error cargando cursos del profesor:', e)
        }
    }

    // Guardar asociación de cursos
    async function handleAsociarCursos() {
        if (cursosSeleccionados.length === 0) return
        setAsociandoCursos(true)
        try {
            const inserts = cursosSeleccionados.map(cursoId => ({
                grupo_id: grupoId,
                curso_id: cursoId
            }))

            const { error: errInsert } = await supabase
                .from('ie_grupo_cursos')
                .insert(inserts)

            if (errInsert) throw errInsert

            // Actualizar vista local
            const cursosAgregados = todosCursos.filter(c => cursosSeleccionados.includes(c.id))
            setCursosGrupo(prev => [...prev, ...cursosAgregados])
            setIsCursoModalOpen(false)
            setCursosSeleccionados([])
        } catch (e) {
            console.error('Error asociando cursos:', e)
        } finally {
            setAsociandoCursos(false)
        }
    }

    function toggleSeleccionCurso(id: string) {
        setCursosSeleccionados(prev => 
            prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
        )
    }

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] font-sans antialiased text-slate-800 pb-16 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
                
                {/* Retorno */}
                <Link 
                    href={`/profesor/academias/${academiaId}/grupos`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors mb-6"
                >
                    <ArrowLeft className="h-3.5 w-3.5" /> Volver a Grupos de {academiaNombre}
                </Link>

                {/* Cabecera del Grupo */}
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="h-16 w-16 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-200 shrink-0">
                            {grupoImagen ? (
                                <img src={grupoImagen} alt={grupoNombre} className="h-full w-full object-cover" />
                            ) : (
                                <Users className="h-8 w-8 text-indigo-600" />
                            )}
                        </div>
                        <div>
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                                Grupo de {academiaNombre}
                            </span>
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-2">
                                {grupoNombre}
                            </h1>
                            {grupoDescripcion && (
                                <p className="text-slate-500 text-sm mt-1 max-w-xl">
                                    {grupoDescripcion}
                                </p>
                            )}
                        </div>
                    </div>
                    
                    {/* Acciones del Grupo */}
                    <div className="flex items-center gap-2.5 self-stretch md:self-auto justify-end">
                        <button
                            onClick={abrirModalEditarGrupo}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                        >
                            Editar Grupo
                        </button>
                        <button
                            onClick={handleEliminarGrupo}
                            disabled={eliminandoGrupo}
                            className={`inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-2xs ${
                                cursosGrupo.length > 0
                                    ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : 'bg-red-50 hover:bg-red-100 border-red-200 text-red-600 hover:text-red-700'
                            }`}
                            title={cursosGrupo.length > 0 ? "No puedes eliminar un grupo con cursos asociados" : "Eliminar este grupo"}
                        >
                            {eliminandoGrupo ? 'Eliminando...' : 'Eliminar Grupo'}
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                        <p className="text-sm text-slate-400 mt-2">Cargando detalles...</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* Panel Izquierdo: Cursos del Grupo (2/3 de ancho) */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Cursos del Grupo
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Cursos asignados a los alumnos de este grupo.
                                        </p>
                                    </div>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button
                                            onClick={abrirModalAsociarCursos}
                                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all"
                                        >
                                            <BookmarkPlus className="h-3.5 w-3.5" /> Asociar existente
                                        </button>
                                        <Link
                                            href={`/profesor/subir-curso?grupoId=${grupoId}`}
                                            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3.5 py-2.5 rounded-xl transition-all shadow-2xs"
                                        >
                                            <Plus className="h-3.5 w-3.5" /> Crear nuevo
                                        </Link>
                                    </div>
                                </div>

                                {cursosGrupo.length > 0 ? (
                                    <div className="divide-y divide-slate-100">
                                        {cursosGrupo.map(curso => (
                                            <div key={curso.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                                                        <BookOpen className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-slate-900 text-sm">{curso.titulo}</h4>
                                                        <p className="text-xs text-slate-400 capitalize">{curso.categoria}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {curso.precio > 0 ? `$${curso.precio}` : 'Gratis'}
                                                    </span>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${
                                                        curso.estado === 'aprobado' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                                                    }`}>
                                                        {curso.estado}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-400 text-sm">
                                        No hay cursos asignados a este grupo todavía.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Panel Derecho: Alumnos del Grupo (1/3 de ancho) */}
                        <div className="space-y-6">
                            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6">
                                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-900">
                                            Alumnos ({alumnosGrupo.length})
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Estudiantes inscritos en este grupo.
                                        </p>
                                    </div>
                                </div>

                                {alumnosGrupo.length > 0 ? (
                                    <div className="space-y-3">
                                        {alumnosGrupo.map(alumno => (
                                            <div key={alumno.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition border border-transparent hover:border-slate-100">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold border border-slate-200">
                                                    {alumno.nombre[0]}{alumno.apellido_paterno?.[0] || ''}
                                                </div>
                                                <div className="min-w-0">
                                                    <h5 className="font-bold text-slate-900 text-xs truncate">
                                                        {alumno.nombre} {alumno.apellido_paterno || ''}
                                                    </h5>
                                                    <p className="text-[10px] text-slate-400 truncate">{alumno.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-10 text-slate-400 text-sm">
                                        No hay alumnos registrados en este grupo.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                )}

            </div>

            {/* Modal para Asociar Cursos Existentes */}
            {isCursoModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-250">
                        <button 
                            onClick={() => {
                                setIsCursoModalOpen(false)
                                setCursosSeleccionados([])
                            }}
                            className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-950">
                                Asociar Cursos al Grupo
                            </h2>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Selecciona uno o más cursos que hayas creado para agregarlos al grupo de la academia.
                            </p>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                            {todosCursos.length > 0 ? (
                                todosCursos.map(curso => {
                                    const seleccionado = cursosSeleccionados.includes(curso.id)
                                    return (
                                        <button
                                            key={curso.id}
                                            onClick={() => toggleSeleccionCurso(curso.id)}
                                            className={`w-full text-left p-3.5 rounded-2xl border transition flex items-center justify-between gap-4 ${
                                                seleccionado 
                                                    ? 'border-indigo-500 bg-indigo-50/50' 
                                                    : 'border-slate-200/80 hover:border-slate-300 bg-slate-50/30'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                                                    seleccionado ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-500'
                                                }`}>
                                                    <BookOpen className="h-4.5 w-4.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-950 text-xs truncate">{curso.titulo}</h4>
                                                    <p className="text-[10px] text-slate-500 mt-0.5 capitalize">{curso.categoria}</p>
                                                </div>
                                            </div>
                                            {seleccionado && (
                                                <div className="h-5 w-5 rounded-full bg-indigo-600 flex items-center justify-center text-white shrink-0">
                                                    <Check className="h-3 w-3" />
                                                </div>
                                            )}
                                        </button>
                                    )
                                })
                            ) : (
                                <div className="text-center py-8 text-slate-400 text-xs">
                                    No tienes otros cursos disponibles para asociar.
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => {
                                    setIsCursoModalOpen(false)
                                    setCursosSeleccionados([])
                                }}
                                className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm py-3 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAsociarCursos}
                                disabled={asociandoCursos || cursosSeleccionados.length === 0}
                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                            >
                                {asociandoCursos ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Asociando...
                                    </>
                                ) : (
                                    `Asociar (${cursosSeleccionados.length})`
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal para Editar Grupo */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-6 relative animate-in fade-in zoom-in-95 duration-250">
                        <button 
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute top-4 right-4 h-8 w-8 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl flex items-center justify-center transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="space-y-2">
                            <h2 className="text-2xl font-black text-slate-950">
                                Editar Grupo
                            </h2>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Modifica la información básica del grupo para mantener al día a tus alumnos.
                            </p>
                        </div>

                        <form onSubmit={handleEditarGrupo} className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">
                                    Nombre del Grupo
                                </label>
                                <input 
                                    type="text" 
                                    value={editNombre}
                                    onChange={(e) => setEditNombre(e.target.value)}
                                    placeholder="Ej. Enfermería Vespertino"
                                    className="w-full bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-3 text-sm focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all text-slate-900"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700">
                                    Descripción (Opcional)
                                </label>
                                <textarea 
                                    value={editDesc}
                                    onChange={(e) => setEditDesc(e.target.value)}
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
                                    {editImagePreview ? (
                                        <div className="h-16 w-16 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                                            <img src={editImagePreview} alt="Vista previa" className="h-full w-full object-cover" />
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
                                                    setEditImageFile(file)
                                                    setEditImagePreview(URL.createObjectURL(file))
                                                }
                                            }}
                                            className="hidden"
                                            id="group-edit-image-upload"
                                        />
                                        <label 
                                            htmlFor="group-edit-image-upload"
                                            className="inline-flex items-center justify-center bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-xl cursor-pointer transition-all shadow-3xs"
                                        >
                                            Seleccionar archivo
                                        </label>
                                        <p className="text-[10px] text-slate-400 mt-1">PNG, JPG o WEBP. Si se omite, se usará una por defecto o la existente.</p>
                                    </div>
                                </div>
                            </div>

                            {editError && (
                                <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-xl">
                                    {editError}
                                </p>
                            )}

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="flex-1 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-sm py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={guardandoGrupo}
                                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold text-sm py-3 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
                                >
                                    {guardandoGrupo ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        'Guardar Cambios'
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
