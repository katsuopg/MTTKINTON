import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { ProjectCreate, ProjectSearchParams } from '@/types/project';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseAny = any;

// GET: プロジェクト一覧取得
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    const params: ProjectSearchParams = {
      status_code: searchParams.get('status_code') as ProjectSearchParams['status_code'] || undefined,
      search: searchParams.get('search') || undefined,
      work_no: searchParams.get('work_no') || undefined,
    };

    // ステータス一覧取得
    const { data: statuses } = await (supabase
      .from('project_statuses') as SupabaseAny)
      .select('*')
      .order('sort_order');

    // プロジェクト一覧取得
    let query = (supabase.from('projects') as SupabaseAny)
      .select(`
        *,
        status:project_statuses(*),
        sales_person:employees!sales_person_id(id, name, nickname)
      `)
      .order('created_at', { ascending: false });

    // フィルター適用
    if (params.status_code && statuses) {
      const status = statuses.find((s: SupabaseAny) => s.code === params.status_code);
      if (status) {
        query = query.eq('status_id', status.id);
      }
    }

    if (params.work_no) {
      query = query.eq('work_no', params.work_no);
    }

    if (params.search) {
      query = query.or(`project_code.ilike.%${params.search}%,project_name.ilike.%${params.search}%,customer_name.ilike.%${params.search}%`);
    }

    const { data: projects, error } = await query;

    if (error) {
      throw error;
    }

    return NextResponse.json({
      statuses: statuses || [],
      projects: projects || [],
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST: プロジェクト作成
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: ProjectCreate = await request.json();

    // 認証チェック
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
    }

    // バリデーション
    const missing: string[] = [];
    if (!body.project_name || !body.project_name.trim()) missing.push('プロジェクト名');
    if (!body.customer_code && !body.customer_name) missing.push('顧客');
    if (!body.start_date || !body.start_date.trim()) missing.push('開始日');

    if (missing.length > 0) {
      return NextResponse.json(
        { error: `${missing.join('・')}を入力してください` },
        { status: 400 }
      );
    }

    // ステータス取得
    const statusCode = body.status_code || 'estimating';
    const { data: status } = await (supabase
      .from('project_statuses') as SupabaseAny)
      .select('id')
      .eq('code', statusCode)
      .single();

    if (!status) {
      return NextResponse.json(
        { error: 'ステータスの取得に失敗しました。管理者に連絡してください。' },
        { status: 500 }
      );
    }

    // 空文字をnullに変換するヘルパー
    const toNullIfEmpty = (val: string | null | undefined): string | null =>
      val && val.trim() ? val.trim() : null;

    // プロジェクト作成（project_code空欄ならDBトリガーで自動採番）
    const insertData: Record<string, unknown> = {
      project_name: body.project_name.trim(),
      description: toNullIfEmpty(body.description),
      status_id: status.id,
      customer_code: toNullIfEmpty(body.customer_code),
      customer_name: toNullIfEmpty(body.customer_name),
      work_no: toNullIfEmpty(body.work_no),
      sales_person_id: toNullIfEmpty(body.sales_person_id),
      start_date: toNullIfEmpty(body.start_date),
      due_date: toNullIfEmpty(body.due_date),
      created_by: user.id,
    };

    // 手動入力されたproject_codeがあればセット
    const projectCode = toNullIfEmpty(body.project_code);
    if (projectCode) {
      insertData.project_code = projectCode;
    }

    const { data: project, error } = await (supabase
      .from('projects') as SupabaseAny)
      .insert(insertData)
      .select(`
        *,
        status:project_statuses(*),
        sales_person:employees!sales_person_id(id, name, nickname)
      `)
      .single();

    if (error) {
      // PJコード重複
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '同じPJコードのプロジェクトが既に存在します。別のコードを入力するか、空欄にして自動採番してください。' },
          { status: 409 }
        );
      }
      throw error;
    }

    return NextResponse.json(project);
  } catch (error: unknown) {
    console.error('Error creating project:', error);

    const pgError = error as { code?: string; message?: string };
    // PostgreSQLエラーコードに基づくメッセージ
    if (pgError.code === '22007') {
      return NextResponse.json(
        { error: '日付の形式が正しくありません。正しい日付を入力してください。' },
        { status: 400 }
      );
    }
    if (pgError.code === '23503') {
      return NextResponse.json(
        { error: '参照先のデータが見つかりません。選択内容を確認してください。' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'プロジェクトの作成に失敗しました。入力内容を確認のうえ、再度お試しください。' },
      { status: 500 }
    );
  }
}
