import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAppPermission } from '@/lib/auth/app-permissions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET: プロジェクト詳細取得（project_codeで検索）
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // アプリ権限チェック: プロジェクトの閲覧権限が必要
    const permCheck = await requireAppPermission('projects', 'can_view');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { id } = await params;
    const supabase = await createClient();

    // project_code または UUID で検索
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const column = isUuid ? 'id' : 'project_code';

    const { data: project, error } = await (supabase
      .from('projects') as SupabaseAny)
      .select(`
        *,
        status:project_statuses(*),
        sales_person:employees!sales_person_id(id, name, nickname)
      `)
      .eq(column, id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

// PATCH: プロジェクト更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    // アプリ権限チェック: プロジェクトの編集権限が必要
    const permCheck = await requireAppPermission('projects', 'can_edit');
    if (!permCheck.allowed) {
      return NextResponse.json({ error: permCheck.error }, { status: permCheck.status });
    }

    const { id } = await params;
    const supabase = await createClient();
    const body = await request.json();

    const { data: { user } } = await supabase.auth.getUser();

    // 楽観ロック: クライアントが送信したupdated_atとDB上の値を比較
    if (body.expected_updated_at) {
      const { data: current } = await (supabase.from('projects') as SupabaseAny)
        .select('updated_at')
        .eq('id', id)
        .single();
      if (current) {
        const dbUpdatedAt = new Date(current.updated_at).getTime();
        const clientUpdatedAt = new Date(body.expected_updated_at).getTime();
        if (dbUpdatedAt !== clientUpdatedAt) {
          return NextResponse.json(
            { error: 'Record has been modified by another user. Please reload and try again.', code: 'CONFLICT' },
            { status: 409 }
          );
        }
      }
    }

    const updateData: Record<string, unknown> = {
      updated_by: user!.id,
    };

    const allowedFields = [
      'project_name',
      'description',
      'customer_code',
      'customer_name',
      'work_no',
      'sales_person_id',
      'start_date',
      'due_date',
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    console.log('[DEBUG PATCH /api/projects] body:', JSON.stringify(body));
    console.log('[DEBUG PATCH /api/projects] updateData:', JSON.stringify(updateData));

    // ステータスコードが指定された場合はstatus_idに変換
    if (body.status_code) {
      const { data: status } = await (supabase
        .from('project_statuses') as SupabaseAny)
        .select('id')
        .eq('code', body.status_code)
        .single();

      if (status) {
        updateData.status_id = status.id;
      }
    }

    const { data: project, error } = await (supabase
      .from('projects') as SupabaseAny)
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        status:project_statuses(*),
        sales_person:employees!sales_person_id(id, name, nickname)
      `)
      .single();

    if (error) {
      console.error('[DEBUG PATCH /api/projects] DB error:', error);
      throw error;
    }

    console.log('[DEBUG PATCH /api/projects] saved project sales_person_id:', project?.sales_person_id, 'sales_person:', project?.sales_person);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}
