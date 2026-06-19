"use client"

import { Download } from "lucide-react"

export function CategoryExportButton({ categoryId, categoryName }: { categoryId: string, categoryName: string }) {
  function handleExport() {
    window.location.href = `/api/admin/orders/export?categoryId=${categoryId}`
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-bold hover:bg-green-100 transition-colors shadow-sm"
      title={`${categoryName} ангиллын бүх захиалгыг татах`}
    >
      <Download className="w-4 h-4" />
      Excel татах
    </button>
  )
}
