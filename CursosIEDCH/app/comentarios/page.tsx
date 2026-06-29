'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquare, Send, CheckCircle2, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ComentariosPage() {
  const supabase = createClient()
  
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuario si está logueado para autocompletar e identificar
  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUserId(user.id)
        setEmail(user.email || '')
        
        // Obtener nombre del perfil
        const { data: profile } = await supabase
          .from('ie_profiles')
          .select('nombre, apellido_paterno, apellido_materno')
          .eq('id', user.id)
          .single()
        
        if (profile) {
          const nombreCompleto = [profile.nombre, profile.apellido_paterno, profile.apellido_materno]
            .filter(Boolean)
            .join(' ')
          setNombre(nombreCompleto)
        }
      }
    }
    loadUser()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!mensaje.trim()) {
      setError('Por favor, ingresa tu comentario o sugerencia.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { error: insertError } = await supabase
        .from('ie_comentarios')
        .insert({
          nombre: nombre.trim() || null,
          email: email.trim() || null,
          mensaje: mensaje.trim(),
          user_id: userId
        })

      if (insertError) throw insertError

      setSuccess(true)
      setMensaje('')
    } catch (err: any) {
      console.error('Error al guardar comentario:', err)
      setError('Ocurrió un error al enviar tu comentario. Por favor, inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-slate-50 to-white min-h-[calc(100vh-64px)] py-12 px-4 sm:px-6 lg:px-8 font-sans flex flex-col justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Botón de regreso */}
        <Link 
          href="/"
          className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Volver al Inicio
        </Link>

        {/* Encabezado */}
        <div className="text-center mb-10">
          <div className="mx-auto h-16 w-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-inner">
            <MessageSquare className="h-8 w-8" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-950">
            Comentarios y Sugerencias
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-md mx-auto leading-relaxed">
            Tu opinión es muy importante para nosotros. Ayúdanos a mejorar el portal compartiendo tus ideas o reporte de fallas.
          </p>
        </div>

        {/* Contenedor del Formulario */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 overflow-hidden transition-all duration-300">
          <div className="p-8 sm:p-10">
            {success ? (
              <div className="text-center py-6 animate-fade-in">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 text-green-600 mb-6 scale-110">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Muchas gracias por tus comentarios!</h3>
                <p className="text-slate-600 max-w-sm mx-auto mb-8 leading-relaxed">
                  Hemos recibido tu opinión correctamente. Nuestro equipo revisará tu mensaje para seguir optimizando la plataforma.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-all active:scale-95"
                >
                  Enviar otro comentario
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Campo: Nombre */}
                  <div className="space-y-2">
                    <label htmlFor="nombre" className="block text-sm font-semibold text-slate-800">
                      Nombre <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="text"
                      id="nombre"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      placeholder="Tu nombre completo"
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-900"
                    />
                  </div>

                  {/* Campo: Correo */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-slate-800">
                      Correo Electrónico <span className="text-slate-400 font-normal">(Opcional)</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@correo.com"
                      disabled={loading}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 text-slate-900"
                    />
                  </div>
                </div>

                {/* Campo: Mensaje */}
                <div className="space-y-2">
                  <label htmlFor="mensaje" className="block text-sm font-semibold text-slate-800">
                    Comentario o Sugerencia <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="mensaje"
                    rows={5}
                    value={mensaje}
                    onChange={(e) => setMensaje(e.target.value)}
                    placeholder="Escribe aquí tu opinión, sugerencia, o reporte de error..."
                    required
                    disabled={loading}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200/80 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-slate-400 resize-none text-slate-900"
                  />
                </div>

                {/* Botón de Envío */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 shadow-lg shadow-blue-100 hover:shadow-xl hover:shadow-blue-200 transition-all active:scale-95 disabled:scale-100 disabled:pointer-events-none"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Enviando comentarios...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Comentarios</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
