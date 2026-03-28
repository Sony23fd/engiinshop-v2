import { ReactNode } from "react"
import { AdminSidebar } from "@/components/admin/AdminSidebar"
import { TopHeader } from "@/components/admin/TopHeader"
import { getCurrentAdmin } from "@/lib/auth"

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin()

  if (!admin) {
    return <div className="min-h-screen w-full bg-slate-50">{children}</div>
  }

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <AdminSidebar className="hidden md:flex" role={admin?.role || "CARGO_ADMIN"} />
      <div className="flex flex-col flex-1 w-full relative">
        <TopHeader admin={admin} />
        <main className="flex-1 w-full p-4 overflow-y-auto overflow-x-hidden md:p-6 lg:p-8 relative">
          {children}
        </main>
      </div>
    </div>
  )
}

