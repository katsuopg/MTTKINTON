import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { KintoneClient } from '@/lib/kintone/client';
import { EmployeeRecord } from '@/types/kintone';

// 従業員一覧（ユーザー管理用）
export async function GET(_request: NextRequest) {
  const supabase = await createClient();

  // 認証チェック
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const client = new KintoneClient(
      '106', // 従業員管理アプリID
      process.env.KINTONE_API_TOKEN_EMPLOYEE!
    );

    const records = await client.getRecords<EmployeeRecord>();

    const employees = (records || []).map((record) => {
      const employeeId = record.$id.value;
      const employeeNumber =
        record.従業員番号?.value ||
        record.社員証番号?.value ||
        record.社員番号?.value ||
        record.ID_No?.value ||
        employeeId;

      const department = record.配属?.value || record.部署?.value || '';
      const status = record.在籍状況?.value || '在籍';

      return {
        id: employeeId,
        employeeNumber,
        name: record.氏名?.value || '',
        email: record.メールアドレス?.value || '',
        department,
        status,
      };
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error('Error fetching employees for user management:', error);
    return NextResponse.json(
      { error: '従業員データの取得に失敗しました' },
      { status: 500 }
    );
  }
}


