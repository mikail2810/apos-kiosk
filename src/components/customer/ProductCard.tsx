import { motion } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'
import { Product } from '../../types'
import { ImageOff, Plus, Heart, Zap } from 'lucide-react'
import { useState, useEffect } from 'react'

interface Props { product: Product; index: number }

export default function ProductCard({ product, index }: Props) {
  const { addProduct } = useCart()
  const { user } = useAuth()
  const [imgError, setImgError] = useState(false)
  const [added, setAdded] = useState(false)
  const [favorited, setFavorited] = useState(false)
  const [favLoading, setFavLoading] = useState(false)

  const isFeatured = !!(product.featured_until && new Date(product.featured_until) > new Date())
  const outOfStock = product.stock === 0

  useEffect(() => {
    if (!user) return
    supabase
      .from('favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle()
      .then(({ data }) => setFavorited(!!data))
  }, [user, product.id])

  const handleAdd = () => {
    if (outOfStock) return
    addProduct(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 600)
  }

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user || favLoading) return
    setFavLoading(true)
    if (favorited) {
      await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', product.id)
      setFavorited(false)
    } else {
      await supabase.from('favorites').insert({ user_id: user.id, product_id: product.id })
      setFavorited(true)
    }
    setFavLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className={`card-hover flex flex-col overflow-hidden p-0 ${outOfStock ? 'opacity-60' : ''}`}
    >
      {/* Image */}
      <div className="relative h-40 bg-brand-surface-2 flex items-center justify-center overflow-hidden rounded-t-2xl">
        {product.image_url && !imgError ? (
          <img
            src={product.image_url}
            alt={product.name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff className="w-8 h-8 text-brand-text-faint" />
        )}

        {/* Featured badge */}
        {isFeatured && (
          <div className="absolute top-2 left-2 flex items-center gap-0.5 bg-brand-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            <Zap className="w-3 h-3" /> TAGESANGEBOT
          </div>
        )}

        {/* Out of stock overlay */}
        {outOfStock && (
          <div className="absolute inset-0 bg-brand-bg/60 flex items-center justify-center">
            <span className="bg-brand-bg/90 border border-brand-border text-brand-text-muted text-xs font-semibold px-3 py-1 rounded-full">
              Ausverkauft
            </span>
          </div>
        )}

        {/* Price badge */}
        <div className="absolute bottom-2 right-2 bg-brand-bg/90 backdrop-blur-sm border border-brand-border px-2 py-0.5 rounded-lg text-sm font-bold text-brand-accent">
          {product.price.toFixed(2)} €
        </div>

        {/* Favorite button */}
        {user && (
          <button
            onClick={toggleFavorite}
            disabled={favLoading}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-brand-bg/80 backdrop-blur-sm border border-brand-border hover:bg-brand-surface-2 transition-colors"
          >
            <Heart
              className={`w-3.5 h-3.5 transition-colors ${favorited ? 'text-red-400 fill-red-400' : 'text-brand-text-faint'}`}
            />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-brand-text-faint mb-0.5">{product.brand}</p>
        <p className="font-medium text-brand-text text-sm leading-tight flex-1">{product.name}</p>
        <motion.button
          whileTap={outOfStock ? {} : { scale: 0.92 }}
          onClick={handleAdd}
          disabled={outOfStock}
          animate={{ backgroundColor: outOfStock ? '#1E2E1E' : added ? '#4ADE80' : '#FF6B2B' }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-sm font-semibold transition-colors disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          {outOfStock ? 'Nicht verfuegbar' : added ? 'Hinzugefuegt!' : 'In den Warenkorb'}
        </motion.button>
      </div>
    </motion.div>
  )
}
