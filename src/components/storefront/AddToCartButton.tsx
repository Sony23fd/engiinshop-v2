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
  iconOnly?: boolean
}

export function AddToCartButton({ batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder, iconOnly }: Props) {
  const { addItem, items } = useCart()
  const [added, setAdded] = useState(false)
  const inCart = items.some(i => i.batchId === batchId)

  function handleAdd(e: React.MouseEvent) {
    e.preventDefault() // prevent navigating to product detail if clicked inside a link area
    addItem({ batchId, name, imageUrl, unitPrice, deliveryFee, isPreOrder, qty: 1 })
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
  }

  if (iconOnly) {
    return (
      <button
        onClick={handleAdd}
        className={`flex items-center justify-center p-2.5 rounded-full transition-all duration-300 ${
          inCart
            ? "bg-green-50 text-green-600 ring-1 ring-green-200"
            : "bg-slate-100 text-slate-400 group-hover:bg-[#4F46E5] group-hover:text-white group-hover:scale-110 group-hover:shadow-md"
        }`}
        title="Сагслах"
      >
        {added ? <Check className="w-5 h-5" /> : <ShoppingCart className="w-5 h-5" />}
      </button>
    )
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
        <><Check className="w-4 h-4" /> <span className="hidden sm:inline">Нэмэгдлээ!</span><span className="sm:hidden">Боллоо!</span></>
      ) : inCart ? (
        <><ShoppingCart className="w-4 h-4" /> <span className="hidden sm:inline">Сагсанд байна</span><span className="sm:hidden">Сагсанд</span></>
      ) : (
        <><ShoppingCart className="w-4 h-4" /> <span className="hidden sm:inline">Сагсанд нэмэх</span><span className="sm:hidden">Сагслах</span></>
      )}
    </button>
  )
}
