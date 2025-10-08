'use client';

import { useState } from 'react';
import { QuotationRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { type Language } from '@/lib/kintone/field-mappings';

interface QuotationDetailContentProps {
  quotation: QuotationRecord;
  locale: string;
  userEmail: string;
}

export default function QuotationDetailContent({ quotation, locale, userEmail }: QuotationDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '見積もり詳細' : language === 'th' ? 'รายละเอียดใบเสนอราคา' : 'Quotation Details';

  // 日付フォーマット
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return dateString;
  };

  // ステータスの色を取得
  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'Working': 'bg-yellow-100 text-yellow-800',
      'Finished': 'bg-green-100 text-green-800',
      'Cancel': 'bg-red-100 text-red-800',
      'Waiting PO': 'bg-blue-100 text-blue-800',
      'Pending': 'bg-gray-100 text-gray-800',
      'PO': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // 確率の表示
  const getProbabilityDisplay = (prob: string) => {
    const displays: { [key: string]: { text: string; color: string } } = {
      '◎': { text: '◎ (90%)', color: 'text-green-600 font-bold' },
      '◯': { text: '◯ (70%)', color: 'text-green-500' },
      '△': { text: '△ (50%)', color: 'text-yellow-600' },
      '-': { text: '- (30%)', color: 'text-gray-600' }
    };
    return displays[prob] || { text: prob, color: 'text-gray-600' };
  };

  // 金額フォーマット
  const formatCurrency = (value: string | undefined) => {
    if (!value) return '0.00';
    const num = parseFloat(value);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <div className="p-6">
        {/* ヘッダー部分 */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {quotation.qtno2?.value || 'QT-XXXX'}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {language === 'ja' ? '見積番号' : 'Quotation Number'}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {/* ステータスバッジ */}
                {quotation.ドロップダウン?.value && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(quotation.ドロップダウン.value)}`}>
                    {quotation.ドロップダウン.value}
                  </span>
                )}
                {/* 編集ボタン */}
                <Link
                  href={`/${locale}/quotation/${quotation.$id.value}/edit`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {language === 'ja' ? '編集' : 'Edit'}
                </Link>
                {/* 一覧に戻るボタン */}
                <Link
                  href={`/${locale}/quotation`}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  {language === 'ja' ? '一覧に戻る' : 'Back to List'}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* 基本情報セクション */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {language === 'ja' ? '基本情報' : 'Basic Information'}
            </h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 見積日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '見積日' : 'QT date'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(quotation.日付?.value)}</p>
            </div>

            {/* 営業担当 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '営業担当' : 'Sales staff'}
              </label>
              <p className="mt-1 text-sm text-gray-900">
                {quotation.sales_staff?.value?.[0]?.name || '-'}
              </p>
            </div>

            {/* 受注予定日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '受注予定日' : 'Scheduled order date'} <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(quotation.日付_0?.value)}</p>
            </div>

            {/* 納期 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '納期' : 'Delivery date'} <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.文字列__1行__8?.value || '-'}</p>
            </div>

            {/* 見積有効期限 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '見積有効期限' : 'Valid Until'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.ドロップダウン_3?.value || '-'}</p>
            </div>

            {/* 確率 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '確率' : 'Probability'}
              </label>
              <p className={`mt-1 text-sm ${quotation.Drop_down?.value ? getProbabilityDisplay(quotation.Drop_down.value).color : ''}`}>
                {quotation.Drop_down?.value ? getProbabilityDisplay(quotation.Drop_down.value).text : '-'}
              </p>
            </div>

            {/* 売上予測 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '売上予測' : 'Sales forecast'} <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-gray-900">{formatDate(quotation.sales_forecast?.value)}</p>
            </div>
          </div>
        </div>

        {/* 顧客情報セクション */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {language === 'ja' ? '顧客情報' : 'Customer Information'}
            </h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CS ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700">CS ID</label>
              <p className="mt-1 text-sm text-gray-900">{quotation.文字列__1行__10?.value || '-'}</p>
            </div>

            {/* 顧客名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '顧客名' : 'Customer name'} <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.name?.value || '-'}</p>
            </div>

            {/* 担当者 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '担当者' : 'Person in charge'} <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.ルックアップ_1?.value || '-'}</p>
            </div>

            {/* CC */}
            <div>
              <label className="block text-sm font-medium text-gray-700">CC</label>
              <p className="mt-1 text-sm text-gray-900">{quotation.Text_2?.value || '-'}</p>
            </div>
          </div>
        </div>

        {/* プロジェクト情報セクション */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {language === 'ja' ? 'プロジェクト情報' : 'Project Information'}
            </h2>
          </div>
          <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* タイトル */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? 'タイトル' : 'Title'} <span className="text-red-500">*</span>
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.文字列__1行__4?.value || '-'}</p>
            </div>

            {/* プロジェクト名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? 'プロジェクト名' : 'Project name'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.ドロップダウン_0?.value || '-'}</p>
            </div>

            {/* タイプ */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? 'タイプ' : 'Type'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.Type?.value || '-'}</p>
            </div>

            {/* 機械情報 */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? 'ベンダー' : 'Vender'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.文字列__1行__5?.value || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '型式' : 'Model'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.文字列__1行__6?.value || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? '機械番号' : 'M/C No.'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.文字列__1行__9?.value || '-'}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                {language === 'ja' ? 'シリアル番号' : 'Serial No.'}
              </label>
              <p className="mt-1 text-sm text-gray-900">{quotation.文字列__1行__7?.value || '-'}</p>
            </div>
          </div>
        </div>

        {/* 金額情報セクション */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {language === 'ja' ? '金額情報' : 'Amount Information'}
            </h2>
          </div>
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'ja' ? '小計' : 'Sub total'}
                </label>
                <p className="mt-1 text-2xl font-semibold text-gray-900">
                  {formatCurrency(quotation.Sub_total?.value)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'ja' ? '値引き' : 'Discount'}
                </label>
                <p className="mt-1 text-2xl font-semibold text-red-600">
                  -{formatCurrency(quotation.Discount?.value)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'ja' ? '合計' : 'Grand total'}
                </label>
                <p className="mt-1 text-3xl font-bold text-indigo-600">
                  {formatCurrency(quotation.Grand_total?.value)}
                </p>
              </div>
            </div>

            {/* 利益率情報 */}
            <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-500">
                  {language === 'ja' ? '粗利益' : 'Gross Profit'}
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {formatCurrency(quotation.profit_total1?.value)}
                  {quotation.Profit_2?.value && (
                    <span className="ml-2 text-sm text-gray-500">({quotation.Profit_2.value}%)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-500">
                  {language === 'ja' ? '販売利益' : 'Sales profit'}
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {formatCurrency(quotation.profit_total1_0?.value)}
                  {quotation.Profit_0?.value && (
                    <span className="ml-2 text-sm text-gray-500">({quotation.Profit_0.value}%)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-500">
                  {language === 'ja' ? '経費合計' : 'Expense Cost Total'}
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {formatCurrency(quotation.costtotal?.value)}
                </p>
              </div>

              <div>
                <label className="block text-sm text-gray-500">
                  {language === 'ja' ? 'その他合計' : 'Other Total'}
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900">
                  {formatCurrency(quotation.costtotal_0?.value)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 支払条件セクション */}
        <div className="bg-white shadow-sm rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-medium text-gray-900">
              {language === 'ja' ? '支払条件' : 'Payment Terms'}
            </h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            {quotation.payment_1?.value && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ja' ? '支払条件1' : 'Payment term1'}
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{quotation.payment_1.value}</p>
              </div>
            )}
            {quotation.ドロップダウン_4?.value && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ja' ? '支払条件2' : 'Payment term2'}
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{quotation.ドロップダウン_4.value}</p>
              </div>
            )}
            {quotation.ドロップダウン_5?.value && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {language === 'ja' ? '支払条件3' : 'Payment term3'}
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded">{quotation.ドロップダウン_5.value}</p>
              </div>
            )}
          </div>
        </div>

        {/* 備考セクション */}
        {quotation.文字列__複数行__2?.value && (
          <div className="bg-white shadow-sm rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-medium text-gray-900">
                {language === 'ja' ? '備考' : 'Memo'}
              </h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-gray-900 whitespace-pre-wrap">{quotation.文字列__複数行__2.value}</p>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}