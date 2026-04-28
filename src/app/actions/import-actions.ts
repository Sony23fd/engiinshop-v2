"use server";

import { db } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getStatusesForMapping() {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "DATAADMIN")) {
      throw new Error("Unauthorized");
    }
    const statuses = await db.orderStatusType.findMany({
      orderBy: { createdAt: "asc" }
    });
    return { success: true, statuses };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function runImportTransaction(payload: any) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "DATAADMIN")) {
      throw new Error("Unauthorized");
    }

    await db.$transaction(async (tx) => {
      for (const cat of payload.categories) {
        // Find or create category
        let dbCategory = await tx.category.findFirst({ where: { name: cat.name } });
        if (!dbCategory) {
          dbCategory = await tx.category.create({
            data: { name: cat.name }
          });
        }

        for (const b of cat.batches) {
          // Find or create product
          let dbProduct = await tx.product.findFirst({ where: { name: b.productName } });
          if (!dbProduct) {
            dbProduct = await tx.product.create({
              data: { 
                name: b.productName, 
                weight: b.weight || 0, 
                price: b.price || 0 
              }
            });
          }

          // Find or create batch for this category + product
          // We decide to always create a new batch or find existing?
          // If importing to an existing category, we can search for batch by productId
          let dbBatch = await tx.batch.findFirst({
            where: { categoryId: dbCategory.id, productId: dbProduct.id }
          });

          if (!dbBatch) {
            dbBatch = await tx.batch.create({
              data: {
                categoryId: dbCategory.id,
                productId: dbProduct.id,
                targetQuantity: b.targetQuantity,
                price: b.price,
                cargoFeeStatus: b.cargoFeeStatus,
                description: b.description
              }
            });
          }

          // Insert Orders
          const ordersToCreate = b.orders.map((o: any) => ({
            batchId: dbBatch.id,
            customerName: o.customerName,
            customerPhone: o.customerPhone,
            accountNumber: o.accountNumber || null,
            quantity: o.quantity || 1,
            deliveryAddress: o.deliveryAddress || null,
            statusId: o.mappedStatusId || null,
            paymentStatus: "CONFIRMED", // Imported orders are usually already paid
            totalAmount: o.totalAmount || (o.quantity * (b.price || 0)),
            transactionRef: Math.random().toString(36).substring(2, 10).toUpperCase() // temp ref
          }));

          if (ordersToCreate.length > 0) {
            await (tx.order as any).createMany({ data: ordersToCreate });
          }
        }
      }
    }, {
      maxWait: 20000, 
      timeout: 900000 // 15 minutes for bulk import
    });

    revalidatePath("/admin/orders");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function restoreFullDatabase(data: any) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || (admin.role !== "ADMIN" && admin.role !== "DATAADMIN")) {
      throw new Error("Unauthorized");
    }

    await db.$transaction(async (tx) => {
      // 1. Delete existing data in proper dependency order (child tables first)
      if ((tx as any).activityLog) await (tx as any).activityLog.deleteMany({});
      await tx.order.deleteMany({});
      await tx.batch.deleteMany({});
      await tx.product.deleteMany({});
      await tx.category.deleteMany({});
      await tx.orderStatusType.deleteMany({});
      await tx.shopSettings.deleteMany({});
      
      // Preserve current admin so session doesn't break
      await tx.user.deleteMany({
        where: { id: { not: admin.id } }
      });

      // 2. Insert data from backup in proper dependency order (parent tables first)
      if (data.users && data.users.length > 0) {
        // Filter out current admin by ID or Email to prevent unique constraint violations
        const usersToInsert = data.users.filter((u: any) => u.id !== admin.id && u.email !== admin.email);
        if (usersToInsert.length > 0) await tx.user.createMany({ data: usersToInsert });
      }

      if (data.orderStatusTypes && data.orderStatusTypes.length > 0) {
        await tx.orderStatusType.createMany({ data: data.orderStatusTypes });
      }

      if (data.shopSettings && data.shopSettings.length > 0) {
        await tx.shopSettings.createMany({ data: data.shopSettings });
      }

      if (data.categories && data.categories.length > 0) {
        await tx.category.createMany({ data: data.categories });
      }

      if (data.products && data.products.length > 0) {
        await tx.product.createMany({ data: data.products });
      }

      if (data.batches && data.batches.length > 0) {
        await tx.batch.createMany({ data: data.batches });
      }

      if (data.orders && data.orders.length > 0) {
        await tx.order.createMany({ data: data.orders });
      }

      if (data.activityLogs && data.activityLogs.length > 0 && (tx as any).activityLog) {
        await (tx as any).activityLog.createMany({ data: data.activityLogs });
      }
    }, {
      maxWait: 20000, 
      timeout: 900000 // 15 minutes
    });

    revalidatePath("/admin", "layout"); // Revalidate entire admin area
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

