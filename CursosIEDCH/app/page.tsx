import Navbar from '@/components/landing/Navbar'
import HeroSection from '@/components/landing/HeroSection'
import PopularCourses from '@/components/landing/PopularCourses'
import Testimonials from '@/components/landing/Testimonials'
import Footer from '@/components/landing/Footer'

export const dynamic = 'force-dynamic'

export default function Home() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <Navbar />
      <main>
        <HeroSection />
        <PopularCourses />
        <Testimonials />
      </main>
      <Footer />
    </div>
  )
}
