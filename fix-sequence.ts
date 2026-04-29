import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  console.log('Attempting to fix orderNumber sequence...')
  try {
    // 1. Get the current max orderNumber
    const maxOrder = await prisma.order.findFirst({
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true }
    })
    
    const maxVal = maxOrder?.orderNumber || 0
    console.log('Current maximum orderNumber in database:', maxVal)
    
    // 2. Reset the sequence. 
    // In PostgreSQL, the sequence name for an autoincrement field is usually 
    // "TableName_columnName_seq". For our model "Order" and column "orderNumber",
    // Prisma/Postgres usually names it "Order_orderNumber_seq".
    
    // We use pg_get_serial_sequence to be safe.
    await prisma.$executeRawUnsafe(`
      SELECT setval(pg_get_serial_sequence('"Order"', 'orderNumber'), ${maxVal});
    `)
    
    console.log('Successfully reset sequence to:', maxVal)
    console.log('Next order will have number:', maxVal + 1)
    
  } catch (err) {
    console.error('Failed to reset sequence:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
