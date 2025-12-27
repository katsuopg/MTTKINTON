'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Plus, FileDown, Upload, Save } from 'lucide-react';

interface PartsListPageProps {
  params: {
    locale: string;
    workNo: string;
  };
}

interface PartDetail {
  id: number;
  no: number;
  partName: string;
  modelPartNumber: string;
  brand: string;
  supplier: string;
  qty: number;
  unitPrice: number;
  totalAmount: number;
  deliveryPeriod: string;
  requiredDate: string;
  procurementStatus: 'not_ordered' | 'ordered' | 'received';
  procurementDate: string;
  actualDeliveryDate: string;
  quoteStatus: 'not_obtained' | 'obtained' | 'confirmed';
  quotedPrice: number;
  quoteExpiryDate: string;
  note: string;
  status: 'considering' | 'confirmed' | 'ordered';
  drawingStatus: 'check' | 'approve' | '';
  costStatus: 'check' | 'approve' | '';
  purchaseType: 'purchase' | 'manufacture';
}

export default function PartsListPage({ params: { locale, workNo } }: PartsListPageProps) {
  const router = useRouter();
  const [parts, setParts] = useState<PartDetail[]>([
    {
      id: 1,
      no: 1,
      partName: 'エアシリンダー',
      modelPartNumber: 'CDJ2B16-50Z',
      brand: 'SMC',
      supplier: '商社A',
      qty: 2,
      unitPrice: 8500,
      totalAmount: 17000,
      deliveryPeriod: '2週間',
      requiredDate: '2024-10-15',
      procurementStatus: 'not_ordered',
      procurementDate: '',
      actualDeliveryDate: '',
      quoteStatus: 'obtained',
      quotedPrice: 8500,
      quoteExpiryDate: '2024-10-30',
      note: '標準在庫品',
      status: 'confirmed',
      drawingStatus: 'approve',
      costStatus: 'check',
      purchaseType: 'purchase'
    },
    {
      id: 2,
      no: 2,
      partName: 'リニアガイド',
      modelPartNumber: 'SHS25C1SS',
      brand: 'THK',
      supplier: '商社B',
      qty: 4,
      unitPrice: 12000,
      totalAmount: 48000,
      deliveryPeriod: '3週間',
      requiredDate: '2024-10-20',
      procurementStatus: 'ordered',
      procurementDate: '2024-09-28',
      actualDeliveryDate: '',
      quoteStatus: 'confirmed',
      quotedPrice: 12000,
      quoteExpiryDate: '2024-10-15',
      note: '特注長さ',
      status: 'ordered',
      drawingStatus: 'approve',
      costStatus: 'approve',
      purchaseType: 'purchase'
    }
  ]);

  const handleAddPart = () => {
    const newPart: PartDetail = {
      id: parts.length + 1,
      no: parts.length + 1,
      partName: '',
      modelPartNumber: '',
      brand: '',
      supplier: '',
      qty: 1,
      unitPrice: 0,
      totalAmount: 0,
      deliveryPeriod: '',
      requiredDate: '',
      procurementStatus: 'not_ordered',
      procurementDate: '',
      actualDeliveryDate: '',
      quoteStatus: 'not_obtained',
      quotedPrice: 0,
      quoteExpiryDate: '',
      note: '',
      status: 'considering',
      drawingStatus: '',
      costStatus: '',
      purchaseType: 'purchase'
    };
    setParts([...parts, newPart]);
  };

  const handlePartChange = (id: number, field: keyof PartDetail, value: any) => {
    setParts(parts.map(part => {
      if (part.id === id) {
        const updatedPart = { ...part, [field]: value };
        if (field === 'qty' || field === 'unitPrice') {
          updatedPart.totalAmount = updatedPart.qty * updatedPart.unitPrice;
        }
        return updatedPart;
      }
      return part;
    }));
  };

  const totalAmount = parts.reduce((sum, part) => sum + part.totalAmount, 0);

  return (
    <div className="py-4 px-4">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center text-sm text-slate-500 hover:text-slate-700"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          プロジェクト一覧に戻る
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">パーツリスト管理</h1>
        <p className="mt-1 text-sm text-slate-600">
          工事番号: {workNo}
        </p>
      </div>

      <div className="mb-4 flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={handleAddPart}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-1" />
            部品追加
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
            <Upload className="w-4 h-4 mr-1" />
            Excelインポート
          </button>
          <button className="inline-flex items-center px-3 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
            <FileDown className="w-4 h-4 mr-1" />
            Excelエクスポート
          </button>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-1" />
          保存
        </button>
      </div>

      <div className="overflow-x-auto bg-white shadow-sm rounded-lg">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">No.</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">部品名</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">型式・品番</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">メーカー</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">手配先</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">数量</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">単価</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">合計金額</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">手配状況</th>
              <th className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ステータス</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {parts.map((part) => (
              <tr key={part.id}>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap text-sm text-slate-900">{part.no}</td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={part.partName}
                    onChange={(e) => handlePartChange(part.id, 'partName', e.target.value)}
                    className="w-full text-sm border-slate-300 rounded-md"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={part.modelPartNumber}
                    onChange={(e) => handlePartChange(part.id, 'modelPartNumber', e.target.value)}
                    className="w-full text-sm border-slate-300 rounded-md"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap">
                  <input
                    type="text"
                    value={part.brand}
                    onChange={(e) => handlePartChange(part.id, 'brand', e.target.value)}
                    className="w-full text-sm border-slate-300 rounded-md"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap">
                  <select
                    value={part.supplier}
                    onChange={(e) => handlePartChange(part.id, 'supplier', e.target.value)}
                    className="w-full text-sm border-slate-300 rounded-md"
                  >
                    <option value="">選択</option>
                    <option value="商社A">商社A</option>
                    <option value="商社B">商社B</option>
                    <option value="商社C">商社C</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    value={part.qty}
                    onChange={(e) => handlePartChange(part.id, 'qty', parseInt(e.target.value) || 0)}
                    className="w-16 text-sm border-slate-300 rounded-md"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap">
                  <input
                    type="number"
                    value={part.unitPrice}
                    onChange={(e) => handlePartChange(part.id, 'unitPrice', parseInt(e.target.value) || 0)}
                    className="w-24 text-sm border-slate-300 rounded-md"
                  />
                </td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap text-sm text-slate-900">
                  ¥{part.totalAmount.toLocaleString()}
                </td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap">
                  <select
                    value={part.procurementStatus}
                    onChange={(e) => handlePartChange(part.id, 'procurementStatus', e.target.value)}
                    className="text-sm border-slate-300 rounded-md"
                  >
                    <option value="not_ordered">未手配</option>
                    <option value="ordered">手配済み</option>
                    <option value="received">入荷済み</option>
                  </select>
                </td>
                <td className="whitespace-nowrap px-3 py-2 whitespace-nowrap">
                  <select
                    value={part.status}
                    onChange={(e) => handlePartChange(part.id, 'status', e.target.value)}
                    className="text-sm border-slate-300 rounded-md"
                  >
                    <option value="considering">検討中</option>
                    <option value="confirmed">確定</option>
                    <option value="ordered">発注済み</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <div className="text-lg font-semibold">
          合計金額: ¥{totalAmount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}