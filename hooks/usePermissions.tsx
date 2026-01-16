'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import type { Permission } from '@/lib/auth/permissions';

// クライアント用の権限情報
interface PermissionsState {
  employeeId: string | null;
  roles: Array<{
    id: string;
    code: string;
    name: string;
  }>;
  permissions: Record<string, boolean>;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

interface PermissionsContextValue extends PermissionsState {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  refetch: () => Promise<void>;
}

// コンテキスト
const PermissionsContext = createContext<PermissionsContextValue | null>(null);

// 権限名とDB列名のマッピング
const PERMISSION_TO_KEY: Record<Permission, string> = {
  manage_users: 'manage_users',
  manage_organizations: 'manage_organizations',
  manage_employees: 'manage_employees',
  manage_quotations: 'manage_quotations',
  view_all_records: 'view_all_records',
  edit_all_records: 'edit_all_records',
  delete_records: 'delete_records',
  export_data: 'export_data',
  import_data: 'import_data',
  manage_settings: 'manage_settings',
};

/**
 * 権限プロバイダー
 * アプリのルートレイアウトで使用
 */
export function PermissionsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PermissionsState>({
    employeeId: null,
    roles: [],
    permissions: {},
    isAdmin: false,
    loading: true,
    error: null,
  });

  const fetchPermissions = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      const res = await fetch('/api/permissions');
      if (!res.ok) {
        if (res.status === 401) {
          // 未認証の場合は空の権限を返す
          setState({
            employeeId: null,
            roles: [],
            permissions: {},
            isAdmin: false,
            loading: false,
            error: null,
          });
          return;
        }
        throw new Error('Failed to fetch permissions');
      }

      const data = await res.json();

      setState({
        employeeId: data.employeeId,
        roles: data.roles || [],
        permissions: data.permissions || {},
        isAdmin: data.isAdmin || false,
        loading: false,
        error: null,
      });
    } catch (err) {
      console.error('Error fetching permissions:', err);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }));
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      if (state.isAdmin) return true;
      const key = PERMISSION_TO_KEY[permission];
      return state.permissions[key] === true;
    },
    [state.permissions, state.isAdmin]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      if (state.isAdmin) return true;
      return permissions.some((p) => hasPermission(p));
    },
    [hasPermission, state.isAdmin]
  );

  const hasAllPermissions = useCallback(
    (permissions: Permission[]): boolean => {
      if (state.isAdmin) return true;
      return permissions.every((p) => hasPermission(p));
    },
    [hasPermission, state.isAdmin]
  );

  const value: PermissionsContextValue = {
    ...state,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refetch: fetchPermissions,
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * ユーザーの権限情報を取得するフック
 */
export function usePermissions(): PermissionsContextValue {
  const context = useContext(PermissionsContext);

  if (!context) {
    // コンテキスト外で使用された場合のフォールバック
    return {
      employeeId: null,
      roles: [],
      permissions: {},
      isAdmin: false,
      loading: true,
      error: 'PermissionsProvider not found',
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      refetch: async () => {},
    };
  }

  return context;
}

/**
 * 権限に基づいて要素を条件付きでレンダリングするコンポーネント
 */
export function PermissionGate({
  permission,
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: {
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return null;
  }

  let hasAccess = false;

  if (permission) {
    hasAccess = hasPermission(permission);
  } else if (permissions) {
    hasAccess = requireAll ? hasAllPermissions(permissions) : hasAnyPermission(permissions);
  }

  return hasAccess ? <>{children}</> : <>{fallback}</>;
}

/**
 * 管理者のみアクセス可能なコンポーネント
 */
export function AdminOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const { isAdmin, loading } = usePermissions();

  if (loading) {
    return null;
  }

  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
