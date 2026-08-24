import Navbar from '@/components/landing/Navbar'
import ContactSection from '@/components/landing/ContactSection'
import Footer from '@/components/landing/Footer'

export const metadata = {
  title: 'Contacto | Grupo EGAC',
  description: 'Ponte en contacto con nuestro equipo de soporte técnico y orientación personalizada.',
}

export default function ContactoPage() {
  return (
    <div className="min-h-screen bg-white font-sans flex flex-col justify-between">
      <Navbar />
      <main className="pt-20 flex-grow">
        <ContactSection />
      </main>
      <Footer />
    </div>
  )
}
