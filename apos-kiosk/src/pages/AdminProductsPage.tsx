import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { lookupBarcode } from '../lib/barcode'
import type { Product } from '../types'
import { ArrowLeft, ScanLine, Plus, Check, Loader2 } from 'lucide-react'

type ScanState = 'idle' | 'scanning' | 'found' | 'notfound'

export function AdminProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [scanState, setScanState] = useState<ScanState>('idle')
  const [scanResult, setScanResult] = useState<Partial<Product>>({})
  const [barcode, setBarcode] = useState('')
  const barcodeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!sessionStorage.getItem('admin')) navigate('/admin')
    loadProducts()
  }, [navigate])

  const loadProducts = () => {
    supabase.from('products').select('*').order('name').then(({ data }) => setProducts(data ?? []))
  }

  const handleBarcodeScan = async (code: string) => {
    if (!code.trim()) return
    setScanState('scanning')
    const result = await lookupBarcode(code)
    if (result) {
      setScanResult({ barcode: code, name: result.name, brand: result.brand, image_url: result.image_url, price: 0, stock: 0, active: true })
      setScanState('found')
    } else {
      setScanResult({ barcode: code, name: '', brand: '', price: 0, stock: 0, active: true })
      setScanState('notfound')
    }
  }

  const saveProduct = async () => {
    await supabase.from('products').upsert({
      ...scanResult,
      category: 'sonstiges'
    })
    setScanState('idle')
    setScanResult({})
    setBarcode('')
    loadProducts()
  }

  const toggleActive = async (p: Product) => {
    await supabase.from('products').update({ active: !p.active }).eq('id', p.id)
    loadProducts()
  }

  return (
    <div className="min-h-screen bg-brand-bg px-5 py-4 max-w-lg mx-auto">
      <button onClick={() => navigate('/admin/dashboard')}
              className="flex items-center gap-2 text-brand-text-muted mb-5">
        <ArrowLeft size={18} /> Bestellungen
      </button>

      <h1 className="font-display font-bold text-2xl mb-5">Produkte</h1>

      {/* Scan Bereich */}
      <div className="card flex flex-col gap-4 mb-6">
        <div className="flex items-center gap-2">
          <ScanLine size={20} className="text-brand-accent" />
          <span className="font-semibold">Barcode scannen</span>
        </div>

        <div className="flex gap-2">
          <input
            ref={barcodeRef}
            value={barcode}
            onChange={e => setBarcode(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBarcodeScan(barcode)}
            placeholder="Barcode (oder Scanner)"
            className="flex-1 bg-brand-bg border border-brand-border rounded-xl
                       px-4 py-3 text-sm outline-none focus:border-brand-accent transition-colors"
          />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => handleBarcodeScan(barcode)}
            className="btn-primary px-4"
          >
            {scanState === 'scanning' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
          </motion.button>
        </div>

        {/* Scan Ergebnis */}
        <AnimatePresence>
          {(scanState === 'found' || scanState === 'notfound') && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col gap-3 border-t border-brand-border pt-4"
            >
              <p className="text-xs text-brand-text-muted">
                {scanState === 'found' ? 'Produkt gefunden' : 'Nicht gefunden — manuell eingeben'}
              </p>
              {(['name', 'brand'] as const).map(field => (
                <input
                  key={field}
                  value={scanResult[field] ?? ''}
                  onChange={e => setScanResult(r => ({ ...r, [field]: e.target.value }))}
                  placeholder={field === 'name' ? 'Produktname' : 'Marke'}
                  className="w-full bg-brand-bg border border-brand-border rounded-xl
                             px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                />
              ))}
              <div className="flex gap-2">
                <input
                  type="number"
                  value={scanResult.price ?? 0}
                  onChange={e => setScanResult(r => ({ ...r, price: parseFloat(e.target.value) }))}
                  placeholder="Preis €"
                  className="flex-1 bg-brand-bg border border-brand-border rounded-xl
                             px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                />
                <input
                  type="number"
                  value={scanResult.stock ?? 0}
                  onChange={e => setScanResult(r => ({ ...r, stock: parseInt(e.target.value) }))}
                  placeholder="Menge"
                  className="flex-1 bg-brand-bg border border-brand-border rounded-xl
                             px-4 py-2.5 text-sm outline-none focus:border-brand-accent"
                />
              </div>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={saveProduct}
                className="btn-primary flex items-center justify-center gap-2"
              >
                <Check size={18} /> Speichern
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Produktliste */}
      <div className="flex flex-col gap-2">
        {products.map(p => (
          <div key={p.id}
               className={`card flex items-center gap-3 transition-opacity ${!p.active ? 'opacity-40' : ''}`}>
            <div className="w-10 h-10 rounded-lg bg-brand-border flex-shrink-0 overflow-hidden">
              {p.image_url
                ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-brand-text-muted text-lg">
                    {p.name[0]}
                  </div>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{p.name}</p>
              <p className="text-xs text-brand-text-muted">{p.brand} · {p.price.toFixed(2)} € · {p.stock} Stk</p>
            </div>
            <button
              onClick={() => toggleActive(p)}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors
                ${p.active ? 'bg-green-900/40 text-green-400' : 'bg-brand-border text-brand-text-muted'}`}
            >
              {p.active ? 'Aktiv' : 'Inaktiv'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
