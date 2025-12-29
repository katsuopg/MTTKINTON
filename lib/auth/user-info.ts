import { createClient } from '@/lib/supabase/server';
import { emailToEmployeeNumber } from '@/lib/auth/utils';

interface EmployeeData {
  id: string;
  name: string | null;
  position: string | null;
  employee_number: string;
  department: string | null;
  avatar_url: string | null;
}

export interface UserInfo {
  email: string;
  name: string;
  avatarUrl: string;
  nickname: string;
  employeeNumber: string;
  employeeId: string;
  employeeRole: string;
  department: string;
}

/**
 * ログインユーザーの情報を取得する共通関数
 * ニックネーム、アバターURL、従業員情報を含む
 */
export async function getCurrentUserInfo(): Promise<UserInfo | null> {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const userEmail = user.email || '';
  const employeeNumberFromEmail = emailToEmployeeNumber(userEmail);
  const employeeNumberFromMeta = user.user_metadata?.employee_number || '';
  const loginEmployeeNumber = employeeNumberFromEmail || employeeNumberFromMeta;

  // ニックネームとアバターURLはユーザーメタデータから取得
  const nickname = user.user_metadata?.nickname || '';
  const avatarUrl = user.user_metadata?.avatar_url || '';

  // デフォルト値
  let employeeName = '';
  let employeeRole = '';
  let employeeNumber = loginEmployeeNumber || '';
  let department = '';
  let employeeId = '';
  let employeeAvatarUrl = '';

  // 1. 従業員番号で検索
  if (loginEmployeeNumber) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, position, employee_number, department, avatar_url')
      .eq('employee_number', loginEmployeeNumber)
      .single<EmployeeData>();

    if (employee) {
      employeeId = employee.id;
      employeeName = employee.name || '';
      employeeRole = employee.position || '';
      employeeNumber = employee.employee_number || loginEmployeeNumber;
      department = employee.department || '';
      employeeAvatarUrl = employee.avatar_url || '';
    }
  }

  // 2. メタデータのemployee_numberでも検索（フォールバック）
  if (!employeeName && employeeNumberFromMeta && employeeNumberFromMeta !== loginEmployeeNumber) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, position, employee_number, department, avatar_url')
      .eq('employee_number', employeeNumberFromMeta)
      .single<EmployeeData>();

    if (employee) {
      employeeId = employee.id;
      employeeName = employee.name || '';
      employeeRole = employee.position || '';
      employeeNumber = employee.employee_number || employeeNumberFromMeta;
      department = employee.department || '';
      employeeAvatarUrl = employee.avatar_url || '';
    }
  }

  // 3. 社内メールアドレス（company_email）で検索（フォールバック）
  if (!employeeName && userEmail) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, position, employee_number, department, avatar_url')
      .eq('company_email', userEmail)
      .single<EmployeeData>();

    if (employee) {
      employeeId = employee.id;
      employeeName = employee.name || '';
      employeeRole = employee.position || '';
      employeeNumber = employee.employee_number;
      department = employee.department || '';
      employeeAvatarUrl = employee.avatar_url || '';
    }
  }

  // 表示用メールアドレス（内部ドメインの場合は従業員番号を表示）
  const displayEmail = userEmail.endsWith('@mtt.internal')
    ? employeeNumber
    : userEmail;

  // 表示名：ニックネーム優先、なければ従業員名
  const displayName = nickname || employeeName || displayEmail;

  // アバターURL：ユーザーメタデータ優先、なければ従業員データ
  const finalAvatarUrl = avatarUrl || employeeAvatarUrl;

  return {
    email: displayEmail,
    name: displayName,
    avatarUrl: finalAvatarUrl,
    nickname,
    employeeNumber,
    employeeId,
    employeeRole,
    department,
  };
}
