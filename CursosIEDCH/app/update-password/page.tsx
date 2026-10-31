'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, GraduationCap, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [validatingSession, setValidatingSession] = useState(true)
    const [hasValidSession, setHasValidSession] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        let isMounted = true

        const initSession = async () => {
            try {
                // 1. Si viene código PKCE en la URL, intercambiarlo por sesión
                if (typeof window !== 'undefined') {
                    const searchParams = new URLSearchParams(window.location.search)
                    const code = searchParams.get('code')
                    if (code) {
                        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
                        if (!exchangeError && isMounted) {
                            setHasValidSession(true)
                            setValidatingSession(false)
                            return
                        }
                    }
                }

                // 2. Revisar si ya existe una sesión activa
                const { data: { session } } = await supabase.auth.getSession()
                if (session && isMounted) {
                    setHasValidSession(true)
                    setValidatingSession(false)
                    return
                }

                // 3. Si hay un hash (#access_token=... o #type=recovery), dar un breve margen
                // para que el cliente de Supabase complete la extracción de tokens en segundo plano
                const hash = typeof window !== 'undefined' ? window.location.hash || '' : ''
                if (hash.includes('access_token') || hash.includes('type=recovery')) {
                    setTimeout(async () => {
                        const { data: { session: s2 } } = await supabase.auth.getSession()
                        if (isMounted) {
                            if (s2) {
                                setHasValidSession(true)
                            } else {
                                setHasValidSession(false)
                            }
                            setValidatingSession(false)
                        }
                    }, 800)
                    return
                }

                if (isMounted) {
                    setHasValidSession(false)
                    setValidatingSession(false)
                }
            } catch (err) {
                console.error('Error inicializando sesión de recuperación:', err)
                if (isMounted) {
                    setHasValidSession(false)
                    setValidatingSession(false)
                }
            }
        }

        initSession()

        // 4. Escuchar evento oficial de recuperación
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!isMounted) return
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
                setHasValidSession(true)
                setValidatingSession(false)
            }
        })

        return () => {
            isMounted = false
            subscription.unsubscribe()
        }
    }, [supabase])

    const traducirErrorAuth = (msg: string) => {
        const m = msg.toLowerCase()
        if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
        if (m.includes('auth session missing') || m.includes('session missing')) {
            return 'Tu sesión de recuperación no es válida o ha expirado. Por favor, solicita un nuevo enlace.'
        }
        if (m.includes('should be different')) {
            return 'La nueva contraseña debe ser diferente a tu contraseña anterior.'
        }
        if (m.includes('token has expired') || m.includes('invalid') || m.includes('expired')) {
            return 'El enlace ha expirado o no es válido. Por favor, solicita uno nuevo.'
        }
        return msg
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setMessage('')

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.')
            return
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setError(traducirErrorAuth(error.message))
            setLoading(false)
        } else {
            setMessage('Tu contraseña ha sido actualizada con éxito. Serás redirigido al inicio.')
            setLoading(false)
            setTimeout(() => {
                router.push('/dashboard')
            }, 2500)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex bg-zinc-50 font-sans">
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {validatingSession ? (
                        <div className="text-center py-12 space-y-4">
                            <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto" />
                            <h3 className="text-lg font-semibold text-gray-800">Verificando enlace...</h3>
                            <p className="text-sm text-gray-500">Estamos validando tu solicitud de forma segura.</p>
                        </div>
                    ) : !hasValidSession ? (
                        <div className="space-y-6 text-center py-8">
                            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                                <AlertTriangle className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">Enlace inválido o expirado</h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    El enlace para restablecer tu contraseña no es válido o ha expirado. Por motivos de seguridad, los enlaces solo pueden utilizarse una vez.
                                </p>
                            </div>
                            <div>
                                <Link
                                    href="/forgot-password"
                                    className="w-full inline-flex justify-center items-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                                >
                                    Solicitar un nuevo enlace
                                </Link>
                            </div>
                            <div className="text-sm">
                                <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                                    Volver al inicio de sesión
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div>
                                <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                                    Actualiza tu contraseña
                                </h2>
                                <p className="mt-2 text-sm text-gray-600">
                                    Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.
                                </p>
                            </div>

                            <div className="mt-8">
                                <form onSubmit={handleUpdatePassword} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Nueva Contraseña
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Lock className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type={showPassword ? "text" : "password"}
                                                required
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                placeholder="Min. 6 caracteres"
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
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                placeholder="Min. 6 caracteres"
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
                                    </div>

                                    {error && (
                                        <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    )}

                                    {message && (
                                        <div className="bg-green-50 border-l-4 border-green-500 p-4">
                                            <p className="text-sm text-green-700">{message}</p>
                                        </div>
                                    )}

                                    <div>
                                        <button
                                            type="submit"
                                            disabled={loading || !!message}
                                            className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                        >
                                            <span>{loading ? 'Actualizando...' : 'Guardar y Continuar'}</span>
                                            {!loading && <ArrowRight className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="hidden lg:block relative w-0 flex-1 bg-blue-900">
                <div className="absolute inset-0 h-full w-full object-cover px-12 py-24 flex flex-col justify-center" >
                    <h2 className="text-5xl font-bold text-white mb-6 leading-tight">Seguridad ante todo.</h2>
                    <p className="text-blue-200 text-xl max-w-lg">Al actualizar tu contraseña, asegúrate de utilizar una combinación que puedas recordar pero que sea resistente a accesos no autorizados.</p>
                </div>
            </div>
        </div>
    )
}
