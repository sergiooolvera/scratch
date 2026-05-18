'use client'

import { useState } from 'react'
import { createCheckoutSession } from '@/app/actions/stripe'
import { useCartStore } from '@/store/useCartStore'
import { supabase } from '@/lib/supabase'
import { getShippingRates } from '@/app/actions/envia'

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedAddr, setSelectedAddr] = useState<any>(null)
  const items = useCartStore((state) => state.items)

  const handleCheckoutClick = async () => {
    if (items.length === 0) return
    
    setLoading(true)
    try {
      // Verificar si el usuario está logueado
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        alert('Por favor, inicia sesión para continuar con tu compra.')
        window.location.href = '/login?redirect=/carrito'
        return
      }

      // Verificar si el usuario tiene al menos una dirección guardada
      const { data: addresses } = await supabase
        .from('pl_addresses')
        .select('*')
        .eq('user_id', session.user.id)

      if (!addresses || addresses.length === 0) {
        alert('Para continuar, por favor registra la dirección a la que enviaremos tu pedido.')
        window.location.href = '/perfil/direcciones?redirect=/carrito'
        return
      }

      // En lugar de window.confirm, mostramos el modal
      const defaultAddr = addresses.find(a => a.is_default) || addresses[0]
      setSelectedAddr(defaultAddr)
      setShowModal(true)
      setLoading(false)
    } catch (error) {
      console.error('Error in checkout:', error)
      setLoading(false)
    }
  }

  const proceedToStripe = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      // Consultar tarifas de envío simuladas (Envia.com)
      const { rates } = await getShippingRates({
        postal_code: selectedAddr?.postal_code,
        city: selectedAddr?.city,
        state: selectedAddr?.state
      })

      const result = await createCheckoutSession(items, session?.user.email, rates, selectedAddr?.id)
      
      if (result.error) {
        alert('Error de Stripe: ' + result.error)
      } else if (result.url) {
        window.location.href = result.url
      }
    } catch (error) {
      console.error('Error proceeding to Stripe:', error)
      alert('Error al calcular el envío o procesar el pago.')
    } finally {
      setLoading(false)
      setShowModal(false)
    }
  }

  return (
    <>
      <button 
        onClick={handleCheckoutClick}
        disabled={loading || items.length === 0}
        className="block w-full bg-primary text-on-primary text-center py-5 rounded-full font-black text-xl bouncy-hover shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Procesando...' : 'Pagar Ahora'}
      </button>

      {/* Modal de Confirmación de Dirección */}
      {showModal && (
        <div className="fixed inset-0 z-[100] bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface w-full max-w-md rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-outline-variant/30">
            <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center bg-surface-container-low">
              <h2 className="text-xl font-black text-primary flex items-center gap-2">
                <span className="material-symbols-outlined">local_shipping</span>
                Confirmar Dirección
              </h2>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <p className="text-on-surface-variant text-sm">¿Confirmas que deseas enviar tu pedido a la siguiente dirección?</p>
              
              <div className="bg-surface-container-high p-4 rounded-lg border border-outline-variant/20">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-secondary mt-0.5">location_on</span>
                  <div>
                    <h3 className="font-bold text-on-surface">{selectedAddr?.title}</h3>
                    <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                      {selectedAddr?.address_line1}
                      {selectedAddr?.address_line2 ? `, ${selectedAddr.address_line2}` : ''}<br />
                      {selectedAddr?.city}, {selectedAddr?.state}, CP {selectedAddr?.postal_code}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => {
                    setShowModal(false)
                    window.location.href = '/perfil/direcciones?redirect=/carrito'
                  }} 
                  className="flex-1 py-3 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-all text-sm border border-outline-variant/50"
                >
                  Cambiar / Agregar
                </button>
                <button 
                  onClick={proceedToStripe} 
                  disabled={loading}
                  className="flex-1 py-3 rounded-full bg-primary text-on-primary font-black custom-shadow-tier-1 hover:scale-105 transition-all text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Confirmar y Pagar</span>
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
