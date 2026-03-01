import { NextResponse } from 'next/server';
import { updateCurrentPeriodWaitingPOToSent } from '@/lib/kintone/quotation';
import { requireAppPermission } from '@/lib/auth/app-permissions';

export async function POST() {
  try {
    const permCheck = await requireAppPermission('quotations', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    await updateCurrentPeriodWaitingPOToSent();
    return NextResponse.json({ success: true, message: 'Successfully updated quotation statuses' });
  } catch (error) {
    console.error('Error in update-quotation-status API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update quotation statuses' },
      { status: 500 }
    );
  }
}