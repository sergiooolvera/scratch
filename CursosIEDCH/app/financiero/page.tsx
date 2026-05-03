'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { DollarSign, TrendingUp, Calendar, BarChart3, CreditCard, Landmark, Download, ChevronLeft, ChevronRight, Search } from 'lucide-react'

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
    profesor_nombre?: string
    method: string
}

export default function FinancieroDashboardPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([])
    const [loading, setLoading] = useState(false)
    const [hasBuscado, setHasBuscado] = useState(false)
    const [stats, setStats] = useState({
        today: 0,
        thisMonth: 0,
        total: 0
    })
    const [dailyData, setDailyData] = useState<{date: string, amount: number}[]>([])
    const [monthlyData, setMonthlyData] = useState<{month: string, amount: number}[]>([])
    
    const [searchProfesor, setSearchProfesor] = useState('')
    const [searchCurso, setSearchCurso] = useState('')
    const [searchAlumno, setSearchAlumno] = useState('')
    const [searchMetodo, setSearchMetodo] = useState('')
    const [fechaDesde, setFechaDesde] = useState('')
    const [fechaHasta, setFechaHasta] = useState('')
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    const router = useRouter()
    const supabase = createClient()

    useEffect(() => {
        checkAccess()
    }, [])

    const checkAccess = async () => {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
            router.push('/login')
            return
        }

        const { data: profile } = await supabase.from('ie_profiles').select('rol').eq('id', session.user.id).single()
        if (profile?.rol !== 'financiero' && profile?.rol !== 'admin') {
            router.push('/dashboard')
            return
        }
        // Solo verifica acceso, NO carga datos automáticamente
    }

    const fetchTransactions = async () => {
        setLoading(true)
        setHasBuscado(true)
        try {
            const res = await fetch('/api/admin/stripe-sessions')
            const result = await res.json()
            if (res.ok) {
                const txs = result.data.filter((t: Transaction) => 
                    t.payment_status === 'paid' && (t.origin === 'Stripe' || t.origin === 'Manual')
                ).sort((a: Transaction, b: Transaction) => (b.paid_at || b.created) - (a.paid_at || a.created))
                setTransactions(txs)
                calculateStats(txs)
            }
        } catch (error) {
            console.error('Fetch error:', error)
        } finally {
            setLoading(false)
        }
    }

    const calculateStats = (txs: Transaction[]) => {
        const now = new Date()
        const todayStr = now.toISOString().split('T')[0]
        const thisMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        let todaySum = 0
        let monthSum = 0
        let totalSum = 0

        const dailyMap: Record<string, number> = {}
        const monthlyMap: Record<string, number> = {}

        txs.forEach(t => {
            const date = new Date((t.paid_at || t.created) * 1000)
            const dStr = date.toISOString().split('T')[0]
            const mStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

            totalSum += t.amount
            if (dStr === todayStr) todaySum += t.amount
            if (mStr === thisMonthStr) monthSum += t.amount

            dailyMap[dStr] = (dailyMap[dStr] || 0) + t.amount
            monthlyMap[mStr] = (monthlyMap[mStr] || 0) + t.amount
        })

        setStats({
            today: todaySum,
            thisMonth: monthSum,
            total: totalSum
        })

        setDailyData(Object.entries(dailyMap).map(([date, amount]) => ({ date, amount })).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5)) // Last 5 active days
        setMonthlyData(Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount })).sort((a, b) => b.month.localeCompare(a.month)))
    }

    const filteredTransactions = transactions.filter(t => {
        const matchProf = (t.profesor_nombre || '').toLowerCase().includes(searchProfesor.toLowerCase());
        const matchCurso = (t.curso_titulo || '').toLowerCase().includes(searchCurso.toLowerCase());
        const matchAlumno = ((t.customer_name || '') + ' ' + (t.customer_email || '')).toLowerCase().includes(searchAlumno.toLowerCase());
        const matchMetodo = (t.method || '').toLowerCase().includes(searchMetodo.toLowerCase());
        const txDate = new Date((t.paid_at || t.created) * 1000);
        const matchDesde = fechaDesde ? txDate >= new Date(fechaDesde + 'T00:00:00') : true;
        const matchHasta = fechaHasta ? txDate <= new Date(fechaHasta + 'T23:59:59') : true;
        return matchProf && matchCurso && matchAlumno && matchMetodo && matchDesde && matchHasta;
    });

    const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));
    const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchProfesor, searchCurso, searchAlumno, searchMetodo, fechaDesde, fechaHasta]);

    const exportToCSV = () => {
        const headers = ['Fecha', 'Monto', 'Moneda', 'Cliente Nombre', 'Cliente Email', 'Profesor', 'Curso', 'Metodo de Pago', 'Estado'];
        const rows = filteredTransactions.map(t => [
            new Date((t.paid_at || t.created) * 1000).toLocaleString('es-MX'),
            t.amount,
            t.currency,
            t.customer_name,
            t.customer_email,
            t.profesor_nombre || 'Desconocido',
            t.curso_titulo,
            t.method,
            'Completado'
        ]);
        
        const csvContent = [headers, ...rows].map(e => e.map(item => `"${String(item).replace(/"/g, '""')}"`).join(",")).join("\n");
        const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Reporte_Finanzas_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }



    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Financiero</h1>
                <p className="mt-2 text-sm text-gray-500">Listado detallado de transacciones y conciliación de ingresos.</p>
            </div>

            {/* Historial de Transacciones */}
            <div className="mt-8 bg-white shadow-sm border border-gray-100 rounded-2xl p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-gray-900">Historial de Transacciones</h2>
                    </div>
                    <button 
                        onClick={exportToCSV}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                        <Download className="w-4 h-4" /> Exportar a Excel
                    </button>
                </div>

                {/* Filtros */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Profesor</label>
                            <input type="text" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Buscar profesor..." value={searchProfesor} onChange={(e) => setSearchProfesor(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Curso</label>
                            <input type="text" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Buscar curso..." value={searchCurso} onChange={(e) => setSearchCurso(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Alumno / Cliente</label>
                            <input type="text" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Nombre o email..." value={searchAlumno} onChange={(e) => setSearchAlumno(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Método de Pago</label>
                            <input type="text" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Ej. OXXO, Tarjeta..." value={searchMetodo} onChange={(e) => setSearchMetodo(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha desde</label>
                            <input type="date" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">Fecha hasta</label>
                            <input type="date" className="w-full text-sm border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <button
                            onClick={fetchTransactions}
                            disabled={loading}
                            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60 transition-colors"
                        >
                            {loading
                                ? <><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span> Cargando...</>
                                : <><Search className="w-4 h-4" /> Buscar</>
                            }
                        </button>
                    </div>
                </div>

                {!hasBuscado && (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                        <Search className="w-10 h-10 mb-3 opacity-30" />
                        <p className="text-sm">Usa los filtros y haz clic en <span className="font-semibold text-indigo-500">Buscar</span> para ver las transacciones.</p>
                    </div>
                )}

                {hasBuscado && !loading && (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monto</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Profesor</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Método de Pago</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Concepto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedTransactions.length === 0 ? (
                                    <tr><td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">No se encontraron transacciones con los filtros aplicados.</td></tr>
                                ) : paginatedTransactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                                            {new Date((t.paid_at || t.created) * 1000).toLocaleString('es-MX')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900">
                                            ${t.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-gray-500">{t.currency}</span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            <div>{t.customer_name}</div>
                                            <div className="text-xs text-gray-400">{t.customer_email}</div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            {t.profesor_nombre || 'Desconocido'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${t.method.includes('OXXO') ? 'bg-orange-100 text-orange-700' : t.method.includes('Tarjeta') ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'}`}>
                                                {t.method}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-max">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                Succeeded
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-500">
                                            {t.curso_titulo}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-gray-200 pt-4 gap-4">
                        <div className="text-sm text-gray-500 text-center sm:text-left">
                            Mostrando <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredTransactions.length)}</span> de <span className="font-medium">{filteredTransactions.length}</span> resultados
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 flex items-center transition-colors">
                                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                            </button>
                            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 disabled:opacity-50 hover:bg-gray-50 flex items-center transition-colors">
                                Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
        </div>
    )
}
