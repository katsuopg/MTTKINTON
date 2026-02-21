'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Language } from '@/lib/kintone/field-mappings'
import { FileText, Calendar, Calculator } from 'lucide-react'
import FileViewerModal from '../FileViewerModal'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { detailStyles } from '@/components/ui/DetailStyles'
import { DetailPageHeader } from '@/components/ui/DetailPageHeader'
import { extractCsName } from '@/lib/utils/customer-name'

// 注文書レコードの型定義
interface OrderRecord {
  $id: { type: "__ID__"; value: string }
  レコード番号: { type: "RECORD_NUMBER"; value: string }
  文字列__1行_: { type: "SINGLE_LINE_TEXT"; value: string } // PO番号
  文字列__1行__0: { type: "SINGLE_LINE_TEXT"; value: string } // CS ID
  文字列__1行__2: { type: "SINGLE_LINE_TEXT"; value: string } // 工事番号
  文字列__1行__4: { type: "SINGLE_LINE_TEXT"; value: string } // 顧客名
  日付: { type: "DATE"; value: string } // 注文日
  日付_0: { type: "DATE"; value: string } // 見積日
  ルックアップ: { type: "SINGLE_LINE_TEXT"; value: string } // 見積番号
  数値_3: { type: "NUMBER"; value: string } // 値引き前金額
  数値_4: { type: "NUMBER"; value: string } // 値引き額
  AF: { type: "NUMBER"; value: string } // 値引き後金額
  amount: { type: "CALC"; value: string } // 合計金額（税込）
  vat: { type: "CALC"; value: string } // 消費税額
  添付ファイル: { type: "FILE"; value: Array<{
    fileKey: string;
    name: string;
    contentType: string;
    size: string;
  }> }
  更新日時: { type: "UPDATED_TIME"; value: string }
}

interface OrderDetailContentProps {
  userInfo?: { email: string; name: string; avatarUrl?: string };
}

export default function OrderDetailContent({ userInfo }: OrderDetailContentProps) {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const locale = params.locale as string

  const [order, setOrder] = useState<OrderRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrderDetail()
  }, [id])

  const fetchOrderDetail = async () => {
    try {
      setLoading(true)

      // APIエンドポイントから注文書データを取得
      const response = await fetch(`/api/order-management/${id}`)
      if (!response.ok) {
        throw new Error('注文書が見つかりません')
      }

      const data = await response.json()
      setOrder(data)
    } catch (error) {
      console.error('Error fetching order detail:', error)
      setError('注文書の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const pageTitle = locale === 'ja' ? '注文書詳細' : 'Order Detail'

  if (loading) {
    return (
      <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-lg text-gray-600 dark:text-gray-400">読み込み中...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !order) {
    return (
      <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo}>
        <div className={detailStyles.pageWrapper}>
          <div className={`${detailStyles.card} ${detailStyles.cardContent}`}>
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-600 dark:text-red-400">{error || '注文書が見つかりません'}</p>
              <button
                onClick={() => router.push(`/${locale}/order-management`)}
                className={`mt-4 ${detailStyles.link}`}
              >
                一覧に戻る
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const formatCurrency = (value: string | undefined) => {
    if (!value) return '0'
    return parseFloat(value).toLocaleString('ja-JP')
  }

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ja-JP')
  }

  return (
    <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo}>
      <div className={detailStyles.pageWrapper}>
        <DetailPageHeader
          backHref={`/${locale}/order-management`}
          backLabel="注文書一覧に戻る"
          title={`注文書詳細 - ${order.文字列__1行_.value}`}
          actions={
            order.添付ファイル?.value?.length > 0 ? (
              <FileViewerModal
                files={order.添付ファイル.value}
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
                {order.文字列__1行_.value}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                工事番号
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {order.文字列__1行__2.value || '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                顧客名
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {order.文字列__1行__0?.value ? (
                  <a
                    href={`/${locale}/customers/${order.文字列__1行__0.value}`}
                    className={detailStyles.link}
                  >
                    {extractCsName(order.文字列__1行__0.value)}
                  </a>
                ) : '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                会社名
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue} text-gray-500 dark:text-gray-400`}>
                {order.文字列__1行__4?.value || '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                見積番号
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {order.ルックアップ.value || '-'}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                レコード番号
              </label>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                {order.レコード番号.value}
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
                {formatDate(order.日付.value)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                見積日
              </label>
              <p className={`mt-1 ${detailStyles.fieldValue}`}>
                {formatDate(order.日付_0.value)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                更新日時
              </label>
              <p className="mt-1 text-base text-gray-500 dark:text-gray-400">
                {new Date(order.更新日時.value).toLocaleString('ja-JP')}
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
              <p className={`mt-1 text-lg font-semibold text-gray-900 dark:text-white`}>
                ¥{formatCurrency(order.数値_3.value)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                値引額
              </label>
              <p className={`mt-1 ${detailStyles.amountRed}`}>
                -¥{formatCurrency(order.数値_4.value)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                値引き後金額
              </label>
              <p className={`mt-1 text-lg font-semibold text-gray-900 dark:text-white`}>
                ¥{formatCurrency(order.AF.value)}
              </p>
            </div>

            <div>
              <label className={detailStyles.fieldLabel}>
                消費税額
              </label>
              <p className={`mt-1 text-lg text-gray-900 dark:text-white`}>
                ¥{formatCurrency(order.vat.value)}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className={detailStyles.fieldLabel}>
                合計金額（税込）
              </label>
              <p className={`mt-1 ${detailStyles.amountHighlight}`}>
                ¥{formatCurrency(order.amount.value)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
