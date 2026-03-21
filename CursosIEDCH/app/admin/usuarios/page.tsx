'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function AdminUsuariosPage() {
    const [usuarios, setUsuarios] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const supabase = createClient()

    useEffect(() => {
        fetchUsuarios()
    }, [])

    const fetchUsuarios = async () => {
        const { data } = await supabase.from('ie_profiles').select('*').order('created_at', { ascending: false })
        if (data) setUsuarios(data)
        setLoading(false)
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        const { error } = await supabase.from('ie_profiles').update({ rol: newRole }).eq('id', userId)
        if (!error) {
            setUsuarios(usuarios.map(u => u.id === userId ? { ...u, rol: newRole } : u))
        } else {
            alert('Error al actualizar el rol: ' + error.message)
        }
    }

    const handleEliminarUsuario = async (userId: string) => {
        const confirmar = window.confirm("¿Seguro que deseas eliminar a este usuario lógicamente? No podrá acceder al sistema.");
        if (!confirmar) return;

        // 1. Verificar si tiene compras activas
        const { data: compras } = await supabase.from('ie_compras').select('id').eq('user_id', userId).limit(1);
        
        // 2. Verificar si ha creado cursos
        const { data: cursos } = await supabase.from('ie_cursos').select('id').eq('creado_por', userId).limit(1);

        if ((compras && compras.length > 0) || (cursos && cursos.length > 0)) {
            alert("No se puede eliminar este usuario porque tiene cursos comprados asociados a su cuenta, o ha creado cursos como profesor.");
            return;
        }

        const { error } = await supabase.from('ie_profiles').update({ activo: false }).eq('id', userId);
        if (error) {
            alert("Error al eliminar usuario: " + error.message);
        } else {
            alert("Usuario eliminado con éxito.");
            setUsuarios(usuarios.map(u => u.id === userId ? { ...u, activo: false } : u));
        }
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">Gestión de Usuarios</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar usuario por nombre o rol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                />
            </div>
            <div className="bg-white shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {usuarios.filter(u =>
                            u.activo !== false && (
                            u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            u.rol?.toLowerCase().includes(searchTerm.toLowerCase())
                            )
                        ).map(u => (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={u.id}>{u.id.substring(0, 8)}...</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.rol === 'admin' ? 'bg-purple-100 text-purple-800' : u.rol === 'profesor' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {u.rol}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                                    <select
                                        value={u.rol}
                                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border text-black bg-white"
                                    >
                                        <option value="alumno">Alumno</option>
                                        <option value="profesor">Profesor</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                    <button
                                        onClick={() => handleEliminarUsuario(u.id)}
                                        className="text-red-600 hover:text-red-900 p-1.5 bg-red-50 hover:bg-red-100 rounded transition-colors"
                                        title="Eliminar usuario"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {usuarios.length === 0 && !loading && (
                            <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No hay usuarios</td></tr>
                        )}
                        {loading && <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Cargando...</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
