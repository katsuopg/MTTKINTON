'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { MENU_ITEMS, COMMON_MENU_KEYS, type MenuItemDef } from '@/lib/navigation/menu-items';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

interface MenuManagementProps {
  locale: string;
}

interface Organization {
  id: string;
  code: string;
  name: string;
  name_en: string | null;
  name_th: string | null;
}

interface MenuConfigRow {
  menu_key: string;
  display_order: number;
  is_visible: boolean;
}

interface MenuItemState {
  key: string;
  name: string;
  icon: string;
  is_visible: boolean;
}

export default function MenuManagement({ locale }: MenuManagementProps) {
  const { toast } = useToast();
  const { confirmDialog } = useConfirmDialog();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [items, setItems] = useState<MenuItemState[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<string>('');

  // DnD state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragCounterRef = useRef(0);

  const label = (ja: string, th: string, en: string) =>
    locale === 'ja' ? ja : locale === 'th' ? th : en;

  const getOrgName = (org: Organization) => {
    if (locale === 'en' && org.name_en) return org.name_en;
    if (locale === 'th' && org.name_th) return org.name_th;
    return org.name;
  };

  const getMenuItemName = (def: MenuItemDef) => {
    const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'ja') as 'ja' | 'en' | 'th';
    return def.name[lang];
  };

  const buildDefaultItems = useCallback((): MenuItemState[] => {
    return MENU_ITEMS.map((def) => ({
      key: def.key,
      name: getMenuItemName(def),
      icon: def.icon,
      is_visible: true,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const buildItemsFromConfig = useCallback((config: MenuConfigRow[]): MenuItemState[] => {
    const configMap = new Map(config.map((c) => [c.menu_key, c]));
    const configured: { item: MenuItemState; order: number }[] = [];
    const unconfigured: MenuItemState[] = [];

    for (const def of MENU_ITEMS) {
      const cfg = configMap.get(def.key);
      const item: MenuItemState = {
        key: def.key,
        name: getMenuItemName(def),
        icon: def.icon,
        is_visible: cfg ? cfg.is_visible : true,
      };

      if (cfg) {
        configured.push({ item, order: cfg.display_order });
      } else {
        unconfigured.push(item);
      }
    }

    configured.sort((a, b) => a.order - b.order);
    return [...configured.map((c) => c.item), ...unconfigured];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  const fetchOrganizations = useCallback(async () => {
    try {
      const res = await fetch('/api/organizations');
      if (res.ok) {
        const data = await res.json();
        setOrganizations(data.organizations || []);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    }
  }, []);

  const fetchMenuConfig = useCallback(async (orgId: string | null) => {
    setLoading(true);
    try {
      const url = orgId
        ? `/api/menu-configurations?organization_id=${orgId}`
        : '/api/menu-configurations';
      const res = await fetch(url);

      if (res.ok) {
        const data = await res.json();
        const configItems: MenuConfigRow[] = data.items || [];

        if (configItems.length > 0) {
          const built = buildItemsFromConfig(configItems);
          setItems(built);
          setInitialSnapshot(JSON.stringify(built));
        } else {
          const defaults = buildDefaultItems();
          setItems(defaults);
          setInitialSnapshot(JSON.stringify(defaults));
        }
      } else {
        const defaults = buildDefaultItems();
        setItems(defaults);
        setInitialSnapshot(JSON.stringify(defaults));
      }

      setHasChanges(false);
    } catch (err) {
      console.error('Error fetching menu config:', err);
      const defaults = buildDefaultItems();
      setItems(defaults);
      setInitialSnapshot(JSON.stringify(defaults));
      setHasChanges(false);
    } finally {
      setLoading(false);
    }
  }, [buildItemsFromConfig, buildDefaultItems]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  useEffect(() => {
    fetchMenuConfig(selectedOrgId);
  }, [selectedOrgId, fetchMenuConfig]);

  // 変更検知
  useEffect(() => {
    if (initialSnapshot) {
      setHasChanges(JSON.stringify(items) !== initialSnapshot);
    }
  }, [items, initialSnapshot]);

  const handleOrgChange = async (newOrgId: string | null) => {
    if (hasChanges) {
      const confirmed = await confirmDialog({
        title: label('未保存の変更', 'การเปลี่ยนแปลงที่ยังไม่ได้บันทึก', 'Unsaved Changes'),
        message: label(
          '未保存の変更があります。破棄して切り替えますか？',
          'มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก ยกเลิกและเปลี่ยน?',
          'You have unsaved changes. Discard and switch?'
        ),
        variant: 'warning',
        confirmLabel: label('破棄', 'ยกเลิก', 'Discard'),
        cancelLabel: label('キャンセル', 'ยกเลิก', 'Cancel'),
      });
      if (!confirmed) return;
    }
    setSelectedOrgId(newOrgId);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        organization_id: selectedOrgId,
        items: items.map((item, index) => ({
          menu_key: item.key,
          display_order: index,
          is_visible: item.is_visible,
        })),
      };

      const res = await fetch('/api/menu-configurations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        toast({ type: 'success', title: label('メニュー設定を保存しました', 'บันทึกการตั้งค่าเมนูสำเร็จ', 'Menu configuration saved') });
        setInitialSnapshot(JSON.stringify(items));
        setHasChanges(false);
      } else {
        toast({ type: 'error', title: label('保存に失敗しました', 'บันทึกไม่สำเร็จ', 'Failed to save') });
      }
    } catch (err) {
      console.error('Error saving menu config:', err);
      toast({ type: 'error', title: label('保存に失敗しました', 'บันทึกไม่สำเร็จ', 'Failed to save') });
    } finally {
      setSaving(false);
    }
  };

  const handleResetToDefault = async () => {
    const confirmed = await confirmDialog({
      title: label('デフォルトに戻す', 'รีเซ็ตเป็นค่าเริ่มต้น', 'Reset to Default'),
      message: label(
        'メニュー設定をデフォルトに戻しますか？保存済みの設定は削除されます。',
        'รีเซ็ตการตั้งค่าเมนูเป็นค่าเริ่มต้น? การตั้งค่าที่บันทึกจะถูกลบ',
        'Reset menu configuration to default? Saved settings will be deleted.'
      ),
      variant: 'danger',
      confirmLabel: label('リセット', 'รีเซ็ต', 'Reset'),
      cancelLabel: label('キャンセル', 'ยกเลิก', 'Cancel'),
    });
    if (!confirmed) return;

    try {
      const url = selectedOrgId
        ? `/api/menu-configurations?organization_id=${selectedOrgId}`
        : '/api/menu-configurations';
      const res = await fetch(url, { method: 'DELETE' });

      if (res.ok) {
        toast({ type: 'success', title: label('デフォルトに戻しました', 'รีเซ็ตเป็นค่าเริ่มต้นสำเร็จ', 'Reset to default') });
        const defaults = buildDefaultItems();
        setItems(defaults);
        setInitialSnapshot(JSON.stringify(defaults));
        setHasChanges(false);
      } else {
        toast({ type: 'error', title: label('リセットに失敗しました', 'รีเซ็ตไม่สำเร็จ', 'Failed to reset') });
      }
    } catch (err) {
      console.error('Error resetting menu config:', err);
      toast({ type: 'error', title: label('リセットに失敗しました', 'รีเซ็ตไม่สำเร็จ', 'Failed to reset') });
    }
  };

  const toggleVisibility = (index: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], is_visible: !updated[index].is_visible };
      return updated;
    });
  };

  // DnD handlers（AppPermissionSettingsと同一パターン）
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragEnter = (index: number) => {
    dragCounterRef.current++;
    if (dragIndex !== null && index !== dragIndex) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      dragCounterRef.current = 0;
      return;
    }

    const reordered = [...items];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(dropIndex, 0, moved);

    setItems(reordered);
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
    dragCounterRef.current = 0;
  };

  // アイコンレンダリング（DashboardLayoutと同じアイコンセット）
  const renderIcon = (iconName: string) => {
    const icons: Record<string, React.ReactNode> = {
      home: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
      document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      clipboard: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
      users: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
      userGroup: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      truck: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />,
      user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      list: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
      fileQuestion: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /><circle cx="12" cy="10" r="3" strokeWidth={1.5} /></>,
      cart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />,
      calculator: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
      clipboardDoc: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />,
      documentText: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
      chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      dollar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      cog: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
      settings: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></>,
      database: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />,
    };
    return (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {icons[iconName]}
      </svg>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header: 組織セレクト + ボタン */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex items-center gap-3 flex-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
            {label('対象', 'เป้าหมาย', 'Target')}:
          </label>
          <select
            value={selectedOrgId ?? ''}
            onChange={(e) => handleOrgChange(e.target.value || null)}
            className="flex-1 max-w-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500"
          >
            <option value="">{label('デフォルト（全社）', 'ค่าเริ่มต้น (ทั้งบริษัท)', 'Default (All)')}</option>
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {getOrgName(org)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetToDefault}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            {label('デフォルトに戻す', 'รีเซ็ตเป็นค่าเริ่มต้น', 'Reset to Default')}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              saving || !hasChanges
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-brand-500 hover:bg-brand-600'
            }`}
          >
            {saving
              ? label('保存中...', 'กำลังบันทึก...', 'Saving...')
              : label('保存', 'บันทึก', 'Save')}
          </button>
        </div>
      </div>

      {hasChanges && (
        <div className="flex items-center gap-2 px-3 py-2 text-sm bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-400">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {label('未保存の変更があります', 'มีการเปลี่ยนแปลงที่ยังไม่ได้บันทึก', 'You have unsaved changes')}
        </div>
      )}

      {/* メニュー項目リスト */}
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-medium text-gray-800 dark:text-white/90">
            {label('メニュー項目', 'รายการเมนู', 'Menu Items')}
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {label(
              'ドラッグ&ドロップで並び替え、チェックボックスで表示/非表示を切り替えます。',
              'ลากและวางเพื่อจัดเรียง ใช้ช่องกาเครื่องหมายเพื่อแสดง/ซ่อน',
              'Drag & drop to reorder, use checkboxes to show/hide items.'
            )}
          </p>
        </div>

        <ul className="divide-y divide-gray-100 dark:divide-gray-700/50">
          {items.map((item, index) => (
            <li
              key={item.key}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragEnter={() => handleDragEnter(index)}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                dragIndex === index ? 'opacity-50 bg-gray-50 dark:bg-gray-700/50' : ''
              } ${
                dragOverIndex === index ? 'border-t-2 border-brand-500' : ''
              } ${
                !item.is_visible ? 'opacity-50' : ''
              } hover:bg-gray-50 dark:hover:bg-gray-700/30`}
            >
              {/* ドラッグハンドル */}
              <span className="cursor-grab active:cursor-grabbing text-gray-400 text-lg select-none shrink-0">
                ⠿
              </span>

              {/* チェックボックス */}
              <input
                type="checkbox"
                checked={item.is_visible}
                onChange={() => toggleVisibility(index)}
                className="rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500 shrink-0"
              />

              {/* アイコン */}
              <span className={`shrink-0 ${item.is_visible ? 'text-gray-600 dark:text-gray-300' : 'text-gray-400 dark:text-gray-500'}`}>
                {renderIcon(item.icon)}
              </span>

              {/* メニュー名 */}
              <span className={`text-sm font-medium ${
                item.is_visible
                  ? 'text-gray-800 dark:text-white/90'
                  : 'text-gray-400 dark:text-gray-500 line-through'
              }`}>
                {item.name}
              </span>

              {/* 共通項目バッジ */}
              {COMMON_MENU_KEYS.includes(item.key) && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {label('共通', 'ทั่วไป', 'Common')}
                </span>
              )}

              {!item.is_visible && (
                <span className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                  {label('非表示', 'ซ่อน', 'Hidden')}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
