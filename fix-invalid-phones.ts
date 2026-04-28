/**
 * fix-invalid-phones.ts
 * 
 * Өгөгдлийн сан дахь "00000000" гэх мэт хүчингүй утасны дугааруудыг хоосон болгож засна.
 * Засагдсан захиалгуудыг хүснэгт хэлбэрээр тод ялгаруулан харуулна.
 * 
 * Ажиллуулах: npx tsx fix-invalid-phones.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const INVALID_PHONES = [
  "00000000", "11111111", "22222222", "33333333",
  "44444444", "55555555", "66666666", "77777777",
  "88888888", "99999999", "12345678", "87654321"
]

async function main() {
  console.log("\n╔══════════════════════════════════════════════════╗")
  console.log("║   🔧 ХҮЧИНГҮЙ УТАСНЫ ДУГААР ЗАСВАРЛАГЧ           ║")
  console.log("╚══════════════════════════════════════════════════╝\n")

  console.log("🔍 Хүчингүй утасны дугаартай захиалгуудыг хайж байна...\n")

  const orders = await prisma.order.findMany({
    where: {
      customerPhone: { in: INVALID_PHONES }
    },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      orderNumber: true,
      accountNumber: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" }
  })

  if (orders.length === 0) {
    console.log("✅ Засах зүйл алга. Бүх утасны дугаар хүчинтэй байна.\n")
    return
  }

  console.log(`⚠️  ${orders.length} ширхэг хүчингүй утастай захиалга олдлоо!\n`)

  // Table header
  const divider = "─".repeat(90)
  console.log(divider)
  console.log(
    "  №".padEnd(6) +
    "Захиалга".padEnd(12) +
    "Нэр".padEnd(20) +
    "Хуучин утас".padEnd(16) +
    "Данс".padEnd(18) +
    "Огноо"
  )
  console.log(divider)

  // Table rows
  for (let i = 0; i < orders.length; i++) {
    const o = orders[i]
    const date = new Date(o.createdAt).toLocaleDateString("mn-MN")
    console.log(
      `  ${(i + 1).toString().padEnd(4)}` +
      `#${(o.orderNumber?.toString() || "?").padEnd(10)}` +
      `${(o.customerName || "-").substring(0, 18).padEnd(20)}` +
      `❌ ${(o.customerPhone || "").padEnd(13)}` +
      `${(o.accountNumber || "-").substring(0, 16).padEnd(18)}` +
      `${date}`
    )
  }
  console.log(divider)

  // Fix them
  const result = await prisma.order.updateMany({
    where: {
      customerPhone: { in: INVALID_PHONES }
    },
    data: {
      customerPhone: ""
    }
  })

  console.log(`\n✅ ЗАСВАРЛАГДСАН: ${result.count} ширхэг захиалгын утасны дугаарыг "" (хоосон) болголоо.`)
  console.log("ℹ️  Эдгээр захиалгууд одоо бүлэглэлтэд орохдоо дансны дугаар эсвэл ID-гаараа бүлэглэгдэнэ.\n")

  // Summary by phone
  const phoneSummary: Record<string, number> = {}
  for (const o of orders) {
    const p = o.customerPhone || "?"
    phoneSummary[p] = (phoneSummary[p] || 0) + 1
  }

  console.log("📊 Дугаар тус бүрийн тоо:")
  for (const [phone, count] of Object.entries(phoneSummary).sort((a, b) => b[1] - a[1])) {
    const bar = "█".repeat(Math.min(count, 30))
    console.log(`   ${phone}  ${bar} ${count}`)
  }
  console.log("")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
