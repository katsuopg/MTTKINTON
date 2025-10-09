import { SupabaseCustomer } from './customers';
import { SupabaseInvoice } from './invoices';
import { SupabaseMachine } from './machines';
import type { CustomerRecord, InvoiceRecord, MachineRecord } from '@/types/kintone';

export function convertSupabaseCustomersToKintone(customers: SupabaseCustomer[]): CustomerRecord[] {
  return customers.map((customer) => {
    return {
      $id: { type: '__ID__', value: customer.kintone_record_id ?? customer.id },
      $revision: { type: '__REVISION__', value: '1' },
      レコード番号: { type: 'RECORD_NUMBER', value: customer.kintone_record_id ?? customer.id },
      作成者: { type: 'CREATOR', value: { code: '', name: '' } },
      更新者: { type: 'MODIFIER', value: { code: '', name: '' } },
      作成日時: { type: 'CREATED_TIME', value: customer.created_at },
      更新日時: { type: 'UPDATED_TIME', value: customer.updated_at },
      文字列__1行_: { type: 'SINGLE_LINE_TEXT', value: customer.customer_id || '' },
      会社名: { type: 'SINGLE_LINE_TEXT', value: customer.company_name || '' },
      住所: { type: 'SINGLE_LINE_TEXT', value: customer.address || '' },
      郵便番号: { type: 'SINGLE_LINE_TEXT', value: '' },
      文字列__1行__4: { type: 'SINGLE_LINE_TEXT', value: customer.country || '' },
      文字列__1行__6: { type: 'SINGLE_LINE_TEXT', value: customer.tax_id || '' },
      TEL: { type: 'SINGLE_LINE_TEXT', value: customer.phone_number || '' },
      FAX: { type: 'SINGLE_LINE_TEXT', value: customer.fax_number || '' },
      顧客ランク: { type: 'DROP_DOWN', value: customer.customer_rank || '' },
      備考: { type: 'MULTI_LINE_TEXT', value: customer.notes || '' },
    } as CustomerRecord;
  });
}

export function convertSupabaseInvoicesToKintone(invoices: SupabaseInvoice[]): InvoiceRecord[] {
  return invoices.map((invoice) => {
    const createdAt = invoice.created_at || new Date().toISOString();
    const updatedAt = invoice.updated_at || createdAt;
    const subTotal = invoice.sub_total ?? 0;
    const discount = invoice.discount ?? 0;
    const afterDiscount = invoice.after_discount ?? subTotal - discount;
    const vat = invoice.vat ?? 0;
    const grandTotal = invoice.grand_total ?? afterDiscount + vat;

    return {
      $id: { type: '__ID__', value: invoice.kintone_record_id ?? invoice.id },
      $revision: { type: '__REVISION__', value: '1' },
      レコード番号: { type: 'RECORD_NUMBER', value: invoice.kintone_record_id ?? invoice.id },
      作成者: { type: 'CREATOR', value: { code: '', name: '' } },
      更新者: { type: 'MODIFIER', value: { code: '', name: '' } },
      作成日時: { type: 'CREATED_TIME', value: createdAt },
      更新日時: { type: 'UPDATED_TIME', value: updatedAt },
      文字列__1行_: { type: 'SINGLE_LINE_TEXT', value: invoice.work_no || '' },
      文字列__1行__0: { type: 'SINGLE_LINE_TEXT', value: invoice.invoice_no || '' },
      日付: invoice.invoice_date ? { type: 'DATE', value: invoice.invoice_date } : undefined,
      文字列__1行__3: invoice.customer_id ? { type: 'SINGLE_LINE_TEXT', value: invoice.customer_id } : undefined,
      CS_name: invoice.customer_name ? { type: 'SINGLE_LINE_TEXT', value: invoice.customer_name } : undefined,
      数値: { type: 'NUMBER', value: subTotal.toString() },
      数値_0: { type: 'NUMBER', value: discount.toString() },
      計算_0: { type: 'CALC', value: afterDiscount.toString() },
      計算_1: { type: 'CALC', value: vat.toString() },
      計算: { type: 'CALC', value: grandTotal.toString() },
      total: { type: 'NUMBER', value: subTotal.toString() },
      discont: { type: 'NUMBER', value: discount.toString() },
      subtotal: { type: 'NUMBER', value: afterDiscount.toString() },
      vatprice: { type: 'NUMBER', value: vat.toString() },
      ラジオボタン: invoice.status ? { type: 'RADIO_BUTTON', value: invoice.status } : undefined,
      文字列__1行__5: { type: 'SINGLE_LINE_TEXT', value: '' },
      文字列__1行__6: { type: 'SINGLE_LINE_TEXT', value: '' },
      添付ファイル_0: { type: 'FILE', value: [] },
      添付ファイル_1: { type: 'FILE', value: [] },
    } as InvoiceRecord;
  });
}

export function convertSupabaseMachinesToKintone(machines: SupabaseMachine[]): MachineRecord[] {
  return machines.map((machine) => {
    const createdAt = machine.created_at || new Date().toISOString();
    const updatedAt = machine.updated_at || createdAt;

    return {
      $id: { type: '__ID__', value: machine.kintone_record_id ?? machine.id },
      $revision: { type: '__REVISION__', value: '1' },
      レコード番号: { type: 'RECORD_NUMBER', value: machine.kintone_record_id ?? machine.id },
      作成者: { type: 'CREATOR', value: { code: '', name: '' } },
      更新者: { type: 'MODIFIER', value: { code: '', name: '' } },
      作成日時: { type: 'CREATED_TIME', value: createdAt },
      更新日時: { type: 'UPDATED_TIME', value: updatedAt },
      CsId_db: { type: 'SINGLE_LINE_TEXT', value: machine.customer_id || '' },
      CsName: { type: 'SINGLE_LINE_TEXT', value: machine.customer_name || '' },
      MachineCategory: machine.machine_category ? { type: 'DROP_DOWN', value: machine.machine_category } : undefined,
      Drop_down_0: machine.machine_type ? { type: 'DROP_DOWN', value: machine.machine_type } : undefined,
      Vender: machine.vendor ? { type: 'DROP_DOWN', value: machine.vendor } : undefined,
      Moldel: machine.model ? { type: 'SINGLE_LINE_TEXT', value: machine.model } : undefined,
      SrialNo: machine.serial_number ? { type: 'SINGLE_LINE_TEXT', value: machine.serial_number } : undefined,
      MCNo: machine.machine_number ? { type: 'SINGLE_LINE_TEXT', value: machine.machine_number } : undefined,
      McItem: machine.machine_item ? { type: 'SINGLE_LINE_TEXT', value: machine.machine_item } : undefined,
      InstallDate: machine.install_date ? { type: 'DATE', value: machine.install_date } : undefined,
      ManufactureDate: machine.manufacture_date ? { type: 'SINGLE_LINE_TEXT', value: machine.manufacture_date } : undefined,
      Text_area: machine.remarks ? { type: 'MULTI_LINE_TEXT', value: machine.remarks } : undefined,
      Photo: { type: 'FILE', value: Array.isArray(machine.photo_files) ? machine.photo_files : [] },
      NamePlate: { type: 'FILE', value: Array.isArray(machine.nameplate_files) ? machine.nameplate_files : [] },
      Qt: machine.quotation_count != null ? { type: 'SINGLE_LINE_TEXT', value: String(machine.quotation_count) } : undefined,
      Wn: machine.work_order_count != null ? { type: 'SINGLE_LINE_TEXT', value: String(machine.work_order_count) } : undefined,
      RPT: machine.report_count != null ? { type: 'SINGLE_LINE_TEXT', value: String(machine.report_count) } : undefined,
      QtHistory: machine.quotation_history
        ? {
            type: 'SUBTABLE',
            value: machine.quotation_history.map((entry: any, index: number) => ({
              id: String(index + 1),
              value: {
                QtNo: { type: 'SINGLE_LINE_TEXT', value: entry?.qt_no ?? '' },
                QtDate: { type: 'DATE', value: entry?.qt_date ?? null },
                QtTitle: { type: 'SINGLE_LINE_TEXT', value: entry?.title ?? '' },
                QtProject: { type: 'SINGLE_LINE_TEXT', value: entry?.project_type ?? '' },
                QtGrandTotal: { type: 'NUMBER', value: entry?.grand_total != null ? String(entry.grand_total) : '0' },
                QtWn: { type: 'SINGLE_LINE_TEXT', value: entry?.work_no ?? '' },
                QtStatus: { type: 'SINGLE_LINE_TEXT', value: entry?.status ?? '' },
                QtSales: { type: 'SINGLE_LINE_TEXT', value: entry?.sales ?? '' },
                QtId: { type: 'SINGLE_LINE_TEXT', value: entry?.quotation_id ?? '' },
              },
            })),
          }
        : undefined,
    } as MachineRecord;
  });
}
