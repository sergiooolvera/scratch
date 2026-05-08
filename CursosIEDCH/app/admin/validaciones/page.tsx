'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Search, FileText, Image as ImageIcon, ShieldAlert } from 'lucide-react'
import Link from 'next/link'

export default function AdminValidacionesPage() {
    const [profiles, setProfiles] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    
    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        fetchProfiles()
    }, [supabase])

    const fetchProfiles = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/usuarios')
            const result = await res.json()
            if (res.ok) {
                const filtered = (result.data || []).filter((p: any) => 
                    ['profesor', 'vendedor', 'instructor'].includes(p.rol)
                )
                // Pendientes de validar primero
                filtered.sort((a: any, b: any) => {
                    if (a.identidad_validada === b.identidad_validada) return 0;
                    return a.identidad_validada ? 1 : -1;
                });
                setProfiles(filtered)
            } else {
                console.error(result.error)
            }
        } catch (e) {
            console.error('Error fetching validaciones:', e)
        }
        setLoading(false)
    }

    const toggleValidacion = async (id: string, currentStatus: boolean) => {
        const confirmar = window.confirm(`¿Estás seguro de ${currentStatus ? 'REVOCAR' : 'APROBAR'} la identidad de este usuario?`);
        if (!confirmar) return;

        try {
            const res = await fetch('/api/admin/usuarios/validar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, identidadValidada: !currentStatus }),
            })
            const result = await res.json()
            if (res.ok && result.success) {
                fetchProfiles();
            } else {
                alert('Error al actualizar: ' + (result.error || 'Error de red'));
            }
        } catch (e: any) {
            alert('Error al conectar con el servidor: ' + e.message);
        }
    }

    const filteredProfiles = profiles.filter(p => 
        (p.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.rfc?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    )

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando validaciones...</div>

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                        <ShieldAlert className="h-8 w-8 text-blue-600" />
                        Validación de Identidades
                    </h1>
                    <p className="text-gray-500 mt-2">Revisa y aprueba la documentación de profesores, instructores y vendedores.</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6 flex items-center">
                <Search className="h-5 w-5 text-gray-400 mr-2" />
                <input 
                    type="text" 
                    placeholder="Buscar por nombre, email o RFC..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full border-none focus:ring-0 text-sm p-0 text-black bg-white"
                />
            </div>

            <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Datos de Contacto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expediente / Perfil</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documentos</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron perfiles.
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles.map((profile) => (
                                    <tr key={profile.id} className={!profile.identidad_validada ? 'bg-orange-50/30' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-bold text-gray-900">
                                                {`${profile.nombre || ''} ${profile.apellido_paterno || ''}`.trim() || 'Usuario sin nombre'}
                                            </div>
                                            <div className="text-xs text-gray-500">{profile.email || 'Sin correo'}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                                                {profile.rol}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div><span className="font-semibold text-gray-800">Tel:</span> {profile.telefono || 'N/A'}</div>
                                            <div><span className="font-semibold text-gray-800">RFC:</span> {profile.rfc || 'N/A'}</div>
                                            <div className="text-xs mt-1 text-gray-500">
                                                <span className="font-semibold text-gray-700">Banco:</span> {profile.banco || 'N/A'}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                <span className="font-semibold text-gray-700">CLABE:</span> {profile.clabe || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="space-y-1">
                                                <div><span className="font-semibold text-gray-800">Correo Alt:</span> {profile.correo_adicional || 'N/A'}</div>
                                                <div><span className="font-semibold text-gray-800">Especialidad:</span> {profile.profesion_especialidad || 'N/A'}</div>
                                                <div><span className="font-semibold text-gray-800">Institución:</span> {profile.institucion_labora || 'N/A'}</div>
                                                <div><span className="font-semibold text-gray-800">Residencia:</span> {profile.estado_municipio || 'N/A'}</div>
                                                <div><span className="font-semibold text-gray-800">Cédula:</span> {profile.cedula_profesional || 'N/A'}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex flex-col gap-2">
                                                {profile.constancia_situacion_fiscal ? (
                                                    <a href={profile.constancia_situacion_fiscal} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 font-semibold text-xs">
                                                        <FileText className="h-4 w-4 mr-1" /> Ver CSF
                                                    </a>
                                                ) : <span className="text-xs text-gray-400">Sin CSF</span>}
                                                
                                                {profile.fotografia_perfil ? (
                                                    <a href={profile.fotografia_perfil} target="_blank" rel="noreferrer" className="flex items-center text-blue-600 hover:text-blue-800 font-semibold text-xs">
                                                        <ImageIcon className="h-4 w-4 mr-1" /> Ver Foto
                                                    </a>
                                                ) : <span className="text-xs text-gray-400">Sin Foto</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {profile.identidad_validada ? (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                    Validado
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                    Pendiente
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => toggleValidacion(profile.id, profile.identidad_validada)}
                                                className={`px-4 py-2 rounded-md font-bold text-white transition-colors ${profile.identidad_validada ? 'bg-red-500 hover:bg-red-600' : 'bg-green-600 hover:bg-green-700'}`}
                                            >
                                                {profile.identidad_validada ? 'Revocar' : 'Aprobar'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
