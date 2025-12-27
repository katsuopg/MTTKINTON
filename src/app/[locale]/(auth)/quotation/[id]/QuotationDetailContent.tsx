'use client';

import { QuotationRecord } from '@/types/kintone';
import DashboardLayout from '@/components/layout/DashboardLayout';
import Link from 'next/link';
import { type Language } from '@/lib/kintone/field-mappings';

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

interface QuotationDetailContentProps {
  quotation: QuotationRecord;
  locale: string;
  userEmail: string;
}

export default function QuotationDetailContent({ quotation, locale, userEmail }: QuotationDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const pageTitle = language === 'ja' ? '見積もり詳細' : language === 'th' ? 'รายละเอียดใบเสนอราคา' : 'Quotation Details';

  // 金額フォーマット
  const formatCurrency = (value: string | number | undefined): string => {
    if (value === undefined || value === null || value === '') {
      return '0.00';
    }
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) {
      return '0.00';
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // 日付フォーマット関数
  const formatDisplayDate = (dateString: string | undefined) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = date.getDate().toString().padStart(2, '0');
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
  };

  // 顧客情報の取得
  const customerName = quotation.name?.value || '';
  const customerAddress = quotation.文字列__1行__3?.value || '';
  const personInCharge = quotation.ルックアップ_1?.value || '';
  const projectName = quotation.ドロップダウン_0?.value || '';
  const customerEmail = quotation.文字列__1行__1?.value || '';

  // 金額計算
  const subtotal = parseFloat(quotation.Sub_total?.value || '0');
  const discount = parseFloat(quotation.Discount?.value || '0');
  const grandTotal = subtotal - discount;
  const discountRate = subtotal > 0 && discount > 0 ? (discount / subtotal) * 100 : 0;

  // Line itemsの構築
  const lineItems = quotation['見積明細']?.value || [];

  // 営業担当者とApproverの情報
  const salesStaff = typeof quotation.sales_staff?.value === 'string' 
    ? quotation.sales_staff.value 
    : quotation.sales_staff?.value?.[0]?.name || '';
  const approvedBy = quotation.Approver?.value?.[0]?.name || '';

  // 見積もり番号の分割
  const qtNo = quotation.qtno2?.value || '';
  const qtNoParts = qtNo.split('-');
  const qtNoPrefix = qtNoParts[0] || '';
  const qtNoMain = qtNoParts.slice(1).join('-') || '';

  return (
    <DashboardLayout locale={locale} userEmail={userEmail} title={pageTitle}>
      <form className="space-y-8 p-16">
        {/* Internal information */}
        <section className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <h2 className="text-sm font-semibold text-slate-600 mb-3">{language === 'ja' ? '社内情報' : 'Internal Information'}</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Status</label>
              <div className="text-sm">{quotation.ドロップダウン?.value || ''}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Probability</label>
              <div className="text-sm">{quotation.Drop_down?.value || ''}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Sales Staff</label>
              <div className="text-sm">{salesStaff}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Sales Phone</label>
              <div className="text-sm">&nbsp;</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-500 mb-1">Approver</label>
              <div className="text-sm">{quotation.Approver?.value?.[0]?.name ?? ''}</div>
            </div>
          </div>
        </section>

        {/* Quotation layout */}
        <section className="bg-white border border-slate-200 rounded-lg shadow-sm p-20">
          <div className="pb-6 space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-wide">MEGA TECH (THAI) CO., LTD.</h1>
                <p className="text-sm text-slate-600 mt-2">
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
                  <tr>
                    <td rowSpan={customerAddress ? 4 : 3} className="w-24 bg-slate-100 border-r border-slate-400 text-center font-semibold uppercase tracking-[0.3em] text-slate-700">
                      TO
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      {customerName}
                    </td>
                  </tr>
                  {customerAddress && (
                    <tr>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="whitespace-pre-wrap">{customerAddress}</div>
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className="whitespace-nowrap px-3 py-2">
                      ATTN: {personInCharge}
                    </td>
                  </tr>
                  <tr>
                    <td className="whitespace-nowrap px-3 py-2">
                      {customerEmail ? (
                        <>E-mail: {customerEmail}</>
                      ) : (
                        <span className="text-slate-400">E-mail: -</span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>

          {/* Project and details table */}
          <div className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border border-slate-400 text-sm">
                <tbody>
                  <tr className="border-b border-slate-400">
                    <th
                      rowSpan={2}
                      colSpan={2}
                      className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 align-top text-left pl-6"
                    >
                      PROJECT
                    </th>
                    <td colSpan={10} className="border-r border-slate-400 px-3 py-2">
                      {projectName}
                    </td>
                    <th colSpan={3} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 text-left pl-6">
                      QT DATE
                    </th>
                    <td colSpan={3} className="px-3 py-2">
                      {formatDisplayDate(quotation.日付?.value)}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-400">
                    <td colSpan={10} className="border-r border-slate-400 px-3 py-2">
                      {quotation.文字列__1行__4?.value || ''}
                    </td>
                    <th colSpan={3} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 text-left pl-6">
                      QT NO.
                    </th>
                    <td colSpan={3} className="px-3 py-2">
                      {quotation.qtno2?.value || ''}
                    </td>
                  </tr>
                  <tr className="border-b border-slate-400">
                    <th colSpan={2} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 text-left pl-6">
                      VENDER
                    </th>
                    <td colSpan={4} className="border-r border-slate-400 px-3 py-2">
                      {quotation.文字列__1行__5?.value || ''}
                    </td>
                    <th colSpan={2} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 text-left pl-6">
                      MODEL
                    </th>
                    <td colSpan={4} className="border-r border-slate-400 px-3 py-2">
                      {quotation.文字列__1行__9?.value || ''}
                    </td>
                    <th colSpan={3} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 text-left pl-6">
                      VALID UNTIL
                    </th>
                    <td colSpan={3} className="px-3 py-2">
                      {quotation.ドロップダウン_3?.value || ''}
                    </td>
                  </tr>
                  <tr>
                    <th colSpan={2} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 text-left pl-6">
                      SERIAL NO.
                    </th>
                    <td colSpan={4} className="border-r border-slate-400 px-3 py-2">
                      {quotation.文字列__1行__7?.value || ''}
                    </td>
                    <th colSpan={2} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 text-left pl-6">
                      M/C NO.
                    </th>
                    <td colSpan={4} className="border-r border-slate-400 px-3 py-2">
                      {quotation.文字列__1行__10?.value || ''}
                    </td>
                    <th colSpan={3} className="bg-slate-100 border-r border-slate-400 px-3 py-2 font-semibold uppercase tracking-wide text-slate-700 text-left pl-6">
                      DELIVERY DATE
                    </th>
                    <td colSpan={3} className="px-3 py-2">
                      {quotation.文字列__1行__8?.value || ''}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Line items table */}
          <div className="pt-6">
            <div className="overflow-x-auto">
              <table className="w-full table-fixed border border-slate-300 text-sm">
                <colgroup>
                  <col className="w-[5.56%]" />
                  <col className="w-[55.56%]" />
                  <col className="w-[8.33%]" />
                  <col className="w-[16.67%]" />
                  <col className="w-[16.67%]" />
                </colgroup>
                <thead className="bg-slate-100 text-slate-600 uppercase">
                  <tr>
                    <th className="border border-slate-300 px-1 py-2 text-center">Item</th>
                    <th className="border border-slate-300 px-2 py-2 text-center">Description</th>
                    <th className="border border-slate-300 px-1 py-2 text-center">Qty</th>
                    <th className="border border-slate-300 px-2 py-2 text-center">Unit Price</th>
                    <th className="border border-slate-300 px-2 py-2 text-center">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lineItems.map((item, index) => {
                    const cost = parseFloat(item.value.Cost?.value || '0') || 0;
                    const rate = parseFloat(item.value.Rate?.value || '0') || 0;
                    const qty = parseFloat(item.value.QTY?.value || '0') || 0;
                    const unitPrice = rate ? cost * rate : cost;
                    const amount = unitPrice * qty;

                    const category = item.value['ルックアップ']?.value || '';
                    const description = item.value.Desc?.value || '';
                    const combinedDescription = category && description ? `${category} : ${description}` : (category || description);
                    const qtyValue = item.value.QTY?.value || '';
                    const unitValue = item.value['ドロップダウン_2']?.value || '';
                    const qtyDisplay = qtyValue && unitValue ? `${qtyValue} ${unitValue}` : qtyValue;

                    return (
                    <tr key={item.id} className="align-top">
                      <td className="border border-slate-300 px-1 py-2">
                        <div className="text-center text-sm">{item.value.Text?.value || ''}</div>
                      </td>
                      <td className="border border-slate-300 px-2 py-2">
                        <div className="text-sm whitespace-pre-wrap">{combinedDescription}</div>
                      </td>
                      <td className="border border-slate-300 px-1 py-2 text-center text-sm">
                        {qtyDisplay}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-right font-semibold text-slate-900 text-sm">
                        {formatCurrency(unitPrice)}
                      </td>
                      <td className="border border-slate-300 px-2 py-2 text-right font-semibold text-slate-900 text-sm">
                        {formatCurrency(amount)}
                      </td>
                    </tr>
                    );
                  })}
                  {/* 10行に満たない場合は空行を追加 */}
                  {Array.from({ length: Math.max(0, 10 - lineItems.length) }).map((_, index) => (
                    <tr key={`empty-${index}`} className="h-10">
                      <td className="border border-slate-300 px-1 py-2">&nbsp;</td>
                      <td className="border border-slate-300 px-2 py-2">&nbsp;</td>
                      <td className="border border-slate-300 px-1 py-2">&nbsp;</td>
                      <td className="border border-slate-300 px-2 py-2">&nbsp;</td>
                      <td className="border border-slate-300 px-2 py-2">&nbsp;</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div>
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[5.56%]" />
                <col className="w-[55.56%]" />
                <col className="w-[8.33%]" />
                <col className="w-[16.67%]" />
                <col className="w-[16.67%]" />
              </colgroup>
              <tbody>
                <tr>
                  <td colSpan={3}>&nbsp;</td>
                  <td className="border border-slate-300 bg-slate-100 px-3 py-2 font-semibold">SUB TOTAL</td>
                  <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{formatCurrency(subtotal)}</td>
                </tr>
                <tr>
                  <td colSpan={3}>&nbsp;</td>
                  <td className="border-l border-r border-b border-slate-300 bg-slate-100 px-3 py-2 font-semibold">
                    <div className="flex items-center justify-between">
                      <span>DISCOUNT</span>
                      {discountRate > 0 && (
                        <span className={`text-xs font-normal ${discountRate <= 3 ? 'text-indigo-600' : 'text-red-600'}`}>
                          ({discountRate.toFixed(2)}%)
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="border-r border-b border-slate-300 px-3 py-2 text-right">{formatCurrency(discount)}</td>
                </tr>
                <tr>
                  <td colSpan={3}>&nbsp;</td>
                  <td className="border-l border-r border-b border-slate-300 bg-slate-100 px-3 py-2 font-semibold">GRAND TOTAL</td>
                  <td className="border-r border-b border-slate-300 px-3 py-2 text-right font-bold text-indigo-600">{formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>

            <div className="grid grid-cols-12 border border-slate-300 text-sm mt-4">
              <div className="col-span-3 bg-slate-100 border-r border-slate-300 px-3 py-2 font-semibold uppercase">Payment Term</div>
              <div className="col-span-9 px-3 py-2">
                <div className="space-y-1">
                  {quotation.payment_1?.value && quotation.payment_1.value !== '-----' && (
                    <div className="text-sm">{quotation.payment_1.value}</div>
                  )}
                  {quotation.ドロップダウン_4?.value && quotation.ドロップダウン_4.value !== '-----' && (
                    <div className="text-sm">{quotation.ドロップダウン_4.value}</div>
                  )}
                  {quotation.ドロップダウン_5?.value && quotation.ドロップダウン_5.value !== '-----' && (
                    <div className="text-sm">{quotation.ドロップダウン_5.value}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-12 border border-t-0 border-slate-300 text-sm">
              <div className="col-span-3 bg-slate-100 border-r border-slate-300 px-3 py-2 font-semibold uppercase">Remark</div>
              <div className="col-span-9 px-3 py-2">
                <div className="space-y-1">
                  {quotation.Text_1?.value && (
                    <div className="text-sm">{quotation.Text_1.value}</div>
                  )}
                  {quotation.文字列__1行__11?.value && (
                    <div className="text-sm">{quotation.文字列__1行__11.value}</div>
                  )}
                  {quotation.Text_4?.value && (
                    <div className="text-sm">{quotation.Text_4.value}</div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 border border-slate-300 text-center text-sm mt-6">
              <div className="px-3 py-3 border-r border-slate-300">
                <div className="font-semibold uppercase mb-3 text-sm">SALES STAFF</div>
                <div className="mb-3 text-sm text-slate-700 font-bold">
                  {salesStaff}
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium">DATE:</span>
                  <span className="ml-2 text-sm text-slate-700">{formatDisplayDate(quotation.日付?.value)}</span>
                </div>
              </div>
              <div className="px-3 py-3 border-r border-slate-300">
                <div className="font-semibold uppercase mb-3 text-sm">APPROVED BY</div>
                <div className="mb-3 text-sm text-slate-700 font-bold">
                  {approvedBy}
                </div>
                <div className="text-center">
                  <span className="text-sm font-medium">DATE:</span>
                  <span className="ml-2 text-sm text-slate-700">{formatDisplayDate(quotation.日付?.value)}</span>
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

        {/* ボタングループ */}
        <div className="flex justify-end space-x-4">
          <Link
            href={`/${locale}/quotation/${quotation.$id.value}/edit`}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {language === 'ja' ? '編集' : 'Edit'}
          </Link>
          <Link
            href={`/${locale}/quotation`}
            className="inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {language === 'ja' ? '一覧に戻る' : 'Back to List'}
          </Link>
        </div>
      </form>
    </DashboardLayout>
  );
}