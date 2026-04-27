"use client"

import { useState } from "react"
import { Copy, Check, Link as LinkIcon } from "lucide-react"

export default function CopyTrackingLink({ trackingRef }: { trackingRef: string }) {
  const [copied, setCopied] = useState(false)

  const trackingLink = typeof window !== 'undefined' 
    ? `${window.location.origin}/track?q=${trackingRef}`
    : `https://anarkoreashop.mn/track?q=${trackingRef}`

  function handleCopy() {
    navigator.clipboard.writeText(trackingLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 mt-6">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-blue-500 border border-blue-100">
          <LinkIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="text-[13px] font-bold text-blue-900">Захиалга шалгах линк</p>
          <p className="text-xs text-blue-700/80 mt-0.5 mb-2 leading-relaxed">
            Энэхүү линкийг хуулж аваад хүссэн үедээ захиалгынхаа явцыг шалгаарай.
          </p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={trackingLink}
              className="flex-1 bg-white border border-blue-200 text-blue-800 text-xs px-3 py-2 rounded-lg font-medium outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0 shadow-sm"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Хууллаа" : "Хуулах"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
