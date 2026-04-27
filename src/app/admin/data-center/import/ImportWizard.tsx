"use client"

import { useState } from "react"
import * as XLSX from "xlsx"
import { UploadCloud, CheckCircle, Database, AlertCircle, FileSpreadsheet, Download, RefreshCcw, ArrowLeft } from "lucide-react"
import { runImportTransaction, restoreFullDatabase } from "@/app/actions/import-actions"

type OrderStatus = { id: string; name: string; color: string | null }

export function ImportWizard({ existingStatuses }: { existingStatuses: OrderStatus[] }) {
  const [step, setStep] = useState(1)
  const [rows, setRows] = useState<any[]>([])
  const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([])
  const [statusMap, setStatusMap] = useState<Record<string, string>>({})
  const [nativeBackupData, setNativeBackupData] = useState<any>(null)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)

  // Calculate overview
  const totalCategories = new Set(rows.map(r => r["Ангиллын нэр"])).size
  const totalProducts = new Set(rows.map(r => r["Барааны нэр"])).size
  const totalOrders = rows.length

  function downloadTemplate() {
    const ws = XLSX.utils.json_to_sheet([
      {
        "Ангиллын нэр": "2024.03 Сарын багц",
        "Барааны нэр": "Футболк",
        "Зорилтот тоо": 100,
        "Барааны жин": 0.3,
        "Барааны үнэ": 25000,
        "Карго үнэ": 1500,
        "Харилцагчийн нэр": "Бат-Эрдэнэ",
        "Гар утас": 99112233,
        "Данс": 5000000000,
        "Захиалсан тоо": 2,
        "Хүргэлтийн хаяг": "БГД 1-р хороо",
        "Хуучин Статус": "Ирсэн"
      }
    ])
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Загвар")
    XLSX.writeFile(wb, "Import_Template.xlsx")
  }

  function processExtractedData(data: any[]) {
    if (data.length === 0) throw new Error("Файл дата хоосон байна");
    
    const firstRow = data[0];
    const required = ["Ангиллын нэр", "Барааны нэр", "Харилцагчийн нэр"];
    for (const req of required) {
      if (firstRow[req] === undefined) {
        const foundCols = Object.keys(firstRow).join(", ");
        throw new Error(`Загвар буруу: '${req}' багана олдсонгүй (эсвэл үсгийн алдаа/зай авсан байж магадгүй). Олдсон баганууд: [${foundCols}].`);
      }
    }

    const cleanData = data.map(r => ({
      ...r,
      "Ангиллын нэр": String(r["Ангиллын нэр"] || "").trim(),
      "Барааны нэр": String(r["Барааны нэр"] || "").trim(),
      "Харилцагчийн нэр": String(r["Харилцагчийн нэр"] || "").trim(),
      "Гар утас": String(r["Гар утас"] || "").replace(/\D/g, '').trim(),
      "Захиалсан тоо": Number(r["Захиалсан тоо"] || 1),
      "Хуучин Статус": String(r["Хуучин Статус"] || "Тодорхойгүй").trim()
    })).filter(r => r["Ангиллын нэр"] && r["Барааны нэр"] && r["Харилцагчийн нэр"]);

    setRows(cleanData);
    const statuses = Array.from(new Set(cleanData.map(r => r["Хуучин Статус"])));
    setUniqueStatuses(statuses);
    
    const initialMap: Record<string, string> = {};
    statuses.forEach(s => {
      const match = existingStatuses.find(es => es.name.toLowerCase() === s.toLowerCase());
      if (match) initialMap[s] = match.id;
    });
    setStatusMap(initialMap);

    setStep(2);
    setError("");
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const isJson = file.name.toLowerCase().endsWith(".json")
    const reader = new FileReader()

    reader.onload = (evt) => {
      try {
        if (isJson) {
           const jsonStr = evt.target?.result as string;
           const parsed = JSON.parse(jsonStr);
           let rawData: any[] = [];
           if (Array.isArray(parsed)) {
             rawData = parsed;
           } else if (parsed && parsed.metadata && parsed.data && Array.isArray(parsed.data.orders)) {
             // Real Database Backup Formatter - Switch to Native Restore Mode
             setNativeBackupData(parsed.data);
             setStep(4);
             return;
           } else if (parsed && parsed.data && Array.isArray(parsed.data.orders)) {
             const dbData = parsed.data;
             dbData.orders.forEach((o: any) => {
                const batch = dbData.batches?.find((b: any) => b.id === o.batchId);
                const category = dbData.categories?.find((c: any) => c.id === batch?.categoryId);
                const product = dbData.products?.find((p: any) => p.id === batch?.productId);
                const status = dbData.orderStatusTypes?.find((s: any) => s.id === o.statusId);

                rawData.push({
                  "Ангиллын нэр": category?.name || "Тодорхойгүй ангилал",
                  "Барааны нэр": product?.name || "Тодорхойгүй бараа",
                  "Зорилтот тоо": batch?.targetQuantity || 0,
                  "Барааны жин": product?.weight || 0,
                  "Барааны үнэ": typeof batch?.price === 'number' && batch.price > 0 ? batch.price : (product?.price || 0),
                  "Карго үнэ": batch?.cargoFeeStatus || "",
                  "Харилцагчийн нэр": o.customerName,
                  "Гар утас": o.customerPhone,
                  "Данс": o.accountNumber || "",
                  "Захиалсан тоо": o.quantity || 1,
                  "Хүргэлтийн хаяг": o.deliveryAddress || "",
                  "Хуучин Статус": status?.name || "Тодорхойгүй"
                });
             });
           } else if (parsed && Array.isArray(parsed.categories)) {
             // Legacy nested JSON structure flattener
              parsed.categories.forEach((cat: any) => {
               cat.batches?.forEach((b: any) => {
                 b.orders?.forEach((o: any) => {
                    rawData.push({
                      "Ангиллын нэр": cat.name,
                      "Барааны нэр": b.product?.name || b.productId || "Тодорхойгүй бараа",
                      "Зорилтот тоо": b.targetQuantity || 0,
                      "Барааны жин": b.product?.weight || 0,
                      "Барааны үнэ": typeof b.price === 'number' ? b.price : (b.product?.price || 0),
                      "Карго үнэ": b.cargoFeeStatus || "",
                      "Харилцагчийн нэр": o.customerName,
                      "Гар утас": o.customerPhone,
                      "Данс": o.accountNumber || "",
                      "Захиалсан тоо": o.quantity || 1,
                      "Хүргэлтийн хаяг": o.deliveryAddress || "",
                      "Хуучин Статус": o.status?.name || "Тодорхойгүй"
                    });
                 });
               });
             });
           } else if (parsed && parsed.data && Array.isArray(parsed.data.orderParents)) {
             // Custom engiindata.json format flattener
             parsed.data.orderParents.forEach((cat: any) => {
               cat.orderSet?.forEach((b: any) => {
                 b.orderitemSet?.forEach((o: any) => {
                    const rawNameStr = String(o.name || "");
                    const phoneMatch = rawNameStr.match(/(?:^|\D)(9[0-9]|8[0-9]|7[0-9]|6[0-9])\d{6}(?:\D|$)/);
                    let phone = phoneMatch ? phoneMatch[0].replace(/\D/g, "") : "";
                    if (!phone && rawNameStr.match(/\d{8}/)) {
                      phone = rawNameStr.match(/\d{8}/)![0];
                    }
                    
                    let cleanName = rawNameStr;
                    if (phone) {
                      cleanName = cleanName.replace(phone, "").trim();
                    }
                    cleanName = cleanName.replace(/^[,\s-]+|[,\s-]+$/g, "");
                    if (!cleanName) cleanName = "Тодорхойгүй";

                    rawData.push({
                      "Ангиллын нэр": cat.name || "Тодорхойгүй ангилал",
                      "Барааны нэр": b.name || "Тодорхойгүй бараа",
                      "Зорилтот тоо": b.goal || 0,
                      "Барааны жин": Number(b.weight) || 0,
                      "Барааны үнэ": 0,
                      "Карго үнэ": "",
                      "Тайлбар": b.description || "",
                      "Харилцагчийн нэр": cleanName,
                      "Гар утас": phone,
                      "Данс": String(o.phoneNumber || ""), // mapped as requested
                      "Захиалсан тоо": o.quantity || 1,
                      "Хүргэлтийн хаяг": o.address || "",
                      "Хуучин Статус": o.status?.name || "Тодорхойгүй"
                    });
                 });
               });
             });
           } else {
             throw new Error("JSON бүтэц танигдсангүй. Массив эсвэл Backup бүтэц байх ёстой.");
           }
           processExtractedData(rawData);
        } else {
           const bstr = evt.target?.result
           const wb = XLSX.read(bstr, { type: "binary" })
           const wsname = wb.SheetNames[0]
           const ws = wb.Sheets[wsname]
           const data: any[] = XLSX.utils.sheet_to_json(ws)
           processExtractedData(data);
        }
      } catch (err: any) {
        setError(err.message || "Алдаа гарлаа. Файлын загвар тохирохгүй байна.")
      }
    }
    
    if (isJson) {
      reader.readAsText(file)
    } else {
      reader.readAsArrayBuffer(file)
    }
  }

  async function handleImport() {
    setLoading(true)
    setError("")
    try {
      // Build the structured JSON tree from the flat rows
      const categoriesMap: Record<string, any> = {}

      for (const row of rows) {
        const catName = row["Ангиллын нэр"]
        if (!categoriesMap[catName]) {
          categoriesMap[catName] = {
            name: catName,
            batchesMap: {}
          }
        }

        const prodName = row["Барааны нэр"]
        if (!categoriesMap[catName].batchesMap[prodName]) {
          categoriesMap[catName].batchesMap[prodName] = {
            productName: prodName,
            targetQuantity: Number(row["Зорилтот тоо"] || 0),
            weight: Number(row["Барааны жин"] || 0),
            price: Number(row["Барааны үнэ"] || 0),
            cargoFeeStatus: String(row["Карго үнэ"] || ""),
            description: String(row["Тайлбар"] || ""),
            orders: []
          }
        }

        // Append order to the batch
        categoriesMap[catName].batchesMap[prodName].orders.push({
          customerName: row["Харилцагчийн нэр"],
          customerPhone: row["Гар утас"],
          accountNumber: String(row["Данс"] || ""),
          quantity: Number(row["Захиалсан тоо"] || 1),
          deliveryAddress: row["Хүргэлтийн хаяг"],
          mappedStatusId: statusMap[row["Хуучин Статус"]] || null
        })
      }

      // Convert maps to arrays
      const payload = {
        categories: Object.values(categoriesMap).map((cat: any) => ({
          name: cat.name,
          batches: Object.values(cat.batchesMap)
        }))
      }

      // Send to server
      const res = await runImportTransaction(payload)
      if (res.success) {
        setSuccess(true)
        setStep(3)
      } else {
        throw new Error(res.error || "Импорт бүтэлгүйтлээ")
      }

    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRestoreNative() {
    setLoading(true)
    setError("")
    try {
      const res = await restoreFullDatabase(nativeBackupData)
      if (res.success) {
        setSuccess(true)
        setStep(3)
      } else {
        throw new Error(res.error || "Сэргээх явцад алдаа гарлаа")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success && step === 3) {
    return (
      <div className="bg-white border rounded-xl shadow-sm text-center py-20 px-6">
         <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
           <CheckCircle className="w-10 h-10" />
         </div>
         <h2 className="text-2xl font-bold text-slate-900 mb-2">Амжилттай Импортоллоо</h2>
         <p className="text-slate-500 mb-8 max-w-sm mx-auto">Таны хуучин дата амжилттай цэвэрлэгдэн шинэ системийн өгөгдлийн санд нэмэгдлээ.</p>
         <button onClick={() => window.location.href = "/admin/orders"} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
           Бүх захиалга руу очих
         </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 1 ? 'bg-indigo-100' : 'bg-slate-100'}`}>1</div>
          <span className="ml-2 text-sm font-semibold">Файл оруулах</span>
        </div>
        <div className={`w-12 h-1 mx-4 ${step >= 2 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 2 ? 'bg-indigo-100' : 'bg-slate-100'}`}>2</div>
          <span className="ml-2 text-sm font-semibold">Маппинг & Шалгах</span>
        </div>
        <div className={`w-12 h-1 mx-4 ${step >= 3 ? 'bg-indigo-600' : 'bg-slate-200'}`}></div>
        <div className={`flex items-center ${step >= 3 ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step >= 3 ? 'bg-indigo-100' : 'bg-slate-100'}`}>3</div>
          <span className="ml-2 text-sm font-semibold">Дуусгах</span>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3 text-red-700">
           <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
           <div className="text-sm font-medium">{error}</div>
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Мэдээлэл импортлох</h2>
            <p className="text-sm text-slate-500">Та хуучин системд бүртгэлтэй жагсаалтаа эхлээд загвар Excel файл руу хуулж бэлдээд энд оруулна уу.</p>
          </div>

          <div className="bg-slate-50 border rounded-lg p-5 flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-800 text-sm">1. Загвар файл татах</p>
              <p className="text-xs text-slate-500 mt-0.5">Бэлэн багануудтай Excel загварыг татаж авч ашиглана уу.</p>
            </div>
            <button onClick={downloadTemplate} className="flex items-center gap-1.5 bg-white border shadow-sm hover:bg-slate-50 text-slate-700 text-sm px-3 py-1.5 rounded-md font-medium transition-colors">
              <Download className="w-4 h-4" /> Загвар татах
            </button>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors relative">
             <input 
               type="file" 
               accept=".xlsx, .xls, .csv, .json"
               onChange={handleFileUpload}
               className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
             />
             <UploadCloud className="w-10 h-10 text-indigo-400 mx-auto mb-3" />
             <p className="text-indigo-600 font-semibold mb-1">Excel эсвэл JSON файл оруулах эсвэл чирч авчрах</p>
             <p className="text-xs text-slate-400">.xlsx, .xls, .csv, болон ухаалаг .json файл хуулах боломжтой</p>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Mapping Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
               <div className="bg-slate-50 px-5 py-4 border-b">
                 <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                   <RefreshCcw className="w-5 h-5 text-indigo-500" /> 
                   Статус уялдуулалт (Mapping)
                 </h2>
                 <p className="text-sm text-slate-500 mt-1">
                   Таны Excel файлд олдсон хуучин төлөвүүдийг шинэ системийн аль төлөв рүү хувиргаж оруулахыг сонгоно уу.
                 </p>
               </div>
               <div className="p-5 space-y-4">
                 {uniqueStatuses.length === 0 ? (
                   <p className="text-sm text-slate-500 italic">Захиалгын статус/төлөв олдсонгүй.</p>
                 ) : uniqueStatuses.map(status => (
                    <div key={status} className="flex items-center gap-4 border p-3 rounded-lg">
                      <div className="flex-1">
                        <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Хуучин статус</p>
                        <p className="font-bold text-slate-800 mt-0.5">"{status}"</p>
                      </div>
                      <div className="flex-shrink-0 text-slate-300">
                        <ArrowLeft className="w-5 h-5 rotate-180" />
                      </div>
                      <div className="flex-1">
                         <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">Шинэ статус (Сонгох)</p>
                         <select 
                           value={statusMap[status] || ""}
                           onChange={(e) => setStatusMap(prev => ({...prev, [status]: e.target.value}))}
                           className="w-full text-sm border-slate-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500 bg-slate-50 hover:bg-white"
                         >
                           <option value="" disabled>-- Статус сонгох --</option>
                           <option value="unmapped">⚠️ Сонгохгүй орхих (Хоосон оруулах)</option>
                           {existingStatuses.map(es => (
                             <option key={es.id} value={es.id}>{es.name}</option>
                           ))}
                         </select>
                      </div>
                    </div>
                 ))}
               </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setStep(1)} 
                className="px-5 py-2.5 rounded-lg border text-slate-600 bg-white hover:bg-slate-50 font-medium"
              >
                Буцах
              </button>
              <button 
                onClick={handleImport} 
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-70"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Database className="w-5 h-5" />
                )}
                {loading ? "Датаг оруулж байна..." : "Бүх датаг систем рүү ИМПОРТЛОХ"}
              </button>
            </div>
          </div>

          {/* Summary Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border shadow-sm p-5">
               <h3 className="font-bold text-slate-800 mb-4">Импортын хураангуй</h3>
               <div className="space-y-4">
                 <div>
                   <p className="text-xs text-slate-500">Нийт үүсэх ангилал</p>
                   <p className="text-xl font-bold text-slate-900">{totalCategories}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-500">Нийт үүсэх бараа/багц</p>
                   <p className="text-xl font-bold text-slate-900">{totalProducts}</p>
                 </div>
                 <div>
                   <p className="text-xs text-slate-500">Нийт хэрэглэгчийн захиалга</p>
                   <p className="text-xl font-bold text-indigo-600">{totalOrders}</p>
                 </div>
               </div>
            </div>

            <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 text-amber-800 text-sm leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                 <AlertCircle className="w-4 h-4" /> Санамж
              </div>
              <p>Оруулж буй өгөгдлүүд дотор дутуу байсан баганууд эсвэл нэмэлт зайг автоматаар устгаж цэвэрлэв. Ангиллын нэр болон Барааны нэр адилхан мөрүүд нэг багцад шууд нэгтгэгдэх болно.</p>
            </div>
          </div>

          {/* Data Preview Table */}
          <div className="lg:col-span-3 mt-4 border rounded-xl shadow-sm bg-white overflow-hidden">
             <div className="bg-slate-50 px-5 py-3 border-b flex items-center justify-between">
               <h3 className="font-bold text-slate-800 text-sm">Урьдчилан харах (Эхний 15 мөр)</h3>
               <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">Нийт: {rows.length} захиалга</span>
             </div>
             <div className="overflow-x-auto">
               <table className="w-full text-sm text-left">
                 <thead className="text-xs text-slate-500 bg-slate-50 uppercase">
                   <tr>
                     <th className="px-4 py-3">Ангилал</th>
                     <th className="px-4 py-3">Бараа</th>
                     <th className="px-4 py-3">Харилцагч</th>
                     <th className="px-4 py-3">Утас</th>
                     <th className="px-4 py-3">Тоо</th>
                     <th className="px-4 py-3">Хуучин Статус</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {rows.slice(0, 15).map((r, i) => (
                     <tr key={i} className="hover:bg-slate-50">
                       <td className="px-4 py-2 font-medium text-slate-900 truncate max-w-[150px]">{r["Ангиллын нэр"]}</td>
                       <td className="px-4 py-2 text-slate-600 truncate max-w-[150px]">{r["Барааны нэр"]}</td>
                       <td className="px-4 py-2 text-slate-700">{r["Харилцагчийн нэр"]}</td>
                       <td className="px-4 py-2 font-mono text-xs">{r["Гар утас"]}</td>
                       <td className="px-4 py-2 text-slate-600">{r["Захиалсан тоо"]}</td>
                       <td className="px-4 py-2">
                         <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs">{r["Хуучин Статус"]}</span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
               {rows.length > 15 && (
                 <div className="text-center py-2 bg-slate-50 border-t text-xs text-slate-500">
                   Цаана нь {rows.length - 15} мөр үргэлжилж байна...
                 </div>
               )}
             </div>
          </div>
        </div>
      )}

      {/* Step 4: Native Backup Mode */}
      {step === 4 && nativeBackupData && (
        <div className="bg-white rounded-xl border shadow-sm p-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <Database className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Бүтэн Өгөгдлийн Сан (Backup)</h2>
            <p className="text-sm text-slate-500">
              Та системийн бүтэн нөөц файлыг оруулсан байна. <br/>
              Үүнийг сэргээснээр одоогийн системийн <strong className="text-red-500">БҮХ ДАТА</strong> устгагдаж, энэ файлд байгаа датагаар бүрэн солигдох болно. (Бараанууд, зураг, видео, хэрэглэгчид г.м бүх дата хуучин хэвэндээ орно).
            </p>
          </div>

          <div className="bg-slate-50 border rounded-lg p-5">
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Олдсон мэдээллийн хураангуй:</h3>
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
              <li>Бараа (Products): <strong>{nativeBackupData.products?.length || 0}</strong></li>
              <li>Багц (Batches): <strong>{nativeBackupData.batches?.length || 0}</strong></li>
              <li>Ангилал (Categories): <strong>{nativeBackupData.categories?.length || 0}</strong></li>
              <li>Захиалга (Orders): <strong>{nativeBackupData.orders?.length || 0}</strong></li>
              <li>Хэрэглэгчид (Users): <strong>{nativeBackupData.users?.length || 0}</strong></li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <button 
              onClick={() => { setStep(1); setNativeBackupData(null); }} 
              className="px-5 py-2.5 rounded-lg border text-slate-600 bg-white hover:bg-slate-50 font-medium"
            >
              Буцах
            </button>
            <button 
              onClick={handleRestoreNative} 
              disabled={loading}
              className="flex-1 bg-red-600 text-white px-5 py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-700 disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Database className="w-5 h-5" />
              )}
              {loading ? "Сэргээж байна..." : "ТИЙМ, БҮХ ДАТАГ СЭРГЭЭХ"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
