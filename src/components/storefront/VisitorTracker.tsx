"use client"

import { usePathname, useSearchParams } from "next/navigation"
import { useEffect, useRef } from "react"
import { logVisit } from "@/app/actions/analytics-actions"

/**
 * Empty component that logs a visit every time the pathname changes.
 * Place in layout.tsx.
 */
export function VisitorTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPath = useRef<string | null>(null)

  useEffect(() => {
    // Construct full path with params for accurate logging
    const fullPath = pathname + (searchParams.toString() ? "?" + searchParams.toString() : "")
    
    // Simple debounce/prevent re-log on same path
    if (lastPath.current === fullPath) return
    lastPath.current = fullPath

    // Small delay to ensure route change is stable
    const timer = setTimeout(() => {
      logVisit(fullPath, document.referrer)
    }, 1000)

    return () => clearTimeout(timer)
  }, [pathname, searchParams])

  return null
}
