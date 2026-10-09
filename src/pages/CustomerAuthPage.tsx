import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, ArrowLeft, ShoppingBag } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function CustomerAuthPage() {
  const navigate = useNavigate()
  const { signIn, verifyOtp, user } = useAuth()
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [resendTimer, setResendTimer] = useState(0)

  useEffect(() => { if (user) navigate('/profil') }, [user, navigate])

  useEffect(() => {
    if (resendTimer <= 0) return
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const handleSendOtp = async () => {
    if (!email.trim()) return
    setLoading(true); setError(null)
    const { error: err } = await signIn(email.trim())
    setLoading(false)
    if (err) { setError(err); return }
    setStep('otp'); setResendTimer(30)
  }

  const handleVerify = async () => {
    if (otp.length !== 6) return
    setLoading(true); setError(null)
    const { error: err } = await verifyOtp(email.trim(), otp.trim())
    setLoading(false)
    if (err) { setError('Falscher Code. Bitte erneut versuchen.'); return }
    navigate('/profil')
  }

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center p-6">
      <button onClick={() => navigate('/')} className="absolute top-4 left-4 p-2 rounded-xl text-brand-text-muted hover:bg-brand-surface-2">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-brand-accent" />
          </div>
        </div>
        <h1 className="text-2xl font-bold font-display text-center text-brand-text mb-1">Apo's Kiosk</h1>

        <AnimatePresence mode="wait">
          {step === 'email' ? (
            <motion.div key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="mt-8 space-y-4">
              <p className="text-brand-text-muted text-center text-sm">Mit E-Mail einloggen oder registrieren</p>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-faint" />
                <input
                  className="input-field pl-10"
                  type="email"
                  placeholder="deine@email.de"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  autoFocus
                />
              </div>
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button onClick={handleSendOtp} disabled={loading || !email.trim()} className="btn-primary w-full">
                {loading ? 'Sende Code...' : 'Code senden'}
              </button>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="mt-8 space-y-4">
              <p className="text-brand-text-muted text-center text-sm">Code wurde an <span className="text-brand-text">{email}</span> gesendet</p>
              <input
                className="input-field text-center text-2xl tracking-widest"
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleVerify()}
                autoFocus
              />
              {error && <p className="text-red-400 text-sm text-center">{error}</p>}
              <button onClick={handleVerify} disabled={loading || otp.length !== 6} className="btn-primary w-full">
                {loading ? 'Pruefe...' : 'Bestaetigen'}
              </button>
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-brand-text-muted text-sm">Erneut senden in {resendTimer}s</p>
                ) : (
                  <button onClick={() => { setOtp(''); setStep('email') }} className="text-brand-accent text-sm hover:underline">
                    Andere E-Mail / erneut senden
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
