"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import * as XLSX from "xlsx"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import {
  Upload,
  Download,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCcw,
  Loader2,
  XCircle,
  Info,
  ShieldAlert,
  ArrowRight
} from "lucide-react"
import { normalizeOptions } from "@/lib/variant-utils"

interface ValidationError {
  rowNum: number
  customerName: string
  field: string
  error: string
  suggestion: string
  rowData: Record<string, any>
}

interface ValidationResult {
  isValid: boolean
  totalRows: number
  errorRowsCount: number
  validRowsCount: number
  totalQuantity: number
  totalAmount: number
  errors: ValidationError[]
  preview: any[]
}

interface ImportModalProps {
  batchId: string
  batch: any
}

export function ImportModal({ batchId, batch }: ImportModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [validating, setValidating] = useState(false)
  const [committing, setCommitting] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [globalError, setGlobalError] = useState<string | null>(null)

  const normOptions = normalizeOptions(batch.product?.options)

  const resetState = () => {
    setFile(null)
    setValidationResult(null)
    setGlobalError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // 1. Download official clean template
  const downloadTemplate = () => {
    const sampleRow: Record<string, any> = {
      "Нэр": "Бат-Эрдэнэ",
      "Утас": 99112233,
      "Тоо": 1,
    }

    if (normOptions.length > 0) {
      normOptions.forEach(opt => {
        sampleRow[opt.name] = opt.values[0] || "Стандарт"
      })
    }

    sampleRow["Хаяг"] = "БГД 1-р хороо 12-34 (Салбараас авах бол хоосон үлдээнэ)"
    sampleRow["Дансны дугаар"] = "5000000000"
    sampleRow["Статус"] = "Захиалга баталгаажсан"

    const ws = XLSX.utils.json_to_sheet([sampleRow])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Захиалгын_Загвар")
    XLSX.writeFile(wb, `Захиалга_Импорт_Загвар_${batch.batchNumber || "batch"}.xlsx`)
  }

  // 2. Download error report with fix instructions
  const downloadErrorReport = () => {
    if (!validationResult || validationResult.errors.length === 0) return

    const errorRows = validationResult.errors.map(err => {
      const original = { ...(err.rowData || {}) }
      return {
        "Excel мөр": err.rowNum,
        "⚠️ ИЛЭРСЭН АЛДАА": err.error,
        "💡 ХЭРХЭН ЗАСАХ ЗӨВЛӨМЖ": err.suggestion,
        ...original
      }
    })

    const ws = XLSX.utils.json_to_sheet(errorRows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Засах_Шаардлагатай_Мөрүүд")
    XLSX.writeFile(wb, `Алдаатай_Мөрүүд_Засах_${batch.batchNumber || "batch"}.xlsx`)

    toast({
      title: "Алдааны тайлан татагдлаа",
      description: "Excel дээр алдааг засаад файлын сонголтоо дахин хийнэ үү."
    })
  }

  // 3. File selection & automatic dry-run validation
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setGlobalError(null)
    setValidationResult(null)
    setValidating(true)

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("batchId", batchId)
    formData.append("mode", "validate")

    try {
      const res = await fetch("/api/admin/orders/import", {
        method: "POST",
        body: formData
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        setGlobalError(data.error || "Файлыг шалгахад алдаа гарлаа.")
      } else {
        setValidationResult(data)
      }
    } catch (err: any) {
      setGlobalError(err.message || "Сервертэй холбогдоход алдаа гарлаа.")
    } finally {
      setValidating(false)
    }
  }

  // 4. Commit clean orders to database
  const handleCommit = async () => {
    if (!file || !validationResult || !validationResult.isValid) return

    setCommitting(true)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("batchId", batchId)
    formData.append("mode", "commit")

    try {
      const res = await fetch("/api/admin/orders/import", {
        method: "POST",
        body: formData
      })
      const data = await res.json()

      if (!res.ok || !data.success) {
        toast({
          title: "Импорт амжилтгүй",
          description: data.error || "Бааз руу хадгалахад алдаа гарлаа.",
          variant: "destructive"
        })
      } else {
        toast({
          title: "Импорт амжилттай дууслаа! 🎉",
          description: `Нийт ${data.created} захиалга 100% алдаагүй амжилттай бүртгэгдлээ.`
        })
        resetState()
        setOpen(false)
        router.refresh()
      }
    } catch (err: any) {
      toast({
        title: "Системийн алдаа",
        description: err.message,
        variant: "destructive"
      })
    } finally {
      setCommitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen)
      if (!isOpen) resetState()
    }}>
      <DialogTrigger
        type="button"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-md text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs h-9 cursor-pointer"
      >
        <Upload className="w-4 h-4 text-slate-500" />
        <span>Импорт</span>
      </DialogTrigger>

      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="text-left space-y-1 pb-3 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-indigo-600" />
              Захиалга Импортлох (Excel)
            </DialogTitle>
            <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              Багц #{batch.batchNumber || ""}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Бараа: <strong className="text-slate-800">{batch.product?.name}</strong> · Нэгжийн үнэ: {Number(batch.price || 0).toLocaleString()}₮
          </p>
        </DialogHeader>

        {/* Global Error Notice */}
        {globalError && (
          <div className="p-3 bg-red-50 text-red-900 rounded-xl border border-red-200 text-xs flex items-start gap-2 mt-4">
            <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">{globalError}</p>
          </div>
        )}

        {/* Action Header: Download Template & File Picker */}
        <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800">1. Загвар Excel файл ашиглах</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Алдаа гаргахгүй байхын тулд албан ёсны баганатай загварыг татаж ашиглана уу.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={downloadTemplate}
              className="h-8 text-xs font-semibold bg-white border-slate-200 hover:bg-slate-100 shrink-0"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-indigo-600" />
              Загвар татах (.xlsx)
            </Button>
          </div>

          <div className="border-t border-slate-200 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold text-slate-800">2. Excel файлаа сонгох</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {file ? `Сонгогдсон файл: ${file.name} (${(file.size / 1024).toFixed(1)} KB)` : "Бөглөсөн .xlsx эсвэл .xls файлаа сонгоно уу."}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileChange}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={validating || committing}
                className="h-8 text-xs font-bold bg-[#4F46E5] text-white hover:bg-[#4338ca]"
              >
                {validating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Шалгаж байна...
                  </>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5 mr-1.5" />
                    {file ? "Өөр файл сонгох" : "Файл сонгох"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Loading Spinner during validation */}
        {validating && (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-slate-500">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
            <p className="text-xs font-medium">Файлын өгөгдлийг нарийвчлан шалгаж байна...</p>
          </div>
        )}

        {/* State A: ERRORS FOUND (Strict Mode) */}
        {!validating && validationResult && !validationResult.isValid && (
          <div className="space-y-4 mt-5">
            {/* Red Alert Banner */}
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <span>🛑 Импорт зогсоогдлоо: Нийт {validationResult.errors.length} алдаа илэрсэн байна!</span>
              </div>
              <p className="text-xs text-red-800 leading-relaxed pl-7">
                Өгөгдлийн сангийн цэвэр байдлыг хангахын тулд алдаатай мөрүүдийг бааз руу <strong>оруулахаас бүрэн түдгэлзүүллээ</strong>. Доорх алдааны тайлбарын дагуу Excel файлаа засаад дахин байршуулна уу.
              </p>
              
              <div className="pl-7 pt-2 flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={downloadErrorReport}
                  className="bg-red-700 hover:bg-red-800 text-white font-bold text-xs h-8 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Алдаатай мөрүүдийг Excel болгож татах ({validationResult.errors.length})
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white border-red-300 text-red-900 hover:bg-red-100 font-bold text-xs h-8"
                >
                  <RefreshCcw className="w-3.5 h-3.5 mr-1.5" />
                  Зассан файлаа дахин уншуулах
                </Button>
              </div>
            </div>

            {/* Error Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2 border-b text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Илэрсэн алдаануудын жагсаалт ({validationResult.errors.length} мөр)</span>
                <span className="text-[11px] text-slate-500 font-normal">Excel-ийн мөрийн дугаараар</span>
              </div>

              <div className="max-h-60 overflow-y-auto divide-y divide-slate-100">
                {validationResult.errors.map((err, idx) => (
                  <div key={idx} className="p-3 text-xs hover:bg-slate-50/80 transition-colors space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded text-[11px]">
                          Мөр {err.rowNum}
                        </span>
                        <strong className="text-slate-900">{err.customerName}</strong>
                      </div>
                      <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-medium">
                        Талбар: {err.field}
                      </span>
                    </div>
                    <p className="text-red-700 font-medium pl-1 text-[11.5px]">
                      • {err.error}
                    </p>
                    <p className="text-slate-500 pl-1 text-[11px] flex items-center gap-1">
                      <span className="font-semibold text-slate-700">💡 Зөвлөмж:</span> {err.suggestion}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* State B: 100% VALID (Ready to Commit) */}
        {!validating && validationResult && validationResult.isValid && (
          <div className="space-y-4 mt-5">
            {/* Green Banner */}
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5 text-emerald-900">
              <div className="flex items-center gap-2 font-bold text-sm text-emerald-950">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Бүх {validationResult.totalRows} захиалгын мэдээлэл 100% шалгалтад тэнцлээ!</span>
              </div>
              <p className="text-xs text-emerald-800 pl-7 leading-relaxed">
                Файлд ямар ч алдаа илрээгүй тул бааз руу алдаагүй, найдвартай импортлоход бэлэн боллоо.
              </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border text-center space-y-0.5">
                <span className="text-[11px] text-slate-500 font-medium">Нийт захиалга</span>
                <p className="text-lg font-extrabold text-indigo-700">{validationResult.totalRows}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border text-center space-y-0.5">
                <span className="text-[11px] text-slate-500 font-medium">Нийт ширхэг</span>
                <p className="text-lg font-extrabold text-slate-800">{validationResult.totalQuantity}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border text-center space-y-0.5">
                <span className="text-[11px] text-slate-500 font-medium">Нийт мөнгөн дүн</span>
                <p className="text-sm font-extrabold text-emerald-700">{validationResult.totalAmount.toLocaleString()}₮</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border text-center space-y-0.5">
                <span className="text-[11px] text-slate-500 font-medium">Баталгаажсан утас</span>
                <p className="text-sm font-extrabold text-blue-700">100% ({validationResult.totalRows})</p>
              </div>
            </div>

            {/* Preview Table */}
            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <div className="bg-slate-100 px-4 py-2 border-b text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Эхний {Math.min(5, validationResult.preview.length)} захиалгын урьдчилсан харагдац</span>
                <span className="text-[11px] text-slate-500 font-normal">Нийт {validationResult.totalRows} мөр</span>
              </div>
              <div className="divide-y divide-slate-100 overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b">
                    <tr>
                      <th className="p-2">Мөр</th>
                      <th className="p-2">Нэр</th>
                      <th className="p-2">Утас</th>
                      <th className="p-2">Тоо</th>
                      {normOptions.length > 0 && <th className="p-2">Сонголт</th>}
                      <th className="p-2">Хаяг</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {validationResult.preview.slice(0, 5).map((r, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2 font-mono text-slate-400">#{r.rowNum}</td>
                        <td className="p-2 font-medium text-slate-900">{r.customerName}</td>
                        <td className="p-2 font-mono text-emerald-700 font-bold">{r.customerPhone}</td>
                        <td className="p-2">{r.quantity}ш</td>
                        {normOptions.length > 0 && (
                          <td className="p-2">
                            {r.selectedOptions ? Object.values(r.selectedOptions).join(" / ") : "-"}
                          </td>
                        )}
                        <td className="p-2 text-slate-500 truncate max-w-[150px]">
                          {r.deliveryAddress || "Салбараас авна"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Big Commit Button */}
            <Button
              type="button"
              disabled={committing}
              onClick={handleCommit}
              className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-200 mt-3"
            >
              {committing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Бааз руу аюулгүй хадгалж байна...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {validationResult.totalRows} Захиалгыг Бааз руу Импортлох
                </>
              )}
            </Button>
          </div>
        )}

        {/* State C: Initial state info rules */}
        {!file && (
          <div className="mt-4 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 text-xs text-indigo-950">
            <div className="flex items-center gap-1.5 font-bold text-indigo-900">
              <Info className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Шалгалтын үндсэн дүрмүүд:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11.5px] pl-1 leading-relaxed">
              <li><strong>Утас</strong>: 8 оронтой Монгол утасны дугаарыг "Утас" баганад (эсвэл нэр дотор) оруулсан байх.</li>
              <li><strong>Нэр</strong>: Хэрэглэгчийн нэр хоосон байж болохгүй.</li>
              <li><strong>Тоо ширхэг</strong>: Хамгийн багадаа 1 бүхэл тоо байх ёстой.</li>
              {normOptions.length > 0 && (
                <li>
                  <strong>Сонголт</strong>: Тухайн багцын боломжит сонголтуудаас ({normOptions.map(o => `${o.name}: ${o.values.join(",")}`).join("; ")}) бичсэн байх.
                </li>
              )}
              <li>Хэрэв файлд 1 ч алдаа илэрвэл систем бааз руу оруулахгүйгээр танд зааварчилгааг харуулна.</li>
            </ul>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
