'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { AppListToolbar } from '@/components/ui/AppListToolbar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Users, Lock, Globe, Plus, X, Trash2 } from 'lucide-react';

interface Space {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  icon: string | null;
  color: string | null;
  created_at: string;
  member_count?: number;
}

interface SpacesContentProps {
  locale: string;
}

const t = (locale: string) => {
  const labels: Record<string, Record<string, string>> = {
    ja: {
      title: 'スペース',
      search: 'スペース名で検索...',
      newSpace: '新規作成',
      members: 'メンバー',
      private: '非公開',
      public: '公開',
      noSpaces: 'スペースがありません',
      createFirst: '最初のスペースを作成しましょう',
      name: 'スペース名',
      description: '説明',
      isPrivate: '非公開にする',
      create: '作成',
      cancel: 'キャンセル',
      namePlaceholder: 'スペース名を入力',
      descPlaceholder: '説明を入力（任意）',
      delete: '削除',
      deleteConfirm: 'このスペースを削除しますか？',
      count: '件',
    },
    en: {
      title: 'Spaces',
      search: 'Search spaces...',
      newSpace: 'New Space',
      members: 'members',
      private: 'Private',
      public: 'Public',
      noSpaces: 'No spaces found',
      createFirst: 'Create your first space',
      name: 'Space Name',
      description: 'Description',
      isPrivate: 'Make private',
      create: 'Create',
      cancel: 'Cancel',
      namePlaceholder: 'Enter space name',
      descPlaceholder: 'Enter description (optional)',
      delete: 'Delete',
      deleteConfirm: 'Delete this space?',
      count: ' items',
    },
    th: {
      title: 'สเปซ',
      search: 'ค้นหาสเปซ...',
      newSpace: 'สร้างใหม่',
      members: 'สมาชิก',
      private: 'ส่วนตัว',
      public: 'สาธารณะ',
      noSpaces: 'ไม่พบสเปซ',
      createFirst: 'สร้างสเปซแรกของคุณ',
      name: 'ชื่อสเปซ',
      description: 'คำอธิบาย',
      isPrivate: 'ทำให้เป็นส่วนตัว',
      create: 'สร้าง',
      cancel: 'ยกเลิก',
      namePlaceholder: 'กรอกชื่อสเปซ',
      descPlaceholder: 'กรอกคำอธิบาย (ไม่บังคับ)',
      delete: 'ลบ',
      deleteConfirm: 'ลบสเปซนี้หรือไม่?',
      count: ' รายการ',
    },
  };
  return labels[locale] || labels.ja;
};

export default function SpacesContent({ locale }: SpacesContentProps) {
  const router = useRouter();
  const labels = t(locale);

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // フォーム
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPrivate, setFormPrivate] = useState(false);

  const fetchSpaces = useCallback(async () => {
    try {
      const res = await fetch('/api/spaces');
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setSpaces(data.spaces || []);
    } catch (err) {
      console.error('Failed to fetch spaces:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSpaces();
  }, [fetchSpaces]);

  const filtered = useMemo(() => {
    if (!search) return spaces;
    const q = search.toLowerCase();
    return spaces.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
    );
  }, [spaces, search]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch('/api/spaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formName.trim(),
          description: formDesc.trim() || undefined,
          is_private: formPrivate,
        }),
      });
      if (!res.ok) throw new Error('create failed');
      setShowModal(false);
      setFormName('');
      setFormDesc('');
      setFormPrivate(false);
      await fetchSpaces();
    } catch (err) {
      console.error('Failed to create space:', err);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, spaceId: string) => {
    e.stopPropagation();
    if (!confirm(labels.deleteConfirm)) return;
    try {
      await fetch(`/api/spaces?id=${spaceId}`, { method: 'DELETE' });
      await fetchSpaces();
    } catch (err) {
      console.error('Failed to delete space:', err);
    }
  };

  if (loading) {
    return (
      <div className={tableStyles.contentWrapper}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <AppListToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={labels.search}
          totalCount={filtered.length}
          countLabel={labels.count}
          addButton={{
            label: labels.newSpace,
            onClick: () => setShowModal(true),
            icon: <Plus size={16} />,
          }}
          locale={locale}
        />

        {/* カードグリッド */}
        <div className="p-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
              <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                {labels.noSpaces}
              </p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {labels.createFirst}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((space) => (
                <div
                  key={space.id}
                  onClick={() => router.push(`/${locale}/spaces/${space.id}`)}
                  className="group relative rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:bg-white/[0.03] dark:hover:border-brand-500/50 transition-all cursor-pointer"
                >
                  {/* ヘッダー */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: space.color || '#4F46E5' }}
                      >
                        <Users size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                          {space.name}
                        </h3>
                        {space.description && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {space.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* 削除ボタン */}
                    <button
                      onClick={(e) => handleDelete(e, space.id)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                      title={labels.delete}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {/* フッター */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Users size={12} />
                      {space.member_count ?? '-'} {labels.members}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        space.is_private
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}
                    >
                      {space.is_private ? (
                        <>
                          <Lock size={10} />
                          {labels.private}
                        </>
                      ) : (
                        <>
                          <Globe size={10} />
                          {labels.public}
                        </>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 新規作成モーダル */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowModal(false)}
          />
          <div className="relative w-full max-w-md mx-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {labels.newSpace}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 名前 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.name} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={labels.namePlaceholder}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400"
                  autoFocus
                />
              </div>

              {/* 説明 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {labels.description}
                </label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  placeholder={labels.descPlaceholder}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-400 resize-none"
                />
              </div>

              {/* 非公開 */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formPrivate}
                  onChange={(e) => setFormPrivate(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {labels.isPrivate}
                </span>
                <Lock size={14} className="text-gray-400" />
              </label>
            </div>

            {/* アクション */}
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:text-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                {labels.cancel}
              </button>
              <button
                onClick={handleCreate}
                disabled={!formName.trim() || creating}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {creating ? '...' : labels.create}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
