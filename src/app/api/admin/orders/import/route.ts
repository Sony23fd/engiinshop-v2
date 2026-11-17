import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import * as XLSX from "xlsx"
import { getCurrentAdmin, logActivity } from "@/lib/auth"
import { normalizeOptions, getVariantKey } from "@/lib/variant-utils"

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const batchId = formData.get("batchId") as string | null
    const mode = (formData.get("mode") as string) || "validate" // "validate" | "commit"

    if (!file || !batchId) {
      return NextResponse.json({ error: "file болон batchId шаардлагатай" }, { status: 400 })
    }

    const batch = await db.batch.findUnique({
      where: { id: batchId },
      include: { product: true }
    })
    if (!batch) {
      return NextResponse.json({ error: "Багц олдсонгүй" }, { status: 404 })
    }

    const admin = await getCurrentAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Хандах эрхгүй" }, { status: 401 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const wb = XLSX.read(arrayBuffer, { type: "buffer", cellDates: true })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: "" })

    if (rows.length === 0) {
      return NextResponse.json({ 
        success: false,
        error: "Excel файл дотор ямар ч захиалгын мөр олдсонгүй." 
      }, { status: 400 })
    }

    // Statuses lookup
    const statuses = await db.orderStatusType.findMany()
    const statusMap = new Map(statuses.map((s) => [s.name.trim().toLowerCase(), s.id]))
    const defaultStatus = statuses.find((s) => s.isDefault) || statuses[0]

    const parseDate = (val: any): Date | null => {
      if (!val) return null
      if (val instanceof Date) return isNaN(val.getTime()) ? null : val
      const d = new Date(String(val))
      return isNaN(d.getTime()) ? null : d
    }

    const normOptions = normalizeOptions(batch.product?.options)
    const unitPrice = Number(batch.price || 0)

    // Strict validation array
    const errors: Array<{
      rowNum: number
      customerName: string
      field: string
      error: string
      suggestion: string
      rowData: Record<string, any>
    }> = []

    const validParsedRows: Array<{
      rowNum: number
      customerName: string
      customerPhone: string
      accountNumber: string | null
      quantity: number
      totalAmount: number
      arrivalDate: Date | null
      deliveryDate: Date | null
      deliveryAddress: string | null
      wantsDelivery: boolean
      statusId: string
      selectedOptions?: Record<string, string>
      variantKey?: string | null
    }> = []

    const mongolianPhoneRegex = /(?:^|[^\d])([897]\d{7})(?:[^\d]|$)/

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // 1-based index + header row

      const customerName = String(row["Нэр"] ?? row["Харилцагчийн нэр"] ?? row["Name"] ?? "").trim()
      const rawPhone = String(row["Утас"] ?? row["Гар утас"] ?? row["Утасны дугаар"] ?? row["Phone"] ?? "").trim()
      const rawQty = row["Тоо"] ?? row["Тоо ширхэг"] ?? row["Захиалсан тоо"] ?? row["Qty"] ?? 1

      // 1. Validate Customer Name
      if (!customerName || customerName.length < 2) {
        errors.push({
          rowNum,
          customerName: customerName || "(Хоосон)",
          field: "Нэр",
          error: "Захиалагчийн нэр хоосон эсвэл хэт богино байна.",
          suggestion: "'Нэр' баганад захиалагчийн нэрийг оруулна уу.",
          rowData: row
        })
      }

      // 2. Validate Phone
      let cleanPhone = rawPhone.replace(/\+976/g, "").replace(/\s+/g, "").replace(/-/g, "").trim()
      if (!cleanPhone || !/^[897]\d{7}$/.test(cleanPhone)) {
        // Try regex match from customerName
        const phoneMatch = customerName.match(mongolianPhoneRegex)
        if (phoneMatch) {
          cleanPhone = phoneMatch[1]
        } else {
          errors.push({
            rowNum,
            customerName: customerName || `Мөр ${rowNum}`,
            field: "Утас",
            error: "8 оронтой Монгол утасны дугаар олдсонгүй.",
            suggestion: "'Утас' баганад 8 оронтой тоо бичих, эсвэл нэрний ард 8 оронтой утас (Жишээ: 99112233) оруулна уу.",
            rowData: row
          })
        }
      }

      // 3. Validate Quantity
      const quantity = Math.floor(Number(rawQty))
      if (isNaN(quantity) || quantity < 1) {
        errors.push({
          rowNum,
          customerName: customerName || `Мөр ${rowNum}`,
          field: "Тоо",
          error: `Тоо ширхэг буруу байна (${rawQty}). Хамгийн багадаа 1 байх ёстой.`,
          suggestion: "'Тоо' баганад 1 буюу түүнээс дээш бүхэл тоо бичнэ үү.",
          rowData: row
        })
      }

      // 4. Validate Variant / Options if batch has options
      let selectedOptions: Record<string, string> | undefined = undefined
      let variantKey: string | null = null

      if (normOptions.length > 0) {
        selectedOptions = {}
        for (const opt of normOptions) {
          const optVal = String(
            row[opt.name] ?? 
            (opt.name.includes("Хэмжээ") ? (row["Хэмжээ"] ?? row["Size"] ?? row["Сонголт"]) : "") ?? 
            (opt.name.includes("Өнгө") ? (row["Өнгө"] ?? row["Color"]) : "") ?? 
            ""
          ).trim()

          if (optVal) {
            // Check if matches one of valid values (case-insensitive)
            const matchedVal = opt.values.find(v => v.toLowerCase() === optVal.toLowerCase())
            if (matchedVal) {
              selectedOptions[opt.name] = matchedVal
            } else {
              errors.push({
                rowNum,
                customerName: customerName || `Мөр ${rowNum}`,
                field: opt.name,
                error: `'${optVal}' гэсэн сонголт энэ багцад байхгүй байна.`,
                suggestion: `Боломжит ${opt.name}-ийн сонголтууд: ${opt.values.join(", ")}`,
                rowData: row
              })
            }
          }
        }
        if (Object.keys(selectedOptions).length > 0) {
          variantKey = getVariantKey(normOptions, selectedOptions)
        }
      }

      // Optional fields
      const accountNumber = String(row["Дансны дугаар"] ?? row["Данс"] ?? "").trim() || null
      const arrivalDate = parseDate(row["Ирэх өдөр"])
      const deliveryDate = parseDate(row["Хүргүүлэх өдөр"])
      const deliveryAddress = String(row["Хаяг"] ?? row["Хүргэлтийн хаяг"] ?? "").trim() || null
      const wantsDelivery = !!deliveryAddress && deliveryAddress.trim() !== ""

      const statusName = String(row["Статус"] ?? row["Хуучин Статус"] ?? "").trim().toLowerCase()
      const statusId = statusMap.get(statusName) ?? defaultStatus.id

      validParsedRows.push({
        rowNum,
        customerName,
        customerPhone: cleanPhone,
        accountNumber,
        quantity: quantity > 0 ? quantity : 1,
        totalAmount: unitPrice * (quantity > 0 ? quantity : 1),
        arrivalDate,
        deliveryDate,
        deliveryAddress,
        wantsDelivery,
        statusId,
        selectedOptions,
        variantKey
      })
    }

    const isValid = errors.length === 0
    const totalQuantity = validParsedRows.reduce((sum, r) => sum + r.quantity, 0)
    const totalAmount = validParsedRows.reduce((sum, r) => sum + r.totalAmount, 0)

    // IF MODE === "VALIDATE":
    if (mode === "validate") {
      return NextResponse.json({
        success: true,
        isValid,
        totalRows: rows.length,
        errorRowsCount: errors.length,
        validRowsCount: rows.length - errors.length,
        totalQuantity,
        totalAmount,
        errors,
        preview: validParsedRows.slice(0, 10)
      })
    }

    // IF MODE === "COMMIT":
    // STRICT CHECK: If any error exists, block commit completely!
    if (!isValid) {
      return NextResponse.json({
        success: false,
        isValid: false,
        error: `Файлд нийт ${errors.length} алдаа илэрсэн тул бааз руу хадгалах боломжгүй. Бүх алдааг засварласны дараа дахин оролдоно уу.`,
        errors
      }, { status: 400 })
    }

    // Perform Atomic Transaction
    const createdOrders = await db.$transaction(async (tx) => {
      // 1. Create orders
      const orderInserts = []
      for (const r of validParsedRows) {
        const order = await tx.order.create({
          data: {
            customerName: r.customerName,
            customerPhone: r.customerPhone,
            accountNumber: r.accountNumber,
            quantity: r.quantity,
            totalAmount: r.totalAmount,
            batchId,
            paymentStatus: "CONFIRMED",
            confirmedAt: new Date(),
            confirmationMethod: "ADMIN_IMPORT",
            statusId: r.statusId,
            createdByAdmin: admin.name || "Админ",
            creationSource: "ADMIN",
            wantsDelivery: r.wantsDelivery,
            deliveryAddress: r.deliveryAddress,
            arrivalDate: r.arrivalDate,
            deliveryDate: r.deliveryDate,
            selectedOptions: r.selectedOptions
          } as any
        })
        orderInserts.push(order)
      }

      // 2. Decrement remainingQuantity and variantStock
      const newRemaining = Math.max(0, (batch.remainingQuantity || 0) - totalQuantity)
      let newVariantStock = batch.variantStock

      if (batch.variantStock && typeof batch.variantStock === "object") {
        const vStock = { ...(batch.variantStock as Record<string, number>) }
        let changed = false
        for (const r of validParsedRows) {
          if (r.variantKey && vStock[r.variantKey] !== undefined) {
            vStock[r.variantKey] = Math.max(0, vStock[r.variantKey] - r.quantity)
            changed = true
          }
        }
        if (changed) newVariantStock = vStock
      }

      await tx.batch.update({
        where: { id: batchId },
        data: {
          remainingQuantity: newRemaining,
          ...(newVariantStock && { variantStock: newVariantStock })
        } as any
      })

      return orderInserts
    })

    await logActivity({
      userId: admin.id,
      userName: admin.name,
      userRole: admin.role,
      action: "Захиалга импортлов (Validate-First)",
      target: `Багц: ${batch.batchNumber} (${batch.product?.name})`,
      detail: `${createdOrders.length} ширхэг захиалга 100% алдаагүй шалгагдаж импортлогдлоо. Нийт дүн: ${totalAmount.toLocaleString()}₮`,
    })

    return NextResponse.json({
      success: true,
      isValid: true,
      created: createdOrders.length,
      totalQuantity,
      totalAmount
    })
  } catch (err: any) {
    console.error("Import API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
