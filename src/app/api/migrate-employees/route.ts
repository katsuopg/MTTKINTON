import { NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { KintoneClient } from '@/lib/kintone/client';

// Kintone従業員レコードの型（実際のフィールド名に合わせる）
interface KintoneEmployeeRecord {
  $id: { value: string };
  従業員番号: { value: string };
  氏名: { value: string };
  氏名タイ語: { value: string };
  メールアドレス: { value: string };
  TEL: { value: string };
  生年月日: { value: string };
  部署: { value: string };
  役職: { value: string };
  雇用形態: { value: string };
  入社日: { value: string };
  退社日: { value: string };
  在籍状況: { value: string };
  給与支払形態: { value: string };
  給与振込口座: { value: string };
  IdNo: { value: string };
  ID有効期限: { value: string };
  PassportNo: { value: string };
  パスポート有効期限: { value: string };
  緊急時連絡先氏名: { value: string };
  緊急時連絡先TEL: { value: string };
  緊急時連絡先住所: { value: string };
  住所: { value: string };
}

export async function POST() {
  try {
    // Service Role Keyを使用してRLSをバイパス
    const supabase = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Kintoneから従業員データを取得
    const client = new KintoneClient(
      '106',
      process.env.KINTONE_API_TOKEN_EMPLOYEE!
    );

    const kintoneRecords = await client.getRecords<KintoneEmployeeRecord>();
    console.log(`Kintone employees fetched: ${kintoneRecords.length}`);

    if (kintoneRecords.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No records to migrate',
        migrated: 0
      });
    }

    // 既存のテストデータを削除
    await supabase.from('employees').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    // Supabaseにデータを挿入（正しいフィールド名を使用）
    const employeesToInsert = kintoneRecords.map(record => ({
      employee_number: record.従業員番号?.value || null,
      name: record.氏名?.value || 'Unknown',
      name_th: record.氏名タイ語?.value || null,
      email: record.メールアドレス?.value || null,
      tel: record.TEL?.value || null,
      date_of_birth: record.生年月日?.value || null,
      department: record.部署?.value || null,
      position: record.役職?.value || null,
      employment_type: record.雇用形態?.value || null,
      hire_date: record.入社日?.value || null,
      resign_date: record.退社日?.value || null,
      status: record.在籍状況?.value || '在籍',
      salary_type: record.給与支払形態?.value || null,
      bank_account: record.給与振込口座?.value || null,
      id_number: record.IdNo?.value || null,
      id_expiry: record.ID有効期限?.value || null,
      passport_number: record.PassportNo?.value || null,
      passport_expiry: record.パスポート有効期限?.value || null,
      emergency_contact_name: record.緊急時連絡先氏名?.value || null,
      emergency_contact_tel: record.緊急時連絡先TEL?.value || null,
      emergency_contact_address: record.緊急時連絡先住所?.value || null,
      kintone_record_id: record.$id?.value || null,
    }));

    const { data, error } = await supabase
      .from('employees')
      .insert(employeesToInsert)
      .select();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({
        success: false,
        error: error.message
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully migrated ${data.length} employees`,
      migrated: data.length
    });

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'POST to this endpoint to migrate employees from Kintone to Supabase'
  });
}
