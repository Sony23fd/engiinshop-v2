export interface ProductOption {
  name: string
  values: string[]
  images?: Record<string, string> // e.g. { "Улаан": "/uploads/products/red.jpg" }
}

/**
 * Safely normalizes raw JSON options from database into a consistent ProductOption array
 */
export function normalizeOptions(rawOptions: any): ProductOption[] {
  if (!rawOptions || !Array.isArray(rawOptions)) return []

  return rawOptions
    .map(opt => {
      if (!opt || typeof opt !== 'object') return null
      const name = String(opt.name || '').trim()
      let values: string[] = []

      if (Array.isArray(opt.values)) {
        values = opt.values.map((v: any) => String(v).trim()).filter(Boolean)
      } else if (typeof opt.values === 'string') {
        values = opt.values.split(',').map((v: string) => v.trim()).filter(Boolean)
      }

      if (!name || values.length === 0) return null

      // Clean images map if present
      let images: Record<string, string> | undefined = undefined
      if (opt.images && typeof opt.images === 'object' && !Array.isArray(opt.images)) {
        const cleaned: Record<string, string> = {}
        for (const [k, v] of Object.entries(opt.images)) {
          if (typeof v === 'string' && v.trim()) {
            cleaned[k.trim()] = v.trim()
          }
        }
        if (Object.keys(cleaned).length > 0) {
          images = cleaned
        }
      }

      return { name, values, ...(images && { images }) }
    })
    .filter((opt): opt is ProductOption => opt !== null)
}

/**
 * Generates all valid variant combinations based on product options
 */
export function generateVariantCombos(options: ProductOption[]): { key: string; labels: Record<string, string> }[] {
  const valid = options.filter(o => o.values.length > 0)
  if (valid.length === 0) return []

  let combos: { key: string; labels: Record<string, string> }[] = [{ key: "", labels: {} }]
  for (const opt of valid) {
    const nextCombos: typeof combos = []
    for (const combo of combos) {
      for (const val of opt.values) {
        nextCombos.push({
          key: combo.key ? `${combo.key}-${val}` : val,
          labels: { ...combo.labels, [opt.name]: val }
        })
      }
    }
    combos = nextCombos
  }
  return combos
}

/**
 * Builds the canonical variant key from selected options following product.options order.
 * If product options are provided, uses that order. Otherwise falls back to Object.values.
 */
export function getVariantKey(
  options: ProductOption[] | any,
  selectedOptions: Record<string, string> | any
): string | null {
  if (!selectedOptions || typeof selectedOptions !== 'object') return null

  const normOptions = normalizeOptions(options)
  if (normOptions.length > 0) {
    const parts: string[] = []
    for (const opt of normOptions) {
      const val = selectedOptions[opt.name]
      if (val) {
        parts.push(String(val).trim())
      }
    }
    if (parts.length === normOptions.length) {
      return parts.join('-')
    }
  }

  // Fallback: join values in insertion order
  const vals = Object.values(selectedOptions)
    .map(v => String(v).trim())
    .filter(Boolean)
  return vals.length > 0 ? vals.join('-') : null
}

/**
 * Calculates sum of all variant stocks
 */
export function getVariantStockTotal(variantStock: Record<string, number> | null | undefined): number {
  if (!variantStock || typeof variantStock !== 'object') return 0
  return Object.values(variantStock).reduce((acc, count) => {
    const n = Number(count)
    return acc + (isNaN(n) || n < 0 ? 0 : n)
  }, 0)
}

/**
 * Returns the stock for a given selection.
 * If variantStock exists, checks variantStock[key].
 * If no variantStock or no options, returns defaultRemaining.
 */
export function getSelectionStock(
  options: ProductOption[] | any,
  variantStock: Record<string, number> | null | undefined,
  selectedOptions: Record<string, string> | any,
  defaultRemaining: number
): number {
  if (!variantStock || typeof variantStock !== 'object') {
    return defaultRemaining
  }
  const key = getVariantKey(options, selectedOptions)
  if (!key) return defaultRemaining

  if (variantStock[key] !== undefined) {
    return Math.max(0, Number(variantStock[key]) || 0)
  }

  return 0
}

/**
 * Checks whether an option value is completely out of stock across ALL variants
 */
export function isOptionValueCompletelySoldOut(
  options: ProductOption[],
  variantStock: Record<string, number> | null | undefined,
  optionName: string,
  optionValue: string
): boolean {
  if (!variantStock || typeof variantStock !== 'object') return false
  const combos = generateVariantCombos(options)
  if (combos.length === 0) return false

  // Find all combinations containing this optionValue for this optionName
  const matchingCombos = combos.filter(c => c.labels[optionName] === optionValue)
  if (matchingCombos.length === 0) return false

  // It's completely sold out only if ALL matching combinations have <= 0 stock
  return matchingCombos.every(c => (variantStock[c.key] ?? 0) <= 0)
}

/**
 * Checks whether an option value is available given the current selections of other options.
 * E.g. When Color="Улаан" is selected, checks if Size="40" has stock > 0 for "Улаан-40".
 */
export function isOptionAvailableForSelection(
  options: ProductOption[] | any,
  variantStock: Record<string, number> | null | undefined,
  currentSelectedOptions: Record<string, string>,
  targetOptionName: string,
  targetOptionValue: string
): boolean {
  if (!variantStock || typeof variantStock !== 'object') return true

  const normOptions = normalizeOptions(options)
  if (normOptions.length === 0) return true

  // If single option: check value directly
  if (normOptions.length === 1) {
    return (variantStock[targetOptionValue] ?? 0) > 0
  }

  // Multi options: build hypothetical selection
  const candidateSelection = { ...currentSelectedOptions, [targetOptionName]: targetOptionValue }
  
  // If all options are chosen, check exact key
  const exactKey = getVariantKey(normOptions, candidateSelection)
  if (exactKey) {
    return (variantStock[exactKey] ?? 0) > 0
  }

  // Otherwise check if any combination matching the already chosen options + this target has stock > 0
  const combos = generateVariantCombos(normOptions)
  return combos.some(c => {
    for (const [k, v] of Object.entries(candidateSelection)) {
      if (c.labels[k] !== v) return false
    }
    return (variantStock[c.key] ?? 0) > 0
  })
}

/**
 * Resolves the variant image URL for current option selections.
 * Prioritizes the image matching a selected option value (e.g. "Өнгө": "Улаан").
 * Falls back to defaultImageUrl if no variant image is set.
 */
export function getVariantImageUrl(
  options: ProductOption[] | any,
  selectedOptions: Record<string, string> | null | undefined,
  defaultImageUrl?: string | null
): string | null {
  if (!selectedOptions || typeof selectedOptions !== 'object') {
    return defaultImageUrl ?? null
  }

  const norm = normalizeOptions(options)
  for (const opt of norm) {
    if (opt.images && typeof opt.images === 'object') {
      const selectedVal = selectedOptions[opt.name]
      if (selectedVal && opt.images[selectedVal]) {
        return opt.images[selectedVal]
      }
    }
  }

  return defaultImageUrl ?? null
}

