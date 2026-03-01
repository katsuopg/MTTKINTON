import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * エンティティ検索API
 * GET /api/apps/entity-search?type=user|org|role&search=...&ids=uuid1,uuid2
 * ユーザー/組織/グループの候補検索・ID解決
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const entityType = url.searchParams.get('type');
  const search = url.searchParams.get('search') || '';
  const ids = url.searchParams.get('ids'); // カンマ区切りのUUID（表示名解決用）

  if (!entityType || !['user', 'org', 'role'].includes(entityType)) {
    return NextResponse.json({ error: 'Invalid type parameter. Use: user, org, role' }, { status: 400 });
  }

  try {
    if (entityType === 'user') {
      return await searchUsers(supabase, search, ids);
    } else if (entityType === 'org') {
      return await searchOrganizations(supabase, search, ids);
    } else {
      return await searchRoles(supabase, search, ids);
    }
  } catch (err) {
    console.error('Entity search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function searchUsers(supabase: any, search: string, ids: string | null) {
  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    const { data } = await supabase
      .from('employees')
      .select('id, name, name_th, email, employee_number, department, status')
      .in('id', idList);
    return NextResponse.json({ items: (data || []).map(formatUser) });
  }

  let query = supabase
    .from('employees')
    .select('id, name, name_th, email, employee_number, department, status')
    .eq('status', '在籍')
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,name_th.ilike.%${search}%,email.ilike.%${search}%,employee_number.ilike.%${search}%`);
  }

  const { data } = await query.limit(20);
  return NextResponse.json({ items: (data || []).map(formatUser) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatUser(e: any) {
  return {
    id: e.id,
    label: e.name || e.email || e.id,
    label_th: e.name_th || null,
    sub: e.email || e.employee_number || '',
    department: e.department || null,
    status: e.status,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function searchOrganizations(supabase: any, search: string, ids: string | null) {
  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    const { data } = await supabase
      .from('organizations')
      .select('id, code, name, name_en, name_th, is_active')
      .in('id', idList);
    return NextResponse.json({ items: (data || []).map(formatOrg) });
  }

  let query = supabase
    .from('organizations')
    .select('id, code, name, name_en, name_th, is_active')
    .eq('is_active', true)
    .order('display_order');

  if (search) {
    query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,name_th.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data } = await query.limit(20);
  return NextResponse.json({ items: (data || []).map(formatOrg) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatOrg(o: any) {
  return {
    id: o.id,
    label: o.name || o.code || o.id,
    label_en: o.name_en || null,
    label_th: o.name_th || null,
    sub: o.code || '',
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function searchRoles(supabase: any, search: string, ids: string | null) {
  if (ids) {
    const idList = ids.split(',').filter(Boolean);
    const { data } = await supabase
      .from('roles')
      .select('id, code, name, name_en, name_th, is_system_role, is_active')
      .in('id', idList);
    return NextResponse.json({ items: (data || []).map(formatRole) });
  }

  let query = supabase
    .from('roles')
    .select('id, code, name, name_en, name_th, is_system_role, is_active')
    .eq('is_active', true)
    .order('display_order');

  if (search) {
    query = query.or(`name.ilike.%${search}%,name_en.ilike.%${search}%,name_th.ilike.%${search}%,code.ilike.%${search}%`);
  }

  const { data } = await query.limit(20);
  return NextResponse.json({ items: (data || []).map(formatRole) });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatRole(r: any) {
  return {
    id: r.id,
    label: r.name || r.code || r.id,
    label_en: r.name_en || null,
    label_th: r.name_th || null,
    sub: r.code || '',
    is_system_role: r.is_system_role || false,
  };
}
