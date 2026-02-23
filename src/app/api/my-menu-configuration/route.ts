import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { COMMON_MENU_KEYS } from '@/lib/navigation/menu-items';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const from = (supabase: Awaited<ReturnType<typeof createClient>>, table: string) => supabase.from(table) as any;

/**
 * 現在のユーザーに適用されるメニュー設定を取得
 * GET /api/my-menu-configuration
 *
 * レスポンス形式:
 * - グループ設定あり: { mode: "grouped", commonItems: [...], groups: [...], items: [...] }
 * - フラット設定のみ: { mode: "flat", items: [...] }
 * - 設定なし:         { items: [] }
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.email || '';
    const employeeNumberFromMeta = user.user_metadata?.employee_number || '';

    // 従業員IDを特定（UUID + kintone_record_id）
    let employeeId: string | null = null;
    let kintoneRecordId: string | null = null;

    if (employeeNumberFromMeta) {
      const { data: employee } = await from(supabase, 'employees')
        .select('id, kintone_record_id')
        .eq('employee_number', employeeNumberFromMeta)
        .single();
      if (employee) {
        employeeId = employee.id;
        kintoneRecordId = employee.kintone_record_id;
      }
    }

    if (!employeeId && userEmail.endsWith('@mtt.internal')) {
      const employeeNumber = userEmail.replace('@mtt.internal', '');
      const { data: employee } = await from(supabase, 'employees')
        .select('id, kintone_record_id')
        .eq('employee_number', employeeNumber)
        .single();
      if (employee) {
        employeeId = employee.id;
        kintoneRecordId = employee.kintone_record_id;
      }
    }

    if (!employeeId && userEmail) {
      const { data: employee } = await from(supabase, 'employees')
        .select('id, kintone_record_id')
        .eq('company_email', userEmail)
        .single();
      if (employee) {
        employeeId = employee.id;
        kintoneRecordId = employee.kintone_record_id;
      }
    }

    if (!employeeId) {
      return NextResponse.json({ items: [] });
    }

    // 管理者判定: user_roles → roles.code === 'system_admin'
    let isAdmin = false;
    {
      const { data: adminRole } = await from(supabase, 'roles')
        .select('id')
        .eq('code', 'system_admin')
        .single();

      if (adminRole) {
        const { data: userRole } = await from(supabase, 'user_roles')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('role_id', adminRole.id)
          .eq('is_active', true)
          .limit(1)
          .single();
        isAdmin = !!userRole;
      }
    }

    // 対象組織IDの決定
    let targetOrgIds: string[] = [];

    if (isAdmin) {
      // 管理者: メニュー設定がある全組織を取得
      const { data: orgConfigs } = await from(supabase, 'menu_configurations')
        .select('organization_id')
        .not('organization_id', 'is', null);

      const orgIdsWithConfig = [...new Set(
        (orgConfigs || [])
          .map((c: { organization_id: string }) => c.organization_id)
          .filter(Boolean)
      )] as string[];
      targetOrgIds = orgIdsWithConfig;
    } else {
      // 一般ユーザー: 所属組織のうちメニュー設定があるもの
      // organization_members.employee_id は kintone_record_id を格納している
      const orgMemberEmployeeId = kintoneRecordId || employeeId;
      const { data: orgMembers } = await from(supabase, 'organization_members')
        .select('organization_id')
        .eq('employee_id', orgMemberEmployeeId)
        .eq('is_active', true);

      const memberOrgIds = (orgMembers || []).map((m: { organization_id: string }) => m.organization_id);

      if (memberOrgIds.length > 0) {
        // メニュー設定がある組織のみ
        const { data: orgConfigs } = await from(supabase, 'menu_configurations')
          .select('organization_id')
          .in('organization_id', memberOrgIds);

        targetOrgIds = [...new Set(
          (orgConfigs || [])
            .map((c: { organization_id: string }) => c.organization_id)
            .filter(Boolean)
        )] as string[];
      }
    }

    // グループ設定がある場合 → grouped レスポンス
    if (targetOrgIds.length > 0) {
      // 一括取得: メニュー設定 + 組織情報（各クエリで新しいクエリビルダーを使用）
      const [menuConfigsResult, orgsResult, defaultConfigResult] = await Promise.all([
        from(supabase, 'menu_configurations')
          .select('organization_id, menu_key, display_order, is_visible')
          .in('organization_id', targetOrgIds)
          .order('display_order', { ascending: true }),
        from(supabase, 'organizations')
          .select('id, name, name_en, name_th, display_order')
          .in('id', targetOrgIds)
          .eq('is_active', true)
          .order('display_order', { ascending: true }),
        from(supabase, 'menu_configurations')
          .select('menu_key, display_order, is_visible')
          .is('organization_id', null)
          .order('display_order', { ascending: true }),
      ]);

      const allMenuConfigs: { organization_id: string; menu_key: string; display_order: number; is_visible: boolean }[] = menuConfigsResult.data || [];
      const orgs: { id: string; name: string; name_en: string | null; name_th: string | null; display_order: number }[] = orgsResult.data || [];
      const defaultConfig: { menu_key: string; display_order: number; is_visible: boolean }[] = defaultConfigResult.data || [];

      // 組織情報マップ
      const orgMap = new Map(orgs.map((o) => [o.id, o]));

      // 組織ごとにメニュー設定をグルーピング
      // 管理者の場合は全項目を表示可能にする
      const configByOrg = new Map<string, { menu_key: string; display_order: number; is_visible: boolean }[]>();
      for (const config of allMenuConfigs) {
        const list = configByOrg.get(config.organization_id) || [];
        list.push({ menu_key: config.menu_key, display_order: config.display_order, is_visible: isAdmin ? true : config.is_visible });
        configByOrg.set(config.organization_id, list);
      }

      // 共通項目: デフォルト設定の共通キーのみ抽出。なければ共通キーをis_visible=trueで生成
      // 管理者の場合は常にis_visible=true
      const commonItems: { menu_key: string; display_order: number; is_visible: boolean }[] = [];
      if (defaultConfig.length > 0) {
        for (const item of defaultConfig) {
          if (COMMON_MENU_KEYS.includes(item.menu_key)) {
            commonItems.push({ ...item, is_visible: isAdmin ? true : item.is_visible });
          }
        }
      }
      // デフォルト設定にない共通キーを追加
      for (const key of COMMON_MENU_KEYS) {
        if (!commonItems.some((c) => c.menu_key === key)) {
          commonItems.push({ menu_key: key, display_order: commonItems.length, is_visible: true });
        }
      }

      // グループ構築
      const groups = targetOrgIds
        .map((orgId) => {
          const org = orgMap.get(orgId);
          if (!org) return null;
          const orgItems = (configByOrg.get(orgId) || [])
            .filter((item) => !COMMON_MENU_KEYS.includes(item.menu_key));
          return {
            organizationId: orgId,
            organizationName: org.name,
            organizationNameEn: org.name_en,
            organizationNameTh: org.name_th,
            displayOrder: org.display_order ?? 0,
            items: orgItems,
          };
        })
        .filter(Boolean);

      // フラット items も互換用に生成
      const flatItems = defaultConfig.length > 0 ? defaultConfig : [];

      return NextResponse.json({
        mode: 'grouped',
        commonItems,
        groups,
        items: flatItems,
      });
    }

    // デフォルト設定（organization_id IS NULL）をフラットで返却
    const { data: defaultConfig } = await from(supabase, 'menu_configurations')
      .select('menu_key, display_order, is_visible')
      .is('organization_id', null)
      .order('display_order', { ascending: true });

    if (defaultConfig && defaultConfig.length > 0) {
      // 管理者の場合は全項目を表示可能にする
      const items = isAdmin
        ? defaultConfig.map((item: { menu_key: string; display_order: number; is_visible: boolean }) => ({ ...item, is_visible: true }))
        : defaultConfig;
      return NextResponse.json({ mode: 'flat', items });
    }

    // 設定なし
    return NextResponse.json({ items: [] });
  } catch (error) {
    console.error('Error in GET /api/my-menu-configuration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
