import { NextResponse } from 'next/server';
import { z } from 'zod';
import { KintoneClient } from '@/lib/kintone/client';
import { KINTONE_APPS } from '@/types/kintone';

const lineItemSchema = z.object({
  rowId: z.string().optional(),
  Text: z.string().optional(),
  category: z.string().optional(),
  Desc: z.string().optional(),
  type: z.enum(['Expense', 'Other']).optional(),
  QTY: z.string().optional(),
  unit: z.string().optional(),
  Cost: z.string().optional(),
  Rate: z.string().optional(),
});

const payloadSchema = z.object({
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

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const id = params.id;

  let body: z.infer<typeof payloadSchema>;
  try {
    const json = await request.json();
    body = payloadSchema.parse(json);
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Invalid payload' }, { status: 400 });
  }

  try {
    const client = new KintoneClient(
      KINTONE_APPS.QUOTATION.appId.toString(),
      process.env.KINTONE_API_TOKEN_QUOTATION || ''
    );

    const normalizedLineItems = body.lineItems.filter((item) => {
      return [item.Text, item.Desc, item.QTY, item.Cost, item.Rate, item.category]
        .some((value) => (value ?? '').toString().trim() !== '');
    });

    const subTableValue = normalizedLineItems.map((item) => ({
      ...(item.rowId ? { id: item.rowId } : {}),
      value: {
        Text: { value: item.Text ?? '' },
        'ルックアップ': { value: item.category ?? '' },
        Desc: { value: item.Desc ?? '' },
        type: { value: item.type ?? '' },
        QTY: { value: item.QTY ?? '' },
        ドロップダウン_2: { value: item.unit ?? '' },
        Cost: { value: item.Cost ?? '' },
        Rate: { value: item.Rate ?? '' },
      },
    }));

    const record: Record<string, any> = {
      ...(body.qtDate !== undefined ? { 日付: { value: body.qtDate || '' } } : {}),
      ...(body.qtNo !== undefined ? { qtno2: { value: body.qtNo || '' } } : {}),
      ...(body.customerName !== undefined ? { name: { value: body.customerName || '' } } : {}),
      ...(body.customerId !== undefined ? { 文字列__1行__10: { value: body.customerId || '' } } : {}),
      ...(body.customerAddress !== undefined ? { Text_3: { value: body.customerAddress || '' } } : {}),
      ...(body.contactPerson !== undefined ? { ルックアップ_1: { value: body.contactPerson || '' } } : {}),
      ...(body.projectName !== undefined ? { ドロップダウン_0: { value: body.projectName || '' } } : {}),
      ...(body.title !== undefined ? { 文字列__1行__4: { value: body.title || '' } } : {}),
      ...(body.vendor !== undefined ? { 文字列__1行__5: { value: body.vendor || '' } } : {}),
      ...(body.model !== undefined ? { 文字列__1行__6: { value: body.model || '' } } : {}),
      ...(body.serialNo !== undefined ? { 文字列__1行__7: { value: body.serialNo || '' } } : {}),
      ...(body.machineNo !== undefined ? { 文字列__1行__9: { value: body.machineNo || '' } } : {}),
      ...(body.delivery !== undefined ? { 文字列__1行__8: { value: body.delivery || '' } } : {}),
      ...(body.validUntil !== undefined ? { ドロップダウン_3: { value: body.validUntil || '' } } : {}),
      ...(body.paymentTerm !== undefined ? { payment_1: { value: body.paymentTerm || '' } } : {}),
      ...(body.remark !== undefined ? { Text_1: { value: body.remark || '' } } : {}),
      ...(body.discount !== undefined ? { Discount: { value: body.discount || '0' } } : {}),
      ...(body.internalStatus !== undefined ? { ドロップダウン: { value: body.internalStatus || '' } } : {}),
      ...(body.probability !== undefined ? { Drop_down: { value: body.probability || '' } } : {}),
      ...(body.salesPhone !== undefined ? { Mobile: { value: body.salesPhone || '' } } : {}),
      ...(body.lineItems !== undefined
        ? {
            見積明細: {
              value: subTableValue,
            },
          }
        : {}),
    };

    await client.updateRecord(id, record);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to update quotation', error);
    return NextResponse.json(
      { message: error?.message || 'Failed to update quotation' },
      { status: 500 }
    );
  }
}
