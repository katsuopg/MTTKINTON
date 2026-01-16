'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { BellIcon } from '@heroicons/react/24/outline'
import { BellAlertIcon } from '@heroicons/react/24/solid'

interface Notification {
  id: string
  type: string
  title: string
  message: string | null
  link: string | null
  is_read: boolean
  created_at: string
  metadata: Record<string, unknown>
}

const translations = {
  ja: {
    notifications: '通知',
    noNotifications: '通知はありません',
    markAllRead: 'すべて既読にする',
    viewAll: 'すべて見る',
    justNow: 'たった今',
    minutesAgo: '分前',
    hoursAgo: '時間前',
    daysAgo: '日前',
  },
  en: {
    notifications: 'Notifications',
    noNotifications: 'No notifications',
    markAllRead: 'Mark all as read',
    viewAll: 'View all',
    justNow: 'Just now',
    minutesAgo: 'min ago',
    hoursAgo: 'hours ago',
    daysAgo: 'days ago',
  },
  th: {
    notifications: 'การแจ้งเตือน',
    noNotifications: 'ไม่มีการแจ้งเตือน',
    markAllRead: 'ทำเครื่องหมายว่าอ่านแล้วทั้งหมด',
    viewAll: 'ดูทั้งหมด',
    justNow: 'เมื่อกี้',
    minutesAgo: 'นาทีที่แล้ว',
    hoursAgo: 'ชั่วโมงที่แล้ว',
    daysAgo: 'วันที่แล้ว',
  },
}

export default function NotificationBell() {
  const pathname = usePathname()
  const locale = pathname?.split('/')[1] || 'ja'

  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const t = translations[locale as keyof typeof translations] || translations.ja

  // 通知を取得
  const fetchNotifications = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/notifications?limit=10')
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 通知を既読にする
  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notificationId }),
      })
      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, is_read: true } : n))
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // 全て既読にする
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all: true }),
      })
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // 時間表示のフォーマット
  const formatTime = (dateStr: string) => {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return t.justNow
    if (diffMins < 60) return `${diffMins}${t.minutesAgo}`
    if (diffHours < 24) return `${diffHours}${t.hoursAgo}`
    return `${diffDays}${t.daysAgo}`
  }

  // 通知タイプごとのアイコン色
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'approval_request':
        return 'bg-yellow-100 text-yellow-600'
      case 'approval_done':
        return 'bg-green-100 text-green-600'
      case 'task_assigned':
        return 'bg-blue-100 text-blue-600'
      case 'comment':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  // 初回ロードとポーリング
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // 30秒ごとに更新
    return () => clearInterval(interval)
  }, [])

  // 外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="relative" ref={dropdownRef}>
      {/* ベルアイコン */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        aria-label={t.notifications}
      >
        {unreadCount > 0 ? (
          <BellAlertIcon className="h-6 w-6 text-primary" />
        ) : (
          <BellIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-danger text-xs font-medium text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ドロップダウン */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-boxdark rounded-lg shadow-lg border border-stroke dark:border-strokedark z-50">
          {/* ヘッダー */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-stroke dark:border-strokedark">
            <h3 className="font-semibold text-black dark:text-white">
              {t.notifications}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-primary hover:underline"
              >
                {t.markAllRead}
              </button>
            )}
          </div>

          {/* 通知リスト */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                {t.noNotifications}
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id)
                    }
                    if (notification.link) {
                      window.location.href = notification.link
                    }
                    setIsOpen(false)
                  }}
                  className={`px-4 py-3 border-b border-stroke dark:border-strokedark cursor-pointer hover:bg-gray-50 dark:hover:bg-meta-4 transition-colors ${
                    !notification.is_read ? 'bg-blue-50 dark:bg-meta-4/50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* 未読マーク */}
                    <div className="flex-shrink-0 mt-1">
                      {!notification.is_read && (
                        <span className="block h-2 w-2 rounded-full bg-primary"></span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 text-xs rounded ${getTypeColor(notification.type)}`}>
                          {notification.type.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatTime(notification.created_at)}
                        </span>
                      </div>
                      <p className="mt-1 font-medium text-sm text-black dark:text-white truncate">
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="mt-0.5 text-xs text-gray-500 truncate">
                          {notification.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* フッター */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-stroke dark:border-strokedark">
              <a
                href={`/${locale}/settings?tab=notifications`}
                className="block text-center text-sm text-primary hover:underline"
              >
                {t.viewAll}
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
