import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../../hooks/useCart'
import { MysteryBoxTier, MysteryBoxSize } from '../../types'
import { Gift, Plus, ChevronDown, ChevronUp } from 'lucide-react'

interface Props { tier: MysteryBoxTier }

const SIZES: MysteryBoxSize[] = [1, 3, 5, 10]

const TIER_STYLES: Record<string, { gradient: string; border: string; glow: string }> = {
  'Standard': {
    gradient: 'from-emerald-900/40 to-emerald-800/20',
    border: 'border-emerald-700/30',
    glow: 'text-emerald-400',
  },
  'Premium': {
    gradient: 'from-blue-900/40 to-blue-800/20',
    border: 'border-blue-700/30',
    glow: 'text-blue-400',
  },
  'Premium+': {
    gradient: 'from-amber-900/40 to-amber-800/20',
    border: 'border-amber-600/30',
    glow: 'text-amber-400',
  },
}

export default function MysteryBoxCard({ tier }: Props) {
  const { addMystery } = useCart()
  const [selectedSize, setSelectedSize] = useState<MysteryBoxSize>(1)
  const [expanded, setExpanded] = useState(false)
  const [added, setAdded] = useState(false)

  const style = TIER_STYLES[tier.name] ?? TIER_STYLES['Standard']
  const price = tier[`price_${selectedSize}` as keyof typeof tier] as number

  const handleAdd = () => {
    addMystery(tier, selectedSize)
    setAdded(true)
    setTimeout(() => setAdded(false), 700)
  }

  return (
    <motion.div
      layout
      className={`rounded-2xl border bg-gradient-to-br ${style.gradient} ${style.border} overflow-hidden`}
    >
      <div className="p-4">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl bg-brand-bg/50 flex items-center justify-center ${style.glow}`}>
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-brand-text">{tier.name}</h3>
              <p className={`text-xs font-semibold ${style.glow}`}>{price.toFixed(2)} €</p>
            </div>
          </div>
          <button onClick={() => setExpanded(e => !e)} className="p-1.5 rounded-lg hover:bg-brand-bg/30 text-brand-text-muted">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Size picker */}
        <div className="flex gap-2 mb-3">
          {SIZES.map(size => {
            const sizePrice = tier[`price_${size}` as keyof typeof tier] as number
            return (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                  selectedSize === size
                    ? 'bg-brand-bg/60 border border-brand-accent/50 text-brand-accent'
                    : 'bg-brand-bg/30 border border-brand-bg/20 text-brand-text-muted hover:text-brand-text'
                }`}
              >
                ×{size}
                <br />
                <span className="text-[10px] opacity-70">{sizePrice.toFixed(0)} €</span>
                {selectedSize === size && (
                  <motion.div layoutId={`sel-${tier.id}`} className="absolute inset-0 rounded-xl bg-brand-accent/10" />
                )}
              </button>
            )
          })}
        </div>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleAdd}
          animate={{ backgroundColor: added ? '#4ADE80' : 'rgba(255,107,43,1)' }}
          className="w-full py-2.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {added ? 'Hinzugefügt!' : `${selectedSize}× Mystery Box · ${price.toFixed(2)} €`}
        </motion.button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0 border-t border-brand-bg/30">
              <div className="mt-3 space-y-1.5">
                {SIZES.map(s => (
                  <div key={s} className="flex justify-between text-xs">
                    <span className="text-brand-text-muted">{s}× Box</span>
                    <span className={style.glow}>{(tier[`price_${s}` as keyof typeof tier] as number).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
