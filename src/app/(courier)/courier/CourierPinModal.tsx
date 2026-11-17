"use client"

import { useState } from "react"
import { verifyCourierAccess } from "@/app/actions/courier-actions"
import { Truck, Lock, ArrowRight, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function CourierPinModal({ initialError }: { initialError?: string }) {
  const [pin, setPin] = useState("")
  const [error, setError] = useState(initialError || "")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin || pin.length < 4) {
      setError("4 оронтой PIN кодоо бүрэн оруулна уу.")
      return
    }

    setLoading(true)
    setError("")
    const res = await verifyCourierAccess(pin)
    setLoading(false)

    if (res.success) {
      router.refresh()
    } else {
      setError(res.error || "Буруу PIN код байна.")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-indigo-900 via-slate-900 to-slate-950 text-white">
      <div className="w-full max-w-sm bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-3xl shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="w-20 h-20 bg-indigo-600/30 border border-indigo-400/40 rounded-2xl flex items-center justify-center mx-auto shadow-inner text-indigo-300">
          <Truck className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Хүргэлтийн систем</h1>
          <p className="text-xs text-indigo-200/80 mt-1">Anar Korea Shop · Хүргэлтийн ажилтан</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-xs font-semibold text-indigo-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> 4 оронтой PIN код
            </label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              autoFocus
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="PIN код (жишээ: 2026)"
              className="w-full text-center tracking-widest text-2xl font-bold bg-white/10 border-2 border-white/20 text-white placeholder:text-white/30 px-4 py-3 rounded-2xl outline-none focus:border-indigo-400 focus:bg-white/20 transition-all"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-300 bg-rose-500/20 border border-rose-400/30 p-2.5 rounded-xl animate-shake">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-indigo-600/40 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 disabled:pointer-events-none text-sm"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Шалгаж байна...</>
            ) : (
              <>Нэвтрэх <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        <p className="text-[11px] text-white/40">
          PIN код авах бол Карго админтайгаа холбогдоно уу.
        </p>
      </div>
    </div>
  )
}
