import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Order } from '../types'
import { CheckCircle, Clock, Package, ArrowLeft } from 'lucide-react'

function ConfettiPiece({ delay }: { delay: number }) {
  const colors = ['#FF6B2B', '#4ADE80', '#FBBF24', '#60A5FA', '#F472B6']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const left = Math.random() * 100
  const rotation = Math.random() * 720 - 360
  return (
    <motion.div
      initial={{ y: -20, x: `${left}vw`, opacity: 1, rotate: 0, scale: 1 }}
      animate={{ y: '100vh', opacity: 0, rotate: rotation, scale: 0.5 }}
      transition={{ duration: 2.5 + Math.random(), delay, ease: 'easeIn' }}
      className="fixed top-0 w-3 h-3 rounded-sm pointer-events-none z-50"
      style={{ backgroundColor: color }}
    />
  )
}

const STEPS = [
  { key: 'pending', label: 'Bestellung eingegangen', icon: Package },
  { key: 'ready',   label: 'Bereit zur Abholung', icon: Clock },
  { key: 'done',    label: 'Abgeholt', icon: CheckCircle },
] as const

type OrderStatus = Order['status']

function stepIndex(status: OrderStatus) {
  if (status === 'pending') return 0
  if (status === 'ready') return 1
  return 2
}

export default function OrderStatusPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(false)
  const [prevStatus, setPrevStatus] = useState<OrderStatus | null>(null)

  useEffect(() => {
    if (!orderId) return
    supabase.from('orders').select('*').eq('id', orderId).single().then(({ data }) => {
      if (data) { setOrder(data as Order); setPrevStatus(data.status) }
      setLoading(false)
    })
    const channel = supabase.channel(`order-${orderId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        ({ new: updated }) => {
          const newOrder = updated as Order
          setOrder(prev => {
            if (prev?.status !== 'ready' && newOrder.status === 'ready') {
              setShowConfetti(true)
              setTimeout(() => setShowConfetti(false), 3000)
            }
            return newOrder
          })
          setPrevStatus(newOrder.status)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [orderId])

  if (loading) return (
    <div className="min-h-dvh bg-brand-bg flex items-center justify-center">
      <div className="skeleton w-48 h-6 rounded-xl" />
    </div>
  )

  if (!order) return (
    <div className="min-h-dvh bg-brand-bg flex flex-col items-center justify-center gap-4 p-6">
      <p className="text-brand-text-muted">Bestellung nicht gefunden.</p>
      <button onClick={() => navigate('/')} className="btn-primary">Zum Shop</button>
    </div>
  )

  const currentStep = stepIndex(order.status)

  return (
    <div className="min-h-dvh bg-brand-bg">
      {showConfetti && Array.from({ length: 30 }).map((_, i) => <ConfettiPiece key={i} delay={i * 0.05} />)}

      <header className="sticky top-0 z-10 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-display font-bold text-lg text-brand-text">Bestellstatus</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-8">
        <AnimatePresence>
          {order.status === 'ready' && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="mb-6 p-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 text-center">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="text-3xl mb-2">
                🎉
              </motion.div>
              <p className="font-display font-bold text-brand-accent text-lg">Deine Bestellung ist bereit!</p>
              <p className="text-brand-text-muted text-sm mt-1">Komm zur Abholung</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="card mb-6">
          <p className="text-xs text-brand-text-muted mb-1">Bestellt von</p>
          <p className="font-semibold text-brand-text">{order.customer_name}</p>
          <p className="text-xs text-brand-text-muted mt-1">{new Date(order.created_at).toLocaleString('de-DE')}</p>
          {order.pickup_time && (
            <p className="text-xs text-brand-accent mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Abholung: {order.pickup_time}
            </p>
          )}
        </div>

        <div className="card mb-6">
          <div className="space-y-4">
            {STEPS.map((step, i) => {
              const done = i <= currentStep
              const active = i === currentStep
              const Icon = step.icon
              return (
                <div key={step.key} className="flex items-center gap-4">
                  <div className="relative flex flex-col items-center">
                    <motion.div
                      animate={done ? { backgroundColor: '#FF6B2B', borderColor: '#FF6B2B' } : {}}
                      className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${done ? 'bg-brand-accent border-brand-accent' : 'bg-brand-surface-2 border-brand-border'}`}
                    >
                      {active && order.status !== 'done' ? (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                          <Icon className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : (
                        <Icon className={`w-5 h-5 ${done ? 'text-white' : 'text-brand-text-faint'}`} />
                      )}
                    </motion.div>
                    {i < STEPS.length - 1 && (
                      <div className={`w-0.5 h-4 mt-1 transition-colors ${done && i < currentStep ? 'bg-brand-accent' : 'bg-brand-border'}`} />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <p className={`font-medium text-sm ${done ? 'text-brand-text' : 'text-brand-text-muted'}`}>{step.label}</p>
                    {active && prevStatus === step.key && <p className="text-xs text-brand-accent mt-0.5">Aktueller Status</p>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-brand-text mb-3 text-sm">Deine Artikel</h3>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-brand-text-muted">{item.quantity}x {item.name}</span>
                <span className="text-brand-text">{(item.unit_price * item.quantity).toFixed(2)} €</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-brand-text pt-2 mt-2 border-t border-brand-border">
              <span>Gesamt</span>
              <span className="text-brand-accent">{order.total.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
