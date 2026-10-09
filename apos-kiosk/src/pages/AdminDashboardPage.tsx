import { useEffect, useState, useCallback, useMemo } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Order } from '../types'
import { Package, CheckCircle, Clock, LogOut, ShoppingBag, ChevronDown, ChevronUp, ReceiptText, TrendingUp } from 'lucide-react'

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
  const [pickupInput, setPickupInput] = useState(order.pickup_time ?? '')
  const [savingPickup, setSavingPickup] = useState(false)

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

  const savePickup = async () => {
    if (!pickupInput.trim()) return
    setSavingPickup(true)
    await supabase.from('orders').update({ pickup_time: pickupInput.trim() }).eq('id', order.id)
    setSavingPickup(false)
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
          {order.pickup_time && (
            <p className="text-xs text-brand-accent mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Abholung: {order.pickup_time}
            </p>
          )}
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
            <div className="pt-3 mt-3 border-t border-brand-border space-y-2">
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
                <p className="text-xs text-brand-text-faint pt-2 border-t border-brand-border">Notiz: {order.note}</p>
              )}
              {/* Manual pickup time */}
              <div className="pt-2 border-t border-brand-border">
                <label className="text-xs text-brand-text-muted block mb-1.5">
                  <Clock className="w-3 h-3 inline mr-1" />Abholzeit eingeben (z.B. "90 min" oder "14:30")
                </label>
                <div className="flex gap-2">
                  <input
                    className="input-field flex-1 py-2 text-sm"
                    placeholder="z. B. 90 min oder 14:30"
                    value={pickupInput}
                    onChange={e => setPickupInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') savePickup() }}
                  />
                  <button
                    onClick={savePickup}
                    disabled={savingPickup || !pickupInput.trim()}
                    className="btn-primary py-2 px-3 text-sm"
                  >
                    {savingPickup ? '…' : '✓'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── 7-Day Revenue Chart ────────────────────────────────────────

function RevenueChart({ orders }: { orders: Order[] }) {
  const days = useMemo(() => {
    const result: { label: string; date: string; revenue: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateStr = d.toLocaleDateString('de-DE')
      const label = d.toLocaleDateString('de-DE', { weekday: 'short' })
      const revenue = orders
        .filter(o => o.status === 'done' && new Date(o.created_at).toLocaleDateString('de-DE') === dateStr)
        .reduce((s, o) => s + o.total, 0)
      result.push({ label, date: dateStr, revenue })
    }
    return result
  }, [orders])

  const maxRevenue = Math.max(...days.map(d => d.revenue), 1)

  return (
    <div className="card mb-4">
      <h3 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-brand-accent" /> Umsatz letzte 7 Tage
      </h3>
      <div className="flex items-end gap-2 h-28">
        {days.map((day, i) => {
          const heightPct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(heightPct, 2)}%` }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="w-full rounded-t-lg bg-brand-accent/70 relative group cursor-default"
                style={{ minHeight: 4 }}
              >
                {day.revenue > 0 && (
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-brand-surface-2 border border-brand-border rounded-lg px-2 py-1 text-xs text-brand-text whitespace-nowrap z-10">
                    {day.revenue.toFixed(2)} €
                  </div>
                )}
              </motion.div>
              <span className="text-[10px] text-brand-text-muted">{day.label}</span>
            </div>
          )
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-brand-text-muted">
        <span>Gesamt: <span className="text-brand-success font-semibold">{days.reduce((s, d) => s + d.revenue, 0).toFixed(2)} €</span></span>
        <span>Abgeholt</span>
      </div>
    </div>
  )
}

// ── Kassenabschluss ────────────────────────────────────────────

function Kassenabschluss({ orders }: { orders: Order[] }) {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)

  const dayOrders = orders.filter(o =>
    new Date(o.created_at).toLocaleDateString('de-DE') === new Date(selectedDate + 'T12:00:00').toLocaleDateString('de-DE')
  )
  const doneOrders = dayOrders.filter(o => o.status === 'done')
  const totalRevenue = doneOrders.reduce((s, o) => s + o.total, 0)
  const pendingRevenue = dayOrders.filter(o => o.status !== 'done').reduce((s, o) => s + o.total, 0)

  // Per-product breakdown
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {}
  doneOrders.forEach(o => {
    o.items.forEach(item => {
      const key = item.name + (item.tier_name ? ` (${item.tier_name})` : '')
      if (!itemMap[key]) itemMap[key] = { name: key, qty: 0, revenue: 0 }
      itemMap[key].qty += item.quantity
      itemMap[key].revenue += item.unit_price * item.quantity
    })
  })
  const breakdown = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue)

  const fmtDate = (d: string) => {
    const [y, m, dd] = d.split('-')
    return `${dd}.${m}.${y}`
  }

  return (
    <div className="space-y-4">
      {/* 7-day revenue chart */}
      <RevenueChart orders={orders} />

      {/* Date picker */}
      <div className="flex items-center gap-3 mb-2">
        <span className="text-sm text-brand-text-muted">Datum:</span>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="input-field py-1.5 text-sm w-auto"
        />
      </div>

      {/* Summary boxes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-3">
          <p className="text-xs text-brand-text-muted mb-1">Bestellungen</p>
          <p className="text-2xl font-display font-bold text-brand-accent">{dayOrders.length}</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xs text-brand-text-muted mb-1">Einnahmen</p>
          <p className="text-2xl font-display font-bold text-brand-success">{totalRevenue.toFixed(2)} €</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xs text-brand-text-muted mb-1">Ausstehend</p>
          <p className="text-2xl font-display font-bold text-brand-warning">{pendingRevenue.toFixed(2)} €</p>
        </div>
      </div>

      {/* Breakdown table */}
      {breakdown.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
            <ReceiptText className="w-4 h-4 text-brand-accent" />
            Tagesbericht — {fmtDate(selectedDate)}
          </h3>
          <div className="space-y-2">
            {breakdown.map((item, i) => (
              <div key={i} className="flex justify-between items-center text-sm py-1.5 border-b border-brand-border/50 last:border-0">
                <div>
                  <span className="text-brand-text">{item.name}</span>
                  <span className="text-brand-text-faint text-xs ml-2">× {item.qty}</span>
                </div>
                <span className="text-brand-accent font-semibold">{item.revenue.toFixed(2)} €</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 font-bold text-brand-text border-t border-brand-border">
              <span>Gesamt (abgeholt)</span>
              <span className="text-brand-success">{totalRevenue.toFixed(2)} €</span>
            </div>
          </div>
        </div>
      )}

      {dayOrders.length === 0 && (
        <div className="text-center py-12">
          <ReceiptText className="w-10 h-10 text-brand-text-faint mx-auto mb-3" />
          <p className="text-brand-text-muted">Keine Bestellungen an diesem Tag</p>
        </div>
      )}

      {/* All day orders list */}
      {dayOrders.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-brand-text mb-3 text-sm">Alle Bestellungen</h3>
          <div className="space-y-2">
            {dayOrders.map(o => (
              <div key={o.id} className="flex justify-between items-center text-sm py-1.5 border-b border-brand-border/50 last:border-0">
                <div>
                  <span className="text-brand-text">{o.customer_name}</span>
                  <span className="text-brand-text-faint text-xs ml-2">
                    {new Date(o.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {o.pickup_time && (
                    <span className="text-brand-accent text-xs ml-2">⏱ {o.pickup_time}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`badge border text-xs ${statusColor(o.status)}`}>{statusLabel(o.status)}</span>
                  <span className="text-brand-text font-medium">{o.total.toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main Dashboard ─────────────────────────────────────────────

type DashTab = 'bestellungen' | 'kasse'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'active' | 'all'>('active')
  const [dashTab, setDashTab] = useState<DashTab>('bestellungen')

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

  const activeCount = orders.filter(o => o.status !== 'done').length

  return (
    <div className="min-h-dvh bg-brand-bg">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display font-bold text-lg text-brand-text">Dashboard</h1>
            <p className="text-xs text-brand-text-muted">{activeCount} aktiv{activeCount !== 1 ? 'e' : 'e'}</p>
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

      {/* Sub-tabs */}
      <div className="max-w-2xl mx-auto px-4 pt-3">
        <div className="flex gap-1 bg-brand-surface rounded-xl p-1 border border-brand-border mb-4">
          <button
            onClick={() => setDashTab('bestellungen')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              dashTab === 'bestellungen'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Bestellungen
            {activeCount > 0 && (
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${dashTab === 'bestellungen' ? 'bg-white/20' : 'bg-brand-accent/20 text-brand-accent'}`}>
                {activeCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setDashTab('kasse')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              dashTab === 'kasse'
                ? 'bg-brand-accent text-white'
                : 'text-brand-text-muted hover:text-brand-text'
            }`}
          >
            <ReceiptText className="w-4 h-4" /> Kassenabschluss
          </button>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4 pb-8">
        {dashTab === 'bestellungen' ? (
          <>
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
          </>
        ) : (
          <Kassenabschluss orders={orders} />
        )}
      </main>
    </div>
  )
}
