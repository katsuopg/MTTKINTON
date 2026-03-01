'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingCart, X, ArrowRight } from 'lucide-react';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import MechItemsTab from './mech/MechItemsTab';
import ElecItemsTab from './elec/ElecItemsTab';
import LaborTab from './labor/LaborTab';
import SummaryTab from './summary/SummaryTab';
import type { DomHeaderWithRelations, DomMasters } from '@/types/dom';

type Language = 'ja' | 'en' | 'th';

interface DomTabsProps {
  dom: DomHeaderWithRelations;
  masters: DomMasters;
  language: Language;
  onRefresh: () => void | Promise<void>;
  workNo?: string;
  projectCode?: string;
}

const TAB_LABELS = {
  mech: { ja: 'メカ部品', en: 'Mechanical', th: 'เครื่องกล' },
  elec: { ja: '電気部品', en: 'Electrical', th: 'ไฟฟ้า' },
  labor: { ja: '社内工数', en: 'Labor', th: 'ชั่วโมงทำงาน' },
  summary: { ja: '全体集計', en: 'Summary', th: 'สรุป' },
};

const QUOTE_LABELS: Record<string, Record<Language, string>> = {
  startSelect: { ja: '見積依頼作成', en: 'Create Quote Request', th: 'สร้างใบขอราคา' },
  cancelSelect: { ja: '選択解除', en: 'Cancel Selection', th: 'ยกเลิกการเลือก' },
  createQuote: { ja: '見積依頼へ進む', en: 'Proceed to Quote', th: 'ดำเนินการขอราคา' },
  selectedCount: { ja: '件選択中', en: 'selected', th: 'รายการที่เลือก' },
  noSelection: { ja: 'アイテムを選択してください', en: 'Select items first', th: 'เลือกรายการก่อน' },
};

export default function DomTabs({ dom, masters, language, onRefresh, workNo, projectCode }: DomTabsProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('mech');
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
    if (totalSelected === 0) return;

    const params = new URLSearchParams();
    params.set('dom_header_id', dom.id);
    if (selectedMechItems.size > 0) {
      params.set('mech_ids', Array.from(selectedMechItems).join(','));
    }
    if (selectedElecItems.size > 0) {
      params.set('elec_ids', Array.from(selectedElecItems).join(','));
    }
    if (workNo) params.set('work_no', workNo);
    if (projectCode) params.set('project_code', projectCode);

    // ロケールを取得（URLから推定）
    const pathParts = window.location.pathname.split('/');
    const locale = pathParts[1] || 'ja';

    router.push(`/${locale}/quote-requests/new?${params.toString()}`);
  };

  const tabs = [
    { key: 'mech', label: TAB_LABELS.mech[language] },
    { key: 'elec', label: TAB_LABELS.elec[language] },
    { key: 'labor', label: TAB_LABELS.labor[language] },
    { key: 'summary', label: TAB_LABELS.summary[language] },
  ];

  return (
    <div>
      {/* 見積依頼選択モードのツールバー */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {!quoteSelecting ? (
          <button
            onClick={handleStartQuoteSelect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-orange-700 bg-orange-50 border border-orange-300 rounded-lg hover:bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30 dark:border-orange-700 dark:hover:bg-orange-900/50 transition-colors"
          >
            <ShoppingCart size={16} />
            {QUOTE_LABELS.startSelect[language]}
          </button>
        ) : (
          <>
            <button
              onClick={handleCancelQuoteSelect}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
            >
              <X size={16} />
              {QUOTE_LABELS.cancelSelect[language]}
            </button>
            {totalSelected > 0 && (
              <span className="text-sm font-medium text-orange-600 dark:text-orange-400">
                {totalSelected} {QUOTE_LABELS.selectedCount[language]}
              </span>
            )}
            <div className="flex-1" />
            <button
              onClick={handleProceedToQuote}
              disabled={totalSelected === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {QUOTE_LABELS.createQuote[language]}
              <ArrowRight size={16} />
            </button>
          </>
        )}
      </div>

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="pill"
        className="mb-4"
      />

      <TabPanel value="mech" activeValue={activeTab}>
        <MechItemsTab
          dom={dom}
          masters={masters}
          language={language}
          onRefresh={onRefresh}
          quoteSelecting={quoteSelecting}
          selectedQuoteItems={selectedMechItems}
          onToggleQuoteItem={handleToggleMechItem}
        />
      </TabPanel>

      <TabPanel value="elec" activeValue={activeTab}>
        <ElecItemsTab
          dom={dom}
          language={language}
          onRefresh={onRefresh}
          quoteSelecting={quoteSelecting}
          selectedQuoteItems={selectedElecItems}
          onToggleQuoteItem={handleToggleElecItem}
        />
      </TabPanel>

      <TabPanel value="labor" activeValue={activeTab}>
        <LaborTab
          dom={dom}
          language={language}
          onRefresh={onRefresh}
        />
      </TabPanel>

      <TabPanel value="summary" activeValue={activeTab}>
        <SummaryTab
          domId={dom.id}
          language={language}
        />
      </TabPanel>
    </div>
  );
}
