'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { tableStyles } from '@/components/ui/TableStyles';
import { type Language } from '@/lib/kintone/field-mappings';

interface Supplier {
  id: string;
  supplier_id: string | null;
  company_name: string | null;
  company_name_en: string | null;
  phone_number: string | null;
  email: string | null;
  address: string | null;
}

interface SupplierTableClientProps {
  locale: string;
  language: Language;
  suppliers: Supplier[];
}

export default function SupplierTableClient({ locale, language, suppliers }: SupplierTableClientProps) {
  const router = useRouter();

  const handleRowClick = useCallback((supplierId: string) => {
    router.push(`/${locale}/suppliers/${supplierId}`);
  }, [router, locale]);

  const handleRowKeyDown = useCallback((e: React.KeyboardEvent, supplierId: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleRowClick(supplierId);
    }
  }, [handleRowClick]);

  if (suppliers.length === 0) {
    return (
      <div className={tableStyles.emptyRow}>
        <p>
          {language === 'ja' ? 'データがありません' :
           language === 'th' ? 'ไม่มีข้อมูล' :
           'No data available'}
        </p>
      </div>
    );
  }

  return (
    <table className={tableStyles.table}>
      <thead className={tableStyles.thead}>
        <tr>
          <th className={tableStyles.th}>
            {language === 'ja' ? '会社名' : language === 'th' ? 'ชื่อบริษัท' : 'Company Name'}
          </th>
          <th className={tableStyles.th}>
            TEL
          </th>
          <th className={`${tableStyles.th} hidden md:table-cell`}>
            {language === 'ja' ? 'メール' : language === 'th' ? 'อีเมล' : 'Email'}
          </th>
          <th className={`${tableStyles.th} hidden lg:table-cell`}>
            {language === 'ja' ? '住所' : language === 'th' ? 'ที่อยู่' : 'Address'}
          </th>
        </tr>
      </thead>
      <tbody className={tableStyles.tbody}>
        {suppliers.map((supplier) => (
          <tr
            key={supplier.id}
            className={tableStyles.trClickable}
            onClick={() => handleRowClick(supplier.id)}
            onKeyDown={(e) => handleRowKeyDown(e, supplier.id)}
            role="link"
            tabIndex={0}
          >
            <td className={`${tableStyles.td} font-medium text-indigo-600`}>
              {supplier.company_name_en || supplier.company_name || '-'}
            </td>
            <td className={tableStyles.td}>
              {supplier.phone_number || '-'}
            </td>
            <td className={`${tableStyles.td} hidden md:table-cell`}>
              {supplier.email || '-'}
            </td>
            <td className={`${tableStyles.td} hidden lg:table-cell`}>
              <div className="max-w-xs truncate">
                {supplier.address || '-'}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
