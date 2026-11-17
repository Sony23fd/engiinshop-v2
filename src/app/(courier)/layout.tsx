import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Хүргэлтийн систем | Anar Korea Shop",
  description: "Хүргэлтийн ажилтанд зориулсан шуурхай удирдлагын систем",
}

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 antialiased selection:bg-indigo-500 selection:text-white">
      {children}
    </div>
  )
}
