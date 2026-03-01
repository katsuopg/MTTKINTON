import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

type Params = { params: Promise<{ appCode: string; recordId: string }> };

/**
 * レコードのファイル一覧取得
 * GET /api/apps/[appCode]/records/[recordId]/files?fieldCode=xxx
 */
export async function GET(request: Request, { params }: Params) {
  try {
    const { appCode, recordId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const url = new URL(request.url);
    const fieldCode = url.searchParams.get('fieldCode');

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filesTable = supabase.from('app_record_files') as any;
    let query = filesTable
      .select('id, field_code, file_name, file_path, file_size, mime_type, uploaded_by, uploaded_at')
      .eq('app_id', app.id)
      .eq('record_id', recordId)
      .order('uploaded_at', { ascending: true });

    if (fieldCode) {
      query = query.eq('field_code', fieldCode);
    }

    const { data: files, error } = await query;

    if (error) {
      console.error('Error fetching files:', error);
      return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
    }

    // 署名付きURLを生成
    const filesWithUrls = await Promise.all(
      (files || []).map(async (file: { id: string; file_path: string; file_name: string; file_size: number; mime_type: string; field_code: string; uploaded_at: string }) => {
        const { data: urlData } = await supabase.storage
          .from('app-files')
          .createSignedUrl(file.file_path, 3600); // 1時間有効

        return {
          ...file,
          url: urlData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error('Error in GET files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * ファイルアップロード
 * POST /api/apps/[appCode]/records/[recordId]/files
 * multipart/form-data: file, fieldCode
 */
export async function POST(request: Request, { params }: Params) {
  try {
    const { appCode, recordId } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fieldCode = formData.get('fieldCode') as string | null;

    if (!file || !fieldCode) {
      return NextResponse.json({ error: 'file and fieldCode are required' }, { status: 400 });
    }

    if (file.size > 52428800) { // 50MB
      return NextResponse.json({ error: 'File too large (max 50MB)' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const appsTable = supabase.from('apps') as any;
    const { data: app } = await appsTable
      .select('id')
      .eq('code', appCode)
      .eq('is_active', true)
      .single();

    if (!app) {
      return NextResponse.json({ error: 'App not found' }, { status: 404 });
    }

    // ストレージにアップロード
    const ext = file.name.split('.').pop() || '';
    const storagePath = `${app.id}/${recordId}/${fieldCode}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('app-files')
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
    }

    // メタデータ保存
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filesTable = supabase.from('app_record_files') as any;
    const { data: fileMeta, error: metaError } = await filesTable
      .insert({
        app_id: app.id,
        record_id: recordId,
        field_code: fieldCode,
        file_name: file.name,
        file_path: storagePath,
        file_size: file.size,
        mime_type: file.type,
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (metaError) {
      console.error('Metadata save error:', metaError);
      // ストレージのファイルを削除（ロールバック）
      await supabase.storage.from('app-files').remove([storagePath]);
      return NextResponse.json({ error: 'Failed to save file metadata' }, { status: 500 });
    }

    // 署名付きURL生成
    const { data: urlData } = await supabase.storage
      .from('app-files')
      .createSignedUrl(storagePath, 3600);

    return NextResponse.json({
      file: { ...fileMeta, url: urlData?.signedUrl || null },
    }, { status: 201 });
  } catch (error) {
    console.error('Error in POST files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * ファイル削除
 * DELETE /api/apps/[appCode]/records/[recordId]/files?fileId=xxx
 */
export async function DELETE(request: Request, { params }: Params) {
  try {
    const { appCode } = await params;
    const permCheck = await requireAppPermission(appCode, 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const supabase = await createClient();
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    // ファイルメタデータ取得
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filesTable = supabase.from('app_record_files') as any;
    const { data: fileMeta } = await filesTable
      .select('file_path')
      .eq('id', fileId)
      .single();

    if (!fileMeta) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // ストレージから削除
    await supabase.storage.from('app-files').remove([fileMeta.file_path]);

    // メタデータ削除
    const { error } = await filesTable.delete().eq('id', fileId);

    if (error) {
      console.error('Error deleting file metadata:', error);
      return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE files:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
