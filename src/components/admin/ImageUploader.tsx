"use client"

import { useRef, useState } from "react"
import { ImagePlus, Loader2, CheckCircle2, X } from "lucide-react"

interface Props {
  productId: string
  currentImageUrl?: string | null
  batchName: string
}

export function ImageUploader({ productId, currentImageUrl, batchName }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(currentImageUrl ?? null)
  const [uploading, setUploading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Зөвхөн зураг оруулна уу")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Файл 5MB-аас бага байх ёстой")
      return
    }

    setError(null)
    setUploading(true)

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file)
    setPreview(localUrl)

    const form = new FormData()
    form.append("file", file)
    form.append("productId", productId)

    const res = await fetch("/api/upload", { method: "POST", body: form })
    const data = await res.json()

    setUploading(false)

    if (data.success) {
      setPreview(data.imageUrl)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } else {
      setError(data.error ?? "Upload амжилтгүй")
      setPreview(currentImageUrl ?? null)
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className="flex flex-col items-start gap-1">
      {/* Image preview / upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className={`rounded-xl border-2 overflow-hidden transition-all relative group cursor-pointer flex-shrink-0 shadow-sm ${
          preview ? "w-20 h-20 border-slate-200" : "w-28 h-20 border-dashed border-indigo-200 bg-indigo-50/50 hover:bg-indigo-100 hover:border-indigo-400"
        }`}
      >
        {preview ? (
          <>
            <img src={preview} alt={batchName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
              <ImagePlus className="w-5 h-5 text-white" />
              <span className="text-[10px] text-white font-medium">Солих</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 p-2 text-center">
            {uploading ? (
              <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            ) : (
              <>
                <ImagePlus className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-semibold text-indigo-600 leading-tight">Зураг оруулах</span>
              </>
            )}
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && preview && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
          </div>
        )}

        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 bg-emerald-500/90 flex flex-col items-center justify-center text-white">
            <CheckCircle2 className="w-6 h-6 mb-1" />
            <span className="text-[10px] font-bold">Амжилттай</span>
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      {error ? (
        <div className="flex items-start gap-1 text-[10px] text-red-600 max-w-[112px] leading-tight font-medium bg-red-50 p-1 rounded">
          <X className="w-3 h-3 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      ) : (
        !preview && <span className="text-[10px] text-slate-400 font-medium px-1">PNG, JPG (Max 5MB)</span>
      )}
    </div>
  )
}
