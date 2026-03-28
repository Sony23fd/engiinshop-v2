import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OrderSuccessPage() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Захиалга амжилттай!</h1>
        <p className="text-slate-500 mb-2 text-sm">
          Таны захиалга хүлээн авлаа. Бид удахгүй та рүү холбогдох болно.
        </p>
        <p className="text-slate-400 text-xs mb-8">
          Захиалгаа шалгахдаа нүүр хуудас дээрх "Захиалга шалгах" хэсэгт дансны дугаараа оруулна уу.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/">
            <Button className="bg-[#4F46E5] hover:bg-[#4338ca]">Нүүр хуудас</Button>
          </Link>
          <Link href="/track">
            <Button variant="outline">Захиалга шалгах</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
