import { LoginForm } from '@/components/forms/LoginForm';
import LanguageSwitch from '@/components/LanguageSwitch';

interface LoginPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div style={{ maxWidth: '400px', width: '100%' }} className="space-y-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            MTT KINTON
          </h2>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="mb-6 flex justify-end">
            <LanguageSwitch />
          </div>
          <LoginForm locale={locale} />
        </div>
      </div>
    </div>
  );
}