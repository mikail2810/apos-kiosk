import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import type { MysteryBoxTier, MysteryBoxSize } from '../../types'
import { useCart } from '../../lib/cart'

const SIZES: MysteryBoxSize[] = [1, 3, 5, 10]

const TIER_STYLES = {
  Standard:   { bg: 'bg-brand-surface',  ring: 'ring-brand-muted',   label: 'text-brand-text-muted' },
  Premium:    { bg: 'bg-[#1E2A3A]',      ring: 'ring-[#4A7CB5]',     label: 'text-[#7BB8E8]' },
  'Premium+': { bg: 'bg-[#2A1E1A]',      ring: 'ring-[#C4923A]',     label: 'text-[#F0C060]' },
}

interface Props {
  tier: MysteryBoxTier
  index: number
}

export function MysteryBoxCard({ tier, index }: Props) {
  const [selectedSize, setSelectedSize] = useState<MysteryBoxSize>(3)
  const addMystery = useCart(s => s.addMystery)
  const style = TIER_STYLES[tier.name]

  const price = tier[`price_${selectedSize}` as keyof typeof tier] as number

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className={`${style.bg} ring-1 ${style.ring} rounded-2xl p-4 flex flex-col gap-4`}
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-brand-border flex items-center justify-center">
          <Sparkles size={18} className={style.label} />
        </div>
        <div>
          <p className={`font-display font-bold text-base ${style.label}`}>{tier.name}</p>
          <p className="text-xs text-brand-text-muted">Mystery Box</p>
        </div>
      </div>

      {/* Größen-Auswahl */}
      <div>
        <p className="text-xs text-brand-text-muted mb-2">Anzahl Produkte</p>
        <div className="flex gap-2">
          {SIZES.map(s => (
            <motion.button
              key={s}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedSize(s)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors
                ${selectedSize === s
                  ? 'bg-brand-accent text-white'
                  : 'bg-brand-border text-brand-text-muted'}`}
            >
              {s}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Preis + CTA */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-brand-text-muted">Preis</p>
          <p className="font-display font-bold text-brand-accent text-xl">
            {price.toFixed(2)} €
          </p>
        </div>
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={() => addMystery(tier, selectedSize)}
          className="btn-primary text-sm"
        >
          In den Warenkorb
        </motion.button>
      </div>
    </motion.div>
  )
}
