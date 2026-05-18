'use client'

import { useState } from 'react'
import { Product } from '@/types/database'
import { useCartStore } from '@/store/useCartStore'

interface ProductOptionsProps {
  product: Product
}

export default function ProductOptions({ product }: ProductOptionsProps) {
  const [size, setSize] = useState('Mediano (50cm)')
  const [message, setMessage] = useState('')
  const [date, setDate] = useState('')
  const [adding, setAdding] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const handleAdd = () => {
    setAdding(true)
    addItem(product, 1, message, size, date)
    setTimeout(() => setAdding(false), 1000)
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Size Selector */}
      <div>
        <h3 className="font-label text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">straighten</span>
          Tamaño
        </h3>
        <div className="flex flex-wrap gap-3">
          {['Pequeño (30cm)', 'Mediano (50cm)', 'Gigante (100cm)'].map((s, idx) => (
            <label key={idx} className="cursor-pointer">
              <input 
                className="peer sr-only" 
                name="size" 
                type="radio" 
                value={s} 
                checked={size === s}
                onChange={() => setSize(s)}
              />
              <div className="px-6 py-3 rounded-full border-2 border-outline-variant text-on-surface-variant font-label peer-checked:border-primary peer-checked:bg-primary-container/20 peer-checked:text-primary transition-all hover:bg-surface-container-high text-center">
                {s}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Custom Card Editor */}
      <div className="bg-surface-container-lowest custom-shadow-tier-1 rounded-xl p-6 border border-outline-variant/30">
        <h3 className="font-display text-xl text-on-surface mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>note_alt</span>
          Tarjeta Personalizada
        </h3>
        <div className="relative">
          <textarea 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-surface-container-low border-2 border-transparent focus:border-tertiary focus:ring-0 rounded-lg p-4 text-body placeholder:text-outline-variant outline-none transition-all duration-300 resize-none" 
            placeholder="Escribe tu mensaje lleno de alegría aquí..." 
            rows={3}
            maxLength={150}
          ></textarea>
          <span className="absolute bottom-4 right-4 text-xs text-outline-variant">{message.length}/150</span>
        </div>
      </div>

      {/* Delivery Calendar */}
      <div>
        <h3 className="font-label text-on-surface mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-primary">calendar_month</span>
          Fecha de Entrega
        </h3>
        <div className="relative">
          <input 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-surface-container-low border-2 border-transparent focus:border-primary focus:ring-0 rounded-full py-3 px-6 text-body text-on-surface outline-none transition-all duration-300 cursor-pointer" 
            type="date"
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-4">
        <button 
          onClick={handleAdd}
          disabled={adding}
          className="flex-1 bg-primary text-on-primary font-display text-lg py-4 px-8 rounded-full hover-lift flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-70"
        >
          <span className="material-symbols-outlined">
            {adding ? 'check_circle' : 'shopping_bag'}
          </span>
          {adding ? '¡Añadido al carrito!' : 'Añadir al Carrito'}
        </button>
        <button className="w-full sm:w-auto bg-transparent border-2 border-secondary text-secondary font-display text-lg py-4 px-8 rounded-full hover:bg-secondary/10 transition-colors flex items-center justify-center gap-2">
          <span className="material-symbols-outlined">favorite</span>
        </button>
      </div>
    </div>
  )
}
