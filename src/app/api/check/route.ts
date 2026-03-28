import { NextResponse } from 'next/server';
import * as fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'anar.txt');
    const rawData = fs.readFileSync(filePath, 'utf8');
    const json = JSON.parse(rawData);
    const oldBatches = json.data.orders;
    
    let foundZulaa = null;
    let sampleMatches = [];

    for (const b of oldBatches) {
      for (const item of b.orderitemSet) {
        // Let's do a case insensitive includes:
        const n = item.name ? item.name.toLowerCase() : '';
        if (n.includes('zulaa') || n.includes('bariushaa') || (item.phoneNumber && item.phoneNumber.includes('50071402'))) {
          sampleMatches.push({
            rawName: item.name,
            rawPhone: item.phoneNumber
          });
        }
      }
    }

    return NextResponse.json({
      success: true, 
      matchesCount: sampleMatches.length,
      matches: sampleMatches
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || String(error) }, { status: 500 });
  }
}
