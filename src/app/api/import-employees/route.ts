import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { KintoneClient } from '@/lib/kintone/client';
import { EmployeeRecord, KINTONE_APPS, KintoneFileInfo } from '@/types/kintone';

// Kintoneフィールドを安全に取得するヘルパー
function getFieldValue(field: { value: string } | undefined): string | null {
  return field?.value || null;
}

function getDateValue(field: { value: string } | undefined): string | null {
  const value = field?.value;
  if (!value || value === '') return null;
  // YYYY-MM-DD形式かチェック
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return null;
}

// Kintoneからファイルをダウンロード
async function downloadKintoneFile(fileKey: string): Promise<Buffer | null> {
  try {
    const domain = process.env.KINTONE_DOMAIN;
    const apiToken = process.env.KINTONE_API_TOKEN_EMPLOYEE;

    if (!domain || !apiToken) {
      console.error('Kintone credentials not configured');
      return null;
    }

    const response = await fetch(`https://${domain}/k/v1/file.json?fileKey=${fileKey}`, {
      headers: {
        'X-Cybozu-API-Token': apiToken,
      },
    });

    if (!response.ok) {
      console.error(`Kintoneファイルダウンロードエラー: ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error('Kintoneファイルダウンロードエラー:', error);
    return null;
  }
}

// Supabase Storageにファイルをアップロード
async function uploadToSupabaseStorage(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  buffer: Buffer,
  bucket: string,
  path: string,
  contentType: string
): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`Supabase Storageアップロードエラー:`, error.message);
      return null;
    }

    // 公開URLを取得
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(path);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Supabase Storageアップロードエラー:', error);
    return null;
  }
}

// ファイル拡張子を取得
function getExtension(filename: string, contentType: string): string {
  // ファイル名から拡張子を取得
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext && ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'webp'].includes(ext)) {
    return ext;
  }
  // Content-Typeから推測
  if (contentType.includes('jpeg') || contentType.includes('jpg')) return 'jpg';
  if (contentType.includes('png')) return 'png';
  if (contentType.includes('gif')) return 'gif';
  if (contentType.includes('pdf')) return 'pdf';
  if (contentType.includes('webp')) return 'webp';
  return 'jpg'; // デフォルト
}

// 全従業員データをSupabaseに取り込むAPIルート
export async function POST() {
  const supabase = await createClient();

  // ユーザー認証チェック
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  // Service Role Keyを使用したadminクライアント（Storage用）
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Kintoneから全従業員データを取得
    const employeeClient = new KintoneClient(
      String(KINTONE_APPS.EMPLOYEE_MANAGEMENT.appId),
      process.env.KINTONE_API_TOKEN_EMPLOYEE!
    );

    // 全件取得（500件制限対応）
    const allEmployees: EmployeeRecord[] = [];
    let offset = 0;
    const limit = 500;

    while (true) {
      const batch = await employeeClient.getRecords<EmployeeRecord>(
        `order by 従業員番号 asc limit ${limit} offset ${offset}`
      );
      allEmployees.push(...batch);

      if (batch.length < limit) break;
      offset += limit;
    }

    console.log(`Kintoneから${allEmployees.length}件の従業員データを取得しました`);

    // バッチ処理
    const batchSize = 5; // ファイル処理があるので小さめに
    let totalImported = 0;
    let totalErrors = 0;
    let filesUploaded = 0;
    const errors: { employee_number: string | null; error: string }[] = [];

    for (let i = 0; i < allEmployees.length; i += batchSize) {
      const batch = allEmployees.slice(i, i + batchSize);
      console.log(`バッチ ${Math.floor(i / batchSize) + 1}/${Math.ceil(allEmployees.length / batchSize)} (${batch.length}件) を処理中...`);

      for (const employee of batch) {
        try {
          // 従業員番号の取得（優先順位: 従業員番号 > 社員証番号 > IdNo > ID_No）
          const employeeNumber =
            getFieldValue(employee.従業員番号) ||
            getFieldValue(employee.社員証番号) ||
            getFieldValue(employee.IdNo) ||
            getFieldValue(employee.ID_No);

          if (!employeeNumber) {
            console.warn(`警告: 従業員番号がないレコードをスキップ (Kintone ID: ${employee.$id.value})`);
            continue;
          }

          // ファイルの処理
          let idImageUrl: string | null = null;
          let passportImageUrl: string | null = null;

          // ID画像の処理
          const idFiles = employee.ID?.value as KintoneFileInfo[] | undefined;
          if (idFiles && idFiles.length > 0) {
            const file = idFiles[0]; // 最初のファイルを使用
            console.log(`  従業員 ${employeeNumber}: ID画像をダウンロード中...`);
            const fileBuffer = await downloadKintoneFile(file.fileKey);
            if (fileBuffer) {
              const ext = getExtension(file.name, file.contentType);
              const storagePath = `employees/${employeeNumber}/id.${ext}`;
              idImageUrl = await uploadToSupabaseStorage(
                supabaseAdmin,
                fileBuffer,
                'employee-documents',
                storagePath,
                file.contentType
              );
              if (idImageUrl) {
                filesUploaded++;
                console.log(`  → ID画像をアップロードしました: ${storagePath}`);
              }
            }
          }

          // パスポート画像の処理
          const passportFiles = employee.パスポート?.value as KintoneFileInfo[] | undefined;
          if (passportFiles && passportFiles.length > 0) {
            const file = passportFiles[0]; // 最初のファイルを使用
            console.log(`  従業員 ${employeeNumber}: パスポート画像をダウンロード中...`);
            const fileBuffer = await downloadKintoneFile(file.fileKey);
            if (fileBuffer) {
              const ext = getExtension(file.name, file.contentType);
              const storagePath = `employees/${employeeNumber}/passport.${ext}`;
              passportImageUrl = await uploadToSupabaseStorage(
                supabaseAdmin,
                fileBuffer,
                'employee-documents',
                storagePath,
                file.contentType
              );
              if (passportImageUrl) {
                filesUploaded++;
                console.log(`  → パスポート画像をアップロードしました: ${storagePath}`);
              }
            }
          }

          const data: Record<string, unknown> = {
            kintone_record_id: employee.$id.value,
            employee_number: employeeNumber,
            name: getFieldValue(employee.氏名) || '',
            name_th: getFieldValue(employee.氏名タイ語),
            email: getFieldValue(employee.メールアドレス),
            tel: getFieldValue(employee.TEL),
            position: getFieldValue(employee.役職),
            department: getFieldValue(employee.配属),
            status: getFieldValue(employee.在籍状況) || '在籍',
            employment_type: getFieldValue(employee.雇用形態),
            hire_date: getDateValue(employee.入社日),
            resign_date: getDateValue(employee.退社日),
            date_of_birth: getDateValue(employee.生年月日),
            address: getFieldValue(employee.住所),
            id_number: getFieldValue(employee.IdNo) || getFieldValue(employee.ID_No),
            id_expiry: getDateValue(employee.身分証有効期限),
            passport_number: getFieldValue(employee.パスポート番号),
            passport_expiry: getDateValue(employee.パスポート有効期限),
            visa_number: getFieldValue(employee.ビザ番号),
            visa_expiry: getDateValue(employee.ビザ有効期限),
            visa_type: getFieldValue(employee.ビザ種類),
            license_number: getFieldValue(employee.免許書番号),
            license_expiry: getDateValue(employee.免許有効期限),
            emergency_contact_name: getFieldValue(employee.緊急時連絡先氏名),
            emergency_contact_tel: getFieldValue(employee.緊急時連絡先TEL),
            emergency_contact_address: getFieldValue(employee.緊急時連絡先住所),
            bank_account: getFieldValue(employee.BBBL給与額込口座),
          };

          // ファイルURLがあれば追加
          if (idImageUrl) {
            data.id_image_url = idImageUrl;
          }
          if (passportImageUrl) {
            data.passport_image_url = passportImageUrl;
          }

          // Supabaseにupsert（employee_numberで一意性を確保）
          const { error } = await supabase
            .from('employees')
            .upsert(data, {
              onConflict: 'employee_number'
            });

          if (error) {
            console.error(`エラー: 従業員番号 ${employeeNumber} の取り込みに失敗:`, error.message);
            errors.push({ employee_number: employeeNumber, error: error.message });
            totalErrors++;
          } else {
            totalImported++;
          }
        } catch (err) {
          console.error(`エラー: 従業員の処理中にエラーが発生:`, err);
          errors.push({ employee_number: employee.$id.value, error: String(err) });
          totalErrors++;
        }
      }
    }

    // 取り込み後の件数確認
    const { count } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    const result = {
      success: true,
      totalRecords: allEmployees.length,
      imported: totalImported,
      filesUploaded,
      errors: totalErrors,
      errorDetails: errors.slice(0, 10),
      supabaseCount: count
    };

    console.log(`完了: 成功 ${totalImported}件、ファイル ${filesUploaded}件、エラー ${totalErrors}件`);
    return NextResponse.json(result);

  } catch (error) {
    console.error('取り込みエラー:', error);
    return NextResponse.json({
      error: '取り込み中にエラーが発生しました',
      details: String(error)
    }, { status: 500 });
  }
}

// GET: 現在のSupabase従業員数を取得
export async function GET() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
  }

  try {
    const { count, error } = await supabase
      .from('employees')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      count: count || 0,
      message: `Supabaseに${count || 0}件の従業員データがあります`
    });
  } catch (error) {
    return NextResponse.json({
      error: 'データ取得エラー',
      details: String(error)
    }, { status: 500 });
  }
}
