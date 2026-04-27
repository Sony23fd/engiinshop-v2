"use client"

import { useEffect, useState } from "react"
import Barcode from "react-barcode"
import { QRCodeSVG } from "qrcode.react"

export function StickerPrintClient({ 
  groups, 
  shopName, 
  shopPhone,
  appUrl
}: { 
  groups: any[][],
  shopName: string,
  shopPhone: string,
  appUrl: string
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Wait a bit for images/barcodes to render then print
    const timer = setTimeout(() => {
      window.print()
    }, 1000)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return null

  return (
    <div className="bg-slate-100 min-h-screen py-8 print:bg-white print:py-0 print:min-h-0" style={{ overflow: "visible" }}>
      
      <div className="max-w-[80mm] mx-auto space-y-8 print:space-y-0">
        
        {/* Helper text for normal view, hidden in print */}
        <div className="no-print bg-blue-100 text-blue-800 p-4 rounded-xl text-center text-sm shadow-sm">
          <p className="font-bold">Хэвлэх цонх автоматаар нээгдэнэ...</p>
          <p className="mt-1">Хэрэв нээгдэхгүй бол <b>Ctrl + P</b> дарж хэвлэнэ үү.</p>
          <button 
            onClick={() => window.print()}
            className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700"
          >
            Одоо хэвлэх
          </button>
        </div>

        {groups.map((group, groupIndex) => {
          const first = group[0]
          
          // Calculate district for route code (very basic string match)
          let routeCode = ""
          const address = (first.deliveryAddress || "").toUpperCase()
          if (address.includes("БЗД") || address.includes("БАЯНЗҮРХ")) routeCode = "БЗД"
          else if (address.includes("СБД") || address.includes("СҮХБААТАР")) routeCode = "СБД"
          else if (address.includes("ЧД") || address.includes("ЧИНГЭЛТЭЙ")) routeCode = "ЧД"
          else if (address.includes("БГД") || address.includes("БАЯНГОЛ")) routeCode = "БГД"
          else if (address.includes("СХД") || address.includes("СОНГИНОХАЙРХАН")) routeCode = "СХД"
          else if (address.includes("ХУД") || address.includes("ХАН-УУЛ") || address.includes("ХАНУУЛ")) routeCode = "ХУД"
          else if (address.includes("НАЛАЙХ")) routeCode = "НАЛАЙХ"
          else routeCode = "ОРОН НУТАГ"

          // Check if any order is unpaid
          const hasUnpaid = group.some(o => o.paymentStatus !== "COMPLETED")
          
          // Check for fragile items (simple keyword check)
          const isFragile = group.some(o => {
            const name = (o.batch?.product?.name || "").toLowerCase()
            return name.includes("гоо сайхан") || name.includes("шил") || name.includes("шингэн") || name.includes("тос") || name.includes("fragile")
          })

          const trackingLink = `${appUrl}/track?q=${first.customerPhone || first.orderNumber}`

          return (
            <div 
              key={`sticker-${groupIndex}`} 
              className="bg-white p-2 sm:p-[4mm] shadow-lg print:shadow-none print:p-0 print-page-break mx-auto"
              style={{ width: "80mm", color: "black", fontFamily: "monospace", fontSize: "14px", lineHeight: "1.3" }}
            >
              {/* Route Code */}
              {routeCode && (
                <div className="bg-black text-white text-center font-black text-2xl py-1 mb-2 tracking-widest uppercase">
                  [ {routeCode} ]
                </div>
              )}

              {/* Header */}
              <div className="text-center mb-3">
                <h1 className="font-black text-xl leading-none mb-1">{shopName}</h1>
                <p className="text-sm font-bold">Утас: {shopPhone}</p>
              </div>

              <div className="border-t-2 border-black border-dashed my-2"></div>

              {/* Customer Info */}
              <div className="mb-3">
                <p className="font-bold">ХҮЛЭЭН АВАГЧ:</p>
                <p className="font-black text-xl my-1">{first.customerPhone}</p>
                <p className="font-bold">Нэр: {first.customerName}</p>
                <p className="font-medium mt-1 leading-snug break-words">
                  Хаяг: {first.deliveryAddress || "Хаяг оруулаагүй"}
                </p>
              </div>

              <div className="border-t-2 border-black border-dashed my-2"></div>

              {/* Payment Status */}
              <div className={`text-center font-black text-lg py-1 mb-2 border-2 ${hasUnpaid ? 'border-black bg-black text-white' : 'border-black text-black'}`}>
                {hasUnpaid ? "[ ТӨЛБӨР АВНА ]" : "[ ТӨЛБӨР ТӨЛӨГДСӨН ]"}
              </div>

              {/* Orders */}
              <div className="mb-3">
                <p className="font-bold mb-1">ЗАХИАЛГЫН ЖАГСААЛТ:</p>
                <div className="space-y-2">
                  {group.map((order, i) => (
                    <div key={order.id} className="flex gap-1 items-start text-[13px]">
                      <span className="font-bold">{i+1}.</span>
                      <div className="flex-1">
                        <p className="font-bold">#{order.orderNumber}</p>
                        <p className="truncate w-[65mm]">{order.batch?.product?.name}</p>
                        <p className="font-bold">Тоо: {order.quantity} ш</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isFragile && (
                <div className="text-center font-black text-lg border-2 border-black py-1 mb-2 mt-3">
                  ⚠️ ХАГАРАМТГАЙ ⚠️
                </div>
              )}

              <div className="border-t-2 border-black border-dashed my-3"></div>

              {/* Barcode & QR Code */}
              <div className="flex flex-col items-center gap-3">
                <div className="w-full flex justify-center -ml-2">
                   <Barcode 
                     value={String(first.orderNumber)} 
                     width={1.8} 
                     height={40} 
                     displayValue={true} 
                     fontSize={12} 
                     margin={0}
                   />
                </div>

                <div className="flex flex-col items-center">
                  <p className="font-bold text-[11px] mb-1">ХҮРГЭЛТЭЭ ШАЛГАХ:</p>
                  <QRCodeSVG value={trackingLink} size={80} level="M" />
                </div>
              </div>

              <div className="text-center text-[11px] font-bold mt-4 pt-2 border-t border-black">
                Баярлалаа! Дахин үйлчлүүлээрэй.
              </div>
              
              {/* Padding for printer cut */}
              <div className="h-6 print:h-8"></div>
            </div>
          )
        })}
      </div>

      <style jsx global>{`
        @media print {
          @page { margin: 0; size: 80mm auto; }
          html, body { 
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 80mm !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          header, footer, nav, 
          aside, [class*="sidebar"],
          [class*="Toaster"] { display: none !important; }
          .no-print { display: none !important; }
          .print-page-break { 
            break-after: page;
            page-break-after: always;
          }
          .print-page-break:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}
