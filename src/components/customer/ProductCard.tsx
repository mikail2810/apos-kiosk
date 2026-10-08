import { motion } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { Product } from '../../types'
import { ImageOff, Plus } from 'lucide-react'
import { useState } from 'react'

interface Props { product: Product; index: number }

export default function ProductCard({ product, index }: Props) {
  const { addProduct } = useCart()
  const [imgError, setImgError] = useState(false)
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    addProduct(product)
    setAdded(true)
    setTimeout(() => setAdded(false), 600)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      className="card-hover flex flex-col overflow-hidden p-0"
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
        {/* Price badge */}
        <div className="absolute bottom-2 right-2 bg-brand-bg/90 backdrop-blur-sm border border-brand-border px-2 py-0.5 rounded-lg text-sm font-bold text-brand-accent">
          {product.price.toFixed(2)} €
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col flex-1">
        <p className="text-xs text-brand-text-faint mb-0.5">{product.brand}</p>
        <p className="font-medium text-brand-text text-sm leading-tight flex-1">{product.name}</p>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleAdd}
          animate={{ backgroundColor: added ? '#4ADE80' : '#FF6B2B' }}
          className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-white text-sm font-semibold transition-colors"
        >
          <Plus className="w-4 h-4" />
          {added ? 'Hinzugefügt!' : 'In den Warenkorb'}
        </motion.button>
      </div>
    </motion.div>
  )
}
