import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, ShoppingBag } from 'lucide-react'
import { useCart } from '../../lib/cart'
import { useNavigate } from 'react-router-dom'

interface Props {
  open: boolean
  onClose: () => void
}

export function CartDrawer({ open, onClose }: Props) {
  const { items, remove, total } = useCart()
  const navigate = useNavigate()

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
          />

          {/* Drawer */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.35 }}
            className="fixed bottom-0 inset-x-0 z-50 bg-brand-surface
                       rounded-t-3xl max-h-[80vh] flex flex-col"
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-brand-border rounded-full mx-auto mt-3 mb-1" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <ShoppingBag size={20} className="text-brand-accent" />
                <span className="font-display font-bold text-lg">Warenkorb</span>
              </div>
              <button onClick={onClose} className="p-1 text-brand-text-muted">
                <X size={20} />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
              {items.length === 0 && (
                <p className="text-center text-brand-text-muted py-10">
                  Noch nichts drin.
                </p>
              )}
              {items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center justify-between gap-3
                             bg-brand-bg rounded-xl px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    {item.type === 'product' ? (
                      <>
                        <p className="font-semibold text-sm truncate">{item.product.name}</p>
                        <p className="text-xs text-brand-text-muted">{item.quantity}x · {(item.product.price * item.quantity).toFixed(2)} €</p>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-sm">{item.tier.name} Mystery Box</p>
                        <p className="text-xs text-brand-text-muted">{item.size} Produkte · {(item.tier[`price_${item.size}` as keyof typeof item.tier] as number).toFixed(2)} €</p>
                      </>
                    )}
                  </div>
                  <button onClick={() => remove(i)} className="text-brand-text-muted p-1">
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 pb-8 pt-4 border-t border-brand-border flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-brand-text-muted">Gesamt</span>
                  <span className="font-display font-bold text-brand-accent text-xl">
                    {total().toFixed(2)} €
                  </span>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { onClose(); navigate('/checkout') }}
                  className="btn-primary w-full text-center"
                >
                  Weiter zur Bestellung
                </motion.button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
