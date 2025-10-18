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

interface MachineOption {
  id: string;
  name: string;
  vendor?: string;
  model?: string;
  serialNo?: string;
  machineNo?: string;
}

const PROJECT_OPTIONS = [
  '-----',
  'Machine repair',
  'Parts sale',
  'Used machine sale',
  'New machine sale',
  'Used machine purchase',
  'Inspection',
  'Equipment sale',
  'Installation',
  'Remodeling',
  'Oder made machine',
  'Other',
] as const;

const VALID_UNTIL_OPTIONS = ['-----', '20 days', '30 days', '40 days', '60 days', '90 days'] as const;

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
  contactEmail: z.string().optional(),
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

function toDateInputValue(value?: string): string {
  if (!value) {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
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
  const [machineOptions, setMachineOptions] = useState<MachineOption[]>([]);
  const [isMachineLoading, setIsMachineLoading] = useState(false);
  const [machineFetchError, setMachineFetchError] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');

  const defaultValues = useMemo<QuotationFormValues>(() => {
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
      qtDate: toDateInputValue(quotation.日付?.value),
      qtNo: quotation.qtno2?.value ?? '',
      customerId,
      customerName: quotation.name?.value ?? '',
      customerAddress: quotation.Text_3?.value ?? '',
      contactId: '',
      contactPerson: quotation.ルックアップ_1?.value ?? '',
      contactEmail: quotation.Text_2?.value ?? '',
      projectName: quotation.ドロップダウン_0?.value ?? '',
      title: quotation.文字列__1行__4?.value ?? '',
      vendor: quotation.文字列__1行__5?.value ?? '',
      model: quotation.文字列__1行__6?.value ?? '',
      serialNo: quotation.文字列__1行__7?.value ?? '',
      machineNo: quotation.文字列__1行__9?.value ?? '',
      delivery: quotation.文字列__1行__8?.value ?? '',
      validUntil: quotation.ドロップダウン_3?.value ?? '20 days',
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

  const approvalInfo = {
    sales: quotation.sales_staff?.value?.[0]?.name ?? '',
    approver: quotation.Approver?.value?.[0]?.name ?? '',
  };

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
  const displayCustomerName = watch('customerName');
  const displayContactName = watch('contactPerson');

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
      setValue('contactEmail', '', { shouldDirty: true });
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
          setValue('contactEmail', matched.email ?? '', { shouldDirty: false });
        } else {
          setValue('contactId', '', { shouldDirty: false });
          if (currentContactName) {
            setValue('contactPerson', '', { shouldDirty: true });
          }
          setValue('contactEmail', '', { shouldDirty: false });
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
    setValue('contactEmail', '', { shouldDirty: true });
    setMachineOptions([]);
    setSelectedMachineId('');
  };

  const handleContactSelect = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const matched = staffOptions.find((option) => option.id === value);
    if (matched) {
      setValue('contactPerson', matched.name, { shouldDirty: true });
      setValue('contactEmail', matched.email ?? '', { shouldDirty: true });
    } else {
      setValue('contactPerson', '', { shouldDirty: true });
      setValue('contactEmail', '', { shouldDirty: true });
    }
  };

  const handleApplyMachine = () => {
    if (!selectedMachineId) {
      return;
    }
    const machine = machineOptions.find((option) => option.id === selectedMachineId);
    if (!machine) {
      return;
    }
    setValue('vendor', machine.vendor ?? '', { shouldDirty: true });
    setValue('model', machine.model ?? '', { shouldDirty: true });
    setValue('serialNo', machine.serialNo ?? '', { shouldDirty: true });
    setValue('machineNo', machine.machineNo ?? '', { shouldDirty: true });
  };

  useEffect(() => {
    if (!selectedCustomerId) {
      setMachineOptions([]);
      setMachineFetchError(null);
      setSelectedMachineId('');
      return;
    }

    const controller = new AbortController();
    setIsMachineLoading(true);
    setMachineFetchError(null);
    setSelectedMachineId('');

    fetch(`/api/machines/by-customer/${encodeURIComponent(selectedCustomerId)}`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch machines');
        }
        return response.json() as Promise<MachineOption[]>;
      })
      .then((data) => {
        setMachineOptions(data);
      })
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.error('Failed to fetch machine options', error);
          setMachineFetchError('機械情報の取得に失敗しました');
        }
      })
      .finally(() => {
        setIsMachineLoading(false);
      });

    return () => controller.abort();
  }, [selectedCustomerId]);

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

            <div className="border border-gray-400">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <td rowSpan={4} className="w-24 bg-gray-100 border-r border-gray-400 text-center align-middle font-semibold uppercase tracking-[0.3em] text-gray-700">
                      TO
                    </td>
                    <th className="w-32 bg-gray-50 border-r border-gray-400 px-3 py-3 text-left font-semibold text-gray-600">
                      {language === 'ja' ? '顧客' : language === 'th' ? 'ลูกค้า' : 'Customer'}
                    </th>
                    <td className="px-3 py-3">
                      <Controller
                        control={control}
                        name="customerId"
                        render={({ field }) => (
                          <select
                            {...field}
                            onChange={(event) => handleCustomerSelect(event.target.value, field.onChange)}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="">
                              {language === 'ja'
                                ? '顧客を選択してください'
                                : language === 'th'
                                ? 'เลือกชื่อลูกค้า'
                                : 'Select a customer'}
                            </option>
                            {customerOptions.map((option) => (
                              <option key={option.id} value={option.id}>
                                {option.name}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                      <div className="mt-2 text-base font-semibold text-gray-900">
                        {displayCustomerName || '\u00a0'}
                      </div>
                      <Controller
                        control={control}
                        name="customerName"
                        render={({ field }) => <input {...field} type="hidden" />}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400 align-top">
                    <th className="bg-gray-50 border-r border-gray-400 px-3 py-3 text-left font-semibold text-gray-600">
                      {language === 'ja' ? '住所' : language === 'th' ? 'ที่อยู่' : 'Address'}
                    </th>
                    <td className="px-3 py-3">
                      <Controller
                        control={control}
                        name="customerAddress"
                        render={({ field }) => (
                          <textarea
                            {...field}
                            rows={3}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm leading-5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <th className="bg-gray-50 border-r border-gray-400 px-3 py-3 text-left font-semibold text-gray-600">
                      {language === 'ja' ? '担当者' : language === 'th' ? 'ผู้ติดต่อ' : 'Contact'}
                    </th>
                    <td className="px-3 py-3">
                      <Controller
                        control={control}
                        name="contactId"
                        render={({ field }) => (
                          <select
                            {...field}
                            onChange={(event) => handleContactSelect(event.target.value, field.onChange)}
                            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                      <div className="mt-2 text-base font-semibold text-gray-900">
                        {displayContactName || '\u00a0'}
                      </div>
                      <Controller
                        control={control}
                        name="contactPerson"
                        render={({ field }) => <input {...field} type="hidden" />}
                      />
                      {(isStaffLoading || staffFetchError) && (
                        <div className="pt-2">
                          {isStaffLoading && (
                            <p className="text-xs text-indigo-600">
                              {language === 'ja'
                                ? '担当者情報を読み込み中...'
                                : language === 'th'
                                ? 'กำลังโหลดข้อมูลผู้ติดต่อ...'
                                : 'Loading contacts...'}
                            </p>
                          )}
                          {staffFetchError && <p className="text-xs text-red-500">{staffFetchError}</p>}
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-gray-50 border-r border-gray-400 px-3 py-3 text-left font-semibold text-gray-600">
                      E-mail
                    </th>
                    <td className="px-3 py-3">
                      <Controller
                        control={control}
                        name="contactEmail"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-4 border border-dashed border-gray-300 bg-gray-50 rounded px-4 py-3 grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-500">
                  {language === 'ja'
                    ? '顧客の機械情報'
                    : language === 'th'
                    ? 'ข้อมูลเครื่องจักรของลูกค้า'
                    : 'Customer machines'}
                </label>
                <select
                  value={selectedMachineId}
                  onChange={(event) => setSelectedMachineId(event.target.value)}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  disabled={!selectedCustomerId || isMachineLoading || machineOptions.length === 0}
                >
                  <option value="">
                    {selectedCustomerId
                      ? isMachineLoading
                        ? language === 'ja'
                          ? '読み込み中...'
                          : language === 'th'
                          ? 'กำลังโหลด...'
                          : 'Loading...'
                        : machineOptions.length > 0
                        ? language === 'ja'
                          ? '機械を選択してください'
                          : language === 'th'
                          ? 'เลือกเครื่องจักร'
                          : 'Select a machine'
                        : language === 'ja'
                        ? '利用可能な機械がありません'
                        : language === 'th'
                        ? 'ไม่มีข้อมูลเครื่องจักร'
                        : 'No machines available'
                      : language === 'ja'
                      ? '顧客を先に選択してください'
                      : language === 'th'
                      ? 'กรุณาเลือกลูกค้าก่อน'
                      : 'Select a customer first'}
                  </option>
                  {machineOptions.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.name || machine.model || machine.serialNo || machine.machineNo || machine.id}
                    </option>
                  ))}
                </select>
                {machineFetchError && <p className="text-xs text-red-500">{machineFetchError}</p>}
              </div>
              <div className="flex items-center lg:justify-end">
                <button
                  type="button"
                  onClick={handleApplyMachine}
                  className="inline-flex w-full items-center justify-center rounded border border-indigo-500 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40 lg:w-auto"
                  disabled={!selectedMachineId}
                >
                  {language === 'ja' ? '機械情報を転載' : language === 'th' ? 'คัดลอกข้อมูลเครื่อง' : 'Copy machine info'}
                </button>
              </div>
            </div>

            <div className="mt-4 border border-gray-400">
              <table className="w-full border-collapse text-sm">
                <tbody>
                  <tr className="border-b border-gray-400">
                    <th rowSpan={2} className="w-1/4 bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700 align-top">
                      PROJECT
                    </th>
                    <td rowSpan={2} className="w-1/4 border-r border-gray-400 px-3 py-2">
                      <div className="flex flex-col gap-2">
                        <Controller
                          control={control}
                          name="projectName"
                          render={({ field }) => (
                            <select
                              {...field}
                              value={field.value && field.value !== '' ? field.value : '-----'}
                              onChange={(event) => field.onChange(event.target.value === '-----' ? '' : event.target.value)}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                              {PROJECT_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          )}
                        />
                        <Controller
                          control={control}
                          name="title"
                          render={({ field }) => (
                            <input
                              {...field}
                              className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder={language === 'ja' ? 'タイトル' : language === 'th' ? 'หัวข้อ' : 'Title'}
                            />
                          )}
                        />
                      </div>
                    </td>
                    <th className="w-1/4 bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700">
                      QT DATE
                    </th>
                    <td className="w-1/4 px-3 py-2">
                      <Controller
                        control={control}
                        name="qtDate"
                        render={({ field }) => (
                          <input
                            {...field}
                            type="date"
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <th className="bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700">
                      QT NO.
                    </th>
                    <td className="px-3 py-2">
                      <Controller
                        control={control}
                        name="qtNo"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="MTTQT..."
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <th className="bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700">
                      VENDER
                    </th>
                    <td className="border-r border-gray-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="vendor"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder={language === 'ja' ? '仕入先' : language === 'th' ? 'ผู้ผลิต/ซัพพลายเออร์' : 'Vendor'}
                          />
                        )}
                      />
                    </td>
                    <th className="bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700">
                      VALID UNTIL
                    </th>
                    <td className="px-3 py-2">
                      <Controller
                        control={control}
                        name="validUntil"
                        render={({ field }) => (
                          <select
                            {...field}
                            value={field.value && field.value !== '' ? field.value : '20 days'}
                            onChange={(event) => field.onChange(event.target.value === '-----' ? '' : event.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {VALID_UNTIL_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-gray-400">
                    <th className="bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700">
                      MODEL
                    </th>
                    <td className="border-r border-gray-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="model"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Model"
                          />
                        )}
                      />
                    </td>
                    <th className="bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700">
                      DELIVERY DATE
                    </th>
                    <td className="px-3 py-2">
                      <Controller
                        control={control}
                        name="delivery"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder={language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Delivery term'}
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr>
                    <th className="bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700">
                      SERIAL NO.
                    </th>
                    <td className="border-r border-gray-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="serialNo"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Serial No."
                          />
                        )}
                      />
                    </td>
                    <th className="bg-gray-100 border-r border-gray-400 px-3 py-2 font-semibold uppercase tracking-wide text-gray-700">
                      M/C NO.
                    </th>
                    <td className="px-3 py-2">
                      <Controller
                        control={control}
                        name="machineNo"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="Machine No."
                          />
                        )}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          {/* Line items table */}
          <div className="px-8 py-6">
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed border border-gray-400 text-xs">
                <thead className="bg-gray-100 text-gray-600 uppercase">
                  <tr>
                    <th className="w-12 border border-gray-400 px-2 py-2 text-center">Action</th>
                    <th className="w-16 border border-gray-400 px-2 py-2">Item</th>
                    <th className="w-60 border border-gray-400 px-2 py-2 text-left">Category</th>
                    <th className="border border-gray-400 px-2 py-2 text-left">Description</th>
                    <th className="w-32 border border-gray-400 px-2 py-2">Type</th>
                    <th className="w-24 border border-gray-400 px-2 py-2 text-right">Cost</th>
                    <th className="w-20 border border-gray-400 px-2 py-2 text-right">Rate</th>
                    <th className="w-24 border border-gray-400 px-2 py-2 text-right">Unit Price</th>
                    <th className="w-20 border border-gray-400 px-2 py-2 text-right">Qty</th>
                    <th className="w-24 border border-gray-400 px-2 py-2 text-left">Unit</th>
                    <th className="w-28 border border-gray-400 px-2 py-2 text-right">Amount</th>
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
              <div className="px-3 py-4 border-r border-gray-400">
                <div className="font-semibold uppercase mb-6">SALES STAFF</div>
                <div className="h-10 flex items-center justify-center text-sm text-gray-600">
                  {approvalInfo.sales}
                </div>
                <div className="mt-4 text-left">
                  <span className="text-[10px] font-medium">DATE:</span>
                  <span className="ml-2 text-[11px] text-gray-700">{defaultValues.qtDate}</span>
                </div>
              </div>
              <div className="px-3 py-4 border-r border-gray-400">
                <div className="font-semibold uppercase mb-6">APPROVED BY</div>
                <div className="h-10 flex items-center justify-center text-sm text-gray-600">
                  {approvalInfo.approver}
                </div>
                <div className="mt-4 text-left">
                  <span className="text-[10px] font-medium">DATE:</span>
                  <span className="ml-2 text-[11px] text-gray-700">{defaultValues.qtDate}</span>
                </div>
              </div>
              <div className="px-3 py-4">
                <div className="font-semibold uppercase mb-6">CUSTOMER CONFIRM</div>
                <div className="h-10 flex items-center justify-center text-sm text-gray-600">&nbsp;</div>
                <div className="mt-4 text-left">
                  <span className="text-[10px] font-medium">DATE:</span>
                  <span className="ml-2 text-[11px] text-gray-700">{defaultValues.qtDate}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        </section>

<div className="flex justify-end gap-3">
  ... snippet ...
</div>
</form>
</DashboardLayout>
