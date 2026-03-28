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
    <div className="flex flex-col items-center gap-2">
      {/* Image preview / upload zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={e => e.preventDefault()}
        className="w-16 h-16 rounded-lg border-2 border-dashed border-slate-200 hover:border-indigo-400 cursor-pointer overflow-hidden transition-colors relative group bg-slate-50 flex-shrink-0"
      >
        {preview ? (
          <>
            <img src={preview} alt={batchName} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <ImagePlus className="w-5 h-5 text-white" />
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            {uploading
              ? <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
              : <ImagePlus className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
            }
          </div>
        )}

        {/* Uploading overlay */}
        {uploading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
          </div>
        )}

        {/* Success overlay */}
        {success && (
          <div className="absolute inset-0 bg-green-500/80 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleChange} />

      {error && (
        <div className="flex items-center gap-1 text-[10px] text-red-500 max-w-[100px] text-center leading-tight">
          <X className="w-3 h-3 flex-shrink-0" />
          {error}
        </div>
      )}
      <span className="text-[10px] text-slate-400">Зураг</span>
    </div>
  )
}
