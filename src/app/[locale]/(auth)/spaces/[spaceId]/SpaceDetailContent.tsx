'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { DetailPageHeader } from '@/components/ui/DetailPageHeader';
import { detailStyles } from '@/components/ui/DetailStyles';
import Tabs, { TabPanel } from '@/components/ui/Tabs';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  MessageSquare,
  Users,
  AppWindow,
  Plus,
  Send,
  ArrowLeft,
  Clock,
  MessageCircle,
  ExternalLink,
  Shield,
} from 'lucide-react';

interface SpaceDetailContentProps {
  locale: string;
  spaceId: string;
}

interface SpaceInfo {
  id: string;
  name: string;
  description: string | null;
}

interface Member {
  id: string;
  user_id: string;
  user_name: string;
  role: string;
}

interface SpaceApp {
  app_id: string;
  app_name: string;
  app_code: string;
}

interface Thread {
  id: string;
  title: string;
  body: string;
  created_by_name: string;
  reply_count: number;
  created_at: string;
}

interface Reply {
  id: string;
  body: string;
  created_by_name: string;
  created_at: string;
}

const t = (locale: string) => {
  const labels: Record<string, Record<string, string>> = {
    ja: {
      threads: 'スレッド',
      members: 'メンバー',
      apps: 'アプリ',
      newThread: '新規スレッド',
      title: 'タイトル',
      body: '本文',
      post: '投稿',
      reply: '返信',
      replyPlaceholder: '返信を入力...',
      noThreads: 'スレッドはまだありません',
      noMembers: 'メンバーはいません',
      noApps: '紐付きアプリはありません',
      back: '戻る',
      backToThreads: 'スレッド一覧へ',
      titlePlaceholder: 'スレッドのタイトル',
      bodyPlaceholder: 'スレッドの内容を入力...',
      replies: '件の返信',
      role: 'ロール',
      name: '名前',
      appName: 'アプリ名',
      posting: '投稿中...',
    },
    en: {
      threads: 'Threads',
      members: 'Members',
      apps: 'Apps',
      newThread: 'New Thread',
      title: 'Title',
      body: 'Body',
      post: 'Post',
      reply: 'Reply',
      replyPlaceholder: 'Write a reply...',
      noThreads: 'No threads yet',
      noMembers: 'No members',
      noApps: 'No linked apps',
      back: 'Back',
      backToThreads: 'Back to threads',
      titlePlaceholder: 'Thread title',
      bodyPlaceholder: 'Write thread content...',
      replies: 'replies',
      role: 'Role',
      name: 'Name',
      appName: 'App Name',
      posting: 'Posting...',
    },
    th: {
      threads: 'เธรด',
      members: 'สมาชิก',
      apps: 'แอป',
      newThread: 'เธรดใหม่',
      title: 'หัวข้อ',
      body: 'เนื้อหา',
      post: 'โพสต์',
      reply: 'ตอบกลับ',
      replyPlaceholder: 'เขียนการตอบกลับ...',
      noThreads: 'ยังไม่มีเธรด',
      noMembers: 'ไม่มีสมาชิก',
      noApps: 'ไม่มีแอปที่เชื่อมโยง',
      back: 'กลับ',
      backToThreads: 'กลับไปยังรายการเธรด',
      titlePlaceholder: 'หัวข้อเธรด',
      bodyPlaceholder: 'เขียนเนื้อหาเธรด...',
      replies: 'การตอบกลับ',
      role: 'บทบาท',
      name: 'ชื่อ',
      appName: 'ชื่อแอป',
      posting: 'กำลังโพสต์...',
    },
  };
  return labels[locale] || labels.ja;
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getRoleBadgeClass(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    case 'editor':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }
}

export default function SpaceDetailContent({ locale, spaceId }: SpaceDetailContentProps) {
  const router = useRouter();
  const labels = t(locale);

  const [loading, setLoading] = useState(true);
  const [space, setSpace] = useState<SpaceInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [apps, setApps] = useState<SpaceApp[]>([]);
  const [activeTab, setActiveTab] = useState('threads');

  // スレッド
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(false);
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [repliesLoading, setRepliesLoading] = useState(false);

  // フォーム
  const [showNewThread, setShowNewThread] = useState(false);
  const [threadTitle, setThreadTitle] = useState('');
  const [threadBody, setThreadBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [posting, setPosting] = useState(false);

  // スペース情報取得
  const fetchSpace = useCallback(async () => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setSpace(data.space || null);
      setMembers(data.members || []);
      setApps(data.apps || []);
    } catch (err) {
      console.error('Failed to fetch space:', err);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  // スレッド一覧取得
  const fetchThreads = useCallback(async () => {
    setThreadsLoading(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/threads`);
      if (!res.ok) throw new Error('fetch failed');
      const data = await res.json();
      setThreads(data.threads || []);
    } catch (err) {
      console.error('Failed to fetch threads:', err);
    } finally {
      setThreadsLoading(false);
    }
  }, [spaceId]);

  // スレッド詳細取得
  const fetchThreadDetail = useCallback(
    async (threadId: string) => {
      setRepliesLoading(true);
      try {
        const res = await fetch(`/api/spaces/${spaceId}/threads/${threadId}`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        if (data.thread) setSelectedThread(data.thread);
        setReplies(data.replies || []);
      } catch (err) {
        console.error('Failed to fetch thread detail:', err);
      } finally {
        setRepliesLoading(false);
      }
    },
    [spaceId]
  );

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  useEffect(() => {
    if (activeTab === 'threads') {
      fetchThreads();
    }
  }, [activeTab, fetchThreads]);

  // 新規スレッド投稿
  const handlePostThread = async () => {
    if (!threadTitle.trim() || !threadBody.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/threads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: threadTitle.trim(), body: threadBody.trim() }),
      });
      if (!res.ok) throw new Error('post failed');
      setThreadTitle('');
      setThreadBody('');
      setShowNewThread(false);
      await fetchThreads();
    } catch (err) {
      console.error('Failed to post thread:', err);
    } finally {
      setPosting(false);
    }
  };

  // 返信投稿
  const handlePostReply = async () => {
    if (!selectedThread || !replyBody.trim()) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/spaces/${spaceId}/threads/${selectedThread.id}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ body: replyBody.trim() }),
      });
      if (!res.ok) throw new Error('reply failed');
      setReplyBody('');
      await fetchThreadDetail(selectedThread.id);
    } catch (err) {
      console.error('Failed to post reply:', err);
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className={detailStyles.pageWrapper}>
        <LoadingSpinner />
      </div>
    );
  }

  if (!space) {
    return (
      <div className={detailStyles.pageWrapper}>
        <p className="text-center text-gray-500 dark:text-gray-400">Space not found</p>
      </div>
    );
  }

  const tabItems = [
    { key: 'threads', label: labels.threads, badge: threads.length, icon: <MessageSquare size={16} /> },
    { key: 'members', label: labels.members, badge: members.length, icon: <Users size={16} /> },
    { key: 'apps', label: labels.apps, badge: apps.length, icon: <AppWindow size={16} /> },
  ];

  return (
    <div className={detailStyles.pageWrapper}>
      <DetailPageHeader
        backHref={`/${locale}/spaces`}
        title={space.name}
      />

      {space.description && (
        <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4 mb-4">
          {space.description}
        </p>
      )}

      <Tabs
        tabs={tabItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        variant="underline"
      />

      {/* スレッドタブ */}
      <TabPanel value="threads" activeValue={activeTab} className="mt-4">
        {selectedThread ? (
          /* スレッド詳細 */
          <div className="space-y-4">
            <button
              onClick={() => {
                setSelectedThread(null);
                setReplies([]);
              }}
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
            >
              <ArrowLeft size={14} />
              {labels.backToThreads}
            </button>

            {/* スレッド本体 */}
            <div className={detailStyles.card}>
              <div className={detailStyles.cardHeaderWithBg}>
                <h3 className={detailStyles.cardTitle}>{selectedThread.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                  <span>{selectedThread.created_by_name}</span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {formatDate(selectedThread.created_at)}
                  </span>
                </div>
              </div>
              <div className={detailStyles.cardContent}>
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedThread.body}
                </p>
              </div>
            </div>

            {/* 返信一覧 */}
            <div className="space-y-3">
              {repliesLoading ? (
                <LoadingSpinner />
              ) : replies.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                  --
                </p>
              ) : (
                replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="ml-6 rounded-xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                        {reply.created_by_name}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {reply.body}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* 返信投稿 */}
            <div className="flex items-start gap-3">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder={labels.replyPlaceholder}
                rows={2}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 resize-none"
              />
              <button
                onClick={handlePostReply}
                disabled={!replyBody.trim() || posting}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send size={14} />
                {labels.reply}
              </button>
            </div>
          </div>
        ) : (
          /* スレッド一覧 */
          <div className="space-y-4">
            {/* 新規作成トグル */}
            {!showNewThread ? (
              <button
                onClick={() => setShowNewThread(true)}
                className={detailStyles.primaryButton}
              >
                <Plus size={16} className="mr-1.5" />
                {labels.newThread}
              </button>
            ) : (
              <div className={`${detailStyles.card} p-5`}>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={threadTitle}
                    onChange={(e) => setThreadTitle(e.target.value)}
                    placeholder={labels.titlePlaceholder}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500"
                    autoFocus
                  />
                  <textarea
                    value={threadBody}
                    onChange={(e) => setThreadBody(e.target.value)}
                    placeholder={labels.bodyPlaceholder}
                    rows={4}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 resize-none"
                  />
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => {
                        setShowNewThread(false);
                        setThreadTitle('');
                        setThreadBody('');
                      }}
                      className={detailStyles.secondaryButton}
                    >
                      {labels.back}
                    </button>
                    <button
                      onClick={handlePostThread}
                      disabled={!threadTitle.trim() || !threadBody.trim() || posting}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Send size={14} />
                      {posting ? labels.posting : labels.post}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* スレッドリスト */}
            {threadsLoading ? (
              <LoadingSpinner />
            ) : threads.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
                  {labels.noThreads}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {threads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => fetchThreadDetail(thread.id)}
                    className="rounded-xl border border-gray-200 bg-white p-4 hover:border-brand-300 hover:shadow-sm dark:border-gray-700 dark:bg-white/[0.03] dark:hover:border-brand-500/50 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                          {thread.title}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {thread.body}
                        </p>
                      </div>
                      <span className="flex-shrink-0 inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <MessageCircle size={12} />
                        {thread.reply_count}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                      <span>{thread.created_by_name}</span>
                      <span className="flex items-center gap-1">
                        <Clock size={10} />
                        {formatDate(thread.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </TabPanel>

      {/* メンバータブ */}
      <TabPanel value="members" activeValue={activeTab} className="mt-4">
        {members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {labels.noMembers}
            </p>
          </div>
        ) : (
          <div className={detailStyles.card}>
            <div className="overflow-x-auto">
              <table className={detailStyles.table}>
                <thead className={detailStyles.tableHead}>
                  <tr>
                    <th className={detailStyles.tableHeadCell}>{labels.name}</th>
                    <th className={detailStyles.tableHeadCell}>{labels.role}</th>
                  </tr>
                </thead>
                <tbody className={detailStyles.tableBody}>
                  {members.map((member) => (
                    <tr key={member.id} className={detailStyles.tableRow}>
                      <td className={detailStyles.tableCellPrimary}>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900 dark:text-brand-200 flex items-center justify-center text-sm font-medium">
                            {(member.user_name || '?')[0].toUpperCase()}
                          </div>
                          {member.user_name || member.user_id}
                        </div>
                      </td>
                      <td className={detailStyles.tableCell}>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeClass(member.role)}`}
                        >
                          <Shield size={10} />
                          {member.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </TabPanel>

      {/* アプリタブ */}
      <TabPanel value="apps" activeValue={activeTab} className="mt-4">
        {apps.length === 0 ? (
          <div className="text-center py-12">
            <AppWindow className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
              {labels.noApps}
            </p>
          </div>
        ) : (
          <div className={detailStyles.card}>
            <div className="overflow-x-auto">
              <table className={detailStyles.table}>
                <thead className={detailStyles.tableHead}>
                  <tr>
                    <th className={detailStyles.tableHeadCell}>{labels.appName}</th>
                    <th className={detailStyles.tableHeadCell}>Code</th>
                  </tr>
                </thead>
                <tbody className={detailStyles.tableBody}>
                  {apps.map((app) => (
                    <tr
                      key={app.app_id}
                      className={`${detailStyles.tableRow} cursor-pointer`}
                      onClick={() => router.push(`/${locale}/apps/${app.app_code}`)}
                    >
                      <td className={detailStyles.tableCellPrimary}>
                        <div className="flex items-center gap-2">
                          <AppWindow size={16} className="text-brand-500" />
                          <span className="hover:text-brand-500 transition-colors">
                            {app.app_name}
                          </span>
                          <ExternalLink size={12} className="text-gray-400" />
                        </div>
                      </td>
                      <td className={detailStyles.tableCell}>{app.app_code}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </TabPanel>
    </div>
  );
}
