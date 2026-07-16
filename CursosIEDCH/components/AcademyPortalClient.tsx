'use client'

import React, { useState, useEffect } from 'react'
import { 
    Users, BookOpen, Layers, Info, ShieldAlert, CheckCircle2, 
    Calendar, Award, MessageSquare, ChevronRight, User, Phone, 
    Mail, Lock, KeyRound, Globe, ArrowLeft, ExternalLink, Play
} from 'lucide-react'
import Link from 'next/link'

interface AcademyPortalClientProps {
    academia: any
    creador: any
    grupos: any[]
    cursos: any[]
    alumnosCount: number
    esMock?: boolean
}

export default function AcademyPortalClient({
    academia,
    creador,
    grupos,
    cursos,
    alumnosCount,
    esMock = false
}: AcademyPortalClientProps) {
    const [accessCode, setAccessCode] = useState('')
    const [hasAccess, setHasAccess] = useState(true)
    const [errorMsg, setErrorMsg] = useState('')
    const [constanciaDoc, setConstanciaDoc] = useState('')
    const [constanciaResult, setConstanciaResult] = useState<any>(null)
    const [verifyingConstancia, setVerifyingConstancia] = useState(false)

    const isPrivate = !academia.publica

    useEffect(() => {
        if (isPrivate) {
            // Verificar si ya tiene el acceso validado en sessionStorage
            const sessionAccess = sessionStorage.getItem(`academy_access_${academia.id}`)
            if (sessionAccess === 'true') {
                setHasAccess(true)
            } else {
                setHasAccess(false)
            }
        }
    }, [academia.id, isPrivate])

    // Registrar al alumno de forma persistente en la academia
    useEffect(() => {
        if (hasAccess && !esMock) {
            async function registrarMembresia() {
                try {
                    const { createClient } = await import('@/lib/supabase/client')
                    const supabaseClient = createClient()
                    const { data: { user } } = await supabaseClient.auth.getUser()
                    if (user) {
                        const { error } = await supabaseClient
                            .from('ie_academia_alumnos')
                            .insert({
                                academia_id: academia.id,
                                user_id: user.id
                            })
                        // Ignoramos error 23505 (violación de clave única si ya estaba registrado)
                        if (error && error.code !== '23505') {
                            console.error('Error registrando membresía de academia:', error)
                        }
                    }
                } catch (e) {
                    console.error('Error al registrar membresía:', e)
                }
            }
            registrarMembresia()
        }
    }, [hasAccess, academia.id, esMock])

    const handleVerifyCode = (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')

        // El código real viene de la academia, si es mock podemos usar '1234' o el guardado
        const realCode = esMock ? '1234' : (academia.codigo_acceso || '')

        if (accessCode.trim() === realCode.trim()) {
            sessionStorage.setItem(`academy_access_${academia.id}`, 'true')
            setHasAccess(true)
        } else {
            setErrorMsg('El código de acceso es incorrecto. Por favor verifícalo con tu profesor.')
        }
    }

    const handleVerifyConstancia = (e: React.FormEvent) => {
        e.preventDefault()
        if (!constanciaDoc.trim()) return

        setVerifyingConstancia(true)
        setConstanciaResult(null)

        // Simulación de verificación de constancia
        setTimeout(() => {
            setVerifyingConstancia(false)
            // Simular resultado positivo o negativo basado en el largo del código
            if (constanciaDoc.length >= 6) {
                setConstanciaResult({
                    valido: true,
                    codigo: constanciaDoc.toUpperCase(),
                    alumno: 'Jesús Sergio Olvera',
                    curso: cursos[0]?.titulo || 'Enfermería Básica Hospitalaria',
                    fecha: new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })
                })
            } else {
                setConstanciaResult({
                    valido: false,
                    error: 'El folio ingresado no coincide con ningún certificado emitido por esta academia.'
                })
            }
        }, 1200)
    }

    // Si la academia es privada y no tiene acceso concedido, mostrar pantalla del código
    if (isPrivate && !hasAccess) {
        return (
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-zinc-50 px-4 py-12">
                <div className="max-w-md w-full bg-white rounded-3xl border border-zinc-200/80 shadow-2xl p-8 transition-all duration-300 hover:shadow-indigo-500/5">
                    <div className="flex flex-col items-center text-center">
                        <div className="h-16 w-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 border border-indigo-100">
                            <Lock className="h-8 w-8 animate-pulse" />
                        </div>
                        
                        <h2 className="text-2xl font-black text-zinc-950 tracking-tight mb-2">
                            Academia Privada
                        </h2>
                        
                        <p className="text-zinc-500 text-sm mb-8 max-w-sm">
                            Esta academia requiere un código de acceso proporcionado por tu profesor o institución para poder ingresar.
                        </p>

                        <form onSubmit={handleVerifyCode} className="w-full space-y-4">
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-400" />
                                <input
                                    type="text"
                                    placeholder="Ingresa el código de acceso"
                                    value={accessCode}
                                    onChange={(e) => setAccessCode(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-800 text-sm font-semibold placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-650 transition-all"
                                    required
                                />
                            </div>

                            {errorMsg && (
                                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-bold text-left flex items-start gap-2 animate-shake">
                                    <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <button
                                type="submit"
                                className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-extrabold text-sm py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
                            >
                                Validar Código
                            </button>
                        </form>

                        <Link
                            href="/dashboard"
                            className="mt-6 flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700 text-xs font-bold transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Volver al dashboard
                        </Link>
                    </div>
                </div>
            </div>
        )
    }

    const colorAcademia = academia.color_principal || '#6366f1'
    const iniciales = academia.nombre
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()

    // Configurar redes sociales
    const redes = academia.redes_sociales || {}

    return (
        <div className="bg-zinc-50 min-h-[calc(100vh-64px)] font-sans pb-16">
            
            {/* Cabecera / Banner de Academia */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-1.5 text-zinc-500 hover:text-zinc-700 text-xs font-bold mb-6 transition-colors bg-white px-3.5 py-2 rounded-xl border border-zinc-200 shadow-2xs cursor-pointer"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Volver al Dashboard
                </Link>

                <div 
                    className="relative overflow-hidden rounded-3xl text-white shadow-xl border border-zinc-800/10 min-h-[220px] md:min-h-[260px] flex flex-col justify-end p-6 md:p-8"
                    style={{ 
                        background: academia.banner_url 
                            ? `linear-gradient(to top, rgba(15, 23, 42, 0.95) 0%, rgba(15, 23, 42, 0.4) 100%), url(${academia.banner_url}) center/cover no-repeat`
                            : `linear-gradient(135deg, ${colorAcademia}dd, #0f172a)`
                    }}
                >
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 z-10">
                        <div className="flex items-center gap-4 md:gap-6">
                            {academia.logo_url ? (
                                <img 
                                    src={academia.logo_url} 
                                    alt={academia.nombre} 
                                    className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover border-2 border-white/20 shadow-lg bg-white/10"
                                />
                            ) : (
                                <div 
                                    className="h-16 w-16 md:h-20 md:w-20 rounded-2xl flex items-center justify-center text-white font-black text-xl border-2 border-white/20 shadow-lg"
                                    style={{ backgroundColor: colorAcademia }}
                                >
                                    {iniciales}
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl md:text-3xl font-black tracking-tight leading-tight mb-2">
                                    {academia.nombre}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs md:text-sm text-zinc-300 font-bold">
                                    <span className="flex items-center gap-1.5">
                                        <Users className="h-4 w-4" />
                                        {alumnosCount.toLocaleString()} alumnos
                                    </span>
                                    <span className="h-1.5 w-1.5 rounded-full bg-white/30 hidden sm:inline-block"></span>
                                    <span className="flex items-center gap-1.5">
                                        <BookOpen className="h-4 w-4" />
                                        {cursos.length} cursos
                                    </span>
                                    <span className="h-1.5 w-1.5 rounded-full bg-white/30 hidden sm:inline-block"></span>
                                    <span className="flex items-center gap-1.5">
                                        <Layers className="h-4 w-4" />
                                        {grupos.length} grupos
                                    </span>
                                </div>
                                <p className="text-zinc-300 text-xs md:text-sm font-medium mt-3.5 max-w-2xl leading-relaxed">
                                    {academia.descripcion || 'Espacio de formación continua para profesionales y estudiantes.'}
                                </p>
                            </div>
                        </div>

                        <div className="shrink-0 flex gap-3">
                            <button 
                                onClick={() => {
                                    alert(`Información de contacto:\nEmail: ${academia.correo_contacto}\nTeléfono: ${academia.telefono_contacto || 'No disponible'}`)
                                }}
                                className="bg-white/10 hover:bg-white/20 active:scale-95 text-white font-extrabold text-xs px-5 py-3 rounded-xl border border-white/10 shadow-md backdrop-blur-md transition-all cursor-pointer flex items-center gap-2"
                            >
                                <Info className="h-4.5 w-4.5" />
                                Información
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Layout Principal de 2 Columnas */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    
                    {/* Columna Izquierda: Verificar Constancias, Grupos y Cursos */}
                    <div className="lg:col-span-2 space-y-8">
                        
                        {/* Tarjeta: Verifica tus constancias */}
                        <div className="bg-[#f8f7ff] rounded-3xl p-6 md:p-8 border border-[#e8e5f9] shadow-2xs relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex flex-col sm:flex-row items-center gap-5 w-full md:w-3/5">
                                {/* Escudo / Medalla Izquierda */}
                                <div className="h-16 w-16 bg-[#eef0ff] rounded-full flex items-center justify-center shrink-0">
                                    <div className="h-11 w-11 bg-[#3125db] rounded-full flex items-center justify-center text-white">
                                        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                            <path d="M9 11l2 2 4-4" />
                                        </svg>
                                    </div>
                                </div>

                                <div className="space-y-1 text-center sm:text-left">
                                    <h2 className="text-xl font-bold text-zinc-950 tracking-tight">
                                        Verifica tus constancias
                                    </h2>
                                    <p className="text-zinc-500 text-xs sm:text-sm leading-relaxed font-medium">
                                        Consulta y verifica la autenticidad de tus constancias emitidas en EGAC de forma rápida y segura.
                                    </p>
                                </div>
                            </div>

                            {/* Botón y Gráfico Derecho */}
                            <div className="flex items-center gap-6 w-full md:w-2/5 justify-center md:justify-end shrink-0">
                                <button 
                                    type="button"
                                    className="bg-[#3125db] text-white font-bold text-xs sm:text-sm px-6 py-3.5 rounded-xl shadow-md shadow-[#3125db]/15 whitespace-nowrap cursor-default"
                                >
                                    Verificar constancia
                                </button>

                                {/* Ilustración de Certificado */}
                                <div className="relative w-20 h-20 shrink-0 hidden sm:block">
                                    <svg className="w-full h-full text-indigo-400" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        {/* Documento trasero */}
                                        <rect x="15" y="10" width="50" height="65" rx="6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        
                                        {/* Documento principal delantero */}
                                        <rect x="25" y="20" width="50" height="65" rx="6" fill="white" stroke="currentColor" strokeWidth="2.5" />
                                        <line x1="35" y1="35" x2="60" y2="35" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="35" y1="47" x2="65" y2="47" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                        <line x1="35" y1="59" x2="55" y2="59" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />

                                        {/* Círculo de verificación detrás */}
                                        <circle cx="78" cy="45" r="14" fill="#eef0ff" />
                                        <path d="M73 45L76 48L83 41" stroke="#3125db" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

                                        {/* Sello de listón */}
                                        <circle cx="68" cy="78" r="9" fill="#3125db" stroke="white" strokeWidth="1.5" />
                                        <path d="M64 84L64 94L68 90L72 94L72 84" fill="#3125db" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Sección: Grupos de la academia */}
                        <div>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                                    Grupos de la academia
                                </h3>
                                <button className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition-colors cursor-pointer">
                                    Ver todos
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                                {grupos.map((grupo) => (
                                    <div key={grupo.id} className="bg-white p-5 rounded-2xl border border-zinc-200/70 shadow-2xs hover:shadow-md hover:scale-[1.02] transition-all flex flex-col justify-between min-h-[140px]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="h-10 w-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                                                <Layers className="h-5 w-5" />
                                            </div>
                                        </div>
                                        <div className="my-3">
                                            <h4 className="font-extrabold text-zinc-800 text-sm leading-tight line-clamp-1">
                                                {grupo.nombre}
                                            </h4>
                                            <p className="text-[10px] text-zinc-400 font-bold mt-1">
                                                {grupo.descripcion || 'Grupo de estudio de la academia'}
                                            </p>
                                        </div>
                                        <button 
                                            onClick={() => alert(`Entrando al grupo: ${grupo.nombre}`)}
                                            className="w-full py-2 border border-indigo-100 hover:bg-indigo-50 text-indigo-600 font-extrabold text-xs rounded-xl transition-all cursor-pointer text-center"
                                        >
                                            Entrar al grupo
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Sección: Cursos de la academia */}
                        <div>
                            <div className="flex justify-between items-center mb-5">
                                <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                                    Cursos de la academia
                                </h3>
                                <button className="text-indigo-600 hover:text-indigo-800 text-xs font-bold transition-colors cursor-pointer">
                                    Ver todos
                                </button>
                            </div>

                            {cursos.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                    {cursos.map((curso) => (
                                        <div key={curso.id} className="bg-white rounded-2xl overflow-hidden border border-zinc-200/70 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
                                            <div className="relative h-44 bg-zinc-100 shrink-0">
                                                {curso.imagen_url ? (
                                                    <img src={curso.imagen_url} alt={curso.titulo} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                        <BookOpen className="h-10 w-10" />
                                                    </div>
                                                )}
                                                {curso.precio === 0 && (
                                                    <span className="absolute left-3 bottom-3 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider">
                                                        Gratis
                                                    </span>
                                                )}
                                            </div>
                                            <div className="p-4 flex-1 flex flex-col justify-between">
                                                <div>
                                                    <h4 className="font-extrabold text-zinc-900 text-sm leading-snug line-clamp-2">
                                                        {curso.titulo}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <div className="h-6 w-6 bg-zinc-150 rounded-full flex items-center justify-center text-zinc-500 overflow-hidden shrink-0 border border-zinc-100">
                                                            {curso.profesor?.fotografia_perfil ? (
                                                                <img src={curso.profesor?.fotografia_perfil} alt={curso.profesor?.nombre} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <User className="h-3.5 w-3.5" />
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-zinc-500 font-bold truncate">
                                                            {curso.profesor?.nombre || 'Instructor'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between border-t border-zinc-100 pt-3.5 mt-4">
                                                    <span className="font-black text-indigo-650 text-sm">
                                                        {curso.precio > 0 ? `$${curso.precio} MXN` : 'Gratis'}
                                                    </span>
                                                    <Link 
                                                        href={`/cursos/${curso.id}`}
                                                        className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-[11px] px-4 py-2 rounded-lg transition-all cursor-pointer shadow-sm shadow-indigo-600/10"
                                                    >
                                                        Ver curso
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center bg-white p-12 rounded-3xl border border-dashed border-zinc-200">
                                    <BookOpen className="h-8 w-8 text-zinc-300 mx-auto mb-3" />
                                    <h4 className="font-extrabold text-zinc-800 text-sm mb-1">No hay cursos publicados</h4>
                                    <p className="text-[11px] text-zinc-400">Pronto se añadirán nuevos cursos a esta academia.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Columna Derecha: Información adicional y Creador */}
                    <div className="lg:col-span-1 space-y-6">
                        
                        {/* Actividad reciente */}
                        <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs">
                            <h3 className="text-sm font-black text-zinc-900 mb-4 tracking-tight">
                                Actividad reciente
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { titulo: 'Nueva discusión', desc: '"Experiencias en el cuidado del paciente renal"', hora: 'Hace 2 horas', icon: MessageSquare, bg: 'bg-indigo-50', text: 'text-indigo-600' },
                                    { titulo: 'Nuevo grupo creado', desc: '"Urgencias y Emergencias"', hora: 'Hace 1 día', icon: Layers, bg: 'bg-emerald-50', text: 'text-emerald-600' },
                                    { titulo: 'Nuevo curso agregado', desc: '"Cuidados de Heridas en Pacientes Diabéticos"', hora: 'Hace 2 días', icon: BookOpen, bg: 'bg-amber-50', text: 'text-amber-600' },
                                ].map((act, idx) => {
                                    const Icon = act.icon
                                    return (
                                        <div key={idx} className="flex gap-3">
                                            <div className={`h-8 w-8 ${act.bg} ${act.text} rounded-lg flex items-center justify-center shrink-0`}>
                                                <Icon className="h-4.5 w-4.5" />
                                            </div>
                                            <div>
                                                <h4 className="font-extrabold text-zinc-800 text-xs leading-none">
                                                    {act.titulo}
                                                </h4>
                                                <p className="text-[10px] text-zinc-500 font-bold mt-1">
                                                    {act.desc}
                                                </p>
                                                <span className="text-[9px] text-zinc-400 mt-1 block">
                                                    {act.hora}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Sobre esta academia */}
                        <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 shadow-xs">
                            <h3 className="text-sm font-black text-zinc-900 mb-4 tracking-tight">
                                Sobre esta academia
                            </h3>
                            <div className="space-y-4 text-xs font-bold text-zinc-700">
                                <div className="flex items-center gap-3">
                                    <User className="h-4.5 w-4.5 text-zinc-400" />
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-medium">Fundador</p>
                                        <p className="text-zinc-800">{creador?.nombre || 'Dr. Juan Pérez'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4.5 w-4.5 text-zinc-400" />
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-medium">Fecha de creación</p>
                                        <p className="text-zinc-800">
                                            {new Date(academia.created_at || Date.now()).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Award className="h-4.5 w-4.5 text-zinc-400" />
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-medium">Certificados emitidos</p>
                                        <p className="text-zinc-800">3,450</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Users className="h-4.5 w-4.5 text-zinc-400" />
                                    <div>
                                        <p className="text-[10px] text-zinc-400 font-medium">Miembros</p>
                                        <p className="text-zinc-800">{alumnosCount.toLocaleString()} alumnos</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Instructor Principal */}
                        <div className="bg-white rounded-3xl border border-zinc-250 p-6 shadow-xs relative overflow-hidden">
                            <h3 className="text-sm font-black text-zinc-900 mb-4 tracking-tight">
                                Instructor Principal
                            </h3>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-12 w-12 rounded-full overflow-hidden shrink-0 border border-zinc-200">
                                    {creador?.fotografia_perfil ? (
                                        <img src={creador?.fotografia_perfil} alt={creador?.nombre} className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="h-full w-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm">
                                            {creador?.nombre?.charAt(0) || 'D'}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-zinc-900 text-xs">
                                        {creador?.nombre || 'Dr. Juan Pérez'}
                                    </h4>
                                    <p className="text-[10px] text-zinc-400 font-bold">
                                        Director Médico & Fundador
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-2 text-[11px] font-bold text-zinc-600 mb-6">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-zinc-400" />
                                    <span>{creador?.correo_contacto || 'contacto@academiaegac.com'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-zinc-400" />
                                    <span>{creador?.telefono_contacto || '+52 722 123 4567'}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-3.5 mb-6 text-zinc-400">
                                {redes.facebook && <a href={redes.facebook} target="_blank" className="hover:text-indigo-600 transition-colors"><Globe className="h-5 w-5" /></a>}
                                {redes.instagram && <a href={redes.instagram} target="_blank" className="hover:text-rose-600 transition-colors"><Globe className="h-5 w-5" /></a>}
                                {redes.linkedin && <a href={redes.linkedin} target="_blank" className="hover:text-blue-750 transition-colors"><Globe className="h-5 w-5" /></a>}
                                {redes.youtube && <a href={redes.youtube} target="_blank" className="hover:text-rose-650 transition-colors"><Globe className="h-5 w-5" /></a>}
                            </div>

                            <button 
                                onClick={() => alert(`Enviando mensaje al instructor...`)}
                                className="w-full py-3 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900 font-extrabold text-xs rounded-xl transition-all border border-zinc-200 cursor-pointer flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="h-4 w-4" />
                                Contactar instructor
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
