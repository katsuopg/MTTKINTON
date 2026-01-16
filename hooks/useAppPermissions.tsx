'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';

// アプリ権限タイプ
export interface AppPermission {
  can_view: boolean;
  can_add: boolean;
  can_edit: boolean;
  can_delete: boolean;
  can_manage: boolean;
  can_export: boolean;
  can_import: boolean;
}

// フィールド権限タイプ
export interface FieldPermission {
  field_name: string;
  access_level: 'view' | 'edit' | 'hidden';
}

// アプリ権限状態
interface AppPermissionsState {
  appCode: string;
  appPermission: AppPermission;
  fieldPermissions: FieldPermission[];
  loading: boolean;
  error: string | null;
}

interface AppPermissionsContextValue extends AppPermissionsState {
  hasAppPermission: (permission: keyof AppPermission) => boolean;
  getFieldPermission: (fieldName: string) => 'view' | 'edit' | 'hidden' | 'full';
  canViewField: (fieldName: string) => boolean;
  canEditField: (fieldName: string) => boolean;
  isFieldHidden: (fieldName: string) => boolean;
  refetch: () => Promise<void>;
}

// デフォルト権限
const DEFAULT_APP_PERMISSION: AppPermission = {
  can_view: false,
  can_add: false,
  can_edit: false,
  can_delete: false,
  can_manage: false,
  can_export: false,
  can_import: false,
};

// コンテキスト
const AppPermissionsContext = createContext<AppPermissionsContextValue | null>(null);

/**
 * アプリ権限プロバイダー
 * 各アプリページのレイアウトで使用
 */
export function AppPermissionsProvider({
  appCode,
  children,
}: {
  appCode: string;
  children: ReactNode;
}) {
  const [state, setState] = useState<AppPermissionsState>({
    appCode,
    appPermission: DEFAULT_APP_PERMISSION,
    fieldPermissions: [],
    loading: true,
    error: null,
  });

  const fetchPermissions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // アプリ権限を取得
      const [appRes, fieldRes] = await Promise.all([
        fetch(`/api/app-permissions?app_code=${appCode}`),
        fetch(`/api/field-permissions?app_code=${appCode}`),
      ]);

      if (!appRes.ok || !fieldRes.ok) {
        if (appRes.status === 401 || fieldRes.status === 401) {
          setState({
            appCode,
            appPermission: DEFAULT_APP_PERMISSION,
            fieldPermissions: [],
            loading: false,
            error: null,
          });
          return;
        }
        throw new Error('Failed to fetch permissions');
      }

      const appData = await appRes.json();
      const fieldData = await fieldRes.json();

      // 権限を集約
      const aggregatedPermission: AppPermission = { ...DEFAULT_APP_PERMISSION };

      for (const perm of appData.permissions || []) {
        if (perm.can_view) aggregatedPermission.can_view = true;
        if (perm.can_add) aggregatedPermission.can_add = true;
        if (perm.can_edit) aggregatedPermission.can_edit = true;
        if (perm.can_delete) aggregatedPermission.can_delete = true;
        if (perm.can_manage) aggregatedPermission.can_manage = true;
        if (perm.can_export) aggregatedPermission.can_export = true;
        if (perm.can_import) aggregatedPermission.can_import = true;
      }

      setState({
        appCode,
        appPermission: aggregatedPermission,
        fieldPermissions: fieldData.permissions || [],
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching app permissions:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, [appCode]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasAppPermission = useCallback(
    (permission: keyof AppPermission): boolean => {
      return state.appPermission[permission];
    },
    [state.appPermission]
  );

  const getFieldPermission = useCallback(
    (fieldName: string): 'view' | 'edit' | 'hidden' | 'full' => {
      const fp = state.fieldPermissions.find((p) => p.field_name === fieldName);
      return fp?.access_level || 'full';
    },
    [state.fieldPermissions]
  );

  const canViewField = useCallback(
    (fieldName: string): boolean => {
      const permission = getFieldPermission(fieldName);
      return permission !== 'hidden';
    },
    [getFieldPermission]
  );

  const canEditField = useCallback(
    (fieldName: string): boolean => {
      const permission = getFieldPermission(fieldName);
      return permission === 'edit' || permission === 'full';
    },
    [getFieldPermission]
  );

  const isFieldHidden = useCallback(
    (fieldName: string): boolean => {
      const permission = getFieldPermission(fieldName);
      return permission === 'hidden';
    },
    [getFieldPermission]
  );

  const value: AppPermissionsContextValue = {
    ...state,
    hasAppPermission,
    getFieldPermission,
    canViewField,
    canEditField,
    isFieldHidden,
    refetch: fetchPermissions,
  };

  return (
    <AppPermissionsContext.Provider value={value}>
      {children}
    </AppPermissionsContext.Provider>
  );
}

/**
 * アプリ権限情報を取得するフック
 */
export function useAppPermissions(): AppPermissionsContextValue {
  const context = useContext(AppPermissionsContext);

  if (!context) {
    return {
      appCode: '',
      appPermission: DEFAULT_APP_PERMISSION,
      fieldPermissions: [],
      loading: true,
      error: 'AppPermissionsProvider not found',
      hasAppPermission: () => false,
      getFieldPermission: () => 'hidden' as const,
      canViewField: () => false,
      canEditField: () => false,
      isFieldHidden: () => true,
      refetch: async () => {},
    };
  }

  return context;
}

/**
 * アプリ権限に基づいて要素を条件付きでレンダリングするコンポーネント
 */
export function AppPermissionGate({
  permission,
  children,
  fallback = null,
}: {
  permission: keyof AppPermission;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasAppPermission, loading } = useAppPermissions();

  if (loading) {
    return null;
  }

  return hasAppPermission(permission) ? <>{children}</> : <>{fallback}</>;
}

/**
 * フィールド権限に基づいて要素を条件付きでレンダリングするコンポーネント
 */
export function FieldPermissionGate({
  fieldName,
  mode = 'view',
  children,
  fallback = null,
}: {
  fieldName: string;
  mode?: 'view' | 'edit';
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { canViewField, canEditField, loading } = useAppPermissions();

  if (loading) {
    return null;
  }

  const hasAccess = mode === 'edit' ? canEditField(fieldName) : canViewField(fieldName);

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * 特定のアプリの権限を取得するフック（単独使用）
 */
export function useAppPermissionCheck(appCode: string) {
  const [permissions, setPermissions] = useState<AppPermission>(DEFAULT_APP_PERMISSION);
  const [fieldPermissions, setFieldPermissions] = useState<FieldPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        setLoading(true);
        setError(null);

        const [appRes, fieldRes] = await Promise.all([
          fetch(`/api/app-permissions?app_code=${appCode}`),
          fetch(`/api/field-permissions?app_code=${appCode}`),
        ]);

        if (!appRes.ok || !fieldRes.ok) {
          throw new Error('Failed to fetch permissions');
        }

        const appData = await appRes.json();
        const fieldData = await fieldRes.json();

        // 権限を集約
        const aggregatedPermission: AppPermission = { ...DEFAULT_APP_PERMISSION };

        for (const perm of appData.permissions || []) {
          if (perm.can_view) aggregatedPermission.can_view = true;
          if (perm.can_add) aggregatedPermission.can_add = true;
          if (perm.can_edit) aggregatedPermission.can_edit = true;
          if (perm.can_delete) aggregatedPermission.can_delete = true;
          if (perm.can_manage) aggregatedPermission.can_manage = true;
          if (perm.can_export) aggregatedPermission.can_export = true;
          if (perm.can_import) aggregatedPermission.can_import = true;
        }

        setPermissions(aggregatedPermission);
        setFieldPermissions(fieldData.permissions || []);
      } catch (err) {
        console.error('Error fetching app permissions:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [appCode]);

  const hasAppPermission = useCallback(
    (permission: keyof AppPermission): boolean => {
      return permissions[permission];
    },
    [permissions]
  );

  const getFieldPermission = useCallback(
    (fieldName: string): 'view' | 'edit' | 'hidden' | 'full' => {
      const fp = fieldPermissions.find((p) => p.field_name === fieldName);
      return fp?.access_level || 'full';
    },
    [fieldPermissions]
  );

  return {
    permissions,
    fieldPermissions,
    loading,
    error,
    hasAppPermission,
    getFieldPermission,
  };
}
