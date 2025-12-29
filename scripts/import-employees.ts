/**
 * 従業員データをKintoneからSupabaseにインポートするスクリプト
 *
 * 使用方法:
 *   npx tsx scripts/import-employees.ts
 *
 * または、ブラウザから以下のURLにPOSTリクエストを送信:
 *   POST /api/import-employees
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

// 環境変数を読み込み
config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN!;
const KINTONE_API_TOKEN = process.env.KINTONE_API_TOKEN_EMPLOYEE!;

// ヘルパー関数
function getFieldValue(field: { value: string } | undefined): string | null {
  return field?.value || null;
}

function getDateValue(field: { value: string } | undefined): string | null {
  const value = field?.value;
  if (!value || value === '') return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return null;
}

async function fetchEmployeesFromKintone(): Promise<any[]> {
  const allEmployees: any[] = [];
  let offset = 0;
  const limit = 500;

  while (true) {
    const query = `order by 従業員番号 asc limit ${limit} offset ${offset}`;
    const url = `https://${KINTONE_DOMAIN}/k/v1/records.json?app=106&query=${encodeURIComponent(query)}`;

    const response = await fetch(url, {
      headers: {
        'X-Cybozu-API-Token': KINTONE_API_TOKEN,
      },
    });

    if (!response.ok) {
      throw new Error(`Kintone API error: ${response.statusText}`);
    }

    const data = await response.json();
    allEmployees.push(...data.records);

    if (data.records.length < limit) break;
    offset += limit;
  }

  return allEmployees;
}

async function main() {
  console.log('従業員データインポートを開始します...\n');

  // Supabaseクライアント作成（サービスロールキーを使用）
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Kintoneから従業員データを取得
    console.log('Kintoneから従業員データを取得中...');
    const employees = await fetchEmployeesFromKintone();
    console.log(`${employees.length}件の従業員データを取得しました\n`);

    let imported = 0;
    let errors = 0;
    const errorDetails: { employee_number: string; error: string }[] = [];

    for (const employee of employees) {
      // 従業員番号の取得
      const employeeNumber =
        getFieldValue(employee.従業員番号) ||
        getFieldValue(employee.社員証番号) ||
        getFieldValue(employee.IdNo) ||
        getFieldValue(employee.ID_No);

      if (!employeeNumber) {
        console.warn(`従業員番号がないレコードをスキップ: Kintone ID ${employee.$id.value}`);
        continue;
      }

      // 既存のテーブル構造に合わせたマッピング
      const data = {
        kintone_record_id: employee.$id.value,  // 既存のカラム名を使用
        employee_number: employeeNumber,
        name: getFieldValue(employee.氏名) || '',
        name_th: getFieldValue(employee.氏名_タイ語) || getFieldValue(employee.氏名タイ語),  // 既存のカラム名
        email: getFieldValue(employee.メールアドレス),
        tel: getFieldValue(employee.TEL),  // 既存のカラム名
        position: getFieldValue(employee.役職),
        department: getFieldValue(employee.配属),
        status: getFieldValue(employee.在籍状況) || '在籍',  // employment_status → status
        employment_type: getFieldValue(employee.雇用形態),
        salary_type: getFieldValue(employee.給与形態),
        hire_date: getDateValue(employee.入社日),
        resign_date: getDateValue(employee.退社日),  // resignation_date → resign_date
        date_of_birth: getDateValue(employee.生年月日),  // birth_date → date_of_birth
        address: getFieldValue(employee.住所),
        id_number: getFieldValue(employee.IdNo) || getFieldValue(employee.ID_No),
        id_expiry: getDateValue(employee.身分証有効期限),  // 既存のカラム名
        passport_number: getFieldValue(employee.パスポート番号),
        passport_expiry: getDateValue(employee.パスポート有効期限),  // 既存のカラム名
        visa_number: getFieldValue(employee.ビザ番号),
        visa_expiry: getDateValue(employee.ビザ有効期限),  // 既存のカラム名
        visa_type: getFieldValue(employee.ビザ種類),
        license_number: getFieldValue(employee.免許書番号),  // driver_license_number → license_number
        license_expiry: getDateValue(employee.免許有効期限),  // driver_license_expiry_date → license_expiry
        emergency_contact_name: getFieldValue(employee.緊急時連絡先氏名),
        emergency_contact_tel: getFieldValue(employee.緊急時連絡先TEL),  // 既存のカラム名
        emergency_contact_address: getFieldValue(employee.緊急時連絡先住所),
        bank_account: getFieldValue(employee.BBBL給与額込口座),
      };

      const { error } = await supabase
        .from('employees')
        .upsert(data, { onConflict: 'employee_number' });

      if (error) {
        console.error(`エラー: ${employeeNumber} - ${error.message}`);
        errorDetails.push({ employee_number: employeeNumber, error: error.message });
        errors++;
      } else {
        imported++;
        if (imported % 10 === 0) {
          console.log(`${imported}件処理完了...`);
        }
      }
    }

    console.log('\n=== インポート完了 ===');
    console.log(`成功: ${imported}件`);
    console.log(`エラー: ${errors}件`);

    if (errorDetails.length > 0) {
      console.log('\nエラー詳細:');
      errorDetails.slice(0, 10).forEach(e => {
        console.log(`  - ${e.employee_number}: ${e.error}`);
      });
    }

    // 最終件数確認
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    console.log(`\nSupabase従業員テーブルの総件数: ${count}件`);

  } catch (error) {
    console.error('エラー:', error);
    process.exit(1);
  }
}

main();
