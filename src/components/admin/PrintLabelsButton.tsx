"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"

export function PrintLabelsButton({ orders }: { orders: any[] }) {
  const handlePrint = () => {
    if (orders.length === 0) {
      alert("Хэвлэх захиалга сонгоогүй байна.")
      return
    }

    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    const styles = `
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; margin: 0; padding: 20px; background: white; }
        .label { 
          width: 90mm; 
          height: 50mm; 
          border: 1px solid #000; 
          border-radius: 8px; 
          padding: 15px; 
          margin: 10px; 
          display: inline-block; 
          page-break-inside: avoid;
          box-sizing: border-box;
          position: relative;
        }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
        .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
        .order-id { font-size: 12px; color: #555; }
        .content { font-size: 14px; line-height: 1.5; }
        .bold { font-weight: bold; }
        .footer { position: absolute; bottom: 15px; left: 15px; right: 15px; display: flex; justify-content: space-between; align-items: flex-end; }
        .cargo { font-size: 16px; font-weight: bold; }
        .qty { font-size: 14px; border: 1px solid #000; padding: 2px 6px; border-radius: 4px; }
        
        @media print {
          body { padding: 0; }
          .label { border: 1px dashed #ccc; margin: 5mm; }
          @page { margin: 0; }
        }
      </style>
    `

    const content = orders.map((order) => {
      const unitCargoFee = Number(order.batch?.cargoFeeStatus || 0) * Number(order.batch?.product?.weight || 0)
      const customCargoFee = Number(order.cargoFee || 0)
      const finalCargoFee = customCargoFee > 0 ? customCargoFee * Number(order.quantity || 1) : unitCargoFee * Number(order.quantity || 1)
      
      return `
        <div class="label">
          <div class="header">
            <div class="title">${order.customerName || "Нэргүй"}</div>
            <div class="order-id">#${order.orderNumber}</div>
          </div>
          <div class="content">
            <div class="bold" style="font-size: 18px; margin-bottom: 5px;">📞 ${order.customerPhone}</div>
            <div style="font-size: 12px; color: #333; max-height: 36px; overflow: hidden;">${order.batch?.product?.name || ""}</div>
          </div>
          <div class="footer">
            <div class="cargo">Карго: ₮${finalCargoFee.toLocaleString()}</div>
            <div class="qty">${order.quantity} ш</div>
          </div>
        </div>
      `
    }).join('')

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Хүргэлтийн шошго хэвлэх</title>
          ${styles}
        </head>
        <body>
          ${content}
          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => { window.close() }, 500);
            }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <Button 
      type="button" 
      onClick={handlePrint} 
      disabled={orders.length === 0} 
      variant="outline" 
      className="h-8 border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50"
    >
      <Printer className="w-4 h-4 mr-2" />
      Шошго хэвлэх ({orders.length})
    </Button>
  )
}
