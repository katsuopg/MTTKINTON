'use client';

import React, { useState } from 'react';
import { DOM_HEADER_STATUS_LABELS } from '@/types/dom';
import type { DomHeader as DomHeaderType, DomHeaderStatus } from '@/types/dom';
import { Send, CheckCircle, ArrowLeft, BookOpen } from 'lucide-react';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

type Language = 'ja' | 'en' | 'th';

interface DomHeaderProps {
  dom: DomHeaderType;
  language: Language;
  onRefresh: () => void | Promise<void>;
}

const STATUS_COLORS: Record<DomHeaderStatus, string> = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
  in_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  released: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
};

// ステータス遷移ルール
const STATUS_TRANSITIONS: Record<DomHeaderStatus, DomHeaderStatus[]> = {
  draft: ['in_review'],
  in_review: ['approved', 'draft'],
  approved: ['released'],
  released: [],
};

const LABELS: Record<string, Record<Language, string>> = {
  version: { ja: 'Ver.', en: 'Ver.', th: 'เวอร์ชัน' },
  totalCost: { ja: '合計', en: 'Total', th: 'รวม' },
  // 遷移ボタンラベル
  toInReview: { ja: '確認依頼', en: 'Request Review', th: 'ขอตรวจสอบ' },
  toApproved: { ja: '承認', en: 'Approve', th: 'อนุมัติ' },
  toDraft: { ja: '差し戻し', en: 'Return to Draft', th: 'ส่งกลับ' },
  toReleased: { ja: '発行', en: 'Release', th: 'เผยแพร่' },
  // 確認ダイアログ
  confirmTitle: { ja: 'ステータス変更', en: 'Change Status', th: 'เปลี่ยนสถานะ' },
  confirmToInReview: { ja: 'ステータスを「確認中」に変更しますか？', en: 'Change status to "In Review"?', th: 'เปลี่ยนสถานะเป็น "กำลังตรวจสอบ"?' },
  confirmToApproved: { ja: 'ステータスを「承認済」に変更しますか？', en: 'Change status to "Approved"?', th: 'เปลี่ยนสถานะเป็น "อนุมัติแล้ว"?' },
  confirmToDraft: { ja: 'ステータスを「下書き」に差し戻しますか？', en: 'Return status to "Draft"?', th: 'ส่งกลับสถานะเป็น "ร่าง"?' },
  confirmToReleased: { ja: 'ステータスを「発行済」に変更しますか？この操作は取り消せません。', en: 'Change status to "Released"? This action cannot be undone.', th: 'เปลี่ยนสถานะเป็น "เผยแพร่แล้ว"? ไม่สามารถยกเลิกได้' },
  confirm: { ja: '変更', en: 'Change', th: 'เปลี่ยน' },
  cancel: { ja: 'キャンセル', en: 'Cancel', th: 'ยกเลิก' },
  updating: { ja: '更新中...', en: 'Updating...', th: 'กำลังอัปเดต...' },
  success: { ja: 'ステータスを変更しました', en: 'Status updated', th: 'อัปเดตสถานะแล้ว' },
  error: { ja: 'ステータス変更に失敗しました', en: 'Failed to update status', th: 'อัปเดตสถานะไม่สำเร็จ' },
};

const TRANSITION_BUTTON_CONFIG: Record<DomHeaderStatus, { label: string; icon: React.ReactNode; style: string; variant: 'info' | 'warning' | 'danger' }> = {
  in_review: { label: 'toInReview', icon: <Send size={14} />, style: 'text-yellow-700 bg-yellow-50 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30 dark:border-yellow-700 dark:hover:bg-yellow-900/50', variant: 'warning' },
  approved: { label: 'toApproved', icon: <CheckCircle size={14} />, style: 'text-green-700 bg-green-50 border-green-300 hover:bg-green-100 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700 dark:hover:bg-green-900/50', variant: 'info' },
  draft: { label: 'toDraft', icon: <ArrowLeft size={14} />, style: 'text-gray-700 bg-gray-50 border-gray-300 hover:bg-gray-100 dark:text-gray-300 dark:bg-gray-700/30 dark:border-gray-600 dark:hover:bg-gray-700/50', variant: 'warning' },
  released: { label: 'toReleased', icon: <BookOpen size={14} />, style: 'text-blue-700 bg-blue-50 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700 dark:hover:bg-blue-900/50', variant: 'danger' },
};

const CONFIRM_MESSAGES: Record<DomHeaderStatus, string> = {
  in_review: 'confirmToInReview',
  approved: 'confirmToApproved',
  draft: 'confirmToDraft',
  released: 'confirmToReleased',
};

export default function DomHeader({ dom, language, onRefresh }: DomHeaderProps) {
  const { confirmDialog } = useConfirmDialog();
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);

  const statusLabel = DOM_HEADER_STATUS_LABELS[dom.status]?.[language] || dom.status;
  const statusColor = STATUS_COLORS[dom.status] || STATUS_COLORS.draft;
  const transitions = STATUS_TRANSITIONS[dom.status] || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(language === 'th' ? 'th-TH' : language === 'en' ? 'en-US' : 'ja-JP', {
      style: 'currency',
      currency: 'THB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleStatusChange = async (targetStatus: DomHeaderStatus) => {
    const confirmKey = CONFIRM_MESSAGES[targetStatus];
    const confirmed = await confirmDialog({
      title: LABELS.confirmTitle[language],
      message: LABELS[confirmKey][language],
      variant: TRANSITION_BUTTON_CONFIG[targetStatus].variant,
      confirmLabel: LABELS.confirm[language],
      cancelLabel: LABELS.cancel[language],
    });
    if (!confirmed) return;

    setUpdating(true);
    try {
      const res = await fetch(`/api/dom/${dom.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      toast({ type: 'success', title: LABELS.success[language] });
      await onRefresh();
    } catch {
      toast({ type: 'error', title: LABELS.error[language] });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-4">
      <div className="flex items-center gap-1.5">
        <span className="font-medium">{LABELS.version[language]}</span>
        <span className="text-gray-800 dark:text-white">{dom.version}</span>
      </div>
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColor}`}>
        {statusLabel}
      </span>

      {/* ステータス遷移ボタン */}
      {transitions.length > 0 && (
        <div className="flex items-center gap-2">
          {transitions.map((target) => {
            const config = TRANSITION_BUTTON_CONFIG[target];
            return (
              <button
                key={target}
                onClick={() => handleStatusChange(target)}
                disabled={updating}
                className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium border rounded-lg transition-colors disabled:opacity-50 ${config.style}`}
              >
                {config.icon}
                {updating ? LABELS.updating[language] : LABELS[config.label][language]}
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-1.5 ml-auto">
        <span className="font-medium">{LABELS.totalCost[language]}:</span>
        <span className="text-gray-800 dark:text-white font-semibold">
          {formatCurrency(dom.total_cost || 0)}
        </span>
      </div>
    </div>
  );
}
