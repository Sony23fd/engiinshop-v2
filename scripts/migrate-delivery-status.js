const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  console.log("Starting delivery status setup...");

  // 1. Rename existing status cmndey7v70007r0s76yundjga to 'Хүргэгдсэн'
  const oldDelivered = await prisma.orderStatusType.findUnique({
    where: { id: 'cmndey7v70007r0s76yundjga' }
  });
  if (oldDelivered) {
    await prisma.orderStatusType.update({
      where: { id: 'cmndey7v70007r0s76yundjga' },
      data: { name: 'Хүргэгдсэн' }
    });
    console.log("Updated cmndey7v70007r0s76yundjga to: Хүргэгдсэн");
  }

  // 2. Check or create 'Хүргэлтийн ажилтанд өгсөн'
  let courierStatus = await prisma.orderStatusType.findFirst({
    where: { name: 'Хүргэлтийн ажилтанд өгсөн' }
  });
  if (!courierStatus) {
    courierStatus = await prisma.orderStatusType.create({
      data: {
        name: 'Хүргэлтийн ажилтанд өгсөн',
        color: 'amber',
        isFinal: false,
        isDefault: false,
        isDeliverable: false
      }
    });
    console.log("Created status 'Хүргэлтийн ажилтанд өгсөн' with id:", courierStatus.id);
  } else {
    console.log("Status 'Хүргэлтийн ажилтанд өгсөн' already exists with id:", courierStatus.id);
  }

  // Print all statuses
  const all = await prisma.orderStatusType.findMany({ orderBy: { createdAt: 'asc' } });
  console.log("Current statuses in DB:");
  all.forEach(s => console.log(`- [${s.id}] ${s.name} (isFinal: ${s.isFinal}, isDeliverable: ${s.isDeliverable}, color: ${s.color})`));
}

run()
  .catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
