'use client'

import { useCartStore } from '@/store/useCartStore'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CartIcon() {
  const itemCount = useCartStore((state) => state.getItemCount())
  const [mounted, setMounted] = useState(false)

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return (
    <button className="hover:bg-primary/10 rounded-full transition-all duration-300 p-2.5 relative">
      <span className="material-symbols-outlined text-primary">shopping_cart</span>
    </button>
  )

  return (
    <Link href="/carrito" className="hover:bg-primary/10 rounded-full transition-all duration-300 p-2.5 bouncy-hover hover:scale-110 relative">
      <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 0" }}>shopping_cart</span>
      {itemCount > 0 && (
        <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-secondary text-white text-[10px] font-bold rounded-full border-2 border-surface flex items-center justify-center animate-in zoom-in duration-300">
          {itemCount}
        </span>
      )}
    </Link>
  )
}
