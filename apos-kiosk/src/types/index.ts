export interface Product {
  id: string
  name: string
  brand: string
  barcode: string
  price: number
  stock: number
  category: string
  image_url?: string
  active: boolean
  created_at: string
}

export interface MysteryBoxTier {
  id: string
  name: 'Standard' | 'Premium' | 'Premium+'
  description: string       // nur für Admin sichtbar
  price_1: number
  price_3: number
  price_5: number
  price_10: number
  active: boolean
}

export type MysteryBoxSize = 1 | 3 | 5 | 10

export interface CartItem {
  type: 'product'
  product: Product
  quantity: number
}

export interface CartMysteryItem {
  type: 'mystery'
  tier: MysteryBoxTier
  size: MysteryBoxSize
  quantity: number
}

export type AnyCartItem = CartItem | CartMysteryItem

export interface Order {
  id: string
  customer_name: string
  items: OrderItem[]
  total: number
  pickup_time: string
  status: 'pending' | 'ready' | 'done'
  created_at: string
  note?: string
}

export interface OrderItem {
  type: 'product' | 'mystery'
  name: string
  quantity: number
  unit_price: number
  // mystery only
  tier_name?: string
  size?: number
}
