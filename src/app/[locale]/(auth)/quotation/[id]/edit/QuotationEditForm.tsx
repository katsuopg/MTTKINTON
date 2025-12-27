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
  rawAddress?: string;
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

// Payment term1の選択肢
const PAYMENT_TERM_OPTIONS = [
  '-----',
  'Within 30days after recived invoice',
  'Within 90days after recived invoice',
  'Cash before delivery',
  '100% payment before shipment',
  '30% within 1 month upon oder confirmation',
  '40% After received P.O. and 60% within 30 days after job competion.',
  '30% non-refundable downpayment within 1 month upon oder confirmation',
  'Within 30 days after receiving the invoice after acceptance',
  'Within 30 days after recived invoice to 30 days end of month.',
  'Within 30 days',
  'Within 90 days',
  'Within 120 days',
  'Cash',
  '30% DOWNPAYMENT',
  '40% DOWNPAYMENT',
  '35 days after the end of received month of installation and test running completed',
] as const;

// Payment term2の選択肢
const PAYMENT_TERM2_OPTIONS = [
  '-----',
  '30% at start of process',
  '70% shall be paid by T/T remilance 30 days before B/L date',
  '70% shall be advance paid by T/T before ex-works',
  '60% After Installation',
  '70% After Installation',
] as const;

// Payment term3の選択肢
const PAYMENT_TERM3_OPTIONS = [
  '-----',
  '40% at after Inspected.',
] as const;

const COMPANY_ADDRESS_MARKERS = ['107/5', 'admin_n@megatech.co.th'];

function isCompanyAddress(value?: string): boolean {
  if (!value) {
    return false;
  }
  const normalized = normalizeWhitespace(value).toLowerCase();
  return COMPANY_ADDRESS_MARKERS.every((marker) => normalized.includes(marker.toLowerCase()));
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
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
  contactEmail: z.string().optional(),
  projectName: z.string().optional(),
  title: z.string().optional(),
  vendor: z.string().optional(),
  model: z.string().optional(),
  serialNo: z.string().optional(),
  machineNo: z.string().optional(),
  delivery: z.string().optional(),
  validUntil: z.string().optional(),
  paymentTerm1: z.string().optional(),
  paymentTerm2: z.string().optional(),
  paymentTerm3: z.string().optional(),
  remark1: z.string().optional(),
  remark2: z.string().optional(),
  remark3: z.string().optional(),
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
  const parsed = parseDisplayDate(value);
  if (parsed) {
    return parsed;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
}

function formatDisplayDate(value?: string | null): string {
  if (!value) {
    return '';
  }
  const normalized = parseDisplayDate(value) ?? value;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const day = date.getDate().toString().padStart(2, '0');
  const month = MONTH_LABELS[date.getMonth()];
  const year = date.getFullYear().toString();
  return `${day}-${month}-${year}`;
}

function parseDisplayDate(value?: string | null): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim().replace(/[.\-/]/g, ' ');
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1 && parts[0].length === 8) {
    const match = parts[0].match(/^(\d{2})(\d{2})(\d{4})$/);
    if (match) {
      const [, dd, mm, yyyy] = match;
      return toISODate(yyyy, mm, dd);
    }
  }
  if (parts.length >= 3) {
    const [first, second, third] = parts;
    const dd = first;
    let mm = second;
    let yyyy = third;
    if (mm.length === 3) {
      const monthIndex = MONTH_ABBREVIATIONS.findIndex((abbr) => abbr === mm.toUpperCase());
      if (monthIndex >= 0) {
        mm = (monthIndex + 1).toString().padStart(2, '0');
      }
    }
    if (yyyy.length === 2) {
      yyyy = `20${yyyy}`;
    }
    if (/^\d{1,2}$/.test(dd) && /^\d{1,2}$/.test(mm) && /^\d{4}$/.test(yyyy)) {
      return toISODate(yyyy, mm, dd);
    }
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  return undefined;
}

const MONTH_ABBREVIATIONS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
];

const MONTH_LABELS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

function toISODate(year: string, month: string, day: string): string {
  const iso = `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
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
      customerAddress: quotation.文字列__1行__3?.value ?? '',
      contactId: '',
      contactPerson: quotation.ルックアップ_1?.value ?? '',
      contactEmail: quotation.文字列__1行__1?.value ?? '',
      projectName: quotation.ドロップダウン_0?.value ?? '',
      title: quotation.文字列__1行__4?.value ?? '',
      vendor: quotation.文字列__1行__5?.value ?? '',
      model: quotation.文字列__1行__6?.value ?? '',
      serialNo: quotation.文字列__1行__7?.value ?? '',
      machineNo: quotation.文字列__1行__9?.value ?? '',
      delivery: quotation.文字列__1行__8?.value ?? '',
      validUntil: quotation.ドロップダウン_3?.value ?? '20 days',
      paymentTerm1: quotation.payment_1?.value ?? '',
      paymentTerm2: quotation.ドロップダウン_4?.value ?? '',
      paymentTerm3: quotation.ドロップダウン_5?.value ?? '',
      remark1: quotation.Text_1?.value ?? '',
      remark2: quotation.文字列__1行__11?.value ?? '',  // Kintone側でフィールド確認必要
      remark3: quotation.Text_4?.value ?? '',
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

  useEffect(() => {
    const currentId = getValues('customerId');
    if (!currentId) {
      const name = getValues('customerName');
      if (name) {
        const matched = customerOptions.find((option) => option.name === name);
        if (matched) {
          setValue('customerId', matched.id, { shouldDirty: false });
          const currentAddress = getValues('customerAddress') ?? '';
          if (
            !currentAddress ||
            (matched.rawAddress && normalizeWhitespace(currentAddress) === normalizeWhitespace(matched.rawAddress))
          ) {
            setValue('customerAddress', matched.address ?? '', { shouldDirty: false });
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerOptions]);

  useEffect(() => {
    if (!selectedCustomerId) {
      return;
    }
    const matched = customerOptions.find((option) => option.id === selectedCustomerId);
    if (!matched) {
      return;
    }
    const targetAddress = normalizeWhitespace(matched.address ?? '');
    const currentAddress = normalizeWhitespace(getValues('customerAddress') ?? '');
    const originalAddress = normalizeWhitespace(matched.rawAddress ?? '');
    if (
      targetAddress &&
      currentAddress !== targetAddress &&
      (currentAddress.length === 0 || isCompanyAddress(currentAddress) || (!!originalAddress && currentAddress === originalAddress))
    ) {
      setValue('customerAddress', matched.address ?? '', { shouldDirty: false });
    }
    if (!getValues('customerName')) {
      setValue('customerName', matched.name, { shouldDirty: false });
    }
  }, [selectedCustomerId, customerOptions, getValues, setValue]);

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
          <div className="rounded-md bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        {/* Internal information */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">{language === 'ja' ? '社内情報' : 'Internal Information'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Status</label>
              <Controller
                control={control}
                name="internalStatus"
                render={({ field }) => (
                  <input {...field} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Probability</label>
              <Controller
                control={control}
                name="probability"
                render={({ field }) => (
                  <input {...field} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Sales Staff</label>
              <input
                value={quotation.sales_staff?.value?.[0]?.name ?? ''}
                readOnly
                className="w-full rounded border border-slate-200 bg-slate-100 px-2 py-1 text-sm text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Sales Phone</label>
              <Controller
                control={control}
                name="salesPhone"
                render={({ field }) => (
                  <input {...field} className="w-full rounded border border-slate-300 px-2 py-1 text-sm" />
                )}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Approver</label>
              <input
                value={quotation.Approver?.value?.[0]?.name ?? ''}
                readOnly
                className="w-full rounded border border-slate-200 bg-slate-100 px-2 py-1 text-sm text-slate-600"
              />
            </div>
          </div>
        </section>

        {/* Quotation layout */}
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm">
          <div className="px-8 py-6 border-b border-slate-300 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-wide">MEGA TECH (THAI) CO., LTD.</h1>
                <p className="text-sm text-slate-600 leading-4 mt-2">
                  107/5 หมู่ 8 ซ.เทศบาลสำโรงใต้ 3 ถ.ปู่เจ้า สมิงพราย ต.สำโรงกลาง อ.พระประแดง จ.สมุทรปราการ 10130<br />
                  Tel: +66 (2) 380-0367-68 Fax:+66 (2) 757-6056 E-mail: admin_n@megatech.co.th
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-semibold tracking-widest">QUOTATION</p>
              </div>
            </div>

            <div className="border border-slate-400">
              <table className="w-full table-fixed text-sm">
                <tbody>
                  <tr className="border-b border-slate-400">
                    <td rowSpan={4} className="w-24 bg-slate-100 border-r border-slate-400 text-center font-semibold uppercase tracking-[0.3em] text-slate-700">
                      TO
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <label htmlFor="customer-select" className="sr-only">
                        {language === 'ja' ? '顧客' : language === 'th' ? 'ลูกค้า' : 'Customer'}
                      </label>
                      <Controller
                        control={control}
                        name="customerId"
                        render={({ field }) => (
                          <select
                            id="customer-select"
                            aria-label={language === 'ja' ? '顧客' : language === 'th' ? 'ลูกค้า' : 'Customer'}
                            {...field}
                            onChange={(event) => handleCustomerSelect(event.target.value, field.onChange)}
                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                      <Controller
                        control={control}
                        name="customerName"
                        render={({ field }) => <input {...field} type="hidden" />}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-400">
                    <td className="whitespace-nowrap px-3 py-2">
                      <Controller
                        control={control}
                        name="customerAddress"
                        render={({ field }) => (
                          <textarea
                            {...field}
                            rows={2}
                            readOnly
                            placeholder={
                              language === 'ja' ? '住所' : language === 'th' ? 'ที่อยู่' : 'Address'
                            }
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-800 focus:outline-none focus:ring-0 resize-none"
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-400">
                    <td className="whitespace-nowrap px-3 py-2">
                      <label htmlFor="contact-select" className="sr-only">
                        {language === 'ja' ? '担当者' : language === 'th' ? 'ผู้ติดต่อ' : 'Contact'}
                      </label>
                      <Controller
                        control={control}
                        name="contactId"
                        render={({ field }) => (
                          <select
                            id="contact-select"
                            aria-label={language === 'ja' ? '担当者' : language === 'th' ? 'ผู้ติดต่อ' : 'Contact'}
                            {...field}
                            onChange={(event) => handleContactSelect(event.target.value, field.onChange)}
                            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                      {(isStaffLoading || staffFetchError) && (
                        <div className="pt-2">
                          {isStaffLoading && (
                            <p className="text-sm text-indigo-600">
                              {language === 'ja'
                                ? '担当者情報を読み込み中...'
                                : language === 'th'
                                ? 'กำลังโหลดข้อมูลผู้ติดต่อ...'
                                : 'Loading contacts...'}
                            </p>
                          )}
                          {staffFetchError && <p className="text-sm text-red-500">{staffFetchError}</p>}
                        </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap px-3 py-2">
                      <Controller
                        control={control}
                        name="contactEmail"
                        render={({ field }) => (
                          <input
                            {...field}
                            type="email"
                            readOnly
                            placeholder="E-mail"
                            className="w-full border border-slate-300 rounded px-3 py-2 text-sm bg-slate-100 text-slate-800 focus:outline-none focus:ring-0"
                          />
                        )}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            {/* Machine info section */}
            <div className="mt-6">
              <div className="flex gap-4">
                {/* Machine selection */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-center gap-3">
                    <select
                      value={selectedMachineId}
                      onChange={(event) => setSelectedMachineId(event.target.value)}
                      className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                          {[
                            machine.model || '-',
                            machine.serialNo || '-', 
                            machine.machineNo || '-'
                          ].join(' / ')}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleApplyMachine}
                      className="inline-flex items-center rounded border border-indigo-500 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 disabled:opacity-40"
                      disabled={!selectedMachineId}
                    >
                      {language === 'ja' ? '選択' : language === 'th' ? 'เลือก' : 'Select'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setValue('vendor', '');
                        setValue('model', '');
                        setValue('serialNo', '');
                        setValue('machineNo', '');
                        setSelectedMachineId('');
                      }}
                      className="inline-flex items-center rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                    >
                      {language === 'ja' ? 'クリア' : language === 'th' ? 'ลบ' : 'Clear'}
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center rounded border border-emerald-500 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50"
                      disabled
                    >
                      {language === 'ja' ? '登録' : language === 'th' ? 'ลงทะเบียน' : 'Register'}
                    </button>
                  </div>
                  {machineFetchError && <p className="mt-2 text-sm text-red-500">{machineFetchError}</p>}
                </div>

                {/* QT number assignment */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm p-4">
                  <div className="flex items-center h-[42px]">
                    <button
                      type="button"
                      className="inline-flex items-center rounded bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                      {language === 'ja' ? '見積番号を付番' : language === 'th' ? 'ออกเลขใบเสนอราคา' : 'Assign QT Number'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project and details table */}
              <div className="px-8 py-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full table-fixed border border-slate-400 text-sm">
                    <tbody>
                      <tr className="border-b border-slate-400">
                    <th
                      rowSpan={2}
                      colSpan={2}
                      className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 align-top"
                    >
                      PROJECT
                    </th>
                    <td colSpan={10} className="border-r border-slate-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="projectName"
                        render={({ field }) => (
                          <select
                            {...field}
                            value={field.value && field.value !== '' ? field.value : '-----'}
                            onChange={(event) => field.onChange(event.target.value === '-----' ? '' : event.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {PROJECT_OPTIONS.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                            {field.value &&
                              field.value !== '' &&
                              !PROJECT_OPTIONS.includes(field.value) && (
                                <option value={field.value}>{field.value}</option>
                              )}
                          </select>
                        )}
                      />
                    </td>
                    <th colSpan={3} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700">
                      QT DATE
                    </th>
                    <td colSpan={3} className="px-3 py-2">
                      <Controller
                        control={control}
                        name="qtDate"
                        render={({ field }) => (
                          <div className="relative">
                            <input
                              {...field}
                              type="date"
                              className="w-full border border-slate-300 rounded px-2 py-1 text-sm text-transparent caret-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <div
                              className={`pointer-events-none absolute inset-0 flex items-center px-2 text-sm ${
                                field.value ? 'text-slate-900' : 'text-slate-400'
                              }`}
                            >
                              {field.value ? formatDisplayDate(field.value) : 'DD-MMM-YYYY'}
                            </div>
                          </div>
                        )}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-400">
                    <td colSpan={10} className="border-r border-slate-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="title"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder={language === 'ja' ? 'タイトル' : language === 'th' ? 'หัวข้อ' : 'Title'}
                          />
                        )}
                      />
                    </td>
                    <th colSpan={3} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700">
                      QT NO.
                    </th>
                    <td colSpan={3} className="px-3 py-2">
                      <Controller
                        control={control}
                        name="qtNo"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder="MTTQT..."
                          />
                        )}
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-slate-400">
                    <th colSpan={2} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700">
                      VENDER
                    </th>
                    <td colSpan={4} className="border-r border-slate-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="vendor"
                        render={({ field }) => (
                          <input
                            {...field}
                            readOnly
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-slate-100 text-slate-800 focus:outline-none focus:ring-0"
                            placeholder={language === 'ja' ? '仕入先' : language === 'th' ? 'ผู้ผลิต/ซัพพลายเออร์' : 'Vendor'}
                          />
                        )}
                      />
                    </td>
                    <th colSpan={2} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700">
                      MODEL
                    </th>
                    <td colSpan={4} className="border-r border-slate-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="model"
                        render={({ field }) => (
                          <input
                            {...field}
                            readOnly
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-slate-100 text-slate-800 focus:outline-none focus:ring-0"
                            placeholder="Model"
                          />
                        )}
                      />
                    </td>
                    <th colSpan={3} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700">
                      VALID UNTIL
                    </th>
                    <td colSpan={3} className="px-3 py-2">
                      <Controller
                        control={control}
                        name="validUntil"
                        render={({ field }) => (
                          <select
                            {...field}
                            value={field.value && field.value !== '' ? field.value : '20 days'}
                            onChange={(event) => field.onChange(event.target.value === '-----' ? '' : event.target.value)}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                  <tr>
                    <th colSpan={2} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700">
                      SERIAL NO.
                    </th>
                    <td colSpan={4} className="border-r border-slate-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="serialNo"
                        render={({ field }) => (
                          <input
                            {...field}
                            readOnly
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-slate-100 text-slate-800 focus:outline-none focus:ring-0"
                            placeholder="Serial No."
                          />
                        )}
                      />
                    </td>
                    <th colSpan={2} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700">
                      M/C NO.
                    </th>
                    <td colSpan={4} className="border-r border-slate-400 px-3 py-2">
                      <Controller
                        control={control}
                        name="machineNo"
                        render={({ field }) => (
                          <input
                            {...field}
                            readOnly
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm bg-slate-100 text-slate-800 focus:outline-none focus:ring-0"
                            placeholder="Machine No."
                          />
                        )}
                      />
                    </td>
                    <th colSpan={3} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700">
                      DELIVERY DATE
                    </th>
                    <td colSpan={3} className="px-3 py-2">
                      <Controller
                        control={control}
                        name="delivery"
                        render={({ field }) => (
                          <input
                            {...field}
                            className="w-full border border-slate-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            placeholder={language === 'ja' ? '納期' : language === 'th' ? 'กำหนดส่ง' : 'Delivery date'}
                          />
                        )}
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          {/* Line items table */}
          <div className="py-6">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border border-slate-400 text-sm">
                <colgroup>
                  <col className="w-[2.78%]" />
                  <col className="w-[5.56%]" />
                  <col className="w-[13.89%]" />
                  <col className="w-[33.33%]" />
                  <col className="w-[8.33%]" />
                  <col className="w-[11.11%]" />
                  <col className="w-[5.56%]" />
                  <col className="w-[11.11%]" />
                  <col className="w-[5.56%]" />
                  <col className="w-[5.56%]" />
                  <col className="w-[11.11%]" />
                </colgroup>
                <thead className="bg-slate-100 text-slate-600 uppercase">
                  <tr>
                    <th className="border border-slate-400 px-1 py-2 text-center">&nbsp;</th>
                    <th className="border border-slate-400 px-1 py-2 text-center">Item</th>
                    <th className="border border-slate-400 px-2 py-2 text-center">Category</th>
                    <th className="border border-slate-400 px-2 py-2 text-center">Description</th>
                    <th className="border border-slate-400 px-2 py-2 text-center">Type</th>
                    <th className="border border-slate-400 px-2 py-2 text-center">Cost</th>
                    <th className="border border-slate-400 px-1 py-2 text-center">Rate</th>
                    <th className="border border-slate-400 px-2 py-2 text-center">Unit Price</th>
                    <th className="border border-slate-400 px-1 py-2 text-center">Qty</th>
                    <th className="border border-slate-400 px-1 py-2 text-center">Unit</th>
                    <th className="border border-slate-400 px-2 py-2 text-center">Amount</th>
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
                        <td className="border border-slate-300 px-1 py-1">
                          <div className="flex flex-col items-center justify-center space-y-1">
                            <button
                              type="button"
                              onClick={() => insert(index + 1, createEmptyLineItem())}
                              className="h-5 w-5 flex items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-indigo-400 hover:text-indigo-500 text-xs"
                              aria-label={language === 'ja' ? '行を追加' : language === 'th' ? 'เพิ่มแถว' : 'Add row'}
                            >
                              +
                            </button>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="h-5 w-5 flex items-center justify-center rounded-full border border-slate-300 text-slate-600 hover:border-red-400 hover:text-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
                              aria-label={language === 'ja' ? '行を削除' : language === 'th' ? 'ลบแถว' : 'Remove row'}
                              disabled={fields.length === 1}
                            >
                              -
                            </button>
                          </div>
                        </td>
                        <td className="border border-slate-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.Text`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-slate-300 rounded px-1 py-1 text-sm text-center" />
                            )}
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.category`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-slate-300 rounded px-1 py-1 text-sm" />
                            )}
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.Desc`}
                            render={({ field }) => (
                              <textarea {...field} rows={2} className="w-full border border-slate-300 rounded px-1 py-1 text-sm resize-none" />
                            )}
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2">
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
                        <td className="border border-slate-300 px-2 py-2 text-right">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.Cost`}
                            render={({ field }) => (
                              <input
                                {...field}
                                value={field.value ? Number(field.value).toLocaleString() : ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/,/g, '');
                                  field.onChange(value);
                                }}
                                className="w-full border border-slate-300 rounded px-1 py-1 text-sm text-right"
                              />
                            )}
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-right">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.Rate`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-slate-300 rounded px-1 py-1 text-sm text-right" />
                            )}
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-right font-semibold text-slate-900">
                          {formatCurrency(unitPrice)}
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-right">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.QTY`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-slate-300 rounded px-1 py-1 text-sm text-right" />
                            )}
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2">
                          <Controller
                            control={control}
                            name={`lineItems.${index}.unit`}
                            render={({ field }) => (
                              <input {...field} className="w-full border border-slate-300 rounded px-1 py-1 text-sm" />
                            )}
                          />
                        </td>
                        <td className="border border-slate-300 px-2 py-2 text-right font-semibold text-slate-900">
                          {formatCurrency(amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Totals */}
        <div className="px-8 pb-6">
            <div className="grid grid-cols-12 text-sm border border-slate-400">
              <div className="col-span-8 border-r border-slate-400 px-3 py-4 text-slate-300 italic">&nbsp;</div>
              <div className="col-span-4 divide-y divide-slate-400">
                <div className="flex">
                  <div className="w-1/2 bg-slate-100 px-3 py-2 font-semibold">SUB TOTAL</div>
                  <div className="w-1/2 px-3 py-2 text-right font-semibold">{formatCurrency(computedSubTotal)}</div>
                </div>
                <div className="flex">
                  <div className="w-1/2 bg-slate-100 px-3 py-2 font-semibold flex items-center justify-between">
                    <span>DISCOUNT</span>
                    {computedSubTotal > 0 && discountValue && (() => {
                      const discountRate = (parseFloat(discountValue) / computedSubTotal) * 100;
                      return (
                        <span className={`text-xs font-normal ${discountRate <= 3 ? 'text-indigo-600' : 'text-red-600'}`}>
                          ({discountRate.toFixed(2)}%)
                        </span>
                      );
                    })()}
                  </div>
                  <div className="w-1/2 px-3 py-2 text-right">
                    <Controller
                      control={control}
                      name="discount"
                      render={({ field }) => (
                        <input
                          {...field}
                          value={field.value ? Number(field.value).toLocaleString() : ''}
                          onChange={(e) => {
                            const value = e.target.value.replace(/,/g, '');
                            field.onChange(value);
                          }}
                          className="w-full border border-slate-300 rounded px-2 py-1 text-right text-sm"
                        />
                      )}
                    />
                  </div>
                </div>
                <div className="flex">
                  <div className="w-1/2 bg-slate-100 px-3 py-2 font-semibold">GRAND TOTAL</div>
                  <div className="w-1/2 px-3 py-2 text-right font-bold text-indigo-600">{formatCurrency(computedGrandTotal)}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 border border-slate-400 text-sm mt-4">
              <div className="col-span-3 bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase">Payment Term</div>
              <div className="col-span-9 px-3 py-2">
                <div className="space-y-2">
                  <Controller
                    control={control}
                    name="paymentTerm1"
                    render={({ field }) => (
                      <select {...field} className="w-full border border-slate-300 rounded px-2 py-1 text-sm">
                        {PAYMENT_TERM_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <Controller
                    control={control}
                    name="paymentTerm2"
                    render={({ field }) => (
                      <select {...field} className="w-full border border-slate-300 rounded px-2 py-1 text-sm">
                        {PAYMENT_TERM2_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                  <Controller
                    control={control}
                    name="paymentTerm3"
                    render={({ field }) => (
                      <select {...field} className="w-full border border-slate-300 rounded px-2 py-1 text-sm">
                        {PAYMENT_TERM3_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 border border-t-0 border-slate-400 text-sm">
              <div className="col-span-3 bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase">Remark</div>
              <div className="col-span-9 px-3 py-2">
                <div className="space-y-2">
                  <Controller
                    control={control}
                    name="remark1"
                    render={({ field }) => (
                      <input {...field} type="text" className="w-full border border-slate-300 rounded px-2 py-1 text-sm" placeholder="Remark1" />
                    )}
                  />
                  <Controller
                    control={control}
                    name="remark2"
                    render={({ field }) => (
                      <input {...field} type="text" className="w-full border border-slate-300 rounded px-2 py-1 text-sm" placeholder="Remark2" />
                    )}
                  />
                  <Controller
                    control={control}
                    name="remark3"
                    render={({ field }) => (
                      <input {...field} type="text" className="w-full border border-slate-300 rounded px-2 py-1 text-sm" placeholder="Remark3" />
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 border border-slate-400 text-center text-sm mt-6">
              <div className="px-3 py-3 border-r border-slate-400">
                <div className="font-semibold uppercase mb-3 text-sm">SALES STAFF</div>
                <div className="mb-3 text-sm text-slate-700 font-bold">
                  {approvalInfo.sales}
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium">DATE:</span>
                  <span className="ml-2 text-sm text-slate-700">{formatDisplayDate(defaultValues.qtDate)}</span>
                </div>
              </div>
              <div className="px-3 py-3 border-r border-slate-400">
                <div className="font-semibold uppercase mb-3 text-sm">APPROVED BY</div>
                <div className="mb-3 text-sm text-slate-700 font-bold">
                  {approvalInfo.approver}
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium">DATE:</span>
                  <span className="ml-2 text-sm text-slate-700">{formatDisplayDate(defaultValues.qtDate)}</span>
                </div>
              </div>
              <div className="px-3 py-3">
                <div className="font-semibold uppercase mb-3 text-sm">CUSTOMER CONFIRM</div>
                <div className="mb-3 text-sm text-slate-700">&nbsp;</div>
                <div className="text-center">
                  <span className="text-sm font-medium">DATE:</span>
                  <span className="ml-2 text-sm text-slate-700 invisible">03-Oct-2025</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 text-sm border border-slate-300 rounded-md text-slate-700 bg-white hover:bg-slate-50"
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
