"use client"
import { useState } from "react"
import { CheckCircle2, Loader2, ArrowRight } from "lucide-react"

export function PaymentConfirmationClient() {
  const [isConfirmed, setIsConfirmed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = () => {
    setIsLoading(true)
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false)
      setIsConfirmed(true)
      // Optional: trigger confetti or analytics event here
    }, 800)
  }

  if (isConfirmed) {
    return (
      <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-bold text-green-800 mb-2">Мэдээлэл хүлээж авлаа!</h3>
        <p className="text-sm text-green-700 font-medium">
          Бид таны гүйлгээг шалгаж байна. Амжилттай баталгаажсан үед системд автоматаар бүртгэгдэнэ.
        </p>
        <a href="/" className="mt-6 inline-flex items-center gap-2 text-green-700 bg-white border border-green-200 px-4 py-2 rounded-lg text-sm font-bold hover:bg-green-100 transition-colors">
          Нүүр хуудас руу буцах <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    )
  }

  return (
    <div className="pt-2 text-center">
      <button 
        onClick={handleConfirm}
        disabled={isLoading}
        className="w-full sm:w-auto bg-[#4F46E5] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#4338ca] transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
        {isLoading ? "Илгээж байна..." : "Би төлбөрөө шилжүүлсэн"}
      </button>
      <p className="text-sm text-slate-500 mt-4 font-medium">
        Төлбөр төлсний дараа дээрх товчийг дарж мэдэгдэнэ үү
      </p>
    </div>
  )
}
