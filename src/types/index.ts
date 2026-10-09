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
  featured_until?: string | null
  low_stock_threshold?: number
}

export interface MysteryBoxTier {
  id: string
  name: 'Standard' | 'Premium' | 'Premium+'
  description: string
  category: 'suessware' | 'tee'
  price_per_item: number
  max_quantity: number
  active: boolean
}

export type MysteryBoxSize = 1 | 2 | 3 | 4 | 5

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
  pickup_time: string | null
  status: 'pending' | 'ready' | 'done'
  created_at: string
  note?: string
  customer_id?: string | null
}

export interface OrderItem {
  type: 'product' | 'mystery'
  name: string
  quantity: number
  unit_price: number
  tier_name?: string
  size?: number
}

export interface Customer {
  id: string
  email: string
  display_name?: string
  created_at: string
}

export interface LoyaltyCard {
  id: string
  customer_id: string
  stamp_count: number
  cycle: number
  created_at: string
  updated_at: string
}

export interface StampEvent {
  id: string
  customer_id: string
  order_id: string
  card_id: string
  reason: string
  created_at: string
}

export interface Reward {
  id: string
  customer_id: string
  card_id: string
  pool_item_id: string | null
  status: 'pending' | 'claimed' | 'expired'
  claim_code: string
  issued_at: string
  expires_at: string
}

export interface Favorite {
  id: string
  user_id: string
  product_id: string
  created_at: string
}
