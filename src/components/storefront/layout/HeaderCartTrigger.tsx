"use client"

import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/CartContext"

export function HeaderCartTrigger() {
  const { totalCount } = useCart()

  const openCart = () => {
    window.dispatchEvent(new CustomEvent("open-cart-drawer"))
  }

  return (
    <button
      type="button"
      onClick={openCart}
      className="relative p-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all backdrop-blur-sm flex items-center justify-center cursor-pointer"
      title="Сагс нээх"
    >
      <ShoppingCart className="w-4 h-4" />
      {totalCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center px-1 border border-white shadow-sm">
          {totalCount > 99 ? "99+" : totalCount}
        </span>
      )}
    </button>
  )
}

