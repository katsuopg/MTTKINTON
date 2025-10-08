import { NextResponse } from 'next/server';
import { KintoneClient } from '@/lib/kintone/client';

export async function GET() {
  try {
    const client = new KintoneClient(
      '89', // Machine ManagementアプリID
      'T4MEIBEiCBZ0ksOY6aL8qEHHVdRMN5nPWU4szZJj' // APIトークン
    );
    
    // 最初の5レコードを取得してフィールド構造を確認
    const query = 'order by $id desc limit 5';
    const records = await client.getRecords(query);
    
    console.log('=== Machine Management Field Analysis ===');
    
    if (records.length > 0) {
      console.log('Available fields:', Object.keys(records[0]));
      console.log('\nFirst record field details:');
      
      // 全フィールドの詳細情報を出力
      Object.entries(records[0]).forEach(([key, field]) => {
        if (field && typeof field === 'object' && 'value' in field) {
          console.log(`  ${key}: ${(field as any).type || 'unknown'} = "${field.value}"`);
        }
      });
    }
    
    return NextResponse.json({ 
      count: records.length,
      fields: records.length > 0 ? Object.keys(records[0]) : [],
      sampleRecord: records.length > 0 ? records[0] : null
    });
  } catch (error) {
    console.error('Error fetching machine records:', error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}