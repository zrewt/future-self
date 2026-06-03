const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl'

/**
 * Free Open Food Facts search — no API key required.
 * @param {string} query
 * @param {AbortSignal} [signal]
 */
export async function searchFoods(query, signal) {
  const q = query.trim()
  if (q.length < 2) return []

  const params = new URLSearchParams({
    search_terms: q,
    search_simple: '1',
    action: 'process',
    json: '1',
    page_size: '8',
    fields: 'code,product_name,brands,nutriments',
  })

  const res = await fetch(`${SEARCH_URL}?${params}`, { signal })
  if (!res.ok) throw new Error('Food search unavailable')

  const data = await res.json()
  return (data.products || [])
    .filter((p) => p.product_name)
    .map((p) => ({
      offCode: p.code,
      name: p.product_name,
      brand: p.brands?.split(',')[0]?.trim() || '',
      calories: p.nutriments?.['energy-kcal_100g']
        ? Math.round(p.nutriments['energy-kcal_100g'])
        : null,
    }))
}

export function foodToLogItem(product, serving = '1 serving') {
  return {
    id: crypto.randomUUID(),
    name: product.name,
    brand: product.brand,
    calories: product.calories,
    serving,
    offCode: product.offCode,
  }
}
