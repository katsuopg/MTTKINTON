'use client';

import { useState, useRef, useEffect } from 'react';

interface MechanicalPart {
  id: string;
  no: number;
  dwgNo: string;
  name: string;
  qty: number;
  material: string;
  heatTreatment: string;
  surfaceTreatment: string;
  note: string;
  order: string;
  leadTime: string;
  unitPrice: number;
  totalPrice: number;
}

interface Section {
  id: string;
  name: string;
  parts: MechanicalPart[];
}

interface MechanicalPartsTableProps {
  initialParts?: MechanicalPart[];
  projectId: string;
  onUnsavedChanges?: (hasChanges: boolean) => void;
  onCostTotalChange?: (total: number) => void;
}

export default function MechanicalPartsTable({ initialParts = [], projectId, onUnsavedChanges, onCostTotalChange }: MechanicalPartsTableProps) {
  // セクションの初期化
  const [sections, setSections] = useState<Section[]>([
    {
      id: 'S1',
      name: 'S1',
      parts: initialParts.length > 0 ? initialParts : []
    }
  ]);
  
  const [originalSections, setOriginalSections] = useState<Section[]>([
    {
      id: 'S1',
      name: 'S1',
      parts: initialParts.length > 0 ? initialParts : []
    }
  ]);
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [editingCell, setEditingCell] = useState<{ sectionId: string; rowId: string; field: keyof MechanicalPart } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sectionId: string; rowId: string } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  
  // セル選択のための状態
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [selectionStart, setSelectionStart] = useState<{ sectionId: string; rowId: string; field: keyof MechanicalPart } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ sectionId: string; rowId: string; field: keyof MechanicalPart } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // アンドゥ/リドゥのための履歴
  const [history, setHistory] = useState<Section[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // 初期データの取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/project-parts/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          const mechanicalSections = data.sections
            .filter((s: any) => s.section_type === 'mechanical')
            .map((s: any) => ({
              id: s.id,
              name: s.section_name,
              parts: s.parts.map((p: any) => ({
                id: p.id,
                no: p.no,
                dwgNo: p.dwg_no || '',
                name: p.name || '',
                qty: p.qty || 0,
                material: p.material || '',
                heatTreatment: p.heat_treatment || '',
                surfaceTreatment: p.surface_treatment || '',
                note: p.note || '',
                order: p.order_type || 'Production',
                leadTime: p.lead_time || '',
                unitPrice: p.unit_price || 0,
                totalPrice: p.total_price || 0
              }))
            }));
          
          if (mechanicalSections.length > 0) {
            setSections(mechanicalSections);
            setOriginalSections(JSON.parse(JSON.stringify(mechanicalSections)));
          }
        }
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // 変更状態をチェック
  useEffect(() => {
    const hasChanged = JSON.stringify(sections) !== JSON.stringify(originalSections);
    setHasChanges(hasChanged);
    if (onUnsavedChanges) {
      onUnsavedChanges(hasChanged && isEditing);
    }
  }, [sections, originalSections, isEditing, onUnsavedChanges]);

  // コストトータルを計算して親コンポーネントに通知
  useEffect(() => {
    const total = sections.reduce((sum, section) => {
      return sum + section.parts.reduce((partSum, part) => partSum + (part.totalPrice || 0), 0);
    }, 0);
    
    if (onCostTotalChange) {
      onCostTotalChange(total);
    }
  }, [sections, onCostTotalChange]);

  // 編集モード開始
  const handleStartEdit = () => {
    setIsEditing(true);
    // 編集開始時の状態を履歴に追加
    addToHistory(sections);
  };
  
  // 履歴に追加
  const addToHistory = (newSections: Section[]) => {
    // 現在のインデックス以降の履歴を削除
    const newHistory = history.slice(0, historyIndex + 1);
    // 新しい状態を追加
    newHistory.push(JSON.parse(JSON.stringify(newSections)));
    // 履歴が100件を超えたら古いものを削除
    if (newHistory.length > 100) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };
  
  // アンドゥ
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setSections(JSON.parse(JSON.stringify(history[newIndex])));
      setHistoryIndex(newIndex);
      setSelectedCells(new Set());
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };
  
  // リドゥ
  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setSections(JSON.parse(JSON.stringify(history[newIndex])));
      setHistoryIndex(newIndex);
      setSelectedCells(new Set());
      setSelectionStart(null);
      setSelectionEnd(null);
    }
  };

  // 保存処理
  const handleSave = async () => {
    try {
      const response = await fetch(`/api/project-parts/${projectId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sections: sections,
          type: 'mechanical'
        }),
      });

      if (!response.ok) {
        throw new Error('保存に失敗しました');
      }

      const result = await response.json();
      console.log('保存成功:', result);
      
      setOriginalSections(JSON.parse(JSON.stringify(sections)));
      setIsEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error('保存エラー:', error);
      alert('保存に失敗しました。もう一度お試しください。');
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    if (hasChanges) {
      if (confirm('変更を破棄してもよろしいですか？')) {
        setSections(JSON.parse(JSON.stringify(originalSections)));
        setIsEditing(false);
        setHasChanges(false);
      }
    } else {
      setIsEditing(false);
    }
  };

  // セクション追加
  const addSection = () => {
    if (!isEditing) return;
    const newSectionNumber = sections.length + 1;
    const newSection: Section = {
      id: `S${newSectionNumber}`,
      name: `S${newSectionNumber}`,
      parts: []
    };
    setSections([...sections, newSection]);
  };

  // セクション削除
  const deleteSection = (sectionId: string) => {
    if (!isEditing) return;
    if (sections.length > 1) {
      setSections(sections.filter(s => s.id !== sectionId));
    }
  };

  // セル編集ハンドラー
  const handleCellClick = (sectionId: string, rowId: string, field: keyof MechanicalPart, e?: React.MouseEvent) => {
    if (!isEditing) return;
    const section = sections.find(s => s.id === sectionId);
    const part = section?.parts.find(p => p.id === rowId);
    if (part && field !== 'id' && field !== 'no' && field !== 'totalPrice') {
      // Shiftキーが押されている場合は範囲選択
      if (e?.shiftKey && selectionStart) {
        setSelectionEnd({ sectionId, rowId, field });
        updateSelectedCells(selectionStart, { sectionId, rowId, field });
      } else {
        // 通常のクリックは編集モード
        setEditingCell({ sectionId, rowId, field });
        setEditValue(String(part[field]));
        setSelectionStart({ sectionId, rowId, field });
        setSelectionEnd(null);
        setSelectedCells(new Set([`${sectionId}-${rowId}-${field}`]));
      }
    }
  };

  // 選択範囲を更新
  const updateSelectedCells = (start: { sectionId: string; rowId: string; field: keyof MechanicalPart }, end: { sectionId: string; rowId: string; field: keyof MechanicalPart }) => {
    const newSelectedCells = new Set<string>();
    const editableFields = ['dwgNo', 'name', 'qty', 'material', 'heatTreatment', 'surfaceTreatment', 'note', 'order', 'leadTime', 'unitPrice'] as const;
    
    // 同じセクション内での選択のみサポート
    if (start.sectionId !== end.sectionId) return;
    
    const section = sections.find(s => s.id === start.sectionId);
    if (!section) return;
    
    const startRowIndex = section.parts.findIndex(p => p.id === start.rowId);
    const endRowIndex = section.parts.findIndex(p => p.id === end.rowId);
    const startFieldIndex = getFieldIndex(start.field);
    const endFieldIndex = getFieldIndex(end.field);
    
    const minRowIndex = Math.min(startRowIndex, endRowIndex);
    const maxRowIndex = Math.max(startRowIndex, endRowIndex);
    const minFieldIndex = Math.min(startFieldIndex, endFieldIndex);
    const maxFieldIndex = Math.max(startFieldIndex, endFieldIndex);
    
    for (let rowIndex = minRowIndex; rowIndex <= maxRowIndex; rowIndex++) {
      const part = section.parts[rowIndex];
      if (!part) continue;
      
      for (let fieldIndex = minFieldIndex; fieldIndex <= maxFieldIndex; fieldIndex++) {
        const field = editableFields[fieldIndex];
        if (field) {
          newSelectedCells.add(`${section.id}-${part.id}-${field}`);
        }
      }
    }
    
    setSelectedCells(newSelectedCells);
  };

  const handleCellChange = (value: string) => {
    // Lead timeフィールドの場合は数字のみ、最大3桁まで
    if (editingCell?.field === 'leadTime') {
      const numericValue = value.replace(/[^0-9]/g, '');
      const truncatedValue = numericValue.slice(0, 3);
      setEditValue(truncatedValue);
    } else {
      setEditValue(value);
    }
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const updatedSections = sections.map(section => {
        if (section.id === editingCell.sectionId) {
          const updatedParts = section.parts.map(part => {
            if (part.id === editingCell.rowId) {
              const updatedPart = { ...part };
              const field = editingCell.field;
              
              if (field === 'qty' || field === 'unitPrice') {
                const numValue = parseFloat(editValue) || 0;
                updatedPart[field] = numValue;
                // 合計を再計算
                updatedPart.totalPrice = updatedPart.qty * updatedPart.unitPrice;
              } else {
                (updatedPart as any)[field] = editValue;
              }
              
              return updatedPart;
            }
            return part;
          });
          return { ...section, parts: updatedParts };
        }
        return section;
      });
      setSections(updatedSections);
      addToHistory(updatedSections);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // 新しい行を追加
  const addNewRow = (sectionId: string, afterRowId?: string) => {
    if (!isEditing) return;
    const newPart: MechanicalPart = {
      id: `new-${Date.now()}`,
      no: 0,
      dwgNo: '',
      name: '',
      qty: 0,
      material: '',
      heatTreatment: '',
      surfaceTreatment: '',
      note: '',
      order: 'Production',
      leadTime: '',
      unitPrice: 0,
      totalPrice: 0
    };

    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        const newParts = [...section.parts];
        if (afterRowId) {
          const index = section.parts.findIndex(p => p.id === afterRowId);
          if (index !== -1) {
            newParts.splice(index + 1, 0, newPart);
          }
        } else {
          newParts.push(newPart);
        }
        return { ...section, parts: renumberItems(newParts) };
      }
      return section;
    });
    setSections(updatedSections);
  };

  // 行を削除
  const deleteRow = (sectionId: string, rowId: string) => {
    if (!isEditing) return;
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        return {
          ...section,
          parts: renumberItems(section.parts.filter(part => part.id !== rowId))
        };
      }
      return section;
    });
    setSections(updatedSections);
  };

  // アイテム番号を再番号付け
  const renumberItems = (parts: MechanicalPart[]): MechanicalPart[] => {
    return parts.map((part, index) => ({
      ...part,
      no: index + 1
    }));
  };

  // 行を上下に移動
  const moveRow = (sectionId: string, rowId: string, direction: 'up' | 'down') => {
    if (!isEditing) return;
    const updatedSections = sections.map(section => {
      if (section.id === sectionId) {
        const index = section.parts.findIndex(p => p.id === rowId);
        if (index === -1) return section;

        const newParts = [...section.parts];
        if (direction === 'up' && index > 0) {
          [newParts[index - 1], newParts[index]] = [newParts[index], newParts[index - 1]];
        } else if (direction === 'down' && index < newParts.length - 1) {
          [newParts[index], newParts[index + 1]] = [newParts[index + 1], newParts[index]];
        }

        return { ...section, parts: renumberItems(newParts) };
      }
      return section;
    });
    setSections(updatedSections);
  };

  // コンテキストメニューの表示
  const handleContextMenu = (e: React.MouseEvent, sectionId: string, rowId: string) => {
    e.preventDefault();
    if (isEditing) {
      setContextMenu({ x: e.clientX, y: e.clientY, sectionId, rowId });
    }
  };

  // コンテキストメニューを閉じる
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  // ペースト処理
  const handlePaste = (e: React.ClipboardEvent | ClipboardEvent) => {
    if (!isEditing) return;
    e.preventDefault();

    const pastedData = e instanceof ClipboardEvent 
      ? e.clipboardData?.getData('text') 
      : e.clipboardData.getData('text');
    
    if (!pastedData) return;

    // タブと改行で分割してデータをパース
    const rows = pastedData.trim().split('\n').map(row => row.split('\t'));
    
    // ペースト開始位置を決定（選択範囲の左上、または編集中のセル、または最初のセクションの最初のセル）
    let startSectionId: string;
    let startRowIndex: number;
    let startFieldIndex: number;
    
    if (selectedCells.size > 0 && selectionStart) {
      startSectionId = selectionStart.sectionId;
      const section = sections.find(s => s.id === startSectionId);
      if (!section) return;
      startRowIndex = section.parts.findIndex(p => p.id === selectionStart.rowId);
      startFieldIndex = getFieldIndex(selectionStart.field);
    } else if (editingCell) {
      startSectionId = editingCell.sectionId;
      const section = sections.find(s => s.id === startSectionId);
      if (!section) return;
      startRowIndex = section.parts.findIndex(p => p.id === editingCell.rowId);
      startFieldIndex = getFieldIndex(editingCell.field);
      setEditingCell(null); // 編集モードを終了
    } else {
      // データがない場合は最初のセクションの最初のセルから開始
      if (sections.length === 0) return;
      startSectionId = sections[0].id;
      startRowIndex = 0;
      startFieldIndex = 0; // 'dwgNo' フィールドから開始
    }

    // データをペースト
    const updatedSections = [...sections];
    const editableFields = ['dwgNo', 'name', 'qty', 'material', 'heatTreatment', 'surfaceTreatment', 'note', 'order', 'leadTime', 'unitPrice'] as const;
    
    // セクションを取得
    const targetSection = updatedSections.find(s => s.id === startSectionId);
    if (!targetSection) return;
    
    // 必要に応じて新しい行を追加
    const requiredRows = startRowIndex + rows.length;
    while (targetSection.parts.length < requiredRows) {
      const newPart: MechanicalPart = {
        id: `new-${Date.now()}-${targetSection.parts.length}`,
        no: targetSection.parts.length + 1,
        dwgNo: '',
        name: '',
        qty: 0,
        material: '',
        heatTreatment: '',
        surfaceTreatment: '',
        note: '',
        order: 'Production',
        leadTime: '',
        unitPrice: 0,
        totalPrice: 0
      };
      targetSection.parts.push(newPart);
    }
    
    // アイテム番号を再番号付け
    targetSection.parts = renumberItems(targetSection.parts);
    
    // データをペースト
    rows.forEach((row, rowOffset) => {
      const targetRowIndex = startRowIndex + rowOffset;
      const targetPart = targetSection.parts[targetRowIndex];
      if (!targetPart) return;
      
      row.forEach((cellValue, colOffset) => {
        const targetFieldIndex = startFieldIndex + colOffset;
        if (targetFieldIndex >= editableFields.length) return;
        
        const field = editableFields[targetFieldIndex];
        if (field === 'qty' || field === 'unitPrice') {
          const numValue = parseFloat(cellValue) || 0;
          (targetPart as any)[field] = numValue;
          targetPart.totalPrice = targetPart.qty * targetPart.unitPrice;
        } else {
          (targetPart as any)[field] = cellValue;
        }
      });
    });

    setSections(updatedSections);
    addToHistory(updatedSections);
    setSelectedCells(new Set());
    setSelectionStart(null);
    setSelectionEnd(null);
  };

  // フィールドのインデックスを取得
  const getFieldIndex = (field: keyof MechanicalPart): number => {
    const fields = ['dwgNo', 'name', 'qty', 'material', 'heatTreatment', 'surfaceTreatment', 'note', 'order', 'leadTime', 'unitPrice'] as const;
    return fields.indexOf(field as any);
  };

  // コピー処理
  const handleCopy = (e: React.ClipboardEvent | KeyboardEvent) => {
    if (!isEditing || selectedCells.size === 0) return;
    e.preventDefault();

    // 選択されたセルのデータを取得
    const editableFields = ['dwgNo', 'name', 'qty', 'material', 'heatTreatment', 'surfaceTreatment', 'note', 'order', 'leadTime', 'unitPrice'] as const;
    const selectedData: Map<string, Map<string, string>> = new Map();

    selectedCells.forEach(cellKey => {
      const [sectionId, partId, field] = cellKey.split('-');
      const section = sections.find(s => s.id === sectionId);
      const part = section?.parts.find(p => p.id === partId);
      
      if (part && field) {
        const rowKey = `${sectionId}-${partId}`;
        if (!selectedData.has(rowKey)) {
          selectedData.set(rowKey, new Map());
        }
        selectedData.get(rowKey)!.set(field, String((part as any)[field] || ''));
      }
    });

    // データを行と列に整理
    const rows: string[][] = [];
    const rowKeys = Array.from(selectedData.keys()).sort();
    
    rowKeys.forEach(rowKey => {
      const rowData = selectedData.get(rowKey)!;
      const row: string[] = [];
      
      editableFields.forEach(field => {
        if (selectedCells.has(`${rowKey}-${field}`)) {
          row.push(rowData.get(field) || '');
        }
      });
      
      if (row.length > 0) {
        rows.push(row);
      }
    });

    // タブ区切りのテキストに変換
    const text = rows.map(row => row.join('\t')).join('\n');
    
    if (e instanceof KeyboardEvent) {
      navigator.clipboard.writeText(text);
    } else {
      e.clipboardData.setData('text/plain', text);
    }
  };

  // 選択されたセルのデータを削除
  const deleteSelectedCells = () => {
    if (!isEditing || selectedCells.size === 0) return;
    
    const updatedSections = [...sections];
    const editableFields = ['dwgNo', 'name', 'qty', 'material', 'heatTreatment', 'surfaceTreatment', 'note', 'order', 'leadTime', 'unitPrice'] as const;
    
    selectedCells.forEach(cellKey => {
      const [sectionId, partId, field] = cellKey.split('-');
      const section = updatedSections.find(s => s.id === sectionId);
      if (!section) return;
      
      const part = section.parts.find(p => p.id === partId);
      if (!part) return;
      
      if (editableFields.includes(field as any)) {
        if (field === 'qty' || field === 'unitPrice') {
          (part as any)[field] = 0;
          part.totalPrice = part.qty * part.unitPrice;
        } else if (field === 'order') {
          part.order = 'Production';
        } else {
          (part as any)[field] = '';
        }
      }
    });
    
    setSections(updatedSections);
    addToHistory(updatedSections);
    setSelectedCells(new Set());
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing && !editingCell) {
        // Ctrl+C または Cmd+C でコピー
        if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
          handleCopy(e);
        }
        // Ctrl+V または Cmd+V でペースト
        if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
          // ペーストはpaste eventで処理される
        }
        // Ctrl+A または Cmd+A で全選択
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
          e.preventDefault();
          selectAll();
        }
        // Ctrl+Z または Cmd+Z でアンドゥ
        if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          undo();
        }
        // Ctrl+Y または Cmd+Shift+Z でリドゥ
        if (((e.ctrlKey || e.metaKey) && e.key === 'y') || 
            ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
          e.preventDefault();
          redo();
        }
        // Delete キーで選択セルを削除
        if (e.key === 'Delete' && selectedCells.size > 0) {
          e.preventDefault();
          deleteSelectedCells();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, editingCell, selectedCells, sections, historyIndex, history]);

  // 全選択
  const selectAll = () => {
    const newSelectedCells = new Set<string>();
    const editableFields = ['dwgNo', 'name', 'qty', 'material', 'heatTreatment', 'surfaceTreatment', 'note', 'order', 'leadTime', 'unitPrice'] as const;
    
    sections.forEach(section => {
      section.parts.forEach(part => {
        editableFields.forEach(field => {
          newSelectedCells.add(`${section.id}-${part.id}-${field}`);
        });
      });
    });
    
    setSelectedCells(newSelectedCells);
  };

  // ペーストイベントリスナー
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (isEditing && !editingCell) {
        handlePaste(e);
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [isEditing, editingCell, selectedCells, selectionStart, sections]);

  // 全セクションの合計金額を計算
  const totalAmount = sections.reduce((sum, section) => {
    return sum + section.parts.reduce((sectionSum, part) => sectionSum + part.totalPrice, 0);
  }, 0);

  // セクション毎の合計金額を計算
  const getSectionTotal = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.parts.reduce((sum, part) => sum + part.totalPrice, 0) : 0;
  };

  // セルのスタイルクラスを取得
  const getCellClassName = (sectionId: string, partId: string, field: string) => {
    const isSelected = selectedCells.has(`${sectionId}-${partId}-${field}`);
    return `cursor-pointer hover:bg-blue-50 px-1 py-0.5 min-h-[1.2rem] ${
      isSelected ? 'bg-blue-100 border-blue-500' : ''
    }`;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="text-gray-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="relative" ref={tableRef}>
        {/* コンテキストメニュー */}
        {contextMenu && (
          <div
            className="absolute bg-white border border-gray-300 shadow-lg rounded-md py-1 z-50"
            style={{ top: contextMenu.y - 100, left: contextMenu.x - 100 }}
          >
            <button
              className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
              onClick={() => {
                addNewRow(contextMenu.sectionId, contextMenu.rowId);
                setContextMenu(null);
              }}
            >
              下に行を挿入
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
              onClick={() => {
                const section = sections.find(s => s.id === contextMenu.sectionId);
                if (section) {
                  const index = section.parts.findIndex(p => p.id === contextMenu.rowId);
                  if (index > 0) {
                    addNewRow(contextMenu.sectionId, section.parts[index - 1].id);
                  } else {
                    const newPart: MechanicalPart = {
                      id: `new-${Date.now()}`,
                      no: 0,
                      dwgNo: '',
                      name: '',
                      qty: 0,
                      material: '',
                      heatTreatment: '',
                      surfaceTreatment: '',
                      note: '',
                      order: 'Production',
                      leadTime: '',
                      unitPrice: 0,
                      totalPrice: 0
                    };
                    const updatedSections = sections.map(s => {
                      if (s.id === contextMenu.sectionId) {
                        return { ...s, parts: renumberItems([newPart, ...s.parts]) };
                      }
                      return s;
                    });
                    setSections(updatedSections);
                  }
                }
                setContextMenu(null);
              }}
            >
              上に行を挿入
            </button>
            <hr className="my-1" />
            <button
              className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
              onClick={() => {
                moveRow(contextMenu.sectionId, contextMenu.rowId, 'up');
                setContextMenu(null);
              }}
            >
              上に移動
            </button>
            <button
              className="block w-full text-left px-4 py-2 text-xs hover:bg-gray-100"
              onClick={() => {
                moveRow(contextMenu.sectionId, contextMenu.rowId, 'down');
                setContextMenu(null);
              }}
            >
              下に移動
            </button>
            <hr className="my-1" />
            <button
              className="block w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-gray-100"
              onClick={() => {
                deleteRow(contextMenu.sectionId, contextMenu.rowId);
                setContextMenu(null);
              }}
            >
              行を削除
            </button>
          </div>
        )}
        
        <div className="flex justify-between items-center mb-2">
          <div className="flex gap-2">
            {!isEditing ? (
              <button 
                onClick={handleStartEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
              >
                編集
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                  disabled={!hasChanges}
                >
                  保存
                </button>
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                >
                  キャンセル
                </button>
              </>
            )}
          </div>
          <div className="flex items-center gap-4">
            {isEditing && (
              <>
                <div className="text-xs text-gray-500">
                  <span className="font-semibold">ショートカット:</span> Ctrl+C コピー | Ctrl+V ペースト | Ctrl+A 全選択 | Ctrl+Z 元に戻す | Ctrl+Y やり直し | Delete 削除 | Shift+クリック 範囲選択
                </div>
                <button 
                  onClick={addSection}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  セクション追加
                </button>
              </>
            )}
          </div>
        </div>

        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="mb-8">
            <div className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-t-lg border border-b-0 border-gray-300">
              <h3 className="text-md font-semibold text-gray-700">セクション {section.name}</h3>
              {isEditing && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => addNewRow(section.id)}
                    className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-xs"
                  >
                    部品追加
                  </button>
                  {sections.length > 1 && (
                    <button 
                      onClick={() => deleteSection(section.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-xs"
                    >
                      セクション削除
                    </button>
                  )}
                </div>
              )}
            </div>

            <table className="border-collapse border border-gray-300 w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    No
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    DWG. NO.
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    NAME
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    QTY
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    MAT./VENDER
                  </th>
                  <th colSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    HEAT TREATMENT
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    NOTE
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Order
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Lead time
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Unit Price
                  </th>
                  <th rowSpan={2} className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Total Price
                  </th>
                </tr>
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    HEAT TREATMENT
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    SURFACE TREATMENT
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {section.parts.map((part) => (
                  <tr 
                    key={part.id}
                    className="hover:bg-gray-50"
                    onContextMenu={(e) => handleContextMenu(e, section.id, part.id)}
                  >
                    <td className="border border-gray-300 px-1 py-0.5 text-center text-xs">
                      {part.no}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'dwgNo' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'dwgNo', e)}
                          className={getCellClassName(section.id, part.id, 'dwgNo')}
                        >
                          {part.dwgNo || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'name' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'name', e)}
                          className={getCellClassName(section.id, part.id, 'name')}
                        >
                          {part.name || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'qty' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs text-center border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'qty', e)}
                          className={getCellClassName(section.id, part.id, 'qty')}
                        >
                          {part.qty || 0}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'material' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'material', e)}
                          className={getCellClassName(section.id, part.id, 'material')}
                        >
                          {part.material || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'heatTreatment' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'heatTreatment', e)}
                          className={getCellClassName(section.id, part.id, 'heatTreatment')}
                        >
                          {part.heatTreatment || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'surfaceTreatment' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'surfaceTreatment', e)}
                          className={getCellClassName(section.id, part.id, 'surfaceTreatment')}
                        >
                          {part.surfaceTreatment || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'note' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'note', e)}
                          className={getCellClassName(section.id, part.id, 'note')}
                        >
                          {part.note || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'order' ? (
                        <select
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          className="w-full px-1 py-0.5 text-xs border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        >
                          <option value="Production">Production</option>
                          <option value="Purchase">Purchase</option>
                          <option value="Stock">Stock</option>
                        </select>
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'order', e)}
                          className={getCellClassName(section.id, part.id, 'order')}
                        >
                          {part.order}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-center text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'leadTime' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs text-center border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          min="0"
                          max="999"
                          pattern="[0-9]{0,3}"
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'leadTime', e)}
                          className={getCellClassName(section.id, part.id, 'leadTime')}
                        >
                          {part.leadTime || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-right text-sm">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'unitPrice' ? (
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => handleCellChange(e.target.value)}
                          onBlur={handleCellBlur}
                          onKeyDown={handleKeyDown}
                          className="w-full px-1 py-0.5 text-xs text-right border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'unitPrice', e)}
                          className={getCellClassName(section.id, part.id, 'unitPrice')}
                        >
                          {part.unitPrice.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-1 py-0.5 text-right text-sm bg-gray-50">
                      {part.totalPrice.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                {section.parts.length === 0 && (
                  <tr>
                    <td colSpan={12} className="border border-gray-300 px-2 py-8 text-center text-gray-500">
                      データがありません。{isEditing && '「部品追加」ボタンをクリックして新しい部品を追加してください。'}
                    </td>
                  </tr>
                )}
                <tr className="font-semibold bg-gray-100">
                  <td colSpan={10} className="border border-gray-300 px-2 py-1 text-right">
                    {section.name} SUBTOTAL
                  </td>
                  <td colSpan={2} className="border border-gray-300 px-2 py-1 text-right">
                    {getSectionTotal(section.id).toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* 総合計 */}
        <div className="mt-4 bg-gray-200 px-4 py-3 flex justify-between items-center rounded-lg">
          <span className="font-bold text-base">GRAND TOTAL</span>
          <span className="font-bold text-base">
            {totalAmount.toLocaleString('ja-JP', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    </div>
  );
}