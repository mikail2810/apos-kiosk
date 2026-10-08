import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useCart } from '../hooks/useCart'
import { CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react'

type Step = 'form' | 'success'

export default function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clear } = useCart()
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)

  if (items.length === 0 && step === 'form') {
    navigate('/')
    return null
  }

  const pickupTime = new Date(Date.now() + 30 * 60 * 1000).toISOString()

  const orderItems = items.map(item => {
    if (item.type === 'product') return {
      type: 'product',
      name: item.product.name,
      quantity: item.quantity,
      unit_price: item.product.price,
    }
    return {
      type: 'mystery',
      name: `Mystery Box ${item.tier.name}`,
      quantity: item.quantity,
      unit_price: item.tier[`price_${item.size}` as keyof typeof item.tier] as number,
      tier_name: item.tier.name,
      size: item.size,
    }
  })

  const submit = async () => {
    if (!name.trim()) return
    setLoading(true)
    await supabase.from('orders').insert({
      customer_name: name.trim(),
      items: orderItems,
      total: total(),
      pickup_time: pickupTime,
      status: 'pending',
      note: note.trim() || null,
    })
    clear()
    setStep('success')
    setLoading(false)
  }

  return (
    <div className="min-h-dvh bg-brand-bg flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {step === 'form' && (
            <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h1 className="font-display font-bold text-lg text-brand-text">
            {step === 'form' ? 'Bestellen' : 'Bestätigung'}
          </h1>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6">
        <AnimatePresence mode="wait">
          {step === 'form' ? (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Summary */}
              <div className="card mb-4">
                <h2 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-brand-accent" /> Deine Bestellung
                </h2>
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-brand-text-muted">
                        {item.quantity}×{' '}
                        {item.type === 'product'
                          ? item.product.name
                          : `Mystery Box ${item.tier.name} (×${item.size})`}
                      </span>
                      <span className="text-brand-text">
                        {(item.type === 'product'
                          ? item.product.price * item.quantity
                          : (item.tier[`price_${item.size}` as keyof typeof item.tier] as number) * item.quantity
                        ).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-brand-text pt-3 mt-3 border-t border-brand-border">
                  <span>Gesamt</span>
                  <span className="text-brand-accent">{total().toFixed(2)} €</span>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-3">
                <input
                  className="input-field"
                  placeholder="Dein Name *"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <textarea
                  className="input-field resize-none"
                  placeholder="Anmerkung (optional)"
                  rows={3}
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
                <p className="text-xs text-brand-text-muted">
                  Abholzeit: ~{new Date(pickupTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
                </p>
                <button
                  onClick={submit}
                  disabled={!name.trim() || loading}
                  className="btn-primary w-full"
                >
                  {loading ? 'Bestellen...' : `Jetzt bestellen · ${total().toFixed(2)} €`}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                className="w-20 h-20 bg-brand-success/10 border border-brand-success/20 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-10 h-10 text-brand-success" />
              </motion.div>
              <h2 className="text-2xl font-display font-bold text-brand-text mb-2">Bestellung aufgegeben!</h2>
              <p className="text-brand-text-muted mb-8">
                Abholung um ~{new Date(pickupTime).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} Uhr
              </p>
              <button onClick={() => navigate('/')} className="btn-primary">
                Zurück zum Shop
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
