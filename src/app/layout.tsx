import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MTT KINTON",
  description: "MTT kintone integration web application",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const locale = headersList.get("x-locale") || "ja";

  return (
    <html lang={locale}>
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}