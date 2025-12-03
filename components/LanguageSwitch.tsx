'use client';

import { useState } from 'react';
import { usePathname, useRouter, useParams } from 'next/navigation';

const languages = [
  { code: 'ja', label: '日本語' },
  { code: 'th', label: 'ไทย' },
  { code: 'en', label: 'English' },
];

function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 21a9 9 0 100-18 9 9 0 000 18z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3.6 9h16.8M3.6 15h16.8"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3a12 12 0 010 18 12 12 0 010-18z"
      />
    </svg>
  );
}

export default function LanguageSwitch() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  const currentLocale = (params.locale as string) || 'ja';
  const [open, setOpen] = useState(false);

  const handleLanguageChange = (newLocale: string) => {
    setOpen(false);
    if (!newLocale || newLocale === currentLocale) return;
    const newPath = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPath);
  };

  const currentLabel =
    languages.find((l) => l.code === currentLocale)?.label ?? currentLocale;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 transition-colors"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <GlobeIcon className="h-4 w-4" />
        <span>{currentLabel}</span>
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-32 rounded-md bg-white shadow-lg ring-1 ring-black/5 z-20">
          <ul className="py-1 text-xs text-slate-700" role="listbox">
            {languages.map((lang) => (
              <li key={lang.code}>
                <button
                  type="button"
                  onClick={() => handleLanguageChange(lang.code)}
                  className={`w-full text-left px-3 py-1.5 hover:bg-slate-100 ${
                    lang.code === currentLocale ? 'bg-slate-100 font-semibold' : ''
                  }`}
                >
                  {lang.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}