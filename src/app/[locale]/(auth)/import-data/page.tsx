'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ImportDataPage({ params }: { params: Promise<{ locale: string }> }) {
  const [isImportingCustomers, setIsImportingCustomers] = useState(false);
  const [isImportingInvoices, setIsImportingInvoices] = useState(false);
  const [customerResult, setCustomerResult] = useState<any>(null);
  const [invoiceResult, setInvoiceResult] = useState<any>(null);
  const router = useRouter();
  const [resolvedLocale, setResolvedLocale] = useState('ja');

  useEffect(() => {
    let active = true;
    params.then((value) => {
      if (active && value?.locale) {
        setResolvedLocale(value.locale);
      }
    });
    return () => {
      active = false;
    };
  }, [params]);

  const importCustomers = async () => {
    setIsImportingCustomers(true);
    setCustomerResult(null);
    
    try {
      const response = await fetch('/api/import-customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setCustomerResult(data);
    } catch (error) {
      console.error('エラー:', error);
      setCustomerResult({ error: '取り込みエラーが発生しました' });
    } finally {
      setIsImportingCustomers(false);
    }
  };

  const importInvoices = async () => {
    setIsImportingInvoices(true);
    setInvoiceResult(null);
    
    try {
      const response = await fetch('/api/import-invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setInvoiceResult(data);
    } catch (error) {
      console.error('エラー:', error);
      setInvoiceResult({ error: '取り込みエラーが発生しました' });
    } finally {
      setIsImportingInvoices(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">KintoneデータをSupabaseに取り込む</h1>
      
      <div className="space-y-6">
        {/* 顧客データ取り込み */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">顧客データ</h2>
          
          <button
            onClick={importCustomers}
            disabled={isImportingCustomers}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isImportingCustomers ? '取り込み中...' : '顧客データを取り込む'}
          </button>

          {customerResult && (
            <div className={`mt-4 p-4 rounded ${customerResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {customerResult.success ? (
                <>
                  <p className="font-semibold text-green-800">取り込み完了</p>
                  <p>全レコード数: {customerResult.totalRecords}</p>
                  <p>取り込み成功: {customerResult.imported}件</p>
                  <p>エラー: {customerResult.errors}件</p>
                  <p>Supabase内の総件数: {customerResult.supabaseCount}件</p>
                  
                  {customerResult.errorDetails && customerResult.errorDetails.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600">エラー詳細（最初の10件）:</p>
                      <ul className="text-sm">
                        {customerResult.errorDetails.map((err: any, idx: number) => (
                          <li key={idx}>{err.customer_id}: {err.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-red-800">{customerResult.error}</p>
              )}
            </div>
          )}
        </div>

        {/* 請求書データ取り込み */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">請求書データ</h2>
          
          <button
            onClick={importInvoices}
            disabled={isImportingInvoices}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {isImportingInvoices ? '取り込み中...' : '請求書データを取り込む'}
          </button>

          {invoiceResult && (
            <div className={`mt-4 p-4 rounded ${invoiceResult.success ? 'bg-green-50' : 'bg-red-50'}`}>
              {invoiceResult.success ? (
                <>
                  <p className="font-semibold text-green-800">取り込み完了</p>
                  <p>全レコード数: {invoiceResult.totalRecords}</p>
                  <p>取り込み成功: {invoiceResult.imported}件</p>
                  <p>エラー: {invoiceResult.errors}件</p>
                  <p>Supabase内の総件数: {invoiceResult.supabaseCount}件</p>
                </>
              ) : (
                <p className="text-red-800">{invoiceResult.error}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 space-x-4">
        <button
          onClick={() => router.push(`/${resolvedLocale}/test-supabase`)}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Supabaseデータを確認
        </button>
        
        <button
          onClick={() => router.push(`/${resolvedLocale}/customers`)}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Supabase顧客一覧へ
        </button>
      </div>
    </div>
  );
}
