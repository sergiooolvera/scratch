'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { User, Mail, Lock, UserPlus, GraduationCap, CheckCircle, Eye, EyeOff, Building2, Phone, Hash } from 'lucide-react'

export default function RegisterPage() {
    const [tipoCuenta, setTipoCuenta] = useState<'persona' | 'institucion'>('persona')
    
    // Estados compartidos
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    // Estados Persona
    const [nombre, setNombre] = useState('')
    const [apellidoPaterno, setApellidoPaterno] = useState('')
    const [apellidoMaterno, setApellidoMaterno] = useState('')

    // Estados Institucion
    const [nombreEscuela, setNombreEscuela] = useState('')
    const [claveCCT, setClaveCCT] = useState('')
    const [telefono, setTelefono] = useState('')

    const supabase = createClient()

    const traducirErrorAuth = (msg: string) => {
        const m = msg.toLowerCase()
        if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
        if (m.includes('user already registered')) return 'Este correo ya está registrado.'
        return msg
    }

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSuccessMessage('')

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.')
            return
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.')
            return
        }

        setLoading(true)

        let metadata: any = {}

        if (tipoCuenta === 'persona') {
            metadata = {
                nombre,
                apellido_paterno: apellidoPaterno,
                apellido_materno: apellidoMaterno,
                rol: 'alumno'
            }
        } else {
            metadata = {
                nombre: nombreEscuela,
                apellido_paterno: '',
                apellido_materno: '',
                clave_cct: claveCCT,
                telefono: telefono,
                rol: 'institucion'
            }
        }

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata
            }
        })

        if (signUpError) {
            setError(traducirErrorAuth(signUpError.message))
            setLoading(false)
        } else {
            setSuccessMessage('¡Cuenta creada con éxito! Se ha enviado un correo de confirmación a tu bandeja de entrada. Por favor, haz clic en el enlace para activar tu cuenta antes de iniciar sesión.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex bg-zinc-50 font-sans">
            <div className={`hidden lg:block relative w-0 flex-1 bg-gradient-to-t transition-all duration-500 ${
                tipoCuenta === 'persona' ? 'from-blue-900 to-indigo-800' : 'from-orange-900 to-amber-700'
            }`}>
                <div className="absolute inset-0 h-full w-full object-cover px-16 py-24 flex flex-col justify-center text-center" >
                    <div className="mx-auto bg-white/10 p-6 rounded-full inline-block backdrop-blur-sm shadow-xl mb-8">
                        {tipoCuenta === 'persona' ? <GraduationCap className="h-16 w-16 text-blue-200" /> : <Building2 className="h-16 w-16 text-orange-200" />}
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight">
                        {tipoCuenta === 'persona' ? 'Da el primer paso hacia tu futuro' : 'Impulsa el aprendizaje en tu institución'}
                    </h2>
                    <p className="text-blue-100 text-lg mx-auto max-w-md">
                        {tipoCuenta === 'persona' 
                            ? 'Únete a cientos de estudiantes que ya están transformando su carrera con nuestros cursos de alto impacto.'
                            : 'Registra y certifica las actividades educativas de tu escuela con nuestra plataforma oficial.'}
                    </p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 overflow-y-auto">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {successMessage ? (
                        <div className="text-center animate-in fade-in zoom-in duration-500">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                <CheckCircle className="h-8 w-8 text-green-600" />
                            </div>
                            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
                                ¡Revisa tu correo!
                            </h2>
                            <p className="text-base text-gray-600 mb-8 leading-relaxed">
                                {successMessage}
                            </p>
                            <Link href="/login" className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all">
                                Ir a Iniciar Sesión
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Crear cuenta
                                </h2>
                                <p className="mt-2 text-sm text-gray-600 mb-6">
                                    ¿Ya tienes cuenta?{' '}
                                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                        Inicia sesión aquí
                                    </Link>
                                </p>
                            </div>

                            {/* Pestañas de tipo de cuenta */}
                            <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
                                <button
                                    onClick={() => setTipoCuenta('persona')}
                                    className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
                                        tipoCuenta === 'persona' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <User className="w-4 h-4 mr-2" />
                                    Persona
                                </button>
                                <button
                                    onClick={() => setTipoCuenta('institucion')}
                                    className={`flex-1 flex items-center justify-center py-2.5 text-sm font-medium rounded-lg transition-all ${
                                        tipoCuenta === 'institucion' ? 'bg-white text-orange-700 shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    <Building2 className="w-4 h-4 mr-2" />
                                    Institución
                                </button>
                            </div>

                            {/* Panel Identificador Naranja / Azul */}
                            {tipoCuenta === 'institucion' ? (
                                <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-850 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                                    <div className="flex items-start">
                                        <div className="p-2 bg-orange-100 rounded-lg mr-3 text-orange-600 flex-shrink-0">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-orange-900">Registro de Institución</h3>
                                            <p className="text-xs text-orange-800 mt-1 leading-relaxed">
                                                Estás registrando una <strong>escuela, academia, agencia o institución</strong>. Esto permitirá emitir certificados institucionales y organizar cursos grupales.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-100 text-blue-850 animate-in fade-in slide-in-from-top-2 duration-300 shadow-sm">
                                    <div className="flex items-start">
                                        <div className="p-2 bg-blue-100 rounded-lg mr-3 text-blue-600 flex-shrink-0">
                                            <User className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-sm text-blue-900">Registro de Persona</h3>
                                            <p className="text-xs text-blue-800 mt-1 leading-relaxed">
                                                Estás registrándote como <strong>estudiante individual</strong> para tomar cursos, realizar exámenes y recibir tus certificados personales.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="mt-4">
                                <form onSubmit={handleRegister} className="space-y-5">
                                    
                                    {tipoCuenta === 'persona' ? (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Nombre(s)</label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                        placeholder="Ej. Juan Carlos"
                                                        value={nombre}
                                                        onChange={(e) => setNombre(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Apellido Paterno</label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                        placeholder="Ej. Pérez"
                                                        value={apellidoPaterno}
                                                        onChange={(e) => setApellidoPaterno(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Apellido Materno (Opcional)</label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <User className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                        placeholder="Ej. García"
                                                        value={apellidoMaterno}
                                                        onChange={(e) => setApellidoMaterno(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                                <label className="block text-sm font-medium text-gray-700">Nombre de la escuela, academia, agencia o institución</label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Building2 className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        required
                                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                        placeholder="Ej. Escuela Primaria Benito Juárez, Academia de Idiomas"
                                                        value={nombreEscuela}
                                                        onChange={(e) => setNombreEscuela(e.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 delay-75">
                                                <label className="block text-sm font-medium text-gray-700">Clave/CCT <span className="text-gray-400 font-normal">(Opcional)</span></label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Hash className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border uppercase"
                                                        placeholder="Ej. 12DPR0001X"
                                                        value={claveCCT}
                                                        onChange={(e) => setClaveCCT(e.target.value.toUpperCase())}
                                                    />
                                                </div>
                                            </div>

                                            <div className="animate-in fade-in slide-in-from-right-4 duration-300 delay-150">
                                                <label className="block text-sm font-medium text-gray-700">Teléfono <span className="text-gray-400 font-normal">(Opcional)</span></label>
                                                <div className="mt-1 relative rounded-md shadow-sm">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                        <Phone className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                    <input
                                                        type="tel"
                                                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                        placeholder="Ej. 55 1234 5678"
                                                        value={telefono}
                                                        onChange={(e) => setTelefono(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className={`border-t border-gray-200 pt-5 mt-2 ${tipoCuenta === 'institucion' ? 'animate-in fade-in slide-in-from-right-4 duration-300 delay-200' : ''}`}>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Correo Electrónico
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                required
                                                className={`focus:ring-${tipoCuenta === 'persona' ? 'blue' : 'orange'}-500 focus:border-${tipoCuenta === 'persona' ? 'blue' : 'orange'}-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border`}
                                                placeholder="tu@correo.com"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Contraseña
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className={`focus:ring-${tipoCuenta === 'persona' ? 'blue' : 'orange'}-500 focus:border-${tipoCuenta === 'persona' ? 'blue' : 'orange'}-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border`}
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                                onClick={() => setShowPassword(!showPassword)}
                                            >
                                                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Confirmar Contraseña
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showConfirmPassword ? "text" : "password"}
                                                required
                                                className={`focus:ring-${tipoCuenta === 'persona' ? 'blue' : 'orange'}-500 focus:border-${tipoCuenta === 'persona' ? 'blue' : 'orange'}-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border`}
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                minLength={6}
                                            />
                                            <button
                                                type="button"
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            >
                                                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                            </button>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500">Asegúrate de que coincida con la contraseña anterior.</p>
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    )}

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className={`w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white ${
                                                tipoCuenta === 'persona' ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-orange-600 hover:bg-orange-700 focus:ring-orange-500'
                                            } focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-all`}
                                        >
                                            <span>{loading ? 'Procesando...' : (tipoCuenta === 'persona' ? 'Crear mi cuenta' : 'Registrar Institución')}</span>
                                            <UserPlus className="h-4 w-4" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
