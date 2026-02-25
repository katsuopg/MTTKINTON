import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { updateCurrentPeriodWaitingPOToSent } from '@/lib/kintone/quotation';

export async function POST() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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