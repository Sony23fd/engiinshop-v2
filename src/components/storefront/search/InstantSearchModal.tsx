"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Search, X, Loader2, Clock, CheckCircle2, ArrowRight, Sparkles } from "lucide-react"
import { getInstantSearchResults } from "@/app/actions/product-actions"

const POPULAR_SUGGESTIONS = [
  "Крем",
  "Маск",
  "Хувцас",
  "Бэлэн байгаа",
  "Карго 0₮",
  "Урьдчилсан"
]

export function InstantSearchModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    window.addEventListener("open-search-modal", handleOpen)

    // Keyboard shortcut (Ctrl+K or Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        handleOpen()
      } else if (e.key === "Escape" && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("open-search-modal", handleOpen)
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    const timer = setTimeout(async () => {
      const res = await getInstantSearchResults(query)
      if (res.success) {
        setResults(res.results || [])
      }
      setLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [query])

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setIsOpen(false)
    router.push(`/shop?q=${encodeURIComponent(query.trim())}`)
  }

  function handleSuggestionClick(term: string) {
    if (term === "Карго 0₮") {
      setIsOpen(false)
      router.push("/shop?freeCargo=true")
    } else if (term === "Бэлэн байгаа") {
      setIsOpen(false)
      router.push("/shop?status=ready")
    } else if (term === "Урьдчилсан") {
      setIsOpen(false)
      router.push("/shop?status=preorder")
    } else {
      setQuery(term)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center p-4 sm:p-6 md:p-20 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <form onSubmit={handleSearchSubmit} className="p-4 border-b border-slate-100 flex items-center gap-3 relative">
          <Search className="w-5 h-5 text-indigo-600 shrink-0 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Бүтээгдэхүүний нэр, брэнд, ангилал хайх..."
            className="flex-1 bg-transparent text-sm sm:text-base font-medium text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          {loading && <Loader2 className="w-4 h-4 text-indigo-600 animate-spin shrink-0" />}
          {query && !loading && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1 rounded-lg bg-slate-100 transition-colors"
          >
            Esc
          </button>
        </form>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* If no query, show popular search terms */}
          {!query.trim() && (
            <div className="space-y-3 py-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Түгээмэл хайлтууд
              </p>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSuggestionClick(s)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 transition-colors border border-slate-200/60"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results List */}
          {results.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Илэрц ({results.length})
              </p>
              <div className="space-y-1.5">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    href={`/product/${item.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-indigo-50/60 transition-colors group border border-transparent hover:border-indigo-100"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden relative shrink-0">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                          sizes="48px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                          Зураггүй
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </span>
                        {item.isFreeCargo && (
                          <span className="shrink-0 text-[9px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
                            ✈️ 0₮
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-bold text-slate-900">₮{item.price.toLocaleString()}</span>
                        {item.isPreOrder && (
                          <span className="text-amber-600 font-semibold">· Урьдчилсан</span>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* No results state */}
          {query.trim() && !loading && results.length === 0 && (
            <div className="text-center py-10 space-y-2">
              <p className="text-sm font-bold text-slate-700">"{query}" нэртэй бараа олдсонгүй</p>
              <p className="text-xs text-slate-400">
                Бичиглэлээ шалгаад эсвэл өөр үгээр хайж үзнэ үү.
              </p>
            </div>
          )}
        </div>

        {/* Footer Link to /shop */}
        {query.trim() && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Дэлгүүрийн каталог руу шилжих</span>
            <button
              type="button"
              onClick={handleSearchSubmit}
              className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              <span>"{query}" хайлтын бүх үр дүн</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

