'use client'

import { useCartStore } from '@/store/useCartStore'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import CheckoutButton from '@/components/CheckoutButton'

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <>
      <Navbar />
      
      <main className="w-full px-4 md:px-10 lg:px-16 py-16 min-h-[600px]">
        <h1 className="text-4xl font-black text-on-surface mb-10">Tu Carrito de Alegría</h1>
        
        {items.length === 0 ? (
          <div className="text-center py-20 space-y-6">
            <span className="material-symbols-outlined text-8xl text-outline-variant">shopping_cart_off</span>
            <p className="text-2xl font-bold text-on-surface-variant">Tu carrito está vacío</p>
            <Link href="/" className="inline-block bg-primary text-on-primary px-10 py-4 rounded-full font-bold bouncy-hover">
              Explorar Peluches
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
            {/* Items List */}
            <div className="lg:col-span-8 space-y-6">
              {items.map((item) => (
                <div key={item.id} className="bg-surface-container-lowest rounded-2xl p-8 flex flex-col sm:flex-row gap-8 border border-outline-variant/30 custom-shadow-tier-1">
                  <div className="w-32 h-32 md:w-64 md:h-64 rounded-xl overflow-hidden bg-surface-container shrink-0">
                    <img className="w-full h-full object-cover" src={item.images?.[0]} alt={item.name} />
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="flex justify-between">
                      <h3 className="text-xl font-bold text-on-surface">{item.name}</h3>
                      <button onClick={() => removeItem(item.id, item.size)} className="text-error hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined">delete</span>
                      </button>
                    </div>
                    <p className="text-primary font-bold text-lg">${item.price}</p>
                    {item.size && <p className="text-sm text-on-surface-variant font-medium">Tamaño: {item.size}</p>}
                    {item.delivery_date && <p className="text-sm text-on-surface-variant font-medium">Entrega: {item.delivery_date}</p>}
                    {item.custom_message && <p className="text-sm text-on-surface-variant italic border-l-2 border-primary/30 pl-2 mt-1">"{item.custom_message}"</p>}
                    
                    <div className="flex items-center gap-4 pt-2">
                      <div className="flex items-center border-2 border-outline-variant rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity - 1)} className="p-1 hover:text-primary"><span className="material-symbols-outlined">remove</span></button>
                        <span className="px-4 font-bold">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, item.size, item.quantity + 1)} className="p-1 hover:text-primary"><span className="material-symbols-outlined">add</span></button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary Sidebar */}
            <div className="lg:col-span-4">
              <div className="bg-surface-container-high rounded-2xl p-10 sticky top-32 space-y-8">
                <h2 className="text-2xl font-black text-on-surface">Resumen</h2>
                <div className="space-y-3 border-b border-outline-variant pb-6">
                  <div className="flex justify-between text-on-surface-variant font-medium">
                    <span>Subtotal</span>
                    <span>${getTotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-on-surface-variant font-medium">
                    <span>Envío</span>
                    <span className="text-primary font-bold">Calculado al pagar</span>
                  </div>
                </div>
                <div className="flex justify-between text-2xl font-black text-on-surface">
                  <span>Total</span>
                  <span>${getTotal().toFixed(2)}</span>
                </div>
                <CheckoutButton />
                <Link href="/" className="block text-center text-on-surface-variant font-bold hover:text-primary transition-colors">
                  Seguir Comprando
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </>
  )
}
