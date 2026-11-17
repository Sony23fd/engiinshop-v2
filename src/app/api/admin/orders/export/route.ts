import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import * as XLSX from "xlsx"
import { getCurrentAdmin } from "@/lib/auth"
import { formatSelectedOptions } from "@/lib/variant-utils"

export async function GET(req: NextRequest) {
  try {
    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    const rows = orders.map((o) => {
      const isFree = Boolean(o.batch?.product?.isFreeCargo || o.batch?.isFreeCargo);
      const unitCargo = Number(o.batch?.cargoFeeStatus || 0) * Number(o.batch?.product?.weight || 0);
      const customCargo = Number(o.cargoFee || 0);
      const finalCargo = isFree ? 0 : (customCargo > 0 ? customCargo * o.quantity : unitCargo * o.quantity);

      return {
        "Барааны нэр": o.batch?.product?.name ?? "",
        "Сонголт / Size": formatSelectedOptions(o.selectedOptions),
        "Захиалгын дугаар": o.orderNumber,
        "Нэр": o.customerName,
        "Утасны дугаар": o.customerPhone ?? "",
        "Дансны дугаар": o.accountNumber ?? "",
        "Тоо": o.quantity,
        "Захиалсан огноо": new Date(o.createdAt).toLocaleDateString("mn-MN"),
        "Ирэх өдөр": o.arrivalDate ? new Date(o.arrivalDate).toISOString().split("T")[0] : "",
        "Хүргүүлэх өдөр": o.deliveryDate ? new Date(o.deliveryDate).toISOString().split("T")[0] : "",
        "Статус": o.status?.name ?? "",
        "Хаяг": o.deliveryAddress ?? "",
        "Карго үнэ": finalCargo,
        "Нийт дүн": Number(o.totalAmount ?? 0),
        "Хүргэлт": o.wantsDelivery ? "Хүргэлтээр" : "Өөрөө авах",
      };
    })

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(rows)

    ws["!cols"] = [
      { wch: 22 }, // Барааны нэр
      { wch: 20 }, // Сонголт / Size
      { wch: 16 }, // Захиалгын дугаар
      { wch: 18 }, // Нэр
      { wch: 14 }, // Утас
      { wch: 16 }, // Дансны дугаар
      { wch: 6  }, // Тоо
      { wch: 14 }, // Захиалсан огноо
      { wch: 12 }, // Ирэх өдөр
      { wch: 14 }, // Хүргүүлэх өдөр
      { wch: 18 }, // Статус
      { wch: 30 }, // Хаяг
      { wch: 12 }, // Карго үнэ
      { wch: 14 }, // Нийт дүн
      { wch: 12 }, // Хүргэлт
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
