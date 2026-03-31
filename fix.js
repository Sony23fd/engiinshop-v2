const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const batches = await prisma.batch.findMany();
  let count = 0;
  for (const b of batches) {
    if (b.targetQuantity > 0 && b.remainingQuantity === 0) {
      console.log('Fixing batch:', b.id);
      await prisma.batch.update({ 
        where: { id: b.id }, 
        data: { remainingQuantity: b.targetQuantity } 
      });
      count++;
    }
  }
  console.log(`Successfully fixed ${count} batches.`);
}
main().catch(console.error).finally(() => prisma.$disconnect());
