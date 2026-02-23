'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';

const languages = [
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' }
];

export default function LanguageSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = params.locale as string;

  const handleLanguageChange = (newLocale: string) => {
    // パスから現在のロケールを置き換える
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    // URLハッシュ（タブ状態等）を保持
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    router.push(newPath + hash);
  };

  return (
    <div className="relative inline-block text-left">
      <select
        value={currentLocale}
        onChange={(e) => handleLanguageChange(e.target.value)}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        suppressHydrationWarning
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
    </div>
  );
}