'use client'

import { useState, useEffect } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { supabase } from '@/lib/supabase'
import { Address } from '@/types/database'

export default function AddressManagement() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Partial<Address> | null>(null)

  useEffect(() => {
    fetchAddresses()
  }, [])

  const fetchAddresses = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase
        .from('pl_addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
      if (data) setAddresses(data)
    }
    setLoading(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta dirección?')) {
      await supabase.from('pl_addresses').delete().eq('id', id)
      fetchAddresses()
    }
  }

  const handleSetDefault = async (id: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Remove default from others
    await supabase
      .from('pl_addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
    
    // Set new default
    await supabase
      .from('pl_addresses')
      .update({ is_default: true })
      .eq('id', id)
    
    fetchAddresses()
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) return

    const addressData = {
      user_id: user.id,
      title: formData.get('title') as string,
      address_line1: formData.get('address_line1') as string,
      address_line2: formData.get('address_line2') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postal_code: formData.get('postal_code') as string,
      country: 'México',
      is_default: formData.get('is_default') === 'on'
    }

    if (editingAddress?.id) {
      await supabase.from('pl_addresses').update(addressData).eq('id', editingAddress.id)
    } else {
      if (addressData.is_default) {
        await supabase.from('pl_addresses').update({ is_default: false }).eq('user_id', user.id)
      }
      await supabase.from('pl_addresses').insert([addressData])
    }

    setShowModal(false)
    setEditingAddress(null)
    fetchAddresses()

    // Redirigir si hay un parámetro de redirect
    const searchParams = new URLSearchParams(window.location.search)
    const redirect = searchParams.get('redirect')
    if (redirect) {
      window.location.href = redirect
    }
  }

  return (
    <>
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-6 py-12 min-h-[70vh]">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-4xl font-black text-on-surface">Mis Direcciones</h1>
            <p className="text-on-surface-variant mt-2">Gestiona dónde quieres recibir tus peluches y sorpresas.</p>
          </div>
          <button 
            onClick={() => { setEditingAddress(null); setShowModal(true); }}
            className="flex items-center gap-2 bg-primary text-on-primary px-8 py-3 rounded-full font-bold custom-shadow-tier-1 hover:scale-105 transition-all"
          >
            <span className="material-symbols-outlined">add_location</span>
            Nueva Dirección
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2].map(i => <div key={i} className="h-48 bg-surface-container animate-pulse rounded-xl"></div>)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {addresses.map((addr) => (
              <div key={addr.id} className={`group bg-surface-container-lowest rounded-xl p-6 border-2 transition-all relative ${addr.is_default ? 'border-secondary shadow-lg' : 'border-outline-variant/30 hover:border-secondary/50'}`}>
                {addr.is_default && (
                  <div className="absolute -top-3 -right-3 bg-secondary text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    PREDETERMINADA
                  </div>
                )}
                
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${addr.is_default ? 'bg-secondary-container text-secondary' : 'bg-surface-container text-on-surface-variant'}`}>
                    <span className="material-symbols-outlined">
                      {addr.title.toLowerCase().includes('casa') ? 'home' : addr.title.toLowerCase().includes('oficina') ? 'work' : 'location_on'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-on-surface">{addr.title}</h3>
                    <p className="text-sm text-on-surface-variant leading-relaxed">
                      {addr.address_line1}<br />
                      {addr.address_line2 && <>{addr.address_line2}<br /></>}
                      {addr.city}, {addr.state}, {addr.postal_code}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-outline-variant/20 mt-auto">
                  <button 
                    onClick={() => { setEditingAddress(addr); setShowModal(true); }}
                    className="flex-1 py-2 text-sm font-bold text-tertiary hover:bg-tertiary/10 rounded-lg transition-colors"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDelete(addr.id)}
                    className="flex-1 py-2 text-sm font-bold text-error hover:bg-error/10 rounded-lg transition-colors"
                  >
                    Eliminar
                  </button>
                  {!addr.is_default && (
                    <button 
                      onClick={() => handleSetDefault(addr.id)}
                      className="p-2 text-on-surface-variant hover:text-secondary transition-colors"
                      title="Marcar como predeterminada"
                    >
                      <span className="material-symbols-outlined text-[20px]">star</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {addresses.length === 0 && !loading && (
              <div className="col-span-full py-20 text-center space-y-4">
                <span className="material-symbols-outlined text-7xl text-outline-variant">wrong_location</span>
                <p className="text-xl font-bold text-on-surface-variant">Aún no tienes direcciones guardadas.</p>
              </div>
            )}
          </div>
        )}

        {/* Modal Form */}
        {showModal && (
          <div className="fixed inset-0 z-[100] bg-on-surface/40 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-surface w-full max-w-xl rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-outline-variant/30 flex justify-between items-center">
                <h2 className="text-2xl font-black text-primary">{editingAddress ? 'Editar Dirección' : 'Nueva Dirección'}</h2>
                <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              
              <form onSubmit={handleSave} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant px-2">Título (Ej: Casa, Oficina)</label>
                    <input name="title" defaultValue={editingAddress?.title} required className="w-full px-6 py-3 rounded-full bg-surface-container-high border-none focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Mi hogar" />
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant px-2">Calle y Número</label>
                    <input name="address_line1" defaultValue={editingAddress?.address_line1} required className="w-full px-6 py-3 rounded-full bg-surface-container-high border-none focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Av. Reforma 123" />
                  </div>
                  <div className="col-span-full space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant px-2">Interior / Depto (Opcional)</label>
                    <input name="address_line2" defaultValue={editingAddress?.address_line2} className="w-full px-6 py-3 rounded-full bg-surface-container-high border-none focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="Depto 402" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant px-2">Ciudad</label>
                    <input name="city" defaultValue={editingAddress?.city} required className="w-full px-6 py-3 rounded-full bg-surface-container-high border-none focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="CDMX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant px-2">Estado</label>
                    <input name="state" defaultValue={editingAddress?.state} required className="w-full px-6 py-3 rounded-full bg-surface-container-high border-none focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="CDMX" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-on-surface-variant px-2">Código Postal</label>
                    <input name="postal_code" defaultValue={editingAddress?.postal_code} required className="w-full px-6 py-3 rounded-full bg-surface-container-high border-none focus:ring-2 focus:ring-primary outline-none transition-all" placeholder="06500" />
                  </div>
                  <div className="flex items-center gap-2 pt-8">
                    <input type="checkbox" name="is_default" defaultChecked={editingAddress?.is_default} className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary" />
                    <label className="text-sm font-bold text-on-surface-variant">Dirección predeterminada</label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4 rounded-full font-bold text-on-surface-variant hover:bg-surface-container transition-all">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-1 py-4 rounded-full bg-primary text-on-primary font-black text-lg custom-shadow-tier-1 bouncy-hover">
                    {editingAddress ? 'Actualizar' : 'Guardar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </>
  )
}
