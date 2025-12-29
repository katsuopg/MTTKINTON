'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { WorkNoRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getFieldLabel, getStatusOptions, getStatusLabel, type Language } from '@/lib/kintone/field-mappings';

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
      <div className="py-8 px-4 max-w-full w-full">
        {/* タイトルエリア */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-base font-bold">
              <span 
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-bold"
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#166534'
                }}
              >
                {getStatusLabel(formData.status, language)}
              </span>
              <span className="text-gray-900">{formData.workNo}</span>
              <span className="text-gray-600">-</span>
              <span className="text-gray-900">{formData.csId}</span>
              <span className="text-gray-600">-</span>
              <span className="text-gray-900">{formData.category}</span>
              <span className="text-gray-600">-</span>
              <span className="text-gray-900">{formData.description}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* カード表示エリア - 詳細画面と同じレイアウト */}
          <div className="w-full mb-6">
            <div style={{ display: 'flex', gap: '16px' }}>
              {/* 1. 工事詳細 */}
              <div className="bg-white shadow-lg rounded-lg p-4 border" style={{ flex: '1', minWidth: '0' }}>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {language === 'ja' ? '工事詳細' : 'Work Details'}
                </h3>
                <table className="w-full text-sm table-fixed">
                  <tbody>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '開始日' : 'Start Date'}</td>
                      <td className="py-1 text-right">
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="w-full text-right text-sm border-gray-300 rounded"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '売上予定日' : 'Sales Date'}</td>
                      <td className="py-1 text-right">
                        <input
                          type="date"
                          value={formData.salesDate}
                          onChange={(e) => setFormData({ ...formData, salesDate: e.target.value })}
                          className="w-full text-right text-sm border-gray-300 rounded"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '終了日' : 'Finish Date'}</td>
                      <td className="py-1 text-right">
                        <input
                          type="date"
                          value={formData.finishDate}
                          onChange={(e) => setFormData({ ...formData, finishDate: e.target.value })}
                          className="w-full text-right text-sm border-gray-300 rounded"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '注文書番号' : 'PO Number'}</td>
                      <td className="py-1 text-right">
                        <span className="text-gray-600">{rec.ルックアップ?.value || '-'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '注文書受取日' : 'PO Receive Date'}</td>
                      <td className="py-1 text-right">
                        <span className="text-gray-600">{rec.日付_0?.value?.replace(/-/g, '/') || '-'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '請求書番号' : 'Invoice No'}</td>
                      <td className="py-1 text-right">
                        <input
                          type="text"
                          value={formData.inv3}
                          onChange={(e) => setFormData({ ...formData, inv3: e.target.value })}
                          className="w-full text-right text-sm border-gray-300 rounded"
                          placeholder="INV-XXXX"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '請求書発行日' : 'Invoice Date'}</td>
                      <td className="py-1 text-right">
                        <span className="text-gray-600">-</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '担当営業' : 'Sales Staff'}</td>
                      <td className="py-1 text-right">
                        <span className="text-gray-600">{record.Salesstaff?.value?.map(s => s.name).join(', ') || 'Anut'}</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 2. 見積もり詳細 */}
              <div className="bg-white shadow-lg rounded-lg p-4 border" style={{ flex: '1', minWidth: '0' }}>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {language === 'ja' ? '見積もり詳細' : 'Quotation Details'}
                </h3>
                <table className="w-full text-sm table-fixed">
                  <tbody>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '見積番号' : 'Quotation No'}</td>
                      <td className="py-1 text-right">
                        <span className="text-gray-600">{rec.ルックアップ_0?.value || '-'}</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '小計' : 'Sub total'}</td>
                      <td className="py-1 text-right">
                        <input
                          type="number"
                          value={formData.grandTotal}
                          onChange={(e) => setFormData({ ...formData, grandTotal: e.target.value })}
                          className="w-full text-right text-sm border-gray-300 rounded"
                          step="0.01"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '値引き' : 'Discount'}</td>
                      <td className="py-1 text-right">
                        <span className="text-gray-600">0 B</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '合計' : 'Grand total'}</td>
                      <td className="py-1 font-medium text-right">
                        <span>{Number(formData.grandTotal).toLocaleString()} B</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '予想利益' : 'Expected Profit'}</td>
                      <td className="py-1 text-right">
                        <input
                          type="number"
                          value={formData.profit}
                          onChange={(e) => setFormData({ ...formData, profit: e.target.value })}
                          className="w-full text-right text-sm border-gray-300 rounded"
                          step="0.01"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">{language === 'ja' ? '利益率' : 'Profit %'}</td>
                      <td className="py-1 text-right">
                        <span className="text-gray-600">
                          {formData.grandTotal && formData.profit 
                            ? `${((Number(formData.profit) / Number(formData.grandTotal)) * 100).toFixed(1)}%`
                            : '0%'
                          }
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 3. 機械情報 */}
              <div className="bg-white shadow-lg rounded-lg p-4 border" style={{ flex: '1', minWidth: '0' }}>
                <h3 className="text-base font-semibold text-gray-900 mb-3">
                  {language === 'ja' ? '機械情報' : 'Machine Info'}
                </h3>
                <table className="w-full text-sm table-fixed">
                  <tbody>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Type</td>
                      <td className="py-1 text-right">Press</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Vender</td>
                      <td className="py-1 text-right">AIDA</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Model</td>
                      <td className="py-1 text-right">
                        <input
                          type="text"
                          value={formData.model}
                          onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                          className="w-full text-right text-sm border-gray-300 rounded"
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Serial No.</td>
                      <td className="py-1 text-right">{rec.文字列__1行__15?.value || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">M/C No.</td>
                      <td className="py-1 text-right">{rec.文字列__1行__5?.value || '-'}</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">M/C Item</td>
                      <td className="py-1 text-right">{record.McItem?.value || '-'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 4. Sales Details */}
              <div className="bg-white shadow-lg rounded-lg p-4 border" style={{ flex: '1', minWidth: '0' }}>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Sales Details</h3>
                <table className="w-full text-sm table-fixed">
                  <tbody>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Sub total</td>
                      <td className="py-1 text-right">{Number(formData.grandTotal).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Discount</td>
                      <td className="py-1 text-right">0 B</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="py-1 whitespace-nowrap font-medium">Grand total</td>
                      <td className="py-1 font-medium text-right">{Number(formData.grandTotal).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Purchase cost</td>
                      <td className="py-1 text-right">0 B</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Labor cost</td>
                      <td className="py-1 text-right">0 B</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="py-1 whitespace-nowrap font-medium">Cost Total</td>
                      <td className="py-1 font-medium text-right">0 B</td>
                    </tr>
                    <tr className="border-t border-gray-200">
                      <td className="py-1 whitespace-nowrap font-medium">Gross Profit</td>
                      <td className="py-1 font-medium text-right">{Number(formData.profit).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">profit %</td>
                      <td className="py-1 text-right">
                        {formData.grandTotal && formData.profit 
                          ? `${((Number(formData.profit) / Number(formData.grandTotal)) * 100).toFixed(1)}%`
                          : '0%'
                        }
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Over Head Fee</td>
                      <td className="py-1 text-right">390 B</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Operation Profit</td>
                      <td className="py-1 text-right">{Math.max(0, Number(formData.profit) - 390).toLocaleString()} B</td>
                    </tr>
                    <tr>
                      <td className="py-1 whitespace-nowrap">Commition (3%)</td>
                      <td className="py-1 text-right">222 B</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 追加のフィールド */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white shadow-lg rounded-lg p-4 border">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                {language === 'ja' ? 'ステータス' : 'Status'}
              </h3>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">選択してください</option>
                {getStatusOptions().map((option) => (
                  <option key={option} value={option}>
                    {getStatusLabel(option, language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="bg-white shadow-lg rounded-lg p-4 border">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                {language === 'ja' ? '基本情報' : 'Basic Information'}
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">CS ID</label>
                  <input
                    type="text"
                    value={formData.csId}
                    onChange={(e) => setFormData({ ...formData, csId: e.target.value })}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'ja' ? 'カテゴリ' : 'Category'}
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'ja' ? '説明' : 'Description'}
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {language === 'ja' ? '担当者' : 'Person in Charge'}
                  </label>
                  <input
                    type="text"
                    value={formData.personInCharge}
                    onChange={(e) => setFormData({ ...formData, personInCharge: e.target.value })}
                    className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 備考 */}
          <div className="mt-6 bg-white shadow-lg rounded-lg p-4 border">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {language === 'ja' ? '備考' : 'Remarks'}
            </h3>
            <textarea
              rows={4}
              value={formData.remarks}
              onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder={language === 'ja' ? '備考を入力してください' : 'Enter remarks'}
            />
          </div>

          {/* 請求書情報 */}
          <div className="mt-6 bg-white shadow-lg rounded-lg p-4 border">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {language === 'ja' ? '請求書情報' : 'Invoice Information'}
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              {language === 'ja' ? '請求書番号を入力してください' : 'Enter invoice numbers'}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'ja' ? '請求書1' : 'Invoice 1'}
                </label>
                <input
                  type="text"
                  value={formData.inv3}
                  onChange={(e) => setFormData({ ...formData, inv3: e.target.value })}
                  className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'ja' ? '請求書2' : 'Invoice 2'}
                </label>
                <input
                  type="text"
                  value={formData.inv4}
                  onChange={(e) => setFormData({ ...formData, inv4: e.target.value })}
                  className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'ja' ? '請求書3' : 'Invoice 3'}
                </label>
                <input
                  type="text"
                  value={formData.inv6}
                  onChange={(e) => setFormData({ ...formData, inv6: e.target.value })}
                  className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {language === 'ja' ? '請求書4' : 'Invoice 4'}
                </label>
                <input
                  type="text"
                  value={formData.inv7}
                  onChange={(e) => setFormData({ ...formData, inv7: e.target.value })}
                  className="mt-1 w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* ボタンエリア */}
          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {language === 'ja' ? 'キャンセル' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (language === 'ja' ? '更新中...' : 'Updating...') : (language === 'ja' ? '更新' : 'Update')}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}