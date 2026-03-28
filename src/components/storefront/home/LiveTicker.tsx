"use client"
import { useEffect, useState } from "react"
import { ShoppingBag } from "lucide-react"

const MOCK_MESSAGES = [
  "Саяхан Батдорж X барааг сагсаллаа",
  "Саяхан Номин Y чийгшүүлэгчийг захиаллаа",
  "Сүүлийн 1 цагт 12 хүн бараа үзэж байна",
  "Саяхан Тэмүүлэн Z хүрэм худалдан авлаа"
]

export function LiveTicker() {
  const [msgIdx, setMsgIdx] = useState(0)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Initial delay before showing first message
    const initialTimer = setTimeout(() => {
      setVisible(true)
    }, 3000)

    // Interval to cycle messages
    const cycleTimer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setMsgIdx(prev => (prev + 1) % MOCK_MESSAGES.length)
        setVisible(true)
      }, 500) // wait for fade out before changing text and fading in
    }, 8000)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(cycleTimer)
    }
  }, [])

  return (
    <div 
      className={`fixed bottom-6 left-6 z-50 transition-all duration-500 ease-out flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-xl shadow-indigo-900/10 border border-slate-200/50 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`}
    >
      <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center relative flex-shrink-0">
        <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 border-white animate-pulse"></span>
        <ShoppingBag className="w-4 h-4 text-[#4e3dc7]" />
      </div>
      <p className="text-sm font-medium text-slate-700 pr-2">
        {MOCK_MESSAGES[msgIdx]}
      </p>
    </div>
  )
}
