import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

interface Props {
  stampCount: number
  cycleNumber: number
}

export default function StampCard({ stampCount, cycleNumber }: Props) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-brand-text text-sm">Stempelkarte</h3>
        <span className="text-xs text-brand-text-muted">Runde {cycleNumber}</span>
      </div>
      <div className="grid grid-cols-5 gap-2 mb-3">
        {Array.from({ length: 10 }).map((_, i) => {
          const filled = i < stampCount
          return (
            <motion.div
              key={i}
              initial={false}
              animate={filled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
              transition={{ duration: 0.3, delay: filled ? i * 0.05 : 0 }}
              className={`aspect-square rounded-xl border-2 flex items-center justify-center transition-colors ${
                filled
                  ? 'bg-brand-accent/20 border-brand-accent'
                  : 'bg-brand-surface-2 border-brand-border'
              }`}
            >
              {filled ? (
                <Star className="w-4 h-4 text-brand-accent fill-brand-accent" />
              ) : (
                <div className="w-2 h-2 rounded-full bg-brand-border" />
              )}
            </motion.div>
          )
        })}
      </div>
      <p className="text-center text-xs text-brand-text-muted">
        <span className="text-brand-accent font-semibold">{stampCount}</span>/10 Stempel
        {stampCount >= 10 && (
          <span className="ml-2 text-brand-success font-semibold">Belohnung freigeschaltet!</span>
        )}
      </p>
    </div>
  )
}
