"use client"

import { useRef, useState } from "react"
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"

interface ImportResult {
  success: boolean
  created?: number
  updated?: number
  errors?: string[]
  error?: string
}

export function ImportButton({ batchId }: { batchId: string }) {
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
        router.refresh()
      }
    } catch (err: any) {
      setResult({ success: false, error: err.message })
    } finally {
      setLoading(false)
      // Reset file input so same file can be re-selected
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

      {/* Result toast */}
      {result && (
        <div
          className={`absolute top-11 right-0 z-50 w-72 rounded-lg border p-3 text-xs shadow-lg ${
            result.success
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <div className="flex items-start gap-2">
            {result.success ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            )}
            <div className="space-y-1">
              {result.success ? (
                <>
                  <p className="font-semibold">Амжилттай импортолоо!</p>
                  <p>{result.created} захиалга нэмэгдлээ</p>
                  <p>{result.updated} захиалга шинэчлэгдлээ</p>
                  {result.errors && result.errors.length > 0 && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-amber-700 font-medium">
                        {result.errors.length} алдаа
                      </summary>
                      <ul className="mt-1 space-y-0.5 text-amber-700">
                        {result.errors.slice(0, 5).map((e, i) => (
                          <li key={i}>• {e}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>...болон {result.errors.length - 5} дахь алдаа</li>
                        )}
                      </ul>
                    </details>
                  )}
                </>
              ) : (
                <p>{result.error ?? "Алдаа гарлаа"}</p>
              )}
            </div>
          </div>

          <button
            onClick={() => setResult(null)}
            className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"
          >
            ×
          </button>
        </div>
      )}
    </div>
  )
}
