"use client"

import { useEffect, useState } from "react"

interface Props {
  bgColor?: string
}

export function AnimatedHeroBackground({ bgColor = "#5442cc" }: Props) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="absolute inset-0 overflow-hidden z-0" style={{ backgroundColor: bgColor }}>
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-white/10 blur-[100px]" />
         <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-white/10 blur-[100px]" />
      </div>
    )
  }

  // Create 50 random stars
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1,
    animationDelay: `${Math.random() * 5}s`,
    animationDuration: `${Math.random() * 3 + 2}s`
  }))

  // Create 5 shooting stars
  const shootingStars = Array.from({ length: 5 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 50}%`,
    left: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 8}s`,
    animationDuration: `${Math.random() * 2 + 2}s`
  }))

  return (
    <div className="absolute inset-0 overflow-hidden z-0" style={{ backgroundColor: bgColor }}>
      
      {/* Ambient gradient blobs */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-white/10 blur-[120px] mix-blend-overlay animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-300/20 blur-[100px] mix-blend-overlay animate-blob animation-delay-2000" />
      <div className="absolute top-[20%] left-[60%] w-[50%] h-[50%] rounded-full bg-pink-300/10 blur-[100px] mix-blend-overlay animate-blob animation-delay-4000" />

      {/* Static twinkling stars */}
      {stars.map((star) => (
        <div 
          key={`star-${star.id}`}
          className="absolute rounded-full bg-white opacity-0 animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: `${star.size}px`,
            height: `${star.size}px`,
            animationDelay: star.animationDelay,
            animationDuration: star.animationDuration
          }}
        />
      ))}

      {/* Shooting stars */}
      {shootingStars.map((shootingStar) => (
        <div
          key={`shooting-${shootingStar.id}`}
          className="absolute h-[2px] w-[100px] bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transform -rotate-45 animate-shooting-star"
          style={{
            left: shootingStar.left,
            top: shootingStar.top,
            animationDelay: shootingStar.animationDelay,
            animationDuration: shootingStar.animationDuration
          }}
        />
      ))}

      {/* Inline styles for custom animations to avoid polluting globals */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes twinkle {
          0% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 0.8; transform: scale(1); box-shadow: 0 0 10px rgba(255,255,255,0.5); }
          100% { opacity: 0; transform: scale(0.5); }
        }
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0) rotate(50deg); opacity: 0; }
          5% { opacity: 1; }
          15% { transform: translateX(300px) translateY(350px) rotate(50deg); opacity: 0; }
          100% { transform: translateX(300px) translateY(350px) rotate(50deg); opacity: 0; }
        }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
        .animate-twinkle { animation: twinkle linear infinite; }
        .animate-blob { animation: blob 10s infinite alternate; }
        .animate-shooting-star { animation: shooting-star linear infinite; }
        `
      }} />
    </div>
  )
}
