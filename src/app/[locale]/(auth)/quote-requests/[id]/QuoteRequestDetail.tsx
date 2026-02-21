'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  FileText,
  Clock,
  User,
  Calendar,
  RefreshCw,
  Plus,
  CheckCircle,
} from 'lucide-react';
import type {
  QuoteRequestStatus,
  QuoteRequestItemWithRelations,
} from '@/types/quote-request';

interface QuoteRequestDetailProps {
  locale: string;
  language: 'ja' | 'en' | 'th';
  requestId: string;
  currentUserId: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type QuoteRequestData = any;

const labels = {
  back: { ja: '一覧に戻る', en: 'Back to list', th: 'กลับไปยังรายการ' },
  edit: { ja: '編集', en: 'Edit', th: 'แก้ไข' },
  cancel: { ja: 'キャンセル', en: 'Cancel', th: 'ยกเลิก' },
  cancelRequest: { ja: '依頼をキャンセル', en: 'Cancel Request', th: 'ยกเลิกคำขอ' },
  basicInfo: { ja: '基本情報', en: 'Basic Info', th: 'ข้อมูลพื้นฐาน' },
  items: { ja: '明細', en: 'Items', th: 'รายการ' },
  history: { ja: '履歴', en: 'History', th: 'ประวัติ' },
  requestNo: { ja: '依頼番号', en: 'Request No.', th: 'หมายเลขคำขอ' },
  requester: { ja: '依頼者', en: 'Requester', th: 'ผู้ขอ' },
  workNo: { ja: '工事番号', en: 'Work No.', th: 'หมายเลขงาน' },
  projectCode: { ja: 'プロジェクトコード', en: 'Project Code', th: 'รหัสโครงการ' },
  status: { ja: 'ステータス', en: 'Status', th: 'สถานะ' },
  desiredDate: { ja: '希望納期', en: 'Desired Date', th: 'วันที่ต้องการ' },
  createdAt: { ja: '依頼日', en: 'Created', th: 'วันที่สร้าง' },
  remarks: { ja: '備考', en: 'Remarks', th: 'หมายเหตุ' },
  purchaser: { ja: '購買担当', en: 'Purchaser', th: 'ผู้จัดซื้อ' },
  notAssigned: { ja: '未割当', en: 'Not assigned', th: 'ไม่ได้กำหนด' },
  modelNumber: { ja: '型式', en: 'Model No.', th: 'รุ่น' },
  manufacturer: { ja: 'メーカー', en: 'Manufacturer', th: 'ผู้ผลิต' },
  quantity: { ja: '数量', en: 'Quantity', th: 'จำนวน' },
  unit: { ja: '単位', en: 'Unit', th: 'หน่วย' },
  offers: { ja: 'オファー', en: 'Offers', th: 'ข้อเสนอ' },
  noItems: { ja: '明細がありません', en: 'No items', th: 'ไม่มีรายการ' },
  loading: { ja: '読み込み中...', en: 'Loading...', th: 'กำลังโหลด...' },
  notFound: { ja: '見積依頼が見つかりません', en: 'Quote request not found', th: 'ไม่พบใบขอใบเสนอราคา' },
  addOffer: { ja: 'オファー追加', en: 'Add Offer', th: 'เพิ่มข้อเสนอ' },
  supplier: { ja: '仕入先', en: 'Supplier', th: 'ซัพพลายเออร์' },
  price: { ja: '価格', en: 'Price', th: 'ราคา' },
  unitPrice: { ja: '単価', en: 'Unit Price', th: 'ราคาต่อหน่วย' },
  deliveryDate: { ja: '納期回答', en: 'Delivery', th: 'วันส่ง' },
  leadTime: { ja: 'LT', en: 'LT', th: 'LT' },
  awarded: { ja: '採用', en: 'Awarded', th: 'เลือกแล้ว' },
  award: { ja: '採用する', en: 'Award', th: 'เลือก' },
  confirmCancel: { ja: '本当にキャンセルしますか？', en: 'Are you sure you want to cancel?', th: 'คุณแน่ใจหรือไม่ที่จะยกเลิก?' },
  cancelReason: { ja: 'キャンセル理由', en: 'Cancel reason', th: 'เหตุผลในการยกเลิก' },
};

// ステータス色マップ
const statusColors: Record<string, string> = {
  requested: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  quoting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  quoted: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  order_requested: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  po_issued: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export default function QuoteRequestDetail({
  locale,
  language,
  requestId,
  currentUserId,
}: QuoteRequestDetailProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<QuoteRequestData | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'items' | 'history'>('info');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quote-requests/${requestId}`);
      if (!response.ok) {
        if (response.status === 404) {
          setRequest(null);
          return;
        }
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      setRequest(data);
    } catch (error) {
      console.error('Error fetching quote request:', error);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCancel = async () => {
    try {
      const response = await fetch(
        `/api/quote-requests/${requestId}?reason=${encodeURIComponent(cancelReason)}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Failed to cancel');

      setShowCancelModal(false);
      fetchData();
    } catch (error) {
      console.error('Error cancelling request:', error);
    }
  };

  const handleAwardOffer = async (offerId: string) => {
    try {
      const response = await fetch(`/api/quote-requests/${requestId}/offers/award`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ offer_id: offerId }),
      });
      if (!response.ok) throw new Error('Failed to award');
      fetchData();
    } catch (error) {
      console.error('Error awarding offer:', error);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${formatDate(dateString)} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getStatusName = (status?: QuoteRequestStatus) => {
    if (!status) return '-';
    if (language === 'ja') return status.name;
    if (language === 'en') return status.name_en || status.name;
    if (language === 'th') return status.name_th || status.name;
    return status.name;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        <span className="ml-3 text-gray-500">{labels.loading[language]}</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <FileText className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500">{labels.notFound[language]}</p>
        <button
          onClick={() => router.push(`/${locale}/quote-requests`)}
          className="mt-4 text-brand-500 hover:text-brand-600"
        >
          {labels.back[language]}
        </button>
      </div>
    );
  }

  const isTerminal = request.status?.is_terminal;

  return (
    <div className={tableStyles.contentWrapper}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${locale}/quote-requests`)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
              {request.request_no}
            </h1>
            {request.status && (
              <span
                className={`${tableStyles.statusBadge} ${
                  statusColors[request.status.code] || 'bg-gray-100'
                } mt-1`}
              >
                {getStatusName(request.status)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg dark:hover:bg-gray-800"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          {!isTerminal && (
            <>
              <button
                onClick={() => router.push(`/${locale}/quote-requests/${requestId}/edit`)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400"
              >
                <Edit className="w-4 h-4 mr-2" />
                {labels.edit[language]}
              </button>
              <button
                onClick={() => setShowCancelModal(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                {labels.cancel[language]}
              </button>
            </>
          )}
        </div>
      </div>

      {/* タブ */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {[
          { key: 'info', label: labels.basicInfo[language], icon: FileText },
          { key: 'items', label: labels.items[language], icon: Package },
          { key: 'history', label: labels.history[language], icon: Clock },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as typeof activeTab)}
            className={`flex items-center px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === key
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <Icon className="w-4 h-4 mr-2" />
            {label}
          </button>
        ))}
      </div>

      {/* 基本情報タブ */}
      {activeTab === 'info' && (
        <div className={tableStyles.tableContainer}>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {labels.requestNo[language]}
                </label>
                <p className="text-gray-800 dark:text-white">{request.request_no}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {labels.requester[language]}
                </label>
                <p className="text-gray-800 dark:text-white flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {request.requester_name || '-'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {labels.workNo[language]}
                </label>
                <p className="text-gray-800 dark:text-white">
                  {request.work_no ? (
                    <a
                      href={`/${locale}/workno/${request.work_no}`}
                      className={tableStyles.tdLink}
                    >
                      {request.work_no}
                    </a>
                  ) : (
                    '-'
                  )}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {labels.projectCode[language]}
                </label>
                <p className="text-gray-800 dark:text-white">{request.project_code || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {labels.desiredDate[language]}
                </label>
                <p className="text-gray-800 dark:text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {formatDate(request.desired_delivery_date)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {labels.createdAt[language]}
                </label>
                <p className="text-gray-800 dark:text-white">
                  {formatDateTime(request.created_at)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {labels.purchaser[language]}
                </label>
                <p className="text-gray-800 dark:text-white">
                  {request.purchaser_name || (
                    <span className="text-gray-400">{labels.notAssigned[language]}</span>
                  )}
                </p>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {labels.remarks[language]}
                </label>
                <p className="text-gray-800 dark:text-white whitespace-pre-wrap">
                  {request.remarks || '-'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 明細タブ */}
      {activeTab === 'items' && (
        <div className={tableStyles.tableContainer}>
          <table className={tableStyles.table}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={tableStyles.th}>#</th>
                <th className={tableStyles.th}>{labels.modelNumber[language]}</th>
                <th className={tableStyles.th}>{labels.manufacturer[language]}</th>
                <th className={`${tableStyles.th} text-right`}>{labels.quantity[language]}</th>
                <th className={tableStyles.th}>{labels.unit[language]}</th>
                <th className={tableStyles.th}>{labels.remarks[language]}</th>
                <th className={tableStyles.th}>{labels.offers[language]}</th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {request.items?.map((item: QuoteRequestItemWithRelations, index: number) => (
                <tr key={item.id} className={tableStyles.tr}>
                  <td className={tableStyles.td}>{index + 1}</td>
                  <td className={`${tableStyles.td} font-medium`}>{item.model_number}</td>
                  <td className={tableStyles.td}>{item.manufacturer}</td>
                  <td className={`${tableStyles.td} text-right`}>{item.quantity}</td>
                  <td className={tableStyles.td}>{item.unit}</td>
                  <td className={tableStyles.td}>{item.item_remarks || '-'}</td>
                  <td className={tableStyles.td}>
                    {item.offers && item.offers.length > 0 ? (
                      <div className="space-y-2">
                        {item.offers.map((offer) => (
                          <div
                            key={offer.id}
                            className={`p-2 rounded border ${
                              offer.is_awarded
                                ? 'border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20'
                                : 'border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">
                                {offer.supplier_name || offer.supplier_code || '-'}
                              </span>
                              {offer.is_awarded ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : !isTerminal && (
                                <button
                                  onClick={() => handleAwardOffer(offer.id)}
                                  className="text-xs text-brand-500 hover:text-brand-600"
                                >
                                  {labels.award[language]}
                                </button>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {offer.quoted_price?.toLocaleString()}B
                              {offer.quoted_delivery_date && ` / ${formatDate(offer.quoted_delivery_date)}`}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
              {(!request.items || request.items.length === 0) && (
                <tr>
                  <td colSpan={7} className={tableStyles.emptyRow}>
                    {labels.noItems[language]}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 履歴タブ */}
      {activeTab === 'history' && (
        <div className={tableStyles.tableContainer}>
          <div className="p-6">
            {request.status_logs?.length > 0 ? (
              <div className="space-y-4">
                {request.status_logs.map((log: any) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 pb-4 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-brand-500" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {log.from_status && (
                          <>
                            <span
                              className={`${tableStyles.statusBadge} ${
                                statusColors[log.from_status.code] || 'bg-gray-100'
                              }`}
                            >
                              {getStatusName(log.from_status)}
                            </span>
                            <span className="text-gray-400">→</span>
                          </>
                        )}
                        <span
                          className={`${tableStyles.statusBadge} ${
                            statusColors[log.to_status?.code] || 'bg-gray-100'
                          }`}
                        >
                          {getStatusName(log.to_status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {formatDateTime(log.changed_at)}
                      </p>
                      {log.reason && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {log.reason}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                {language === 'ja' ? '履歴がありません' : 'No history'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* キャンセル確認モーダル */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
              {labels.cancelRequest[language]}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {labels.confirmCancel[language]}
            </p>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {labels.cancelReason[language]}
              </label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700"
              >
                {labels.back[language]}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
              >
                {labels.cancel[language]}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
