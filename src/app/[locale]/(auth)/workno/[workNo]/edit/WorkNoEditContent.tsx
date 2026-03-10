'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkNoRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFieldLabel, getStatusOptions, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';
import { detailStyles, getStatusBadgeClass } from '@/components/ui/DetailStyles';
import { formStyles } from '@/components/ui/FormStyles';

interface WorkNoEditContentProps {
  record: WorkNoRecord;
  locale: string;
  userEmail: string;
  userInfo?: { email: string; name: string; avatarUrl?: string };
}

export default function WorkNoEditContent({ record, locale, userEmail, userInfo }: WorkNoEditContentProps) {
  const router = useRouter();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = `${getFieldLabel('WorkNo', language)} - ${language === 'ja' ? '編集' : 'Edit'}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rec = record as any; // Type assertion for kintone dynamic fields

  const [formData, setFormData] = useState({
    workNo: record.WorkNo?.value || '',
    status: record.Status?.value || '',
    startDate: record.日付_6?.value || '',
    finishDate: record.日付_5?.value || '',
    salesDate: record.Salesdate?.value || '',
    csId: record.文字列__1行__8?.value || '',
    category: record.文字列__1行__1?.value || '',
    description: record.文字列__1行__2?.value || '',
    model: record.文字列__1行__9?.value || '',
    grandTotal: record.grand_total?.value || '0',
    profit: record.profit?.value || '0',
    remarks: (record as any).文字列__複数行__0?.value || '',
    // 請求書関連フィールド
    inv3: record.文字列__1行__3?.value || '',
    inv4: record.文字列__1行__4?.value || '',
    inv6: record.文字列__1行__6?.value || '',
    inv7: record.文字列__1行__7?.value || '',
    // 担当者
    personInCharge: record.Parson_in_charge?.value || '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/workno/${record.WorkNo?.value}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('更新に失敗しました');
      }

      // 成功したら詳細画面に戻る
      router.push(`/${locale}/workno/${record.WorkNo?.value}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新中にエラーが発生しました');
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/${locale}/workno/${record.WorkNo?.value}`);
  };

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle} userInfo={userInfo}>
      <div className={detailStyles.pageWrapper}>
        {/* タイトルエリア */}
        <div className={detailStyles.pageHeader}>
          <div className="flex items-center gap-2">
            <span className={getStatusBadgeClass(formData.status)}>
              {getStatusLabel(formData.status, language)}
            </span>
            <h1 className={detailStyles.pageTitle}>
              {formData.workNo} - {formData.csId} - {formData.category} - {formData.description}
            </h1>
          </div>
        </div>

        {error && (
          <div className={formStyles.errorAlert}>
            <p className={formStyles.errorAlertText}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* カード表示エリア - 4カラムレイアウト */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* 1. 工事詳細 */}
            <div className={detailStyles.card}>
              <div className={detailStyles.cardHeaderWithBg}>
                <h3 className={detailStyles.cardTitle}>
                  {language === 'ja' ? '工事詳細' : 'Work Details'}
                </h3>
              </div>
              <div className={detailStyles.cardContent}>
                <table className={detailStyles.summaryTable}>
                  <tbody>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '開始日' : 'Start Date'}</td>
                      <td className={detailStyles.summaryRow}>
                        <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className={`${formStyles.input} text-right`} />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '売上予定日' : 'Sales Date'}</td>
                      <td className={detailStyles.summaryRow}>
                        <input type="date" value={formData.salesDate} onChange={(e) => setFormData({ ...formData, salesDate: e.target.value })} className={`${formStyles.input} text-right`} />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '終了日' : 'Finish Date'}</td>
                      <td className={detailStyles.summaryRow}>
                        <input type="date" value={formData.finishDate} onChange={(e) => setFormData({ ...formData, finishDate: e.target.value })} className={`${formStyles.input} text-right`} />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '注文書番号' : 'PO Number'}</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{rec.ルックアップ?.value || '-'}</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '注文書受取日' : 'PO Receive Date'}</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{rec.日付_0?.value?.replace(/-/g, '/') || '-'}</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '請求書番号' : 'Invoice No'}</td>
                      <td className={detailStyles.summaryRow}>
                        <input type="text" value={formData.inv3} onChange={(e) => setFormData({ ...formData, inv3: e.target.value })} className={`${formStyles.input} text-right`} placeholder="INV-XXXX" />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '請求書発行日' : 'Invoice Date'}</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>-</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '担当営業' : 'Sales Staff'}</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.Salesstaff?.value?.map(s => s.name).join(', ') || 'Anut'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 2. 見積もり詳細 */}
            <div className={detailStyles.card}>
              <div className={detailStyles.cardHeaderWithBg}>
                <h3 className={detailStyles.cardTitle}>
                  {language === 'ja' ? '見積もり詳細' : 'Quotation Details'}
                </h3>
              </div>
              <div className={detailStyles.cardContent}>
                <table className={detailStyles.summaryTable}>
                  <tbody>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '見積番号' : 'Quotation No'}</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{rec.ルックアップ_0?.value || '-'}</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '小計' : 'Sub total'}</td>
                      <td className={detailStyles.summaryRow}>
                        <input type="number" value={formData.grandTotal} onChange={(e) => setFormData({ ...formData, grandTotal: e.target.value })} className={`${formStyles.input} text-right`} step="0.01" />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '値引き' : 'Discount'}</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel} font-medium`}>{language === 'ja' ? '合計' : 'Grand total'}</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue} font-medium`}>{Number(formData.grandTotal).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '予想利益' : 'Expected Profit'}</td>
                      <td className={detailStyles.summaryRow}>
                        <input type="number" value={formData.profit} onChange={(e) => setFormData({ ...formData, profit: e.target.value })} className={`${formStyles.input} text-right`} step="0.01" />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>{language === 'ja' ? '利益率' : 'Profit %'}</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                        {formData.grandTotal && formData.profit
                          ? `${((Number(formData.profit) / Number(formData.grandTotal)) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. 機械情報 */}
            <div className={detailStyles.card}>
              <div className={detailStyles.cardHeaderWithBg}>
                <h3 className={detailStyles.cardTitle}>
                  {language === 'ja' ? '機械情報' : 'Machine Info'}
                </h3>
              </div>
              <div className={detailStyles.cardContent}>
                <table className={detailStyles.summaryTable}>
                  <tbody>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Type</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>Press</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Vender</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>AIDA</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Model</td>
                      <td className={detailStyles.summaryRow}>
                        <input type="text" value={formData.model} onChange={(e) => setFormData({ ...formData, model: e.target.value })} className={`${formStyles.input} text-right`} />
                      </td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Serial No.</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{rec.文字列__1行__15?.value || '-'}</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>M/C No.</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{rec.文字列__1行__5?.value || '-'}</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>M/C Item</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{record.McItem?.value || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Sales Details */}
            <div className={detailStyles.card}>
              <div className={detailStyles.cardHeaderWithBg}>
                <h3 className={detailStyles.cardTitle}>Sales Details</h3>
              </div>
              <div className={detailStyles.cardContent}>
                <table className={detailStyles.summaryTable}>
                  <tbody>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Sub total</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{Number(formData.grandTotal).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Discount</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td>
                    </tr>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel} font-medium`}>Grand total</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue} font-medium`}>{Number(formData.grandTotal).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Purchase cost</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Labor cost</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>0 B</td>
                    </tr>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel} font-medium`}>Cost Total</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue} font-medium`}>0 B</td>
                    </tr>
                    <tr className="border-t border-gray-200 dark:border-gray-700">
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel} font-medium`}>Gross Profit</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue} font-medium`}>{Number(formData.profit).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>profit %</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>
                        {formData.grandTotal && formData.profit
                          ? `${((Number(formData.profit) / Number(formData.grandTotal)) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Over Head Fee</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>390 B</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Operation Profit</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>{Math.max(0, Number(formData.profit) - 390).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryLabel}`}>Commition (3%)</td>
                      <td className={`${detailStyles.summaryRow} ${detailStyles.summaryValue}`}>222 B</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 追加のフィールド */}
          <div className={`mt-6 ${detailStyles.grid2}`}>
            <div className={detailStyles.card}>
              <div className={detailStyles.cardHeaderWithBg}>
                <h3 className={detailStyles.cardTitle}>
                  {language === 'ja' ? 'ステータス' : 'Status'}
                </h3>
              </div>
              <div className={detailStyles.cardContent}>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className={formStyles.select}
                >
                  <option value="">選択してください</option>
                  {getStatusOptions().map((option) => (
                    <option key={option} value={option}>
                      {getStatusLabel(option, language)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className={detailStyles.card}>
              <div className={detailStyles.cardHeaderWithBg}>
                <h3 className={detailStyles.cardTitle}>
                  {language === 'ja' ? '基本情報' : 'Basic Information'}
                </h3>
              </div>
              <div className={detailStyles.cardContent}>
                <div className={formStyles.formGroup}>
                  <div>
                    <label className={formStyles.label}>CS ID</label>
                    <input type="text" value={formData.csId} onChange={(e) => setFormData({ ...formData, csId: e.target.value })} className={formStyles.input} />
                  </div>
                  <div>
                    <label className={formStyles.label}>
                      {language === 'ja' ? 'カテゴリ' : 'Category'}
                    </label>
                    <input type="text" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={formStyles.input} />
                  </div>
                  <div>
                    <label className={formStyles.label}>
                      {language === 'ja' ? '説明' : 'Description'}
                    </label>
                    <input type="text" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={formStyles.input} />
                  </div>
                  <div>
                    <label className={formStyles.label}>
                      {language === 'ja' ? '担当者' : 'Person in Charge'}
                    </label>
                    <input type="text" value={formData.personInCharge} onChange={(e) => setFormData({ ...formData, personInCharge: e.target.value })} className={formStyles.input} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 備考 */}
          <div className={`mt-6 ${detailStyles.card}`}>
            <div className={detailStyles.cardHeaderWithBg}>
              <h3 className={detailStyles.cardTitle}>
                {language === 'ja' ? '備考' : 'Remarks'}
              </h3>
            </div>
            <div className={detailStyles.cardContent}>
              <textarea
                rows={4}
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                className={formStyles.textarea}
                placeholder={language === 'ja' ? '備考を入力してください' : 'Enter remarks'}
              />
            </div>
          </div>

          {/* 請求書情報 */}
          <div className={`mt-6 ${detailStyles.card}`}>
            <div className={detailStyles.cardHeaderWithBg}>
              <h3 className={detailStyles.cardTitle}>
                {language === 'ja' ? '請求書情報' : 'Invoice Information'}
              </h3>
            </div>
            <div className={detailStyles.cardContent}>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {language === 'ja' ? '請求書番号を入力してください' : 'Enter invoice numbers'}
              </p>
              <div className={detailStyles.grid2}>
                <div>
                  <label className={formStyles.label}>
                    {language === 'ja' ? '請求書1' : 'Invoice 1'}
                  </label>
                  <input type="text" value={formData.inv3} onChange={(e) => setFormData({ ...formData, inv3: e.target.value })} className={formStyles.input} />
                </div>
                <div>
                  <label className={formStyles.label}>
                    {language === 'ja' ? '請求書2' : 'Invoice 2'}
                  </label>
                  <input type="text" value={formData.inv4} onChange={(e) => setFormData({ ...formData, inv4: e.target.value })} className={formStyles.input} />
                </div>
                <div>
                  <label className={formStyles.label}>
                    {language === 'ja' ? '請求書3' : 'Invoice 3'}
                  </label>
                  <input type="text" value={formData.inv6} onChange={(e) => setFormData({ ...formData, inv6: e.target.value })} className={formStyles.input} />
                </div>
                <div>
                  <label className={formStyles.label}>
                    {language === 'ja' ? '請求書4' : 'Invoice 4'}
                  </label>
                  <input type="text" value={formData.inv7} onChange={(e) => setFormData({ ...formData, inv7: e.target.value })} className={formStyles.input} />
                </div>
              </div>
            </div>
          </div>

          {/* ボタンエリア */}
          <div className="mt-8 flex justify-end gap-3">
            <button type="button" onClick={handleCancel} className={detailStyles.secondaryButton}>
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </button>
            <button type="submit" disabled={isSubmitting} className={`${detailStyles.primaryButton} disabled:opacity-50 disabled:cursor-not-allowed`}>
              {isSubmitting ? (language === 'ja' ? '更新中...' : 'Updating...') : (language === 'ja' ? '更新' : 'Update')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
