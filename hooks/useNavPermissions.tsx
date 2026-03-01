'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import type { MenuConfigItem, GroupedMenuConfig } from '@/lib/navigation/menu-items';

interface DynamicApp {
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
  icon: string | null;
}

interface NavPermissionsState {
  /** 各app_codeのcan_view/can_manage権限 */
  appPermissions: Record<string, { can_view: boolean; can_manage: boolean }>;
  /** システム管理者かどうか */
  isAdmin: boolean;
  /** メニュー設定（フラットモード用） */
  menuConfig: MenuConfigItem[] | null;
  /** グループ化メニュー設定 */
  groupedMenuConfig: GroupedMenuConfig | null;
  /** 動的アプリ一覧 */
  dynamicApps: DynamicApp[];
  /** ロード中かどうか */
  loading: boolean;
}

/**
 * ナビゲーション用権限フック
 * PermissionsProviderから全体権限を取得し、
 * /api/my-app-permissionsから各アプリのcan_view権限を取得する
 * /api/my-menu-configurationからメニュー設定を取得する
 */
export function useNavPermissions() {
  const { hasPermission, isAdmin: isPermAdmin, loading: permLoading } = usePermissions();

  const [state, setState] = useState<NavPermissionsState>({
    appPermissions: {},
    isAdmin: false,
    menuConfig: null,
    groupedMenuConfig: null,
    dynamicApps: [],
    loading: true,
  });

  const fetchAppPermissions = useCallback(async () => {
    try {
      const [appPermsRes, menuConfigRes, dynamicAppsRes] = await Promise.all([
        fetch('/api/my-app-permissions'),
        fetch('/api/my-menu-configuration'),
        fetch('/api/apps/dynamic'),
      ]);

      const appPermsData = appPermsRes.ok ? await appPermsRes.json() : { appPermissions: {}, isAdmin: false };
      const menuConfigData = menuConfigRes.ok ? await menuConfigRes.json() : { items: [] };
      const dynamicAppsData = dynamicAppsRes.ok ? await dynamicAppsRes.json() : { apps: [] };

      let menuConfig: MenuConfigItem[] | null = null;
      let groupedMenuConfig: GroupedMenuConfig | null = null;

      if (menuConfigData.mode === 'grouped') {
        groupedMenuConfig = {
          commonItems: menuConfigData.commonItems || [],
          groups: menuConfigData.groups || [],
        };
        // フラット互換用
        menuConfig = menuConfigData.items?.length > 0 ? menuConfigData.items : null;
      } else {
        menuConfig = menuConfigData.items?.length > 0 ? menuConfigData.items : null;
      }

      setState({
        appPermissions: appPermsData.appPermissions || {},
        isAdmin: appPermsData.isAdmin || false,
        menuConfig,
        groupedMenuConfig,
        dynamicApps: (dynamicAppsData.apps || []).map((a: DynamicApp) => ({
          code: a.code,
          name: a.name,
          name_en: a.name_en,
          name_th: a.name_th,
          icon: a.icon,
        })),
        loading: false,
      });
    } catch (err) {
      console.error('Error fetching nav permissions:', err);
      setState({ appPermissions: {}, isAdmin: false, menuConfig: null, groupedMenuConfig: null, dynamicApps: [], loading: false });
    }
  }, []);

  useEffect(() => {
    // PermissionsProviderのロードが完了してからアプリ権限を取得
    if (!permLoading) {
      fetchAppPermissions();
    }
  }, [permLoading, fetchAppPermissions]);

  /**
   * ナビ項目が表示可能かどうかを判定
   * @param appCode - アプリコード（nullの場合は常時表示 or 特殊権限）
   * @param requiredPermission - 必要な特殊権限（manage_settings, import_dataなど）
   */
  const canShowNavItem = useCallback(
    (appCode: string | null, requiredPermission?: 'manage_settings' | 'import_data'): boolean => {
      // ロード中は非表示にしない（全表示してチラつき防止）
      if (state.loading || permLoading) return true;

      // 管理者は全表示
      if (state.isAdmin || isPermAdmin) return true;

      // 特殊権限チェック
      if (requiredPermission) {
        return hasPermission(requiredPermission);
      }

      // app_codeなし → 常時表示
      if (!appCode) return true;

      // アプリのcan_view権限チェック
      const perm = state.appPermissions[appCode];
      return perm?.can_view ?? false;
    },
    [state.loading, state.isAdmin, state.appPermissions, permLoading, isPermAdmin, hasPermission]
  );

  /**
   * 指定アプリを管理できるかどうかを判定
   * @param appCode - アプリコード
   */
  const canManageApp = useCallback(
    (appCode: string): boolean => {
      if (state.loading || permLoading) return false;
      if (state.isAdmin || isPermAdmin) return true;
      if (hasPermission('manage_settings')) return true;
      const perm = state.appPermissions[appCode];
      return perm?.can_manage ?? false;
    },
    [state.loading, state.isAdmin, state.appPermissions, permLoading, isPermAdmin, hasPermission]
  );

  return {
    ...state,
    loading: state.loading || permLoading,
    canShowNavItem,
    canManageApp,
    refetch: fetchAppPermissions,
  };
}
