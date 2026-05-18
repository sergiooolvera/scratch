'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { useEffect } from 'react'
import { useCartStore } from '@/store/useCartStore'

export default function SuccessPage() {
  useEffect(() => {
    useCartStore.getState().clearCart()
  }, [])

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-6xl">check_circle</span>
        </div>
        <h1 className="text-4xl font-black text-on-surface">¡Gracias por tu compra!</h1>
        <p className="text-xl text-on-surface-variant max-w-md mx-auto">
          Tu pedido de alegría ha sido procesado con éxito. Recibirás un correo con los detalles en unos minutos.
        </p>
        <div className="pt-8 flex gap-4">
          <Link href="/" className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold bouncy-hover">
            Seguir Comprando
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
