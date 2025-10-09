'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { QuotationRecord } from '@/types/kintone';
import type { Language } from '@/lib/kintone/field-mappings';

interface CustomerOption {
  id: string;
  name: string;
  address: string;
}

interface StaffOption {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
}

interface QuotationEditFormProps {
  locale: string;
  quotation: QuotationRecord;
  userEmail: string;
  customerOptions: CustomerOption[];
}

const lineItemSchema = z.object({
  rowId: z.string().optional(),
  Text: z.string().optional(),
  category: z.string().optional(),
  Desc: z.string().optional(),
  type: z.enum(['Expense', 'Other']).optional(),
  Cost: z.string().optional(),
  Rate: z.string().optional(),
  QTY: z.string().optional(),
  unit: z.string().optional(),
});

type LineItemFormValue = z.infer<typeof lineItemSchema>;

function createEmptyLineItem(): LineItemFormValue {
  return {
    rowId: undefined,
    Text: '',
    category: '',
    Desc: '',
    type: 'Expense',
    Cost: '',
    Rate: '1',
    QTY: '',
    unit: '',
  };
}

const formSchema = z.object({
  qtDate: z.string().optional(),
  qtNo: z.string().optional(),
  customerId: z.string().optional(),
  customerName: z.string().optional(),
  customerAddress: z.string().optional(),
  contactId: z.string().optional(),
  contactPerson: z.string().optional(),
  projectName: z.string().optional(),
  title: z.string().optional(),
  vendor: z.string().optional(),
  model: z.string().optional(),
  serialNo: z.string().optional(),
  machineNo: z.string().optional(),
  delivery: z.string().optional(),
  validUntil: z.string().optional(),
  paymentTerm: z.string().optional(),
  remark: z.string().optional(),
  discount: z.string().optional(),
  internalStatus: z.string().optional(),
  probability: z.string().optional(),
  salesPhone: z.string().optional(),
  subTotal: z.string().optional(),
  grandTotal: z.string().optional(),
  lineItems: z.array(lineItemSchema),
});

type QuotationFormValues = z.infer<typeof formSchema>;

const currencyFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatCurrency(value: number): string {
  return currencyFormatter.format(isFinite(value) ? value : 0);
}

export default function QuotationEditForm({ locale, quotation, userEmail, customerOptions }: QuotationEditFormProps) {
  const router = useRouter();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [isStaffLoading, setIsStaffLoading] = useState(false);
  const [staffFetchError, setStaffFetchError] = useState<string | null>(null);

  const defaultValues = useMemo<QuotationFormValues>(() => {
    const salesStaffName = quotation.sales_staff?.value?.[0]?.name ?? '';
    const approverName = quotation.Approver?.value?.[0]?.name ?? '';
    const customerId = quotation.文字列__1行__10?.value ?? '';

    const lineItems = Array.isArray(quotation['見積明細']?.value)
      ? quotation['見積明細'].value.map((row: any) => ({
          rowId: row.id,
          Text: row.value.Text?.value ?? '',
          category: row.value['ルックアップ']?.value ?? '',
          Desc: row.value.Desc?.value ?? '',
          type: row.value.type?.value ?? 'Expense',
          Cost: row.value.Cost?.value ?? '',
          Rate: row.value.Rate?.value ?? '',
          QTY: row.value.QTY?.value ?? '',
          unit: row.value['ドロップダウン_2']?.value ?? '',
        }))
      : [];
    const normalizedLineItems = lineItems.length > 0 ? lineItems : [createEmptyLineItem()];

    return {
      qtDate: quotation.日付?.value ?? '',
      qtNo: quotation.qtno2?.value ?? '',
      customerId,
      customerName: quotation.name?.value ?? '',
      customerAddress: quotation.Text_3?.value || quotation.Text_2?.value || '',
      contactId: '',
      contactPerson: quotation.ルックアップ_1?.value ?? '',
      projectName: quotation.ドロップダウン_0?.value ?? '',
      title: quotation.文字列__1行__4?.value ?? '',
      vendor: quotation.文字列__1行__5?.value ?? '',
      model: quotation.文字列__1行__6?.value ?? '',
      serialNo: quotation.文字列__1行__7?.value ?? '',
      machineNo: quotation.文字列__1行__9?.value ?? '',
      delivery: quotation.文字列__1行__8?.value ?? '',
      validUntil: quotation.ドロップダウン_3?.value ?? '',
      paymentTerm: quotation.payment_1?.value ?? '',
      remark: quotation.Text_1?.value ?? '',
      discount: quotation.Discount?.value ?? '',
      internalStatus: quotation.ドロップダウン?.value ?? '',
      probability: quotation.Drop_down?.value ?? '',
      salesPhone: quotation.Mobile?.value ?? '',
      subTotal: quotation.Sub_total?.value ?? '',
      grandTotal: quotation.Grand_total?.value ?? '',
      lineItems: normalizedLineItems,
    };
  }, [quotation]);

  const form = useForm<QuotationFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const { control, handleSubmit, watch, setValue, getValues } = form;
  const { fields, insert, remove } = useFieldArray({ control, name: 'lineItems' });
  const watchedItems = watch('lineItems');
  const discountValue = watch('discount');
  const selectedCustomerId = watch('customerId');
  const currentContactName = watch('contactPerson');

  useEffect(() => {
    const currentId = getValues('customerId');
    if (!currentId) {
      const name = getValues('customerName');
      if (name) {
        const matched = customerOptions.find((option) => option.name === name);
        if (matched) {
          setValue('customerId', matched.id, { shouldDirty: false });
          if (!getValues('customerAddress')) {
            setValue('customerAddress', matched.address ?? '', { shouldDirty: false });
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerOptions]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setStaffOptions([]);
      setStaffFetchError(null);
      setValue('contactId', '', { shouldDirty: true });
      setValue('contactPerson', '', { shouldDirty: true });
      return;
    }

    const controller = new AbortController();
    setIsStaffLoading(true);
    setStaffFetchError(null);

    fetch(`/api/customer-staff/${encodeURIComponent(selectedCustomerId)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch staff');
        }
        return response.json() as Promise<StaffOption[]>;
      })
      .then((data) => {
        setStaffOptions(data);
        const matched = data.find((option) => option.name === currentContactName);
        if (matched) {
          setValue('contactId', matched.id, { shouldDirty: false });
        } else {
          setValue('contactId', '', { shouldDirty: false });
          if (currentContactName) {
            setValue('contactPerson', '', { shouldDirty: true });
          }
        }
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch staff options', error);
          setStaffFetchError('担当者の取得に失敗しました');
        }
      })
      .finally(() => {
        setIsStaffLoading(false);
      });

    return () => controller.abort();
  }, [currentContactName, selectedCustomerId, setValue]);

  const handleCustomerSelect = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const matched = customerOptions.find((option) => option.id === value);
    if (matched) {
      setValue('customerName', matched.name, { shouldDirty: true });
      setValue('customerAddress', matched.address ?? '', { shouldDirty: true });
    } else {
      setValue('customerName', '', { shouldDirty: true });
      setValue('customerAddress', '', { shouldDirty: true });
    }
    setValue('contactId', '', { shouldDirty: true });
    setValue('contactPerson', '', { shouldDirty: true });
  };

  const handleContactSelect = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const matched = staffOptions.find((option) => option.id === value);
    if (matched) {
      setValue('contactPerson', matched.name, { shouldDirty: true });
    } else {
      setValue('contactPerson', '', { shouldDirty: true });
    }
  };

  const computedSubTotal = useMemo(() => {
    return watchedItems.reduce((sum, item) => {
      const cost = parseFloat(item.Cost || '0') || 0;
      const rate = parseFloat(item.Rate || '0') || 0;
      const qty = parseFloat(item.QTY || '0') || 0;
      const unitPrice = rate ? cost * rate : cost;
      return sum + unitPrice * qty;
    }, 0);
  }, [watchedItems]);

  const computedGrandTotal = useMemo(() => {
    const discount = parseFloat(discountValue || '0') || 0;
    return Math.max(computedSubTotal - discount, 0);
  }, [computedSubTotal, discountValue]);

  const onSubmit = async (values: QuotationFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/quotation/${quotation.$id.value}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || '更新に失敗しました');
      }

      setSuccessMessage(language === 'ja' ? '保存しました' : 'Saved successfully');
      router.refresh();
      router.push(`/${locale}/quotation/${quotation.$id.value}`);
    } catch (error: any) {
      console.error('Failed to update quotation', error);
      setErrorMessage(error?.message || '更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={language === 'ja' ? '見積もり編集' : 'Edit Quotation'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6">
        {errorMessage && (
          <div className="rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        {/* Internal information */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">{language === 'ja' ? '社内情報' : 'Internal Information'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
              <Controller
                control={control}
                name="internalStatus"
                render={({ field }) => (
                  <input {...field} className="w-full rounded border border-slate-300 px-2 py-1" />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Probability</label>
              <Controller
                control={control}
                name="probability"
                render={({ field }) => (
                  <input {...field} className="w-full rounded border border-slate-300 px-2 py-1" />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sales Staff</label>
              <input
                value={quotation.sales_staff?.value?.[0]?.name ?? ''}
                readOnly
                className="w-full rounded border border-slate-200 bg-slate-100 px-2 py-1 text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Sales Phone</label>
              <Controller
                control={control}
                name="salesPhone"
                render={({ field }) => (
                  <input {...field} className="w-full rounded border border-slate-300 px-2 py-1" />
                )}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Approver</label>
              <input
                value={quotation.Approver?.value?.[0]?.name ?? ''}
                readOnly
                className="w-full rounded border border-slate-200 bg-slate-100 px-2 py-1 text-slate-600"
              />
            </div>
          </div>
        </section>

        {/* Quotation layout */}
        <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-8 py-6 border-b border-gray-300 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-wide">MEGA TECH (THAI) CO., LTD.</h1>
                <p className="text-xs text-gray-600 leading-4 mt-2">
                  107/5 Moo 8, Praeksa Tai Soi 3, Samutprakan 10130 THAILAND<br />
                  Tel: +66 (2) 380-0367-68 Fax: +66 (2) 757-6056 E-mail: admin_n@megatech.co.th
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold tracking-widest">QUOTATION</p>
              </div>
            </div>

            <div className="grid grid-cols-12 gap-4 text-sm">
              <div className="col-span-8 border border-gray-400">
                <div className="bg-gray-100 px-3 py-2 font-semibold uppercase">To</div>
                <div className="px-3 py-2 space-y-2">
                  <Controller
                    control={control}
                    name="customerId"
                    render={({ field }) => (
                      <select
                        {...field}
                        onChange={(event) => handleCustomerSelect(event.target.value, field.onChange)}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="">{language === 'ja' ? '顧客を選択してください' : language === 'th' ? 'เลือกชื่อลูกค้า' : 'Select a customer'}</option>
                        {customerOptions.map((option) => (
                          <option key={option.id} value={option.id}>
                            {option.name}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <Controller
                    control={control}
                    name="customerName"
                    render={({ field }) => <input {...field} type="hidden" />}
                  />
                  <Controller
                    control={control}
                    name="customerAddress"
                    render={({ field }) => (
                      <textarea
                        {...field}
                        rows={3}
                        className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      />
                    )}
                  />
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">Attn.</span>
                      <Controller
                        control={control}
                        name="contactId"
                        render={({ field }) => (
                          <select
                            {...field}
                            onChange={(event) => handleContactSelect(event.target.value, field.onChange)}
                            className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            disabled={!selectedCustomerId || isStaffLoading}
                          >
                            <option value="">
                              {selectedCustomerId
                                ? language === 'ja'
                                  ? '担当者を選択してください'
                                  : language === 'th'
                                  ? 'เลือกผู้ติดต่อ'
                                  : 'Select a contact'
                                : language === 'ja'
                                ? '顧客を先に選択してください'
                                : language === 'th'
                                ? 'กรุณาเลือกลูกค้าก่อน'
                                : 'Select a customer first'}
                            </option>
                            {staffOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      <Controller
                        control={control}
                        name="contactPerson"
                        render={({ field }) => <input {...field} type="hidden" />}
                      />
                    </div>
                    {isStaffLoading && (
                      <p className="text-xs text-indigo-600">{language === 'ja' ? '担当者情報を読み込み中...' : language === 'th' ? 'กำลังโหลดข้อมูลผู้ติดต่อ...' : 'Loading contacts...'}</p>
                    )}
                    {staffFetchError && <p className="text-xs text-red-500">{staffFetchError}</p>}
                  </div>
                </div>
              </div>
              <div className="col-span-4 border border-gray-400 divide-y divide-gray-400 text-sm">
                {[
                  { label: 'QT DATE', name: 'qtDate' },
                  { label: 'QT NO.', name: 'qtNo' },
                  { label: 'VALID UNTIL', name: 'validUntil' },
                  { label: 'DELIVERY', name: 'delivery' },
                ].map(({ label, name }) => (
                  <div key={label} className="flex">
                    <div className="w-1/2 bg-gray-100 px-3 py-2 font-semibold text-xs">{label}</div>
                    <div className="w-1/2 px-3 py-2">
                      <Controller
                        control={control}
                        name={name as keyof QuotationFormValues}
                        render={({ field }) => (
                          <input {...field} className="w-full border-none focus:outline-none" />
                        )}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-12 border border-gray-400 text-xs text-gray-700 font-semibold">
              <div className="col-span-3 border-r border-gray-400 px-3 py-2">PROJECT</div>
              <div className="col-span-3 border-r border-gray-400 px-3 py-2">VENDER</div>
              <div className="col-span-3 border-r border-gray-400 px-3 py-2">SERIAL NO.</div>
              <div className="col-span-3 px-3 py-2">M/C NO.</div>
              <div className="col-span-3 border-r border-t border-gray-400 px-3 py-2">
                <Controller
                  control={control}
                  name="projectName"
                  render={({ field }) => (
                    <input {...field} className="w-full border-none focus:outline-none font-medium" />
                  )}
                />
              </div>
              <div className="col-span-3 border-r border-t border-gray-400 px-3 py-2">
                <Controller
                  control={control}
                  name="vendor"
                  render={({ field }) => (
                    <input {...field} className="w-full border-none focus:outline-none" />
                  )}
                />
              </div>
              <div className="col-span-3 border-r border-t border-gray-400 px-3 py-2">
                <Controller
                  control={control}
                  name="serialNo"
                  render={({ field }) => (
                    <input {...field} className="w-full border-none focus:outline-none" />
                  )}
                />
              </div>
              <div className="col-span-3 border-t border-gray-400 px-3 py-2">
                <Controller
                  control={control}
                  name="machineNo"
                  render={({ field }) => (
                    <input {...field} className="w-full border-none focus:outline-none" />
                  )}
                />
              </div>
            </div>
          </div>

          {/* Line items table */}
          <div className="px-8 py-6">
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-400 text-xs">
                <thead className="bg-gray-100 text-gray-600 uppercase">
                  <tr>
                    <th className="border border-gray-400 px-2 py-2 w-12 text-center">Action</th>
                    <th className="border border-gray-400 px-2 py-2 w-16">Item</th>
                    <th className="border border-gray-400 px-2 py-2 w-48 text-left">Category</th>
                    <th className="border border-gray-400 px-2 py-2 text-left">Description</th>
                    <th className="border border-gray-400 px-2 py-2 w-32">Type</th>
                    <th className="border border-gray-400 px-2 py-2 w-24 text-right">Cost</th>
                    <th className="border border-gray-400 px-2 py-2 w-20 text-right">Rate</th>
                    <th className="border border-gray-400 px-2 py-2 w-24 text-right">Unit Price</th>
                    <th className="border border-gray-400 px-2 py-2 w-20 text-right">Qty</th>
                    <th className="border border-gray-400 px-2 py-2 w-24 text-left">Unit</th>
                    <th className="border border-gray-400 px-2 py-2 w-28 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const item = watchedItems[index] ?? {};
                    const cost = parseFloat(item.Cost || '0') || 0;
                    const rate = parseFloat(item.Rate || '0') || 0;
                    const qty = parseFloat(item.QTY || '0') || 0;
                    const unitPrice = rate ? cost * rate : cost;
                    const amount = unitPrice * qty;

                    return (
                      <tr key={field.id} className="align-top">
                        <td className="border border-gray-300 px-2 py-2">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              type="button"
                              onClick={() => insert(index + 1, createEmptyLineItem())}
                              className="h-6 w-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-indigo-400 hover:text-indigo-500"
                              aria-label={language === 'ja' ? '行を追加' : language === 'th' ? 'เพิ่มแถว' : 'Add row'}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="h-6 w-6 flex items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:border-red-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed"
                              aria-label={language === 'ja' ? '行を削除' : language === 'th' ? 'ลบแถว' : 'Remove row'}
                              disabled={fields.length === 1}
                            >
                              -
                            </button>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.Text`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-gray-300 rounded px-1 py-1 text-center" />
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.category`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-gray-300 rounded px-1 py-1" />
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.Desc`}
                            render={({ field }) => (
                              <textarea {...field} rows={2} className="w-full border border-gray-300 rounded px-1 py-1 resize-none" />
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.type`}
                            render={({ field }) => (
                              <div className="flex flex-col space-y-1">
                                {['Expense', 'Other'].map((option) => (
                                  <label key={option} className="flex items-center space-x-1">
                                    <input
                                      type="radio"
                                      value={option}
                                      checked={(field.value ?? 'Expense') === option}
                                      onChange={(event) => field.onChange(event.target.value)}
                                      className="h-3 w-3"
                                    />
                                    <span>{option}</span>
                                  </label>
                                ))}
                              </div>
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.Cost`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-gray-300 rounded px-1 py-1 text-right" />
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.Rate`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-gray-300 rounded px-1 py-1 text-right" />
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right font-semibold text-gray-900">
                          {formatCurrency(unitPrice)}
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.QTY`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-gray-300 rounded px-1 py-1 text-right" />
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.unit`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-gray-300 rounded px-1 py-1" />
                            )}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-2 text-right font-semibold text-gray-900">
                          {formatCurrency(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="px-8 pb-6">
            <div className="grid grid-cols-12 text-xs border border-gray-400">
              <div className="col-span-8 border-r border-gray-400 px-3 py-4 text-gray-300 italic">&nbsp;</div>
              <div className="col-span-4 divide-y divide-gray-400">
                <div className="flex">
                  <div className="w-1/2 bg-gray-100 px-3 py-2 font-semibold">SUB TOTAL</div>
                  <div className="w-1/2 px-3 py-2 text-right font-semibold">{formatCurrency(computedSubTotal)}</div>
                </div>
                <div className="flex">
                  <div className="w-1/2 bg-gray-100 px-3 py-2 font-semibold">DISCOUNT</div>
                  <div className="w-1/2 px-3 py-2 text-right">
                    <Controller
                      control={control}
                      name="discount"
                      render={({ field }) => (
                        <input {...field} className="w-full border border-gray-300 rounded px-2 py-1 text-right" />
                      )}
                    />
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/2 bg-gray-100 px-3 py-2 font-semibold">GRAND TOTAL</div>
                  <div className="w-1/2 px-3 py-2 text-right font-bold text-indigo-600">{formatCurrency(computedGrandTotal)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 border border-t-0 border-gray-400 text-xs mt-4">
              <div className="col-span-3 bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase">Payment Term</div>
              <div className="col-span-9 px-3 py-2">
                <Controller
                  control={control}
                  name="paymentTerm"
                  render={({ field }) => (
                    <textarea {...field} rows={2} className="w-full border border-gray-300 rounded px-2 py-1" />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-12 border border-t-0 border-gray-400 text-xs">
              <div className="col-span-3 bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase">Remark</div>
              <div className="col-span-9 px-3 py-2">
                <Controller
                  control={control}
                  name="remark"
                  render={({ field }) => (
                    <textarea {...field} rows={2} className="w-full border border-gray-300 rounded px-2 py-1" />
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 border border-t-0 border-gray-400 text-center text-xs mt-6">
              {['SALES STAFF', 'APPROVED BY', 'CUSTOMER CONFIRM'].map((label, idx) => (
                <div key={label} className={`px-3 py-4 ${idx < 2 ? 'border-r border-gray-400' : ''}`}>
                  <div className="font-semibold uppercase mb-6">{label}</div>
                  <div className="h-10 flex items-center justify-center text-sm text-gray-600">
                    {idx === 0 ? quotation.sales_staff?.value?.[0]?.name ?? '' : idx === 1 ? quotation.Approver?.value?.[0]?.name ?? '' : ''}
                  </div>
                  <div className="mt-4 text-left">
                    <span className="text-[10px] font-medium">DATE:</span>
                    <span className="ml-2 text-[11px] text-gray-700">{defaultValues.qtDate}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            {language === 'ja' ? 'キャンセル' : 'Cancel'}
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60"
            disabled={isSubmitting}
          >
            {isSubmitting ? (language === 'ja' ? '保存中...' : 'Saving...') : language === 'ja' ? '保存' : 'Save'}
          </button>
        </div>
      </form>
    </DashboardLayout>
  );
}
