import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { siteConfig } from '@/config/site'

export default function Envios() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20 min-h-[60vh]">
        <h1 className="text-4xl font-black text-primary mb-8 font-display">Envíos y Devoluciones</h1>
        <div className="space-y-6 text-lg text-on-surface-variant font-body">
          
          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">Política de Envíos 📦</h2>
          <p>
            Sabemos que la emoción de recibir un peluche de {siteConfig.name} no puede esperar. Es por eso que nos hemos aliado con las mejores paqueterías (como Envia.com, 99minutos, y más) para asegurar que tu peluche llegue a tiempo y en perfectas condiciones.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Envíos Nacionales:</strong> Realizamos envíos a toda la República Mexicana.</li>
            <li><strong>Tiempos de entrega:</strong> Los envíos estándar toman de 3 a 5 días hábiles. Los envíos exprés (solo CDMX y Área Metropolitana) llegan al día siguiente hábil.</li>
            <li><strong>Costo de envío:</strong> ¡El envío estándar es completamente GRATIS en todas las compras!</li>
          </ul>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">Política de Devoluciones 🔙</h2>
          <p>
            Queremos que tú y la persona que recibe el peluche estén 100% felices. Si por alguna razón tu pedido de {siteConfig.name} llega lastimado en el camino, o no es lo que esperabas, ofrecemos:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Devolución sin costo:</strong> Tienes hasta 7 días después de recibirlo para solicitar un reembolso o cambio.</li>
            <li><strong>Garantía de Suavidad:</strong> Si el peluche tiene algún defecto de fábrica, te enviaremos uno nuevo inmediatamente, ¡sin hacer preguntas!</li>
          </ul>
          <p className="mt-4">
            Para iniciar una devolución, escríbenos a <strong>soporte@plushiejoy.com</strong> con tu número de orden.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
