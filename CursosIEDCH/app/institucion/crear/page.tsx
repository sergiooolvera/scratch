'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
    Building2, 
    Sparkles, 
    Settings, 
    Check, 
    UploadCloud, 
    ArrowRight, 
    ArrowLeft, 
    BookOpen, 
    Palette,
    Eye,
    Globe,
    CheckCircle2,
    X,
    Loader2
} from 'lucide-react'

// Pasos del formulario
const STEPS = [
    { number: 1, label: 'Información básica', icon: Building2 },
    { number: 2, label: 'Personalización', icon: Palette },
    { number: 3, label: 'Configuración', icon: Settings },
    { number: 4, label: 'Resumen', icon: CheckCircle2 }
]

// Categorías sugeridas
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

// Paletas de colores predefinidas para el Paso 2
const COLOR_PALETTES = [
    { name: 'Esmeralda Vital', primary: 'bg-emerald-600', text: 'text-emerald-600', primaryHex: '#059669', secondary: '#10b981', bg: 'from-emerald-50 to-emerald-100/50' },
    { name: 'Índigo Educativo', primary: 'bg-indigo-600', text: 'text-indigo-600', primaryHex: '#4f46e5', secondary: '#6366f1', bg: 'from-indigo-50 to-indigo-100/50' },
    { name: 'Púrpura Urgencias', primary: 'bg-purple-600', text: 'text-purple-600', primaryHex: '#9333ea', secondary: '#a855f7', bg: 'from-purple-50 to-purple-100/50' },
    { name: 'Azul Institucional', primary: 'bg-blue-600', text: 'text-blue-600', primaryHex: '#2563eb', secondary: '#3b82f6', bg: 'from-blue-50 to-blue-100/50' },
]

export default function CrearAcademiaPage() {
    const router = useRouter()
    const supabase = createClient()
    const [currentStep, setCurrentStep] = useState(1)
    const [saving, setSaving] = useState(false)
    const [dbError, setDbError] = useState('')
    const [activeSocial, setActiveSocial] = useState<'facebook' | 'instagram' | 'linkedin' | 'youtube'>('facebook')

    // Datos del formulario
    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        categoria: 'Salud',
        logo: null as File | null,
        logoPreview: '',
        banner: null as File | null,
        bannerPreview: '',
        colorPrincipal: '#6366f1', // Color morado por defecto
        mensajeBienvenida: '',
        publica: true,
        permitirInscripciones: true,
        certificadosAutomaticos: true,
        foroDiscusion: false,
        correoContacto: '',
        telefono: '',
        sitioWeb: '',
        facebook: '',
        instagram: '',
        linkedin: '',
        youtube: '',
        crearCursoAhora: 'si', // 'si' | 'no'
        colorPalette: 0, // Índice de la paleta seleccionada (mantenida por compatibilidad)
        subdominio: '',
        registroAbierto: true,
        requiereAprobacion: false
    })

    const [errors, setErrors] = useState<{ [key: string]: string }>({})

    const COLORS = [
        { hex: '#6366f1', name: 'Morado', light: '#f5f3ff' },
        { hex: '#2563eb', name: 'Azul', light: '#eff6ff' },
        { hex: '#0ea5e9', name: 'Celeste', light: '#f0f9ff' },
        { hex: '#10b981', name: 'Verde', light: '#f0fdf4' },
        { hex: '#f59e0b', name: 'Naranja', light: '#fffbeb' },
        { hex: '#ef4444', name: 'Rojo', light: '#fef2f2' },
        { hex: '#6b7280', name: 'Gris', light: '#f8fafc' }
    ]

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

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, logo: 'El archivo excede el límite de 2MB.' }))
                return
            }
            setFormData(prev => ({
                ...prev,
                logo: file,
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
        setFormData(prev => ({ ...prev, logo: null, logoPreview: '' }))
    }

    const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            if (file.size > 3 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, banner: 'El banner excede el límite de 3MB.' }))
                return
            }
            setFormData(prev => ({
                ...prev,
                banner: file,
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
        setFormData(prev => ({ ...prev, banner: null, bannerPreview: '' }))
    }

    const validateStep = (step: number) => {
        const newErrors: { [key: string]: string } = {}
        if (step === 1) {
            if (!formData.nombre.trim()) newErrors.nombre = 'El nombre de la academia es requerido.'
            if (!formData.descripcion.trim()) newErrors.descripcion = 'La descripción es requerida.'
            else if (formData.descripcion.length > 300) newErrors.descripcion = 'La descripción no puede exceder los 300 caracteres.'
        }
        if (step === 2) {
            if (formData.mensajeBienvenida.length > 300) {
                newErrors.mensajeBienvenida = 'El mensaje de bienvenida no puede exceder los 300 caracteres.'
            }
        }
        if (step === 3) {
            if (!formData.correoContacto.trim()) newErrors.correoContacto = 'El correo de contacto es requerido.'
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correoContacto)) {
                newErrors.correoContacto = 'Ingresa un correo electrónico válido.'
            }
            if (!formData.subdominio.trim()) newErrors.subdominio = 'El subdominio o enlace de la academia es requerido.'
            else if (!/^[a-z0-9-]+$/.test(formData.subdominio)) {
                newErrors.subdominio = 'Solo se permiten letras minúsculas, números y guiones.'
            }
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleNext = () => {
        if (validateStep(currentStep)) {
            setCurrentStep(prev => Math.min(prev + 1, STEPS.length))
        }
    }

    const handleBack = () => {
        setCurrentStep(prev => Math.max(prev - 1, 1))
    }

    const handleSave = async () => {
        if (!validateStep(4)) return
        setSaving(true)
        setDbError('')

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                setDbError('Debes iniciar sesión para realizar esta acción.')
                setSaving(false)
                return
            }

            let logoUrl = null
            let bannerUrl = null

            // Subir logo a Supabase Storage si se ha seleccionado uno
            if (formData.logo) {
                const fileExt = formData.logo.name.split('.').pop()
                const fileName = `academias/logo-${user.id}-${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('perfiles')
                    .upload(fileName, formData.logo)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('perfiles').getPublicUrl(fileName)
                logoUrl = data.publicUrl
            }

            // Subir banner a Supabase Storage si se ha seleccionado uno
            if (formData.banner) {
                const fileExt = formData.banner.name.split('.').pop()
                const fileName = `academias/banner-${user.id}-${Date.now()}.${fileExt}`

                const { error: uploadError } = await supabase.storage
                    .from('perfiles')
                    .upload(fileName, formData.banner)

                if (uploadError) throw uploadError

                const { data } = supabase.storage.from('perfiles').getPublicUrl(fileName)
                bannerUrl = data.publicUrl
            }

            // Insertar datos en public.ie_academias
            const { error: insertError } = await supabase
                .from('ie_academias')
                .insert({
                    creado_por: user.id,
                    nombre: formData.nombre,
                    descripcion: formData.descripcion,
                    categoria: formData.categoria,
                    logo_url: logoUrl,
                    banner_url: bannerUrl,
                    color_principal: formData.colorPrincipal,
                    mensaje_bienvenida: formData.mensajeBienvenida,
                    publica: formData.publica,
                    permitir_inscripciones: formData.permitirInscripciones,
                    certificados_automaticos: formData.certificadosAutomaticos,
                    foro_discusion: formData.foroDiscusion,
                    correo_contacto: formData.correoContacto,
                    telefono_contacto: formData.telefono || null,
                    sitio_web: formData.sitioWeb || null,
                    redes_sociales: {
                        facebook: formData.facebook || null,
                        instagram: formData.instagram || null,
                        linkedin: formData.linkedin || null,
                        youtube: formData.youtube || null
                    },
                    color_palette: formData.colorPalette,
                    subdominio: formData.subdominio,
                    registro_abierto: formData.registroAbierto,
                    requiere_aprobacion: formData.requiereAprobacion
                })

            if (insertError) {
                if (insertError.code === '23505') {
                    throw new Error('El subdominio ya está registrado. Elige otro enlace.')
                }
                throw insertError
            }

            if (formData.crearCursoAhora === 'si') {
                router.push('/profesor/subir-curso')
            } else {
                router.push('/profesor')
            }
        } catch (err: any) {
            setDbError(err.message || 'Ocurrió un error inesperado al guardar en la base de datos.')
            setSaving(false)
        }
    }

    // Generar subdominio automáticamente basado en el nombre de la academia
    const suggestSubdomain = () => {
        if (formData.nombre && !formData.subdominio) {
            const suggested = formData.nombre
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "") // remover acentos
                .replace(/[^a-z0-9\s-]/g, "") // remover caracteres especiales
                .trim()
                .replace(/\s+/g, "-") // reemplazar espacios con guiones
            setFormData(prev => ({ ...prev, subdominio: suggested }))
        }
    }

    const activePalette = COLOR_PALETTES[formData.colorPalette]

    return (
        <div className="bg-slate-50 min-h-[calc(100vh-64px)] font-sans antialiased text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto">
                
                {/* Cabecera del Flujo */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <span className="text-xs font-bold text-white bg-indigo-600 px-3 py-1 rounded-lg uppercase tracking-wider shadow-sm shadow-indigo-600/10">
                            Paso {currentStep}
                        </span>
                        <h1 className="text-3xl font-extrabold text-slate-900 mt-3 tracking-tight">
                            Crear Academia
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Sigue los pasos para crear tu academia de capacitación profesional.
                        </p>
                    </div>
                </div>

                {/* Stepper Horizontal */}
                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 mb-8">
                    <div className="relative flex flex-col md:flex-row justify-between items-center md:items-start gap-4 md:gap-0">
                        {/* Línea conectora */}
                        <div className="absolute top-[22px] left-8 right-8 h-0.5 bg-slate-100 hidden md:block z-0" />
                        <div 
                            className="absolute top-[22px] left-8 h-0.5 bg-indigo-600 hidden md:block z-0 transition-all duration-300" 
                            style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 92}%` }}
                        />

                        {STEPS.map((step) => {
                            const Icon = step.icon
                            const isCompleted = currentStep > step.number
                            const isActive = currentStep === step.number

                            return (
                                <div key={step.number} className="relative z-10 flex flex-col items-center flex-1">
                                    <button
                                        onClick={() => {
                                            if (step.number < currentStep || validateStep(currentStep)) {
                                                setCurrentStep(step.number)
                                            }
                                        }}
                                        className={`h-11 w-11 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 shadow-sm ${
                                            isCompleted 
                                                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                                                : isActive 
                                                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-50 shadow-md shadow-indigo-600/20' 
                                                    : 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-300'
                                        }`}
                                    >
                                        {isCompleted ? <Check className="h-5 w-5" /> : step.number}
                                    </button>
                                    <span className={`text-xs font-semibold mt-3 transition-colors duration-300 ${
                                        isActive ? 'text-indigo-600' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                                    }`}>
                                        {step.label}
                                    </span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Contenido Dinámico de los Pasos */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                    
                    {/* Panel Izquierdo / Central (Formulario) */}
                    <div className={`${currentStep === 4 ? 'lg:col-span-3' : 'lg:col-span-2'} bg-white rounded-3xl border border-slate-200/80 shadow-xs p-6 sm:p-8 space-y-6`}>
                        
                        {/* PASO 1: INFORMACIÓN BÁSICA */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Información básica</h2>
                                    <p className="text-sm text-slate-500 mt-1">Completa la información principal de tu academia.</p>
                                </div>

                                <div className="space-y-4">
                                    {/* Nombre */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="nombre" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                                            Nombre de la academia <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            id="nombre"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleTextChange}
                                            onBlur={suggestSubdomain}
                                            placeholder="Ej. Academia de Salud EGAC"
                                            className={`w-full px-4 py-3 rounded-xl border ${
                                                errors.nombre ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'
                                            } focus:outline-none focus:ring-4 transition-all text-sm`}
                                        />
                                        {errors.nombre && <p className="text-xs font-medium text-red-500">{errors.nombre}</p>}
                                    </div>

                                    {/* Descripción */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="descripcion" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                                            <span>Descripción <span className="text-red-500">*</span></span>
                                            <span className="text-slate-400 font-normal normal-case">{formData.descripcion.length}/300</span>
                                        </label>
                                        <textarea
                                            id="descripcion"
                                            name="descripcion"
                                            rows={4}
                                            maxLength={300}
                                            value={formData.descripcion}
                                            onChange={handleTextChange}
                                            placeholder="Academia enfocada en la formación y certificación en el área de la salud."
                                            className={`w-full px-4 py-3 rounded-xl border ${
                                                errors.descripcion ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'
                                            } focus:outline-none focus:ring-4 transition-all text-sm resize-none`}
                                        />
                                        {errors.descripcion && <p className="text-xs font-medium text-red-500">{errors.descripcion}</p>}
                                    </div>

                                    {/* Categoría */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="categoria" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Categoría <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="categoria"
                                            name="categoria"
                                            value={formData.categoria}
                                            onChange={handleTextChange}
                                            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none focus:ring-4 transition-all text-sm bg-white"
                                        >
                                            {CATEGORIES.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Logo */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                            Logo de la academia
                                        </label>
                                        
                                        {!formData.logoPreview ? (
                                            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative group">
                                                <input
                                                    type="file"
                                                    accept="image/png, image/jpeg, image/jpg"
                                                    onChange={handleLogoChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform duration-300">
                                                    <UploadCloud className="h-6 w-6" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">Sube tu logo</p>
                                                <p className="text-xs text-slate-400 mt-1">PNG o JPG (máx. 2MB)</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                                <div className="h-16 w-16 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                                    <img src={formData.logoPreview} alt="Logo preview" className="object-contain h-full w-full" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{formData.logo?.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{(formData.logo!.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                </div>
                                                <button
                                                    onClick={removeLogo}
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                        {errors.logo && <p className="text-xs font-medium text-red-500">{errors.logo}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 2: PERSONALIZACIÓN */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Personalización</h2>
                                    <p className="text-sm text-slate-500 mt-1">Personaliza la identidad visual de tu academia.</p>
                                </div>

                                <div className="space-y-5">
                                    {/* Color principal */}
                                    <div className="space-y-2.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                            Color principal
                                        </label>
                                        <div className="flex flex-wrap gap-3">
                                            {COLORS.map((color) => (
                                                <button
                                                    key={color.hex}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, colorPrincipal: color.hex }))}
                                                    className={`h-9 w-9 rounded-full transition-all border duration-200 relative ${
                                                        formData.colorPrincipal === color.hex
                                                            ? 'ring-4 ring-offset-2 scale-105 border-slate-400 shadow-sm'
                                                            : 'border-transparent hover:scale-105'
                                                    }`}
                                                    style={{ 
                                                        backgroundColor: color.hex, 
                                                        '--tw-ring-color': color.hex 
                                                    } as any}
                                                    title={color.name}
                                                >
                                                    {formData.colorPrincipal === color.hex && (
                                                        <span className="absolute inset-0 flex items-center justify-center text-white">
                                                            <Check className="h-4 w-4 stroke-[3px]" />
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Banner de la academia */}
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                            Banner de la academia
                                        </label>
                                        
                                        {!formData.bannerPreview ? (
                                            <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center text-center cursor-pointer relative group">
                                                <input
                                                    type="file"
                                                    accept="image/png, image/jpeg, image/jpg"
                                                    onChange={handleBannerChange}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                />
                                                <div className="h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 transition-transform duration-300">
                                                    <UploadCloud className="h-6 w-6" />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">Sube una imagen de banner</p>
                                                <p className="text-xs text-slate-400 mt-1">PNG o JPG recomendado 1200x400px</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                                                <div className="h-16 w-32 rounded-xl bg-white border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                                                    <img src={formData.bannerPreview} alt="Banner preview" className="object-cover h-full w-full" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-bold text-slate-800 truncate">{formData.banner?.name}</p>
                                                    <p className="text-xs text-slate-400 mt-0.5">{(formData.banner!.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                </div>
                                                <button
                                                    onClick={removeBanner}
                                                    type="button"
                                                    className="h-8 w-8 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        )}
                                        {errors.banner && <p className="text-xs font-medium text-red-500">{errors.banner}</p>}
                                    </div>

                                    {/* Mensaje de bienvenida (opcional) */}
                                    <div className="space-y-1.5">
                                        <label htmlFor="mensajeBienvenida" className="text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                                            <span>Mensaje de bienvenida (opcional)</span>
                                            <span className="text-slate-400 font-normal normal-case">{formData.mensajeBienvenida.length}/300</span>
                                        </label>
                                        <textarea
                                            id="mensajeBienvenida"
                                            name="mensajeBienvenida"
                                            rows={4}
                                            maxLength={300}
                                            value={formData.mensajeBienvenida}
                                            onChange={handleTextChange}
                                            placeholder="Escribe un mensaje de bienvenida para tus alumnos..."
                                            className={`w-full px-4 py-3 rounded-xl border ${
                                                errors.mensajeBienvenida ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'
                                            } focus:outline-none focus:ring-4 transition-all text-sm resize-none`}
                                        />
                                        {errors.mensajeBienvenida && <p className="text-xs font-medium text-red-500">{errors.mensajeBienvenida}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 3: CONFIGURACIÓN */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Columna Izquierda: Configuración switches */}
                                    <div className="space-y-6">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Configuración</h2>
                                            <p className="text-sm text-slate-500 mt-1">Define las opciones y permisos de tu academia.</p>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Academia pública */}
                                            <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100/80 shadow-3xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-650 shrink-0">
                                                        <Globe className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-850">Academia pública</p>
                                                        <p className="text-[11px] text-slate-450">Cualquier persona podrá ver tu academia.</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.publica}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, publica: e.target.checked }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </div>

                                            {/* Permitir inscripciones */}
                                            <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100/80 shadow-3xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-650 shrink-0">
                                                        <Building2 className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-850">Permitir inscripciones</p>
                                                        <p className="text-[11px] text-slate-450">Los alumnos podrán inscribirse a tus cursos.</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.permitirInscripciones}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, permitirInscripciones: e.target.checked }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </div>

                                            {/* Certificados automáticos */}
                                            <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100/80 shadow-3xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-650 shrink-0">
                                                        <BookOpen className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-850">Certificados automáticos</p>
                                                        <p className="text-[11px] text-slate-450">Se emitirán certificados al aprobar los cursos.</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.certificadosAutomaticos}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, certificadosAutomaticos: e.target.checked }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </div>

                                            {/* Foro de discusión */}
                                            <div className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-2xl transition-colors border border-slate-100/80 shadow-3xs">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-650 shrink-0">
                                                        <Sparkles className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-850">Foro de discusión</p>
                                                        <p className="text-[11px] text-slate-450">Habilita foros en los cursos.</p>
                                                    </div>
                                                </div>
                                                <label className="relative inline-flex items-center cursor-pointer">
                                                    <input 
                                                        type="checkbox" 
                                                        checked={formData.foroDiscusion}
                                                        onChange={(e) => setFormData(prev => ({ ...prev, foroDiscusion: e.target.checked }))}
                                                        className="sr-only peer"
                                                    />
                                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Derecha: Información de contacto */}
                                    <div className="space-y-5">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">Información de contacto</h2>
                                        </div>

                                        <div className="space-y-4">
                                            {/* Correo de contacto */}
                                            <div className="space-y-1.5">
                                                <label htmlFor="correoContacto" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                                    Correo de contacto <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="email"
                                                    id="correoContacto"
                                                    name="correoContacto"
                                                    value={formData.correoContacto}
                                                    onChange={handleTextChange}
                                                    placeholder="contacto@academiadesaludegac.com"
                                                    className={`w-full px-4 py-2.5 rounded-xl border ${
                                                        errors.correoContacto ? 'border-red-300 focus:ring-red-100 focus:border-red-400' : 'border-slate-200 focus:ring-indigo-100 focus:border-indigo-400'
                                                    } focus:outline-none focus:ring-4 transition-all text-sm`}
                                                />
                                                {errors.correoContacto && <p className="text-xs font-medium text-red-500">{errors.correoContacto}</p>}
                                            </div>

                                            {/* Teléfono */}
                                            <div className="space-y-1.5">
                                                <label htmlFor="telefono" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                                    Teléfono (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="telefono"
                                                    name="telefono"
                                                    value={formData.telefono}
                                                    onChange={handleTextChange}
                                                    placeholder="+52 55 1234 5678"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none focus:ring-4 transition-all text-sm"
                                                />
                                            </div>

                                            {/* Sitio web */}
                                            <div className="space-y-1.5">
                                                <label htmlFor="sitioWeb" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                                    Sitio web (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    id="sitioWeb"
                                                    name="sitioWeb"
                                                    value={formData.sitioWeb}
                                                    onChange={handleTextChange}
                                                    placeholder="www.academiadesaludegac.com"
                                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-indigo-100 focus:border-indigo-400 focus:outline-none focus:ring-4 transition-all text-sm"
                                                />
                                            </div>

                                            {/* Enlace / Subdominio */}
                                            <div className="space-y-1.5">
                                                <label htmlFor="subdominio" className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                                    Enlace de la academia (subdominio) <span className="text-red-500">*</span>
                                                </label>
                                                <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                                    <span className="bg-slate-50 text-slate-400 px-3 flex items-center text-xs font-semibold border-r border-slate-200 select-none">
                                                        https://
                                                    </span>
                                                    <input
                                                        type="text"
                                                        id="subdominio"
                                                        name="subdominio"
                                                        value={formData.subdominio}
                                                        onChange={handleTextChange}
                                                        placeholder="mi-academia"
                                                        className="w-full px-3 py-2 text-sm focus:outline-none"
                                                    />
                                                    <span className="bg-slate-50 text-slate-400 px-3 flex items-center text-xs font-semibold border-l border-slate-200 select-none">
                                                        .iedch.com
                                                    </span>
                                                </div>
                                                {errors.subdominio && <p className="text-xs font-medium text-red-500">{errors.subdominio}</p>}
                                            </div>

                                            {/* Redes sociales */}
                                            <div className="space-y-3">
                                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                                                    Redes sociales (opcional)
                                                </label>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {/* Facebook */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSocial('facebook')}
                                                        className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all font-extrabold text-base select-none relative cursor-pointer ${
                                                            activeSocial === 'facebook'
                                                                ? 'border-blue-600 bg-blue-50 text-blue-650 ring-2 ring-blue-550/15'
                                                                : formData.facebook
                                                                    ? 'border-blue-200 bg-blue-50/20 text-blue-600'
                                                                    : 'border-slate-200 hover:border-slate-350 text-slate-400 bg-white'
                                                        }`}
                                                    >
                                                        f
                                                        {formData.facebook && (
                                                            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-blue-600" />
                                                        )}
                                                    </button>

                                                    {/* Instagram */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSocial('instagram')}
                                                        className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all font-extrabold text-base select-none relative cursor-pointer ${
                                                            activeSocial === 'instagram'
                                                                ? 'border-pink-500 bg-pink-50 text-pink-650 ring-2 ring-pink-550/15'
                                                                : formData.instagram
                                                                    ? 'border-pink-200 bg-pink-50/20 text-pink-500'
                                                                    : 'border-slate-200 hover:border-slate-350 text-slate-400 bg-white'
                                                        }`}
                                                    >
                                                        📸
                                                        {formData.instagram && (
                                                            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-pink-500" />
                                                        )}
                                                    </button>

                                                    {/* LinkedIn */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSocial('linkedin')}
                                                        className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all font-extrabold text-base select-none relative cursor-pointer ${
                                                            activeSocial === 'linkedin'
                                                                ? 'border-sky-700 bg-sky-50 text-sky-750 ring-2 ring-sky-550/15'
                                                                : formData.linkedin
                                                                    ? 'border-sky-200 bg-sky-50/20 text-sky-700'
                                                                    : 'border-slate-200 hover:border-slate-350 text-slate-400 bg-white'
                                                        }`}
                                                    >
                                                        in
                                                        {formData.linkedin && (
                                                            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-sky-700" />
                                                        )}
                                                    </button>

                                                    {/* YouTube */}
                                                    <button
                                                        type="button"
                                                        onClick={() => setActiveSocial('youtube')}
                                                        className={`h-10 w-10 rounded-xl border flex items-center justify-center transition-all font-extrabold text-base select-none relative cursor-pointer ${
                                                            activeSocial === 'youtube'
                                                                ? 'border-red-650 bg-red-50 text-red-700 ring-2 ring-red-550/15'
                                                                : formData.youtube
                                                                    ? 'border-red-200 bg-red-50/20 text-red-650'
                                                                    : 'border-slate-200 hover:border-slate-350 text-slate-400 bg-white'
                                                        }`}
                                                    >
                                                        ▶
                                                        {formData.youtube && (
                                                            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-600" />
                                                        )}
                                                    </button>

                                                    {/* Add button */}
                                                    <button type="button" className="h-10 w-10 rounded-xl border border-slate-200 hover:border-slate-350 text-slate-400 flex items-center justify-center bg-slate-50 font-bold transition-all text-lg cursor-pointer">
                                                        +
                                                    </button>
                                                </div>

                                                {/* Input dinámico grande para la red social seleccionada */}
                                                <div className="pt-1.5">
                                                    {activeSocial === 'facebook' && (
                                                        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                                            <span className="bg-blue-50 text-blue-650 px-3.5 flex items-center text-xs font-bold border-r border-slate-200 select-none">
                                                                facebook.com/
                                                            </span>
                                                            <input
                                                                type="text"
                                                                name="facebook"
                                                                value={formData.facebook}
                                                                onChange={handleTextChange}
                                                                placeholder="nombre-de-usuario-o-pagina"
                                                                className="w-full px-3.5 py-2.5 text-sm focus:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                    {activeSocial === 'instagram' && (
                                                        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                                            <span className="bg-pink-50 text-pink-650 px-3.5 flex items-center text-xs font-bold border-r border-slate-200 select-none">
                                                                instagram.com/
                                                            </span>
                                                            <input
                                                                type="text"
                                                                name="instagram"
                                                                value={formData.instagram}
                                                                onChange={handleTextChange}
                                                                placeholder="nombre-de-usuario"
                                                                className="w-full px-3.5 py-2.5 text-sm focus:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                    {activeSocial === 'linkedin' && (
                                                        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                                            <span className="bg-sky-50 text-sky-750 px-3.5 flex items-center text-xs font-bold border-r border-slate-200 select-none">
                                                                linkedin.com/in/
                                                            </span>
                                                            <input
                                                                type="text"
                                                                name="linkedin"
                                                                value={formData.linkedin}
                                                                onChange={handleTextChange}
                                                                placeholder="perfil-profesional"
                                                                className="w-full px-3.5 py-2.5 text-sm focus:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                    {activeSocial === 'youtube' && (
                                                        <div className="flex rounded-xl overflow-hidden border border-slate-200 focus-within:ring-4 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                                                            <span className="bg-red-50 text-red-750 px-3.5 flex items-center text-xs font-bold border-r border-slate-200 select-none">
                                                                youtube.com/@
                                                            </span>
                                                            <input
                                                                type="text"
                                                                name="youtube"
                                                                value={formData.youtube}
                                                                onChange={handleTextChange}
                                                                placeholder="nombre-de-canal"
                                                                className="w-full px-3.5 py-2.5 text-sm focus:outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* PASO 4: RESUMEN */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Resumen</h2>
                                    <p className="text-sm text-slate-500 mt-1">Revisa la información de tu academia antes de finalizar.</p>
                                </div>

                                <div className="space-y-6">
                                    {/* Grid de 3 Tarjetas */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        
                                        {/* Tarjeta 1: Información básica */}
                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-4 flex flex-col justify-between">
                                            <div className="space-y-3.5">
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Información básica</h3>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setCurrentStep(1)}
                                                        className="text-xs font-bold text-indigo-650 hover:underline cursor-pointer"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                                <div className="space-y-3 text-xs">
                                                    <div>
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Nombre</span>
                                                        <p className="text-slate-800 font-semibold mt-0.5">{formData.nombre || 'No especificado'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Descripción</span>
                                                        <p className="text-slate-700 font-medium leading-relaxed mt-0.5">{formData.descripcion || 'No especificada'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Categoría</span>
                                                        <p className="text-slate-800 font-semibold mt-0.5">{formData.categoria}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {formData.logoPreview && (
                                                <div className="pt-3 border-t border-slate-100">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-2">Logo</span>
                                                    <div className="h-16 w-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center p-2 overflow-hidden shadow-3xs">
                                                        <img src={formData.logoPreview} alt="Logo" className="object-contain h-full w-full" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tarjeta 2: Personalización */}
                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-4 flex flex-col justify-between">
                                            <div className="space-y-3.5">
                                                <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                    <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Personalización</h3>
                                                    <button 
                                                        type="button" 
                                                        onClick={() => setCurrentStep(2)}
                                                        className="text-xs font-bold text-indigo-650 hover:underline cursor-pointer"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                                <div className="space-y-3 text-xs">
                                                    <div>
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Color principal</span>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <div className="h-5 w-5 rounded-full border border-slate-350 shadow-3xs" style={{ backgroundColor: formData.colorPrincipal }} />
                                                            <span className="text-slate-700 font-semibold uppercase">{formData.colorPrincipal}</span>
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Mensaje de bienvenida</span>
                                                        <p className="text-slate-700 font-medium leading-relaxed mt-0.5">{formData.mensajeBienvenida || 'No configurado'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            {formData.bannerPreview && (
                                                <div className="pt-3 border-t border-slate-100">
                                                    <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-2">Banner</span>
                                                    <div className="h-16 w-full rounded-xl bg-white border border-slate-200 overflow-hidden shadow-3xs">
                                                        <img src={formData.bannerPreview} alt="Banner" className="object-cover h-full w-full" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Tarjeta 3: Configuración */}
                                        <div className="bg-slate-50/50 rounded-2xl border border-slate-200/60 p-5 space-y-4">
                                            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                                                <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Configuración</h3>
                                                <button 
                                                    type="button" 
                                                    onClick={() => setCurrentStep(3)}
                                                    className="text-xs font-bold text-indigo-650 hover:underline cursor-pointer"
                                                    disabled={saving}
                                                >
                                                    Editar
                                                </button>
                                            </div>
                                            <div className="space-y-3 text-xs">
                                                <div className="space-y-1.5 font-bold text-slate-750">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-white ${formData.publica ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                            ✓
                                                        </span>
                                                        <span>Academia pública</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-white ${formData.permitirInscripciones ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                            ✓
                                                        </span>
                                                        <span>Permitir inscripciones</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-white ${formData.certificadosAutomaticos ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                            ✓
                                                        </span>
                                                        <span>Certificados automáticos</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`h-4.5 w-4.5 rounded-full flex items-center justify-center text-white ${formData.foroDiscusion ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                            ✓
                                                        </span>
                                                        <span>Foro de discusión</span>
                                                    </div>
                                                </div>
                                                <div className="pt-2 border-t border-slate-100/80 space-y-2">
                                                    <div>
                                                        <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Correo de contacto</span>
                                                        <p className="text-slate-800 font-semibold mt-0.5 truncate">{formData.correoContacto || 'No especificado'}</p>
                                                    </div>
                                                    {formData.telefono && (
                                                        <div>
                                                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Teléfono</span>
                                                            <p className="text-slate-800 font-semibold mt-0.5">{formData.telefono}</p>
                                                        </div>
                                                    )}
                                                    {formData.sitioWeb && (
                                                        <div>
                                                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Sitio web</span>
                                                            <p className="text-slate-800 font-semibold mt-0.5 truncate">{formData.sitioWeb}</p>
                                                        </div>
                                                    )}
                                                    {(formData.facebook || formData.instagram || formData.linkedin || formData.youtube) && (
                                                        <div>
                                                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">Redes sociales</span>
                                                            <div className="flex items-center gap-2">
                                                                {formData.facebook && <span className="h-6 w-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">f</span>}
                                                                {formData.instagram && <span className="h-6 w-6 rounded-md bg-pink-50 text-pink-500 flex items-center justify-center font-bold text-xs">📷</span>}
                                                                {formData.linkedin && <span className="h-6 w-6 rounded-md bg-sky-50 text-sky-700 flex items-center justify-center font-bold text-xs">in</span>}
                                                                {formData.youtube && <span className="h-6 w-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center font-bold text-xs">▶</span>}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Barra Verde: ¿Listo para crear tu curso? */}
                                    <div className="bg-[#f0fdf4] border border-emerald-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="h-12 w-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-slate-900 text-sm">
                                                    ¿Listo para crear tu curso?
                                                </h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                                                    Tu academia está casi lista. Crea tu primer curso o salta este paso y créalo después.
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, crearCursoAhora: 'si' }))}
                                                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                                                    formData.crearCursoAhora === 'si'
                                                        ? 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
                                                        : 'bg-white hover:bg-slate-50 text-emerald-600 border border-emerald-250'
                                                }`}
                                            >
                                                Crear mi primer curso
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={() => setFormData(prev => ({ ...prev, crearCursoAhora: 'no' }))}
                                                className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-extrabold text-xs transition-all cursor-pointer ${
                                                    formData.crearCursoAhora === 'no'
                                                        ? 'bg-[#10b981] text-white shadow-sm hover:bg-emerald-700'
                                                        : 'bg-white hover:bg-slate-50 text-slate-650 border border-slate-200'
                                                }`}
                                            >
                                                Saltar por ahora
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Error de base de datos */}
                        {dbError && (
                            <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex gap-3 text-red-950 text-xs">
                                <div className="h-5 w-5 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600 font-bold">
                                    !
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold">Error al guardar la academia</p>
                                    <p className="text-red-800/90 mt-0.5">{dbError}</p>
                                </div>
                            </div>
                        )}

                        {/* Botones de Navegación del Formulario */}
                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                            {currentStep > 1 ? (
                                <button
                                    onClick={handleBack}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <ArrowLeft className="h-4 w-4" /> Atrás
                                </button>
                            ) : (
                                <button
                                    onClick={() => router.push('/profesor')}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm px-5 py-2.5 rounded-xl transition-all shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancelar
                                </button>
                            )}

                            {currentStep < STEPS.length ? (
                                <button
                                    onClick={handleNext}
                                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg transition-all"
                                >
                                    Siguiente <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow-md shadow-indigo-600/10 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {saving ? (
                                        <>
                                            Guardando <Loader2 className="h-4 w-4 animate-spin" />
                                        </>
                                    ) : (
                                        <>
                                            Confirmar y crear <Check className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Tarjeta Lateral Flotante: Dinámica según el Paso */}
                    {currentStep < 4 && (
                        <div className="lg:col-span-1 space-y-6">
                            {currentStep === 2 ? (
                                <div className="bg-slate-100/50 rounded-3xl border border-slate-200/80 p-6 space-y-4">
                                    <h3 className="font-extrabold text-slate-900 text-sm">
                                        Vista previa
                                    </h3>
                                    
                                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                        {/* Cabecera de la academia simulada con color principal */}
                                        <div 
                                            className="p-5 flex items-center gap-4 transition-colors duration-300 border-b border-slate-100"
                                            style={{ backgroundColor: `${formData.colorPrincipal}12` }}
                                        >
                                            <div 
                                                className="h-14 w-14 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs border border-white overflow-hidden transition-colors duration-300"
                                                style={{ backgroundColor: formData.colorPrincipal }}
                                            >
                                                {formData.logoPreview ? (
                                                    <img src={formData.logoPreview} alt="Logo" className="object-contain h-full w-full" />
                                                ) : (
                                                    <Building2 className="h-7 w-7" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h4 className="font-extrabold text-slate-900 text-sm truncate">
                                                    {formData.nombre || 'Academia de Salud EGAC'}
                                                </h4>
                                                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                                    {formData.descripcion || 'Academia enfocada en la formación y certificación en el área de la salud.'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Tabs simuladas */}
                                        <div className="px-4 py-2 flex gap-4 text-[10px] font-bold text-slate-400 border-b border-slate-100 select-none">
                                            <span className="pb-1 border-b-2 transition-colors duration-300" style={{ color: formData.colorPrincipal, borderColor: formData.colorPrincipal }}>
                                                Inicio
                                            </span>
                                            <span className="pb-1">Cursos</span>
                                            <span className="pb-1">Instructores</span>
                                            <span className="pb-1">Acerca de</span>
                                        </div>

                                        {/* Contenido simulado */}
                                        <div className="p-4 space-y-3 bg-slate-50/50 flex-1 min-h-[140px]">
                                            <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-3xs space-y-2">
                                                <h5 className="text-[11px] font-bold text-slate-800">
                                                    Mensaje de bienvenida
                                                </h5>
                                                <p className="text-[10px] text-slate-500 leading-relaxed">
                                                    {formData.mensajeBienvenida || '¡Bienvenido a nuestra academia! Aquí encontrarás cursos diseñados para impulsar tu desarrollo profesional.'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-100/50 rounded-3xl border border-slate-200/80 p-6 space-y-6">
                                    <div className="space-y-4">
                                        <h3 className="font-extrabold text-slate-900 text-md text-center">
                                            ¿Quieres crear un curso ahora?
                                        </h3>
                                        
                                        {/* Ilustración de Laptop y Birrete */}
                                        <div className="flex justify-center py-4 select-none pointer-events-none">
                                            <svg className="w-40 h-28 text-indigo-600/90 drop-shadow-sm" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <rect x="20" y="10" width="80" height="50" rx="6" fill="currentColor" fillOpacity="0.08" stroke="currentColor" strokeWidth="2.5"/>
                                                <rect x="10" y="60" width="100" height="8" rx="2.5" fill="currentColor" stroke="currentColor" strokeWidth="2.5"/>
                                                <line x1="45" y1="64" x2="75" y2="64" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
                                                {/* Birrete */}
                                                <polygon points="60,20 80,29 60,38 40,29" fill="currentColor" fillOpacity="0.25" stroke="currentColor" strokeWidth="1.5"/>
                                                <path d="M48,31 V40 C48,43.5 72,43.5 72,40 V31" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                                <path d="M80,29 V38" stroke="currentColor" strokeWidth="1.5"/>
                                                <circle cx="80" cy="38" r="2.5" fill="currentColor"/>
                                                {/* Libros detrás */}
                                                <rect x="5" y="45" width="12" height="15" rx="1" transform="rotate(-15 5 45)" fill="currentColor" fillOpacity="0.1" stroke="currentColor" strokeWidth="1.5"/>
                                            </svg>
                                        </div>

                                        {/* Opciones Radio */}
                                        <div className="space-y-3">
                                            {/* Opción Sí */}
                                            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                                formData.crearCursoAhora === 'si'
                                                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/5 shadow-2xs'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white/60'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="crearCursoAhora"
                                                    value="si"
                                                    checked={formData.crearCursoAhora === 'si'}
                                                    onChange={handleTextChange}
                                                    className="h-4.5 w-4.5 text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5"
                                                />
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-bold text-slate-800">Sí, crear un curso ahora</span>
                                                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md uppercase">
                                                            Recomendado
                                                        </span>
                                                    </div>
                                                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Te permitirá tener todo listo para recibir alumnos.</p>
                                                </div>
                                            </label>

                                            {/* Opción No */}
                                            <label className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                                formData.crearCursoAhora === 'no'
                                                    ? 'border-indigo-600 bg-white ring-2 ring-indigo-500/5 shadow-2xs'
                                                    : 'border-slate-200 hover:border-slate-300 bg-white/60'
                                            }`}>
                                                <input
                                                    type="radio"
                                                    name="crearCursoAhora"
                                                    value="no"
                                                    checked={formData.crearCursoAhora === 'no'}
                                                    onChange={handleTextChange}
                                                    className="h-4.5 w-4.5 text-indigo-600 border-slate-300 focus:ring-indigo-500 mt-0.5"
                                                />
                                                <div className="min-w-0">
                                                    <span className="text-xs font-bold text-slate-800">No, lo haré después</span>
                                                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">Podrás crear cursos más adelante desde tu academia.</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>

            </div>
        </div>
    )
}
