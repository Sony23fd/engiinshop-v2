const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const statuses = await prisma.orderStatusType.findMany();
  
  for (const status of statuses) {
    if (status.name === "Хүргэлтээр авсан" || status.name === "Өөрөө ирж авсан") {
      if (!status.isFinal) {
        await prisma.orderStatusType.update({
          where: { id: status.id },
          data: { isFinal: true }
        });
        console.log(`Updated ${status.name} to isFinal = true`);
      }
    }
  }

  const updatedStatuses = await prisma.orderStatusType.findMany();
  require('fs').writeFileSync('statuses_debug.json', JSON.stringify(updatedStatuses, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
