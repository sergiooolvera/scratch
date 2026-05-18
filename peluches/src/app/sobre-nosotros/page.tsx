import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { siteConfig } from '@/config/site'

export default function SobreNosotros() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-20 min-h-[60vh]">
        <h1 className="text-4xl font-black text-primary mb-8 font-display">Sobre {siteConfig.name}</h1>
        <div className="space-y-6 text-lg text-on-surface-variant font-body">
          <p>
            ¡Bienvenidos a <strong>{siteConfig.name}</strong>! Somos una empresa nacida de una idea simple pero poderosa: 
            <em> "un abrazo puede cambiarle el día a cualquiera"</em>.
          </p>
          <p>
            Creemos firmemente en el poder de los detalles. Ya sea para celebrar un cumpleaños, enviar ánimos a la distancia, o simplemente recordar a esa persona especial cuánto la quieres, nuestros peluches están diseñados para ser mensajeros de amor.
          </p>
          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">Nuestra Misión</h2>
          <p>
            Nuestra misión es llevar alegría y suavidad a cada rincón de México y el mundo. Seleccionamos cuidadosamente los materiales más suaves, los rellenos más "abrazables" y nos aseguramos de que cada peluche pase por un estricto control de calidad, que incluye al menos tres abrazos de prueba antes de ser empaquetado.
          </p>
          <h2 className="text-2xl font-bold text-on-surface mt-10 mb-4">Trabaja con nosotros</h2>
          <p>
            ¿Amas los peluches tanto como nosotros? Estamos en constante crecimiento. Envía tu currículum a <strong>hola@plushiejoy.com</strong> y cuéntanos por qué serías el "Abrazador Oficial" o "Empacador de Sonrisas" perfecto para el equipo.
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
