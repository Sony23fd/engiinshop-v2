"use client"

import { useRouter } from "next/navigation"
import { Menu, LogOut, User, Shield, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { OrderNotificationListener } from "@/components/admin/OrderNotificationListener"

interface AdminUser {
  id: string
  email: string
  name: string
  role: "ADMIN" | "CARGO_ADMIN" | "DATAADMIN"
}

export function TopHeader({ admin }: { admin?: AdminUser | null }) {
  const router = useRouter()

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    router.push("/admin/login")
    router.refresh()
  }

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-4 sticky top-0 z-10">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-3">
        {admin && (
          <OrderNotificationListener />
        )}

        {/* User Info */}
        {admin && (
          <div className="hidden sm:flex items-center gap-2 text-sm bg-slate-50 rounded-full px-3 py-1.5 border">
            <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
              {admin.role === "ADMIN" ? (
                <Shield className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Truck className="w-3.5 h-3.5 text-blue-600" />
              )}
            </div>
            <div className="leading-tight">
              <p className="font-medium text-slate-800">{admin.name}</p>
              <p className="text-xs text-slate-400">
                {admin.role === "ADMIN" ? "Үндсэн Админ" : "Каргоны Админ"}
              </p>
            </div>
          </div>
        )}

        {/* Logout Button */}
        {admin && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Гарах"
            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        )}

        {!admin && (
          <Button variant="secondary" size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">
            <User className="w-5 h-5" />
          </Button>
        )}
      </div>
    </header>
  )
}
