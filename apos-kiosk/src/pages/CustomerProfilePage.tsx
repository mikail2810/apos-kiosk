import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Gift, History, ArrowLeft } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { LoyaltyCard, Reward } from '../types'
import StampCard from '../components/customer/StampCard'

export default function CustomerProfilePage() {
  const navigate = useNavigate()
  const { user, signOut, loading } = useAuth()
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [dataLoading, setDataLoading] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (!user) return
    const fetchData = async () => {
      const [{ data: cards }, { data: rewardData }] = await Promise.all([
        supabase.from('loyalty_cards').select('*').eq('customer_id', user.id).order('cycle', { ascending: false }).limit(1),
        supabase.from('rewards').select('*').eq('customer_id', user.id).eq('status', 'pending'),
      ])
      setLoyaltyCard(cards?.[0] ?? null)
      setRewards(rewardData ?? [])
      setDataLoading(false)
    }
    fetchData()
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading || !user) return null

  return (
    <div className="min-h-dvh bg-brand-bg">
      <header className="sticky top-0 z-10 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/')} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="font-display font-bold text-lg text-brand-text">Mein Profil</h1>
          </div>
          <button onClick={handleSignOut} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* User info */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="card">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
              <span className="text-xl font-bold text-brand-accent">
                {user.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div>
              <p className="font-semibold text-brand-text">{user.email}</p>
              <p className="text-xs text-brand-text-muted">Kiosk-Konto</p>
            </div>
          </div>
        </motion.div>

        {/* Stamp card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          {dataLoading ? (
            <div className="skeleton h-36 rounded-2xl" />
          ) : (
            <StampCard
              stampCount={loyaltyCard?.stamp_count ?? 0}
              cycleNumber={loyaltyCard?.cycle ?? 1}
            />
          )}
        </motion.div>

        {/* Pending rewards */}
        {rewards.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
            <h3 className="font-semibold text-brand-text mb-3 flex items-center gap-2">
              <Gift className="w-4 h-4 text-brand-accent" /> Belohnungen
            </h3>
            <div className="space-y-2">
              {rewards.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-brand-surface-2 border border-brand-accent/20">
                  <div>
                    <p className="text-xs text-brand-text-muted">Einloesecode</p>
                    <p className="font-mono font-bold text-brand-accent tracking-widest text-lg">{r.claim_code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-text-muted">Laeuft ab</p>
                    <p className="text-xs text-brand-text">
                      {new Date(r.expires_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Navigation */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Link to="/profil/bestellungen" className="card flex items-center gap-3 hover:bg-brand-surface-2 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-brand-surface-2 flex items-center justify-center">
              <History className="w-5 h-5 text-brand-text-muted" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-brand-text">Bestellverlauf</p>
              <p className="text-xs text-brand-text-muted">Alle deine Bestellungen</p>
            </div>
            <span className="text-brand-text-muted text-lg">›</span>
          </Link>
        </motion.div>
      </main>
    </div>
  )
}
