import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Order } from '../types'
import { ArrowLeft, ShoppingBag, ChevronRight } from 'lucide-react'

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

export default function OrderHistoryPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) navigate('/login')
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) return
    supabase
      .from('orders')
      .select('*')
      .eq('customer_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as Order[])
        setDataLoading(false)
      })
  }, [user])

  if (loading || !user) return null

  return (
    <div className="min-h-dvh bg-brand-bg">
      <header className="sticky top-0 z-10 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <Link to="/profil" className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="font-display font-bold text-lg text-brand-text">Bestellverlauf</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {dataLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="skeleton h-20 rounded-2xl" />)}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-12 h-12 text-brand-text-faint mx-auto mb-3" />
            <p className="text-brand-text-muted">Noch keine Bestellungen</p>
            <button onClick={() => navigate('/')} className="btn-primary mt-4">Zum Shop</button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order, i) => {
              const itemsSummary = order.items
                .slice(0, 2)
                .map(item => `${item.quantity}x ${item.name}`)
                .join(', ')
              const moreItems = order.items.length > 2 ? ` +${order.items.length - 2} mehr` : ''

              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => navigate(`/status/${order.id}`)}
                  className="card cursor-pointer hover:bg-brand-surface-2 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`badge border text-xs ${statusColor(order.status)}`}>
                          {statusLabel(order.status)}
                        </span>
                        <span className="text-xs text-brand-text-muted">
                          {new Date(order.created_at).toLocaleDateString('de-DE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-brand-text-muted truncate">
                        {itemsSummary}{moreItems}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="font-semibold text-brand-accent">{order.total.toFixed(2)} €</span>
                      <ChevronRight className="w-4 h-4 text-brand-text-faint" />
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
