import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Delete, ShieldCheck } from 'lucide-react'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? '1234'

const KEYS = ['1','2','3','4','5','6','7','8','9','','0','⌫']

export default function AdminLoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const handleKey = (k: string) => {
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return }
    if (k === '') return
    const next = pin + k
    if (next.length > 4) return
    setPin(next)
    if (next.length === 4) {
      if (next === ADMIN_PIN) {
        sessionStorage.setItem('admin', '1')
        navigate('/admin/dashboard')
      } else {
        setError(true)
        setTimeout(() => { setPin(''); setError(false) }, 700)
      }
    }
  }

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xs"
      >
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-brand-accent" />
          </div>
        </div>

        <h1 className="text-2xl font-bold font-display text-center text-brand-text mb-1">Admin-Zugang</h1>
        <p className="text-sm text-brand-text-muted text-center mb-8">PIN eingeben</p>

        {/* PIN dots */}
        <motion.div
          animate={error ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.3 }}
          className="flex justify-center gap-4 mb-8"
        >
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={i}
              animate={{
                backgroundColor: error
                  ? '#EF4444'
                  : i < pin.length
                  ? '#FF6B2B'
                  : '#1E2E1E',
                scale: i < pin.length ? 1.1 : 1,
              }}
              transition={{ duration: 0.15 }}
              className="w-4 h-4 rounded-full"
            />
          ))}
        </motion.div>

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((k, i) => (
            <motion.button
              key={i}
              whileTap={k ? { scale: 0.92 } : {}}
              onClick={() => handleKey(k)}
              disabled={!k && k !== '0'}
              className={`h-16 rounded-2xl text-xl font-semibold transition-colors duration-100 select-none
                ${k === '' ? 'invisible' : ''}
                ${k === '⌫'
                  ? 'bg-brand-surface-2 border border-brand-border text-brand-text-muted hover:bg-brand-muted hover:text-brand-text'
                  : 'bg-brand-surface border border-brand-border text-brand-text hover:bg-brand-surface-2 active:bg-brand-muted'}
              `}
            >
              {k === '⌫' ? <Delete className="w-5 h-5 mx-auto" /> : k}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center text-red-400 text-sm mt-4"
            >
              Falscher PIN
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
