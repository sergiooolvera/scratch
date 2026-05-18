'use client'

import { useState } from 'react'
import { useCartStore } from '@/store/useCartStore'
import { Product } from '@/types/database'

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [adding, setAdding] = useState(false)

  const handleAdd = () => {
    setAdding(true)
    addItem(product)
    setTimeout(() => setAdding(false), 1000)
  }

  return (
    <button 
      onClick={handleAdd}
      disabled={adding}
      className="flex-1 bg-primary text-on-primary font-display text-lg py-4 px-8 rounded-full hover-lift flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-70"
    >
      <span className="material-symbols-outlined">
        {adding ? 'check_circle' : 'shopping_bag'}
      </span>
      {adding ? '¡Añadido!' : 'Añadir al Carrito'}
    </button>
  )
}
