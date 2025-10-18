'use server';

import { NextRequest, NextResponse } from 'next/server';
import { KintoneClient } from '@/lib/kintone/client';
import { KINTONE_APPS } from '@/types/kintone';

type DataSourceKey =
  | 'dashboard'
  | 'workno'
  | 'project'
  | 'quotation'
  | 'po'
  | 'order'
  | 'cost'
  | 'employees'
  | 'suppliers'
  | 'staff';

interface KintoneAppConfig {
  name: string;
  tokenEnv: string;
  appId?: string;
  appIdEnv?: string;
  defaultQuery?: string;
}

const APP_CONFIGS: Record<DataSourceKey, KintoneAppConfig> = {
  dashboard: {
    name: 'ダッシュボード (Work No.)',
    tokenEnv: 'KINTONE_API_TOKEN_WORKNO',
    appId: String(KINTONE_APPS.WORK_NO.appId),
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  workno: {
    name: '工事番号管理',
    tokenEnv: 'KINTONE_API_TOKEN_WORKNO',
    appId: String(KINTONE_APPS.WORK_NO.appId),
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  project: {
    name: 'プロジェクト管理',
    tokenEnv: 'KINTONE_API_TOKEN_PROJECT',
    appId: String(KINTONE_APPS.PROJECT_MANAGEMENT.appId),
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  quotation: {
    name: '見積管理',
    tokenEnv: 'KINTONE_API_TOKEN_QUOTATION',
    appId: String(KINTONE_APPS.QUOTATION.appId),
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  po: {
    name: '発注管理',
    tokenEnv: 'KINTONE_API_TOKEN_PO',
    appId: String(KINTONE_APPS.PO_MANAGEMENT.appId),
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  order: {
    name: '注文書管理',
    tokenEnv: 'KINTONE_API_TOKEN_ORDER',
    appIdEnv: 'KINTONE_APP_ORDER_MANAGEMENT',
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  cost: {
    name: 'コスト管理',
    tokenEnv: 'KINTONE_API_TOKEN_COST',
    appId: String(KINTONE_APPS.COST_MANAGEMENT.appId),
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  employees: {
    name: '従業員管理',
    tokenEnv: 'KINTONE_API_TOKEN_EMPLOYEE',
    appId: String(KINTONE_APPS.EMPLOYEE_MANAGEMENT.appId),
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  suppliers: {
    name: '仕入業者管理',
    tokenEnv: 'KINTONE_API_TOKEN_SUPPLIER',
    appIdEnv: 'KINTONE_APP_SUPPLIER_LIST',
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
  staff: {
    name: '顧客担当者',
    tokenEnv: 'KINTONE_API_TOKEN_CUSTOMER_STAFF',
    appId: String(KINTONE_APPS.CUSTOMER_STAFF.appId),
    defaultQuery: 'order by 更新日時 desc limit 5',
  },
};

interface AppStatusResponse {
  success: boolean;
  name: string;
  appKey: DataSourceKey;
  count: number;
  lastUpdated?: string | null;
  sampleId?: string | null;
}

function resolveEnvVariable(key: string | undefined): string | undefined {
  if (!key) {
    return undefined;
  }
  return process.env[key];
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const appKey = searchParams.get('app') as DataSourceKey | null;

  if (!appKey || !(appKey in APP_CONFIGS)) {
    return NextResponse.json(
      { success: false, error: 'appパラメータが不正です' },
      { status: 400 }
    );
  }

  const config = APP_CONFIGS[appKey];
  const appId = config.appId ?? resolveEnvVariable(config.appIdEnv);
  const token = resolveEnvVariable(config.tokenEnv);

  if (!appId) {
    return NextResponse.json(
      { success: false, error: `${config.name} のアプリIDが未設定です` },
      { status: 500 }
    );
  }

  if (!token) {
    return NextResponse.json(
      { success: false, error: `${config.name} のAPIトークンが未設定です` },
      { status: 500 }
    );
  }

  try {
    const client = new KintoneClient(appId, token);
    const query = config.defaultQuery ?? 'limit 5';
    const records = await client.getRecords<Record<string, unknown>>(query);
    const safeRecords = Array.isArray(records) ? records : [];
    const first = safeRecords[0] ?? {};

    const lastUpdated =
      first?.更新日時?.value ??
      first?.更新日時 ??
      first?.UpdatedTime?.value ??
      null;
    const sampleId =
      first?.$id?.value ??
      first?.レコード番号?.value ??
      first?.recordNumber?.value ??
      null;

    const response: AppStatusResponse = {
      success: true,
      name: config.name,
      appKey,
      count: safeRecords.length,
      lastUpdated,
      sampleId,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(`Failed to fetch kintone app status for ${appKey}:`, error);
    return NextResponse.json(
      { success: false, error: `${config.name} のデータ取得に失敗しました` },
      { status: 500 }
    );
  }
}
