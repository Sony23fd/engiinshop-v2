import { Search, Loader2 } from "lucide-react"

export default function TrackOrderLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="py-8 max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-50 flex flex-col items-center justify-center min-h-[400px]">
          <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 mx-auto mb-6 relative">
            <Search className="w-10 h-10 absolute opacity-20" />
            <Loader2 className="w-10 h-10 animate-spin absolute text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Мэдээлэл татаж байна...</h2>
          <p className="text-slate-500">Түр хүлээнэ үү</p>
        </div>
      </div>
    </div>
  )
}
