import { ReactNode } from "react"
import { Outfit } from "next/font/google"
import { ToastProvider } from "@/components/ui/use-toast"
import "./globals.css"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" })

export const metadata = {
  title: "Anar Korea Shop",
  description: "Korean product procurement system",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mn" className={`${outfit.variable} ${outfit.className}`}>
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans font-medium" suppressHydrationWarning>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
