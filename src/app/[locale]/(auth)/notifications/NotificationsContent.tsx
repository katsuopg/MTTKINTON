'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Check, CheckCheck, ExternalLink, Filter } from 'lucide-react';
import { tableStyles } from '@/components/ui/TableStyles';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/ui/Pagination';
import { ListPageHeader } from '@/components/ui/ListPageHeader';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, unknown>;
}

interface NotificationsContentProps {
  locale: string;
}

const translations = {
  ja: {
    notifications: '通知',
    all: 'すべて',
    unread: '未読',
    read: '既読',
    markAllRead: 'すべて既読にする',
    markAsRead: '既読にする',
    noNotifications: '通知はありません',
    noUnread: '未読の通知はありません',
    searchPlaceholder: '通知を検索...',
    count: '件',
    open: '開く',
    justNow: 'たった今',
    minutesAgo: '分前',
    hoursAgo: '時間前',
    daysAgo: '日前',
  },
  en: {
    notifications: 'Notifications',
    all: 'All',
    unread: 'Unread',
    read: 'Read',
    markAllRead: 'Mark all as read',
    markAsRead: 'Mark as read',
    noNotifications: 'No notifications',
    noUnread: 'No unread notifications',
    searchPlaceholder: 'Search notifications...',
    count: '',
    open: 'Open',
    justNow: 'Just now',
    minutesAgo: 'min ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
  },
  th: {
    notifications: 'การแจ้งเตือน',
    all: 'ทั้งหมด',
    unread: 'ยังไม่อ่าน',
    read: 'อ่านแล้ว',
    markAllRead: 'อ่านทั้งหมดแล้ว',
    markAsRead: 'ทำเครื่องหมายว่าอ่านแล้ว',
    noNotifications: 'ไม่มีการแจ้งเตือน',
    noUnread: 'ไม่มีการแจ้งเตือนที่ยังไม่อ่าน',
    searchPlaceholder: 'ค้นหาการแจ้งเตือน...',
    count: 'รายการ',
    open: 'เปิด',
    justNow: 'เมื่อสักครู่',
    minutesAgo: 'นาทีที่แล้ว',
    hoursAgo: 'ชม.ที่แล้ว',
    daysAgo: 'วันที่แล้ว',
  },
};

function formatTimeAgo(dateStr: string, t: typeof translations.ja): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t.justNow;
  if (diffMin < 60) return `${diffMin}${t.minutesAgo}`;
  if (diffHours < 24) return `${diffHours}${t.hoursAgo}`;
  return `${diffDays}${t.daysAgo}`;
}

function formatDate(dateStr: string, locale: string): string {
  return new Date(dateStr).toLocaleString(
    locale === 'ja' ? 'ja-JP' : locale === 'th' ? 'th-TH' : 'en-US',
    { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
  );
}

export default function NotificationsContent({ locale }: NotificationsContentProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th') ? locale : 'ja';
  const t = translations[lang];

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=200');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // サイレントフェイル
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // サイレントフェイル
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // サイレントフェイル
    }
  };

  // フィルタリング + 検索
  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread' && n.is_read) return false;
    if (filter === 'read' && !n.is_read) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        (n.message && n.message.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const { paginatedItems, currentPage, totalPages, totalItems, pageSize, goToPage } =
    usePagination(filteredNotifications, { pageSize: 20 });

  if (isLoading) {
    return (
      <div className={tableStyles.contentWrapper}>
        <div className={tableStyles.tableContainer}>
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
          </div>
        </div>
      </div>
    );
  }

  const filterSelect = (
    <select
      value={filter}
      onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
      className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-theme-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
    >
      <option value="all">{t.all}</option>
      <option value="unread">{t.unread} ({unreadCount})</option>
      <option value="read">{t.read}</option>
    </select>
  );

  const markAllButton = unreadCount > 0 ? {
    label: t.markAllRead,
    onClick: handleMarkAllRead,
    icon: <CheckCheck className="w-4 h-4" />,
  } : undefined;

  return (
    <div className={tableStyles.contentWrapper}>
      <div className={tableStyles.tableContainer}>
        <ListPageHeader
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder={t.searchPlaceholder}
          totalCount={totalItems}
          countLabel={t.count}
          filters={filterSelect}
          addButton={markAllButton}
        />

        {/* Notification List */}
        {paginatedItems.length === 0 ? (
          <div className="py-16 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-theme-sm text-gray-500 dark:text-gray-400">
              {filter === 'unread' ? t.noUnread : t.noNotifications}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {paginatedItems.map((notification) => (
              <div
                key={notification.id}
                className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${
                  !notification.is_read ? 'bg-brand-50/30 dark:bg-brand-500/5' : ''
                }`}
              >
                {/* Unread indicator */}
                <div className="flex-shrink-0 pt-1">
                  {!notification.is_read ? (
                    <div className="w-2.5 h-2.5 bg-brand-500 rounded-full" />
                  ) : (
                    <div className="w-2.5 h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-theme-sm ${
                        !notification.is_read
                          ? 'font-semibold text-gray-800 dark:text-white'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-theme-sm text-gray-500 dark:text-gray-400 mt-1">
                          {notification.message}
                        </p>
                      )}
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-theme-xs text-gray-400 dark:text-gray-500">
                          {formatTimeAgo(notification.created_at, t)}
                        </span>
                        <span className="text-theme-xs text-gray-300 dark:text-gray-600">
                          {formatDate(notification.created_at, locale)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-theme-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title={t.markAsRead}
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.markAsRead}</span>
                        </button>
                      )}
                      {notification.link && (
                        <a
                          href={`/${locale}${notification.link}`}
                          onClick={() => {
                            if (!notification.is_read) handleMarkAsRead(notification.id);
                          }}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-theme-xs text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">{t.open}</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={goToPage}
          locale={locale}
        />
      </div>
    </div>
  );
}
