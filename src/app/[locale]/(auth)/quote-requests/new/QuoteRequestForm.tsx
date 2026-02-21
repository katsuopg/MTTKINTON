'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import type { QuoteRequestCreate, QuoteRequestItemCreate } from '@/types/quote-request';

interface QuoteRequestFormProps {
  locale: string;
  language: 'ja' | 'en' | 'th';
  defaultValues?: {
    work_no?: string;
    project_code?: string;
  };
}

const labels = {
  back: { ja: '一覧に戻る', en: 'Back to list', th: 'กลับไปยังรายการ' },
  save: { ja: '保存', en: 'Save', th: 'บันทึก' },
  submit: { ja: '依頼を送信', en: 'Submit Request', th: 'ส่งคำขอ' },
  basicInfo: { ja: '基本情報', en: 'Basic Info', th: 'ข้อมูลพื้นฐาน' },
  items: { ja: '明細', en: 'Items', th: 'รายการ' },
  workNo: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' },
  projectCode: { ja: 'プロジェクトコード', en: 'Project Code', th: 'รหัสโครงการ' },
  desiredDate: { ja: '希望納期', en: 'Desired Delivery Date', th: 'วันที่ต้องการ' },
  remarks: { ja: '備考', en: 'Remarks', th: 'หมายเหตุ' },
  addItem: { ja: '明細を追加', en: 'Add Item', th: 'เพิ่มรายการ' },
  modelNumber: { ja: '型式', en: 'Model No.', th: 'รุ่น' },
  manufacturer: { ja: 'メーカー', en: 'Manufacturer', th: 'ผู้ผลิต' },
  quantity: { ja: '数量', en: 'Quantity', th: 'จำนวน' },
  unit: { ja: '単位', en: 'Unit', th: 'หน่วย' },
  itemRemarks: { ja: '備考', en: 'Remarks', th: 'หมายเหตุ' },
  noItems: { ja: '明細を追加してください', en: 'Please add items', th: 'กรุณาเพิ่มรายการ' },
  required: { ja: '必須', en: 'Required', th: 'จำเป็น' },
  submitting: { ja: '送信中...', en: 'Submitting...', th: 'กำลังส่ง...' },
  success: { ja: '見積依頼を作成しました', en: 'Quote request created', th: 'สร้างใบขอใบเสนอราคาแล้ว' },
  error: { ja: 'エラーが発生しました', en: 'An error occurred', th: 'เกิดข้อผิดพลาด' },
  validationError: { ja: '入力内容を確認してください', en: 'Please check your input', th: 'กรุณาตรวจสอบข้อมูล' },
};

const defaultItem: QuoteRequestItemCreate = {
  model_number: '',
  manufacturer: '',
  quantity: 1,
  unit: '個',
  item_remarks: '',
};

export default function QuoteRequestForm({
  locale,
  language,
  defaultValues,
}: QuoteRequestFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<QuoteRequestCreate>({
    work_no: defaultValues?.work_no || '',
    project_code: defaultValues?.project_code || '',
    desired_delivery_date: '',
    remarks: '',
    items: [{ ...defaultItem }],
  });

  const handleFieldChange = (field: keyof QuoteRequestCreate, value: string | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleItemChange = (index: number, field: keyof QuoteRequestItemCreate, value: string | number) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...defaultItem }],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length <= 1) return;
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    // 明細が空でないか
    if (formData.items.length === 0) {
      setError(labels.noItems[language]);
      return false;
    }

    // 各明細の必須項目
    for (const item of formData.items) {
      if (!item.model_number.trim() || !item.manufacturer.trim() || !item.quantity) {
        setError(labels.validationError[language]);
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const response = await fetch('/api/quote-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create');
      }

      const created = await response.json();
      router.push(`/${locale}/quote-requests/${created.id}`);
    } catch (err) {
      console.error('Error creating quote request:', err);
      setError(err instanceof Error ? err.message : labels.error[language]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={tableStyles.contentWrapper}>
      <form onSubmit={handleSubmit}>
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => router.push(`/${locale}/quote-requests`)}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {language === 'ja' ? '新規見積依頼' : language === 'th' ? 'ใบขอใบเสนอราคาใหม่' : 'New Quote Request'}
            </h1>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`${tableStyles.addButton} ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <Save className="w-4 h-4 mr-2" />
            {submitting ? labels.submitting[language] : labels.submit[language]}
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
            {error}
          </div>
        )}

        {/* 基本情報 */}
        <div className={`${tableStyles.tableContainer} mb-6`}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">
              {labels.basicInfo[language]}
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.workNo[language]}
                </label>
                <input
                  type="text"
                  value={formData.work_no || ''}
                  onChange={(e) => handleFieldChange('work_no', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.projectCode[language]}
                </label>
                <input
                  type="text"
                  value={formData.project_code || ''}
                  onChange={(e) => handleFieldChange('project_code', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.desiredDate[language]}
                </label>
                <input
                  type="date"
                  value={formData.desired_delivery_date || ''}
                  onChange={(e) => handleFieldChange('desired_delivery_date', e.target.value || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.remarks[language]}
                </label>
                <textarea
                  value={formData.remarks || ''}
                  onChange={(e) => handleFieldChange('remarks', e.target.value || null)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 明細 */}
        <div className={tableStyles.tableContainer}>
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-800 dark:text-white">
              {labels.items[language]}
            </h2>
            <button
              type="button"
              onClick={addItem}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400"
            >
              <Plus className="w-4 h-4 mr-1" />
              {labels.addItem[language]}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className={tableStyles.table}>
              <thead className={tableStyles.thead}>
                <tr>
                  <th className={tableStyles.th}>#</th>
                  <th className={tableStyles.th}>
                    {labels.modelNumber[language]} <span className="text-red-500">*</span>
                  </th>
                  <th className={tableStyles.th}>
                    {labels.manufacturer[language]} <span className="text-red-500">*</span>
                  </th>
                  <th className={`${tableStyles.th} text-right`}>
                    {labels.quantity[language]} <span className="text-red-500">*</span>
                  </th>
                  <th className={tableStyles.th}>{labels.unit[language]}</th>
                  <th className={tableStyles.th}>{labels.itemRemarks[language]}</th>
                  <th className={tableStyles.th}></th>
                </tr>
              </thead>
              <tbody className={tableStyles.tbody}>
                {formData.items.map((item, index) => (
                  <tr key={index} className={tableStyles.tr}>
                    <td className={tableStyles.td}>{index + 1}</td>
                    <td className={tableStyles.td}>
                      <input
                        type="text"
                        value={item.model_number}
                        onChange={(e) => handleItemChange(index, 'model_number', e.target.value)}
                        className="w-full min-w-[150px] px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </td>
                    <td className={tableStyles.td}>
                      <input
                        type="text"
                        value={item.manufacturer}
                        onChange={(e) => handleItemChange(index, 'manufacturer', e.target.value)}
                        className="w-full min-w-[120px] px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </td>
                    <td className={tableStyles.td}>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        min="0"
                        step="0.01"
                        className="w-20 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        required
                      />
                    </td>
                    <td className={tableStyles.td}>
                      <input
                        type="text"
                        value={item.unit || '個'}
                        onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                        className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className={tableStyles.td}>
                      <input
                        type="text"
                        value={item.item_remarks || ''}
                        onChange={(e) => handleItemChange(index, 'item_remarks', e.target.value)}
                        className="w-full min-w-[100px] px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      />
                    </td>
                    <td className={tableStyles.td}>
                      {formData.items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>
    </div>
  );
}
