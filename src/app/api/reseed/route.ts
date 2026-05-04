import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import * as fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("API: Бүх хуучин болон шинэ датаг цэвэрлэж байна...");
    
    // WIPE EVERYTHING to ensure a clean slate, except Users and Settings and Statuses
    await db.order.deleteMany({});
    await db.batch.deleteMany({});
    await db.product.deleteMany({});
    await db.category.deleteMany({});

    console.log("API: Цэвэрлэгээ дууссан! last.txt уншиж байна...");
    
    const filePath = path.join(process.cwd(), 'last.txt');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(rawData);
    
    // Handle nested 'orderParents' structure in last.txt
    const oldBatches: any[] = [];
    if (json.data.orderParents) {
      json.data.orderParents.forEach((parent: any) => {
        if (parent.orderSet) {
          oldBatches.push(...parent.orderSet);
        }
      });
    } else if (json.data.orders) {
      oldBatches.push(...json.data.orders);
    }
    
    let category = await db.category.create({
      data: { name: 'Хуучин Бааз (Archive)', isArchived: false }
    });

    // Preload custom status mapping logic 
    const statusMap = new Map<string, string>();
    
    async function getOrCreateStatus(oldStatusName: string, isLast: boolean) {
      if (statusMap.has(oldStatusName)) return statusMap.get(oldStatusName);
      
      let statusObj = await db.orderStatusType.findFirst({ where: { name: oldStatusName } });
      if (!statusObj) {
        statusObj = await db.orderStatusType.create({ 
          data: { 
            name: oldStatusName, 
            color: isLast ? "green" : "slate", 
            isFinal: isLast 
          } 
        });
      }
      statusMap.set(oldStatusName, statusObj.id);
      return statusObj.id;
    }

    let totalOrdersInserted = 0;

    for (const b of oldBatches) {
      const product = await db.product.create({
        data: {
          name: b.name || "Тодорхойгүй бараа",
          price: Number(b.shippingPrice) || 0,
          weight: Number(b.weight) || 0,
          isActive: false
        }
      });

      const batch = await db.batch.create({
        data: {
          productId: product.id,
          categoryId: category.id,
          description: b.description || "",
          targetQuantity: b.goal || 0,
          remainingQuantity: b.goalLeft || 0,
          status: "CLOSED",
          isAvailableForSale: false,
          createdAt: new Date(b.orderDate || new Date())
        }
      });

      const ordersToInsert = [];
      for (const item of b.orderitemSet) {
        const rawName = item.name || "Тодорхойгүй Худалдан авагч";
        const phoneRegex = /\b([89]\d{7})\b/;
        const phoneMatch = rawName.match(phoneRegex);
        
        let actualAccount = item.phoneNumber || ""; 
        const actualPhone = phoneMatch ? phoneMatch[1] : "";
        
        let cleanName = rawName.replace(actualPhone, '').trim();
        cleanName = cleanName.replace(/,\s*,/g, ',').replace(/^,+|,+$/g, '').trim();

        let sName = (item.status?.name || "Шинэ").trim();
        // Normalize casing so "улаанбаатарт ирсэн" and "Улаанбаатарт ирсэн" become exactly same
        sName = sName.charAt(0).toUpperCase() + sName.slice(1).toLowerCase();

        const isLast = item.status?.isLast || false;
        const mappedStatusId = await getOrCreateStatus(sName, isLast);

        ordersToInsert.push({
          batchId: batch.id,
          customerName: cleanName,
          customerPhone: actualPhone || "Утас алга",
          accountNumber: String(actualAccount),
          quantity: item.quantity || 1,
          statusId: mappedStatusId,
          cargoFee: Number(item.shippingPrice) || 0,
          paymentStatus: "CONFIRMED",
          creationSource: "ADMIN",
          createdByAdmin: "Хуучин Бааз",
          createdAt: new Date(item.createdAt || new Date()),
          confirmedAt: new Date(),
          confirmationMethod: "MANUAL",
        });
      }

      if (ordersToInsert.length > 0) {
        await db.order.createMany({ data: ordersToInsert });
        totalOrdersInserted += ordersToInsert.length;
      }
    }

    return NextResponse.json({
      success: true, 
      message: `Амжилттай! Бүх дата бүрэн устгагдаж, last.txt-аас шинээр ${oldBatches.length} багц, ${totalOrdersInserted} захиалга зөрүүгүй цэвэрхэн орлоо.`,
      totalBatches: oldBatches.length,
      totalOrders: totalOrdersInserted
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
