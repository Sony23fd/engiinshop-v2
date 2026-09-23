"use client"

import { useState, useMemo, useEffect } from "react"
import Image from "next/image"
import { Package, Video, Image as ImageIcon } from "lucide-react"
import { ProductOption } from "@/lib/variant-utils"

interface ProductGalleryProps {
  defaultImageUrl?: string | null
  activeImageUrl?: string | null
  productName: string
  videoUrl?: string | null
  isPreOrder?: boolean
  options?: ProductOption[]
  selectedOptions?: Record<string, string>
  onSelectOption?: (optName: string, optValue: string) => void
}

interface GalleryItem {
  id: string
  url: string
  label: string
  optionName?: string
  optionValue?: string
  isDefault?: boolean
}

export function ProductGallery({
  defaultImageUrl,
  activeImageUrl,
  productName,
  videoUrl,
  isPreOrder,
  options = [],
  selectedOptions = {},
  onSelectOption
}: ProductGalleryProps) {
  const [showVideo, setShowVideo] = useState(Boolean(videoUrl && !activeImageUrl && !defaultImageUrl))
  const [currentImage, setCurrentImage] = useState<string | null>(activeImageUrl || defaultImageUrl || null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Extract all distinct images available across options and default
  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = []
    const seenUrls = new Set<string>()

    if (defaultImageUrl) {
      items.push({
        id: "default",
        url: defaultImageUrl,
        label: "Үндсэн",
        isDefault: true
      })
      seenUrls.add(defaultImageUrl)
    }

    options.forEach(opt => {
      if (opt.images && typeof opt.images === "object") {
        for (const [val, url] of Object.entries(opt.images)) {
          if (url && !seenUrls.has(url)) {
            items.push({
              id: `${opt.name}-${val}`,
              url,
              label: val,
              optionName: opt.name,
              optionValue: val
            })
            seenUrls.add(url)
          }
        }
      }
    })

    return items
  }, [defaultImageUrl, options])

  // React to activeImageUrl changes smoothly
  useEffect(() => {
    const targetUrl = activeImageUrl || defaultImageUrl || null
    if (targetUrl !== currentImage) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setCurrentImage(targetUrl)
        setShowVideo(false)
        setIsTransitioning(false)
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [activeImageUrl, defaultImageUrl])

  const handleThumbnailClick = (item: GalleryItem) => {
    setShowVideo(false)
    if (item.optionName && item.optionValue && onSelectOption) {
      onSelectOption(item.optionName, item.optionValue)
    } else {
      setCurrentImage(item.url)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Main Image / Video Viewport */}
      <div className="aspect-[4/5] sm:aspect-square bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative border border-slate-200/80 shadow-xs group">
        {showVideo && videoUrl ? (
          <video
            src={videoUrl}
            autoPlay
            loop
            muted
            playsInline
            className="object-cover w-full h-full"
          />
        ) : currentImage ? (
          <div className="relative w-full h-full">
            <Image
              src={currentImage}
              alt={productName}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
              className={`object-cover w-full h-full transition-all duration-300 ${
                isTransitioning ? "opacity-40 scale-95" : "opacity-100 scale-100"
              }`}
            />
          </div>
        ) : (
          <div className="flex flex-col items-center text-slate-400 gap-2 p-4 text-center">
            <Package className="w-12 h-12 stroke-[1.5]" />
            <span className="text-xs font-medium text-slate-500">{productName}</span>
          </div>
        )}

        {/* Pre-order Badge Overlay */}
        {isPreOrder && (
          <div className="absolute top-3.5 left-3.5 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-800 flex items-center gap-1.5 shadow-sm border border-amber-200/80 uppercase tracking-wider z-10">
            <span>📌 Урьдчилсан захиалга</span>
          </div>
        )}

        {/* Video / Photo switcher if video exists */}
        {videoUrl && (
          <div className="absolute bottom-3.5 right-3.5 flex items-center gap-1.5 bg-black/60 backdrop-blur-md p-1 rounded-full text-white z-10">
            <button
              type="button"
              onClick={() => setShowVideo(false)}
              className={`p-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
                !showVideo ? "bg-white text-slate-900 shadow" : "hover:bg-white/20 text-slate-200"
              }`}
              title="Зураг үзэх"
            >
              <ImageIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              className={`p-1.5 rounded-full text-xs font-semibold flex items-center gap-1 transition-colors ${
                showVideo ? "bg-white text-slate-900 shadow" : "hover:bg-white/20 text-slate-200"
              }`}
              title="Бичлэг үзэх"
            >
              <Video className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Thumbnails row (If there are multiple images) */}
      {galleryItems.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-0.5 no-scrollbar">
          {galleryItems.map(item => {
            const isSelected =
              !showVideo &&
              (item.optionName && item.optionValue
                ? selectedOptions[item.optionName] === item.optionValue
                : currentImage === item.url)

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleThumbnailClick(item)}
                className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white ${
                  isSelected
                    ? "border-[#4e3dc7] ring-2 ring-indigo-200 ring-offset-1 scale-105 shadow-sm"
                    : "border-slate-200 hover:border-indigo-300 opacity-80 hover:opacity-100"
                }`}
                title={item.label}
              >
                <div className="relative w-full h-full rounded-lg overflow-hidden">
                  <Image
                    src={item.url}
                    alt={item.label}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </div>
                {item.label && item.label !== "Үндсэн" && (
                  <span className="absolute bottom-0 inset-x-0 bg-black/60 backdrop-blur-xs text-[9px] text-white font-medium truncate px-1 py-0.5 text-center leading-tight">
                    {item.label}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
