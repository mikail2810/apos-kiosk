import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { ShoppingCart, X, Trash2, Minus, Plus, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CartDrawer() {
  const { isOpen, closeCart, items, removeItem, updateQuantity, total, count } = useCart()
  const navigate = useNavigate()

  const checkout = () => {
    closeCart()
    navigate('/checkout')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-brand-surface border-t border-brand-border rounded-t-3xl max-h-[85dvh] flex flex-col"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-brand-border-2 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-brand-accent" />
                <h2 className="font-display font-bold text-brand-text">Warenkorb</h2>
                {count() > 0 && (
                  <span className="w-5 h-5 bg-brand-accent rounded-full text-xs font-bold text-white flex items-center justify-center">
                    {count()}
                  </span>
                )}
              </div>
              <button onClick={closeCart} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <ShoppingCart className="w-10 h-10 text-brand-text-faint mx-auto mb-3" />
                  <p className="text-brand-text-muted">Warenkorb ist leer</p>
                </div>
              ) : (
                <AnimatePresence>
                  {items.map((item, i) => {
                    const name = item.type === 'product'
                      ? item.product.name
                      : `Mystery Box ${item.tier.name} (×${item.size})`
                    const price = item.type === 'product'
                      ? item.product.price
                      : item.tier[`price_${item.size}` as keyof typeof item.tier] as number

                    return (
                      <motion.div
                        key={i}
                        layout
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="card flex items-center gap-3"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-brand-text text-sm truncate">{name}</p>
                          <p className="text-xs text-brand-accent">{(price * item.quantity).toFixed(2)} €</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => updateQuantity(i, item.quantity - 1)}
                            className="w-8 h-8 rounded-lg bg-brand-surface-2 hover:bg-brand-muted flex items-center justify-center text-brand-text-muted"
                          >
                            {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-red-400" /> : <Minus className="w-3.5 h-3.5" />}
                          </button>
                          <span className="w-5 text-center text-sm font-semibold text-brand-text">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(i, item.quantity + 1)}
                            className="w-8 h-8 rounded-lg bg-brand-surface-2 hover:bg-brand-muted flex items-center justify-center text-brand-text-muted"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-4 py-4 border-t border-brand-border">
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-brand-text-muted">Gesamt</span>
                  <span className="font-bold text-brand-accent text-lg">{total().toFixed(2)} €</span>
                </div>
                <button onClick={checkout} className="btn-primary w-full flex items-center justify-center gap-2">
                  Zur Kasse <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
