"use client"

import { useRef, useState } from "react"
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

interface ImportResult {
  success: boolean
  created?: number
  updated?: number
  errors?: string[]
  error?: string
}

export function ImportButton({ batchId, batchName }: { batchId: string, batchName: string }) {
  const { toast } = useToast()
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append("file", file)
    formData.append("batchId", batchId)

    try {
      const res = await fetch("/api/admin/orders/import", {
        method: "POST",
        body: formData,
      })
      const data: ImportResult = await res.json()
      setResult(data)

      if (data.success) {
        toast({
          title: "Амжилттай!",
          description: `${data.created} захиалгыг [${batchName}] багц руу амжилттай импортолоо.`,
        })
        if (data.errors && data.errors.length > 0) {
          toast({
            variant: "destructive",
            title: "Зарим мөр дээр алдаа гарлаа",
            description: `${data.errors.length} мөр ачааллахад асуудал гарсан байна. Доорх жагсаалтаас харна уу.`,
          })
        }
        router.refresh()
      } else {
        toast({
          variant: "destructive",
          title: "Импорт амжилтгүй",
          description: data.error ?? "Алдаа гарлаа",
        })
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Алдаа",
        description: err.message,
      })
      setResult({ success: false, error: err.message })
    } finally {
      setLoading(false)
      // Reset file input
      if (fileRef.current) fileRef.current.value = ""
    }
  }

  return (
    <div className="relative">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm h-9 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Upload className="w-4 h-4" />
        )}
        {loading ? "Импортолж байна..." : "Импорт"}
      </button>

      {/* Show detailed errors if any */}
      {result && result.errors && result.errors.length > 0 && (
        <div className="absolute top-11 right-0 z-50 w-80 rounded-lg border p-4 bg-white shadow-xl text-xs">
          <div className="flex items-start gap-2 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <p className="font-bold text-slate-800">Импортын зарим мөр алдаатай:</p>
          </div>
          <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar bg-slate-50 p-2 rounded border border-slate-100">
            {result.errors.map((e, i) => (
              <p key={i} className="text-slate-600 leading-relaxed">• {e}</p>
            ))}
          </div>
          <button
            onClick={() => setResult(null)}
            className="mt-3 w-full py-1.5 bg-slate-100 hover:bg-slate-200 rounded font-bold text-slate-600 transition-colors"
          >
            Хаах
          </button>
        </div>
      )}
    </div>
  )
}
