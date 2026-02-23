'use client';

import { useState, useEffect } from 'react';
import { tableStyles } from '@/components/ui/TableStyles';
import { useToast } from '@/components/ui/Toast';
import { useConfirmDialog } from '@/components/ui/ConfirmDialog';

interface Organization {
  id: string;
  code: string;
  name: string;
  name_en?: string;
  name_th?: string;
  parent_id?: string;
  display_order: number;
  description?: string;
  manager_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface OrganizationManagementProps {
  locale: string;
}

export default function OrganizationManagement({ locale }: OrganizationManagementProps) {
  const { toast } = useToast();
  const { confirmDialog } = useConfirmDialog();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_en: '',
    name_th: '',
    parent_id: '',
    description: '',
    display_order: 0,
  });

  // 組織一覧を取得
  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/organizations');
      const data = await response.json();
      if (data.organizations) {
        console.log('Fetched organizations:', data.organizations);
        console.log('Display orders:', data.organizations.map((org: Organization) => ({ 
          code: org.code, 
          name: org.name, 
          display_order: org.display_order,
          display_order_type: typeof org.display_order
        })));
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, []);

  // 親組織名を取得
  const getParentName = (parentId: string | null | undefined): string => {
    if (!parentId) return '-';
    const parent = organizations.find((org) => org.id === parentId);
    return parent ? parent.name : '-';
  };

  // 階層構造でソート（親→子の順）
  const sortedOrganizations = [...organizations].sort((a, b) => {
    // display_orderを数値として扱う（null/undefinedの場合は0として扱う）
    const orderA = Number(a.display_order) || 0;
    const orderB = Number(b.display_order) || 0;

    if (a.parent_id && !b.parent_id) return 1;
    if (!a.parent_id && b.parent_id) return -1;
    if (a.parent_id && b.parent_id) {
      // 同じ階層内で表示順でソート
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.name.localeCompare(b.name);
    }
    // トップレベルで表示順でソート
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.name.localeCompare(b.name);
  });

  // モーダルを開く（新規作成）
  const handleOpenModal = () => {
    setEditingOrg(null);
    setFormData({
      code: '',
      name: '',
      name_en: '',
      name_th: '',
      parent_id: '',
      description: '',
      display_order: organizations.length,
    });
    setIsModalOpen(true);
  };

  // モーダルを開く（編集）
  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    setFormData({
      code: org.code,
      name: org.name,
      name_en: org.name_en || '',
      name_th: org.name_th || '',
      parent_id: org.parent_id || '',
      description: org.description || '',
      display_order: org.display_order,
    });
    setIsModalOpen(true);
  };

  // 組織を保存
  const handleSave = async () => {
    try {
      // display_orderを数値に変換（0も有効な値として扱う）
      const displayOrderValue = formData.display_order !== undefined && formData.display_order !== null
        ? parseInt(String(formData.display_order), 10)
        : 0;
      const finalDisplayOrder = isNaN(displayOrderValue) ? 0 : displayOrderValue;

      // データを正規化（空文字列をnullに変換、display_orderを数値に変換）
      const normalizedData = {
        ...formData,
        parent_id: formData.parent_id === '' ? null : formData.parent_id,
        display_order: finalDisplayOrder,
        name_en: formData.name_en === '' ? null : formData.name_en,
        name_th: formData.name_th === '' ? null : formData.name_th,
        description: formData.description === '' ? null : formData.description,
      };

      console.log('Saving organization:', {
        editingOrg: editingOrg?.id,
        formDataDisplayOrder: formData.display_order,
        formDataDisplayOrderType: typeof formData.display_order,
        finalDisplayOrder,
        normalizedData,
        formData
      });

      if (editingOrg) {
        // 更新
        const response = await fetch(`/api/organizations/${editingOrg.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalizedData),
        });

        if (!response.ok) {
          let errorMessage = '更新に失敗しました';
          try {
            const responseText = await response.text();
            console.error('Update error response text:', responseText);
            console.error('Response status:', response.status);
            console.error('Response statusText:', response.statusText);
            
            if (responseText) {
              try {
                // responseTextを直接パース
                const parsed = JSON.parse(responseText);
                console.error('Update error (parsed):', parsed);
                console.error('Error type:', typeof parsed);
                console.error('Error keys:', Object.keys(parsed || {}));
                console.error('Error stringified:', JSON.stringify(parsed));
                
                // error.error または error.message を優先的に使用
                if (parsed && typeof parsed === 'object') {
                  if (parsed.error) {
                    errorMessage = String(parsed.error);
                  } else if (parsed.message) {
                    errorMessage = String(parsed.message);
                  } else {
                    // オブジェクトの最初の値を取得
                    const firstValue = Object.values(parsed)[0];
                    if (firstValue) {
                      errorMessage = String(firstValue);
                    }
                  }
                  if (parsed.details) {
                    console.error('Error details:', parsed.details);
                  }
                  if (parsed.code) {
                    console.error('Error code:', parsed.code);
                  }
                } else {
                  errorMessage = responseText;
                }
                
                // エラーメッセージが取得できたことを確認
                if (!errorMessage || errorMessage === '更新に失敗しました') {
                  // フォールバック: responseTextから直接抽出
                  const match = responseText.match(/"error":"([^"]+)"/);
                  if (match && match[1]) {
                    errorMessage = match[1];
                  }
                }
              } catch (parseError) {
                // JSONパースに失敗した場合、レスポンステキストをそのまま使用
                console.error('Failed to parse JSON:', parseError);
                errorMessage = responseText || errorMessage;
              }
            } else {
              errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
            }
          } catch (e) {
            // レスポンスの読み取りに失敗した場合
            console.error('Failed to read error response:', e);
            errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
          }
          toast({ type: 'error', title: errorMessage });
          return;
        }

        // 更新成功時のレスポンスを確認
        const result = await response.json();
        console.log('Update successful:', result);
        console.log('Updated organization code:', result.organization?.code);
      } else {
        // 作成
        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(normalizedData),
        });

        if (!response.ok) {
          let errorMessage = '作成に失敗しました';
          try {
            const error = await response.json();
            console.error('Create error:', error);
            errorMessage = error.error || error.message || errorMessage;
            if (error.details) {
              console.error('Error details:', error.details);
            }
          } catch (e) {
            // JSONパースに失敗した場合、ステータステキストを使用
            console.error('Failed to parse error response:', e);
            errorMessage = `${errorMessage} (${response.status}: ${response.statusText})`;
          }
          toast({ type: 'error', title: errorMessage });
          return;
        }
      }

      setIsModalOpen(false);
      fetchOrganizations();
      toast({
        type: 'success',
        title: editingOrg
          ? (locale === 'ja' ? '組織を更新しました' : locale === 'th' ? 'อัปเดตองค์กรสำเร็จ' : 'Organization updated')
          : (locale === 'ja' ? '組織を作成しました' : locale === 'th' ? 'สร้างองค์กรสำเร็จ' : 'Organization created'),
      });
    } catch (error) {
      console.error('Error saving organization:', error);
      toast({ type: 'error', title: locale === 'ja' ? '保存中にエラーが発生しました' : locale === 'th' ? 'เกิดข้อผิดพลาดในการบันทึก' : 'Error saving organization' });
    }
  };

  // 組織を削除
  const handleDelete = async (id: string) => {
    const confirmed = await confirmDialog({
      title: locale === 'ja' ? '組織削除' : locale === 'th' ? 'ลบองค์กร' : 'Delete Organization',
      message: locale === 'ja' ? 'この組織を削除しますか？' : locale === 'th' ? 'คุณต้องการลบองค์กรนี้หรือไม่?' : 'Are you sure you want to delete this organization?',
      variant: 'danger',
      confirmLabel: locale === 'ja' ? '削除' : locale === 'th' ? 'ลบ' : 'Delete',
      cancelLabel: locale === 'ja' ? 'キャンセル' : locale === 'th' ? 'ยกเลิก' : 'Cancel',
    });
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/organizations/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        toast({ type: 'error', title: error.error || (locale === 'ja' ? '削除に失敗しました' : locale === 'th' ? 'ลบไม่สำเร็จ' : 'Failed to delete') });
        return;
      }

      fetchOrganizations();
      toast({ type: 'success', title: locale === 'ja' ? '組織を削除しました' : locale === 'th' ? 'ลบองค์กรสำเร็จ' : 'Organization deleted' });
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({ type: 'error', title: locale === 'ja' ? '削除中にエラーが発生しました' : locale === 'th' ? 'เกิดข้อผิดพลาดในการลบ' : 'Error deleting organization' });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ヘッダーと追加ボタン */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {locale === 'ja' ? '組織管理' : locale === 'th' ? 'จัดการองค์กร' : 'Organization Management'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {locale === 'ja'
              ? '会社の組織図を管理します。組織を登録すると、アクセス権・通知先の設定を組織単位でできるようになります。'
              : locale === 'th'
              ? 'จัดการโครงสร้างองค์กรของบริษัท การลงทะเบียนองค์กรจะช่วยให้คุณสามารถตั้งค่าสิทธิ์การเข้าถึงและผู้รับการแจ้งเตือนตามองค์กรได้'
              : 'Manage your company organization chart. Registering organizations allows you to set access rights and notification destinations by organization.'}
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {locale === 'ja' ? '組織を追加' : locale === 'th' ? 'เพิ่มองค์กร' : 'Add Organization'}
        </button>
      </div>

      {/* 組織一覧テーブル */}
      <section className={tableStyles.tableContainer}>
        <div className="overflow-x-auto">
          <table className={`w-full ${tableStyles.table}`}>
            <thead className={tableStyles.thead}>
              <tr>
                <th className={`${tableStyles.th} w-32`}>
                  {locale === 'ja' ? '組織コード' : locale === 'th' ? 'รหัสองค์กร' : 'Code'}
                </th>
                <th className={tableStyles.th}>
                  {locale === 'ja' ? '組織名' : locale === 'th' ? 'ชื่อองค์กร' : 'Name'}
                </th>
                <th className={`${tableStyles.th} w-40`}>
                  {locale === 'ja' ? '親組織' : locale === 'th' ? 'องค์กรแม่' : 'Parent'}
                </th>
                <th className={`${tableStyles.th} w-24`}>
                  {locale === 'ja' ? '表示順' : locale === 'th' ? 'ลำดับ' : 'Order'}
                </th>
                <th className={`${tableStyles.th} w-24`}>
                  {locale === 'ja' ? '状態' : locale === 'th' ? 'สถานะ' : 'Status'}
                </th>
                <th className={`${tableStyles.th} w-32`}>
                  {locale === 'ja' ? '操作' : locale === 'th' ? 'การดำเนินการ' : 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className={tableStyles.tbody}>
              {sortedOrganizations.length === 0 ? (
                <tr>
                  <td colSpan={6} className={`${tableStyles.td} text-center text-gray-500`}>
                    {locale === 'ja' ? '組織が登録されていません' : locale === 'th' ? 'ยังไม่มีองค์กรที่ลงทะเบียน' : 'No organizations registered'}
                  </td>
                </tr>
              ) : (
                sortedOrganizations.map((org) => (
                  <tr key={org.id} className={tableStyles.tr}>
                    <td className={tableStyles.td}>
                      <span className="font-mono text-sm">{org.code}</span>
                    </td>
                    <td className={tableStyles.td}>
                      <div>
                        <div className="font-medium text-slate-900">{org.name}</div>
                        {org.description && (
                          <div className="text-xs text-slate-500 mt-1">{org.description}</div>
                        )}
                      </div>
                    </td>
                    <td className={tableStyles.td}>
                      <span className="text-sm text-slate-600">{getParentName(org.parent_id)}</span>
                    </td>
                    <td className={tableStyles.td}>
                      <span className="text-sm text-slate-600">{org.display_order}</span>
                    </td>
                    <td className={tableStyles.td}>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          org.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {org.is_active
                          ? locale === 'ja'
                            ? '有効'
                            : locale === 'th'
                            ? 'ใช้งาน'
                            : 'Active'
                          : locale === 'ja'
                          ? '無効'
                          : locale === 'th'
                          ? 'ไม่ใช้งาน'
                          : 'Inactive'}
                      </span>
                    </td>
                    <td className={tableStyles.td}>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(org)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          {locale === 'ja' ? '編集' : locale === 'th' ? 'แก้ไข' : 'Edit'}
                        </button>
                        <button
                          onClick={() => handleDelete(org.id)}
                          className="text-rose-600 hover:text-rose-900 text-sm font-medium"
                        >
                          {locale === 'ja' ? '削除' : locale === 'th' ? 'ลบ' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* モーダル（組織追加・編集） */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingOrg
                  ? locale === 'ja'
                    ? '組織を編集'
                    : locale === 'th'
                    ? 'แก้ไของค์กร'
                    : 'Edit Organization'
                  : locale === 'ja'
                  ? '組織を追加'
                  : locale === 'th'
                  ? 'เพิ่มองค์กร'
                  : 'Add Organization'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '組織コード' : locale === 'th' ? 'รหัสองค์กร' : 'Organization Code'} *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="DIV-001"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '組織名（日本語）' : locale === 'th' ? 'ชื่อองค์กร (ญี่ปุ่น)' : 'Name (Japanese)'} *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="営業部"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '組織名（英語）' : locale === 'th' ? 'ชื่อองค์กร (อังกฤษ)' : 'Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={formData.name_en}
                    onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="Sales Department"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '組織名（タイ語）' : locale === 'th' ? 'ชื่อองค์กร (ไทย)' : 'Name (Thai)'}
                  </label>
                  <input
                    type="text"
                    value={formData.name_th}
                    onChange={(e) => setFormData({ ...formData, name_th: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="แผนกขาย"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '親組織' : locale === 'th' ? 'องค์กรแม่' : 'Parent Organization'}
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => setFormData({ ...formData, parent_id: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="">{locale === 'ja' ? 'なし（トップレベル）' : locale === 'th' ? 'ไม่มี (ระดับบนสุด)' : 'None (Top Level)'}</option>
                    {organizations
                      .filter((org) => !editingOrg || org.id !== editingOrg.id)
                      .map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '表示順' : locale === 'th' ? 'ลำดับ' : 'Display Order'}
                  </label>
                  <input
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ja' ? '説明' : locale === 'th' ? 'คำอธิบาย' : 'Description'}
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    rows={3}
                    placeholder={locale === 'ja' ? '組織の説明を入力' : locale === 'th' ? 'ใส่คำอธิบายองค์กร' : 'Enter organization description'}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  {locale === 'ja' ? 'キャンセル' : locale === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  {locale === 'ja' ? '保存' : locale === 'th' ? 'บันทึก' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


