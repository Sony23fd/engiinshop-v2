import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await db.category.updateMany({
      where: { name: 'Хуучин Бааз (Archive)' },
      data: { isArchived: false }
    });
    return NextResponse.json({ success: true, message: "Ангилал ил гарлаа!" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
