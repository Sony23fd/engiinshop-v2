import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import * as XLSX from "xlsx"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const batchId = formData.get("batchId") as string | null

    if (!file || !batchId) {
      return NextResponse.json({ error: "file болон batchId шаардлагатай" }, { status: 400 })
    }

    const batch = await db.batch.findUnique({ where: { id: batchId } })
    if (!batch) {
      return NextResponse.json({ error: "Batch олдсонгүй" }, { status: 404 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const wb = XLSX.read(arrayBuffer, { type: "buffer", cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" })

    if (rows.length === 0) {
      return NextResponse.json({ error: "Excel файл хоосон байна" }, { status: 400 })
    }

    // Statuses: name → id lookup
    const statuses = await db.orderStatusType.findMany()
    const statusMap = new Map(statuses.map((s) => [s.name.trim().toLowerCase(), s.id]))
    const defaultStatus = statuses.find((s) => s.isDefault)

    const parseDate = (val: any): Date | null => {
      if (!val) return null
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val
      const d = new Date(String(val))
      return isNaN(d.getTime()) ? null : d
    }

    let created = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2

      const customerName = String(row["Нэр"] ?? "").trim()
      const customerPhone = String(row["Утас"] ?? "").trim()

      if (!customerName) {
        errors.push(`Мөр ${rowNum}: Нэр хоосон байна`)
        continue
      }

      const statusName = String(row["Статус"] ?? "").trim().toLowerCase()
      const statusId = statusMap.get(statusName) ?? defaultStatus?.id ?? null

      // Optional fields — can be empty
      const accountNumber = String(row["Дансны дугаар"] ?? "").trim() || null
      const quantity = Number(row["Тоо"]) || 1
      const arrivalDate = parseDate(row["Ирэх өдөр"])
      const deliveryDate = parseDate(row["Хүргүүлэх өдөр"])
      const deliveryAddress = String(row["Хаяг"] ?? "").trim() || null
      // Захиалгын дугаар column is IGNORED — Prisma auto-increments it
      // Карго үнэ — auto-calculated field, not imported; defaults to 0

      try {
        await (db.order as any).create({
          data: {
            customerName,
            customerPhone: customerPhone || "00000000",
            accountNumber,
            quantity,
            batchId,
            paymentStatus: "CONFIRMED",
            statusId,
            ...(arrivalDate && { arrivalDate }),
            ...(deliveryDate && { deliveryDate }),
            ...(deliveryAddress && { deliveryAddress }),
          },
        })
        created++
      } catch (e: any) {
        errors.push(`Мөр ${rowNum} (${customerName}): ${e.message}`)
      }
    }

    return NextResponse.json({ success: true, created, updated: 0, errors })
  } catch (err: any) {
    console.error("Import error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
