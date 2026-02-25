import { NextResponse } from 'next/server'
import { KintoneClient } from '@/lib/kintone/client'
import { requireAppPermission } from '@/lib/auth/app-permissions'

// 注文書レコードの型定義
interface OrderRecord {
  $id: { type: "__ID__"; value: string }
  レコード番号: { type: "RECORD_NUMBER"; value: string }
  文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string } // PO番号
  文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string } // CS ID
  文字列__1行__2: { type: "SINGLE_LINE_TEXT"; value: string } // 工事番号
  文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string } // 顧客名
  日付: { type: "DATE"; value: string } // 注文日
  日付_0: { type: "DATE"; value: string } // 見積日
  ルックアップ: { type: "SINGLE_LINE_TEXT"; value: string } // 見積番号
  数値_3: { type: "NUMBER"; value: string } // 値引き前金額
  数値_4: { type: "NUMBER"; value: string } // 値引き額
  AF: { type: "NUMBER"; value: string } // 値引き後金額
  amount: { type: "CALC"; value: string } // 合計金額（税込）
  vat: { type: "CALC"; value: string } // 消費税額
  添付ファイル: { type: "FILE"; value: Array<{
    fileKey: string;
    name: string;
    contentType: string;
    size: string;
  }> }
  更新日時: { type: "UPDATED_TIME"; value: string }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 権限チェック
    const permCheck = await requireAppPermission('orders', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { id } = await params;
    const apiToken = process.env.KINTONE_API_TOKEN_ORDER
    if (!apiToken) {
      throw new Error('KINTONE_API_TOKEN_ORDER is not set')
    }

    const appId = process.env.KINTONE_APP_ORDER_MANAGEMENT! // ORDER_MANAGEMENT app ID
    const client = new KintoneClient(appId, apiToken)

    // レコードIDで注文書を取得
    const record = await client.getRecord<OrderRecord>(id)
    
    if (!record) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error fetching order detail:', error)
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    )
  }
}