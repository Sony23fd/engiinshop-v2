"use client"

import { Download } from "lucide-react"

export function ExportButton({ batchId }: { batchId: string }) {
  function handleExport() {
    window.location.href = `/api/admin/orders/export?batchId=${batchId}`
  }

  return (
    <button
      onClick={handleExport}
      className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm h-9"
    >
      <Download className="w-4 h-4" />
      Экспорт
    </button>
  )
}
