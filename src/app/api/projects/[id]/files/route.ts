import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: プロジェクトのファイル一覧
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await (supabase.from('project_files') as SupabaseAny)
      .select('*')
      .eq('project_id', id)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;

    // 署名付きURLを生成
    const filesWithUrls = await Promise.all(
      (data || []).map(async (file: SupabaseAny) => {
        const { data: signedData } = await supabase.storage
          .from('project-files')
          .createSignedUrl(file.file_path, 3600);
        return {
          ...file,
          url: signedData?.signedUrl || null,
        };
      })
    );

    return NextResponse.json({ files: filesWithUrls });
  } catch (error) {
    console.error('Error fetching project files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

// POST: ファイルアップロード
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_add');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // ファイルタイプ判定
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    let fileType = 'other';
    if (['pdf'].includes(ext)) fileType = 'pdf';
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext)) fileType = 'image';
    else if (['dwg', 'dxf'].includes(ext)) fileType = 'dwg';
    else if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) fileType = 'doc';

    // Storageにアップロード（ファイル名にはtimestamp+拡張子のみ使用し、パストラバーサルを防止）
    const filePath = `${id}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('project-files')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // DBにメタデータ登録
    const { data: record, error: dbError } = await (supabase.from('project_files') as SupabaseAny)
      .insert({
        project_id: id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: fileType,
        description,
        uploaded_by: user!.id,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json(record);
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
  }
}

// DELETE: ファイル削除
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const permCheck = await requireAppPermission('projects', 'can_delete');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get('file_id');
    if (!fileId) {
      return NextResponse.json({ error: 'file_id required' }, { status: 400 });
    }

    // ファイルパス取得
    const { data: file, error: fetchError } = await (supabase.from('project_files') as SupabaseAny)
      .select('file_path')
      .eq('id', fileId)
      .eq('project_id', id)
      .single();

    if (fetchError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Storage削除
    await supabase.storage.from('project-files').remove([file.file_path]);

    // DB削除
    await (supabase.from('project_files') as SupabaseAny)
      .delete()
      .eq('id', fileId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 });
  }
}
