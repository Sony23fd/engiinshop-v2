"use client"
import { useCart } from "@/context/CartContext"
import { ShoppingCart, Check } from "lucide-react"
import { useState } from "react"

interface Props {
  batchId: string
  name: string
  imageUrl?: string | null
  unitPrice: number
  deliveryFee: number
  isPreOrder?: boolean
}

export function AddToCartButton({ batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder }: Props) {
  const { addItem, items } = useCart()
  const [added, setAdded] = useState(false)
  const inCart = items.some(i => i.batchId === batchId)

  function handleAdd() {
    addItem({ batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder, qty: 1 })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  return (
    <button
      onClick={handleAdd}
      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-all ${
        inCart
          ? "bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
          : "bg-[#4F46E5] text-white hover:bg-[#4338ca]"
      }`}
    >
      {added ? (
        <><Check className="w-4 h-4" /> Нэмэгдлээ!</>
      ) : inCart ? (
        <><ShoppingCart className="w-4 h-4" /> Сагсанд байна</>
      ) : (
        <><ShoppingCart className="w-4 h-4" /> Сагсанд нэмэх</>
      )}
    </button>
  )
}
