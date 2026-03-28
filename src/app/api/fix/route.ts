import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log("API: Холбогдож байна...");
    const orders = await db.order.findMany({
      where: { accountNumber: null }
    });
    
    console.log(`API: Нийт ${orders.length} захиалга шалгахаар олдлоо.`);
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

        await db.order.update({
          where: { id: order.id },
          data: {
            customerPhone: extractedPhone,
            accountNumber: extractedAccount,
            customerName: newName
          }
        });
        fixedCount++;
      }
    }

    return NextResponse.json({
      success: true, 
      message: `Төгсгөл: Нийт ${fixedCount} захиалга амжилттай засагдлаа!`,
      totalOrdersChecked: orders.length
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
