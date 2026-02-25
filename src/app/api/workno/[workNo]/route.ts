import { NextRequest, NextResponse } from 'next/server';
import { KintoneClient } from '@/lib/kintone/client';
import { requireAppPermission } from '@/lib/auth/app-permissions';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ workNo: string }> }
) {
  try {
    // 権限チェック
    const permCheck = await requireAppPermission('work_numbers', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { workNo } = await params;
    const body = await request.json();

    // Kintoneクライアントの初期化
    const client = new KintoneClient(
      '21', // Work No.アプリID
      process.env.KINTONE_API_TOKEN_WORKNO!
    );

    // まず、該当レコードを検索して$idを取得
    const searchQuery = `WorkNo = "${workNo}"`;
    const records = await client.getRecords(searchQuery);

    if (records.length === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    const recordId = records[0].$id.value;

    // 更新用のレコードデータを構築
    const updateRecord: any = {
      Status: { value: body.status },
      Start_date: { value: body.startDate || null },
      Finish_date: { value: body.finishDate || null },
      Salesdate: { value: body.salesDate || null },
      文字列__1行__8: { value: body.csId },
      文字列__1行__1: { value: body.category },
      文字列__1行__2: { value: body.description },
      文字列__1行__9: { value: body.model },
      grand_total: { value: body.grandTotal },
      profit: { value: body.profit },
      文字列__複数行__0: { value: body.remarks },
      // 請求書関連フィールド
      文字列__1行__3: { value: body.inv3 },
      文字列__1行__4: { value: body.inv4 },
      文字列__1行__6: { value: body.inv6 },
      文字列__1行__7: { value: body.inv7 },
      // 担当者
      Parson_in_charge: { value: body.personInCharge },
    };

    // Kintoneのレコードを更新
    const response = await fetch(
      `${process.env.KINTONE_DOMAIN}/k/v1/record.json`,
      {
        method: 'PUT',
        headers: {
          'X-Cybozu-API-Token': process.env.KINTONE_API_TOKEN_WORKNO!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          app: '21',
          id: recordId,
          record: updateRecord,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Kintone update error:', errorData);
      return NextResponse.json(
        { error: 'Failed to update record', details: errorData },
        { status: response.status }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      revision: result.revision,
    });
  } catch (error) {
    console.error('Error updating work no:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}