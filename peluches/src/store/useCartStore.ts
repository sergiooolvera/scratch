import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Product } from '@/types/database'

export interface CartItem extends Product {
  quantity: number;
  custom_message?: string;
  size?: string;
  delivery_date?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (product: Product, quantity?: number, message?: string, size?: string, date?: string) => void;
  removeItem: (productId: string, size?: string) => void;
  updateQuantity: (productId: string, size: string | undefined, quantity: number) => void;
  clearCart: () => void;
  setItems: (items: CartItem[]) => void;
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (product, quantity = 1, message = '', size = 'Mediano (50cm)', date = '') => {
        const currentItems = get().items
        // Check if same product and same size exists
        const existingItem = currentItems.find((item) => item.id === product.id && item.size === size)
        
        if (existingItem) {
          set({
            items: currentItems.map((item) =>
              item.id === product.id && item.size === size
                ? { ...item, quantity: item.quantity + quantity, custom_message: message || item.custom_message, delivery_date: date || item.delivery_date }
                : item
            ),
          })
        } else {
          set({ items: [...currentItems, { ...product, quantity, custom_message: message, size, delivery_date: date }] })
        }
      },
      
      removeItem: (productId, size) => {
        set({ items: get().items.filter((item) => !(item.id === productId && item.size === size)) })
      },
      
      updateQuantity: (productId, size, quantity) => {
        if (quantity <= 0) {
          get().removeItem(productId, size)
          return
        }
        set({
          items: get().items.map((item) =>
            item.id === productId && item.size === size ? { ...item, quantity } : item
          ),
        })
      },
      
      clearCart: () => set({ items: [] }),
      
      setItems: (items) => set({ items }),
      
      getTotal: () => {
        return get().items.reduce((total, item) => total + (Number(item.price) * item.quantity), 0)
      },
      
      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0)
      },
    }),
    {
      name: 'plushie-cart-storage',
    }
  )
)
