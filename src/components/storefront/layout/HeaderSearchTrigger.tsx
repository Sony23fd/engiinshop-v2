"use client"

import { Search } from "lucide-react"

export function HeaderSearchTrigger() {
  const openSearch = () => {
    window.dispatchEvent(new CustomEvent("open-search-modal"))
  }

  return (
    <button
      type="button"
      onClick={openSearch}
      className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white/90 hover:text-white px-3.5 py-2 rounded-full text-xs font-semibold backdrop-blur-sm transition-all shadow-sm group cursor-pointer"
      title="Бараа хайх (Ctrl+K)"
    >
      <Search className="w-3.5 h-3.5 text-indigo-200 group-hover:scale-110 transition-transform" />
      <span className="hidden sm:inline">Бараа хайх...</span>
      <span className="sm:hidden">Хайх</span>
      <kbd className="hidden lg:inline-flex text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white/80 font-mono">
        ⌘K
      </kbd>
    </button>
  )
}

