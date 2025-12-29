'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Language } from '@/lib/kintone/field-mappings'
import { ArrowLeft, Download, FileText, Calendar, Calculator } from 'lucide-react'
import FileViewerModal from '../FileViewerModal'
import DashboardLayout from '@/components/layout/DashboardLayout'

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
          <div className="text-lg">読み込み中...</div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !order) {
    return (
      <DashboardLayout locale={locale} title={pageTitle} userInfo={userInfo}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error || '注文書が見つかりません'}</p>
            <button
              onClick={() => router.push(`/${locale}/order-management`)}
              className="mt-4 text-blue-600 hover:text-blue-800 underline"
            >
              一覧に戻る
            </button>
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
      <div className="p-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/${locale}/order-management`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4"
          >
            <ArrowLeft size={20} />
            <span>注文書一覧に戻る</span>
          </button>

          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              注文書詳細 - {order.文字列__1行_.value}
            </h1>
            {order.添付ファイル?.value?.length > 0 && (
              <FileViewerModal
                files={order.添付ファイル.value}
                language={locale as Language}
              />
            )}
          </div>
        </div>

        {/* 基本情報カード */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText size={20} />
              基本情報
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  PO番号
                </label>
                <p className="text-base font-semibold text-gray-900">
                  {order.文字列__1行_.value}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  工事番号
                </label>
                <p className="text-base">
                  {order.文字列__1行__2.value || '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  CS ID
                </label>
                <p className="text-base">
                  {order.文字列__1行__0.value || '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  顧客名
                </label>
                <p className="text-base">
                  {order.文字列__1行__4.value || '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  見積番号
                </label>
                <p className="text-base">
                  {order.ルックアップ.value || '-'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  レコード番号
                </label>
                <p className="text-base text-gray-500">
                  {order.レコード番号.value}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 日付情報カード */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calendar size={20} />
              日付情報
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  注文日
                </label>
                <p className="text-base">
                  {formatDate(order.日付.value)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  見積日
                </label>
                <p className="text-base">
                  {formatDate(order.日付_0.value)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  更新日時
                </label>
                <p className="text-base text-gray-500">
                  {new Date(order.更新日時.value).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 金額情報カード */}
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="bg-gray-50 px-6 py-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Calculator size={20} />
              金額情報
            </h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  値引前
                </label>
                <p className="text-lg font-semibold">
                  ¥{formatCurrency(order.数値_3.value)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  値引額
                </label>
                <p className="text-lg text-red-600">
                  -¥{formatCurrency(order.数値_4.value)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  値引き後金額
                </label>
                <p className="text-lg font-semibold">
                  ¥{formatCurrency(order.AF.value)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  消費税額
                </label>
                <p className="text-lg">
                  ¥{formatCurrency(order.vat.value)}
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  合計金額（税込）
                </label>
                <p className="text-2xl font-bold text-blue-600">
                  ¥{formatCurrency(order.amount.value)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
