import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Fetching unique phone numbers from orders...")
  
  // Get all unique phones from orders
  const orders = await prisma.order.findMany({
    select: { customerPhone: true },
    distinct: ['customerPhone'],
    where: {
      customerPhone: { not: '' }
    }
  })

  const phones = orders
    .map(o => o.customerPhone.replace(/\D/g, ''))
    .filter(p => p.length === 8 && !/^(\d)\1{7}$/.test(p) && p !== "12345678" && p !== "87654321")

  // Make unique
  const uniquePhones = [...new Set(phones)]
  
  console.log(`Found ${uniquePhones.length} valid unique phone numbers.`)

  let inserted = 0
  for (const phone of uniquePhones) {
    try {
      await prisma.verifiedPhone.upsert({
        where: { phone },
        update: {},
        create: { phone }
      })
      inserted++
    } catch (e) {
      console.error(`Failed for ${phone}:`, e)
    }
  }

  console.log(`✅ Successfully added ${inserted} phone numbers to VerifiedPhone table.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
