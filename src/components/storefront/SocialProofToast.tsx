"use client"

import { useEffect, useState } from "react"
import { getRecentOrdersForSocialProof } from "@/app/actions/storefront-actions"
import { getActiveViewersCount } from "@/app/actions/analytics-actions"
import { ShoppingBag, X, CheckCircle, Users } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { mn } from "date-fns/locale"

interface Order {
  id: string
  customerName: string
  productName: string
  productImage?: string
  createdAt: string
}

export function SocialProofToast() {
  const [orders, setOrders] = useState<Order[]>([])
  const [activeCount, setActiveCount] = useState<number>(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [showViewerCount, setShowViewerCount] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const minSwipeDistance = 40 // min distance to be considered a swipe

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (sessionStorage.getItem("social_proof_dismissed") === "true") {
        setIsDismissed(true)
        return
      }
    }

    async function fetchData() {
      const [orderRes, viewerRes] = await Promise.all([
        getRecentOrdersForSocialProof(),
        getActiveViewersCount()
      ])
      
      if (orderRes.success && orderRes.orders.length > 0) {
        setOrders(orderRes.orders)
      }
      if (viewerRes.success) {
        setActiveCount(viewerRes.count)
      }
    }
    fetchData()
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      setIsDismissed(true)
      if (typeof window !== "undefined") {
        sessionStorage.setItem("social_proof_dismissed", "true")
      }
    }, 700)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    if (isLeftSwipe || isRightSwipe) {
      handleDismiss()
    }
  }

  useEffect(() => {
    if (orders.length === 0 && activeCount === 0 || isDismissed) return

    // Show toast after 5 seconds
    const initialDelay = setTimeout(() => {
      setIsVisible(true)
    }, 5000)

    // Cycle through orders and viewer count
    const interval = setInterval(() => {
      setIsVisible(false) // Hide first
      
      setTimeout(() => {
        // Simple logic to alternate: every 3 orders, show viewer count once
        if (currentIndex % 3 === 0 && currentIndex !== 0 && activeCount > 0 && !showViewerCount) {
          setShowViewerCount(true)
        } else {
          setShowViewerCount(false)
          setCurrentIndex((prev) => (prev + 1) % orders.length)
        }
        setIsVisible(true) // Show next
      }, 1000)

    }, 20000) // Show every 20 seconds

    return () => {
      clearTimeout(initialDelay)
      clearInterval(interval)
    }
  }, [orders, activeCount, isDismissed, currentIndex, showViewerCount])

  if ((orders.length === 0 && activeCount === 0) || isDismissed) return null

  const currentOrder = orders[currentIndex]

  return (
    <div 
      className={`fixed bottom-24 sm:bottom-6 left-4 sm:left-6 right-4 sm:right-auto z-50 transition-all duration-700 ease-in-out transform ${
        isVisible ? "translate-x-0 opacity-100" : "-translate-x-full sm:-translate-x-full opacity-0"
      }`}
    >
      <div 
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEndHandler}
        className="bg-white/95 sm:bg-white/90 backdrop-blur-md border border-indigo-100 rounded-2xl p-2.5 sm:p-3 shadow-2xl sm:shadow-xl flex items-center gap-2.5 sm:gap-3 w-[calc(100vw-32px)] sm:min-w-[280px] sm:w-auto max-w-[340px] relative group mx-auto sm:mx-0"
      >
        <button 
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 bg-white border shadow-md rounded-full p-1.5 sm:p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity hover:bg-slate-50 z-20"
        >
          <X className="w-3.5 h-3.5 sm:w-3 sm:h-3 text-slate-500 sm:text-slate-400" />
        </button>

        {showViewerCount && activeCount > 0 ? (
          <>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-50 border border-green-100 shrink-0 flex items-center justify-center relative">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[10px] sm:text-[11px] font-bold text-green-600 uppercase tracking-wider mb-0.5">ШИНЭ МЭДЭЭ!</p>
              <p className="text-xs sm:text-[13px] font-medium text-slate-800 leading-tight">
                Сүүлийн 1 цагт <span className="font-bold text-green-600">{activeCount} хүн</span> бараа үзэж байна
              </p>
            </div>
          </>
        ) : currentOrder ? (
          <>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center relative">
              {currentOrder.productImage ? (
                <img src={currentOrder.productImage} alt="Order" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
              )}
              <div className="absolute -top-1 -right-1 bg-white rounded-full">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 fill-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[10px] sm:text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">ШИНЭ ЗАХИАЛГА!</p>
              <p className="text-xs sm:text-[13px] font-medium text-slate-800 leading-tight mb-1 truncate whitespace-normal line-clamp-2">
                <span className="font-bold">{currentOrder.customerName}</span> {currentOrder.productName}-г захиаллаа
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[9px] sm:text-[10px] font-semibold text-slate-400">
                  {formatDistanceToNow(new Date(currentOrder.createdAt), { addSuffix: true, locale: mn })}
                </span>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
