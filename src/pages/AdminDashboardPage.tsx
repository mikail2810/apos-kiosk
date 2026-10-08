import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Order } from '../types'
import { Package, CheckCircle, Clock, LogOut, ShoppingBag, ChevronDown, ChevronUp } from 'lucide-react'

function statusColor(s: Order['status']) {
  if (s === 'pending') return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20'
  if (s === 'ready')   return 'text-brand-accent bg-brand-accent/10 border-brand-accent/20'
  return 'text-brand-success bg-brand-success/10 border-brand-success/20'
}

function statusLabel(s: Order['status']) {
  if (s === 'pending') return 'Ausstehend'
  if (s === 'ready')   return 'Bereit'
  return 'Abgeholt'
}

function OrderCard({ order, onUpdate }: { order: Order; onUpdate: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [updating, setUpdating] = useState(false)

  const nextStatus: Record<Order['status'], Order['status'] | null> = {
    pending: 'ready',
    ready: 'done',
    done: null,
  }

  const advance = async () => {
    const next = nextStatus[order.status]
    if (!next) return
    setUpdating(true)
    await supabase.from('orders').update({ status: next }).eq('id', order.id)
    setUpdating(false)
    onUpdate()
  }

  return (
    <motion.div layout className="card mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-brand-text">{order.customer_name}</span>
            <span className={`badge border ${statusColor(order.status)}`}>{statusLabel(order.status)}</span>
          </div>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {new Date(order.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })} · {order.total.toFixed(2)} €
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nextStatus[order.status] && (
            <button
              onClick={advance}
              disabled={updating}
              className="btn-primary py-2 px-3 text-sm"
            >
              {order.status === 'pending' ? 'Bereit' : 'Fertig'}
            </button>
          )}
          <button onClick={() => setExpanded(e => !e)} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-brand-border space-y-1.5">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-brand-text-muted">
                    {item.quantity}× {item.name}
                    {item.tier_name && <span className="text-brand-text-faint"> ({item.tier_name} ×{item.size})</span>}
                  </span>
                  <span className="text-brand-text">{(item.unit_price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              {order.note && (
                <p className="text-xs text-brand-text-faint mt-2 pt-2 border-t border-brand-border">Notiz: {order.note}</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')

  const loadOrders = useCallback(() => {
    supabase.from('orders').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false) })
  }, [])

  useEffect(() => {
    if (!sessionStorage.getItem('admin')) { navigate('/admin'); return }
    loadOrders()
    const channel = supabase.channel('orders-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [navigate, loadOrders])

  const logout = () => { sessionStorage.removeItem('admin'); navigate('/admin') }

  const displayed = filter === 'active'
    ? orders.filter(o => o.status !== 'done')
    : orders

  return (
    <div className="min-h-dvh bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-lg text-brand-text">Dashboard</h1>
            <p className="text-xs text-brand-text-muted">{displayed.length} Bestellung{displayed.length !== 1 ? 'en' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/products" className="btn-secondary py-2 px-3 text-sm flex items-center gap-1.5">
              <Package className="w-4 h-4" /> Produkte
            </Link>
            <button onClick={logout} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Filter */}
        <div className="flex gap-2 mb-4">
          {(['active', 'all'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-brand-accent text-white'
                  : 'bg-brand-surface border border-brand-border text-brand-text-muted hover:text-brand-text'
              }`}
            >
              {f === 'active' ? 'Aktiv' : 'Alle'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-brand-text-faint mx-auto mb-3" />
            <p className="text-brand-text-muted">Keine Bestellungen</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {displayed.map(order => (
              <OrderCard key={order.id} order={order} onUpdate={loadOrders} />
            ))}
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}
