export interface BarcodeResult {
  name: string
  brand: string
  image_url?: string
}

export async function lookupBarcode(barcode: string): Promise<BarcodeResult | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    const data = await res.json()
    if (data.status !== 1) return null
    const p = data.product
    return {
      name: p.product_name || p.product_name_de || '',
      brand: p.brands || '',
      image_url: p.image_front_small_url || p.image_url || undefined
    }
  } catch {
    return null
  }
}
