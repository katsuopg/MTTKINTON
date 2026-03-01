'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { detailStyles } from '@/components/ui/DetailStyles';
import {
  FileText, Hash, Calendar, ChevronDown, CheckSquare, AlignLeft,
  Briefcase, Users, ShoppingCart, Clipboard, Database, Settings,
  Star, Heart, Zap, Globe, BookOpen, Layers, Package, Truck,
  ArrowLeft, ArrowRight, Check, Loader2,
} from 'lucide-react';

const AVAILABLE_ICONS = [
  { name: 'FileText', component: FileText },
  { name: 'Hash', component: Hash },
  { name: 'Calendar', component: Calendar },
  { name: 'ChevronDown', component: ChevronDown },
  { name: 'CheckSquare', component: CheckSquare },
  { name: 'AlignLeft', component: AlignLeft },
  { name: 'Briefcase', component: Briefcase },
  { name: 'Users', component: Users },
  { name: 'ShoppingCart', component: ShoppingCart },
  { name: 'Clipboard', component: Clipboard },
  { name: 'Database', component: Database },
  { name: 'Settings', component: Settings },
  { name: 'Star', component: Star },
  { name: 'Heart', component: Heart },
  { name: 'Zap', component: Zap },
  { name: 'Globe', component: Globe },
  { name: 'BookOpen', component: BookOpen },
  { name: 'Layers', component: Layers },
  { name: 'Package', component: Package },
  { name: 'Truck', component: Truck },
];

const AVAILABLE_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#6366F1',
];

const labels = {
  ja: {
    step1: '基本情報',
    step2: '確認',
    appName: 'アプリ名',
    appNameJa: 'アプリ名（日本語）',
    appNameEn: 'アプリ名（英語）',
    appNameTh: 'アプリ名（タイ語）',
    appCode: 'アプリコード',
    appCodeHelp: '英小文字・数字・アンダースコアのみ（例: task_management）',
    description: '説明',
    icon: 'アイコン',
    color: 'テーマカラー',
    back: '戻る',
    next: '次へ',
    create: '作成',
    creating: '作成中...',
    required: '必須',
    confirmTitle: '入力内容の確認',
    createSuccess: 'アプリが作成されました',
    createError: 'アプリの作成に失敗しました',
  },
  en: {
    step1: 'Basic Info',
    step2: 'Confirm',
    appName: 'App Name',
    appNameJa: 'App Name (Japanese)',
    appNameEn: 'App Name (English)',
    appNameTh: 'App Name (Thai)',
    appCode: 'App Code',
    appCodeHelp: 'Only lowercase letters, numbers, and underscores (e.g., task_management)',
    description: 'Description',
    icon: 'Icon',
    color: 'Theme Color',
    back: 'Back',
    next: 'Next',
    create: 'Create',
    creating: 'Creating...',
    required: 'Required',
    confirmTitle: 'Confirm Details',
    createSuccess: 'App created successfully',
    createError: 'Failed to create app',
  },
  th: {
    step1: 'ข้อมูลพื้นฐาน',
    step2: 'ยืนยัน',
    appName: 'ชื่อแอป',
    appNameJa: 'ชื่อแอป (ญี่ปุ่น)',
    appNameEn: 'ชื่อแอป (อังกฤษ)',
    appNameTh: 'ชื่อแอป (ไทย)',
    appCode: 'รหัสแอป',
    appCodeHelp: 'ใช้ตัวอักษรเล็ก ตัวเลข และขีดล่างเท่านั้น (เช่น task_management)',
    description: 'คำอธิบาย',
    icon: 'ไอคอน',
    color: 'สีธีม',
    back: 'กลับ',
    next: 'ถัดไป',
    create: 'สร้าง',
    creating: 'กำลังสร้าง...',
    required: 'จำเป็น',
    confirmTitle: 'ยืนยันข้อมูล',
    createSuccess: 'สร้างแอปสำเร็จ',
    createError: 'ไม่สามารถสร้างแอปได้',
  },
};

interface TemplateInfo {
  id: string;
  name: string;
  name_en?: string;
  name_th?: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface NewAppContentProps {
  locale: string;
  templateInfo?: TemplateInfo | null;
}

export default function NewAppContent({ locale, templateInfo }: NewAppContentProps) {
  const router = useRouter();
  const t = labels[locale as keyof typeof labels] || labels.en;

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // フォーム状態
  const [nameJa, setNameJa] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameTh, setNameTh] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(templateInfo?.icon || 'FileText');
  const [selectedColor, setSelectedColor] = useState(templateInfo?.color || AVAILABLE_COLORS[0]);

  // アプリ名（日本語）からコードを自動生成
  const handleNameJaChange = (value: string) => {
    setNameJa(value);
    if (!code || code === nameJa.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')) {
      // 基本的なローマ字変換は行わず、ユーザーに手動入力を促す
    }
  };

  const isStep1Valid = nameJa.trim() !== '' && code.trim() !== '' && /^[a-z][a-z0-9_]*$/.test(code);

  const handleCreate = async () => {
    setSaving(true);
    setError('');

    try {
      let url: string;
      let body: Record<string, unknown>;

      if (templateInfo) {
        // テンプレートからアプリ作成
        url = `/api/apps/templates/${templateInfo.id}/create`;
        body = {
          code,
          name: nameJa,
          name_en: nameEn || null,
          name_th: nameTh || null,
          description: description || null,
          icon: selectedIcon,
          color: selectedColor,
        };
      } else {
        // 通常のアプリ作成
        url = '/api/apps';
        body = {
          code,
          name: nameJa,
          name_en: nameEn || null,
          name_th: nameTh || null,
          description: description || null,
          icon: selectedIcon,
          color: selectedColor,
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t.createError);
      }

      // テンプレートから作成した場合はアプリ一覧へ、通常はフォーム設計画面へ
      if (templateInfo) {
        router.push(`/${locale}/apps/${code}`);
      } else {
        router.push(`/${locale}/apps/${code}/settings/form`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.createError);
      setSaving(false);
    }
  };

  const SelectedIconComponent = AVAILABLE_ICONS.find((i) => i.name === selectedIcon)?.component || FileText;

  return (
    <div className={detailStyles.pageWrapper}>
      {/* ステップインジケーター */}
      <div className="flex items-center justify-center gap-4 mb-8">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              s <= step
                ? 'bg-brand-500 text-white'
                : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {s < step ? <Check className="w-4 h-4" /> : s}
            </div>
            <span className={`text-sm ${s <= step ? 'text-gray-800 dark:text-white font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
              {s === 1 ? t.step1 : t.step2}
            </span>
            {s < 2 && <div className="w-12 h-px bg-gray-300 dark:bg-gray-600 mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: 基本情報 */}
      {step === 1 && (
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className={detailStyles.cardTitle}>
              {t.step1}
              {templateInfo && (
                <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 font-normal">
                  Template: {templateInfo.name}
                </span>
              )}
            </h2>
          </div>
          <div className={detailStyles.cardContent}>
            <div className="space-y-5 max-w-2xl">
              {/* アプリ名（日本語） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.appNameJa} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nameJa}
                  onChange={(e) => handleNameJaChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="例: タスク管理"
                />
              </div>

              {/* アプリ名（英語） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.appNameEn}
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="e.g., Task Management"
                />
              </div>

              {/* アプリ名（タイ語） */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.appNameTh}
                </label>
                <input
                  type="text"
                  value={nameTh}
                  onChange={(e) => setNameTh(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="เช่น การจัดการงาน"
                />
              </div>

              {/* アプリコード */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.appCode} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono"
                  placeholder="task_management"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.appCodeHelp}</p>
              </div>

              {/* 説明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t.description}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              {/* アイコン選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.icon}
                </label>
                <div className="grid grid-cols-10 gap-2">
                  {AVAILABLE_ICONS.map(({ name, component: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSelectedIcon(name)}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg border transition-all ${
                        selectedIcon === name
                          ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400'
                          : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </button>
                  ))}
                </div>
              </div>

              {/* カラー選択 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.color}
                </label>
                <div className="flex gap-3">
                  {AVAILABLE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        selectedColor === color ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: 確認 */}
      {step === 2 && (
        <div className={detailStyles.card}>
          <div className={detailStyles.cardHeaderWithBg}>
            <h2 className={detailStyles.cardTitle}>{t.confirmTitle}</h2>
          </div>
          <div className={detailStyles.cardContent}>
            <div className="max-w-2xl space-y-4">
              {/* プレビューカード */}
              <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                  style={{ backgroundColor: selectedColor }}
                >
                  <SelectedIconComponent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">{nameJa}</h3>
                  {nameEn && <p className="text-sm text-gray-500 dark:text-gray-400">{nameEn}</p>}
                </div>
              </div>

              <div className={detailStyles.grid2}>
                <div>
                  <p className={detailStyles.fieldLabel}>{t.appCode}</p>
                  <p className={`${detailStyles.fieldValue} font-mono`}>{code}</p>
                </div>
                <div>
                  <p className={detailStyles.fieldLabel}>{t.appNameJa}</p>
                  <p className={detailStyles.fieldValue}>{nameJa}</p>
                </div>
                {nameEn && (
                  <div>
                    <p className={detailStyles.fieldLabel}>{t.appNameEn}</p>
                    <p className={detailStyles.fieldValue}>{nameEn}</p>
                  </div>
                )}
                {nameTh && (
                  <div>
                    <p className={detailStyles.fieldLabel}>{t.appNameTh}</p>
                    <p className={detailStyles.fieldValue}>{nameTh}</p>
                  </div>
                )}
                {description && (
                  <div className="md:col-span-2">
                    <p className={detailStyles.fieldLabel}>{t.description}</p>
                    <p className={detailStyles.fieldValue}>{description}</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ナビゲーションボタン */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => {
            if (step === 1) {
              router.back();
            } else {
              setStep(step - 1);
            }
          }}
          className={detailStyles.secondaryButton}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t.back}
        </button>

        {step === 1 ? (
          <button
            onClick={() => setStep(2)}
            disabled={!isStep1Valid}
            className={`${detailStyles.primaryButton} ${!isStep1Valid ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {t.next}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleCreate}
            disabled={saving}
            className={`${detailStyles.primaryButton} ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t.creating}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t.create}
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
