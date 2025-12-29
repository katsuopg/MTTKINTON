import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ProfileContent from './ProfileContent';
import { emailToEmployeeNumber } from '@/lib/auth/utils';

interface EmployeeData {
  name: string | null;
  position: string | null;
  employee_number: string;
  department: string | null;
}

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: PageProps) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect(`/${locale}/auth/login`);
  }

  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'ja') as 'ja' | 'en' | 'th';

  // 従業員番号を取得（メールアドレスから抽出 or メタデータから）
  const userEmail = user.email || '';
  const employeeNumberFromEmail = emailToEmployeeNumber(userEmail);
  const employeeNumberFromMeta = user.user_metadata?.employee_number || '';
  const loginEmployeeNumber = employeeNumberFromEmail || employeeNumberFromMeta;

  // Supabaseから従業員データを取得
  let employeeName = '';
  let employeeRole = '';
  let employeeNumber = loginEmployeeNumber || '';
  let department = '';
  let employeeId = '';

  // 1. 従業員番号で検索
  if (loginEmployeeNumber) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, position, employee_number, department')
      .eq('employee_number', loginEmployeeNumber)
      .single<EmployeeData & { id: string }>();

    if (employee) {
      employeeId = employee.id;
      employeeName = employee.name || '';
      employeeRole = employee.position || '';
      employeeNumber = employee.employee_number || loginEmployeeNumber;
      department = employee.department || '';
    }
  }

  // 2. メタデータのemployee_numberでも検索（フォールバック）
  if (!employeeName && employeeNumberFromMeta && employeeNumberFromMeta !== loginEmployeeNumber) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, position, employee_number, department')
      .eq('employee_number', employeeNumberFromMeta)
      .single<EmployeeData & { id: string }>();

    if (employee) {
      employeeId = employee.id;
      employeeName = employee.name || '';
      employeeRole = employee.position || '';
      employeeNumber = employee.employee_number || employeeNumberFromMeta;
      department = employee.department || '';
    }
  }

  // 3. 社内メールアドレス（company_email）で検索（フォールバック）
  if (!employeeName && userEmail) {
    const { data: employee } = await supabase
      .from('employees')
      .select('id, name, position, employee_number, department')
      .eq('company_email', userEmail)
      .single<EmployeeData & { id: string }>();

    if (employee) {
      employeeId = employee.id;
      employeeName = employee.name || '';
      employeeRole = employee.position || '';
      employeeNumber = employee.employee_number;
      department = employee.department || '';
    }
  }

  // ニックネームはユーザーメタデータから取得
  const nickname = user.user_metadata?.nickname || '';

  // 表示用メールアドレス（内部ドメインの場合は非表示）
  const displayEmail = userEmail.endsWith('@mtt.internal') ? '' : userEmail;

  return (
    <ProfileContent
      locale={locale}
      language={language}
      user={{
        id: user.id,
        email: displayEmail,
        employeeName,
        employeeRole,
        employeeNumber,
        nickname,
        avatarUrl: user.user_metadata?.avatar_url || '',
        department,
        employeeId,
      }}
    />
  );
}
