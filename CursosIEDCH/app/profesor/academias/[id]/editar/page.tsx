'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
    Building2, 
    Palette, 
    Settings, 
    Globe, 
    Phone, 
    Mail, 
    ArrowLeft, 
    UploadCloud, 
    X, 
    Loader2, 
    Facebook, 
    Instagram, 
    Linkedin, 
    Youtube, 
    Save, 
    AlertCircle,
    CheckCircle
} from 'lucide-react'

interface PageProps {
    params: Promise<{ id: string }>
}

const CATEGORIES = [
    'Salud',
    'Enfermería',
    'Urgencias Médicas',
    'Administración de la Salud',
    'Tecnología Médica',
    'Idiomas',
    'Tecnología y Programación',
    'Otro'
]

const COLORS = [
    { hex: '#6366f1', name: 'Morado', light: '#f5f3ff' },
    { hex: '#2563eb', name: 'Azul', light: '#eff6ff' },
    { hex: '#0ea5e9', name: 'Celeste', light: '#f0f9ff' },
    { hex: '#10b981', name: 'Verde', light: '#f0fdf4' },
    { hex: '#f59e0b', name: 'Naranja', light: '#fffbeb' },
    { hex: '#ef4444', name: 'Rojo', light: '#fef2f2' },
    { hex: '#6b7280', name: 'Gris', light: '#f8fafc' }
]

export default function EditarAcademiaPage({ params }: PageProps) {
    const { id } = use(params)
    const router = useRouter()
    const supabase = createClient()

    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [dbError, setDbError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: 'Salud',
        logoUrl: '' as string | null,
        logoFile: null as File | null,
        logoPreview: '',
        bannerUrl: '' as string | null,
        bannerFile: null as File | null,
        bannerPreview: '',
        colorPrincipal: '#6366f1',
        mensajeBienvenida: '',
        publica: true,
        codigoAcceso: '',
        permitirInscripciones: true,
        certificadosAutomaticos: true,
        foroDiscusion: false,
        correoContacto: '',
        telefonoContacto: '',
        sitioWeb: '',
        facebook: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        subdominio: '',
        registroAbierto: true,
        requiereAprobacion: false
    })

    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    useEffect(() => {
        async function loadAcademia() {
            try {
                const { data: { user } } = await supabase.auth.getUser()
                if (!user) {
                    router.push('/login')
                    return
                }

                const { data: academia, error: acErr } = await supabase
                    .from('ie_academias')
                    .select('*')
                    .eq('id', id)
                    .single()

                if (acErr || !academia) {
                    router.push('/profesor')
                    return
                }

                // Verificar propiedad
                if (academia.creado_por !== user.id) {
                    router.push('/profesor')
                    return
                }

                // Cargar datos en el estado
                const redes = academia.redes_sociales || {}
                setFormData({
                    nombre: academia.nombre || '',
                    descripcion: academia.descripcion || '',
                    categoria: academia.categoria || 'Salud',
                    logoUrl: academia.logo_url || null,
                    logoFile: null,
                    logoPreview: academia.logo_url || '',
                    bannerUrl: academia.banner_url || null,
                    bannerFile: null,
                    bannerPreview: academia.banner_url || '',
                    colorPrincipal: academia.color_principal || '#6366f1',
                    mensajeBienvenida: academia.mensaje_bienvenida || '',
                    publica: academia.publica !== false,
                    codigoAcceso: academia.codigo_acceso || '',
                    permitirInscripciones: academia.permitir_inscripciones !== false,
                    certificadosAutomaticos: academia.certificados_automaticos !== false,
                    foroDiscusion: academia.foro_discusion === true,
                    correoContacto: academia.correo_contacto || '',
                    telefonoContacto: academia.telefono_contacto || '',
                    sitioWeb: academia.sitio_web || '',
                    facebook: redes.facebook || '',
                    instagram: redes.instagram || '',
                    linkedin: redes.linkedin || '',
                    youtube: redes.youtube || '',
                    subdominio: academia.subdominio || '',
                    registroAbierto: academia.registro_abierto !== false,
                    requiereAprobacion: academia.requiere_aprobacion === true
                })
            } catch (e) {
                console.error('Error cargando academia para edición:', e)
                setDbError('Ocurrió un error al cargar la información de la academia.')
            } finally {
                setLoading(false)
            }
        }

        loadAcademia()
    }, [id])

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors(prev => {
                const copy = { ...prev }
                delete copy[name]
                return copy
            })
        }
    }

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked }))
        
        // Si cambia a pública = true, limpiamos el código de acceso
        if (name === 'publica' && checked) {
            setFormData(prev => ({ ...prev, codigoAcceso: '' }))
        }
    }

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, logo: 'El archivo del logo excede el límite de 2MB.' }))
                return
            }
            setFormData(prev => ({
                ...prev,
                logoFile: file,
                logoPreview: URL.createObjectURL(file)
            }))
            if (errors.logo) {
                setErrors(prev => {
                    const copy = { ...prev }
                    delete copy.logo
                    return copy
                })
            }
        }
    }

    const removeLogo = () => {
        setFormData(prev => ({ 
            ...prev, 
            logoFile: null, 
            logoPreview: '', 
            logoUrl: null 
        }))
    }

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 3 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, banner: 'El archivo del banner excede el límite de 3MB.' }))
                return
            }
            setFormData(prev => ({
                ...prev,
                bannerFile: file,
                bannerPreview: URL.createObjectURL(file)
            }))
            if (errors.banner) {
                setErrors(prev => {
                    const copy = { ...prev }
                    delete copy.banner
                    return copy
                })
            }
        }
    }

    const removeBanner = () => {
        setFormData(prev => ({ 
            ...prev, 
            bannerFile: null, 
            bannerPreview: '', 
            bannerUrl: null 
        }))
    }

    const generateAccessCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        let code = ''
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length))
        }
        setFormData(prev => ({ ...prev, codigoAcceso: code }))
    }

    const validateForm = () => {
        const newErrors: { [key: string]: string } = {}

        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre de la academia es requerido.'
        if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.'
        else if (formData.descripcion.length > 300) newErrors.descripcion = 'La descripción no puede exceder los 300 caracteres.'
        
        if (formData.mensajeBienvenida.length > 300) {
            newErrors.mensajeBienvenida = 'El mensaje de bienvenida no puede exceder los 300 caracteres.'
        }

        if (!formData.correoContacto.trim()) newErrors.correoContacto = 'El correo de contacto es requerido.'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correoContacto)) {
            newErrors.correoContacto = 'Ingresa un correo electrónico válido.'
        }

        if (!formData.subdominio.trim()) newErrors.subdominio = 'El enlace de la academia (subdominio) es requerido.'
        else if (!/^[a-z0-9-]+$/.test(formData.subdominio)) {
            newErrors.subdominio = 'Solo se permiten letras minúsculas, números y guiones.'
        }

        if (!formData.publica && !formData.codigoAcceso.trim()) {
            newErrors.codigoAcceso = 'Debes ingresar o generar un código de acceso para academias privadas.'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return
        
        setSaving(true)
        setDbError('')
        setSuccessMessage('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setDbError('Debes iniciar sesión para realizar esta acción.')
                setSaving(false)
                return
            }

            // 1. Validar que el subdominio sea único (excluyendo la academia actual)
            const { data: existeSubdominio, error: subErr } = await supabase
                .from('ie_academias')
                .select('id')
                .eq('subdominio', formData.subdominio)
                .neq('id', id)
                .maybeSingle()

            if (subErr) throw subErr

            if (existeSubdominio) {
                setErrors(prev => ({ ...prev, subdominio: 'Este enlace (subdominio) ya está registrado por otra academia.' }))
                setSaving(false)
                return
            }

            // 2. Subir nuevo logo si corresponde
            let finalLogoUrl = formData.logoUrl
            if (formData.logoFile) {
                const fileExt = formData.logoFile.name.split('.').pop()
                const fileName = `academias/logo-${user.id}-${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('perfiles')
                    .upload(fileName, formData.logoFile)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('perfiles').getPublicUrl(fileName)
                finalLogoUrl = data.publicUrl
            }

            // 3. Subir nuevo banner si corresponde
            let finalBannerUrl = formData.bannerUrl
            if (formData.bannerFile) {
                const fileExt = formData.bannerFile.name.split('.').pop()
                const fileName = `academias/banner-${user.id}-${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('perfiles')
                    .upload(fileName, formData.bannerFile)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('perfiles').getPublicUrl(fileName)
                finalBannerUrl = data.publicUrl
            }

            // 4. Actualizar en Supabase
            const { error: updateError } = await supabase
                .from('ie_academias')
                .update({
                    nombre: formData.nombre,
                    descripcion: formData.descripcion,
                    categoria: formData.categoria,
                    logo_url: finalLogoUrl,
                    banner_url: finalBannerUrl,
                    color_principal: formData.colorPrincipal,
                    mensaje_bienvenida: formData.mensajeBienvenida || null,
                    publica: formData.publica,
                    codigo_acceso: formData.publica ? null : formData.codigoAcceso,
                    permitir_inscripciones: formData.permitirInscripciones,
                    registro_abierto: formData.registroAbierto,
                    requiere_aprobacion: formData.requiereAprobacion,
                    certificados_automaticos: formData.certificadosAutomaticos,
                    foro_discusion: formData.foroDiscusion,
                    correo_contacto: formData.correoContacto,
                    telefono_contacto: formData.telefonoContacto || null,
                    sitio_web: formData.sitioWeb || null,
                    redes_sociales: {
                        facebook: formData.facebook || null,
                        instagram: formData.instagram || null,
                        linkedin: formData.linkedin || null,
                        youtube: formData.youtube || null
                    },
                    subdominio: formData.subdominio
                })
                .eq('id', id)

            if (updateError) throw updateError

            setSuccessMessage('¡Información de la academia guardada con éxito!')
            setTimeout(() => {
                router.push(`/profesor/academias/${id}`)
                router.refresh()
            }, 1500)

        } catch (error: any) {
            console.error('Error actualizando la academia:', error)
            setDbError(error.message || 'Ocurrió un error al guardar los cambios.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-slate-50">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-slate-400 mt-2">Cargando datos de la academia...</p>
            </div>
        )
    }

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] font-sans antialiased text-slate-800 pb-16 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                
                {/* Cabecera / Breadcrumb */}
                <div className="flex items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Link href="/profesor" className="hover:text-indigo-600 transition-colors">
                            Panel del Profesor
                        </Link>
                        <span>/</span>
                        <Link href={`/profesor/academias/${id}`} className="hover:text-indigo-600 transition-colors">
                            {formData.nombre}
                        </Link>
                        <span>/</span>
                        <span className="text-slate-600 font-semibold">Editar</span>
                    </div>
                    
                    <Link
                        href={`/profesor/academias/${id}`}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-700 text-xs font-bold transition-all shadow-2xs"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Regresar
                    </Link>
                </div>

                {/* Mensajes de feedback */}
                {dbError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm">Error de Guardado</h4>
                            <p className="text-xs mt-1">{dbError}</p>
                        </div>
                    </div>
                )}

                {successMessage && (
                    <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-700">
                        <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="font-bold text-sm">Éxito</h4>
                            <p className="text-xs mt-1">{successMessage}</p>
                        </div>
                    </div>
                )}

                {/* Título Principal */}
                <div className="mb-10">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Building2 className="h-8 w-8 text-indigo-600" />
                        Editar información de academia
                    </h1>
                    <p className="text-slate-500 mt-2 text-sm sm:text-base">
                        Modifica los detalles generales, personalización y configuración de <span className="font-semibold text-slate-700">{formData.nombre}</span>.
                    </p>
                </div>

                <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Columna Izquierda / Centro: Formulario */}
                    <div className="lg:col-span-2 space-y-6">
                        
                        {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-5">
                            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-indigo-600" />
                                Información Básica
                            </h3>

                            {/* Nombre */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Nombre de la Academia *
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleTextChange}
                                    placeholder="Ej. Escuela de Urgencias Médicas"
                                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                                        errors.nombre 
                                            ? 'border-red-300 focus:ring-red-100 bg-red-50/20' 
                                            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100/50'
                                    }`}
                                />
                                {errors.nombre && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.nombre}</p>}
                            </div>

                            {/* Categoria y Enlace */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Categoría Principal
                                    </label>
                                    <select
                                        name="categoria"
                                        value={formData.categoria}
                                        onChange={handleTextChange}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100/50"
                                    >
                                        {CATEGORIES.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Enlace (Subdominio) *
                                    </label>
                                    <div className="flex rounded-xl shadow-2xs">
                                        <input
                                            type="text"
                                            name="subdominio"
                                            value={formData.subdominio}
                                            onChange={handleTextChange}
                                            placeholder="mi-academia"
                                            className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                                                errors.subdominio 
                                                    ? 'border-red-300 focus:ring-red-100 bg-red-50/20' 
                                                    : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100/50'
                                            }`}
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-400">
                                        Solo minúsculas, números y guiones.
                                    </p>
                                    {errors.subdominio && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.subdominio}</p>}
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Descripción corta *
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        {formData.descripcion.length}/300
                                    </span>
                                </div>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleTextChange}
                                    rows={3}
                                    maxLength={300}
                                    placeholder="Describe brevemente a qué se dedica tu academia..."
                                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                                        errors.descripcion 
                                            ? 'border-red-300 focus:ring-red-100 bg-red-50/20' 
                                            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100/50'
                                    }`}
                                />
                                {errors.descripcion && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.descripcion}</p>}
                            </div>
                        </div>

                        {/* SECCIÓN 2: PERSONALIZACIÓN VISUAL */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
                            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                                <Palette className="h-5 w-5 text-indigo-600" />
                                Personalización y Estética
                            </h3>

                            {/* Subir Logo */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Logo de la Academia
                                </label>
                                <div className="flex items-center gap-5">
                                    {formData.logoPreview ? (
                                        <div className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                            <img 
                                                src={formData.logoPreview} 
                                                alt="Previsualización Logo" 
                                                className="h-full w-full object-cover" 
                                            />
                                            <button
                                                type="button"
                                                onClick={removeLogo}
                                                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
                                                title="Quitar imagen"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="h-20 w-20 shrink-0 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400">
                                            <Building2 className="h-8 w-8" />
                                        </div>
                                    )}
                                    <div className="flex-1 space-y-1">
                                        <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer">
                                            <UploadCloud className="h-4 w-4" />
                                            Subir nuevo logo
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onChange={handleLogoChange} 
                                                className="hidden" 
                                            />
                                        </label>
                                        <p className="text-[10px] text-slate-400">
                                            Formatos recomendados: PNG, JPG, WEBP. Máx. 2MB.
                                        </p>
                                    </div>
                                </div>
                                {errors.logo && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.logo}</p>}
                            </div>

                            {/* Subir Banner */}
                            <div className="space-y-2">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Banner o Portada
                                </label>
                                {formData.bannerPreview ? (
                                    <div className="relative h-28 w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                                        <img 
                                            src={formData.bannerPreview} 
                                            alt="Previsualización Banner" 
                                            className="h-full w-full object-cover" 
                                        />
                                        <button
                                            type="button"
                                            onClick={removeBanner}
                                            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
                                            title="Quitar imagen"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="h-28 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 gap-1">
                                        <UploadCloud className="h-7 w-7" />
                                        <span className="text-xs font-medium">No se ha subido ningún banner</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between gap-4 mt-2">
                                    <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs cursor-pointer">
                                        <UploadCloud className="h-4 w-4" />
                                        Subir banner de portada
                                        <input 
                                            type="file" 
                                            accept="image/*" 
                                            onChange={handleBannerChange} 
                                            className="hidden" 
                                        />
                                    </label>
                                    <p className="text-[10px] text-slate-400">
                                        Formatos recomendados: JPG, WEBP. Relación 16:9 o 3:1. Máx 3MB.
                                    </p>
                                </div>
                                {errors.banner && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.banner}</p>}
                            </div>

                            {/* Color Principal */}
                            <div className="space-y-3">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Color de Acento o Principal
                                </label>
                                <div className="flex flex-wrap gap-2.5 items-center">
                                    {COLORS.map(col => (
                                        <button
                                            key={col.hex}
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, colorPrincipal: col.hex }))}
                                            className={`h-9 w-9 rounded-full transition-all flex items-center justify-center border-2 ${
                                                formData.colorPrincipal === col.hex 
                                                    ? 'border-slate-800 scale-110 shadow-xs' 
                                                    : 'border-transparent hover:scale-105'
                                            }`}
                                            style={{ backgroundColor: col.hex }}
                                            title={col.name}
                                        >
                                            {formData.colorPrincipal === col.hex && (
                                                <span className="text-white font-bold text-xs">✓</span>
                                            )}
                                        </button>
                                    ))}
                                    <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50">
                                        <input
                                            type="color"
                                            name="colorPrincipal"
                                            value={formData.colorPrincipal}
                                            onChange={handleTextChange}
                                            className="h-7 w-7 rounded-lg border-0 cursor-pointer"
                                        />
                                        <span className="text-xs font-mono text-slate-500 uppercase">{formData.colorPrincipal}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mensaje de Bienvenida */}
                            <div className="space-y-1.5">
                                <div className="flex justify-between items-center">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        Mensaje de Bienvenida a Alumnos
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        {formData.mensajeBienvenida.length}/300
                                    </span>
                                </div>
                                <textarea
                                    name="mensajeBienvenida"
                                    value={formData.mensajeBienvenida}
                                    onChange={handleTextChange}
                                    rows={2}
                                    maxLength={300}
                                    placeholder="Mensaje que verán tus estudiantes al ingresar a la academia..."
                                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                                        errors.mensajeBienvenida 
                                            ? 'border-red-300 focus:ring-red-100 bg-red-50/20' 
                                            : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100/50'
                                    }`}
                                />
                                {errors.mensajeBienvenida && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.mensajeBienvenida}</p>}
                            </div>
                        </div>

                        {/* SECCIÓN 3: DATOS DE CONTACTO Y REDES SOCIALES */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
                            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                                <Mail className="h-5 w-5 text-indigo-600" />
                                Contacto y Redes Sociales
                            </h3>

                            {/* Correo y Teléfono */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <Mail className="h-3 w-3" /> Correo de contacto *
                                    </label>
                                    <input
                                        type="email"
                                        name="correoContacto"
                                        value={formData.correoContacto}
                                        onChange={handleTextChange}
                                        placeholder="ejemplo@academia.com"
                                        className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-hidden focus:ring-2 ${
                                            errors.correoContacto 
                                                ? 'border-red-300 focus:ring-red-100 bg-red-50/20' 
                                                : 'border-slate-200 focus:border-indigo-500 focus:ring-indigo-100/50'
                                        }`}
                                    />
                                    {errors.correoContacto && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.correoContacto}</p>}
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> Teléfono de contacto
                                    </label>
                                    <input
                                        type="text"
                                        name="telefonoContacto"
                                        value={formData.telefonoContacto}
                                        onChange={handleTextChange}
                                        placeholder="Ej. +52 961 123 4567"
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100/50"
                                    />
                                </div>
                            </div>

                            {/* Sitio Web */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                    <Globe className="h-3 w-3" /> Sitio Web Oficial (Opcional)
                                </label>
                                <input
                                    type="url"
                                    name="sitioWeb"
                                    value={formData.sitioWeb}
                                    onChange={handleTextChange}
                                    placeholder="https://www.tuacademia.com"
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100/50"
                                />
                            </div>

                            {/* Redes Sociales */}
                            <div className="space-y-4 pt-2">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enlaces a Redes Sociales</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    
                                    {/* Facebook */}
                                    <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-3 py-1 bg-slate-50/50">
                                        <Facebook className="h-5 w-5 text-blue-600 shrink-0" />
                                        <input
                                            type="url"
                                            name="facebook"
                                            value={formData.facebook}
                                            onChange={handleTextChange}
                                            placeholder="Facebook URL"
                                            className="w-full bg-transparent border-0 py-2 focus:outline-hidden text-xs text-slate-600"
                                        />
                                    </div>

                                    {/* Instagram */}
                                    <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-3 py-1 bg-slate-50/50">
                                        <Instagram className="h-5 w-5 text-pink-600 shrink-0" />
                                        <input
                                            type="url"
                                            name="instagram"
                                            value={formData.instagram}
                                            onChange={handleTextChange}
                                            placeholder="Instagram URL"
                                            className="w-full bg-transparent border-0 py-2 focus:outline-hidden text-xs text-slate-600"
                                        />
                                    </div>

                                    {/* Linkedin */}
                                    <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-3 py-1 bg-slate-50/50">
                                        <Linkedin className="h-5 w-5 text-blue-800 shrink-0" />
                                        <input
                                            type="url"
                                            name="linkedin"
                                            value={formData.linkedin}
                                            onChange={handleTextChange}
                                            placeholder="LinkedIn URL"
                                            className="w-full bg-transparent border-0 py-2 focus:outline-hidden text-xs text-slate-600"
                                        />
                                    </div>

                                    {/* Youtube */}
                                    <div className="flex items-center gap-3 border border-slate-100 rounded-xl px-3 py-1 bg-slate-50/50">
                                        <Youtube className="h-5 w-5 text-red-600 shrink-0" />
                                        <input
                                            type="url"
                                            name="youtube"
                                            value={formData.youtube}
                                            onChange={handleTextChange}
                                            placeholder="YouTube URL"
                                            className="w-full bg-transparent border-0 py-2 focus:outline-hidden text-xs text-slate-600"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Columna Derecha: Configuración / Previsualización */}
                    <div className="space-y-6">
                        
                        {/* CONFIGURACIÓN Y ACCESO */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6">
                            <h3 className="text-lg font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
                                <Settings className="h-5 w-5 text-indigo-600" />
                                Acceso y Políticas
                            </h3>

                            {/* Privacidad de la Academia (Pública vs Privada) */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800">Academia Pública</span>
                                        <p className="text-[10px] text-slate-400 leading-normal">
                                            Cualquier usuario puede encontrar e inscribirse a tu academia.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.publica} 
                                            onChange={(e) => handleCheckboxChange('publica', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {/* Código de Acceso */}
                                {!formData.publica && (
                                    <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2.5">
                                        <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider">
                                            Código de Acceso Requerido
                                        </label>
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                name="codigoAcceso"
                                                value={formData.codigoAcceso}
                                                onChange={handleTextChange}
                                                placeholder="CÓDIGO123"
                                                className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono font-bold uppercase transition-all bg-white focus:outline-hidden ${
                                                    errors.codigoAcceso 
                                                        ? 'border-red-300 focus:ring-2 focus:ring-red-100' 
                                                        : 'border-slate-200 focus:border-indigo-500'
                                                }`}
                                            />
                                            <button
                                                type="button"
                                                onClick={generateAccessCode}
                                                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-2xs transition-colors"
                                            >
                                                Generar
                                            </button>
                                        </div>
                                        {errors.codigoAcceso && <p className="text-xs text-red-500 mt-1 font-semibold">{errors.codigoAcceso}</p>}
                                        <p className="text-[10px] text-indigo-700 leading-normal">
                                            Los alumnos deberán ingresar este código exacto para inscribirse a tu academia.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <hr className="border-slate-100" />

                            {/* Otros interruptores */}
                            <div className="space-y-4">
                                
                                {/* Permitir inscripciones */}
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800">Permitir inscripciones</span>
                                        <p className="text-[10px] text-slate-400 leading-normal">
                                            Habilitar que nuevos alumnos puedan ingresar a la academia.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.permitirInscripciones} 
                                            onChange={(e) => handleCheckboxChange('permitirInscripciones', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {/* Registro Abierto */}
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800">Registro Abierto</span>
                                        <p className="text-[10px] text-slate-400 leading-normal">
                                            Los alumnos pueden unirse libremente (o con código).
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.registroAbierto} 
                                            onChange={(e) => handleCheckboxChange('registroAbierto', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {/* Requiere Aprobación */}
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800">Requiere Aprobación</span>
                                        <p className="text-[10px] text-slate-400 leading-normal">
                                            Debes aprobar a cada alumno manualmente antes de que ingresen.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.requiereAprobacion} 
                                            onChange={(e) => handleCheckboxChange('requiereAprobacion', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {/* Certificados Automáticos */}
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800">Certificados automáticos</span>
                                        <p className="text-[10px] text-slate-400 leading-normal">
                                            Emitir constancias al finalizar cursos sin validación previa.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.certificadosAutomaticos} 
                                            onChange={(e) => handleCheckboxChange('certificadosAutomaticos', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                                {/* Foro de Discusión */}
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <span className="text-sm font-bold text-slate-800">Foro de Discusión</span>
                                        <p className="text-[10px] text-slate-400 leading-normal">
                                            Habilitar un foro común para preguntas e interacción.
                                        </p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.foroDiscusion} 
                                            onChange={(e) => handleCheckboxChange('foroDiscusion', e.target.checked)}
                                            className="sr-only peer" 
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>

                            </div>
                        </div>

                        {/* ACCIONES DEL FORMULARIO */}
                        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 flex flex-col gap-3">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full inline-flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-bold text-sm px-6 py-4 rounded-2xl shadow-md shadow-indigo-100 hover:shadow-lg hover:shadow-indigo-200 transition-all shrink-0 cursor-pointer"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Guardando cambios...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </button>

                            <Link
                                href={`/profesor/academias/${id}`}
                                className="w-full inline-flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm px-6 py-4 rounded-2xl transition-colors text-center"
                            >
                                Cancelar
                            </Link>
                        </div>

                    </div>

                </form>

            </div>
        </div>
    )
}
