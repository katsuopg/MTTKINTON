import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const fileKey = searchParams.get('fileKey');
  const fileName = searchParams.get('fileName') || 'download';
  const inline = searchParams.get('inline') === 'true';
  
  if (!fileKey) {
    return NextResponse.json({ error: 'fileKey is required' }, { status: 400 });
  }

  try {
    const KINTONE_DOMAIN = process.env.KINTONE_DOMAIN;
    const API_TOKEN = process.env.KINTONE_API_TOKEN_ORDER; // 適切なトークンを使用
    
    // Kintoneからファイルを取得
    const response = await fetch(
      `https://${KINTONE_DOMAIN}/k/v1/file.json?fileKey=${fileKey}`,
      {
        method: 'GET',
        headers: {
          'X-Cybozu-API-Token': API_TOKEN!,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.statusText}`);
    }

    // ファイルのバイナリデータを取得
    const blob = await response.blob();
    
    // レスポンスヘッダーを設定
    const headers = new Headers();
    
    // inlineパラメータがtrueの場合はインライン表示、そうでない場合はダウンロード
    if (inline) {
      headers.set('Content-Disposition', `inline; filename="${fileName}"`);
    } else {
      headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    }
    
    headers.set('Content-Type', blob.type || 'application/octet-stream');
    
    // ファイルを返す
    return new Response(blob, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}