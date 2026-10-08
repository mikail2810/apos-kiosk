import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { Order } from '../types'
import { CheckCheck, Clock, Package, Scan, LogOut } from 'lucide-react'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [tab, setTab] = useState<'orders' | 'products'>('orders')

  // Auth guard
  useEffect(() => {
    if (!sessionStorage.getItem('admin')) navigate('/admin')
  }, [navigate])

  // Realtime Bestellungen
  useEffect(() => {
    supabase.from('orders')
      .select('*')
      .neq('status', 'done')
      .order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data ?? []))

    const channel = supabase
      .channel('orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        supabase.from('orders').select('*').neq('status', 'done')
          .order('created_at', { ascending: false })
          .then(({ data }) => setOrders(data ?? []))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  const markReady = async (id: string) => {
    await supabase.from('orders').update({ status: 'ready' }).eq('id', id)
  }

  const markDone = async (id: string) => {
    await supabase.from('orders').update({ status: 'done' }).eq('id', id)
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="sticky top-0 z-30 bg-brand-bg/90 backdrop-blur-sm
                         border-b border-brand-border px-5 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <p className="font-display font-bold text-xl">Admin</p>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/admin/products')}
              className="p-2 text-brand-text-muted"
            >
              <Scan size={22} />
            </button>
            <button
              onClick={() => { sessionStorage.removeItem('admin'); navigate('/admin') }}
              className="p-2 text-brand-text-muted"
            >
              <LogOut size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="px-5 py-4 max-w-lg mx-auto flex flex-col gap-4">
        <h2 className="font-display font-bold text-lg">
          Aktuelle Bestellungen
          <span className="ml-2 text-sm font-normal text-brand-text-muted">
            ({orders.length} offen)
          </span>
        </h2>

        {orders.length === 0 && (
          <p className="text-brand-text-muted text-center py-16">Keine offenen Bestellungen.</p>
        )}

        {orders.map((order, i) => (
          <motion.div
            key={order.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card flex flex-col gap-3"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{order.customer_name}</p>
                <p className="text-xs text-brand-text-muted flex items-center gap-1">
                  <Clock size={12} />
                  Abholung: {order.pickup_time} Uhr
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-lg font-semibold
                ${order.status === 'pending' ? 'bg-brand-border text-brand-text-muted' : 'bg-green-900/40 text-green-400'}`}>
                {order.status === 'pending' ? 'Neu' : 'Bereit'}
              </span>
            </div>

            {/* Items */}
            <div className="flex flex-col gap-1 border-t border-brand-border pt-3">
              {order.items.map((item, j) => (
                <div key={j} className="flex justify-between text-sm">
                  <span className="text-brand-text-muted">{item.quantity}x {item.name}</span>
                  <span>{(item.unit_price * item.quantity).toFixed(2)} €</span>
                </div>
              ))}
              <div className="flex justify-between font-bold pt-1 border-t border-brand-border mt-1">
                <span>Gesamt (bar)</span>
                <span className="text-brand-accent">{order.total.toFixed(2)} €</span>
              </div>
            </div>

            {order.note && (
              <p className="text-xs bg-brand-bg rounded-lg px-3 py-2 text-brand-text-muted">
                Hinweis: {order.note}
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {order.status === 'pending' && (
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => markReady(order.id)}
                  className="flex-1 flex items-center justify-center gap-2
                             bg-brand-surface border border-brand-border
                             text-sm font-semibold py-2.5 rounded-xl"
                >
                  <Package size={16} /> Bereit
                </motion.button>
              )}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => markDone(order.id)}
                className="flex-1 flex items-center justify-center gap-2
                           bg-brand-accent text-white text-sm font-semibold
                           py-2.5 rounded-xl"
              >
                <CheckCheck size={16} /> Abgeholt
              </motion.button>
            </div>
          </motion.div>
        ))}
      </main>
    </div>
  )
}
