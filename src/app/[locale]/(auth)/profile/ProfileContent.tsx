'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface UserInfo {
  id: string;
  email: string;
  employeeName: string;
  employeeRole: string;
  employeeNumber: string;
  nickname: string;
  avatarUrl: string;
  department?: string;
  employeeId?: string;
}

interface ProfileContentProps {
  locale: string;
  language: 'ja' | 'en' | 'th';
  user: UserInfo;
}

export default function ProfileContent({ locale, language, user }: ProfileContentProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [nickname, setNickname] = useState(user.nickname);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const labels = {
    ja: {
      title: 'プロフィール',
      nickname: 'ニックネーム',
      nicknamePlaceholder: 'ニックネームを入力',
      edit: '編集',
      save: '保存',
      cancel: 'キャンセル',
      saving: '保存中...',
      saveSuccess: '保存しました',
      saveError: '保存に失敗しました',
      noEmployee: '従業員情報が見つかりません',
      notSet: '未設定',
      changePhoto: '写真を変更',
      uploading: 'アップロード中...',
      uploadSuccess: '画像をアップロードしました',
    },
    en: {
      title: 'Profile',
      nickname: 'Nickname',
      nicknamePlaceholder: 'Enter nickname',
      edit: 'Edit',
      save: 'Save',
      cancel: 'Cancel',
      saving: 'Saving...',
      saveSuccess: 'Saved successfully',
      saveError: 'Failed to save',
      noEmployee: 'Employee not found',
      notSet: 'Not set',
      changePhoto: 'Change Photo',
      uploading: 'Uploading...',
      uploadSuccess: 'Image uploaded',
    },
    th: {
      title: 'โปรไฟล์',
      nickname: 'ชื่อเล่น',
      nicknamePlaceholder: 'ใส่ชื่อเล่น',
      edit: 'แก้ไข',
      save: 'บันทึก',
      cancel: 'ยกเลิก',
      saving: 'กำลังบันทึก...',
      saveSuccess: 'บันทึกเรียบร้อย',
      saveError: 'บันทึกไม่สำเร็จ',
      noEmployee: 'ไม่พบข้อมูลพนักงาน',
      notSet: 'ยังไม่ได้ตั้ง',
      changePhoto: 'เปลี่ยนรูป',
      uploading: 'กำลังอัปโหลด...',
      uploadSuccess: 'อัปโหลดรูปภาพแล้ว',
    },
  };

  const t = labels[language];

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile/nickname', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: t.saveSuccess });
        setIsEditing(false);
        router.refresh();
      } else {
        setMessage({ type: 'error', text: t.saveError });
      }
    } catch {
      setMessage({ type: 'error', text: t.saveError });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setNickname(user.nickname);
    setIsEditing(false);
    setMessage(null);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ファイルサイズチェック（2MB以下）
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 2MB' });
      return;
    }

    setIsUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatarUrl);
        setMessage({ type: 'success', text: t.uploadSuccess });
        router.refresh();
      } else {
        setMessage({ type: 'error', text: t.saveError });
      }
    } catch {
      setMessage({ type: 'error', text: t.saveError });
    } finally {
      setIsUploading(false);
    }
  };

  // ヘッダー表示用：ニックネームがある場合はニックネームを優先
  const displayName = user.nickname || user.employeeName || user.email;

  return (
    <DashboardLayout
      locale={locale}
      userEmail={user.email}
      userInfo={{
        email: user.email,
        name: displayName,
        avatarUrl: avatarUrl,
      }}
    >
      <div className="p-4 md:p-6 space-y-6">
        {/* Profile Title */}
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {t.title}
        </h1>

        {/* Profile Card */}
        <div className="rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="p-5 lg:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              {/* Left: Avatar and Info */}
              <div className="flex items-center gap-4">
                {/* Avatar with upload */}
                <div className="relative group">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="w-20 h-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-brand-500 flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {displayName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {/* Overlay for upload */}
                  <button
                    onClick={handleAvatarClick}
                    disabled={isUploading}
                    className="absolute inset-0 w-20 h-20 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    {isUploading ? (
                      <svg className="w-6 h-6 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {/* Name, Nickname and Role */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                      {user.employeeName || t.noEmployee}
                    </h2>
                    {isEditing ? (
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        placeholder={t.nicknamePlaceholder}
                        className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                      />
                    ) : nickname ? (
                      <span className="text-gray-500 dark:text-gray-400">
                        ({nickname})
                      </span>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    {user.employeeNumber && (
                      <span className="text-theme-sm font-mono text-brand-500">
                        {user.employeeNumber}
                      </span>
                    )}
                    {user.employeeNumber && user.employeeRole && (
                      <span className="text-gray-300 dark:text-gray-600">|</span>
                    )}
                    <span className="text-theme-sm text-gray-500 dark:text-gray-400">
                      {user.employeeRole || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Edit Button */}
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 text-theme-sm font-medium text-white bg-brand-500 rounded-full hover:bg-brand-600 disabled:opacity-50"
                    >
                      {isSaving ? t.saving : t.save}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="inline-flex items-center gap-2 px-4 py-2 text-theme-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 disabled:opacity-50"
                    >
                      {t.cancel}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-theme-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                    {t.edit}
                  </button>
                )}
              </div>
            </div>

            {/* Success/Error Message */}
            {message && (
              <div className={`mt-4 px-4 py-3 rounded-lg text-theme-sm ${
                message.type === 'success'
                  ? 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500'
                  : 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-500'
              }`}>
                {message.text}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
