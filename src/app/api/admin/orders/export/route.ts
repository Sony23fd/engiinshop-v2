import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import * as XLSX from "xlsx"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const batchId = searchParams.get("batchId")
    const categoryId = searchParams.get("categoryId")

    if (!batchId && !categoryId) {
      return NextResponse.json({ error: "batchId эсвэл categoryId шаардлагатай" }, { status: 400 })
    }

    const whereClause: any = {
      paymentStatus: "CONFIRMED",
      status: {
        isFinal: false,
        name: { not: "Цуцлагдсан" },
      },
    }

    if (batchId) {
      whereClause.batchId = batchId
    } else if (categoryId) {
      whereClause.batch = { categoryId }
    }

    const orders = await db.order.findMany({
      where: whereClause,
      include: { 
        status: true,
        batch: {
          include: { product: true }
        }
      },
      orderBy: { orderNumber: "asc" },
    })

    const rows = orders.map((o) => ({
      "Барааны нэр": o.batch?.product?.name ?? "",
      "Захиалгын дугаар": o.orderNumber,
      "Нэр": o.customerName,
      "Утасны дугаар": o.customerPhone ?? "",
      "Дансны дугаар": o.accountNumber ?? "",
      "Тоо": o.quantity,
      "Ирэх өдөр": o.arrivalDate ? new Date(o.arrivalDate).toISOString().split("T")[0] : "",
      "Хүргүүлэх өдөр": o.deliveryDate ? new Date(o.deliveryDate).toISOString().split("T")[0] : "",
      "Статус": o.status?.name ?? "",
      "Хаяг": o.deliveryAddress ?? "",
      "Карго үнэ": Number(o.cargoFee ?? 0),
    }))

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)

    ws["!cols"] = [
      { wch: 20 }, // Барааны нэр
      { wch: 16 }, // Захиалгын дугаар
      { wch: 18 }, // Нэр
      { wch: 14 }, // Утас
      { wch: 16 }, // Дансны дугаар
      { wch: 6  }, // Тоо
      { wch: 12 }, // Ирэх өдөр
      { wch: 14 }, // Хүргүүлэх өдөр
      { wch: 22 }, // Статус
      { wch: 32 }, // Хаяг
      { wch: 10 }, // Карго үнэ
    ]

    XLSX.utils.book_append_sheet(wb, ws, "Захиалгууд")
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    const filename = `orders-${categoryId || batchId}-${new Date().toISOString().split("T")[0]}.xlsx`

    return new NextResponse(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    console.error("Export error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
