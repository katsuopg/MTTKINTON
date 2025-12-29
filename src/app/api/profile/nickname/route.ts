import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { nickname } = await request.json();

    // Update user metadata with nickname
    const { error: updateError } = await supabase.auth.updateUser({
      data: { nickname },
    });

    if (updateError) {
      console.error('Error updating nickname:', updateError);
      return NextResponse.json({ error: 'Failed to update nickname' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in nickname API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
