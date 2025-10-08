import { NextResponse } from 'next/server';
import { updateCurrentPeriodWaitingPOToSent } from '@/lib/kintone/quotation';

export async function POST() {
  try {
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