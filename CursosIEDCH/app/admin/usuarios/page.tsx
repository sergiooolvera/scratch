'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Trash2 } from 'lucide-react'

export default function AdminUsuariosPage() {
    const [usuarios, setUsuarios] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)

    // Estados para el modal de permisos del Admin Junior
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<any>(null)
    const [permisosSeleccionados, setPermisosSeleccionados] = useState<string[]>([])
    const [guardandoPermisos, setGuardandoPermisos] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchUsuarios()
        fetchCurrentUser()
    }, [])

    const fetchCurrentUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                const { data } = await supabase.from('ie_profiles').select('*').eq('id', user.id).single()
                setCurrentUserProfile(data)
            }
        } catch (e) {
            console.error('Error al obtener perfil del usuario logueado:', e)
        }
    }

    const fetchUsuarios = async () => {
        try {
            const res = await fetch('/api/admin/usuarios');
            const result = await res.json();
            if (res.ok) {
                setUsuarios(result.data || []);
            } else {
                console.error('Error from API:', result.error);
            }
        } catch (e) {
            console.error('Error fetching users:', e);
        }
        setLoading(false);
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        try {
            const res = await fetch('/api/admin/usuarios/rol', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, newRole }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Error de red')
            
            // Si el rol cambió a algo diferente de adminjr, actualizamos localmente
            setUsuarios(usuarios.map(u => u.id === userId ? { ...u, rol: newRole } : u))
        } catch (error: any) {
            alert('Error al actualizar el rol: ' + error.message)
        }
    }

    const handleVerificationChange = async (userId: string, isVerified: boolean) => {
        try {
            const res = await fetch('/api/admin/usuarios/verificar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, verificado: isVerified }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Error de red')
            
            setUsuarios(usuarios.map(u => u.id === userId ? { ...u, verificado: isVerified } : u))
        } catch (error: any) {
            alert('Error al actualizar la verificación: ' + error.message)
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
            alert("No se puede eliminar este usuario porque tiene cursos comprados asociados a su cuenta, o ha creado cursos como instructor.");
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

    // Funciones del modal de permisos
    const abrirModalPermisos = (usuario: any) => {
        setSelectedUser(usuario)
        setPermisosSeleccionados(Array.isArray(usuario.permisos_adminjr) ? usuario.permisos_adminjr : [])
        setIsModalOpen(true)
    }

    const handleCheckboxChange = (moduloId: string) => {
        if (permisosSeleccionados.includes(moduloId)) {
            setPermisosSeleccionados(permisosSeleccionados.filter(p => p !== moduloId))
        } else {
            setPermisosSeleccionados([...permisosSeleccionados, moduloId])
        }
    }

    const aplicarPreset = (tipo: string) => {
        switch (tipo) {
            case 'todo':
                setPermisosSeleccionados([
                    'usuarios', 'validaciones', 'cursos', 'cupones', 
                    'pagos-manuales', 'pagos-oxxo', 'transacciones', 'solicitudes', 'actividad'
                ])
                break
            case 'limpiar':
                setPermisosSeleccionados([])
                break
            case 'cursos':
                setPermisosSeleccionados(['cursos', 'cupones'])
                break
            case 'pagos':
                setPermisosSeleccionados(['pagos-manuales', 'pagos-oxxo', 'transacciones'])
                break
            case 'soporte':
                setPermisosSeleccionados(['validaciones', 'solicitudes'])
                break
            default:
                break
        }
    }

    const guardarPermisos = async () => {
        if (!selectedUser) return
        setGuardandoPermisos(true)
        try {
            const res = await fetch('/api/admin/usuarios/permisos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id, permisos: permisosSeleccionados }),
            })
            const result = await res.json()
            if (!res.ok) throw new Error(result.error || 'Error al guardar permisos')

            setUsuarios(usuarios.map(u => u.id === selectedUser.id ? { ...u, permisos_adminjr: permisosSeleccionados } : u))
            setIsModalOpen(false)
            alert('Permisos actualizados con éxito.')
        } catch (error: any) {
            alert('Error al guardar permisos: ' + error.message)
        } finally {
            setGuardandoPermisos(false)
        }
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestión de Usuarios</h1>
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar usuario por nombre, correo o rol..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full md:w-1/3 px-4 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 shadow-sm text-gray-800"
                />
            </div>
            <div className="bg-white shadow rounded-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Correo</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verificación</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {usuarios.filter(u => {
                            if (u.activo === false) return false;
                            const searchVal = searchTerm.trim().toLowerCase();
                            if (!searchVal) return true;
                            return (
                                (u.nombre && u.nombre.toLowerCase().includes(searchVal)) ||
                                (u.apellido_paterno && u.apellido_paterno.toLowerCase().includes(searchVal)) ||
                                (u.apellido_materno && u.apellido_materno.toLowerCase().includes(searchVal)) ||
                                (u.email && u.email.toLowerCase().includes(searchVal)) ||
                                (u.rol && u.rol.toLowerCase().includes(searchVal))
                            );
                        }).map(u => {
                            const nombreCompleto = `${u.nombre || ''} ${u.apellido_paterno || ''} ${u.apellido_materno || ''}`.replace(/\s+/g, ' ').trim() || 'Sin Nombre';
                            
                            // Restricciones para deshabilitar la edición
                            const isSelf = u.id === currentUserProfile?.id;
                            const isAdminUser = u.rol === 'admin';
                            const isOperatorAdminJr = currentUserProfile?.rol === 'adminjr';
                            
                            // Un adminjr no puede editar a usuarios admin ni a sí mismo
                            const isSelectDisabled = isSelf || (isOperatorAdminJr && isAdminUser);
                            
                            return (
                            <tr key={u.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    <div className="flex items-center gap-1.5">
                                        <span>{nombreCompleto}</span>
                                        {u.verificado && (
                                            <span className="text-blue-500 flex-shrink-0" title="Verificado">
                                                <svg className="w-4 h-4 fill-current inline-block" viewBox="0 0 24 24">
                                                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                                </svg>
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex flex-col gap-1">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full w-max ${
                                            u.rol === 'admin' ? 'bg-purple-100 text-purple-800' : 
                                            u.rol === 'adminjr' ? 'bg-indigo-100 text-indigo-800' : 
                                            u.rol === 'instructor' ? 'bg-green-100 text-green-800' : 
                                            u.rol === 'capacitador' ? 'bg-emerald-100 text-emerald-800' : 
                                            u.rol === 'vendedor' ? 'bg-blue-100 text-blue-800' :
                                            u.rol === 'institucion' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                                        }`}>
                                            {u.rol === 'adminjr' ? 'adminjr' : u.rol}
                                        </span>
                                        {u.referral_code && (
                                            <span className="text-xs font-mono bg-yellow-50 text-yellow-700 border border-yellow-200 px-2 py-0.5 rounded w-max">
                                                🔑 {u.referral_code}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <select
                                        value={u.verificado ? "true" : "false"}
                                        disabled={isSelectDisabled}
                                        onChange={(e) => handleVerificationChange(u.id, e.target.value === "true")}
                                        className="block pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border text-black bg-white disabled:opacity-60 disabled:bg-gray-50 transition-all"
                                    >
                                        <option value="false">No verificado</option>
                                        <option value="true">Verificado</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-3 justify-end md:justify-start min-w-[240px]">
                                        {u.rol === 'financiero' ? (
                                            <span className="block w-full px-3 py-2 text-sm text-gray-500 font-medium">Financiero (Especial)</span>
                                        ) : (
                                            <div className="flex items-center gap-2 flex-1">
                                                <select
                                                    value={u.rol}
                                                    disabled={isSelectDisabled}
                                                    onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                                    className="block flex-1 min-w-[130px] pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border text-black bg-white disabled:opacity-60 disabled:bg-gray-50 transition-all"
                                                >
                                                    <option value="alumno">Alumno</option>
                                                    <option value="instructor">Instructor</option>
                                                    <option value="capacitador">Capacitador</option>
                                                    <option value="vendedor">Vendedor</option>
                                                    <option value="institucion">Institución</option>
                                                    <option value="adminjr">Admin Junior</option>
                                                    {/* Solo el administrador principal puede asignar el rol admin */}
                                                    {!isOperatorAdminJr && <option value="admin">Admin</option>}
                                                </select>
 
                                                {/* Mostrar botón de permisos para Admin Junior únicamente al Admin principal */}
                                                {u.rol === 'adminjr' && currentUserProfile?.rol === 'admin' && (
                                                    <button
                                                        onClick={() => abrirModalPermisos(u)}
                                                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors border border-blue-200 cursor-pointer whitespace-nowrap active:scale-95 animate-pulse"
                                                        title="Configurar Accesos"
                                                    >
                                                        🔑 Accesos
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        <button
                                            onClick={() => handleEliminarUsuario(u.id)}
                                            disabled={isSelf || (isOperatorAdminJr && isAdminUser)}
                                            className="text-red-600 hover:text-red-900 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer flex-shrink-0"
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                            )
                        })}
                        {usuarios.length === 0 && !loading && (
                            <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No hay usuarios</td></tr>
                        )}
                        {loading && <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Cargando...</td></tr>}
                    </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL DE PERMISOS PARA ADMINJR (Solo accesible para el Administrador Principal) */}
            {isModalOpen && selectedUser && currentUserProfile?.rol === 'admin' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all scale-100">
                        {/* Cabecera */}
                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    <span>🔑 Configurar Accesos</span>
                                </h3>
                                <p className="text-xs text-gray-300 mt-0.5">
                                    Define los módulos a los que tendrá acceso {selectedUser.nombre || 'el Admin Junior'}
                                </p>
                            </div>
                            <button 
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10 cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Cuerpo */}
                        <div className="px-6 py-6 max-h-[60vh] overflow-y-auto bg-gray-50/50">
                            <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl text-xs flex items-start gap-2.5">
                                <span className="text-sm mt-0.5">ℹ️</span>
                                <p className="leading-relaxed">
                                    El rol de <strong>Administrador Junior (ADMINJR)</strong> tendrá acceso restringido a los módulos seleccionados. Marca las casillas de las funciones a las que deseas permitirle entrar.
                                </p>
                            </div>

                            {/* Accesos Rápidos (Presets) */}
                            <div className="mb-5 bg-white p-3.5 rounded-xl border border-gray-200">
                                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5">
                                    Plantillas de acceso rápido:
                                </span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => aplicarPreset('todo')}
                                        className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold border border-gray-200 cursor-pointer active:scale-95 transition-all"
                                    >
                                        👥 Seleccionar Todo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => aplicarPreset('limpiar')}
                                        className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg text-xs font-semibold border border-red-100 cursor-pointer active:scale-95 transition-all"
                                    >
                                        🧹 Limpiar Todo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => aplicarPreset('cursos')}
                                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold border border-indigo-100 cursor-pointer active:scale-95 transition-all"
                                    >
                                        📚 Cursos y Cupones
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => aplicarPreset('pagos')}
                                        className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold border border-emerald-100 cursor-pointer active:scale-95 transition-all"
                                    >
                                        💵 Pagos y Ventas
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => aplicarPreset('soporte')}
                                        className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs font-semibold border border-amber-100 cursor-pointer active:scale-95 transition-all"
                                    >
                                        🤝 Soporte y Validación
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                {[
                                    { id: 'usuarios', label: '👥 Gestión de Usuarios', desc: 'Ver, agregar y cambiar roles.' },
                                    { id: 'validaciones', label: '🪪 Validar Identidades', desc: 'Aprobar perfiles e identificaciones.' },
                                    { id: 'cursos', label: '📚 Revisión de Cursos', desc: 'Aprobar borradores y publicaciones.' },
                                    { id: 'cupones', label: '🎟️ Cupones y Bonos', desc: 'Crear y eliminar códigos de descuento.' },
                                    { id: 'pagos-manuales', label: '💵 Pagos Transferencia', desc: 'Validar y aprobar compras manuales.' },
                                    { id: 'pagos-oxxo', label: '🏪 Pagos Oxxo', desc: 'Monitorear fichas de pago Oxxo.' },
                                    { id: 'transacciones', label: '💳 Transacciones Stripe', desc: 'Ver el listado de ventas en Stripe.' },
                                    { id: 'solicitudes', label: '📝 Solicitudes Ajuste', desc: 'Gestionar solicitudes de cursos/gamma.' },
                                    { id: 'actividad', label: '📈 Estadísticas de Actividad', desc: 'Ver reportes y auditoría del sistema.' }
                                ].map(modulo => {
                                    const isChecked = permisosSeleccionados.includes(modulo.id);
                                    return (
                                        <label 
                                            key={modulo.id}
                                            className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-sm hover:translate-y-[-1px] ${
                                                isChecked 
                                                    ? 'bg-blue-50/70 border-blue-300 shadow-sm' 
                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={() => handleCheckboxChange(modulo.id)}
                                                className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                                            />
                                            <div>
                                                <span className={`block text-sm font-semibold transition-colors ${isChecked ? 'text-blue-900' : 'text-gray-800'}`}>
                                                    {modulo.label}
                                                </span>
                                                <span className="block text-[11px] text-gray-500 mt-0.5 leading-tight">
                                                    {modulo.desc}
                                                </span>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Pie */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer"
                                disabled={guardandoPermisos}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={guardarPermisos}
                                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                                disabled={guardandoPermisos}
                            >
                                {guardandoPermisos ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Guardando...</span>
                                    </>
                                ) : (
                                    <span>Guardar Accesos</span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
