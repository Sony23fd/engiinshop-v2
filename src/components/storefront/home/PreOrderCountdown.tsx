"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

export function PreOrderCountdown({ closingDate }: { closingDate: string }) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  })

  useEffect(() => {
    const end = new Date(closingDate).getTime()

    const updateTimer = () => {
      const now = new Date().getTime()
      const distance = end - now

      if (distance < 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true })
        return
      }

      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
        isExpired: false
      })
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)
    return () => clearInterval(interval)
  }, [closingDate])

  if (timeLeft.isExpired) {
    return (
      <div className="text-[11px] font-bold text-rose-500 uppercase tracking-wider text-center py-2 bg-rose-50 rounded-lg border border-rose-100 mb-1">
        Хугацаа дууссан
      </div>
    )
  }

  return (
    <div className="bg-amber-50 border border-amber-200/60 rounded-lg p-2 mb-1">
      <div className="flex items-center justify-center gap-1.5 text-[10px] font-semibold text-amber-700 uppercase tracking-widest mb-1">
        <Clock className="w-3 h-3" />
        Захиалга дуусахад
      </div>
      <div className="flex justify-center items-center gap-1.5 font-mono text-sm font-bold text-amber-600">
        <div className="flex flex-col items-center">
          <span className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-amber-100">{timeLeft.days.toString().padStart(2, '0')}</span>
          <span className="text-[8px] text-amber-500 mt-0.5">Өдөр</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-amber-100">{timeLeft.hours.toString().padStart(2, '0')}</span>
          <span className="text-[8px] text-amber-500 mt-0.5">Цаг</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-amber-100">{timeLeft.minutes.toString().padStart(2, '0')}</span>
          <span className="text-[8px] text-amber-500 mt-0.5">Мин</span>
        </div>
        <span>:</span>
        <div className="flex flex-col items-center">
          <span className="bg-white px-1.5 py-0.5 rounded shadow-sm border border-amber-100">{timeLeft.seconds.toString().padStart(2, '0')}</span>
          <span className="text-[8px] text-amber-500 mt-0.5">Сек</span>
        </div>
      </div>
    </div>
  )
}
