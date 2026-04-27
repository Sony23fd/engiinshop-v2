"use client"

import { useState } from "react"
import { clearActivityLogs } from "@/app/actions/activity-actions"
import { useToast } from "@/components/ui/use-toast"
import { Trash2, Loader2 } from "lucide-react"

export function ClearLogsButton() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  async function handleClear() {
    if (!confirm("Та 30-аас дээш хоносон хуучин логуудыг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй.")) return

    setLoading(true)
    const result = await clearActivityLogs(30)
    setLoading(false)

    if (result.success) {
      toast({
        title: "Амжилттай",
        description: `Нийт ${result.count} хуучин логийг устгаж цэвэрлэлээ.`,
      })
    } else {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: result.error || "Устгахад алдаа гарлаа",
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleClear}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-600 text-sm font-bold rounded-lg border border-rose-200 hover:bg-rose-100 hover:text-rose-700 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
      Хуучин лог устгах
    </button>
  )
}
