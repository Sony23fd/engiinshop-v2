const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.orderStatusType.findMany({
    where: { isFinal: true }
  });
  
  console.log("Final statuses in DB:");
  console.dir(statuses, { depth: null });

  console.log("------------------------");
  const ordersGroup = await prisma.order.groupBy({
    by: ['statusId'],
    _count: {
      id: true,
    },
    where: {
      status: {
        isFinal: true,
      }
    }
  });

  console.log("Order count by statusId (for final statuses):", ordersGroup);
}

main();
