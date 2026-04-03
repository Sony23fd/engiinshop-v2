const { PrismaClient } = require("@prisma/client");
const db = new PrismaClient();

async function check() {
  try {
    const settings = await db.shopSettings.findMany();
    console.log("Settings in DB:", JSON.stringify(settings, null, 2));
    
    const fee = settings.find((s) => s.key === "delivery_fee");
    console.log("Delivery Fee from DB:", fee ? fee.value : "NOT FOUND (Will use default)");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await db.$disconnect();
  }
}

check();
