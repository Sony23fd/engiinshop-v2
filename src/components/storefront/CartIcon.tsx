"use client"
import Link from "next/link"
import { ShoppingCart } from "lucide-react"
import { useCart } from "@/context/CartContext"

export function CartIcon() {
  const { totalCount } = useCart()

  return (
    <Link 
      href="/cart" 
      className={`fixed bottom-6 right-6 md:bottom-8 md:right-10 z-50 flex items-center justify-center p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 ${
        totalCount > 0 
          ? "bg-[#4e3dc7] border-indigo-400 text-white shadow-[#4e3dc7]/40 ring-4 ring-[#4e3dc7]/20" 
          : "bg-white border-slate-200 text-slate-700 hover:border-[#4e3dc7]/50 hover:text-[#4e3dc7]"
      }`}
    >
      <ShoppingCart className="w-6 h-6" />
      
      {/* Badge */}
      {totalCount > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[24px] h-[24px] bg-red-500 text-white text-xs font-black rounded-full flex items-center justify-center px-1.5 shadow-md border-2 border-white animate-bounce-short">
          {totalCount}
        </span>
      )}
    </Link>
  )
}
