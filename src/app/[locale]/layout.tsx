import { Inter } from "next/font/google";
import "../globals.css";
import { notFound } from 'next/navigation';

const inter = Inter({ subsets: ["latin"] });

// Simple message loading function
async function getMessages(locale: string) {
  try {
    return (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!['ja', 'th'].includes(locale)) {
    notFound();
  }

  let messages;
  try {
    messages = await getMessages(locale);
  } catch (error) {
    console.error('Failed to load messages:', error);
    notFound();
  }

  return (
    <>
      {children}
    </>
  );
}