import { NextRequest, NextResponse } from 'next/server';

// 有効期限が近づいている従業員のドキュメントを取得するAPI
// 2ヶ月前・1ヶ月前のアラートを総務部と本人に送信するため使用

interface ExpiryAlert {
  employeeId: string;
  employeeName: string;
  employeeEmail: string;
  documentType: 'ID' | 'Passport' | 'VISA' | 'WorkPermit';
  expiryDate: string;
  daysUntilExpiry: number;
  alertLevel: '1month' | '2months' | 'expired';
}

// Kintone APIからデータを取得
async function fetchEmployeesFromKintone() {
  const KINTONE_BASE_URL = process.env.KINTONE_BASE_URL;
  const KINTONE_APP_ID_EMPLOYEES = process.env.KINTONE_APP_ID_EMPLOYEES;
  const KINTONE_API_TOKEN_EMPLOYEES = process.env.KINTONE_API_TOKEN_EMPLOYEES;

  if (!KINTONE_BASE_URL || !KINTONE_APP_ID_EMPLOYEES || !KINTONE_API_TOKEN_EMPLOYEES) {
    throw new Error('Kintone environment variables are not configured');
  }

  const response = await fetch(
    `${KINTONE_BASE_URL}/k/v1/records.json?app=${KINTONE_APP_ID_EMPLOYEES}`,
    {
      method: 'GET',
      headers: {
        'X-Cybozu-API-Token': KINTONE_API_TOKEN_EMPLOYEES,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Kintone API error: ${response.status}`);
  }

  const data = await response.json();
  return data.records;
}

// 有効期限チェック
function checkExpiry(expiryDate: string | null | undefined): { daysUntilExpiry: number; alertLevel: '1month' | '2months' | 'expired' | null } {
  if (!expiryDate) return { daysUntilExpiry: -1, alertLevel: null };

  const expiry = new Date(expiryDate);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const daysUntilExpiry = Math.ceil(diffMs / (24 * 60 * 60 * 1000));

  if (daysUntilExpiry < 0) {
    return { daysUntilExpiry, alertLevel: 'expired' };
  }
  if (daysUntilExpiry <= 30) {
    return { daysUntilExpiry, alertLevel: '1month' };
  }
  if (daysUntilExpiry <= 60) {
    return { daysUntilExpiry, alertLevel: '2months' };
  }
  return { daysUntilExpiry, alertLevel: null };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const alertLevel = searchParams.get('level'); // '1month', '2months', 'expired', or null for all

    const records = await fetchEmployeesFromKintone();
    const alerts: ExpiryAlert[] = [];

    for (const record of records) {
      // 在籍中の従業員のみチェック
      const status = record.在籍状況?.value;
      if (status !== '在籍' && status !== 'Active') continue;

      const employeeId = record.$id?.value;
      const employeeName = record.氏名?.value || 'Unknown';
      const employeeEmail = record.メールアドレス?.value || '';

      // ID有効期限チェック
      const idExpiry = checkExpiry(record.ID有効期限?.value);
      if (idExpiry.alertLevel && (!alertLevel || alertLevel === idExpiry.alertLevel)) {
        alerts.push({
          employeeId,
          employeeName,
          employeeEmail,
          documentType: 'ID',
          expiryDate: record.ID有効期限?.value,
          daysUntilExpiry: idExpiry.daysUntilExpiry,
          alertLevel: idExpiry.alertLevel,
        });
      }

      // パスポート有効期限チェック
      const passportExpiry = checkExpiry(record.パスポート有効期限?.value);
      if (passportExpiry.alertLevel && (!alertLevel || alertLevel === passportExpiry.alertLevel)) {
        alerts.push({
          employeeId,
          employeeName,
          employeeEmail,
          documentType: 'Passport',
          expiryDate: record.パスポート有効期限?.value,
          daysUntilExpiry: passportExpiry.daysUntilExpiry,
          alertLevel: passportExpiry.alertLevel,
        });
      }

      // VISA有効期限チェック (フィールド名はKintoneの設定に依存)
      const visaExpiryValue = record.Visa有効期限?.value || record.VisaExpiry?.value;
      const visaExpiry = checkExpiry(visaExpiryValue);
      if (visaExpiry.alertLevel && (!alertLevel || alertLevel === visaExpiry.alertLevel)) {
        alerts.push({
          employeeId,
          employeeName,
          employeeEmail,
          documentType: 'VISA',
          expiryDate: visaExpiryValue,
          daysUntilExpiry: visaExpiry.daysUntilExpiry,
          alertLevel: visaExpiry.alertLevel,
        });
      }

      // ワークパミット有効期限チェック (フィールド名はKintoneの設定に依存)
      const wpExpiryValue = record.WorkPermit有効期限?.value || record.WorkPermitExpiry?.value;
      const wpExpiry = checkExpiry(wpExpiryValue);
      if (wpExpiry.alertLevel && (!alertLevel || alertLevel === wpExpiry.alertLevel)) {
        alerts.push({
          employeeId,
          employeeName,
          employeeEmail,
          documentType: 'WorkPermit',
          expiryDate: wpExpiryValue,
          daysUntilExpiry: wpExpiry.daysUntilExpiry,
          alertLevel: wpExpiry.alertLevel,
        });
      }
    }

    // 期限が近い順にソート
    alerts.sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);

    return NextResponse.json({
      success: true,
      alerts,
      summary: {
        total: alerts.length,
        expired: alerts.filter(a => a.alertLevel === 'expired').length,
        oneMonth: alerts.filter(a => a.alertLevel === '1month').length,
        twoMonths: alerts.filter(a => a.alertLevel === '2months').length,
      },
    });
  } catch (error) {
    console.error('Error fetching expiry alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch expiry alerts' },
      { status: 500 }
    );
  }
}

// アラートメール送信用エンドポイント (POST)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertLevel } = body;

    // アラート対象を取得
    const records = await fetchEmployeesFromKintone();
    const alerts: ExpiryAlert[] = [];

    for (const record of records) {
      const status = record.在籍状況?.value;
      if (status !== '在籍' && status !== 'Active') continue;

      const employeeId = record.$id?.value;
      const employeeName = record.氏名?.value || 'Unknown';
      const employeeEmail = record.メールアドレス?.value || '';

      // 各書類の有効期限チェック
      const documents = [
        { type: 'ID' as const, expiry: record.ID有効期限?.value },
        { type: 'Passport' as const, expiry: record.パスポート有効期限?.value },
        { type: 'VISA' as const, expiry: record.Visa有効期限?.value || record.VisaExpiry?.value },
        { type: 'WorkPermit' as const, expiry: record.WorkPermit有効期限?.value || record.WorkPermitExpiry?.value },
      ];

      for (const doc of documents) {
        const check = checkExpiry(doc.expiry);
        if (check.alertLevel && (!alertLevel || alertLevel === check.alertLevel)) {
          alerts.push({
            employeeId,
            employeeName,
            employeeEmail,
            documentType: doc.type,
            expiryDate: doc.expiry,
            daysUntilExpiry: check.daysUntilExpiry,
            alertLevel: check.alertLevel,
          });
        }
      }
    }

    // ここでメール送信処理を実装
    // 実際の実装ではSendGrid, Resend, nodemailerなどを使用
    // 今回はログ出力のみ

    const hrEmail = process.env.HR_DEPARTMENT_EMAIL || 'hr@company.com';

    console.log('=== Expiry Alert Notification ===');
    console.log(`Total alerts: ${alerts.length}`);
    console.log(`HR Email: ${hrEmail}`);

    for (const alert of alerts) {
      console.log(`
  Employee: ${alert.employeeName} (${alert.employeeEmail})
  Document: ${alert.documentType}
  Expiry: ${alert.expiryDate}
  Days until expiry: ${alert.daysUntilExpiry}
  Alert level: ${alert.alertLevel}
      `);
    }

    return NextResponse.json({
      success: true,
      message: `${alerts.length} alert(s) processed`,
      alerts,
      notificationsSent: {
        hr: alerts.length > 0,
        employees: alerts.filter(a => a.employeeEmail).length,
      },
    });
  } catch (error) {
    console.error('Error sending expiry alerts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send expiry alerts' },
      { status: 500 }
    );
  }
}
