import Navbar from '@/components/landing/Navbar'
import NosotrosSection from '@/components/landing/NosotrosSection'
import Footer from '@/components/landing/Footer'

export const metadata = {
  title: 'Nosotros | Grupo EGAC',
  description: 'Conoce nuestra identidad, misión, visión, valores y el respaldo institucional del Ecosistema Educativo EGAC.',
}

export default function NosotrosPage() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col justify-between">
      <Navbar />
      <main className="pt-20 flex-grow">
        <NosotrosSection />
      </main>
      <Footer />
    </div>
  )
}
