import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export default function CancelPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center space-y-6">
        <div className="w-24 h-24 bg-error-container text-error rounded-full flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-6xl">cancel</span>
        </div>
        <h1 className="text-4xl font-black text-on-surface">Pago Cancelado</h1>
        <p className="text-xl text-on-surface-variant max-w-md mx-auto">
          No te preocupes, tu carrito sigue guardado. Puedes intentar el pago nuevamente cuando estés listo.
        </p>
        <div className="pt-8 flex gap-4">
          <Link href="/carrito" className="bg-primary text-on-primary px-10 py-4 rounded-full font-bold bouncy-hover">
            Volver al Carrito
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
