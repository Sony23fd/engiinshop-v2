/**
 * fix-invalid-phones.ts
 * 
 * Өгөгдлийн сан дахь "00000000" гэх мэт хүчингүй утасны дугааруудыг хоосон болгож засна.
 * 
 * Ажиллуулах: npx tsx fix-invalid-phones.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Same logic as isValidPhone in customer-utils.ts
function isInvalidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "")
  if (digits.length !== 8) return true
  if (/^(\d)\1{7}$/.test(digits)) return true // all same: 00000000, 11111111
  if (digits === "12345678") return true
  if (digits === "87654321") return true
  return false
}

async function main() {
  console.log("🔍 Хүчингүй утасны дугаартай захиалгуудыг хайж байна...")

  const orders = await prisma.order.findMany({
    where: {
      customerPhone: {
        in: [
          "00000000", "11111111", "22222222", "33333333",
          "44444444", "55555555", "66666666", "77777777",
          "88888888", "99999999", "12345678", "87654321"
        ]
      }
    },
    select: {
      id: true,
      customerName: true,
      customerPhone: true,
      orderNumber: true,
    }
  })

  console.log(`📋 ${orders.length} ширхэг хүчингүй утастай захиалга олдлоо.\n`)

  if (orders.length === 0) {
    console.log("✅ Засах зүйл алга. Бүх утасны дугаар хүчинтэй байна.")
    return
  }

  // Preview
  for (const order of orders) {
    console.log(`  #${order.orderNumber} | ${order.customerName} | утас: "${order.customerPhone}" → ""`)
  }

  // Fix them
  const result = await prisma.order.updateMany({
    where: {
      customerPhone: {
        in: [
          "00000000", "11111111", "22222222", "33333333",
          "44444444", "55555555", "66666666", "77777777",
          "88888888", "99999999", "12345678", "87654321"
        ]
      }
    },
    data: {
      customerPhone: ""
    }
  })

  console.log(`\n✅ ${result.count} ширхэг захиалгын утасны дугаарыг хоосон болгож засварлалаа.`)
  console.log("ℹ️  Эдгээр захиалгууд одоо бүлэглэлтэд орохдоо утасны дугаараар биш, дансны дугаар эсвэл ID-гаараа бүлэглэгдэх болно.")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
