// 認証関連のユーティリティ関数

// 内部ドメイン
export const INTERNAL_DOMAIN = 'mtt.internal';

// 従業員番号を内部メールアドレスに変換
export function employeeNumberToEmail(employeeNumber: string): string {
  return `${employeeNumber.toLowerCase()}@${INTERNAL_DOMAIN}`;
}

// 内部メールアドレスから従業員番号を抽出
export function emailToEmployeeNumber(email: string): string | null {
  if (email.endsWith(`@${INTERNAL_DOMAIN}`)) {
    return email.replace(`@${INTERNAL_DOMAIN}`, '');
  }
  return null;
}
