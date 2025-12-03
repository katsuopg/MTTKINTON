import { NextRequest, NextResponse } from 'next/server';
import { KintoneClient } from '@/lib/kintone/client';
import { KINTONE_APPS, EmployeeRecord } from '@/types/kintone';

// 従業員詳細取得
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const client = new KintoneClient(
      KINTONE_APPS.EMPLOYEE_MANAGEMENT.appId.toString(),
      process.env.KINTONE_API_TOKEN_EMPLOYEE || ''
    );

    const record = await client.getRecord<EmployeeRecord>(id);

    return NextResponse.json({ record });
  } catch (error) {
    console.error('Error fetching employee record:', error);
    return NextResponse.json(
      { error: '従業員データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

// 従業員更新（メール・TEL・部署・在籍状況などの基本項目）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();

    const client = new KintoneClient(
      KINTONE_APPS.EMPLOYEE_MANAGEMENT.appId.toString(),
      process.env.KINTONE_API_TOKEN_EMPLOYEE || ''
    );

    const updateRecord: any = {};

    if (body.name !== undefined) {
      updateRecord['氏名'] = { value: String(body.name) };
    }
    if (body.employeeNumber !== undefined) {
      // 社員番号（社員証番号フィールドを優先して更新）
      updateRecord['社員証番号'] = { value: String(body.employeeNumber) };
    }
    if (body.email !== undefined) {
      updateRecord['メールアドレス'] = { value: String(body.email) };
    }
    if (body.tel !== undefined) {
      updateRecord['TEL'] = { value: String(body.tel) };
    }
    if (body.department !== undefined) {
      // 部署フィールドに保存（互換性のため配属にも同じ値を書き込む）
      updateRecord['部署'] = { value: String(body.department) };
      updateRecord['配属'] = { value: String(body.department) };
    }
    if (body.status !== undefined) {
      updateRecord['在籍状況'] = { value: String(body.status) };
    }
    if (body.idNumber !== undefined) {
      updateRecord['ID_No'] = { value: String(body.idNumber) };
    }
    if (body.dateOfBirth !== undefined) {
      updateRecord['生年月日'] = { value: String(body.dateOfBirth) };
    }
    if (body.hireDate !== undefined) {
      updateRecord['入社日'] = { value: String(body.hireDate) };
    }
    if (body.resignDate !== undefined) {
      updateRecord['退社日'] = { value: String(body.resignDate) };
    }
    if (body.passportNumber !== undefined) {
      updateRecord['パスポート番号'] = {
        value: String(body.passportNumber),
      };
    }
    if (body.passportExpiry !== undefined) {
      updateRecord['パスポート有効期限'] = {
        value: String(body.passportExpiry),
      };
    }

    await client.updateRecord<EmployeeRecord>(id, updateRecord);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating employee record:', error);
    return NextResponse.json(
      { error: '従業員データの更新に失敗しました' },
      { status: 500 }
    );
  }
}


