"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  ImagePlus,
  Video,
  Trash2,
  Star,
  Loader2,
  CheckCircle2,
  UploadCloud,
  Film,
  Sparkles,
  Layers
} from "lucide-react"
import {
  removeProductImage,
  setProductCoverImage,
  removeProductVideo
} from "@/app/actions/product-actions"

interface ProductMediaModalProps {
  productId: string
  productName: string
  currentImageUrl?: string | null
  currentImages?: string[]
  currentVideoUrl?: string | null
  options?: any
}

export function ProductMediaModal({
  productId,
  productName,
  currentImageUrl: initialCover,
  currentImages: initialImages = [],
  currentVideoUrl: initialVideo,
  options
}: ProductMediaModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [coverImage, setCoverImage] = useState<string | null>(initialCover ?? null)
  const [images, setImages] = useState<string[]>(() => {
    const list = [...initialImages]
    if (initialCover && !list.includes(initialCover)) {
      list.unshift(initialCover)
    }
    return list
  })
  const [videoUrl, setVideoUrl] = useState<string | null>(initialVideo ?? null)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<string>("")
  const [videoUploading, setVideoUploading] = useState(false)
  const [activeActionId, setActiveActionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  // Extract variant images for reference preview
  const variantImages: { optName: string; optValue: string; url: string }[] = []
  if (Array.isArray(options)) {
    options.forEach((opt: any) => {
      if (opt.images && typeof opt.images === "object") {
        for (const [val, url] of Object.entries(opt.images)) {
          if (typeof url === "string" && url) {
            variantImages.push({ optName: opt.name, optValue: val, url })
          }
        }
      }
    })
  }

  // Handle uploading multiple images
  async function handleImageFiles(files: FileList | File[]) {
    const fileArray = Array.from(files).filter(f => f.type.startsWith("image/"))
    if (fileArray.length === 0) {
      setError("Зөвхөн зураг сонгоно уу")
      return
    }

    setError(null)
    setUploading(true)
    const newImages = [...images]
    let newCover = coverImage

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i]
      setUploadProgress(`${i + 1}/${fileArray.length} хуулж байна...`)

      const form = new FormData()
      form.append("file", file)
      form.append("productId", productId)
      form.append("isGallery", "true")

      try {
        const res = await fetch("/api/upload", { method: "POST", body: form })
        const data = await res.json()
        if (data.success && data.imageUrl) {
          if (!newImages.includes(data.imageUrl)) {
            newImages.push(data.imageUrl)
          }
          if (!newCover) {
            newCover = data.imageUrl
          }
        }
      } catch (err) {
        console.error("Failed to upload image file:", err)
      }
    }

    setImages(newImages)
    setCoverImage(newCover)
    setUploading(false)
    setUploadProgress("")
    router.refresh()
  }

  // Set as Cover photo
  async function handleSetCover(url: string) {
    setActiveActionId(url)
    const res = await setProductCoverImage(productId, url)
    setActiveActionId(null)

    if (res.success) {
      setCoverImage(url)
      router.refresh()
    } else {
      alert(res.error || "Үндсэн зураг тохируулахад алдаа гарлаа")
    }
  }

  // Delete image
  async function handleDeleteImage(url: string) {
    if (!confirm("Энэ зургийг устгах уу?")) return

    setActiveActionId(url)
    const res = await removeProductImage(productId, url)
    setActiveActionId(null)

    if (res.success) {
      const remaining = images.filter(img => img !== url)
      setImages(remaining)
      setCoverImage(res.imageUrl || (remaining.length > 0 ? remaining[0] : null))
      router.refresh()
    } else {
      alert(res.error || "Зураг устгахад алдаа гарлаа")
    }
  }

  // Handle Video Upload
  async function handleVideoFile(file: File) {
    if (!file.type.startsWith("video/")) {
      setError("Зөвхөн бичлэг оруулна уу")
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("Бичлэг 50MB-аас бага байх ёстой")
      return
    }

    setError(null)
    setVideoUploading(true)

    const form = new FormData()
    form.append("file", file)
    form.append("productId", productId)

    try {
      const res = await fetch("/api/upload", { method: "POST", body: form })
      const data = await res.json()
      if (data.success && data.videoUrl) {
        setVideoUrl(data.videoUrl)
        router.refresh()
      } else {
        setError(data.error || "Бичлэг хуулахад алдаа гарлаа")
      }
    } catch (err: any) {
      setError(err.message || "Бичлэг хуулахад алдаа гарлаа")
    } finally {
      setVideoUploading(false)
    }
  }

  // Remove Video
  async function handleDeleteVideo() {
    if (!confirm("Бичлэгийг устгах уу?")) return
    setVideoUploading(true)
    const res = await removeProductVideo(productId)
    setVideoUploading(false)
    if (res.success) {
      setVideoUrl(null)
      router.refresh()
    } else {
      alert(res.error || "Бичлэг устгахад алдаа гарлаа")
    }
  }

  const allDistinctImages = Array.from(new Set(images.filter(Boolean)))
  const totalCount = allDistinctImages.length

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative flex items-center gap-2 p-1.5 rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 transition-all text-left shadow-2xs"
        title="Зураг болон бичлэг удирдах"
      >
        {coverImage ? (
          <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-50">
            <Image
              src={coverImage}
              alt={productName}
              fill
              sizes="48px"
              className="object-cover group-hover:scale-105 transition-transform"
            />
            {totalCount > 1 && (
              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-[9px] text-white font-bold text-center leading-tight py-0.5">
                +{totalCount - 1}
              </div>
            )}
          </div>
        ) : (
          <div className="w-12 h-12 rounded-lg border border-dashed border-indigo-200 bg-indigo-50/50 flex flex-col items-center justify-center shrink-0 text-indigo-500 group-hover:scale-105 transition-transform">
            <ImagePlus className="w-5 h-5" />
          </div>
        )}

        <div className="flex flex-col pr-1">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
            📷 {totalCount > 0 ? `${totalCount} зураг` : "Зураггүй"}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {videoUrl ? (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 flex items-center gap-0.5">
                <Film className="w-2.5 h-2.5" /> Видеотой
              </span>
            ) : (
              <span className="text-[10px] text-slate-400">Зураг нэмэх</span>
            )}
            {variantImages.length > 0 && (
              <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200">
                +{variantImages.length} хувилбар
              </span>
            )}
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>📷 Барааны Зураг & Мультимедиа</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            <strong>{productName}</strong> барааны бүх зураг, үндсэн зураг болон бичлэгийг удирдах.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-xs font-medium">
            {error}
          </div>
        )}

        {/* Upload Zone */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span>🖼️ Зургийн цомог ({allDistinctImages.length} зураг)</span>
            </h4>
            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={e => {
                  if (e.target.files) handleImageFiles(e.target.files)
                  e.target.value = ""
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={uploading}
                onClick={() => imageInputRef.current?.click()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 px-3 flex items-center gap-1.5 font-bold shadow-2xs"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{uploadProgress || "Хуулж байна..."}</span>
                  </>
                ) : (
                  <>
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>+ Олон зураг зэрэг сонгох</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Drag & Drop Box */}
          <div
            onDragOver={e => e.preventDefault()}
            onDrop={e => {
              e.preventDefault()
              if (e.dataTransfer.files) handleImageFiles(e.dataTransfer.files)
            }}
            onClick={() => imageInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50 rounded-xl p-4 text-center cursor-pointer transition-colors"
          >
            <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
            <p className="text-xs font-bold text-indigo-900">
              Энд зургуудаа чирж оруулна уу, эсвэл дарж файлаа сонгоно уу
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JPG, PNG, WebP форматтай хэдэн ч зураг зэрэг сонгон оруулж болно
            </p>
          </div>

          {/* Images Grid */}
          {allDistinctImages.length === 0 ? (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs">
              Одоогоор үндсэн цомогт зураг ороогүй байна. Дээрх товчоор зураг нэмнэ үү.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3 pt-1">
              {allDistinctImages.map((url, idx) => {
                const isCover = coverImage === url
                const isActionActive = activeActionId === url

                return (
                  <div
                    key={url}
                    className={`relative rounded-xl overflow-hidden border-2 bg-slate-100 flex flex-col group transition-all ${
                      isCover
                        ? "border-amber-400 ring-2 ring-amber-200 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="relative aspect-square w-full">
                      <Image
                        src={url}
                        alt={`Барааны зураг ${idx + 1}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 20vw"
                        className="object-cover"
                      />

                      {/* Cover Badge */}
                      {isCover && (
                        <div className="absolute top-1.5 left-1.5 bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm uppercase tracking-wider">
                          <Star className="w-2.5 h-2.5 fill-current" /> Үндсэн
                        </div>
                      )}

                      {/* Loading overlay for action */}
                      {isActionActive && (
                        <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center">
                          <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="p-1.5 bg-white border-t border-slate-100 flex items-center justify-between gap-1">
                      {!isCover ? (
                        <button
                          type="button"
                          onClick={() => handleSetCover(url)}
                          className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2 py-1 rounded flex items-center gap-1 transition-colors flex-1 justify-center"
                          title="Энэ зургийг нүүр хуудас болон үндсэн зураг болгох"
                        >
                          <Star className="w-2.5 h-2.5" /> Үндсэн болгох
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 px-2 py-1 flex-1 text-center">
                          Нүүр зураг
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteImage(url)}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Зургийг устгах"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Video Section */}
        <div className="border-t border-slate-200 pt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
              <span>🎥 Барааны Бичлэг (Видео)</span>
            </h4>
            <div className="flex items-center gap-2">
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={e => {
                  const f = e.target.files?.[0]
                  if (f) handleVideoFile(f)
                  e.target.value = ""
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={videoUploading}
                onClick={() => videoInputRef.current?.click()}
                className="text-xs h-8 px-3 border-slate-300 hover:bg-slate-50 flex items-center gap-1.5 font-bold"
              >
                {videoUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Бичлэг хуулж байна...</span>
                  </>
                ) : (
                  <>
                    <Film className="w-3.5 h-3.5" />
                    <span>{videoUrl ? "Бичлэг солих" : "+ Бичлэг оруулах"}</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {videoUrl ? (
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-black shrink-0 border border-slate-300">
                <video src={videoUrl} className="w-full h-full object-cover" controls muted />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-bold text-slate-800">Бүтээгдэхүүний танилцуулга бичлэг</p>
                <p className="text-[11px] text-slate-500">
                  Вэб сайтад хэрэглэгч зураг/бичлэг хооронд шилжин тоглуулах боломжтой.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={videoUploading}
                onClick={handleDeleteVideo}
                className="text-red-600 hover:bg-red-50 text-xs h-8 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Устгах</span>
              </Button>
            </div>
          ) : (
            <p className="text-xs text-slate-400 bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200">
              Энэ бараанд одоогоор танилцуулга бичлэг ороогүй байна (MP4, WebM гэх мэт видео 50MB хүртэл оруулах боломжтой).
            </p>
          )}
        </div>

        {/* Variant Photos Integration (Read-only reference preview) */}
        {variantImages.length > 0 && (
          <div className="border-t border-slate-200 pt-5 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-700 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Сонголтод холбогдсон зургууд ({variantImages.length})</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Дараах зургууд нь барааны өнгө/сонголтод тохируулагдсан тул вэб сайтын галерейд автоматаар нэмэгдэж харагдана. Хэрэглэгч галерейгаас эдгээр зургийг үзэх үед тухайн сонголт автоматаар идэвхжиж захиалга үүснэ:
            </p>
            <div className="flex items-center gap-2 overflow-x-auto py-1">
              {variantImages.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 bg-indigo-50/70 border border-indigo-200 p-1 rounded-lg shrink-0"
                >
                  <div className="relative w-8 h-8 rounded overflow-hidden border border-indigo-200">
                    <Image src={v.url} alt={v.optValue} fill sizes="32px" className="object-cover" />
                  </div>
                  <span className="text-[10px] font-bold text-indigo-900 pr-1">{v.optValue}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Close */}
        <div className="border-t border-slate-200 pt-4 flex justify-end">
          <Button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-slate-800 hover:bg-slate-900 text-white text-xs px-5"
          >
            Боллоо / Хаах
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
