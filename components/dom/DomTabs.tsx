'use client';

import React from 'react';
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
}

const TAB_LABELS = {
  mech: { ja: 'メカ部品', en: 'Mechanical', th: 'เครื่องกล' },
  elec: { ja: '電気部品', en: 'Electrical', th: 'ไฟฟ้า' },
  labor: { ja: '社内工数', en: 'Labor', th: 'ชั่วโมงทำงาน' },
  summary: { ja: '全体集計', en: 'Summary', th: 'สรุป' },
};

export default function DomTabs({ dom, masters, language, onRefresh }: DomTabsProps) {
  const [activeTab, setActiveTab] = React.useState('mech');

  const tabs = [
    { key: 'mech', label: TAB_LABELS.mech[language] },
    { key: 'elec', label: TAB_LABELS.elec[language] },
    { key: 'labor', label: TAB_LABELS.labor[language] },
    { key: 'summary', label: TAB_LABELS.summary[language] },
  ];

  return (
    <div>
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
        />
      </TabPanel>

      <TabPanel value="elec" activeValue={activeTab}>
        <ElecItemsTab
          dom={dom}
          language={language}
          onRefresh={onRefresh}
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
