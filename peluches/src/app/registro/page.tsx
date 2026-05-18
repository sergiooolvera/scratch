'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { siteConfig } from '@/config/site'

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        }
      }
    })

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        router.push('/login')
      }, 3000)
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-5xl bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col md:flex-row custom-shadow-tier-2 min-h-[600px]">
        {/* Side Column */}
        <div className="w-full md:w-1/2 relative overflow-hidden hidden md:block">
          <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuArYvN16WCwX9WGIOo0Rp3UEkEHkRepiIbCQ6JG0OEOQcJr6Lod6l0Pgizhjh3oKhwAtdbFT-YATn497FcLOZKrkvppGxa049kyDD5eox_We7IHVjZG4B7KhRJ_YQIi2hfQSINcD3W6btqy2WS2seQJ5mINURET6nuBSxhR7K-bTJuYTB9s8Eu1VahatXiHLBnM8s4xe837gLNv0At8fcMOME2E2a2mgRqZGsepHeQpnNV9UQXjoylx7azjsLhTaTdy2h1VBmZe" 
            alt="Magic plushies"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/60 to-transparent flex flex-col justify-end p-12 text-white">
            <h1 className="text-4xl font-black mb-4">Empieza tu aventura</h1>
            <p className="text-lg font-medium opacity-90">Crea una cuenta y comienza a repartir abrazos por todo el mundo.</p>
          </div>
        </div>

        {/* Form Column */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <Link href="/" className="inline-block mb-6 md:hidden">
               <span className="text-2xl font-black tracking-tighter text-primary">{siteConfig.name}</span>
            </Link>
            <h2 className="text-3xl font-black text-on-surface mb-2">Crea tu cuenta</h2>
            <p className="text-on-surface-variant">¿Ya tienes cuenta? <Link className="text-primary font-bold hover:underline" href="/login">Inicia sesión</Link></p>
          </div>

          {success ? (
            <div className="bg-primary/10 text-primary p-6 rounded-xl text-center space-y-4">
              <span className="material-symbols-outlined text-5xl">check_circle</span>
              <h3 className="text-xl font-bold">¡Registro exitoso!</h3>
              <p>Revisa tu correo para confirmar tu cuenta. Serás redirigido al login en unos segundos...</p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleRegister}>
              {error && (
                <div className="bg-error/10 text-error p-3 rounded-lg text-sm font-medium">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant px-2">Nombre Completo</label>
                <input 
                  className="w-full px-6 py-4 rounded-full bg-surface-container-high border-none focus:ring-4 focus:ring-secondary-fixed outline-none transition-all placeholder-on-surface-variant/50" 
                  placeholder="Tu nombre" 
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant px-2">Correo Electrónico</label>
                <input 
                  className="w-full px-6 py-4 rounded-full bg-surface-container-high border-none focus:ring-4 focus:ring-secondary-fixed outline-none transition-all placeholder-on-surface-variant/50" 
                  placeholder="hola@ejemplo.com" 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-on-surface-variant px-2">Contraseña</label>
                <input 
                  className="w-full px-6 py-4 rounded-full bg-surface-container-high border-none focus:ring-4 focus:ring-secondary-fixed outline-none transition-all placeholder-on-surface-variant/50" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <button 
                className="w-full py-4 rounded-full bg-secondary text-on-secondary font-black text-lg custom-shadow-tier-1 bouncy-hover active:scale-95 transition-all disabled:opacity-50 mt-4" 
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creando cuenta...' : 'Registrarse'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
