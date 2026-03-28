"use client"

import { useState } from "react"
import { archiveCategory, unarchiveCategory } from "@/app/actions/category-actions"
import { Archive, ArchiveRestore, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function ArchiveCategoryButton({ categoryId, isArchived }: {
  categoryId: string
  isArchived: boolean
}) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleArchive() {
    const label = isArchived ? "Идэвхтэй болгох" : "Архивлах"
    if (!confirm(`Энэ ангиллыг ${label} уу?`)) return
    setLoading(true)
    if (isArchived) {
      await unarchiveCategory(categoryId)
    } else {
      await archiveCategory(categoryId)
    }
    setLoading(false)
    router.push("/admin/orders")
  }

  return (
    <button
      onClick={handleArchive}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-60 ${
        isArchived
          ? "bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200"
          : "bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 border border-slate-200"
      }`}
    >
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : isArchived
          ? <ArchiveRestore className="w-4 h-4" />
          : <Archive className="w-4 h-4" />
      }
      {isArchived ? "Архиваас гаргах" : "Архивлах"}
    </button>
  )
}
