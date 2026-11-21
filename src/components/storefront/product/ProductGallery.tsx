"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import Image from "next/image"
import { Package, Video, Image as ImageIcon, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import { ProductOption } from "@/lib/variant-utils"

interface ProductGalleryProps {
  defaultImageUrl?: string | null
  images?: string[]
  activeImageUrl?: string | null
  productName: string
  videoUrl?: string | null
  isPreOrder?: boolean
  isFreeCargo?: boolean
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
  images = [],
  activeImageUrl,
  productName,
  videoUrl,
  isPreOrder,
  isFreeCargo,
  options = [],
  selectedOptions = {},
  onSelectOption
}: ProductGalleryProps) {
  const [showVideo, setShowVideo] = useState(Boolean(videoUrl && !activeImageUrl && !defaultImageUrl))
  const [currentImage, setCurrentImage] = useState<string | null>(activeImageUrl || defaultImageUrl || (images.length > 0 ? images[0] : null))
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Touch swipe support state
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Extract all distinct images: Cover, Gallery images, and Variant-tied images
  const galleryItems = useMemo<GalleryItem[]>(() => {
    const items: GalleryItem[] = []
    const seenUrls = new Set<string>()

    // 1. Primary / Cover Image
    if (defaultImageUrl) {
      items.push({
        id: "default",
        url: defaultImageUrl,
        label: "Үндсэн",
        isDefault: true
      })
      seenUrls.add(defaultImageUrl)
    }

    // 2. Extra Product Gallery Images
    images.forEach((imgUrl, idx) => {
      if (imgUrl && !seenUrls.has(imgUrl)) {
        items.push({
          id: `gallery-${idx}`,
          url: imgUrl,
          label: `Зураг ${items.length + 1}`
        })
        seenUrls.add(imgUrl)
      }
    })

    // 3. Variant Specific Images
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
  }, [defaultImageUrl, images, options])

  // Current active index in the gallery
  const currentIndex = useMemo(() => {
    if (!currentImage || galleryItems.length === 0) return 0
    const idx = galleryItems.findIndex(item => item.url === currentImage)
    return idx >= 0 ? idx : 0
  }, [currentImage, galleryItems])

  const activeItem = galleryItems[currentIndex]

  // React smoothly when activeImageUrl changes externally (e.g. user clicked variant buttons in form)
  useEffect(() => {
    const targetUrl = activeImageUrl || defaultImageUrl || (images.length > 0 ? images[0] : null)
    if (targetUrl && targetUrl !== currentImage) {
      setIsTransitioning(true)
      const timer = setTimeout(() => {
        setCurrentImage(targetUrl)
        setShowVideo(false)
        setIsTransitioning(false)
      }, 120)
      return () => clearTimeout(timer)
    }
  }, [activeImageUrl, defaultImageUrl, images])

  // Navigate to specific gallery item
  const navigateToItem = (item: GalleryItem) => {
    setShowVideo(false)
    setCurrentImage(item.url)

    // Bidirectional sync: If this image is bound to an option, trigger parent selection
    if (item.optionName && item.optionValue && onSelectOption) {
      onSelectOption(item.optionName, item.optionValue)
    }
  }

  // Next / Previous Navigation
  const handlePrev = () => {
    if (galleryItems.length <= 1) return
    const prevIdx = (currentIndex - 1 + galleryItems.length) % galleryItems.length
    navigateToItem(galleryItems[prevIdx])
  }

  const handleNext = () => {
    if (galleryItems.length <= 1) return
    const nextIdx = (currentIndex + 1) % galleryItems.length
    navigateToItem(galleryItems[nextIdx])
  }

  // Touch Swipe Handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
    touchEndX.current = null
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return
    const diff = touchStartX.current - touchEndX.current
    const minSwipeDistance = 45

    if (diff > minSwipeDistance) {
      // Swiped Left -> Next Image
      handleNext()
    } else if (diff < -minSwipeDistance) {
      // Swiped Right -> Previous Image
      handlePrev()
    }

    touchStartX.current = null
    touchEndX.current = null
  }

  return (
    <div className="flex flex-col gap-3 select-none">
      {/* Main Image / Video Viewport */}
      <div
        className="aspect-[4/5] sm:aspect-square bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden relative border border-slate-200/80 shadow-xs group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
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

        {/* Badges Container - Stacked Vertically on Top Left */}
        <div className="absolute top-3.5 left-3.5 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
          {/* Pre-order Badge */}
          {isPreOrder && (
            <div className="bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-amber-800 flex items-center gap-1.5 shadow-sm border border-amber-200/80 uppercase tracking-wider">
              <span>📌 Урьдчилсан захиалга</span>
            </div>
          )}

          {/* Free Cargo Badge */}
          {isFreeCargo && (
            <div className="bg-emerald-600/95 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-black text-white flex items-center gap-1.5 shadow-md border border-emerald-400/50 uppercase tracking-wider">
              <span>✈️ Карго төлөхгүй</span>
            </div>
          )}
        </div>

        {/* Variant Indicator Pill on Top Right (when looking at a variant-specific photo) */}
        {!showVideo && activeItem?.optionValue && (
          <div className="absolute top-3.5 right-3.5 z-10 pointer-events-none animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-indigo-600/95 text-white backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-md border border-indigo-400/50">
              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
              <span>{activeItem.optionValue}</span>
            </div>
          </div>
        )}

        {/* Next / Previous Navigation Arrows */}
        {galleryItems.length > 1 && !showVideo && (
          <>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                handlePrev()
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 z-10 shadow-sm"
              title="Өмнөх зураг"
            >
              <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
            </button>
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                handleNext()
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md flex items-center justify-center transition-all opacity-80 sm:opacity-0 group-hover:opacity-100 z-10 shadow-sm"
              title="Дараагийн зураг"
            >
              <ChevronRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </>
        )}

        {/* Image Counter on Bottom Left */}
        {galleryItems.length > 1 && !showVideo && (
          <div className="absolute bottom-3.5 left-3.5 bg-black/60 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-full z-10 shadow-sm">
            {currentIndex + 1} / {galleryItems.length}
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

      {/* Thumbnails row (If there are multiple items) */}
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
                onClick={() => navigateToItem(item)}
                className={`relative flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 transition-all p-0.5 bg-white ${
                  isSelected
                    ? "border-indigo-600 ring-2 ring-indigo-200 ring-offset-1 scale-105 shadow-sm"
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
                  <span className="absolute bottom-0 inset-x-0 bg-black/65 backdrop-blur-xs text-[9px] text-white font-bold truncate px-1 py-0.5 text-center leading-tight">
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
