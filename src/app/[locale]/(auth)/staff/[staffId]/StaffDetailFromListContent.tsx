'use client';

import { CustomerStaffRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';

interface StaffDetailFromListContentProps {
  staff: CustomerStaffRecord;
  locale: string;
  userEmail: string;
}

export function StaffDetailFromListContent({ staff, locale, userEmail }: StaffDetailFromListContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '担当者詳細' : language === 'th' ? 'รายละเอียดผู้ติดต่อ' : 'Staff Details';

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <div className="py-4 px-4">
        {/* パンくずリスト */}
        <nav className="flex mb-4" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 text-sm text-gray-500">
            <li>
              <Link href={`/${locale}/dashboard`} className="hover:text-gray-700">
                {language === 'ja' ? 'ホーム' : 'Home'}
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
              <Link href={`/${locale}/staff`} className="hover:text-gray-700">
                {language === 'ja' ? '顧客担当者管理' : language === 'th' ? 'จัดการผู้ติดต่อ' : 'Staff Management'}
              </Link>
            </li>
            <li>
              <span className="mx-2">/</span>
              <span className="text-gray-700">{staff.担当者名?.value}</span>
            </li>
          </ol>
        </nav>

        {/* ヘッダー */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {staff.担当者名?.value}
                </h1>
                <div className="text-sm text-gray-500">
                  {staff.ルックアップ?.value}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 詳細情報 */}
        <div className="bg-white shadow-sm rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              {language === 'ja' ? '担当者情報' : language === 'th' ? 'ข้อมูลผู้ติดต่อ' : 'Contact Information'}
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div className="text-sm text-gray-500">
                {language === 'ja' ? '会社名' : language === 'th' ? 'บริษัท' : 'Company'}
              </div>
              <div className="col-span-2 text-sm font-medium">{staff.ルックアップ?.value || '-'}</div>
            </div>
            {staff.Position?.value && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm text-gray-500">
                  {language === 'ja' ? '役職' : language === 'th' ? 'ตำแหน่ง' : 'Position'}
                </div>
                <div className="col-span-2 text-sm font-medium">{staff.Position.value}</div>
              </div>
            )}
            {staff.Divison?.value && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm text-gray-500">
                  {language === 'ja' ? '部署' : language === 'th' ? 'แผนก' : 'Division'}
                </div>
                <div className="col-span-2 text-sm font-medium">{staff.Divison.value}</div>
              </div>
            )}
            {staff.メールアドレス?.value && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm text-gray-500">
                  {language === 'ja' ? 'メールアドレス' : language === 'th' ? 'อีเมล' : 'Email'}
                </div>
                <div className="col-span-2 text-sm font-medium">
                  <a href={`mailto:${staff.メールアドレス.value}`} className="text-indigo-600 hover:text-indigo-900">
                    {staff.メールアドレス.value}
                  </a>
                </div>
              </div>
            )}
            {staff.文字列__1行__7?.value && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm text-gray-500">
                  {language === 'ja' ? '携帯電話' : language === 'th' ? 'โทรศัพท์มือถือ' : 'Mobile'}
                </div>
                <div className="col-span-2 text-sm font-medium">
                  <a href={`tel:${staff.文字列__1行__7.value}`} className="text-indigo-600 hover:text-indigo-900">
                    {staff.文字列__1行__7.value}
                  </a>
                </div>
              </div>
            )}
            {staff.Text?.value && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm text-gray-500">
                  {language === 'ja' ? '住所' : language === 'th' ? 'ที่อยู่' : 'Address'}
                </div>
                <div className="col-span-2 text-sm font-medium">{staff.Text.value}</div>
              </div>
            )}
            {staff.備考?.value && (
              <div className="grid grid-cols-3 gap-2">
                <div className="text-sm text-gray-500 pt-1">
                  {language === 'ja' ? '備考' : language === 'th' ? 'หมายเหตุ' : 'Notes'}
                </div>
                <div className="col-span-2 text-sm font-medium whitespace-pre-wrap">{staff.備考.value}</div>
              </div>
            )}
          </div>
        </div>

        {/* 戻るボタン */}
        <div className="mt-6">
          <Link
            href={`/${locale}/staff`}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <svg className="mr-2 -ml-1 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {language === 'ja' ? '一覧に戻る' : language === 'th' ? 'กลับไปยังรายการ' : 'Back to List'}
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}