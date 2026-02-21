import { KintoneClient } from '@/lib/kintone/client';
import { WorkNoRecord } from '@/types/kintone';
import { createClient } from '@/lib/supabase/server';

const workNoClient = new KintoneClient(
  process.env.KINTONE_APP_WORK_NO || '21',
  process.env.KINTONE_API_TOKEN_WORKNO!
);

// GET: 工事番号の簡易一覧（選択用）
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // WorkNo, CS ID, 説明のみ取得（軽量化）
    const records = await workNoClient.getRecords<WorkNoRecord>(
      'order by WorkNo desc limit 500',
      ['WorkNo', '文字列__1行__8', '文字列__1行__2']
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items = (records || []).map((r: any) => ({
      workNo: r.WorkNo?.value || '',
      csId: r.文字列__1行__8?.value || '',
      description: r.文字列__1行__2?.value || '',
    })).filter((r: { workNo: string }) => r.workNo);

    return Response.json({ items });
  } catch (error) {
    console.error('Error fetching work no list:', error);
    return Response.json({ items: [] });
  }
}
