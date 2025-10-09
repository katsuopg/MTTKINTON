import { NextResponse } from 'next/server';
import { getCustomerStaffByCustomer } from '@/lib/kintone/customer-staff';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ customerId: string }> }
) {
  const { customerId } = await params;

  if (!customerId) {
    return NextResponse.json({ error: 'customerId is required' }, { status: 400 });
  }

  try {
    const staffRecords = await getCustomerStaffByCustomer(customerId);
    const staffOptions = staffRecords
      .map((record) => ({
        id: record.$id.value,
        name: record.担当者名?.value ?? '',
        email: record.メールアドレス?.value ?? '',
        mobile: record.文字列__1行__7?.value ?? '',
      }))
      .filter((option) => option.name);

    return NextResponse.json(staffOptions);
  } catch (error) {
    console.error('Failed to fetch customer staff:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer staff' },
      { status: 500 }
    );
  }
}
