'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { siteConfig } from '@/config/site'
import { useCartStore } from '@/store/useCartStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError(error.message)
    } else {
      // Restaurar el carrito del usuario si existe en su metadata
      const savedCart = data.user?.user_metadata?.cart_items
      if (savedCart && savedCart.length > 0) {
        useCartStore.getState().setItems(savedCart)
      }

      const searchParams = new URLSearchParams(window.location.search)
      const redirect = searchParams.get('redirect') || '/'
      router.push(redirect)
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 md:p-8 bg-background">
      {/* Main Auth Container */}
      <div className="w-full max-w-5xl bg-surface-container-lowest rounded-lg overflow-hidden flex flex-col md:flex-row custom-shadow-tier-2 min-h-[600px]">
        {/* Side Column: Image/Branding */}
        <div className="w-full md:w-1/2 relative overflow-hidden hidden md:block">
          <img 
            className="absolute inset-0 w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuArYvN16WCwX9WGIOo0Rp3UEkEHkRepiIbCQ6JG0OEOQcJr6Lod6l0Pgizhjh3oKhwAtdbFT-YATn497FcLOZKrkvppGxa049kyDD5eox_We7IHVjZG4B7KhRJ_YQIi2hfQSINcD3W6btqy2WS2seQJ5mINURET6nuBSxhR7K-bTJuYTB9s8Eu1VahatXiHLBnM8s4xe837gLNv0At8fcMOME2E2a2mgRqZGsepHeQpnNV9UQXjoylx7azjsLhTaTdy2h1VBmZe" 
            alt="Magic plushies"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary/60 to-transparent flex flex-col justify-end p-12 text-white">
            <h1 className="text-4xl font-black mb-4">¡Bienvenido a la diversión!</h1>
            <p className="text-lg font-medium opacity-90">Únete a la comunidad de amantes de los peluches más colorida del mundo.</p>
          </div>
        </div>

        {/* Content Column: Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center md:text-left">
            <Link href="/" className="inline-block mb-6 md:hidden">
               <span className="text-2xl font-black tracking-tighter text-primary">{siteConfig.name}</span>
            </Link>
            <h2 className="text-3xl font-black text-on-surface mb-2">Ingresa a tu cuenta</h2>
            <p className="text-on-surface-variant">¿No tienes cuenta? <Link className="text-tertiary font-bold hover:underline" href="/registro">Regístrate gratis</Link></p>
          </div>

          {/* Social Login */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <button className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-surface-variant rounded-full font-bold text-sm bouncy-hover hover:bg-surface-variant transition-colors">
              <img alt="Google Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4xAM4ghssPh-wTO2Au669xum5wG8lq0WyCEWHHMlP9rLNtfh19BVcYk2h_Woqslz6niRDjZ1nyWYqvQ0PLoIcy6LneuA1mwT7HEl9k0cUuyX_U5QMj3FUQ6RKOAUm7Phfk-omMbPNbigyL2pbOBErmgUpKOJLPzcXPlR6Leqo8zov7XWj7t166QKXWf6Pyq9K3DjYMFphKRxJ-tgbWWG53DNfL_gHepH--E7tnKt3z23um75KsPUh3IIhtLSjDn5u-OCdWHoe"/>
              Google
            </button>
            <button className="flex items-center justify-center gap-2 py-3 px-4 border-2 border-surface-variant rounded-full font-bold text-sm bouncy-hover hover:bg-surface-variant transition-colors">
              <img alt="Facebook Logo" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBuRkbl5ckpemBYYpLh0KBUjSXjg6_r1tgMjUYVkxTCRV7RuxSbCV6ywDJv2pdw1PPCyuPenMJicGAr_wKm5KTYDLxsj7rg934FsE3D5TRvpu16DKwGJMdhtKiOUZhtJjQCKbUcpmo0dz5QtKe1rtQdmM9XMKq6fAeDNT9uo54-7xQsG5tL-M5EwdZcaMYWHF_m9-zJZlwjl0Fguo4-a6hKNbfgp0J8QzNxHHbxFnuIulv0CD39JBg7aF9vOQDXbDYj_TUXV3tz"/>
              Facebook
            </button>
          </div>

          <div className="relative flex py-5 items-center mb-4">
            <div className="flex-grow border-t border-outline-variant"></div>
            <span className="flex-shrink mx-4 text-outline font-medium text-xs uppercase tracking-widest">o usa tu email</span>
            <div className="flex-grow border-t border-outline-variant"></div>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleLogin}>
            {error && (
              <div className="bg-error/10 text-error p-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-on-surface-variant px-2">Correo Electrónico</label>
              <input 
                className="w-full px-6 py-4 rounded-full bg-surface-container-high border-none focus:ring-4 focus:ring-primary-fixed outline-none transition-all placeholder-on-surface-variant/50" 
                placeholder="hola@ejemplo.com" 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-sm font-bold text-on-surface-variant">Contraseña</label>
                <Link className="text-xs font-bold text-tertiary hover:underline" href="/recuperar">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="relative">
                <input 
                  className="w-full px-6 py-4 rounded-full bg-surface-container-high border-none focus:ring-4 focus:ring-primary-fixed outline-none transition-all placeholder-on-surface-variant/50" 
                  placeholder="••••••••" 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex items-center gap-2 px-2">
              <input className="w-5 h-5 rounded-md border-outline-variant text-primary focus:ring-primary" id="remember" type="checkbox"/>
              <label className="text-sm font-medium text-on-surface-variant" htmlFor="remember">Recordar sesión</label>
            </div>
            <button 
              className="w-full py-4 rounded-full bg-primary text-on-primary font-black text-lg custom-shadow-tier-1 bouncy-hover active:scale-95 transition-all disabled:opacity-50" 
              type="submit"
              disabled={loading}
            >
              {loading ? 'Cargando...' : 'Iniciar Sesión'}
            </button>
          </form>
          
          <div className="mt-12 md:hidden text-center">
            <p className="text-sm text-on-surface-variant font-medium">{siteConfig.name} — Tu dosis diaria de ternura</p>
          </div>
        </div>
      </div>
    </main>
  )
}
