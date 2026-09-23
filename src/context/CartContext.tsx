"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

export interface CartItem {
  itemKey?: string
  batchId: string
  name: string
  imageUrl?: string | null
  unitPrice: number
  deliveryFee: number
  qty: number
  isPreOrder?: boolean
  selectedOptions?: Record<string, string>
}

export function getCartItemKey(item: { batchId: string; selectedOptions?: Record<string, string> }): string {
  if (!item.selectedOptions || Object.keys(item.selectedOptions).length === 0) {
    return item.batchId
  }
  const sorted = Object.entries(item.selectedOptions).sort(([a], [b]) => a.localeCompare(b))
  return `${item.batchId}__${JSON.stringify(sorted)}`
}

interface CartContextType {
  items: CartItem[]
  addItem: (item: Omit<CartItem, "qty"> & { qty?: number }) => void
  removeItem: (itemKeyOrBatchId: string) => void
  updateQty: (itemKeyOrBatchId: string, qty: number) => void
  clearCart: () => void
  totalCount: number
  totalPrice: number
}

const CartContext = createContext<CartContextType | null>(null)

const STORAGE_KEY = "anar_cart"

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored)
        // Ensure every item has an itemKey
        const withKeys = parsed.map(i => ({
          ...i,
          itemKey: i.itemKey || getCartItemKey(i)
        }))
        setItems(withKeys)
      }
    } catch {}
  }, [])

  // Save to localStorage on change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items])

  function addItem(incoming: Omit<CartItem, "qty"> & { qty?: number }) {
    const key = incoming.itemKey || getCartItemKey(incoming)
    const incomingWithKey: CartItem = {
      ...incoming,
      itemKey: key,
      qty: incoming.qty ?? 1
    }

    setItems(prev => {
      const existingIdx = prev.findIndex(i => (i.itemKey || getCartItemKey(i)) === key)
      if (existingIdx >= 0) {
        const next = [...prev]
        next[existingIdx] = {
          ...next[existingIdx],
          qty: next[existingIdx].qty + (incoming.qty ?? 1)
        }
        return next
      }
      return [...prev, incomingWithKey]
    })
  }

  function removeItem(keyOrBatchId: string) {
    setItems(prev => prev.filter(i => (i.itemKey || getCartItemKey(i)) !== keyOrBatchId && i.batchId !== keyOrBatchId))
  }

  function updateQty(keyOrBatchId: string, qty: number) {
    if (qty < 1) return removeItem(keyOrBatchId)
    setItems(prev => prev.map(i => {
      const currentKey = i.itemKey || getCartItemKey(i)
      if (currentKey === keyOrBatchId || i.batchId === keyOrBatchId) {
        return { ...i, qty }
      }
      return i
    }))
  }

  function clearCart() {
    setItems([])
  }

  const totalCount = items.reduce((s, i) => s + i.qty, 0)
  const totalPrice = items.reduce((s, i) => s + i.unitPrice * i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalCount, totalPrice }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be inside CartProvider")
  return ctx
}
