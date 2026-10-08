import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useCart } from '../lib/cart'
import type { OrderItem } from '../types'

type Step = 'form' | 'confirm' | 'success'

export function CheckoutPage() {
  const navigate = useNavigate()
  const { items, total, clear } = useCart()
  const [step, setStep] = useState<Step>('form')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [pickupTime, setPickupTime] = useState('')
  const [loading, setLoading] = useState(false)

  const handleOrder = async () => {
    setLoading(true)

    // Abholzeit = jetzt + 30 Min
    const pickup = new Date(Date.now() + 30 * 60 * 1000)
    const pickupStr = pickup.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })

    const orderItems: OrderItem[] = items.map(item => {
      if (item.type === 'product') {
        return {
          type: 'product',
          name: item.product.name,
          quantity: item.quantity,
          unit_price: item.product.price
        }
      } else {
        const price = item.tier[`price_${item.size}` as keyof typeof item.tier] as number
        return {
          type: 'mystery',
          name: `${item.tier.name} Mystery Box`,
          quantity: item.quantity,
          unit_price: price,
          tier_name: item.tier.name,
          size: item.size
        }
      }
    })

    await supabase.from('orders').insert({
      customer_name: name,
      items: orderItems,
      total: total(),
      pickup_time: pickupStr,
      status: 'pending',
      note: note || null
    })

    setPickupTime(pickupStr)
    setLoading(false)
    setStep('success')
    clear()
  }

  return (
    <div className="min-h-screen bg-brand-bg px-5 py-6 max-w-lg mx-auto">
      {step !== 'success' && (
        <button onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-brand-text-muted mb-6">
          <ArrowLeft size={18} /> Zurück
        </button>
      )}

      <AnimatePresence mode="wait">
        {step === 'form' && (
          <motion.div key="form"
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            className="flex flex-col gap-5"
          >
            <h1 className="font-display font-bold text-2xl">Bestellung</h1>

            {/* Bestellübersicht */}
            <div className="card flex flex-col gap-2">
              {items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span>
                    {item.type === 'product'
                      ? `${item.quantity}x ${item.product.name}`
                      : `${item.tier.name} Box (${item.size} Stk)`}
                  </span>
                  <span className="text-brand-accent font-semibold">
                    {item.type === 'product'
                      ? (item.product.price * item.quantity).toFixed(2)
                      : (item.tier[`price_${item.size}` as keyof typeof item.tier] as number).toFixed(2)
                    } €
                  </span>
                </div>
              ))}
              <div className="border-t border-brand-border pt-2 flex justify-between font-bold">
                <span>Gesamt</span>
                <span className="text-brand-accent">{total().toFixed(2)} €</span>
              </div>
            </div>

            {/* Name */}
            <div>
              <label className="text-sm text-brand-text-muted block mb-1.5">
                Dein Name (für die Abholung)
              </label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="z.B. Mehmet"
                className="w-full bg-brand-surface border border-brand-border rounded-xl
                           px-4 py-3 text-brand-text placeholder:text-brand-text-muted
                           outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            {/* Anmerkung */}
            <div>
              <label className="text-sm text-brand-text-muted block mb-1.5">
                Anmerkung (optional)
              </label>
              <input
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="z.B. bitte kalt"
                className="w-full bg-brand-surface border border-brand-border rounded-xl
                           px-4 py-3 text-brand-text placeholder:text-brand-text-muted
                           outline-none focus:border-brand-accent transition-colors"
              />
            </div>

            <p className="text-sm text-brand-text-muted text-center">
              Bezahlung erfolgt bar bei Abholung.
            </p>

            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={!name.trim()}
              onClick={handleOrder}
              className="btn-primary w-full disabled:opacity-40 disabled:pointer-events-none"
            >
              {loading ? 'Wird gesendet...' : 'Jetzt bestellen'}
            </motion.button>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div key="success"
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center gap-5 pt-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
              <CheckCircle2 size={72} className="text-brand-accent" />
            </motion.div>

            <div>
              <h1 className="font-display font-bold text-2xl mb-2">Bestellung eingegangen!</h1>
              <p className="text-brand-text-muted">
                Komm um ca. <span className="text-brand-text font-semibold">{pickupTime} Uhr</span> vorbei.
              </p>
              <p className="text-brand-text-muted text-sm mt-1">Bezahlung bar vor Ort.</p>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/')}
              className="btn-primary mt-4"
            >
              Zurück zum Shop
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
