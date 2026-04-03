import { db } from "./src/lib/db";

async function check() {
  const settings = await (db as any).shopSettings.findMany();
  console.log("Settings in DB:", JSON.stringify(settings, null, 2));
  
  const fee = settings.find((s: any) => s.key === "delivery_fee");
  console.log("Delivery Fee from DB:", fee?.value);
}

check();
