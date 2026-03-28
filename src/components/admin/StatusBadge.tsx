import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  color?: string | null
  className?: string
}

const COLOR_MAP: Record<string, string> = {
  slate: "bg-slate-100 text-slate-800 border-slate-200",
  gray: "bg-gray-100 text-gray-800 border-gray-200",
  red: "bg-red-100 text-red-800 border-red-200",
  orange: "bg-orange-100 text-orange-800 border-orange-200",
  amber: "bg-amber-100 text-amber-800 border-amber-200",
  yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
  lime: "bg-lime-100 text-lime-800 border-lime-200",
  green: "bg-green-100 text-green-800 border-green-200",
  emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
  teal: "bg-teal-100 text-teal-800 border-teal-200",
  cyan: "bg-cyan-100 text-cyan-800 border-cyan-200",
  sky: "bg-sky-100 text-sky-800 border-sky-200",
  blue: "bg-blue-100 text-blue-800 border-blue-200",
  indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
  violet: "bg-violet-100 text-violet-800 border-violet-200",
  purple: "bg-purple-100 text-purple-800 border-purple-200",
  fuchsia: "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  pink: "bg-pink-100 text-pink-800 border-pink-200",
  rose: "bg-rose-100 text-rose-800 border-rose-200",
}

export function StatusBadge({ status, color, className }: StatusBadgeProps) {
  let colorClass = "bg-slate-100 text-slate-800 border-slate-200"

  if (color && COLOR_MAP[color]) {
    colorClass = COLOR_MAP[color]
  } else {
    // Fallback dictionary for older statuses or when color is absent
    const s = status.toUpperCase();
    if (s.includes("PENDING") || s.includes("ХҮЛЭЭГДЭЖ") || s.includes("ХҮЛЭЭЖ")) {
      colorClass = "bg-amber-100 text-amber-800 border-amber-200"
    } else if (s.includes("CONFIRM") || s.includes("БАТАЛГААЖ")) {
      colorClass = "bg-sky-100 text-sky-800 border-sky-200"
    } else if (s.includes("SHIPPING") || s.includes("КАРГО") || s.includes("АЧИГД")) {
      colorClass = "bg-indigo-100 text-indigo-800 border-indigo-200"
    } else if (s.includes("ARRIVED") || s.includes("МОНГОЛД") || s.includes("ИРСЭН")) {
      colorClass = "bg-purple-100 text-purple-800 border-purple-200"
    } else if (s.includes("DELIVERED") || s.includes("ОЛГОГДСОН") || s.includes("ДУУССАН") || s.includes("ХҮРГЭЛТ") || s.includes("ӨӨРӨӨ")) {
      colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200"
    } else if (s.includes("REJECTED") || s.includes("ЦУЦЛАГД") || s.includes("БУЦААГД")) {
      colorClass = "bg-rose-100 text-rose-800 border-rose-200"
    }
  }

  return (
    <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", colorClass, className)}>
      {status}
    </span>
  )
}
