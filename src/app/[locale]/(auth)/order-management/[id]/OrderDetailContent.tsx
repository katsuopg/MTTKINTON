'use client'

import { useRouter, useParams } from 'next/navigation'
import { Language } from '@/lib/kintone/field-mappings'
import { FileText, Calendar, Calculator } from 'lucide-react'
import FileViewerModal from '../FileViewerModal'
import { detailStyles } from '@/components/ui/DetailStyles'
import { DetailPageHeader } from '@/components/ui/DetailPageHeader'
import { extractCsName } from '@/lib/utils/customer-name'
import type { SupabaseCustomerOrder } from '../OrderManagementContent'

interface OrderDetailContentProps {
  order: SupabaseCustomerOrder | null;
}

export default function OrderDetailContent({ order }: OrderDetailContentProps) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  if (!order) {
    return (
      <div className={detailStyles.pageWrapper}>
        <div className={`${detailStyles.card} ${detailStyles.cardContent}`}>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-600 dark:text-red-400">注文書が見つかりません</p>
            <button
              onClick={() => router.push(`/${locale}/order-management`)}
              className={`mt-4 ${detailStyles.link}`}
            >
              一覧に戻る
            </button>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number | null) => {
    if (value === null || value === undefined) return '0'
    return Number(value).toLocaleString('ja-JP')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  const attachments = order.attachments || [];

  return (
      <div className={detailStyles.pageWrapper}>
        <DetailPageHeader
          backHref={`/${locale}/order-management`}
          title={[
            order.po_number,
            order.work_no,
            order.customer_id ? extractCsName(order.customer_id) : null,
          ].filter(Boolean).join(' - ')}
          actions={
            attachments.length > 0 ? (
              <FileViewerModal
                files={attachments}
                language={locale as Language}
              />
            ) : undefined
          }
        />

        {/* 基本情報カード */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
              <FileText size={20} />
              基本情報
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid3}`}>
            <div>
              <label className={detailStyles.fieldLabel}>
                PO番号
              </label>
              <p className={`mt-1 text-base font-semibold ${detailStyles.fieldValue}`}>
                {order.po_number || '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                工事番号
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {order.work_no || '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                顧客名
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {order.customer_id ? (
                  <a
                    href={`/${locale}/customers/${order.customer_id}`}
                    className={detailStyles.link}
                  >
                    {extractCsName(order.customer_id)}
                  </a>
                ) : '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                会社名
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue} text-gray-500 dark:text-gray-400`}>
                {order.customer_name || '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                見積番号
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {order.quotation_no || '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                レコードID
              </label>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                {order.kintone_record_id}
              </p>
            </div>
          </div>
        </div>

        {/* 日付情報カード */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
              <Calendar size={20} />
              日付情報
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid3}`}>
            <div>
              <label className={detailStyles.fieldLabel}>
                注文日
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {formatDate(order.order_date)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                見積日
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {formatDate(order.quotation_date)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                更新日時
              </label>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                {order.updated_at_kintone ? new Date(order.updated_at_kintone).toLocaleString('ja-JP') : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 金額情報カード */}
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-800 dark:text-white">
              <Calculator size={20} />
              金額情報
            </h2>
          </div>
          <div className={`${detailStyles.cardContent} ${detailStyles.grid3}`}>
            <div>
              <label className={detailStyles.fieldLabel}>
                値引前
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                ¥{formatCurrency(order.amount_before_discount)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                値引額
              </label>
              <p className={`mt-1 ${detailStyles.amountRed}`}>
                -¥{formatCurrency(order.discount_amount)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                値引き後金額
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                ¥{formatCurrency(order.amount_after_discount)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                消費税額
              </label>
              <p className="mt-1 text-lg text-gray-900 dark:text-white">
                ¥{formatCurrency(order.vat)}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className={detailStyles.fieldLabel}>
                合計金額（税込）
              </label>
              <p className={`mt-1 ${detailStyles.amountHighlight}`}>
                ¥{formatCurrency(order.total_amount)}
              </p>
            </div>
          </div>
        </div>
      </div>
  )
}
