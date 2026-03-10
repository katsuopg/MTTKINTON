'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ShoppingCart, X, ArrowRight } from 'lucide-react';
import DomHeader from './DomHeader';
import DomTabs from './DomTabs';
import { detailStyles } from '@/components/ui/DetailStyles';
import type { DomHeaderWithRelations, DomMasters } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface DomContainerProps {
  projectId: string;
  locale: string;
  customerName?: string;
  machineName?: string;
  workNo?: string;
  projectCode?: string;
}

const LABELS: Record<Language, Record<string, string>> = {
  ja: {
    createDom: 'DOM作成',
    creating: '作成中...',
    loading: '読み込み中...',
    error: 'エラーが発生しました',
    noDom: 'このプロジェクトにはDOMが作成されていません。',
    createPrompt: '「DOM作成」ボタンをクリックして、部品構成表を作成してください。',
  },
  en: {
    createDom: 'Create DOM',
    creating: 'Creating...',
    loading: 'Loading...',
    error: 'An error occurred',
    noDom: 'No DOM has been created for this project.',
    createPrompt: 'Click "Create DOM" to create a material document.',
  },
  th: {
    createDom: 'สร้าง DOM',
    creating: 'กำลังสร้าง...',
    loading: 'กำลังโหลด...',
    error: 'เกิดข้อผิดพลาด',
    noDom: 'ยังไม่มี DOM สำหรับโครงการนี้',
    createPrompt: 'คลิก "สร้าง DOM" เพื่อสร้างเอกสารวัสดุ',
  },
};

const QUOTE_LABELS: Record<string, Record<Language, string>> = {
  startSelect: { ja: '見積依頼作成', en: 'Quote Request', th: 'ขอราคา' },
  cancelSelect: { ja: '選択解除', en: 'Cancel', th: 'ยกเลิก' },
  createQuote: { ja: '見積依頼へ進む', en: 'Proceed to Quote', th: 'ดำเนินการขอราคา' },
  selectedCount: { ja: '件選択中', en: 'selected', th: 'ที่เลือก' },
};

export default function DomContainer({ projectId, locale, customerName, machineName, workNo, projectCode }: DomContainerProps) {
  const router = useRouter();
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;

  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(false);
  const [dom, setDom] = useState<DomHeaderWithRelations | null>(null);
  const [masters, setMasters] = useState<DomMasters | null>(null);

  // 見積依頼選択 state
  const [quoteSelecting, setQuoteSelecting] = useState(false);
  const [selectedMechItems, setSelectedMechItems] = useState<Set<string>>(new Set());
  const [selectedElecItems, setSelectedElecItems] = useState<Set<string>>(new Set());
  const totalSelected = selectedMechItems.size + selectedElecItems.size;

  const handleStartQuoteSelect = () => {
    setQuoteSelecting(true);
    setSelectedMechItems(new Set());
    setSelectedElecItems(new Set());
  };

  const handleCancelQuoteSelect = () => {
    setQuoteSelecting(false);
    setSelectedMechItems(new Set());
    setSelectedElecItems(new Set());
  };

  const handleToggleMechItem = useCallback((id: string) => {
    setSelectedMechItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleToggleElecItem = useCallback((id: string) => {
    setSelectedElecItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleProceedToQuote = () => {
    if (totalSelected === 0 || !dom) return;
    const params = new URLSearchParams();
    params.set('dom_header_id', dom.id);
    if (selectedMechItems.size > 0) params.set('mech_ids', Array.from(selectedMechItems).join(','));
    if (selectedElecItems.size > 0) params.set('elec_ids', Array.from(selectedElecItems).join(','));
    if (workNo) params.set('work_no', workNo);
    if (projectCode) params.set('project_code', projectCode);
    router.push(`/${locale}/quote-requests/new?${params.toString()}`);
  };

  // DOM取得
  const fetchDom = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      setError(false);
      const ts = Date.now();
      const res = await fetch(`/api/dom?project_id=${projectId}&_t=${ts}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch');
      const headers = await res.json();
      if (Array.isArray(headers) && headers.length > 0) {
        const detailRes = await fetch(`/api/dom/${headers[0].id}?_t=${ts}`, { cache: 'no-store' });
        if (!detailRes.ok) throw new Error('Failed to fetch detail');
        const detail = await detailRes.json();
        setDom(detail);
      } else {
        setDom(null);
      }
    } catch (err) {
      console.error('Error fetching DOM:', err);
      setError(true);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [projectId]);

  const fetchMasters = useCallback(async () => {
    try {
      const res = await fetch('/api/dom/masters');
      if (!res.ok) throw new Error('Failed to fetch masters');
      const data = await res.json();
      setMasters(data);
    } catch (err) {
      console.error('Error fetching masters:', err);
    }
  }, []);

  useEffect(() => {
    fetchDom();
    fetchMasters();
  }, [fetchDom, fetchMasters]);

  const handleCreateDom = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/dom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: projectId,
          customer_name: customerName || null,
          machine_name: machineName || null,
        }),
      });
      if (!res.ok) throw new Error('Failed to create DOM');
      await fetchDom();
    } catch (err) {
      console.error('Error creating DOM:', err);
      setError(true);
    } finally {
      setCreating(false);
    }
  };

  const handleRefresh = () => fetchDom(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
        <span className="ml-3 text-gray-500">{LABELS[language].loading}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{LABELS[language].error}</p>
      </div>
    );
  }

  if (!dom) {
    return (
      <div className="text-center py-12">
        <div className="mb-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <Plus size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">{LABELS[language].noDom}</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">{LABELS[language].createPrompt}</p>
        </div>
        <button
          onClick={handleCreateDom}
          disabled={creating}
          className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-brand-500 hover:bg-brand-600 rounded-lg disabled:opacity-50 transition-colors"
        >
          <Plus size={18} />
          {creating ? LABELS[language].creating : LABELS[language].createDom}
        </button>
      </div>
    );
  }

  // 見積依頼ボタン（DomHeaderのactions propとして渡す）
  const quoteActions = !quoteSelecting ? (
    <button
      onClick={handleStartQuoteSelect}
      className={`${detailStyles.secondaryButton} !py-1.5 !px-3 !text-xs`}
    >
      <ShoppingCart size={14} />
      <span className="ml-1.5">{QUOTE_LABELS.startSelect[language]}</span>
    </button>
  ) : (
    <>
      <button
        onClick={handleCancelQuoteSelect}
        className={`${detailStyles.secondaryButton} !py-1.5 !px-3 !text-xs`}
      >
        <X size={14} />
        <span className="ml-1.5">{QUOTE_LABELS.cancelSelect[language]}</span>
      </button>
      {totalSelected > 0 && (
        <span className="text-xs font-medium text-brand-600 dark:text-brand-400">
          {totalSelected} {QUOTE_LABELS.selectedCount[language]}
        </span>
      )}
      <button
        onClick={handleProceedToQuote}
        disabled={totalSelected === 0}
        className={`${detailStyles.primaryButton} !py-1.5 !px-3 !text-xs disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <span>{QUOTE_LABELS.createQuote[language]}</span>
        <ArrowRight size={14} className="ml-1.5" />
      </button>
    </>
  );

  return (
    <div>
      <DomHeader dom={dom} language={language} onRefresh={handleRefresh} actions={quoteActions} />
      {masters && (
        <DomTabs
          dom={dom}
          masters={masters}
          language={language}
          onRefresh={handleRefresh}
          workNo={workNo}
          projectCode={projectCode}
          quoteSelecting={quoteSelecting}
          selectedMechItems={selectedMechItems}
          selectedElecItems={selectedElecItems}
          onToggleMechItem={handleToggleMechItem}
          onToggleElecItem={handleToggleElecItem}
        />
      )}
    </div>
  );
}
