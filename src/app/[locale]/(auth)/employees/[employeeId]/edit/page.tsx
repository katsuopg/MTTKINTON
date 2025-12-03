import { redirect } from 'next/navigation';

interface EditEmployeePageProps {
  params: Promise<{
    locale: string;
    employeeId: string;
  }>;
}

// 編集ページへのアクセスは詳細ページにリダイレクト（インライン編集に移行したため）
export default async function EditEmployeePage({ params }: EditEmployeePageProps) {
  const { locale, employeeId } = await params;
  redirect(`/${locale}/employees/${employeeId}`);
}


