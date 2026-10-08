import { create } from 'zustand'
import type { AnyCartItem, MysteryBoxTier, MysteryBoxSize, Product } from '../types'

interface CartStore {
  items: AnyCartItem[]
  addProduct: (product: Product) => void
  addMystery: (tier: MysteryBoxTier, size: MysteryBoxSize) => void
  remove: (index: number) => void
  clear: () => void
  total: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],

  addProduct: (product) => set(s => {
    const existing = s.items.findIndex(
      i => i.type === 'product' && i.product.id === product.id
    )
    if (existing >= 0) {
      const updated = [...s.items]
      const item = updated[existing] as { type: 'product'; product: Product; quantity: number }
      updated[existing] = { ...item, quantity: item.quantity + 1 }
      return { items: updated }
    }
    return { items: [...s.items, { type: 'product', product, quantity: 1 }] }
  }),

  addMystery: (tier, size) => set(s => ({
    items: [...s.items, { type: 'mystery', tier, size, quantity: 1 }]
  })),

  remove: (index) => set(s => ({
    items: s.items.filter((_, i) => i !== index)
  })),

  clear: () => set({ items: [] }),

  total: () => get().items.reduce((sum, item) => {
    if (item.type === 'product') return sum + item.product.price * item.quantity
    const key = `price_${item.size}` as keyof typeof item.tier
    return sum + (item.tier[key] as number) * item.quantity
  }, 0)
}))
