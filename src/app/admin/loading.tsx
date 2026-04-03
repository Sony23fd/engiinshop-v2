"use client"

import { Loader2 } from "lucide-react"

export default function AdminLoading() {
  return (
    <div className="w-full h-full flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
        <div className="space-y-3">
          <div className="h-8 w-64 bg-slate-100 rounded-md animate-pulse" />
          <div className="h-4 w-48 bg-slate-50 rounded-md animate-pulse" />
        </div>
        <div className="h-10 w-32 bg-slate-100 rounded-lg animate-pulse" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm h-32 flex flex-col justify-center gap-3">
             <div className="h-4 w-1/3 bg-slate-100 rounded animate-pulse" />
             <div className="h-8 w-2/3 bg-slate-50 rounded animate-pulse" />
          </div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex-1 min-h-[400px]">
        <div className="flex items-center gap-4 mb-8">
           <div className="h-10 w-1/3 bg-slate-100 rounded-lg animate-pulse" />
           <div className="ml-auto h-10 w-32 bg-slate-100 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-16 w-full bg-slate-50/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
      
      <div className="fixed bottom-6 right-6 p-3 bg-indigo-50 border border-indigo-100 rounded-full shadow-lg">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    </div>
  )
}
