import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Lock } from 'lucide-react'

const ADMIN_PIN = import.meta.env.VITE_ADMIN_PIN ?? '1234'

export function AdminLoginPage() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()

  const check = () => {
    if (pin === ADMIN_PIN) {
      sessionStorage.setItem('admin', '1')
      navigate('/admin/dashboard')
    } else {
      setError(true)
      setPin('')
      setTimeout(() => setError(false), 1500)
    }
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col gap-6"
      >
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-brand-surface border border-brand-border
                          flex items-center justify-center mx-auto mb-4">
            <Lock size={28} className="text-brand-accent" />
          </div>
          <h1 className="font-display font-bold text-2xl">Admin</h1>
          <p className="text-brand-text-muted text-sm mt-1">PIN eingeben</p>
        </div>

        <motion.input
          animate={error ? { x: [-8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.3 }}
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => setPin(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && check()}
          placeholder="••••"
          className={`w-full text-center text-2xl tracking-widest
                      bg-brand-surface border rounded-2xl px-4 py-4
                      outline-none transition-colors
                      ${error ? 'border-red-500' : 'border-brand-border focus:border-brand-accent'}`}
        />

        {error && (
          <p className="text-red-400 text-sm text-center -mt-2">Falscher PIN</p>
        )}

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={check}
          className="btn-primary w-full"
        >
          Einloggen
        </motion.button>
      </motion.div>
    </div>
  )
}
