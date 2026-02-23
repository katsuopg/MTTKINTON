'use client';

import { QuotationRecord } from '@/types/kintone';
import Link from 'next/link';
import { type Language } from '@/lib/kintone/field-mappings';
import { detailStyles, getStatusBadgeClass } from '@/components/ui/DetailStyles';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import { Pencil } from 'lucide-react';
import { extractCsName } from '@/lib/utils/customer-name';

interface QuotationDetailContentProps {
  quotation: QuotationRecord;
  locale: string;
}

export default function QuotationDetailContent({ quotation, locale }: QuotationDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '見積もり詳細' : language === 'th' ? 'รายละเอียดใบเสนอราคา' : 'Quotation Details';

  // 日付フォーマット
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-';
    return dateString;
  };

  // 確率の表示
  const getProbabilityDisplay = (prob: string) => {
    const displays: { [key: string]: { text: string; color: string } } = {
      '◎': { text: '◎ (90%)', color: 'text-green-600 dark:text-green-400 font-bold' },
      '◯': { text: '◯ (70%)', color: 'text-green-500 dark:text-green-400' },
      '△': { text: '△ (50%)', color: 'text-yellow-600 dark:text-yellow-400' },
      '-': { text: '- (30%)', color: 'text-gray-600 dark:text-gray-400' }
    };
    return displays[prob] || { text: prob, color: 'text-gray-600 dark:text-gray-400' };
  };

  // 金額フォーマット
  const formatCurrency = (value: string | undefined) => {
    if (!value) return '0.00';
    const num = parseFloat(value);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
      <div className={detailStyles.pageWrapper}>
        <DetailPageHeader
          backHref={`/${locale}/quotation`}
          title={quotation.qtno2?.value || 'QT-XXXX'}
          statusBadge={quotation.ドロップダウン?.value ? (
            <span className={getStatusBadgeClass(quotation.ドロップダウン.value)}>
              {quotation.ドロップダウン.value}
            </span>
          ) : undefined}
          actions={
            <Link
              href={`/${locale}/quotation/${quotation.$id.value}/edit`}
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
            {/* 見積日 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '見積日' : 'QT date'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{formatDate(quotation.日付?.value)}</p>
            </div>

            {/* 営業担当 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '営業担当' : 'Sales staff'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {(() => {
                  const v = quotation.sales_staff?.value;
                  if (!v) return '-';
                  if (typeof v === 'string') return v;
                  if (typeof v === 'object' && v !== null && 'name' in v) return String((v as { name: string }).name);
                  return String(v);
                })()}
              </p>
            </div>

            {/* 受注予定日 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '受注予定日' : 'Scheduled order date'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{formatDate(quotation.日付_0?.value)}</p>
            </div>

            {/* 納期 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '納期' : 'Delivery date'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.文字列__1行__8?.value || '-'}</p>
            </div>

            {/* 見積有効期限 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '見積有効期限' : 'Valid Until'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.ドロップダウン_3?.value || '-'}</p>
            </div>

            {/* 確率 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '確率' : 'Probability'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue} ${quotation.Drop_down?.value ? getProbabilityDisplay(quotation.Drop_down.value).color : ''}`}>
                {quotation.Drop_down?.value ? getProbabilityDisplay(quotation.Drop_down.value).text : '-'}
              </p>
            </div>

            {/* 売上予測 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '売上予測' : 'Sales forecast'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{formatDate(quotation.sales_forecast?.value)}</p>
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
            {/* 顧客名 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '顧客名' : 'Customer'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {quotation.文字列__1行__10?.value ? (
                  <a href={`/${locale}/customers/${quotation.文字列__1行__10.value}`} className={detailStyles.link}>
                    {extractCsName(quotation.文字列__1行__10.value)}
                  </a>
                ) : '-'}
              </p>
            </div>

            {/* 会社名 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '会社名' : 'Company Name'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue} text-gray-500 dark:text-gray-400`}>{quotation.name?.value || '-'}</p>
            </div>

            {/* 担当者 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '担当者' : 'Person in charge'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.ルックアップ_1?.value || '-'}</p>
            </div>

            {/* CC */}
            <div>
              <label className={detailStyles.fieldLabel}>CC</label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.Text_2?.value || '-'}</p>
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
            {/* タイトル */}
            <div className="md:col-span-2">
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'タイトル' : 'Title'} <span className="text-red-500">*</span>
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.文字列__1行__4?.value || '-'}</p>
            </div>

            {/* プロジェクト名 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'プロジェクト名' : 'Project name'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.ドロップダウン_0?.value || '-'}</p>
            </div>

            {/* タイプ */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'タイプ' : 'Type'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.Type?.value || '-'}</p>
            </div>

            {/* 機械情報 */}
            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'ベンダー' : 'Vender'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.文字列__1行__5?.value || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '型式' : 'Model'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.文字列__1行__6?.value || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? '機械番号' : 'M/C No.'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.文字列__1行__9?.value || '-'}</p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                {language === 'ja' ? 'シリアル番号' : 'Serial No.'}
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>{quotation.文字列__1行__7?.value || '-'}</p>
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
                  {formatCurrency(quotation.Sub_total?.value)}
                </p>
              </div>

              <div>
                <label className={detailStyles.fieldLabel}>
                  {language === 'ja' ? '値引き' : 'Discount'}
                </label>
                <p className={`mt-1 ${detailStyles.amountRed}`}>
                  -{formatCurrency(quotation.Discount?.value)}
                </p>
              </div>

              <div>
                <label className={detailStyles.fieldLabel}>
                  {language === 'ja' ? '合計' : 'Grand total'}
                </label>
                <p className={`mt-1 ${detailStyles.amountHighlight}`}>
                  {formatCurrency(quotation.Grand_total?.value)}
                </p>
              </div>
            </div>

            {/* 利益率情報 */}
            <div className={`mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 ${detailStyles.grid4}`}>
              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja' ? '粗利益' : 'Gross Profit'}
                </label>
                <p className={`mt-1 text-lg font-medium text-gray-900 dark:text-white`}>
                  {formatCurrency(quotation.profit_total1?.value)}
                  {quotation.Profit_2?.value && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({quotation.Profit_2.value}%)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja' ? '販売利益' : 'Sales profit'}
                </label>
                <p className={`mt-1 text-lg font-medium text-gray-900 dark:text-white`}>
                  {formatCurrency(quotation.profit_total1_0?.value)}
                  {quotation.Profit_0?.value && (
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">({quotation.Profit_0.value}%)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja' ? '経費合計' : 'Expense Cost Total'}
                </label>
                <p className={`mt-1 text-lg font-medium text-gray-900 dark:text-white`}>
                  {formatCurrency(quotation.costtotal?.value)}
                </p>
              </div>

              <div>
                <label className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ja' ? 'その他合計' : 'Other Total'}
                </label>
                <p className={`mt-1 text-lg font-medium text-gray-900 dark:text-white`}>
                  {formatCurrency(quotation.costtotal_0?.value)}
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
            {quotation.payment_1?.value && (
              <div>
                <label className={`${detailStyles.fieldLabel} mb-1`}>
                  {language === 'ja' ? '支払条件1' : 'Payment term1'}
                </label>
                <p className={`${detailStyles.fieldValue} bg-gray-50 dark:bg-gray-800 p-3 rounded`}>{quotation.payment_1.value}</p>
              </div>
            )}
            {quotation.ドロップダウン_4?.value && (
              <div>
                <label className={`${detailStyles.fieldLabel} mb-1`}>
                  {language === 'ja' ? '支払条件2' : 'Payment term2'}
                </label>
                <p className={`${detailStyles.fieldValue} bg-gray-50 dark:bg-gray-800 p-3 rounded`}>{quotation.ドロップダウン_4.value}</p>
              </div>
            )}
            {quotation.ドロップダウン_5?.value && (
              <div>
                <label className={`${detailStyles.fieldLabel} mb-1`}>
                  {language === 'ja' ? '支払条件3' : 'Payment term3'}
                </label>
                <p className={`${detailStyles.fieldValue} bg-gray-50 dark:bg-gray-800 p-3 rounded`}>{quotation.ドロップダウン_5.value}</p>
              </div>
            )}
          </div>
        </div>

        {/* 備考セクション */}
        {quotation.文字列__複数行__2?.value && (
          <div className={detailStyles.card}>
            <div className={detailStyles.cardHeaderWithBg}>
              <h2 className={detailStyles.cardTitle}>
                {language === 'ja' ? '備考' : 'Memo'}
              </h2>
            </div>
            <div className={detailStyles.cardContent}>
              <p className={`${detailStyles.fieldValue} whitespace-pre-wrap`}>{quotation.文字列__複数行__2.value}</p>
            </div>
          </div>
        )}
      </div>
  );
}
