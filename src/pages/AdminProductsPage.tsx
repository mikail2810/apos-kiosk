import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { Product } from '../types'
import { Plus, ArrowLeft, Barcode, Package, Trash2, Eye, EyeOff } from 'lucide-react'

const EMPTY = { name: '', brand: '', barcode: '', price: '', stock: '', category: '', image_url: '' }

export default function AdminProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!sessionStorage.getItem('admin')) { navigate('/admin'); return }
    loadProducts()
  }, [navigate])

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  const save = async () => {
    if (!form.name || !form.price) return
    setSaving(true)
    await supabase.from('products').insert({
      name: form.name,
      brand: form.brand,
      barcode: form.barcode,
      price: parseFloat(form.price),
      stock: parseInt(form.stock) || 0,
      category: form.category || 'Sonstiges',
      image_url: form.image_url || null,
      active: true,
    })
    setForm(EMPTY)
    setShowForm(false)
    setSaving(false)
    await loadProducts()
  }

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    await loadProducts()
  }

  const deleteProduct = async (id: string) => {
    await supabase.from('products').delete().eq('id', id)
    await loadProducts()
  }

  return (
    <div className="min-h-dvh bg-brand-bg">
      <header className="sticky top-0 z-10 bg-brand-bg/90 backdrop-blur-md border-b border-brand-border px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin/dashboard" className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-display font-bold text-lg text-brand-text">Produkte</h1>
          </div>
          <button onClick={() => setShowForm(s => !s)} className="btn-primary py-2 px-4 text-sm flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> Neu
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4">
        {/* Add Form */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mb-4"
            >
              <div className="card space-y-3">
                <h2 className="font-semibold text-brand-text flex items-center gap-2">
                  <Barcode className="w-4 h-4 text-brand-accent" /> Produkt hinzufügen
                </h2>
                <div className="grid grid-cols-2 gap-3">
                  <input className="input-field col-span-2" placeholder="Name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                  <input className="input-field" placeholder="Marke" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
                  <input className="input-field" placeholder="Barcode" value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} />
                  <input className="input-field" type="number" step="0.01" placeholder="Preis € *" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                  <input className="input-field" type="number" placeholder="Bestand" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
                  <input className="input-field" placeholder="Kategorie" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} />
                  <input className="input-field" placeholder="Bild-URL" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={save} disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Speichern...' : 'Speichern'}
                  </button>
                  <button onClick={() => { setShowForm(false); setForm(EMPTY) }} className="btn-secondary px-4">
                    Abbrechen
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Product List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-brand-text-faint mx-auto mb-3" />
            <p className="text-brand-text-muted">Noch keine Produkte</p>
          </div>
        ) : (
          <div className="space-y-2">
            {products.map(p => (
              <div key={p.id} className={`card flex items-center gap-3 ${!p.active ? 'opacity-50' : ''}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-text truncate">{p.name}</p>
                  <p className="text-xs text-brand-text-muted">{p.brand} · {p.price.toFixed(2)} € · Bestand: {p.stock}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => toggleActive(p)} className="p-2 rounded-xl hover:bg-brand-surface-2 text-brand-text-muted">
                    {p.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button onClick={() => deleteProduct(p.id)} className="p-2 rounded-xl hover:bg-red-900/20 text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
