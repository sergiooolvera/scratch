'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Save, CheckCircle, GraduationCap } from 'lucide-react'

export default function PerfilPage() {
    const [nombre, setNombre] = useState('')
    const [apellidoPaterno, setApellidoPaterno] = useState('')
    const [apellidoMaterno, setApellidoMaterno] = useState('')
    const [email, setEmail] = useState('')
    const [rol, setRol] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        async function loadProfile() {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                router.push('/login')
                return
            }

            setEmail(user.email || '')

            const { data: prof } = await supabase.from('ie_profiles').select('*').eq('id', user.id).single()
            if (prof) {
                setNombre(prof.nombre || '')
                setApellidoPaterno(prof.apellido_paterno || '')
                setApellidoMaterno(prof.apellido_materno || '')
                setRol(prof.rol || 'alumno')
            }
            setLoading(false)
        }
        loadProfile()
    }, [router, supabase])

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setSuccess('')
        setError('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { error: updateError } = await supabase
            .from('ie_profiles')
            .update({ 
                nombre,
                apellido_paterno: apellidoPaterno,
                apellido_materno: apellidoMaterno
            })
            .eq('id', user.id)

        if (updateError) {
            setError('Error al actualizar el perfil: ' + updateError.message)
        } else {
            setSuccess('Perfil actualizado correctamente.')
        }
        setSaving(false)
    }

    if (loading) return (
        <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-zinc-50 p-8">
            <div className="text-gray-500 animate-pulse text-lg">Cargando perfil...</div>
        </div>
    )

    return (
        <div className="min-h-[calc(100vh-64px)] bg-zinc-50 font-sans py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-xl mx-auto">
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-center h-16 w-16 bg-blue-100 text-blue-600 rounded-full mx-auto mb-6">
                        <User className="h-8 w-8" />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-gray-900 text-center mb-8">Mi Perfil</h1>

                    {success && (
                        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center text-green-700">
                            <CheckCircle className="h-5 w-5 mr-2 flex-shrink-0" />
                            <p className="text-sm font-medium">{success}</p>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">Correo Electrónico (Solo Lectura)</label>
                            <input 
                                type="text" 
                                disabled 
                                value={email} 
                                className="block w-full border-gray-300 rounded-md bg-gray-100 text-gray-500 px-4 py-3 sm:text-sm border"
                            />
                            <p className="mt-1 text-xs text-gray-400">El correo electrónico no puede ser modificado aquí.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Rol
                            </label>
                            <div className="flex items-center space-x-2 bg-gray-50 px-4 py-3 rounded-md border text-gray-700">
                                <GraduationCap className="h-5 w-5 text-gray-400" />
                                <span className="capitalize font-medium">{rol}</span>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">Información Personal</h2>
                            <p className="text-sm text-gray-500 mb-5 leading-relaxed">Estos son los datos que aparecerán impresos en tus constancias y certificados de los cursos acreditados. Asegúrate de que estén escritos correctamente.</p>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Nombre(s)</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={nombre} 
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. Juan Carlos"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Apellido Paterno</label>
                                    <input 
                                        type="text" 
                                        required 
                                        value={apellidoPaterno} 
                                        onChange={(e) => setApellidoPaterno(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. Pérez"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">Apellido Materno (Opcional)</label>
                                    <input 
                                        type="text" 
                                        value={apellidoMaterno} 
                                        onChange={(e) => setApellidoMaterno(e.target.value)}
                                        className="focus:ring-blue-500 focus:border-blue-500 block w-full border-gray-300 rounded-md px-4 py-3 sm:text-base border text-black font-medium"
                                        placeholder="Ej. García"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all font-semibold"
                            >
                                {saving ? 'Guardando cambios...' : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        Guardar Perfil
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
