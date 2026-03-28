import { PrismaClient } from '@prisma/client';
const db = new PrismaClient();

async function main() {
  console.log("Холбогдож байна...");
  const orders = await db.order.findMany({
    where: {
      accountNumber: null,
    }
  });
  console.log(`Нийт ${orders.length} захиалга шалгахаар олдлоо.`);

  let fixedCount = 0;

  for (let i = 0; i < orders.length; i++) {
    const order = orders[i];
    const phoneRegex = /\b([89]\d{7})\b/;
    const match = order.customerName.match(phoneRegex);
    
    if (match) {
      const extractedPhone = match[1];
      const extractedAccount = order.customerPhone;
      
      let newName = order.customerName.replace(extractedPhone, '').trim();
      newName = newName.replace(extractedAccount, '').trim();
      newName = newName.replace(/,\s*,/g, ',').replace(/^,+|,+$/g, '').trim();

      try {
        await db.order.update({
          where: { id: order.id },
          data: {
            customerPhone: extractedPhone,
            accountNumber: extractedAccount,
            customerName: newName
          }
        });
        fixedCount++;
        if (fixedCount % 100 === 0) console.log(`${fixedCount} захиалга засагдлаа...`);
      } catch (err) {
        console.error(`Алдаа гарлаа (ID: ${order.id}):`, err);
      }
    }
  }

  console.log(`Төгсгөл: Нийт ${fixedCount} захиалга амжилттай засагдлаа!`);
}

main()
  .catch(e => {
    console.error("Програм дээр алдаа гарлаа:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Салж байна...");
    await db.$disconnect();
  });
