import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileKey = searchParams.get('fileKey');

  if (!fileKey) {
    return NextResponse.json({ error: 'fileKey is required' }, { status: 400 });
  }

  try {
    const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
    const API_TOKEN = process.env.KINTONE_API_TOKEN_EMPLOYEE;

    if (!KINTONE_DOMAIN || !API_TOKEN) {
      throw new Error('Kintone configuration is missing');
    }

    // Kintoneからファイルを取得
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/file.json?fileKey=${fileKey}`,
      {
        method: 'GET',
        headers: {
          'X-Cybozu-API-Token': API_TOKEN,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // ファイルのバイナリデータを取得
    const blob = await response.blob();

    // レスポンスヘッダーを設定（インライン表示用）
    const headers = new Headers();
    headers.set('Content-Disposition', 'inline');
    headers.set('Content-Type', blob.type || 'image/jpeg');
    headers.set('Cache-Control', 'public, max-age=3600'); // 1時間キャッシュ

    // ファイルを返す
    return new Response(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Profile image download error:', error);
    return NextResponse.json(
      { error: 'Failed to download profile image' },
      { status: 500 }
    );
  }
}
