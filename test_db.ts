import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();
async function main() {
  const orders = await db.order.findMany({
    take: 5,
    where: { orderNumber: { in: [3448, 3447, 3444] } }
  });
  console.log(JSON.stringify(orders, null, 2));
}
main().catch(console.error).finally(() => db.$disconnect());
