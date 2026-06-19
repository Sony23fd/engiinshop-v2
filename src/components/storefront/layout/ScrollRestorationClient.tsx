"use client"
import { useScrollRestoration } from "@/hooks/useScrollRestoration"

export function ScrollRestorationClient({ scrollKey }: { scrollKey: string }) {
  useScrollRestoration(scrollKey)
  return null
}
