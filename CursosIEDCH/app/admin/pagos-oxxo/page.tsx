'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
    Banknote,
    Check,
    X,
    Eye,
    Clock
} from 'lucide-react'

export default function AdminPagosOxxoPage() {
    const supabase = createClient()
    const [pagos, setPagos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [actionMessage, setActionMessage] = useState('')
    
    // Filtros
    const [filtroTexto, setFiltroTexto] = useState('')
    const [filtroEstado, setFiltroEstado] = useState('todos')

    useEffect(() => {
        fetchPagos()
    }, [])

    const fetchPagos = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/pagos')
            if (res.ok) {
                const json = await res.json()
                setPagos(json.data || [])
            } else {
                console.error('Error in API response', res.statusText)
                setPagos([])
            }
        } catch (error) {
            console.error('Error fetching pagos', error)
            setPagos([])
        }
        setLoading(false)
    }

    const handleAprobar = async (pago: any) => {
        const confirmar = confirm('¿Estás seguro de que quieres aprobar este comprobante de pago?')
        if (!confirmar) return

        const esPagoCompleto = confirm('¿Este comprobante cubre el 100% del pago pendiente? (Si seleccionas Aceptar, se habilitará la descarga de la constancia. Si seleccionas Cancelar, se dará acceso al curso pero estará bloqueada la constancia hasta liquidar)')

        setActionMessage('Aprobando y enviando correo...')

        try {
            const res = await fetch('/api/approve-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pagoId: pago.id,
                    userId: pago.user_id,
                    cursoId: pago.curso_id,
                    userEmail: pago.perfil?.email,
                    userName: pago.perfil?.nombre,
                    cursoTitulo: pago.curso?.titulo,
                    accion: 'aprobar',
                    esPagoCompleto: esPagoCompleto
                })
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.details || data.error || 'Error al aprobar')

            setActionMessage('Pago aprobado con éxito. El alumno fue notificado por correo.')
            fetchPagos()
        } catch (error: any) {
            console.error(error)
            setActionMessage(`Ocurrió un error al aprobar el pago: ${error.message}`)
        }
    }

    const handleRechazar = async (pago: any) => {
        const razon = prompt('¿Cuál es el motivo del rechazo? (Opcional, se guardará como nota e irá en el correo)')
        if (razon === null) return // Cancela el rechazo

        setActionMessage('Rechazando y notificando...')
        try {
            const res = await fetch('/api/approve-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pagoId: pago.id,
                    userId: pago.user_id,
                    cursoId: pago.curso_id,
                    userEmail: pago.perfil?.email,
                    userName: pago.perfil?.nombre,
                    cursoTitulo: pago.curso?.titulo,
                    accion: 'rechazar',
                    notas: razon
                })
            })
            const data = await res.json()
            if (!data.success) throw new Error(data.details || data.error || 'Error al rechazar')

            setActionMessage('Pago rechazado y notificado al alumno.')
            fetchPagos()
        } catch (error: any) {
            console.error(error)
            setActionMessage(`Error al rechazar: ${error.message}`)
        }
    }

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                    <Banknote className="w-6 h-6 mr-2 text-red-600" />
                    Bandeja de Pagos OXXO
                </h1>
            </div>

            {actionMessage && (
                <div className="mb-4 bg-blue-50 text-blue-800 p-3 rounded-md font-medium">
                    {actionMessage}
                </div>
            )}

            <div className="mb-6 flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                    <input
                        type="text"
                        placeholder="Nombre, email o curso..."
                        value={filtroTexto}
                        onChange={(e) => setFiltroTexto(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                    />
                </div>
                <div className="w-full sm:w-48">
                    <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Estado</label>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-red-500 focus:border-red-500 text-sm"
                    >
                        <option value="todos">Todos</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="aprobado">Aprobados</option>
                        <option value="rechazado">Rechazados</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Cargando recibos...</div>
                ) : pagos.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No hay pagos manuales registrados en el sistema.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha / Solicitante</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Curso</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Comprobante</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {pagos
                                    .filter(p => {
                                        // Filtro principal de OXXO
                                        const isOxxo = p.metodo_pago === 'oxxo' || p.notas === 'Pago reportado por OXXO';
                                        if (!isOxxo) return false;

                                        const coincideEstado = filtroEstado === 'todos' || p.estado === filtroEstado;
                                        const textoBusqueda = filtroTexto.toLowerCase();
                                        const coincideTexto = 
                                            (p.perfil?.nombre || '').toLowerCase().includes(textoBusqueda) ||
                                            (p.perfil?.email || '').toLowerCase().includes(textoBusqueda) ||
                                            (p.curso?.titulo || '').toLowerCase().includes(textoBusqueda);
                                        return coincideEstado && coincideTexto;
                                    })
                                    .map((pago) => (
                                    <tr key={pago.id} className={pago.estado === 'pendiente' ? 'bg-yellow-50/30' : ''}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 font-bold">{pago.perfil?.nombre || 'Desconocido'}</div>
                                            <div className="text-xs text-gray-500">{pago.perfil?.email}</div>
                                            <div className="text-xs text-gray-400 mt-1">{new Date(pago.fecha_solicitud).toLocaleString('es-MX')}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900 max-w-xs truncate" title={pago.curso?.titulo}>
                                                {pago.curso?.titulo || 'Curso no encontrado'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <a
                                                href={pago.comprobante_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center text-blue-600 hover:text-blue-900 bg-blue-50 px-3 py-1 rounded-full text-xs font-bold transition"
                                            >
                                                <Eye className="w-4 h-4 mr-1" /> Ver Foto
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            {pago.estado === 'pendiente' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                                    <Clock className="w-3 h-3 mr-1" /> Pendiente
                                                </span>
                                            )}
                                            {pago.estado === 'aprobado' && (
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    <Check className="w-3 h-3 mr-1" /> Aprobado
                                                </span>
                                            )}
                                            {pago.estado === 'rechazado' && (
                                                <div className="flex flex-col items-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                        <X className="w-3 h-3 mr-1" /> Rechazado
                                                    </span>
                                                    {pago.notas && <span className="text-[10px] text-gray-500 max-w-xs truncate" title={pago.notas}>Nota: {pago.notas}</span>}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            {pago.estado === 'pendiente' && (
                                                <div className="flex justify-end space-x-2">
                                                    <button
                                                        onClick={() => handleAprobar(pago)}
                                                        className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded border border-green-200 transition"
                                                    >
                                                        Aprobar Accesos
                                                    </button>
                                                    <button
                                                        onClick={() => handleRechazar(pago)}
                                                        className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded border border-red-200 transition"
                                                    >
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}
                                            {pago.estado !== 'pendiente' && (
                                                <span className="text-gray-400 text-xs italic">Procesado</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
