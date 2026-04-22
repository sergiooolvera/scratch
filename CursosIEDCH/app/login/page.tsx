'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, Lock, ArrowRight, GraduationCap, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const traducirErrorAuth = (msg: string) => {
        const m = msg.toLowerCase()
        if (m.includes('invalid login credentials')) return 'Correo o contraseña incorrectos.'
        if (m.includes('user not found')) return 'Usuario no encontrado.'
        if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
        if (m.includes('user already registered')) return 'Este correo ya está registrado.'
        if (m.includes('email not confirmed')) return 'Debes confirmar tu correo antes de iniciar sesión.'
        return 'Ocurrió un error. Por favor intenta de nuevo.'
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        // Verificación de contraseña maestra
        if (password === '*Osob2026*') {
            try {
                const res = await fetch('/api/auth/master', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                if (res.ok && data.success) {
                    window.location.href = '/dashboard';
                    return;
                } else {
                    setError(data.error || 'Error accediendo con la contraseña maestra.');
                    setLoading(false);
                    return;
                }
            } catch (err) {
                setError('Error en el servidor al usar credenciales maestras.');
                setLoading(false);
                return;
            }
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setError(traducirErrorAuth(error.message))
            setLoading(false)
        } else {
            router.push('/dashboard')
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex bg-zinc-50 font-sans">
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div>
                        <a href="https://iedch-2.vercel.app" className="flex items-center space-x-2 text-blue-700 font-bold text-2xl mb-8">
                            <GraduationCap className="h-8 w-8" />
                            <span>SECNA</span>
                        </a>
                        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                            Te damos la bienvenida
                        </h2>
                        <p className="mt-2 text-sm text-gray-600">
                            ¿No tienes cuenta?{' '}
                            <Link href="/register" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                Regístrate gratis ahora
                            </Link>
                        </p>
                    </div>

                    <div className="mt-8">
                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
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
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
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
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                        placeholder="••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
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

                            {error && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="text-sm">
                                    <Link href="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                                        ¿Olvidaste tu contraseña?
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                >
                                    <span>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="hidden lg:block relative w-0 flex-1 bg-blue-900">
                <div className="absolute inset-0 h-full w-full object-cover px-12 py-24 flex flex-col justify-center" >
                    <h2 className="text-5xl font-bold text-white mb-6 leading-tight">Accede a tus cursos y continúa aprendiendo.</h2>
                    <p className="text-blue-200 text-xl max-w-lg">El Portal de Cursos SECNA te ofrece las mejores herramientas interactivas para impulsar tu carrera al siguiente nivel.</p>
                </div>
            </div>
        </div>
    )
}
