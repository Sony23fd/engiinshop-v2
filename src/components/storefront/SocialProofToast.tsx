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

  useEffect(() => {
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
      className={`fixed bottom-20 left-4 z-50 transition-all duration-700 ease-in-out transform ${
        isVisible ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0"
      }`}
    >
      <div className="bg-white/90 backdrop-blur-md border border-indigo-100 rounded-2xl p-3 shadow-xl flex items-center gap-3 min-w-[280px] max-w-[340px] relative group">
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute -top-2 -right-2 bg-white border shadow-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-50"
        >
          <X className="w-3 h-3 text-slate-400" />
        </button>

        {showViewerCount && activeCount > 0 ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-100 shrink-0 flex items-center justify-center relative">
              <Users className="w-6 h-6 text-green-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[11px] font-bold text-green-600 uppercase tracking-wider mb-0.5">ШИНЭ МЭДЭЭ!</p>
              <p className="text-[13px] font-medium text-slate-800 leading-tight">
                Сүүлийн 1 цагт <span className="font-bold text-green-600">{activeCount} хүн</span> бараа үзэж байна
              </p>
            </div>
          </>
        ) : currentOrder ? (
          <>
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 overflow-hidden shrink-0 flex items-center justify-center relative">
              {currentOrder.productImage ? (
                <img src={currentOrder.productImage} alt="Order" className="w-full h-full object-cover" />
              ) : (
                <ShoppingBag className="w-6 h-6 text-indigo-400" />
              )}
              <div className="absolute -top-1 -right-1">
                <CheckCircle className="w-4 h-4 text-green-500 fill-white" />
              </div>
            </div>

            <div className="flex-1 min-w-0 pr-2">
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">ШИНЭ ЗАХИАЛГА!</p>
              <p className="text-[13px] font-medium text-slate-800 leading-tight mb-1">
                <span className="font-bold">{currentOrder.customerName}</span> {currentOrder.productName}-г захиаллаа
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-[10px] font-semibold text-slate-400">
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
