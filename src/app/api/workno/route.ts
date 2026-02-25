import { KintoneClient } from '@/lib/kintone/client';
import { WorkNoRecord } from '@/types/kintone';
import { createClient } from '@/lib/supabase/server';

function getWorkNoClient() {
  return new KintoneClient(
    process.env.KINTONE_APP_WORK_NO || '21',
    process.env.KINTONE_API_TOKEN_WORKNO!
  );
}

export async function GET(request: Request) {
  try {
    const workNoClient = getWorkNoClient();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const query = status ? `status = "${status}"` : '';
    const data = await workNoClient.getRecords<WorkNoRecord>(query);
    
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const workNoClient = getWorkNoClient();
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const record: any = {
      work_no: { value: body.work_no },
      status: { value: body.status },
      customer_name: { value: body.customer_name },
      description: { value: body.description || '' },
      finish_date: { value: body.finish_date || '' },
      // ... 他のフィールド
    };
    
    const result = await workNoClient.createRecord(record);
    
    return Response.json({ id: result });
  } catch (error) {
    return Response.json({ error: 'Failed to create record' }, { status: 500 });
  }
}
