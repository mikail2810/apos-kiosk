import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShoppingBag, Sparkles, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { ProductCard } from '../components/customer/ProductCard'
import { MysteryBoxCard } from '../components/customer/MysteryBoxCard'
import { CartDrawer } from '../components/customer/CartDrawer'
import { Badge } from '../components/ui/Badge'
import { useCart } from '../lib/cart'
import type { Product, MysteryBoxTier } from '../types'

type Tab = 'products' | 'mystery'

export function ShopPage() {
  const [tab, setTab] = useState<Tab>('products')
  const [products, setProducts] = useState<Product[]>([])
  const [tiers, setTiers] = useState<MysteryBoxTier[]>([])
  const [cartOpen, setCartOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const items = useCart(s => s.items)

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').eq('active', true).order('name'),
      supabase.from('mystery_box_tiers').select('*').eq('active', true)
    ]).then(([{ data: p }, { data: t }]) => {
      setProducts(p ?? [])
      setTiers(t ?? [])
      setLoading(false)
    })
  }, [])

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-sm
                         border-b border-brand-border px-5 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <p className="font-display font-bold text-xl">Apo's Kiosk</p>
            <p className="text-xs text-brand-text-muted">Bestell & hol ab</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setCartOpen(true)}
            className="relative p-2"
          >
            <ShoppingBag size={24} className="text-brand-text" />
            <Badge count={items.length} />
          </motion.button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="sticky top-[72px] z-20 bg-brand-bg px-5 pt-4 pb-2">
        <div className="flex gap-2 max-w-lg mx-auto">
          {[
            { id: 'products', label: 'Produkte', icon: Package },
            { id: 'mystery', label: 'Mystery Box', icon: Sparkles },
          ].map(({ id, label, icon: Icon }) => (
            <motion.button
              key={id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTab(id as Tab)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl
                          text-sm font-semibold transition-colors
                          ${tab === id
                            ? 'bg-brand-accent text-white'
                            : 'bg-brand-surface text-brand-text-muted'}`}
            >
              <Icon size={16} />
              {label}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Content */}
      <main className="px-5 py-4 max-w-lg mx-auto">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card h-52 animate-pulse bg-brand-surface" />
            ))}
          </div>
        ) : tab === 'products' ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {tiers.map((t, i) => (
              <MysteryBoxCard key={t.id} tier={t} index={i} />
            ))}
          </div>
        )}
      </main>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  )
}
