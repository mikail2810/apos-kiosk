import { motion } from 'framer-motion'
import { Product } from '../../types'
import { Zap, ImageOff } from 'lucide-react'
import { useState } from 'react'

interface Props {
  products: Product[]
}

export default function FeaturedBanner({ products }: Props) {
  const now = new Date()
  const featured = products.find(p => p.featured_until && new Date(p.featured_until) > now)
  const [imgError, setImgError] = useState(false)

  if (!featured) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 rounded-2xl border border-brand-accent/30 bg-gradient-to-r from-brand-accent/10 to-brand-accent/5 overflow-hidden"
    >
      <div className="flex items-center gap-4 p-4">
        <div className="w-16 h-16 rounded-xl bg-brand-surface-2 flex-shrink-0 overflow-hidden flex items-center justify-center">
          {featured.image_url && !imgError ? (
            <img
              src={featured.image_url}
              alt={featured.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageOff className="w-6 h-6 text-brand-text-faint" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex items-center gap-1 text-xs font-bold text-brand-accent bg-brand-accent/10 border border-brand-accent/20 px-2 py-0.5 rounded-full">
              <Zap className="w-3 h-3" /> TAGESANGEBOT
            </span>
          </div>
          <p className="font-semibold text-brand-text truncate">{featured.name}</p>
          <p className="text-xs text-brand-text-muted">{featured.brand}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-xl font-display font-bold text-brand-accent">{featured.price.toFixed(2)} €</p>
        </div>
      </div>
    </motion.div>
  )
}
