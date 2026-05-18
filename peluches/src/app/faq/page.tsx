import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function FAQ() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20 min-h-[60vh]">
        <h1 className="text-4xl font-black text-primary mb-8 font-display">Preguntas Frecuentes (FAQ)</h1>
        
        <div className="space-y-8 text-on-surface-variant font-body">
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-2">¿Cómo puedo lavar mi peluche? 🧼</h3>
            <p>
              Recomendamos lavarlos a mano con jabón neutro y agua fría. Si necesitas usar lavadora, mételo en una funda de almohada y usa el ciclo "Delicado". Déjalo secar al sol, ¡no uses secadora porque podría perder su esponjosidad!
            </p>
          </div>

          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-2">¿Puedo enviar un peluche de forma anónima? 🕵️‍♂️</h3>
            <p>
              ¡Sí! En la página del producto, donde escribes el mensaje personalizado, simplemente no pongas tu nombre. Nosotros nunca revelamos los datos del comprador en la caja de envío ni en la tarjeta.
            </p>
          </div>

          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-2">¿De qué material están hechos? 🧸</h3>
            <p>
              Están hechos de poliéster hipoalergénico ultra suave de primera calidad. El relleno es algodón sintético súper esponjoso (Memory Fluff) para que recupere su forma original después de un abrazo fuerte.
            </p>
          </div>

          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/30">
            <h3 className="text-xl font-bold text-on-surface mb-2">¿Facturan las compras? 📄</h3>
            <p>
              Por supuesto. Una vez que recibas la confirmación de tu compra, en ese mismo correo encontrarás un enlace automático para generar tu factura (CFDI) en formato PDF y XML al instante.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
