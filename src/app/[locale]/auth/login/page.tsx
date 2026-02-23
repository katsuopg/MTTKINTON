import { LoginForm } from '@/components/forms/LoginForm';
import LanguageSwitch from '@/components/LanguageSwitch';

interface LoginPageProps {
  params: Promise<{
    locale: string;
  }>;
}

async function getMessages(locale: string) {
  try {
    return (await import(`../../../../../messages/${locale}.json`)).default;
  } catch {
    return (await import('../../../../../messages/ja.json')).default;
  }
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const messages = await getMessages(locale);

  return (
    <div className="min-h-screen flex justify-center bg-gray-50 pt-24 px-4">
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
          <LoginForm locale={locale} messages={messages} />
        </div>
      </div>
    </div>
  );
}
