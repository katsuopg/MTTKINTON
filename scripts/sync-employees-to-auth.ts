/**
 * 従業員テーブルからSupabase Authユーザーを一括作成
 *
 * - employee_number → MTT57028@mtt.internal でログイン可能
 * - company_email がある場合 → そのメールでもログイン可能（別ユーザーとして作成）
 * - 初期パスワード: 従業員番号（小文字）
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  console.log('=== 従業員からAuthユーザーを作成 ===\n');

  // 従業員一覧を取得
  const { data: employees, error: fetchError } = await supabase
    .from('employees')
    .select('id, employee_number, name, company_email, status')
    .eq('status', 'Active');

  if (fetchError) {
    console.error('従業員取得エラー:', fetchError.message);
    return;
  }

  console.log(`対象従業員: ${employees.length}名\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const emp of employees) {
    const employeeNumber = emp.employee_number;
    const email = `${employeeNumber}@mtt.internal`;
    const password = employeeNumber.toLowerCase(); // 初期パスワード

    console.log(`処理中: ${employeeNumber} (${emp.name})`);

    // 1. 従業員番号でAuthユーザーを作成
    const { data: userData, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        employee_number: employeeNumber,
        name: emp.name,
      }
    });

    if (createError) {
      if (createError.message.includes('already been registered')) {
        console.log(`  → スキップ（既に存在）: ${email}`);
        skipped++;
      } else {
        console.error(`  → エラー: ${createError.message}`);
        errors++;
      }
    } else {
      console.log(`  → 作成成功: ${email}`);
      created++;

      // employeesテーブルのuser_idを更新
      await supabase
        .from('employees')
        .update({ user_id: userData.user.id })
        .eq('id', emp.id);
    }
  }

  console.log('\n=== 完了 ===');
  console.log(`作成: ${created}件`);
  console.log(`スキップ: ${skipped}件`);
  console.log(`エラー: ${errors}件`);
  console.log('\n初期パスワード: 従業員番号（小文字）');
}

main().catch(console.error);
