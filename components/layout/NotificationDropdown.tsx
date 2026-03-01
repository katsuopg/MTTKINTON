'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, ExternalLink } from 'lucide-react';

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

interface NotificationDropdownProps {
  locale: string;
}

const translations = {
  ja: {
    notifications: '通知',
    noNotifications: '通知はありません',
    markAllRead: 'すべて既読にする',
    viewAll: 'すべての通知を見る',
    justNow: 'たった今',
    minutesAgo: '分前',
    hoursAgo: '時間前',
    daysAgo: '日前',
  },
  en: {
    notifications: 'Notifications',
    noNotifications: 'No notifications',
    markAllRead: 'Mark all as read',
    viewAll: 'View all notifications',
    justNow: 'Just now',
    minutesAgo: 'min ago',
    hoursAgo: 'h ago',
    daysAgo: 'd ago',
  },
  th: {
    notifications: 'การแจ้งเตือน',
    noNotifications: 'ไม่มีการแจ้งเตือน',
    markAllRead: 'อ่านทั้งหมดแล้ว',
    viewAll: 'ดูการแจ้งเตือนทั้งหมด',
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

export default function NotificationDropdown({ locale }: NotificationDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th') ? locale : 'ja';
  const t = translations[lang];

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // サイレントフェイル
    }
  }, []);

  // 初回読み込み + 30秒ポーリング
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // ドロップダウン外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      fetchNotifications();
    }
  };

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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative flex items-center justify-center w-11 h-11 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-orange-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-dark rounded-2xl border border-gray-200 dark:border-gray-800 shadow-theme-lg overflow-hidden z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-theme-sm font-semibold text-gray-800 dark:text-white">
              {t.notifications}
              {unreadCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-bold text-white bg-orange-500 rounded-full">
                  {unreadCount}
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={isLoading}
                className="flex items-center gap-1 text-theme-xs text-brand-500 hover:text-brand-600 dark:text-brand-400 disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t.markAllRead}
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="text-theme-sm text-gray-500 dark:text-gray-400">{t.noNotifications}</p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li key={notification.id}>
                    <div
                      className={`flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer ${
                        !notification.is_read ? 'bg-brand-50/50 dark:bg-brand-500/5' : ''
                      }`}
                      onClick={() => {
                        if (!notification.is_read) {
                          handleMarkAsRead(notification.id);
                        }
                        if (notification.link) {
                          window.location.href = `/${locale}${notification.link}`;
                          setIsOpen(false);
                        }
                      }}
                    >
                      {/* Unread indicator */}
                      <div className="flex-shrink-0 pt-1.5">
                        {!notification.is_read ? (
                          <div className="w-2 h-2 bg-brand-500 rounded-full" />
                        ) : (
                          <div className="w-2 h-2" />
                        )}
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-theme-sm truncate ${
                          !notification.is_read
                            ? 'font-semibold text-gray-800 dark:text-white'
                            : 'text-gray-700 dark:text-gray-300'
                        }`}>
                          {notification.title}
                        </p>
                        {notification.message && (
                          <p className="text-theme-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {notification.message}
                          </p>
                        )}
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                          {formatTimeAgo(notification.created_at, t)}
                        </p>
                      </div>
                      {/* Actions */}
                      <div className="flex-shrink-0 flex items-start gap-1">
                        {!notification.is_read && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Mark as read"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {notification.link && (
                          <Link
                            href={`/${locale}${notification.link}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!notification.is_read) {
                                handleMarkAsRead(notification.id);
                              }
                              setIsOpen(false);
                            }}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 dark:border-gray-800">
            <Link
              href={`/${locale}/notifications`}
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-1 px-4 py-3 text-theme-sm text-brand-500 hover:text-brand-600 dark:text-brand-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              {t.viewAll}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
