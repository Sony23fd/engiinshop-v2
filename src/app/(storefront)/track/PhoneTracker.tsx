"use client"

import { useState, useEffect, useRef } from "react"
import { Shield, Phone, AlertCircle, RefreshCcw, CheckCircle2 } from "lucide-react"
import { startPhoneVerification } from "@/app/actions/verify-actions"
import { useRouter } from "next/navigation"

function saveVerifiedPhone(phone: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`verified_${phone}`, "true")
  }
}

export default function PhoneTracker({ phone }: { phone: string }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [smsUri, setSmsUri] = useState<string | null>(null)
  const [instruction, setInstruction] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [])

  function startPolling(sid: string, expiresAt: number) {
    if (pollRef.current) clearInterval(pollRef.current)
    pollRef.current = setInterval(async () => {
      if (Date.now() > expiresAt) {
        clearInterval(pollRef.current!)
        setError("Хугацаа дууслаа. Дахин оролдоно уу.")
        setSessionId(null); setSmsUri(null); setInstruction(null)
        return
      }
      try {
        const res = await fetch(`/api/verify-mn/status/${sid}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === "VERIFIED") {
          clearInterval(pollRef.current!)
          setSuccess(true)
          saveVerifiedPhone(phone)
          // Refresh the page to load orders securely
          router.refresh()
        } else if (data.status === "EXPIRED") {
          clearInterval(pollRef.current!)
          setError("Хугацаа дууслаа. Дахин оролдоно уу.")
          setSessionId(null); setSmsUri(null); setInstruction(null)
        }
      } catch {}
    }, 3000)
  }

  async function handleVerify() {
    setLoading(true)
    setError(null)
    const result = await startPhoneVerification(phone)
    if (!result.success) {
      setError(result.error || "Алдаа гарлаа")
      setLoading(false)
      return
    }
    
    if (result.sessionId === "already-verified" || result.sessionId === "skipped" || result.status === "VERIFIED") {
      setSuccess(true)
      saveVerifiedPhone(phone)
      router.refresh()
      return
    }

    setSessionId(result.sessionId!)
    setSmsUri(result.smsUri || null)
    setInstruction(result.displayInstruction || null)
    setLoading(false)
    if (result.sessionId && result.expiresAt) {
      startPolling(result.sessionId, new Date(result.expiresAt).getTime())
    }
  }

  if (success) {
    return (
      <div className="py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500 mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Амжилттай баталгаажлаа</h2>
        <p className="text-slate-500">Уншиж байна...</p>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto py-12 px-4">
      <div className="bg-white border rounded-2xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-6">
          <Shield className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Аюулгүй байдлын шалгалт</h2>
        <p className="text-slate-500 mb-8 text-sm">
          Таны хувийн мэдээллийг хамгаалах үүднээс <strong>{phone}</strong> дугаарыг баталгаажуулах шаардлагатай.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-medium mb-6 flex items-start gap-2 text-left">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {!sessionId ? (
          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full bg-[#4F46E5] text-white py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#4338ca] transition-all disabled:opacity-70"
          >
            {loading ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <Phone className="w-5 h-5" />}
            {loading ? "Түр хүлээнэ үү..." : "Баталгаажуулах"}
          </button>
        ) : (
          <div className="space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 mb-6 relative hover:border-slate-300 transition-colors cursor-pointer group">
              <a href={smsUri || "#"} className="absolute inset-0 z-10"></a>
              <p className="text-sm font-medium text-slate-700 leading-relaxed group-hover:text-slate-900">
                {instruction || "Та доорх товч дээр дарж илгээх товчийг дарна уу."}
              </p>
            </div>
            
            {smsUri ? (
              <a
                href={smsUri}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-md"
              >
                📱 МЕССЕЖ ИЛГЭЭХ
              </a>
            ) : (
              <div className="w-full bg-slate-100 text-slate-500 py-4 rounded-xl font-bold flex items-center justify-center gap-2">
                <RefreshCcw className="w-5 h-5 animate-spin" /> Хүлээгдэж байна...
              </div>
            )}
            
            <button
              onClick={async () => {
                if(!sessionId) return;
                setLoading(true);
                try {
                  const res = await fetch(`/api/verify-mn/status/${sessionId}`);
                  const data = await res.json();
                  if (data.status === "VERIFIED") {
                    setSuccess(true);
                    saveVerifiedPhone(phone);
                    router.refresh();
                  } else {
                    setError("Баталгаажаагүй байна. Хэрэв та мессеж илгээсэн бол түр хүлээгээд дахин шалгана уу.");
                  }
                } catch {}
                setLoading(false);
              }}
              disabled={loading}
              className="mt-3 w-full bg-indigo-50 text-indigo-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all"
            >
              <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Баталгаажсан эсэхийг шалгах
            </button>
            
            <p className="text-xs text-slate-400 mt-4">
              Та мессежээ илгээсний дараа энэ хуудас автоматаар цааш үргэлжлэх болно.
            </p>

            {process.env.NODE_ENV === "development" && (
              <button
                onClick={async () => {
                  const { mockVerifyPhoneAction } = await import("@/app/actions/verify-actions");
                  await mockVerifyPhoneAction(sessionId);
                }}
                className="mt-4 w-full bg-emerald-100 text-emerald-700 py-2 rounded-xl font-bold text-xs hover:bg-emerald-200 transition-colors"
              >
                🛠️ DEV: Автоматаар баталгаажуулах
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
