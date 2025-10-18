'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectRecord, CustomerRecord } from '@/types/kintone';
import { getStatusColor } from '@/lib/kintone/utils';
import { type Language } from '@/lib/kintone/field-mappings';
import Link from 'next/link';
import TransitionLink from '@/components/ui/TransitionLink';
import DashboardLayout from '@/components/layout/DashboardLayout';
import dynamic from 'next/dynamic';

// ElectricalPartsTableを動的インポート
const ElectricalPartsTable = dynamic(
  () => import('@/components/ElectricalPartsTable'),
  { ssr: false }
);

// MechanicalPartsTableを動的インポート
const MechanicalPartsTable = dynamic(
  () => import('@/components/MechanicalPartsTable'),
  { ssr: false }
);

interface ProjectDetailContentProps {
  record: ProjectRecord;
  customer: CustomerRecord | null;
  locale: string;
  userEmail?: string;
}

// タブアイコンコンポーネント
function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ClipboardIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function ShoppingCartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CogIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

// 新しいアイコンコンポーネント
function DocumentTextIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function LightningBoltIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

// 電気部品の型定義
interface ElectricalPart {
  id: string;
  item: number;
  mark: string;
  name: string;
  model: string;
  brand: string;
  qty: number;
  unitPrice: number;
  total: number;
  leadTime: string;
  note: string;
}

export default function ProjectDetailContent({ 
  record, 
  customer,
  locale,
  userEmail 
}: ProjectDetailContentProps) {
  const language = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as Language;
  const [activeTab, setActiveTab] = useState('overview');
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);
  const router = useRouter();
  const [costTotal, setCostTotal] = useState<number>(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 電気部品の初期データ（DBにデータがない場合は空）
  const initialElectricalParts: ElectricalPart[] = [];

  const [electricalTotal, setElectricalTotal] = useState(0);
  const [mechanicalTotal, setMechanicalTotal] = useState(0);
  
  // Cost Totalの計算
  useEffect(() => {
    setCostTotal(electricalTotal + mechanicalTotal);
  }, [electricalTotal, mechanicalTotal]);

  const handleEdit = () => {
    if (hasUnsavedChanges) {
      if (!confirm('保存されていない変更があります。変更を破棄してもよろしいですか？')) {
        return;
      }
    }
    startTransition(() => {
      setIsNavigating(true);
      router.push(`/${locale}/project-management/${record['レコード番号'].value}/edit`);
    });
  };

  const handleNavigation = (href: string) => {
    if (hasUnsavedChanges) {
      if (!confirm('保存されていない変更があります。変更を破棄してもよろしいですか？')) {
        return;
      }
    }
    startTransition(() => {
      setIsNavigating(true);
      router.push(href);
    });
  };

  useEffect(() => {
    if (isPending || isNavigating) {
      document.body.classList.add('page-transition-active');
    } else {
      document.body.classList.remove('page-transition-active');
    }
  }, [isPending, isNavigating]);

  // ブラウザのbeforeunloadイベントをハンドル
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const formatCurrency = (value: string | undefined) => {
    if (!value) return '¥0';
    const num = parseFloat(value.replace(/,/g, ''));
    return `¥${num.toLocaleString()}`;
  };

  const quotationRecord = record['見積選択'] && record['見積選択']?.value?.length > 0 
    ? record['見積選択'].value[0] 
    : null;

  const poId = record['POコード管理']?.value || record['PO_code']?.value || 'N/A';
  const projectName = record.PjName?.value || record['プロジェクト名']?.value || 'N/A';
  const projectCode = record.PJ_code?.value || record['プロジェクトコード']?.value || 'N/A';
  const customerName = customer ? customer['会社名']?.value || 'N/A' : 'N/A';
  const budgetAmount = record['予算金額']?.value || 'N/A';
  const projectStatus = record.Status?.value || record['プロジェクトステータス']?.value || 'N/A';
  const createdDate = record['$revision']?.value ? new Date(record['$revision'].value).toLocaleDateString() : 'N/A';
  const manager = record['担当者']?.value || record['Parson_in_charge']?.value || 'N/A';
  const expectedDelivery = record.Due_date?.value || record['希望納期']?.value || 'N/A';

  return (
  <DashboardLayout locale={locale} userEmail={userEmail}>
      <div className="py-4 px-4">
        {/* ヘッダー部分 */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{projectCode} - {projectName}</h1>
                <div className="mt-2 flex flex-wrap gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">顧客:</span>
                    {customer ? (
                      <TransitionLink 
                        href={`/${locale}/customer/${customer['レコード番号'].value}`}
                        className="text-indigo-600 hover:text-indigo-900 font-medium"
                      >
                        {customerName}
                      </TransitionLink>
                    ) : (
                      <span className="font-medium text-gray-900">{customerName}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">ステータス:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(projectStatus)}`}>
                      {projectStatus}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">担当者:</span>
                    <span className="font-medium text-gray-900">{manager}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">作成日:</span>
                    <span className="font-medium text-gray-900">{createdDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Cost Total:</span>
                    <span className="font-bold text-gray-900">¥{costTotal.toLocaleString('ja-JP')}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button 
                  onClick={handleEdit}
                  className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending || isNavigating}
                >
                  編集
                </button>
                <button 
                  onClick={() => handleNavigation(`/${locale}/project-management`)} 
                  className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isPending || isNavigating}
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* タブナビゲーション */}
        <div className="bg-white shadow rounded-lg">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('保存されていない変更があります。変更を破棄してもよろしいですか？')) {
                    return;
                  }
                  setActiveTab('overview');
                }}
                className={`${
                  activeTab === 'overview'
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-700 border-transparent hover:bg-gray-50'
                } px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <DocumentIcon className="w-4 h-4 mr-2 inline-block" />
                概要
              </button>
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('保存されていない変更があります。変更を破棄してもよろしいですか？')) {
                    return;
                  }
                  setActiveTab('quotation');
                }}
                className={`${
                  activeTab === 'quotation'
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-700 border-transparent hover:bg-gray-50'
                } px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <ClipboardIcon className="w-4 h-4 mr-2 inline-block" />
                見積情報
              </button>
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('保存されていない変更があります。変更を破棄してもよろしいですか？')) {
                    return;
                  }
                  setActiveTab('po');
                }}
                className={`${
                  activeTab === 'po'
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-700 border-transparent hover:bg-gray-50'
                } px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <ShoppingCartIcon className="w-4 h-4 mr-2 inline-block" />
                発注情報
              </button>
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('保存されていない変更があります。変更を破棄してもよろしいですか？')) {
                    return;
                  }
                  setActiveTab('mechanical-drawing');
                }}
                className={`${
                  activeTab === 'mechanical-drawing'
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-700 border-transparent hover:bg-gray-50'
                } px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <CogIcon className="w-4 h-4 mr-2 inline-block" />
                機械部品（製作品）
              </button>
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('保存されていない変更があります。変更を破棄してもよろしいですか？')) {
                    return;
                  }
                  setActiveTab('electrical-drawing');
                }}
                className={`${
                  activeTab === 'electrical-drawing'
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-700 border-transparent hover:bg-gray-50'
                } px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <LightningBoltIcon className="w-4 h-4 mr-2 inline-block" />
                電気部品
              </button>
              <button
                onClick={() => {
                  if (hasUnsavedChanges && !confirm('保存されていない変更があります。変更を破棄してもよろしいですか？')) {
                    return;
                  }
                  setActiveTab('staff');
                }}
                className={`${
                  activeTab === 'staff'
                    ? 'text-blue-600 border-blue-600 bg-blue-50'
                    : 'text-gray-700 border-transparent hover:bg-gray-50'
                } px-4 py-2 border-b-2 font-medium text-sm transition-colors flex items-center`}
              >
                <UserIcon className="w-4 h-4 mr-2 inline-block" />
                担当者
              </button>
            </nav>
          </div>

          {/* タブコンテンツ */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">プロジェクト概要</h3>
              <div className="prose max-w-none">
                <p>プロジェクトの詳細情報や進捗状況をここに表示します。</p>
              </div>
            </div>
          )}

          {activeTab === 'quotation' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">見積情報</h3>
              {quotationRecord ? (
                <div>
                  <p className="mb-4">
                    見積番号: 
                    <TransitionLink 
                      href={`/${locale}/quotation/${quotationRecord}`}
                      className="text-indigo-600 hover:text-indigo-900 ml-2"
                    >
                      {quotationRecord}
                    </TransitionLink>
                  </p>
                  {/* 見積の詳細情報をここに表示 */}
                </div>
              ) : (
                <p className="text-gray-500">見積情報が登録されていません。</p>
              )}
            </div>
          )}

          {activeTab === 'po' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">発注情報</h3>
              {(record['POコード管理']?.value || record['PO_code']?.value) ? (
                <div>
                  <p className="mb-4">
                    POコード: 
                    <TransitionLink 
                      href={`/${locale}/po-management/${record['POコード管理']?.value || record['PO_code']?.value}`}
                      className="text-indigo-600 hover:text-indigo-900 ml-2"
                    >
                      {poId}
                    </TransitionLink>
                  </p>
                  {/* 発注の詳細情報をここに表示 */}
                </div>
              ) : (
                <p className="text-gray-500">発注情報が登録されていません。</p>
              )}
            </div>
          )}

          {activeTab === 'staff' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">担当者情報</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-sm text-gray-500">プロジェクト担当者:</span>
                  <p className="text-base font-medium">{manager}</p>
                </div>
                {/* その他の担当者情報をここに追加 */}
              </div>
            </div>
          )}

          {activeTab === 'mechanical-drawing' && (
            <div className="px-2 py-2">
              <div className="overflow-x-auto">
                <MechanicalPartsTable 
                  initialParts={[]} 
                  projectId={record['レコード番号'].value}
                  onUnsavedChanges={setHasUnsavedChanges}
                  onCostTotalChange={setMechanicalTotal}
                />
              </div>
            </div>
          )}

          {activeTab === 'electrical-drawing' && (
            <div className="px-2 py-2">
              <div className="overflow-x-auto">
                <ElectricalPartsTable 
                  initialParts={[]} 
                  projectId={record['レコード番号'].value}
                  onUnsavedChanges={setHasUnsavedChanges}
                  onCostTotalChange={setElectricalTotal}
                />
              </div>
            </div>
          )}
        </div>
      </div>
  </DashboardLayout>
  );
}