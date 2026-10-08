import { motion } from 'framer-motion'

interface BadgeProps { count: number }

export function Badge({ count }: BadgeProps) {
  if (count === 0) return null
  return (
    <motion.span
      key={count}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
      className="absolute -top-1.5 -right-1.5 bg-brand-accent text-white
                 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center"
    >
      {count > 9 ? '9+' : count}
    </motion.span>
  )
}
