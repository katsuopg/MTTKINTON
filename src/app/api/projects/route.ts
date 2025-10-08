import { KintoneClient } from '@/lib/kintone/client';
import { ProjectRecord } from '@/types/kintone';

const projectClient = new KintoneClient(
  '114', // Project managementアプリID
  process.env.KINTONE_API_TOKEN_PROJECT!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    const query = status ? `status = "${status}"` : '';
    const data = await projectClient.getRecords<ProjectRecord>(query);
    
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: 'Failed to fetch records' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    const record: any = {
      pj_name: { value: body.pj_name },
      customer: { value: body.customer },
      status: { value: body.status || '見積中' },
      due_date: { value: body.due_date || '' },
      // ... 他のフィールド
    };
    
    const result = await projectClient.createRecord(record);
    
    return Response.json({ id: result });
  } catch (error) {
    return Response.json({ error: 'Failed to create record' }, { status: 500 });
  }
}