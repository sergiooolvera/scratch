'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Menu, X, Upload, LogIn } from 'lucide-react'
import CourseModal from './CourseModal'

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { name: 'Inicio', href: '/' },
    { name: 'Nosotros', href: '/nosotros' },
    { name: 'Preguntas Frecuentes', href: '/preguntas-frecuentes' },
    { name: 'Contacto', href: '/contacto' },
  ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      <header className="fixed w-full bg-[#0b1b36] border-b border-white/10 z-40 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <Image
                  src="/images/logo.jpg"
                  alt="Logo EGAC"
                  width={240}
                  height={80}
                  className="h-20 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`text-sm font-medium transition-colors py-1 ${
                      active
                        ? 'text-white border-b-2 border-indigo-600'
                        : 'text-gray-300 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                href="/login"
                className="text-gray-300 hover:text-white text-sm font-medium flex items-center transition-colors"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Iniciar Sesión
              </Link>
              <button
                onClick={() => setIsCourseModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center transition-all shadow-lg shadow-indigo-600/30"
              >
                <Upload className="w-4 h-4 mr-2" />
                Quiero publicar un curso
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white focus:outline-none"
              >
                {isMobileMenuOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-[#0b1b36] border-t border-white/10">
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      active ? 'text-white bg-white/10' : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {link.name}
                  </Link>
                )
              })}
              <div className="pt-4 flex flex-col space-y-3 px-3">
                <Link
                  href="/login"
                  className="w-full text-center text-gray-300 hover:text-white font-medium py-2 border border-gray-600 rounded-md"
                >
                  Iniciar Sesión
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false)
                    setIsCourseModalOpen(true)
                  }}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 rounded-md"
                >
                  Quiero publicar un curso
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <CourseModal isOpen={isCourseModalOpen} setIsOpen={setIsCourseModalOpen} />
    </>
  )
}
