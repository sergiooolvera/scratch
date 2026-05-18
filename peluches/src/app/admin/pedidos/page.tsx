'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { simulatePedido } from '@/app/actions/simulate'

export default function AdminPedidos() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const role = session?.user.user_metadata?.role
      
      if (!session || (role !== 'admin' && role !== 'gestor')) {
        alert('Acceso denegado. No tienes permisos para acceder a esta sección.')
        window.location.href = '/'
        return
      }
      
      setCheckingAuth(false)
      fetchOrders()
    }
    
    checkAuth()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('pl_orders')
        .select(`
          *,
          pl_order_items (
            *,
            pl_products (name)
          ),
          pl_addresses (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error: any) {
      console.error('Error al cargar pedidos:', error)
      alert('Error al cargar pedidos: ' + error.message)
    }
    setLoading(false)
  }

  const handleSimularPedido = async () => {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const result = await simulatePedido(session?.user.id)
    
    if (result.error) {
      alert('Error al simular pedido: ' + result.error)
    } else {
      alert('¡Pedido simulado creado con éxito!')
      fetchOrders()
    }
    setLoading(false)
  }

  const handleGenerarGuia = async (order: any) => {
    alert(`Aquí se generará la guía para el pedido ${order.id.substring(0,8)} usando Envia.com.\n\nPróximamente...`)
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-2xl font-bold text-primary animate-pulse">Verificando credenciales...</div>
      </div>
    )
  }

  return (
    <>
      <Navbar />
      
      <main className="w-full px-4 md:px-10 lg:px-16 py-10 min-h-screen">
        
        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-block px-4 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-sm font-bold mb-3 tracking-wide">ADMINISTRACIÓN</span>
            <h1 className="text-4xl font-extrabold text-on-surface tracking-tight">Gestión de Pedidos</h1>
            <p className="text-on-surface-variant mt-2 text-lg">Revisa los pedidos pagados y genera las guías de envío.</p>
          </div>
          <div>
            <button 
              onClick={handleSimularPedido}
              className="px-6 py-3 rounded-full bg-primary text-white font-bold custom-shadow-tier-1 hover:scale-105 transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
              disabled={loading}
            >
              <span className="material-symbols-outlined">add_circle</span>
              Simular Pedido (Prueba)
            </button>
          </div>
        </div>

        {/* Tabla de Pedidos */}
        <div className="bg-white rounded-xl shadow-sm border border-surface-variant overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface-variant text-sm">
                <th className="p-4 font-bold">ID Pedido</th>
                <th className="p-4 font-bold">Fecha</th>
                <th className="p-4 font-bold">Total</th>
                <th className="p-4 font-bold">Estatus</th>
                <th className="p-4 font-bold">Dirección</th>
                <th className="p-4 font-bold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-on-surface-variant">Cargando pedidos...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-on-surface-variant">No se encontraron pedidos.</td>
                </tr>
              ) : (
                orders.map(order => (
                  <tr key={order.id} className="border-t border-surface-variant hover:bg-surface-container-lowest transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-on-surface">#{order.id.substring(0, 8)}</div>
                      <div className="text-xs text-on-surface-variant">{order.pl_order_items?.length || 0} productos</div>
                    </td>
                    <td className="p-4 text-on-surface-variant">
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 font-bold text-primary">${order.total_amount}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.status === 'paid' ? 'bg-green-100 text-green-800' : 
                        order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status === 'paid' ? 'Pagado' : 
                         order.status === 'pending' ? 'Pendiente' : order.status}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-on-surface-variant">
                      {order.pl_addresses ? (
                        <>
                          <div>{order.pl_addresses.city}, {order.pl_addresses.state}</div>
                          <div>CP: {order.pl_addresses.postal_code}</div>
                        </>
                      ) : 'Sin dirección'}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleGenerarGuia(order)}
                        className="px-4 py-2 rounded-full bg-secondary text-white text-sm font-bold hover:scale-105 transition-transform disabled:opacity-50"
                        disabled={order.status !== 'paid'}
                      >
                        Generar Guía
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </>
  )
}
