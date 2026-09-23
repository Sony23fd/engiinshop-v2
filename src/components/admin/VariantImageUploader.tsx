"use client"

import { useRef, useState } from "react"
import { Camera, Loader2 } from "lucide-react"

interface Props {
  imageUrl?: string
  onUploaded: (url: string) => void
  onRemove: () => void
}

export function VariantImageUploader({ imageUrl, onUploaded, onRemove }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      alert("Зөвхөн зураг оруулна уу")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Файл 5MB-аас бага байх ёстой")
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("isVariant", "true")

      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()

      if (data.success && data.imageUrl) {
        onUploaded(data.imageUrl)
      } else {
        alert(data.error || "Зураг оруулахад алдаа гарлаа")
      }
    } catch (err) {
      alert("Серверт холбогдоход алдаа гарлаа")
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  if (imageUrl) {
    return (
      <div className="relative inline-flex items-center group shrink-0">
        <img
          src={imageUrl}
          alt="variant"
          className="w-7 h-7 object-cover rounded border border-indigo-200 shadow-xs"
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-[9px] font-bold shadow"
          title="Зураг устгах"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div className="shrink-0">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-7 h-7 rounded border border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50 flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-colors"
        title="Зураг оруулах"
      >
        {uploading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
        ) : (
          <Camera className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  )
}
