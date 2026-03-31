'use client'

import { useEffect, useState } from 'react'
import { Calendar, Search, CreditCard, CheckCircle2, Clock, XCircle, Filter, Receipt, Landmark } from 'lucide-react'

interface Transaction {
    id: string
    origin: string
    created: number
    paid_at?: number | null
    amount: number
    currency: string
    status: string
    payment_status: string
    customer_email: string
    customer_name: string
    curso_titulo: string
    method: string
}

export default function AdminTransaccionesStripePage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    useEffect(() => {
        fetchTransactions()
    }, [])

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/admin/stripe-sessions')
            const result = await res.json()
            if (res.ok) {
                setTransactions(result.data)
            } else {
                console.error('Error fetching transactions:', result.error)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const filtered = transactions.filter(t => {
        const str = (t.customer_email + t.customer_name + t.curso_titulo + t.method).toLowerCase()
        const matchesSearch = str.includes(searchTerm.toLowerCase())
        
        if (statusFilter === 'all') return matchesSearch
        if (statusFilter === 'paid') return matchesSearch && t.payment_status === 'paid'
        if (statusFilter === 'pending') return matchesSearch && t.payment_status === 'unpaid' && t.status !== 'expired'
        if (statusFilter === 'expired') return matchesSearch && t.status === 'expired'
        
        return matchesSearch
    })

    const formatDate = (ts: number) => {
        return new Date(ts * 1000).toLocaleString('es-MX', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusBadge = (t: Transaction) => {
        if (t.payment_status === 'paid') {
            return <span className="bg-green-100 text-green-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Pagado</span>
        }
        if (t.status === 'expired') {
            return <span className="bg-red-100 text-red-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Fallido/Expirado</span>
        }
        if (t.payment_status === 'unpaid') {
            return <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 w-fit"><Clock className="w-3 h-3" /> Pendiente</span>
        }
        return <span className="bg-gray-100 text-gray-800 px-2.5 py-1 rounded-full text-xs font-semibold w-fit">{t.status}</span>
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reporte Consolidado de Ventas</h1>
                    <p className="text-gray-500 text-sm mt-1">Stripe, OXXO, Transferencias Manuales y Bonos</p>
                </div>
                <button 
                    onClick={() => { setLoading(true); fetchTransactions(); }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Actualizar Reporte
                </button>
            </div>

            {/* Filtros */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por correo, nombre, curso o método..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full px-4 py-2.5 border rounded-xl focus:ring-blue-500 focus:border-blue-500 shadow-sm text-sm"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="paid">Pagados / Aprobados</option>
                        <option value="pending">Pendientes de Pago / Revisión</option>
                        <option value="expired">Expirados / Fallidos / Rechazados</option>
                    </select>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white shadow-xl shadow-blue-900/5 rounded-2xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Origen</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Método Detallado</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-gray-400 text-sm">Consultando fuentes de pago...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic text-sm">
                                        No se encontraron transacciones.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium font-mono">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-gray-500"><span className="text-[10px] text-gray-400 font-sans uppercase tracking-wider">Creado:</span><br/>{formatDate(t.created)}</div>
                                                {t.paid_at && t.paid_at !== t.created && (
                                                    <div className="text-green-600 font-bold"><span className="text-[10px] text-green-600/70 font-sans uppercase tracking-wider">Pagado:</span><br/>{formatDate(t.paid_at)}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900 line-clamp-1">{t.customer_name}</div>
                                            <div className="text-xs text-gray-500 line-clamp-1">{t.customer_email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {t.origin === 'Stripe' ? (
                                                    <CreditCard className="w-4 h-4 text-blue-500" />
                                                ) : (
                                                    <Landmark className="w-4 h-4 text-purple-500" />
                                                )}
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${t.origin === 'Stripe' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'}`}>
                                                    {t.origin.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{t.curso_titulo}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-extrabold text-gray-900">${t.amount.toFixed(2)} {t.currency}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(t)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 ${t.method.includes('OXXO') ? 'bg-orange-100 text-orange-700' : t.method.includes('Tarjeta') ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'} rounded text-xs font-bold`}>
                                                    {t.method}
                                                </span>
                                            </div>
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
