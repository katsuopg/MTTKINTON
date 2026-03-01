'use client';

import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { FieldDefinition, FieldOption, MultiLangText, LookupCopyField, SubtableFieldDef } from '@/types/dynamic-app';
import { AUTO_FIELD_TYPES, DECORATIVE_FIELD_TYPES, REFERENCE_FIELD_TYPES, ENTITY_SELECT_TYPES, SUBTABLE_ALLOWED_TYPES, FIELD_TYPE_INFO } from '@/types/dynamic-app';

const labels = {
  ja: {
    settings: 'フィールド設定',
    noSelection: 'フィールドを選択してください',
    fieldCode: 'フィールドコード',
    labelJa: 'ラベル（日本語）',
    labelEn: 'ラベル（英語）',
    labelTh: 'ラベル（タイ語）',
    required: '必須',
    unique: 'ユニーク',
    defaultValue: 'デフォルト値',
    options: '選択肢',
    optionLabel: 'ラベル',
    optionValue: '値',
    addOption: '選択肢を追加',
    validationMin: '最小値',
    validationMax: '最大値',
    maxLength: '最大文字数',
    descJa: 'ヘルプテキスト（日本語）',
    descEn: 'ヘルプテキスト（英語）',
    colSpan: '幅',
    colSpanFull: '全幅',
    colSpanHalf: '半分',
    linkType: 'リンクタイプ',
    linkUrl: 'URL',
    linkTel: '電話番号',
    linkEmail: 'メールアドレス',
    autoFieldNote: 'このフィールドはレコードのメタデータから自動入力されます',
    decorativeNote: 'このフィールドはレイアウト用です。データは保持されません',
    lookupApp: '参照先アプリ',
    lookupKeyField: '検索キーフィールド',
    lookupCopyFields: 'コピーフィールド',
    lookupCopySource: '参照先',
    lookupCopyTarget: '自アプリ',
    lookupAddCopy: 'コピーを追加',
    lookupNote: '他のアプリのレコードを検索して、値をコピーします',
    relatedApp: '関連アプリ',
    relatedKeyField: '関連先フィールド',
    relatedThisField: '自アプリのフィールド',
    relatedDisplayFields: '表示フィールド',
    relatedNote: '条件に一致する関連アプリのレコードを自動表示します',
    formula: '計算式',
    formulaFormat: '表示フォーマット',
    formulaDecimals: '小数桁数',
    formulaNumber: '数値',
    formulaCurrency: '通貨',
    formulaPercent: 'パーセント',
    formulaNote: '他のフィールドの値を使って計算します（例: field_1 + field_2 * 0.1）',
    selectApp: 'アプリを選択...',
    selectField: 'フィールドを選択...',
    noApps: '利用可能なアプリがありません',
    subtableNote: 'テーブル形式で複数行のデータを管理します',
    subtableFields: 'テーブルフィールド',
    addSubtableField: 'フィールドを追加',
    subtableFieldType: 'タイプ',
    subtableFieldCode: 'コード',
    subtableFieldLabel: 'ラベル',
    subtableMinRows: '最小行数',
    subtableMaxRows: '最大行数',
    subtableAllowAdd: '行追加を許可',
    subtableAllowDelete: '行削除を許可',
    entityNote: 'ユーザー・組織・グループを選択できるフィールドです',
    allowMultiple: '複数選択を許可',
  },
  en: {
    settings: 'Field Settings',
    noSelection: 'Select a field to edit',
    fieldCode: 'Field Code',
    labelJa: 'Label (Japanese)',
    labelEn: 'Label (English)',
    labelTh: 'Label (Thai)',
    required: 'Required',
    unique: 'Unique',
    defaultValue: 'Default Value',
    options: 'Options',
    optionLabel: 'Label',
    optionValue: 'Value',
    addOption: 'Add option',
    validationMin: 'Min value',
    validationMax: 'Max value',
    maxLength: 'Max length',
    descJa: 'Help text (Japanese)',
    descEn: 'Help text (English)',
    colSpan: 'Width',
    colSpanFull: 'Full width',
    colSpanHalf: 'Half width',
    linkType: 'Link Type',
    linkUrl: 'URL',
    linkTel: 'Phone Number',
    linkEmail: 'Email',
    autoFieldNote: 'This field is automatically populated from record metadata',
    decorativeNote: 'This field is for layout only. No data is stored',
    lookupApp: 'Lookup App',
    lookupKeyField: 'Key Field',
    lookupCopyFields: 'Copy Fields',
    lookupCopySource: 'Source',
    lookupCopyTarget: 'Target',
    lookupAddCopy: 'Add copy',
    lookupNote: 'Search records from another app and copy field values',
    relatedApp: 'Related App',
    relatedKeyField: 'Related Field',
    relatedThisField: 'This App Field',
    relatedDisplayFields: 'Display Fields',
    relatedNote: 'Automatically display related records matching a condition',
    formula: 'Formula',
    formulaFormat: 'Format',
    formulaDecimals: 'Decimal Places',
    formulaNumber: 'Number',
    formulaCurrency: 'Currency',
    formulaPercent: 'Percent',
    formulaNote: 'Calculate using other field values (e.g., field_1 + field_2 * 0.1)',
    selectApp: 'Select app...',
    selectField: 'Select field...',
    noApps: 'No apps available',
    subtableNote: 'Manage multiple rows of data in a table format',
    subtableFields: 'Table Fields',
    addSubtableField: 'Add Field',
    subtableFieldType: 'Type',
    subtableFieldCode: 'Code',
    subtableFieldLabel: 'Label',
    subtableMinRows: 'Min rows',
    subtableMaxRows: 'Max rows',
    subtableAllowAdd: 'Allow add rows',
    subtableAllowDelete: 'Allow delete rows',
    entityNote: 'A field to select users, organizations, or groups',
    allowMultiple: 'Allow multiple selection',
  },
  th: {
    settings: 'การตั้งค่าฟิลด์',
    noSelection: 'เลือกฟิลด์เพื่อแก้ไข',
    fieldCode: 'รหัสฟิลด์',
    labelJa: 'ป้ายกำกับ (ญี่ปุ่น)',
    labelEn: 'ป้ายกำกับ (อังกฤษ)',
    labelTh: 'ป้ายกำกับ (ไทย)',
    required: 'จำเป็น',
    unique: 'ไม่ซ้ำ',
    defaultValue: 'ค่าเริ่มต้น',
    options: 'ตัวเลือก',
    optionLabel: 'ป้ายกำกับ',
    optionValue: 'ค่า',
    addOption: 'เพิ่มตัวเลือก',
    validationMin: 'ค่าต่ำสุด',
    validationMax: 'ค่าสูงสุด',
    maxLength: 'จำนวนตัวอักษรสูงสุด',
    descJa: 'ข้อความช่วยเหลือ (ญี่ปุ่น)',
    descEn: 'ข้อความช่วยเหลือ (อังกฤษ)',
    colSpan: 'ความกว้าง',
    colSpanFull: 'เต็มความกว้าง',
    colSpanHalf: 'ครึ่งหนึ่ง',
    linkType: 'ประเภทลิงก์',
    linkUrl: 'URL',
    linkTel: 'หมายเลขโทรศัพท์',
    linkEmail: 'อีเมล',
    autoFieldNote: 'ฟิลด์นี้จะถูกกรอกอัตโนมัติจากข้อมูลเมตาของระเบียน',
    decorativeNote: 'ฟิลด์นี้ใช้สำหรับเลย์เอาต์เท่านั้น ไม่มีการจัดเก็บข้อมูล',
    lookupApp: 'แอปอ้างอิง',
    lookupKeyField: 'ฟิลด์คีย์',
    lookupCopyFields: 'ฟิลด์คัดลอก',
    lookupCopySource: 'ต้นทาง',
    lookupCopyTarget: 'ปลายทาง',
    lookupAddCopy: 'เพิ่มคัดลอก',
    lookupNote: 'ค้นหาระเบียนจากแอปอื่นและคัดลอกค่า',
    relatedApp: 'แอปที่เกี่ยวข้อง',
    relatedKeyField: 'ฟิลด์ที่เกี่ยวข้อง',
    relatedThisField: 'ฟิลด์แอปนี้',
    relatedDisplayFields: 'ฟิลด์แสดงผล',
    relatedNote: 'แสดงระเบียนจากแอปที่เกี่ยวข้องที่ตรงกับเงื่อนไขโดยอัตโนมัติ',
    formula: 'สูตร',
    formulaFormat: 'รูปแบบ',
    formulaDecimals: 'ทศนิยม',
    formulaNumber: 'ตัวเลข',
    formulaCurrency: 'สกุลเงิน',
    formulaPercent: 'เปอร์เซ็นต์',
    formulaNote: 'คำนวณโดยใช้ค่าฟิลด์อื่น (เช่น field_1 + field_2 * 0.1)',
    selectApp: 'เลือกแอป...',
    selectField: 'เลือกฟิลด์...',
    noApps: 'ไม่มีแอปที่ใช้ได้',
    subtableNote: 'จัดการข้อมูลหลายแถวในรูปแบบตาราง',
    subtableFields: 'ฟิลด์ตาราง',
    addSubtableField: 'เพิ่มฟิลด์',
    subtableFieldType: 'ประเภท',
    subtableFieldCode: 'รหัส',
    subtableFieldLabel: 'ป้ายกำกับ',
    subtableMinRows: 'แถวขั้นต่ำ',
    subtableMaxRows: 'แถวสูงสุด',
    subtableAllowAdd: 'อนุญาตเพิ่มแถว',
    subtableAllowDelete: 'อนุญาตลบแถว',
    entityNote: 'ฟิลด์สำหรับเลือกผู้ใช้ องค์กร หรือกลุ่ม',
    allowMultiple: 'อนุญาตเลือกหลายรายการ',
  },
};

interface AppInfo {
  code: string;
  name: string;
}

interface RemoteField {
  field_code: string;
  field_type: string;
  label: { ja?: string; en?: string; th?: string };
}

interface FieldSettingsProps {
  locale: string;
  field: FieldDefinition | null;
  allFields: FieldDefinition[];
  currentAppCode: string;
  onUpdateField: (fieldId: string, updates: Partial<FieldDefinition>) => void;
  onClose: () => void;
}

export default function FieldSettings({ locale, field, allFields, currentAppCode, onUpdateField, onClose }: FieldSettingsProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const t = labels[lang];

  // 参照フィールド用: 動的アプリ一覧
  const [apps, setApps] = useState<AppInfo[]>([]);
  const [remoteFields, setRemoteFields] = useState<RemoteField[]>([]);
  const isReferenceField = field ? REFERENCE_FIELD_TYPES.has(field.field_type) : false;

  // アプリ一覧取得
  useEffect(() => {
    if (!isReferenceField) return;
    fetch('/api/apps')
      .then(r => r.ok ? r.json() : { apps: [] })
      .then(data => {
        const list = (data.apps || [])
          .filter((a: { code: string; app_type: string; is_active: boolean }) => a.is_active && a.app_type === 'dynamic' && a.code !== currentAppCode)
          .map((a: { code: string; name: string }) => ({ code: a.code, name: a.name }));
        setApps(list);
      })
      .catch(() => {});
  }, [isReferenceField, currentAppCode]);

  // 選択されたアプリのフィールド取得
  const selectedAppCode = field?.validation?.lookup_app_code || field?.validation?.related_app_code || '';
  useEffect(() => {
    if (!selectedAppCode) { setRemoteFields([]); return; }
    fetch(`/api/apps/${selectedAppCode}/fields`)
      .then(r => r.ok ? r.json() : { fields: [] })
      .then(data => {
        setRemoteFields((data.fields || []).map((f: FieldDefinition) => ({
          field_code: f.field_code,
          field_type: f.field_type,
          label: f.label,
        })));
      })
      .catch(() => setRemoteFields([]));
  }, [selectedAppCode]);

  if (!field) {
    return (
      <div className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-center p-4">
        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">{t.noSelection}</p>
      </div>
    );
  }

  const isAutoField = AUTO_FIELD_TYPES.has(field.field_type);
  const isDecorativeField = DECORATIVE_FIELD_TYPES.has(field.field_type);
  const hasOptions = ['dropdown', 'checkbox', 'radio_button', 'multi_select'].includes(field.field_type);

  const updateLabel = (key: keyof MultiLangText, value: string) => {
    onUpdateField(field.id, { label: { ...field.label, [key]: value } });
  };

  const updateDescription = (key: keyof MultiLangText, value: string) => {
    onUpdateField(field.id, { description: { ...field.description, [key]: value } });
  };

  const updateOption = (index: number, key: keyof FieldOption, value: string | MultiLangText) => {
    const options = [...(field.options || [])];
    if (key === 'label') {
      options[index] = { ...options[index], label: value as MultiLangText };
    } else {
      options[index] = { ...options[index], [key]: value as string };
    }
    onUpdateField(field.id, { options });
  };

  const addOption = () => {
    const options = [...(field.options || [])];
    options.push({ label: { ja: '', en: '', th: '' }, value: `option_${options.length + 1}` });
    onUpdateField(field.id, { options });
  };

  const removeOption = (index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    onUpdateField(field.id, { options });
  };

  const inputClass = "w-full px-2.5 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white";
  const labelClass = "block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1";

  return (
    <div className="w-72 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 overflow-y-auto">
      <div className="p-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            {t.settings}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          {/* 自動フィールド注意書き */}
          {isAutoField && (
            <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md px-2.5 py-2">
              {t.autoFieldNote}
            </p>
          )}

          {/* 装飾フィールド注意書き */}
          {isDecorativeField && (
            <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-md px-2.5 py-2">
              {t.decorativeNote}
            </p>
          )}

          {/* フィールドコード（自動/装飾は読取専用） */}
          <div>
            <label className={labelClass}>{t.fieldCode}</label>
            {isAutoField ? (
              <p className="px-2.5 py-1.5 text-sm font-mono text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md">
                {field.field_code}
              </p>
            ) : (
              <input
                type="text"
                value={field.field_code}
                onChange={(e) => onUpdateField(field.id, { field_code: e.target.value.replace(/[^a-zA-Z0-9_]/g, '') })}
                className={`${inputClass} font-mono`}
              />
            )}
          </div>

          {/* ラベル（装飾のspace/hrは不要） */}
          {field.field_type !== 'space' && field.field_type !== 'hr' && (
            <>
              <div>
                <label className={labelClass}>{t.labelJa}</label>
                <input
                  type="text"
                  value={field.label.ja || ''}
                  onChange={(e) => updateLabel('ja', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t.labelEn}</label>
                <input
                  type="text"
                  value={field.label.en || ''}
                  onChange={(e) => updateLabel('en', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t.labelTh}</label>
                <input
                  type="text"
                  value={field.label.th || ''}
                  onChange={(e) => updateLabel('th', e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {/* 必須 / ユニーク（自動・装飾・related_records・calculated・subtableは非表示） */}
          {!isAutoField && !isDecorativeField && field.field_type !== 'related_records' && field.field_type !== 'calculated' && field.field_type !== 'subtable' && (
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={field.required}
                  onChange={(e) => onUpdateField(field.id, { required: e.target.checked })}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                {t.required}
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={field.unique_field}
                  onChange={(e) => onUpdateField(field.id, { unique_field: e.target.checked })}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                {t.unique}
              </label>
            </div>
          )}

          {/* 幅設定 */}
          <div>
            <label className={labelClass}>{t.colSpan}</label>
            <select
              value={field.col_span}
              onChange={(e) => onUpdateField(field.id, { col_span: parseInt(e.target.value) })}
              className={inputClass}
            >
              <option value={2}>{t.colSpanFull}</option>
              <option value={1}>{t.colSpanHalf}</option>
            </select>
          </div>

          {/* 数値フィールドのバリデーション */}
          {field.field_type === 'number' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>{t.validationMin}</label>
                <input
                  type="number"
                  value={field.validation?.min ?? ''}
                  onChange={(e) => onUpdateField(field.id, {
                    validation: { ...field.validation, min: e.target.value ? Number(e.target.value) : undefined },
                  })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t.validationMax}</label>
                <input
                  type="number"
                  value={field.validation?.max ?? ''}
                  onChange={(e) => onUpdateField(field.id, {
                    validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined },
                  })}
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* テキストフィールドの最大文字数 */}
          {(field.field_type === 'single_line_text' || field.field_type === 'multi_line_text') && (
            <div>
              <label className={labelClass}>{t.maxLength}</label>
              <input
                type="number"
                value={field.validation?.max ?? ''}
                onChange={(e) => onUpdateField(field.id, {
                  validation: { ...field.validation, max: e.target.value ? Number(e.target.value) : undefined },
                })}
                className={inputClass}
              />
            </div>
          )}

          {/* リンクタイプ */}
          {field.field_type === 'link' && (
            <div>
              <label className={labelClass}>{t.linkType}</label>
              <select
                value={field.validation?.link_type || 'url'}
                onChange={(e) => onUpdateField(field.id, {
                  validation: { ...field.validation, link_type: e.target.value as 'url' | 'tel' | 'email' },
                })}
                className={inputClass}
              >
                <option value="url">{t.linkUrl}</option>
                <option value="tel">{t.linkTel}</option>
                <option value="email">{t.linkEmail}</option>
              </select>
            </div>
          )}

          {/* ファイルアップロード設定 */}
          {field.field_type === 'file_upload' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>
                  {lang === 'ja' ? '最大サイズ (MB)' : lang === 'th' ? 'ขนาดสูงสุด (MB)' : 'Max Size (MB)'}
                </label>
                <input
                  type="number"
                  value={field.validation?.max_file_size ?? 50}
                  onChange={(e) => onUpdateField(field.id, {
                    validation: { ...field.validation, max_file_size: e.target.value ? Number(e.target.value) : undefined },
                  })}
                  className={inputClass}
                  min={1}
                  max={50}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {lang === 'ja' ? '最大ファイル数' : lang === 'th' ? 'จำนวนไฟล์สูงสุด' : 'Max Files'}
                </label>
                <input
                  type="number"
                  value={field.validation?.max_files ?? 5}
                  onChange={(e) => onUpdateField(field.id, {
                    validation: { ...field.validation, max_files: e.target.value ? Number(e.target.value) : undefined },
                  })}
                  className={inputClass}
                  min={1}
                  max={20}
                />
              </div>
            </div>
          )}

          {/* ルックアップ設定 */}
          {field.field_type === 'lookup' && (
            <div className="space-y-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-md px-2.5 py-2">
                {t.lookupNote}
              </p>
              <div>
                <label className={labelClass}>{t.lookupApp}</label>
                <select
                  value={field.validation?.lookup_app_code || ''}
                  onChange={(e) => onUpdateField(field.id, {
                    validation: { ...field.validation, lookup_app_code: e.target.value, lookup_key_field: '', lookup_copy_fields: [] },
                  })}
                  className={inputClass}
                >
                  <option value="">{t.selectApp}</option>
                  {apps.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                </select>
              </div>
              {field.validation?.lookup_app_code && (
                <>
                  <div>
                    <label className={labelClass}>{t.lookupKeyField}</label>
                    <select
                      value={field.validation?.lookup_key_field || ''}
                      onChange={(e) => onUpdateField(field.id, {
                        validation: { ...field.validation, lookup_key_field: e.target.value },
                      })}
                      className={inputClass}
                    >
                      <option value="">{t.selectField}</option>
                      {remoteFields.map(f => (
                        <option key={f.field_code} value={f.field_code}>
                          {f.label[lang] || f.label.ja || f.field_code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t.lookupCopyFields}</label>
                    <div className="space-y-1.5">
                      {(field.validation?.lookup_copy_fields || []).map((cf: LookupCopyField, i: number) => (
                        <div key={i} className="flex items-center gap-1">
                          <select
                            value={cf.source_field}
                            onChange={(e) => {
                              const copies = [...(field.validation?.lookup_copy_fields || [])];
                              copies[i] = { ...copies[i], source_field: e.target.value };
                              onUpdateField(field.id, { validation: { ...field.validation, lookup_copy_fields: copies } });
                            }}
                            className="flex-1 px-1.5 py-1 text-xs border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">{t.lookupCopySource}</option>
                            {remoteFields.map(f => (
                              <option key={f.field_code} value={f.field_code}>
                                {f.label[lang] || f.label.ja || f.field_code}
                              </option>
                            ))}
                          </select>
                          <span className="text-xs text-gray-400">→</span>
                          <select
                            value={cf.target_field}
                            onChange={(e) => {
                              const copies = [...(field.validation?.lookup_copy_fields || [])];
                              copies[i] = { ...copies[i], target_field: e.target.value };
                              onUpdateField(field.id, { validation: { ...field.validation, lookup_copy_fields: copies } });
                            }}
                            className="flex-1 px-1.5 py-1 text-xs border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                          >
                            <option value="">{t.lookupCopyTarget}</option>
                            {allFields.filter(f => f.id !== field.id).map(f => (
                              <option key={f.field_code} value={f.field_code}>
                                {f.label[lang] || f.label.ja || f.field_code}
                              </option>
                            ))}
                          </select>
                          <button type="button" onClick={() => {
                            const copies = [...(field.validation?.lookup_copy_fields || [])];
                            copies.splice(i, 1);
                            onUpdateField(field.id, { validation: { ...field.validation, lookup_copy_fields: copies } });
                          }} className="p-0.5 text-gray-400 hover:text-red-500">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button type="button" onClick={() => {
                        const copies = [...(field.validation?.lookup_copy_fields || []), { source_field: '', target_field: '' }];
                        onUpdateField(field.id, { validation: { ...field.validation, lookup_copy_fields: copies } });
                      }} className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600">
                        <Plus className="w-3 h-3" />
                        {t.lookupAddCopy}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 関連レコード設定 */}
          {field.field_type === 'related_records' && (
            <div className="space-y-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-md px-2.5 py-2">
                {t.relatedNote}
              </p>
              <div>
                <label className={labelClass}>{t.relatedApp}</label>
                <select
                  value={field.validation?.related_app_code || ''}
                  onChange={(e) => onUpdateField(field.id, {
                    validation: { ...field.validation, related_app_code: e.target.value, related_key_field: '', related_display_fields: [] },
                  })}
                  className={inputClass}
                >
                  <option value="">{t.selectApp}</option>
                  {apps.map(a => <option key={a.code} value={a.code}>{a.name}</option>)}
                </select>
              </div>
              {field.validation?.related_app_code && (
                <>
                  <div>
                    <label className={labelClass}>{t.relatedKeyField}</label>
                    <select
                      value={field.validation?.related_key_field || ''}
                      onChange={(e) => onUpdateField(field.id, {
                        validation: { ...field.validation, related_key_field: e.target.value },
                      })}
                      className={inputClass}
                    >
                      <option value="">{t.selectField}</option>
                      {remoteFields.map(f => (
                        <option key={f.field_code} value={f.field_code}>
                          {f.label[lang] || f.label.ja || f.field_code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t.relatedThisField}</label>
                    <select
                      value={field.validation?.related_this_field || ''}
                      onChange={(e) => onUpdateField(field.id, {
                        validation: { ...field.validation, related_this_field: e.target.value },
                      })}
                      className={inputClass}
                    >
                      <option value="">{t.selectField}</option>
                      {allFields.filter(f => f.id !== field.id && !REFERENCE_FIELD_TYPES.has(f.field_type)).map(f => (
                        <option key={f.field_code} value={f.field_code}>
                          {f.label[lang] || f.label.ja || f.field_code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>{t.relatedDisplayFields}</label>
                    <div className="space-y-1">
                      {remoteFields.map(rf => {
                        const isSelected = (field.validation?.related_display_fields || []).includes(rf.field_code);
                        return (
                          <label key={rf.field_code} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const current = [...(field.validation?.related_display_fields || [])];
                                if (e.target.checked) current.push(rf.field_code);
                                else { const idx = current.indexOf(rf.field_code); if (idx >= 0) current.splice(idx, 1); }
                                onUpdateField(field.id, { validation: { ...field.validation, related_display_fields: current } });
                              }}
                              className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                            />
                            {rf.label[lang] || rf.label.ja || rf.field_code}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* 計算フィールド設定 */}
          {field.field_type === 'calculated' && (
            <div className="space-y-3">
              <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded-md px-2.5 py-2">
                {t.formulaNote}
              </p>
              <div>
                <label className={labelClass}>{t.formula}</label>
                <input
                  type="text"
                  value={field.validation?.formula || ''}
                  onChange={(e) => onUpdateField(field.id, {
                    validation: { ...field.validation, formula: e.target.value },
                  })}
                  className={`${inputClass} font-mono`}
                  placeholder="field_1 + field_2 * 0.1"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {allFields
                    .filter(f => f.id !== field.id && f.field_type === 'number')
                    .map(f => (
                      <button
                        key={f.field_code}
                        type="button"
                        onClick={() => {
                          const cur = field.validation?.formula || '';
                          onUpdateField(field.id, {
                            validation: { ...field.validation, formula: cur ? `${cur} + ${f.field_code}` : f.field_code },
                          });
                        }}
                        className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        {f.label[lang] || f.field_code}
                      </button>
                    ))
                  }
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>{t.formulaFormat}</label>
                  <select
                    value={field.validation?.formula_format || 'number'}
                    onChange={(e) => onUpdateField(field.id, {
                      validation: { ...field.validation, formula_format: e.target.value as 'number' | 'currency' | 'percent' },
                    })}
                    className={inputClass}
                  >
                    <option value="number">{t.formulaNumber}</option>
                    <option value="currency">{t.formulaCurrency}</option>
                    <option value="percent">{t.formulaPercent}</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t.formulaDecimals}</label>
                  <input
                    type="number"
                    value={field.validation?.formula_decimals ?? 2}
                    onChange={(e) => onUpdateField(field.id, {
                      validation: { ...field.validation, formula_decimals: Number(e.target.value) },
                    })}
                    className={inputClass}
                    min={0}
                    max={10}
                  />
                </div>
              </div>
            </div>
          )}

          {/* サブテーブル設定 */}
          {field.field_type === 'subtable' && (
            <div className="space-y-3">
              <p className="text-xs text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 rounded-md px-2.5 py-2">
                {t.subtableNote}
              </p>
              {/* 子フィールド一覧 */}
              <div>
                <label className={labelClass}>{t.subtableFields}</label>
                <div className="space-y-2">
                  {(field.validation?.subtable_fields || []).map((sf, idx) => (
                    <div key={idx} className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <select
                          value={sf.field_type}
                          onChange={(e) => {
                            const updated = [...(field.validation?.subtable_fields || [])];
                            updated[idx] = { ...updated[idx], field_type: e.target.value as SubtableFieldDef['field_type'] };
                            onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        >
                          {Array.from(SUBTABLE_ALLOWED_TYPES).map(ft => (
                            <option key={ft} value={ft}>{FIELD_TYPE_INFO[ft]?.label[lang] || ft}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (field.validation?.subtable_fields || []).filter((_, i) => i !== idx);
                            onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                          }}
                          className="p-1 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={sf.field_code}
                          onChange={(e) => {
                            const updated = [...(field.validation?.subtable_fields || [])];
                            updated[idx] = { ...updated[idx], field_code: e.target.value };
                            onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                          }}
                          placeholder={t.subtableFieldCode}
                          className="px-2 py-1 text-xs border border-gray-300 rounded font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <input
                          type="text"
                          value={sf.label[lang] || ''}
                          onChange={(e) => {
                            const updated = [...(field.validation?.subtable_fields || [])];
                            updated[idx] = { ...updated[idx], label: { ...updated[idx].label, [lang]: e.target.value } };
                            onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                          }}
                          placeholder={t.subtableFieldLabel}
                          className="px-2 py-1 text-xs border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                      </div>
                      {/* 選択肢系はoptions設定 */}
                      {['dropdown', 'radio_button', 'checkbox', 'multi_select'].includes(sf.field_type) && (
                        <div className="pl-2 space-y-1">
                          {(sf.options || []).map((opt, oi) => (
                            <div key={oi} className="flex items-center gap-1">
                              <input
                                type="text"
                                value={opt.label[lang] || ''}
                                onChange={(e) => {
                                  const updated = [...(field.validation?.subtable_fields || [])];
                                  const opts = [...(updated[idx].options || [])];
                                  opts[oi] = { ...opts[oi], label: { ...opts[oi].label, [lang]: e.target.value } };
                                  updated[idx] = { ...updated[idx], options: opts };
                                  onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                                }}
                                placeholder={t.optionLabel}
                                className="flex-1 px-1.5 py-0.5 text-[10px] border border-gray-200 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                              <input
                                type="text"
                                value={opt.value}
                                onChange={(e) => {
                                  const updated = [...(field.validation?.subtable_fields || [])];
                                  const opts = [...(updated[idx].options || [])];
                                  opts[oi] = { ...opts[oi], value: e.target.value };
                                  updated[idx] = { ...updated[idx], options: opts };
                                  onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                                }}
                                placeholder={t.optionValue}
                                className="w-16 px-1.5 py-0.5 text-[10px] border border-gray-200 rounded font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...(field.validation?.subtable_fields || [])];
                                  const opts = (updated[idx].options || []).filter((_, i) => i !== oi);
                                  updated[idx] = { ...updated[idx], options: opts };
                                  onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                                }}
                                className="p-0.5 text-gray-300 hover:text-red-500"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(field.validation?.subtable_fields || [])];
                              const opts = [...(updated[idx].options || []), { label: { ja: '', en: '', th: '' }, value: `opt_${(updated[idx].options?.length || 0) + 1}` }];
                              updated[idx] = { ...updated[idx], options: opts };
                              onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                            }}
                            className="text-[10px] text-brand-500 hover:text-brand-600"
                          >
                            + {t.addOption}
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      const newSubField: SubtableFieldDef = {
                        field_code: `col_${(field.validation?.subtable_fields?.length || 0) + 1}`,
                        field_type: 'single_line_text',
                        label: { ja: '', en: '', th: '' },
                      };
                      const updated = [...(field.validation?.subtable_fields || []), newSubField];
                      onUpdateField(field.id, { validation: { ...field.validation, subtable_fields: updated } });
                    }}
                    className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
                  >
                    <Plus className="w-3 h-3" />
                    {t.addSubtableField}
                  </button>
                </div>
              </div>
              {/* 行設定 */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={labelClass}>{t.subtableMinRows}</label>
                  <input
                    type="number"
                    value={field.validation?.subtable_config?.min_rows ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      onUpdateField(field.id, { validation: { ...field.validation, subtable_config: { ...field.validation?.subtable_config, min_rows: val } } });
                    }}
                    className={inputClass}
                    min={0}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className={labelClass}>{t.subtableMaxRows}</label>
                  <input
                    type="number"
                    value={field.validation?.subtable_config?.max_rows ?? ''}
                    onChange={(e) => {
                      const val = e.target.value ? Number(e.target.value) : undefined;
                      onUpdateField(field.id, { validation: { ...field.validation, subtable_config: { ...field.validation?.subtable_config, max_rows: val } } });
                    }}
                    className={inputClass}
                    min={0}
                    placeholder="∞"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={field.validation?.subtable_config?.allow_add !== false}
                    onChange={(e) => onUpdateField(field.id, {
                      validation: { ...field.validation, subtable_config: { ...field.validation?.subtable_config, allow_add: e.target.checked } },
                    })}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  {t.subtableAllowAdd}
                </label>
                <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={field.validation?.subtable_config?.allow_delete !== false}
                    onChange={(e) => onUpdateField(field.id, {
                      validation: { ...field.validation, subtable_config: { ...field.validation?.subtable_config, allow_delete: e.target.checked } },
                    })}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                  {t.subtableAllowDelete}
                </label>
              </div>
            </div>
          )}

          {/* エンティティ選択設定（user_select, org_select, group_select） */}
          {ENTITY_SELECT_TYPES.has(field.field_type) && (
            <div className="space-y-3">
              <p className="text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 rounded-md px-2.5 py-2">
                {t.entityNote}
              </p>
              <label className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={field.validation?.allow_multiple === true}
                  onChange={(e) => onUpdateField(field.id, {
                    validation: { ...field.validation, allow_multiple: e.target.checked },
                  })}
                  className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                />
                {t.allowMultiple}
              </label>
            </div>
          )}

          {/* 選択肢エディタ（dropdown, checkbox, radio_button, multi_select） */}
          {hasOptions && (
            <div>
              <label className={labelClass}>{t.options}</label>
              <div className="space-y-2">
                {(field.options || []).map((option, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={option.label[lang] || ''}
                      onChange={(e) => updateOption(index, 'label', { ...option.label, [lang]: e.target.value })}
                      placeholder={t.optionLabel}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) => updateOption(index, 'value', e.target.value)}
                      placeholder={t.optionValue}
                      className="w-20 px-2 py-1 text-xs border border-gray-300 rounded font-mono dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addOption}
                  className="flex items-center gap-1 text-xs text-brand-500 hover:text-brand-600"
                >
                  <Plus className="w-3 h-3" />
                  {t.addOption}
                </button>
              </div>
            </div>
          )}

          {/* ヘルプテキスト（装飾フィールド以外） */}
          {!isDecorativeField && (
            <>
              <div>
                <label className={labelClass}>{t.descJa}</label>
                <input
                  type="text"
                  value={field.description?.ja || ''}
                  onChange={(e) => updateDescription('ja', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>{t.descEn}</label>
                <input
                  type="text"
                  value={field.description?.en || ''}
                  onChange={(e) => updateDescription('en', e.target.value)}
                  className={inputClass}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
