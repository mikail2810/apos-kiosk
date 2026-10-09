import { create } from 'zustand'
import { AnyCartItem, CartItem, CartMysteryItem, MysteryBoxSize, MysteryBoxTier, Product } from '../types'

interface CartStore {
  items: AnyCartItem[]
  isOpen: boolean
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  addProduct: (product: Product) => void
  addMystery: (tier: MysteryBoxTier, size: MysteryBoxSize) => void
  removeItem: (index: number) => void
  updateQuantity: (index: number, qty: number) => void
  clear: () => void
  total: () => number
  count: () => number
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  isOpen: false,

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  toggleCart: () => set(s => ({ isOpen: !s.isOpen })),

  addProduct: (product) => {
    const items = get().items
    const idx = items.findIndex(i => i.type === 'product' && i.product.id === product.id)
    if (idx >= 0) {
      const updated = [...items]
      ;(updated[idx] as CartItem).quantity += 1
      set({ items: updated })
    } else {
      set({ items: [...items, { type: 'product', product, quantity: 1 }] })
    }
  },

  addMystery: (tier, size) => {
    const items = get().items
    const idx = items.findIndex(i => i.type === 'mystery' && i.tier.id === tier.id && i.size === size)
    if (idx >= 0) {
      const updated = [...items]
      ;(updated[idx] as CartMysteryItem).quantity += 1
      set({ items: updated })
    } else {
      set({ items: [...items, { type: 'mystery', tier, size, quantity: 1 }] })
    }
  },

  removeItem: (index) => {
    const items = get().items.filter((_, i) => i !== index)
    set({ items })
  },

  updateQuantity: (index, qty) => {
    if (qty <= 0) { get().removeItem(index); return }
    const items = [...get().items]
    items[index] = { ...items[index], quantity: qty }
    set({ items })
  },

  clear: () => set({ items: [] }),

  total: () => get().items.reduce((acc, item) => {
    if (item.type === 'product') return acc + item.product.price * item.quantity
    return acc + item.tier.price_per_item * item.size * item.quantity
  }, 0),

  count: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
}))
