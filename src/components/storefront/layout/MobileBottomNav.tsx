"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingBag, ShoppingCart, Search, Clock } from "lucide-react"
import { useCart } from "@/context/CartContext"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { items } = useCart()
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)

  const navItems = [
    { name: "Нүүр", href: "/", icon: Home },
    { name: "Дэлгүүр", href: "/shop", icon: ShoppingBag },
    { 
      name: "Хайх", 
      icon: Search, 
      action: () => window.dispatchEvent(new CustomEvent("open-search-modal")) 
    },
    { 
      name: "Сагс", 
      icon: ShoppingCart, 
      badge: totalItems,
      action: () => window.dispatchEvent(new CustomEvent("open-cart-drawer"))
    },
    { name: "Шалгах", href: "/track", icon: Clock },
  ]

  // Hide bottom nav on admin paths
  if (pathname?.startsWith('/admin')) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.04)] z-40 md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive = item.href ? pathname === item.href : false
          
          const content = (
            <>
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? "scale-110 text-indigo-600" : ""}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1.5 min-w-[16px] h-[16px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium tracking-tight ${isActive ? "font-bold text-indigo-600" : "text-slate-500"}`}>
                {item.name}
              </span>
            </>
          )

          const className = `flex flex-col items-center justify-center w-full h-full space-y-1 relative cursor-pointer ${
            isActive ? "text-indigo-600" : "text-slate-500 hover:text-slate-900"
          }`

          if (item.action) {
            return (
              <button 
                key={item.name} 
                type="button"
                onClick={item.action} 
                className={className}
              >
                {content}
              </button>
            )
          }

          return (
            <Link 
              key={item.name} 
              href={item.href!}
              className={className}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
