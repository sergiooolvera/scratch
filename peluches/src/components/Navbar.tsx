'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Category } from '@/types/database'
import CartIcon from './CartIcon'
import { useCartStore } from '@/store/useCartStore'
import { siteConfig } from '@/config/site'

// ...
export default function Navbar() {
  const [categories, setCategories] = useState<Category[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('pl_categories').select('*').order('name').limit(8)
      if (data) setCategories(data)
    }
    fetchCategories()

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <nav className="bg-surface/80 backdrop-blur-xl sticky top-0 z-50 border-b border-outline-variant/30">
      <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop py-4 max-w-container-max mx-auto">
        {/* Brand */}
        <Link href="/" className="font-display text-2xl font-bold text-primary tracking-tighter flex items-center gap-2 whitespace-nowrap">
          <span className="material-symbols-outlined text-primary text-3xl">celebration</span>
          {siteConfig.name}
        </Link>
        
        {/* Nav Links (Desktop) */}
        <div className="hidden md:flex items-center gap-6">
          {/* Menu 1: Festejos */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors duration-200 font-medium py-2">
              Festejos
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-[28rem] bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <div className="flex">
                <div className="w-1/2 py-2">
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/cumpleanos">Cumpleaños</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/aniversarios">Aniversarios</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/graduaciones">Graduaciones</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/bautizos">Bautizos</Link>
                </div>
                <div className="w-1/2 relative bg-surface-container">
                  <img src="/images/menu/festejos.png" alt="Festejos" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-bold">Arreglos Festivos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu 2: Temporadas */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors duration-200 font-medium py-2">
              Temporadas
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-[28rem] bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <div className="flex">
                <div className="w-1/2 py-2">
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/san-valentin">San Valentín</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/dia-madres">Día de las Madres</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/navidad">Navidad</Link>
                </div>
                <div className="w-1/2 relative bg-surface-container">
                  <img src="/images/menu/temporadas.png" alt="Temporadas" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-bold">Ediciones Especiales</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu 3: Sentimientos */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors duration-200 font-medium py-2">
              Sentimientos
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-[28rem] bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <div className="flex">
                <div className="w-1/2 py-2">
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/condolencias">Condolencias</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/recuperacion">Recuperación</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/agradecimiento">Agradecimiento</Link>
                </div>
                <div className="w-1/2 relative bg-surface-container">
                  <img src="/images/menu/sentimientos.png" alt="Sentimientos" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-bold">Expresa lo que Sientes</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu 4: Especiales */}
          <div className="relative group">
            <button className="flex items-center gap-1 text-on-surface-variant hover:text-primary transition-colors duration-200 font-medium py-2">
              Especiales
              <span className="material-symbols-outlined text-sm">expand_more</span>
            </button>
            <div className="absolute top-full left-0 mt-1 w-[28rem] bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
              <div className="flex">
                <div className="w-1/2 py-2">
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/recien-nacidos">Recién Nacidos</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/peluches-gigantes">Peluches Gigantes</Link>
                  <Link className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors" href="/categoria/personalizados">Personalizados</Link>
                </div>
                <div className="w-1/2 relative bg-surface-container">
                  <img src="/images/menu/especiales.png" alt="Especiales" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent flex items-end p-3">
                    <span className="text-white text-xs font-bold">Regalos Únicos</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button aria-label="Search" className="hover:bg-primary/10 rounded-full transition-all duration-300 p-2.5 bouncy-hover hover:scale-110">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>search</span>
          </button>
          <CartIcon />
          
          {user ? (
            <div className="relative group">
              <button className="hover:bg-primary/10 rounded-full transition-all duration-300 p-2.5 bouncy-hover hover:scale-110 hidden sm:block">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>account_circle</span>
              </button>
              <div className="absolute top-full right-0 mt-1 w-48 bg-surface-container-lowest rounded-lg shadow-lg border border-outline-variant/30 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 overflow-hidden">
                <div className="px-4 py-2 text-sm text-on-surface-variant border-b border-outline-variant/30 truncate">
                  {user.email}
                </div>
                
                {/* Menú para Administrador */}
                {user.user_metadata?.role === 'admin' && (
                  <Link href="/admin/inventario" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      Inventario
                    </div>
                  </Link>
                )}

                {/* Menú para Gestor */}
                {user.user_metadata?.role === 'gestor' && (
                  <Link href="/admin/inventario" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">inventory_2</span>
                      Gestionar Catálogo
                    </div>
                  </Link>
                )}

                {/* Link para Pedidos (Visible para admin y gestor) */}
                {(user.user_metadata?.role === 'admin' || user.user_metadata?.role === 'gestor') && (
                  <Link href="/admin/pedidos" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">local_shipping</span>
                      Gestionar Pedidos
                    </div>
                  </Link>
                )}

                {/* Link para Direcciones (Visible para todos los logueados) */}
                <Link href="/perfil/direcciones" className="block px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">location_on</span>
                    Mis Direcciones
                  </div>
                </Link>
                
                <button 
                  onClick={async () => {
                    const cartItems = useCartStore.getState().items
                    // Guardar el carrito en la metadata del usuario antes de borrarlo localmente
                    if (cartItems.length > 0) {
                      await supabase.auth.updateUser({ data: { cart_items: cartItems } })
                    }
                    
                    useCartStore.getState().clearCart() // Limpiar el carrito al cerrar sesión
                    await supabase.auth.signOut()
                    window.location.href = '/'
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors border-t border-outline-variant/30"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Cerrar Sesión
                  </div>
                </button>
              </div>
            </div>
          ) : (
            <Link href="/login" aria-label="account_circle" className="hover:bg-primary/10 rounded-full transition-all duration-300 p-2.5 bouncy-hover hover:scale-110 hidden sm:block">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>account_circle</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
