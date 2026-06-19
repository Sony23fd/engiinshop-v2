"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, ShoppingCart, Search, MessageCircleQuestion } from "lucide-react"
import { useCart } from "@/context/CartContext"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { items } = useCart()
  const totalItems = items.reduce((sum, item) => sum + item.qty, 0)

  const navItems = [
    { name: "Нүүр", href: "/", icon: Home },
    { name: "Сагс", href: "/cart", icon: ShoppingCart, badge: totalItems },
    { name: "Шалгах", href: "/track", icon: Search },
    { name: "Заавар", href: "#", icon: MessageCircleQuestion, action: () => window.dispatchEvent(new CustomEvent("open-chatbot")) },
  ]

  // Hide bottom nav on specific paths if needed (e.g. admin, or specific checkout step)
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/product/')) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.03)] z-[100] md:hidden pb-[env(safe-area-inset-bottom)]">
      <div className="flex justify-around items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href && item.href !== "#"
          
          const content = (
            <>
              <div className="relative">
                <item.icon className={`w-6 h-6 transition-transform ${isActive ? "scale-110" : "scale-100"}`} />
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[11px] font-medium ${isActive ? "font-bold text-[#4e3dc7]" : ""}`}>
                {item.name}
              </span>
            </>
          )

          const className = `flex flex-col items-center justify-center w-full h-full space-y-1 relative ${
                isActive ? "text-[#4e3dc7]" : "text-slate-500 hover:text-slate-900"
          }`

          if (item.action) {
            return (
              <button key={item.name} onClick={item.action} className={className}>
                {content}
              </button>
            )
          }

          return (
            <Link 
              key={item.href} 
              href={item.href}
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
