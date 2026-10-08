import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Product, MysteryBoxTier } from '../types'
import { useCart } from '../hooks/useCart'
import ProductCard from '../components/customer/ProductCard'
import MysteryBoxCard from '../components/customer/MysteryBoxCard'
import CartDrawer from '../components/customer/CartDrawer'
import { ShoppingCart, Search, Settings } from 'lucide-react'

const TABS = ['Produkte', 'Mystery Box'] as const
type Tab = typeof TABS[number]

export default function ShopPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('Produkte')
  const [products, setProducts] = useState<Product[]>([])
  const [tiers, setTiers] = useState<MysteryBoxTier[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const { count, openCart } = useCart()

  useEffect(() => {
    Promise.all([
      supabase.from('products').select('*').eq('active', true).order('name'),
      supabase.from('mystery_box_tiers').select('*').eq('active', true),
    ]).then(([{ data: p }, { data: t }]) => {
      setProducts(p ?? [])
      setTiers(t ?? [])
      setLoading(false)
    })
  }, [])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.brand.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-dvh bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-xl text-brand-text">Apo's Kiosk</h1>
            <p className="text-xs text-brand-text-muted">Schule Kiosk</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/admin')} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-faint">
              <Settings className="w-4 h-4" />
            </button>
            <button onClick={openCart} className="relative p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text">
              <ShoppingCart className="w-5 h-5" />
              {count() > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-brand-accent rounded-full text-xs font-bold text-white flex items-center justify-center"
                >
                  {count()}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-3xl mx-auto px-4 pb-3 flex gap-1">
          {TABS.map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                tab === t ? 'text-brand-accent' : 'text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {t}
              {tab === t && (
                <motion.div layoutId="tab-indicator" className="absolute inset-0 bg-brand-accent/10 rounded-xl border border-brand-accent/20" />
              )}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-4">
        {/* Search */}
        {tab === 'Produkte' && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-faint" />
            <input
              className="input-field pl-9"
              placeholder="Suchen..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            {tab === 'Produkte' ? (
              loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="skeleton h-48 rounded-2xl" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-brand-text-muted py-16">Keine Produkte gefunden</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filtered.map((p, i) => (
                    <ProductCard key={p.id} product={p} index={i} />
                  ))}
                </div>
              )
            ) : (
              loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className="skeleton h-48 rounded-2xl" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {tiers.map(tier => (
                    <MysteryBoxCard key={tier.id} tier={tier} />
                  ))}
                </div>
              )
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <CartDrawer />
    </div>
  )
}
