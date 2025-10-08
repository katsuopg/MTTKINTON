import { NextRequest, NextResponse } from 'next/server';
import { getWorkNoRecordsByCustomer } from '@/lib/kintone/workno';
import { getQuotationRecordsByCustomer } from '@/lib/kintone/quotation';
import { getOrderRecordsByCustomer } from '@/lib/kintone/order';
import { getInvoiceRecordsByCustomer } from '@/lib/kintone/invoice';
import { getCustomerById } from '@/lib/kintone/customer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const searchParams = request.nextUrl.searchParams;
  const period = searchParams.get('period');
  const type = searchParams.get('type');
  const { id } = await params;

  try {
    let data;
    
    // 請求書の場合は顧客情報を先に取得
    if (type === 'invoice') {
      const customerRecord = await getCustomerById(id);
      data = await getInvoiceRecordsByCustomer(customerRecord.会社名.value, period || undefined);
    } else {
      switch (type) {
        case 'workno':
          data = await getWorkNoRecordsByCustomer(id, period || undefined);
          break;
        case 'quotation':
          data = await getQuotationRecordsByCustomer(id, period || undefined);
          break;
        case 'po':
          data = await getOrderRecordsByCustomer(id, period || undefined);
          break;
        default:
          return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching customer data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}