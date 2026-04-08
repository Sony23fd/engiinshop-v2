const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const finalStatus = await prisma.orderStatusType.findFirst({
    where: { isFinal: true, name: { notIn: ["Цуцлагдсан", "Rejected", "Canceled"] } }
  });
  
  const orders = await prisma.order.findMany({
    where: { 
      status: { 
        isFinal: true, 
        name: { notIn: ["Цуцлагдсан", "Rejected", "Canceled"] } 
      },
      paymentStatus: { not: "REJECTED" }
    },
    take: 10,
    orderBy: { updatedAt: "desc" },
    select: {
      customerName: true,
      deliveryAddress: true,
      wantsDelivery: true,
      status: { select: { name: true } }
    }
  });

  console.log(orders);
}

main();
