import Navbar from '@/components/landing/Navbar'
import FAQSection from '@/components/landing/FAQSection'
import Footer from '@/components/landing/Footer'

export const metadata = {
  title: 'Preguntas Frecuentes | Grupo EGAC',
  description: 'Centro de Ayuda y Preguntas Frecuentes sobre la plataforma, cursos, pagos y certificaciones de Grupo EGAC.',
}

export default function PreguntasFrecuentesPage() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col justify-between">
      <Navbar />
      <main className="pt-20 flex-grow">
        <FAQSection />
      </main>
      <Footer />
    </div>
  )
}
