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
                    ['instructor', 'vendedor', 'capacitador', 'institucion'].includes(p.rol)
                )
                // Priorizar los que tengan régimen fiscal pendiente o identidad pendiente
                filtered.sort((a: any, b: any) => {
                    const aPendiente = a.regimen_fiscal_estado === 'pendiente' || !a.identidad_validada;
                    const bPendiente = b.regimen_fiscal_estado === 'pendiente' || !b.identidad_validada;
                    if (aPendiente && !bPendiente) return -1;
                    if (!aPendiente && bPendiente) return 1;
                    return 0;
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

    const procesarRegimen = async (id: string, accion: 'aprobar' | 'rechazar', nuevoRegimen?: string) => {
        let motivoRechazo = ''
        if (accion === 'rechazar') {
            const inputMotivo = window.prompt('Ingresa el motivo del rechazo del régimen fiscal (opcional):', 'Datos de RFC o documentación fiscal no válidos')
            if (inputMotivo === null) return // Cancelado por el admin
            motivoRechazo = inputMotivo.trim()
        } else {
            const confirmar = window.confirm(`¿Confirmas la APROBACIÓN de este régimen fiscal para el usuario?`)
            if (!confirmar) return
        }

        try {
            const res = await fetch('/api/admin/usuarios/validar-regimen', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: id, accion, motivoRechazo, nuevoRegimen })
            })
            const result = await res.json()
            if (res.ok && result.success) {
                fetchProfiles();
            } else {
                alert('Error al procesar régimen: ' + (result.error || 'Error de red'));
            }
        } catch (e: any) {
            alert('Error de conexión con el servidor: ' + e.message);
        }
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
                    <p className="text-gray-500 mt-2">Revisa y aprueba la documentación de instructores, capacitadores y vendedores.</p>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Régimen Fiscal</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Identidad</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProfiles.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                        No se encontraron perfiles.
                                    </td>
                                </tr>
                            ) : (
                                filteredProfiles.map((profile) => (
                                    <tr key={profile.id} className={profile.regimen_fiscal_estado === 'pendiente' ? 'bg-amber-50/40' : !profile.identidad_validada ? 'bg-orange-50/30' : ''}>
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
                                        <td className="px-6 py-4 text-sm">
                                            <div className="flex flex-col gap-1.5 min-w-[140px]">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase">Activo:</span>
                                                    <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                                                        profile.regimen_fiscal === 'con_rfc' ? 'bg-blue-100 text-blue-800' :
                                                        profile.regimen_fiscal === 'persona_moral' ? 'bg-purple-100 text-purple-800' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {profile.regimen_fiscal === 'con_rfc' ? 'Con RFC (PF)' :
                                                         profile.regimen_fiscal === 'persona_moral' ? 'Persona Moral' : 'Sin RFC'}
                                                    </span>
                                                </div>

                                                {profile.regimen_fiscal_estado === 'pendiente' && profile.regimen_fiscal_solicitado && (
                                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs shadow-2xs">
                                                        <div className="text-amber-900 font-bold mb-1 flex items-center gap-1">
                                                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                                                            Solicita: {profile.regimen_fiscal_solicitado === 'con_rfc' ? 'Con RFC' : 'Persona Moral'}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 mt-1.5">
                                                            <button
                                                                onClick={() => procesarRegimen(profile.id, 'aprobar')}
                                                                data-testid={`btn-aprobar-regimen-${profile.id}`}
                                                                className="px-2.5 py-1 text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition shadow-xs"
                                                            >
                                                                ✓ Aprobar
                                                            </button>
                                                            <button
                                                                onClick={() => procesarRegimen(profile.id, 'rechazar')}
                                                                data-testid={`btn-rechazar-regimen-${profile.id}`}
                                                                className="px-2.5 py-1 text-[11px] font-bold bg-red-500 hover:bg-red-600 text-white rounded-md transition shadow-xs"
                                                            >
                                                                ✕ Rechazar
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}

                                                {profile.regimen_fiscal_estado === 'rechazado' && (
                                                    <div className="text-[11px] text-red-600 bg-red-50 p-1.5 rounded border border-red-100">
                                                        <span className="font-bold">Rechazado:</span> {profile.regimen_fiscal_motivo_rechazo || 'No validado'}
                                                    </div>
                                                )}

                                                {profile.regimen_fiscal_estado !== 'pendiente' && (
                                                    <div className="mt-1">
                                                        <select
                                                            value={profile.regimen_fiscal || 'sin_rfc'}
                                                            onChange={(e) => procesarRegimen(profile.id, 'aprobar', e.target.value)}
                                                            className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 text-gray-600 bg-white"
                                                            title="Cambiar régimen directamente como admin"
                                                        >
                                                            <option value="sin_rfc">Sin RFC</option>
                                                            <option value="con_rfc">Con RFC (PF)</option>
                                                            <option value="persona_moral">Persona Moral</option>
                                                        </select>
                                                    </div>
                                                )}
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
