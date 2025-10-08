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
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center">
              <span className="text-white text-2xl font-bold">K</span>
            </div>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            MTT KINTON
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            ログインしてください
          </p>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-lg">
          <div className="mb-6 flex justify-end">
            <LanguageSwitch />
          </div>
          <LoginForm locale={locale} />
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  管理者のみアクセス可能です
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}