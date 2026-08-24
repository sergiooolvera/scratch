'use client'

import { useState } from 'react'
import { Mail, Phone, MessageSquare, Send, CheckCircle2, MapPin, Clock, Facebook, Instagram } from 'lucide-react'

export default function ContactSection() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulate interactive submission success
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 600)
  }

  const resetForm = () => {
    setFormData({ name: '', email: '', subject: '', message: '' })
    setSubmitted(false)
  }

  return (
    <section id="contacto" className="py-20 bg-slate-50 border-t border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold uppercase tracking-wider mb-4">
            <MessageSquare className="w-4 h-4 text-amber-600" /> Comunicación
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0b1b36] tracking-tight">
            Ponte en Contacto
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            ¿Tienes alguna duda o propuesta de colaboración? Envíanos un mensaje y nuestro equipo de soporte te atenderá a la brevedad.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Details Side Cards */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md space-y-6">
              <h3 className="text-xl font-bold text-[#0b1b36] border-b border-slate-100 pb-4">
                Información de Atención
              </h3>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Correo Electrónico</h4>
                  <a href="mailto:soporte@grupoegac.com" className="text-sm font-bold text-teal-700 hover:underline">
                    soporte@grupoegac.com
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Atención y tickets de soporte técnico</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">WhatsApp Business</h4>
                  <a href="https://wa.me/527298184978" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-emerald-700 hover:underline">
                    +52 (729) 818-4978
                  </a>
                  <p className="text-xs text-slate-500 mt-0.5">Orientación personalizada con un asesor</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Horario de Atención</h4>
                  <p className="text-sm font-medium text-slate-700">Lunes a Viernes: 9:00 - 17:00 hrs</p>
                  <p className="text-xs text-slate-500">Sábados: 9:00 - 15:00 hrs</p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Ubicación Institucional</h4>
                  <p className="text-sm font-medium text-slate-700">Metepec, Estado de México</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-3">Redes Sociales Oficiales</h4>
                <div className="flex gap-3">
                  <a
                    href="https://www.facebook.com/share/1ATRDoAfoQ/?mibextid=wwXIfr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-colors"
                  >
                    <Facebook className="w-4 h-4" /> Facebook
                  </a>
                  <a
                    href="https://www.instagram.com/academy_egac?igsh=MW82OTczb2hoamI5bw%3D%3D&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pink-50 text-pink-700 hover:bg-pink-100 text-xs font-bold transition-colors"
                  >
                    <Instagram className="w-4 h-4" /> Instagram
                  </a>
                  <a
                    href="https://wa.me/527298184978"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors"
                  >
                    <Phone className="w-4 h-4" /> WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Links Card */}
            <div className="bg-gradient-to-br from-[#0b1b36] to-slate-900 p-6 rounded-2xl text-white shadow-lg border border-slate-700">
              <h4 className="text-base font-bold text-amber-400 mb-2">Ecosistema Educativo EGAC</h4>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                ¿Eres instructor o institución educacional? Publica tus capacitaciones y expande tu impacto académico.
              </p>
              <a
                href="/register?type=instructor"
                className="inline-block w-full text-center py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors shadow"
              >
                Quiero Ser Instructor
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 bg-white p-8 sm:p-10 rounded-2xl border border-slate-200 shadow-lg">
            {submitted ? (
              <div className="text-center py-10 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-[#0b1b36]">¡Mensaje Enviado!</h3>
                <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                  Muchas gracias por escribirnos, <strong className="text-slate-800">{formData.name}</strong>. Tu mensaje ha sido recibido con éxito. Nuestro equipo te responderá a la brevedad al correo:
                </p>
                <div className="inline-block px-4 py-2 rounded-lg bg-teal-50 text-teal-800 font-mono text-xs font-bold border border-teal-200">
                  {formData.email}
                </div>
                <div className="pt-6">
                  <button
                    onClick={resetForm}
                    className="px-6 py-2.5 rounded-xl bg-[#0b1b36] hover:bg-slate-800 text-white font-semibold text-sm transition-colors"
                  >
                    Enviar otro mensaje
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <h3 className="text-xl font-bold text-[#0b1b36] mb-6">
                  Envíanos un Mensaje
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="c-name" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Nombre Completo *
                    </label>
                    <input
                      id="c-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Tu nombre completo..."
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-slate-800 transition-all"
                    />
                  </div>

                  <div>
                    <label htmlFor="c-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Correo Electrónico *
                    </label>
                    <input
                      id="c-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="tu@correo.com"
                      className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-slate-800 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="c-subject" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Asunto *
                  </label>
                  <input
                    id="c-subject"
                    type="text"
                    required
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    placeholder="¿Cómo podemos ayudarte?"
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-slate-800 transition-all"
                  />
                </div>

                <div>
                  <label htmlFor="c-message" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Mensaje *
                  </label>
                  <textarea
                    id="c-message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Escribe aquí tu duda o comentario en detalle..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm text-slate-800 transition-all"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {loading ? 'Enviando...' : 'Enviar Mensaje'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
