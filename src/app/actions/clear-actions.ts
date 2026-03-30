"use server";

import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function clearAllStoreData() {
  try {
    const admin = await getCurrentAdmin();
    // Only DATAADMIN is authorized for this extremely destructive action
    if (!admin || admin.role !== "DATAADMIN") {
      throw new Error("Зөвхөн DATAADMIN эрхтэй хэрэглэгч устгах боломжтой!");
    }

    // Wrap in a transaction to ensure no partial deletions
    await db.$transaction(async (tx) => {
      await tx.order.deleteMany();
      await tx.batch.deleteMany();
      await tx.product.deleteMany();
      await tx.category.deleteMany();
      // Keep Admin users and OrderStatusTypes intact
    }, {
      maxWait: 5000,
      timeout: 30000 // 30 sec should be enough to wipe the tables
    });

    revalidatePath("/admin/data-center");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/products");

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
