'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { User, Mail, Lock, UserPlus, GraduationCap, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [nombre, setNombre] = useState('')
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const supabase = createClient()

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

        const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nombre
                }
            }
        })

        if (signUpError) {
            setError(signUpError.message)
            setLoading(false)
        } else {
            setSuccessMessage('¡Cuenta creada con éxito! Se ha enviado un correo de confirmación a tu bandeja de entrada. Por favor, haz clic en el enlace para activar tu cuenta antes de iniciar sesión.')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex bg-zinc-50 font-sans">
            <div className="hidden lg:block relative w-0 flex-1 bg-gradient-to-t from-blue-900 to-indigo-800">
                <div className="absolute inset-0 h-full w-full object-cover px-16 py-24 flex flex-col justify-center text-center" >
                    <div className="mx-auto bg-white/10 p-6 rounded-full inline-block backdrop-blur-sm shadow-xl mb-8">
                        <GraduationCap className="h-16 w-16 text-blue-200" />
                    </div>
                    <h2 className="text-4xl font-bold text-white mb-6 leading-tight">Da el primer paso hacia tu futuro</h2>
                    <p className="text-blue-100 text-lg mx-auto max-w-md">Únete a cientos de estudiantes que ya están transformando su carrera con nuestros cursos de alto impacto.</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    {successMessage ? (
                        <div className="text-center">
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
                                <p className="mt-2 text-sm text-gray-600">
                                    ¿Ya tienes cuenta?{' '}
                                    <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
                                        Inicia sesión aquí
                                    </Link>
                                </p>
                            </div>

                            <div className="mt-8">
                                <form onSubmit={handleRegister} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Nombre Completo
                                        </label>
                                        <div className="mt-1 relative rounded-md shadow-sm">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                required
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                placeholder="Ej. Juan Pérez"
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                            />
                                        </div>
                                    </div>

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
                                                type="password"
                                                required
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                placeholder="••••••••"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                minLength={6}
                                            />
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
                                                type="password"
                                                required
                                                className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 bg-white text-gray-900 border"
                                                placeholder="••••••••"
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                minLength={6}
                                            />
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
                                            className="w-full flex justify-center items-center space-x-2 py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all"
                                        >
                                            <span>{loading ? 'Procesando...' : 'Crear mi cuenta'}</span>
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
