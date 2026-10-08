import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import type { Product } from '../../types'
import { useCart } from '../../lib/cart'

interface Props {
  product: Product
  index: number
}

export function ProductCard({ product, index }: Props) {
  const addProduct = useCart(s => s.addProduct)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="card flex flex-col gap-3"
    >
      {/* Produktbild */}
      <div className="w-full h-32 rounded-xl bg-brand-border overflow-hidden">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name}
               className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center
                          text-brand-muted text-4xl font-display">
            {product.name[0]}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1">
        <p className="text-xs text-brand-text-muted mb-0.5">{product.brand}</p>
        <p className="font-semibold text-sm leading-snug">{product.name}</p>
      </div>

      {/* Preis + Button */}
      <div className="flex items-center justify-between">
        <span className="font-display text-brand-accent font-bold text-lg">
          {product.price.toFixed(2)} €
        </span>
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => addProduct(product)}
          className="w-9 h-9 rounded-xl bg-brand-accent flex items-center justify-center"
        >
          <Plus size={18} className="text-white" />
        </motion.button>
      </div>
    </motion.div>
  )
}
