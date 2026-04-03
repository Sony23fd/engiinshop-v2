const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const ords = await prisma.order.findMany({ take: 5, include: { status: true } });
  console.log("SAMPLE ORDERS:", JSON.stringify(ords, null, 2));
  
  const statusCounts = await prisma.orderStatusType.findMany({
    include: { _count: { select: { orders: true } } }
  });
  console.log("STATUS COUNTS:", JSON.stringify(statusCounts, null, 2));
}

main().finally(() => prisma.$disconnect());
