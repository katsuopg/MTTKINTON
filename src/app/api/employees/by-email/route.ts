import { NextRequest, NextResponse } from 'next/server';
import { KintoneClient } from '@/lib/kintone/client';
import { KINTONE_APPS, EmployeeRecord } from '@/types/kintone';

// メールアドレスで従業員を検索
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { error: 'メールアドレスが必要です' },
      { status: 400 }
    );
  }

  try {
    const client = new KintoneClient(
      KINTONE_APPS.EMPLOYEE_MANAGEMENT.appId.toString(),
      process.env.KINTONE_API_TOKEN_EMPLOYEE || ''
    );

    // メールアドレスで検索
    const records = await client.getRecords<EmployeeRecord>({
      query: `メールアドレス = "${email}"`,
      fields: ['$id', '氏名', 'メールアドレス', '部署', '配属', 'プロフィール画像'],
    });

    if (records.length === 0) {
      return NextResponse.json({ employee: null });
    }

    const employee = records[0];

    // プロフィール画像のURLを取得
    let profileImageUrl = null;
    const profileImageField = employee['プロフィール画像'];
    if (profileImageField?.value && Array.isArray(profileImageField.value) && profileImageField.value.length > 0) {
      const fileKey = profileImageField.value[0]?.fileKey;
      if (fileKey) {
        // Kintoneのファイルダウンロード用URLを構築
        profileImageUrl = `/api/employees/profile-image?fileKey=${fileKey}`;
      }
    }

    return NextResponse.json({
      employee: {
        id: employee.$id?.value,
        name: employee['氏名']?.value,
        email: employee['メールアドレス']?.value,
        department: employee['部署']?.value || employee['配属']?.value,
        profileImageUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching employee by email:', error);
    return NextResponse.json(
      { error: '従業員データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
