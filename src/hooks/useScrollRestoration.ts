"use client"
import { useEffect } from 'react'

export function useScrollRestoration(key: string) {
  useEffect(() => {
    // 1. Restore scroll position on mount
    const savedPosition = sessionStorage.getItem(`scroll-${key}`)
    if (savedPosition) {
      // Use a slight timeout to ensure DOM is ready
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedPosition, 10),
          behavior: 'instant'
        })
      }, 50)
    }

    // 2. Save scroll position on scroll
    let timeoutId: NodeJS.Timeout | null = null;
    const handleScroll = () => {
      if (timeoutId) return;
      timeoutId = setTimeout(() => {
        sessionStorage.setItem(`scroll-${key}`, window.scrollY.toString())
        timeoutId = null;
      }, 100);
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [key])
}
