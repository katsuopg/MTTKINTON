import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: ファイル一覧
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // ファイルダウンロード
    if (action === 'download') {
      const filePath = searchParams.get('file_path');
      if (!filePath) {
        return NextResponse.json({ error: 'file_path required' }, { status: 400 });
      }

      // パストラバーサル対策: ../やプロトコルを含むパスを拒否
      if (filePath.includes('..') || filePath.startsWith('/') || filePath.includes('://')) {
        return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
      }

      // DBに登録されたファイルパスか検証
      const { data: fileRecord } = await (supabase
        .from('dom_item_files') as SupabaseAny)
        .select('id')
        .eq('file_path', filePath)
        .single();
      if (!fileRecord) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
      }

      const { data: blob, error: dlError } = await supabase.storage
        .from('dom-files')
        .download(filePath);
      if (dlError || !blob) {
        return NextResponse.json({ error: 'Download failed' }, { status: 500 });
      }
      const arrayBuffer = await blob.arrayBuffer();
      const fileName = filePath.split('/').pop() || 'file';
      return new NextResponse(arrayBuffer, {
        headers: {
          'Content-Type': blob.type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        },
      });
    }

    // ファイル一覧
    const itemType = searchParams.get('item_type');
    const itemId = searchParams.get('item_id');

    let query = (supabase.from('dom_item_files') as SupabaseAny)
      .select('*')
      .order('uploaded_at', { ascending: false });

    if (itemType) query = query.eq('item_type', itemType);
    if (itemId) query = query.eq('item_id', itemId);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

// POST: ファイルアップロード＋レコード作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const itemType = formData.get('item_type') as string;
    const itemId = formData.get('item_id') as string;
    const description = formData.get('description') as string | null;
    const revision = parseInt(formData.get('revision') as string || '0', 10);

    if (!file || !itemType || !itemId) {
      return NextResponse.json(
        { error: 'file, item_type, item_id required' },
        { status: 400 }
      );
    }

    // ファイルタイプ判定
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const fileType = ['pdf', 'dwg', 'jpeg', 'jpg', 'png'].includes(ext)
      ? (ext === 'jpg' ? 'jpeg' : ext) as string
      : 'other';

    // Storageキーはtimestamp+拡張子のみ（日本語・特殊文字を回避）。元ファイル名はDBに保持
    const filePath = `${itemType}/${itemId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('dom-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // DBレコード作成
    const { data, error } = await (supabase
      .from('dom_item_files') as SupabaseAny)
      .insert({
        item_type: itemType,
        item_id: itemId,
        file_name: file.name,
        file_type: fileType,
        file_path: filePath,
        file_size: file.size,
        revision,
        description: description || null,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// DELETE: ファイル削除（Storage + DB）
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('file_id');

    if (!fileId) {
      return NextResponse.json({ error: 'file_id required' }, { status: 400 });
    }

    // ファイルパスを取得
    const { data: fileRecord } = await (supabase
      .from('dom_item_files') as SupabaseAny)
      .select('file_path')
      .eq('id', fileId)
      .single();

    if (fileRecord?.file_path) {
      await supabase.storage
        .from('dom-files')
        .remove([fileRecord.file_path]);
    }

    // DBレコード削除
    const { error } = await (supabase
      .from('dom_item_files') as SupabaseAny)
      .delete()
      .eq('id', fileId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
