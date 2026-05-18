import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { siteConfig } from '@/config/site'

export default function TerminosYPrivacidad() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20 min-h-[60vh]">
        <h1 className="text-4xl font-black text-primary mb-8 font-display">Términos Legales y Privacidad</h1>
        <div className="space-y-6 text-lg text-on-surface-variant font-body">
          
          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">Aviso de Privacidad 🔒</h2>
          <p>
            En {siteConfig.name} ("La Empresa"), nos tomamos muy en serio tu privacidad. Los datos personales que nos proporcionas (nombre, dirección, correo y detalles de pago) se utilizan EXCLUSIVAMENTE para procesar tu orden y hacer llegar el peluche a su destino.
          </p>
          <p>
            Tus pagos son procesados de forma encriptada a través de Stripe, líder mundial en seguridad financiera. Nosotros nunca guardamos ni tenemos acceso directo a los números de tu tarjeta de crédito o débito.
          </p>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">Términos y Condiciones ⚖️</h2>
          <ul className="list-decimal pl-6 space-y-2">
            <li><strong>Precios:</strong> Todos los precios mostrados están en Moneda Nacional (MXN) e incluyen IVA.</li>
            <li><strong>Disponibilidad:</strong> Los productos están sujetos a disponibilidad. Si por algún motivo un peluche se agota después de tu compra, te contactaremos inmediatamente para ofrecerte una alternativa mejor o un reembolso completo.</li>
            <li><strong>Uso del sitio:</strong> Está prohibido utilizar nuestras imágenes, diseños de IA o marcas registradas sin autorización previa por escrito.</li>
          </ul>

          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">Uso de Cookies 🍪</h2>
          <p>
            Utilizamos cookies únicamente para mantener tu carrito de compras guardado, incluso si cierras la pestaña, y para entender de forma anónima qué peluches son los favoritos de nuestros clientes. Al usar nuestra tienda, aceptas este dulce y necesario uso de cookies.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
