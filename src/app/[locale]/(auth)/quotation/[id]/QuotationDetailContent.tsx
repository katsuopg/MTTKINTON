'use client';

import Link from 'next/link';
import { type Language } from '@/lib/kintone/field-mappings';
import { detailStyles, getStatusBadgeClass } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import { Pencil } from 'lucide-react';
import { extractCsName } from '@/lib/utils/customer-name';
import type { SupabaseQuotation } from '../QuotationListContent';

interface QuotationDetailContentProps {
  quotation: SupabaseQuotation;
  locale: string;
}

export default function QuotationDetailContent({ quotation, locale }: QuotationDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    return dateString;
  };

  const getProbabilityDisplay = (prob: string) => {
    const displays: { [key: string]: { text: string; color: string } } = {
      '◎': { text: '◎ (90%)', color: 'text-green-600 dark:text-green-400 font-bold' },
      '◯': { text: '◯ (70%)', color: 'text-green-500 dark:text-green-400' },
      '△': { text: '△ (50%)', color: 'text-yellow-600 dark:text-yellow-400' },
      '-': { text: '- (30%)', color: 'text-gray-600 dark:text-gray-400' }
    };
    return displays[prob] || { text: prob, color: 'text-gray-600 dark:text-gray-400' };
  };

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '0.00';
    return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
      <div className={detailStyles.pageWrapper}>
        <DetailPageHeader
          backHref={`/${locale}/quotation`}
          title={quotation.quotation_no || 'QT-XXXX'}
          statusBadge={quotation.status ? (
            <span className={getStatusBadgeClass(quotation.status)}>
              {quotation.status}
            </span>
          ) : undefined}
          actions={
            <Link
              href={`/${locale}/quotation/${quotation.kintone_record_id}/edit`}
              className={detailStyles.secondaryButton}
            >
              <Pencil size={16} className="mr-1.5" />
              {language === 'ja' ? '編集' : 'Edit'}
            </Link>
          }
        />

        {/* 基本情報セクション */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className={detailStyles.cardTitle}>
              {language === 'ja' ? '基本情報' : 'Basic Information'}
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid3}`}>
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '見積日' : 'QT date'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{formatDate(quotation.quotation_date)}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '営業担当' : 'Sales staff'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {quotation.sales_staff || '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '受注予定日' : 'Scheduled order date'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{formatDate(quotation.expected_order_date)}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '納期' : 'Delivery date'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.delivery_date || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '見積有効期限' : 'Valid Until'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.valid_until || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '確率' : 'Probability'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue} ${quotation.probability ? getProbabilityDisplay(quotation.probability).color : ''}`}>
                {quotation.probability ? getProbabilityDisplay(quotation.probability).text : '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '売上予測' : 'Sales forecast'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.sales_forecast || '-'}</p>
            </div>
          </div>
        </div>

        {/* 顧客情報セクション */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className={detailStyles.cardTitle}>
              {language === 'ja' ? '顧客情報' : 'Customer Information'}
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid2}`}>
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '顧客名' : 'Customer'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {quotation.customer_id ? (
                  <a href={`/${locale}/customers/${quotation.customer_id}`} className={detailStyles.link}>
                    {extractCsName(quotation.customer_id)}
                  </a>
                ) : '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '会社名' : 'Company Name'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue} text-gray-500 dark:text-gray-400`}>{quotation.customer_name || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '担当者' : 'Person in charge'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.contact_person || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>CC</label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.cc || '-'}</p>
            </div>
          </div>
        </div>

        {/* プロジェクト情報セクション */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className={detailStyles.cardTitle}>
              {language === 'ja' ? 'プロジェクト情報' : 'Project Information'}
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid2}`}>
            <div className="md:col-span-2">
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'タイトル' : 'Title'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.title || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'プロジェクト名' : 'Project name'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.project_name || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'タイプ' : 'Type'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.type || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'ベンダー' : 'Vender'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.vendor || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '型式' : 'Model'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.model || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '機械番号' : 'M/C No.'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.machine_no || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'シリアル番号' : 'Serial No.'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.serial_no || '-'}</p>
            </div>
          </div>
        </div>

        {/* 金額情報セクション */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className={detailStyles.cardTitle}>
              {language === 'ja' ? '金額情報' : 'Amount Information'}
            </h2>
          </div>
          <div className={detailStyles.cardContent}>
            <div className={detailStyles.grid3}>
              <div>
                <label className={detailStyles.fieldLabel}>
                  {language === 'ja' ? '小計' : 'Sub total'}
                </label>
                <p className={`mt-1 ${detailStyles.amountLarge}`}>
                  {formatCurrency(quotation.sub_total)}
                </p>
              </div>

              <div>
                <label className={detailStyles.fieldLabel}>
                  {language === 'ja' ? '値引き' : 'Discount'}
                </label>
                <p className={`mt-1 ${detailStyles.amountRed}`}>
                  -{formatCurrency(quotation.discount)}
                </p>
              </div>

              <div>
                <label className={detailStyles.fieldLabel}>
                  {language === 'ja' ? '合計' : 'Grand total'}
                </label>
                <p className={`mt-1 ${detailStyles.amountHighlight}`}>
                  {formatCurrency(quotation.grand_total)}
                </p>
              </div>
            </div>

            <div className={`mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 ${detailStyles.grid4}`}>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja' ? '粗利益' : 'Gross Profit'}
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {formatCurrency(quotation.gross_profit)}
                  {quotation.gross_profit_rate && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({quotation.gross_profit_rate}%)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja' ? '販売利益' : 'Sales profit'}
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {formatCurrency(quotation.sales_profit)}
                  {quotation.sales_profit_rate && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({quotation.sales_profit_rate}%)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja' ? '経費合計' : 'Expense Cost Total'}
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {formatCurrency(quotation.cost_total)}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja' ? 'その他合計' : 'Other Total'}
                </label>
                <p className="mt-1 text-lg font-medium text-gray-900 dark:text-white">
                  {formatCurrency(quotation.other_total)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 支払条件セクション */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className={detailStyles.cardTitle}>
              {language === 'ja' ? '支払条件' : 'Payment Terms'}
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} space-y-4`}>
            {quotation.payment_terms_1 && (
              <div>
                <label className={`${detailStyles.fieldLabel} mb-1`}>
                  {language === 'ja' ? '支払条件1' : 'Payment term1'}
                </label>
                <p className={`${detailStyles.fieldValue} bg-gray-50 dark:bg-gray-800 p-3 rounded`}>{quotation.payment_terms_1}</p>
              </div>
            )}
            {quotation.payment_terms_2 && (
              <div>
                <label className={`${detailStyles.fieldLabel} mb-1`}>
                  {language === 'ja' ? '支払条件2' : 'Payment term2'}
                </label>
                <p className={`${detailStyles.fieldValue} bg-gray-50 dark:bg-gray-800 p-3 rounded`}>{quotation.payment_terms_2}</p>
              </div>
            )}
            {quotation.payment_terms_3 && (
              <div>
                <label className={`${detailStyles.fieldLabel} mb-1`}>
                  {language === 'ja' ? '支払条件3' : 'Payment term3'}
                </label>
                <p className={`${detailStyles.fieldValue} bg-gray-50 dark:bg-gray-800 p-3 rounded`}>{quotation.payment_terms_3}</p>
              </div>
            )}
          </div>
        </div>

        {/* 備考セクション */}
        {quotation.remarks && (
          <div className={detailStyles.card}>
            <div className={detailStyles.cardHeaderWithBg}>
              <h2 className={detailStyles.cardTitle}>
                {language === 'ja' ? '備考' : 'Memo'}
              </h2>
            </div>
            <div className={detailStyles.cardContent}>
              <p className={`${detailStyles.fieldValue} whitespace-pre-wrap`}>{quotation.remarks}</p>
            </div>
          </div>
        )}
      </div>
  );
}
