'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, ArrowRight, GraduationCap, Eye, EyeOff } from 'lucide-react'

export default function UpdatePasswordPage() {
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const traducirErrorAuth = (msg: string) => {
        const m = msg.toLowerCase()
        if (m.includes('password should be at least')) return 'La contraseña debe tener al menos 6 caracteres.'
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
            }, 3000)
        }
    }

    return (
        <div className="min-h-[calc(100vh-64px)] flex bg-zinc-50 font-sans">
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
                <div className="mx-auto w-full max-w-sm lg:w-96">
                    <div>
                        <Link href="/" className="flex items-center space-x-2 text-blue-700 font-bold text-2xl mb-8">
                            <GraduationCap className="h-8 w-8" />
                            <span>IEDCH</span>
                        </Link>
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
