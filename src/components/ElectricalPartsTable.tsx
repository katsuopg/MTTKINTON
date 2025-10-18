'use client';

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ElectricalPart {
  id: string;
  item: number;
  mark: string;
  name: string;
  model: string;
  vender: string;
  qty: number;
  unitPrice: number;
  total: number;
  leadTime: string;
  supplier: string;
  note: string;
}

interface Section {
  id: string;
  name: string;
  parts: ElectricalPart[];
}

interface ElectricalPartsTableProps {
  initialParts?: ElectricalPart[];
  projectId: string;
  onUnsavedChanges?: (hasChanges: boolean) => void;
  onCostTotalChange?: (total: number) => void;
}

function ElectricalPartsTable({ initialParts = [], projectId, onUnsavedChanges, onCostTotalChange }: ElectricalPartsTableProps) {
  // セクションの初期化（APIからのデータ取得を待つため、最初は空配列）
  const [sections, setSections] = useState<Section[]>([]);
  
  const [originalSections, setOriginalSections] = useState<Section[]>([]);
  
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [dataFetched, setDataFetched] = useState<boolean>(false);
  const [editingCell, setEditingCell] = useState<{ sectionId: string; rowId: string; field: keyof ElectricalPart } | null>(null);
  const [editValue, setEditValue] = useState<string>('');
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; sectionId: string; rowId: string } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const [suppliers, setSuppliers] = useState<{ id: string; name: string }[]>([]);
  const [suppliersLoading, setSuppliersLoading] = useState<boolean>(true);
  
  // selectedCellsの最新値を保持するref
  const selectedCellsRef = useRef<Set<string>>(new Set());
  
  // セル選択のための状態
  const [selectionStart, setSelectionStart] = useState<{ sectionId: string; rowId: string; field: keyof ElectricalPart } | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<{ sectionId: string; rowId: string; field: keyof ElectricalPart } | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  
  // アンドゥ/リドゥのための履歴
  const [history, setHistory] = useState<Section[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // selectedCellsが変更されたときにrefも更新
  useEffect(() => {
    console.log('Updating selectedCellsRef:', selectedCells.size, Array.from(selectedCells));
    selectedCellsRef.current = selectedCells;
  }, [selectedCells]);

  // 初期データの取得
  useEffect(() => {
    if (dataFetched) return; // 既にデータ取得済みならスキップ
    
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/project-parts/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          
          // 重複チェック用のログ
          const sectionIds = new Set();
          const duplicates = [];
          
          const electricalSections = data.sections
            .filter((s: any) => s.section_type === 'electrical')
            .map((s: any) => {
              // 重複チェック
              if (sectionIds.has(s.section_name)) {
                duplicates.push(s.section_name);
              }
              sectionIds.add(s.section_name);
              
              return {
                id: s.id,
                name: s.section_name,
                parts: s.parts.map((p: any) => ({
                id: p.id,
                item: p.item_no,
                mark: p.mark || '-',
                name: p.name || '',
                model: p.model || '',
                vender: p.brand || '',
                qty: p.qty || 0,
                unitPrice: p.unit_price || 0,
                total: p.total || 0,
                leadTime: p.lead_time || '',
                supplier: p.supplier || '',
                note: p.note || ''
              }))
            };
          });
          
          if (duplicates.length > 0) {
            console.error('重複セクションを検出:', duplicates);
          }
          console.log('取得したセクション数:', electricalSections.length, 'セクション名:', electricalSections.map(s => s.name));
          
          // 重複を除去（同じセクション名のものは最初の1つだけ残す）
          const uniqueSections = electricalSections.filter((section, index, self) =>
            index === self.findIndex((s) => s.name === section.name)
          );
          
          if (uniqueSections.length > 0) {
            console.log('重複除去後のセクション数:', uniqueSections.length);
            setSections(uniqueSections);
            setOriginalSections(JSON.parse(JSON.stringify(uniqueSections)));
          } else {
            // データが存在しない場合は、デフォルトのS1セクションを維持
            const defaultSection = {
              id: 'S1',
              name: 'S1',
              parts: []
            };
            setSections([defaultSection]);
            setOriginalSections([defaultSection]);
          }
        }
        setDataFetched(true); // データ取得完了をマーク
      } catch (error) {
        console.error('データ取得エラー:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [projectId, dataFetched]);

  // デバッグ：suppliers ステートを監視
  useEffect(() => {
    console.log('Current suppliers state:', suppliers.length, 'items');
  }, [suppliers]);

  // 仕入れ業者リストを取得
  useEffect(() => {
    console.log('ElectricalPartsTable mounted, fetching suppliers...');
    
    const fetchSuppliers = async () => {
      try {
        setSuppliersLoading(true);
        const supabase = createClient();
        console.log('Creating Supabase client...');
        
        const { data, error } = await supabase
          .from('suppliers')
          .select('id, company_name_en, company_name')
          .order('company_name_en')
          .limit(500);
        
        console.log('Suppliers response:', { data, error });
        
        if (error) {
          console.error('Suppliers fetch error:', error);
          setSuppliersLoading(false);
          return;
        }
        
        if (data) {
          const supplierList = data.map(supplier => ({
            id: supplier.id,
            name: (supplier.company_name_en || supplier.company_name || '').trim()
          })).filter(supplier => supplier.name); // 空の名前を除外
          
          console.log(`Processed ${supplierList.length} suppliers`);
          console.log('First 5 suppliers:', supplierList.slice(0, 5));
          setSuppliers(supplierList);
        }
      } catch (err) {
        console.error('Unexpected error fetching suppliers:', err);
      } finally {
        setSuppliersLoading(false);
      }
    };

    // 初回のみサプライヤーリストを取得
    fetchSuppliers();
  }, []); // 依存配列を空にして初回のみ実行

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
      return sum + section.parts.reduce((partSum, part) => partSum + (part.total || 0), 0);
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
          type: 'electrical'
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
  const handleCellClick = (sectionId: string, rowId: string, field: keyof ElectricalPart, e?: React.MouseEvent) => {
    console.log('handleCellClick called:', { sectionId, rowId, field, isEditing });
    if (!isEditing) return;
    
    const section = sections.find(s => s.id === sectionId);
    const part = section?.parts.find(p => p.id === rowId);
    if (part && field !== 'id' && field !== 'item' && field !== 'total') {
      // Shiftキーが押されている場合は範囲選択
      if (e?.shiftKey && selectionStart) {
        setSelectionEnd({ sectionId, rowId, field });
        updateSelectedCells(selectionStart, { sectionId, rowId, field });
      } else {
        // 通常のクリックで編集開始
        setEditingCell({ sectionId, rowId, field });
        setEditValue(String(part[field]));
        setSelectionStart({ sectionId, rowId, field });
        setSelectionEnd(null);
        const cellKey = `${sectionId}-${rowId}-${field}`;
        console.log('Setting selectedCells with:', cellKey);
        setSelectedCells(new Set([cellKey]));
      }
    }
  };
  
  // マウスでのドラッグ選択
  const handleMouseDown = (sectionId: string, rowId: string, field: keyof ElectricalPart, e: React.MouseEvent) => {
    if (!isEditing) return;
    e.preventDefault();
    setIsSelecting(true);
    setSelectionStart({ sectionId, rowId, field });
    setSelectionEnd({ sectionId, rowId, field });
    setSelectedCells(new Set([`${sectionId}-${rowId}-${field}`]));
  };
  
  const handleMouseEnter = (sectionId: string, rowId: string, field: keyof ElectricalPart) => {
    if (!isSelecting || !selectionStart) return;
    setSelectionEnd({ sectionId, rowId, field });
    updateSelectedCells(selectionStart, { sectionId, rowId, field });
  };
  
  const handleMouseUp = () => {
    setIsSelecting(false);
  };

  // ダブルクリックで編集モード
  // ダブルクリックハンドラーは不要になったのでコメントアウト
  // const handleCellDoubleClick = (sectionId: string, rowId: string, field: keyof ElectricalPart) => {
  //   if (!isEditing) return;
  //   const section = sections.find(s => s.id === sectionId);
  //   const part = section?.parts.find(p => p.id === rowId);
  //   if (part && field !== 'id' && field !== 'item' && field !== 'total') {
  //     setEditingCell({ sectionId, rowId, field });
  //     setEditValue(String(part[field]));
  //   }
  // };

  // 選択範囲を更新
  const updateSelectedCells = (start: { sectionId: string; rowId: string; field: keyof ElectricalPart }, end: { sectionId: string; rowId: string; field: keyof ElectricalPart }) => {
    const newSelectedCells = new Set<string>();
    const editableFields = ['mark', 'name', 'model', 'vender', 'qty', 'unitPrice', 'leadTime', 'supplier', 'note'] as const;
    
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
      // 数字のみ抽出
      const numericValue = value.replace(/[^0-9]/g, '');
      // 3桁までに制限
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
                updatedPart.total = updatedPart.qty * updatedPart.unitPrice;
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

  // 新しい行を追加（任意の位置に）
  const addNewRow = (sectionId: string, afterRowId?: string) => {
    if (!isEditing) return;
    const newPart: ElectricalPart = {
      id: `new-${Date.now()}`,
      item: 0, // 後で再番号付け
      mark: '-',
      name: '',
      model: '',
      vender: '',
      qty: 0,
      unitPrice: 0,
      total: 0,
      leadTime: '',
      supplier: '',
      note: ''
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
    addToHistory(updatedSections);
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
  const renumberItems = (parts: ElectricalPart[]): ElectricalPart[] => {
    return parts.map((part, index) => ({
      ...part,
      item: index + 1
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
    let rows = pastedData.trim().split('\n').map(row => row.split('\t'));
    
    // ヘッダー行をスキップ（MARKやNAMEなどのヘッダーが含まれている場合）
    if (rows.length > 0 && rows[0].some(cell => 
      ['MARK', 'NAME', 'MODEL', 'BRAND', 'QTY', 'UNIT PRICE', 'TOTAL', 'Delivery', 'LEAD TIME', 'Note'].includes(cell.toUpperCase().trim())
    )) {
      rows = rows.slice(1);
    }
    
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
      startFieldIndex = 0; // 'mark' フィールドから開始
    }

    // データをペースト
    const updatedSections = [...sections];
    const editableFields = ['mark', 'name', 'model', 'vender', 'qty', 'unitPrice', 'leadTime', 'supplier', 'note'] as const;
    
    // セクションを取得
    const targetSection = updatedSections.find(s => s.id === startSectionId);
    if (!targetSection) return;
    
    // 必要に応じて新しい行を追加
    const requiredRows = startRowIndex + rows.length;
    while (targetSection.parts.length < requiredRows) {
      const newPart: ElectricalPart = {
        id: `new-${Date.now()}-${targetSection.parts.length}`,
        item: targetSection.parts.length + 1,
        mark: '-',
        name: '',
        model: '',
        vender: '',
        qty: 0,
        unitPrice: 0,
        total: 0,
        leadTime: '',
        supplier: '',
        note: ''
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
      
      // Excelの列構成を考慮してマッピング
      // Excel: MARK, NAME, MODEL, BRAND, QTY, UNIT PRICE, TOTAL, Delivery, Supplier, Note
      // システム: mark, name, model, vender, qty, unitPrice, (total), leadTime, supplier, note
      
      const excelToSystemMapping = {
        0: 'mark',      // MARK → mark
        1: 'name',      // NAME → name
        2: 'model',     // MODEL → model
        3: 'vender',    // BRAND → vender
        4: 'qty',       // QTY → qty
        5: 'unitPrice', // UNIT PRICE → unitPrice
        // 6: TOTAL (skip - auto calculated)
        7: 'leadTime',  // Delivery → leadTime
        8: 'supplier',  // Supplier → supplier
        9: 'note'       // Note → note
      };
      
      row.forEach((cellValue, colIndex) => {
        const fieldName = excelToSystemMapping[colIndex];
        if (!fieldName) return;
        
        // ペースト開始位置からの相対位置を考慮
        const field = editableFields.find(f => f === fieldName);
        if (!field) return;
        
        if (field === 'qty' || field === 'unitPrice') {
          // カンマを除去してから数値に変換
          const cleanedValue = cellValue.replace(/,/g, '');
          const numValue = parseFloat(cleanedValue) || 0;
          (targetPart as any)[field] = numValue;
          targetPart.total = targetPart.qty * targetPart.unitPrice;
        } else if (field === 'leadTime') {
          // Deliveryの値を処理（"1week" → "7"、数字のみなら維持）
          let leadTimeValue = cellValue.trim();
          if (leadTimeValue.toLowerCase().includes('week')) {
            const weeks = parseInt(leadTimeValue);
            leadTimeValue = String(weeks * 7);
          }
          targetPart.leadTime = leadTimeValue;
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
  const getFieldIndex = (field: keyof ElectricalPart): number => {
    const fields = ['mark', 'name', 'model', 'vender', 'qty', 'unitPrice', 'leadTime', 'supplier', 'note'] as const;
    return fields.indexOf(field as any);
  };

  // コピー処理
  const handleCopy = (e: React.ClipboardEvent | KeyboardEvent) => {
    if (!isEditing || selectedCells.size === 0) return;
    e.preventDefault();

    // 選択されたセルのデータを取得
    const editableFields = ['mark', 'name', 'model', 'vender', 'qty', 'unitPrice', 'leadTime', 'supplier', 'note'] as const;
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
  const deleteSelectedCells = useCallback(() => {
    console.log('deleteSelectedCells called, selectedCells:', selectedCellsRef.current.size);
    console.log('selectedCellsRef.current:', selectedCellsRef.current);
    console.log('Array from selectedCellsRef:', Array.from(selectedCellsRef.current));
    
    if (selectedCellsRef.current.size === 0) return;
    
    // テスト用：最初のセルを強制的に削除
    setSections(prevSections => {
      // 深いコピーを作成
      const updatedSections = prevSections.map(section => ({
        ...section,
        parts: section.parts.map(part => ({ ...part }))
      }));
      
      const editableFields = ['mark', 'name', 'model', 'vender', 'qty', 'unitPrice', 'leadTime', 'supplier', 'note'] as const;
      
      
      selectedCellsRef.current.forEach(cellKey => {
        console.log('Processing cellKey:', cellKey);
        
        // UUID形式のIDを考慮した解析
        // 形式: sectionId(UUID)-partId(UUID)-field
        const lastDashIndex = cellKey.lastIndexOf('-');
        const field = cellKey.substring(lastDashIndex + 1);
        const remainingKey = cellKey.substring(0, lastDashIndex);
        
        // partIdを取得（UUID形式なので、後ろから5つのダッシュ区切りを取る）
        const partIdMatch = remainingKey.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})$/);
        if (!partIdMatch) {
          console.log('Failed to parse partId from:', remainingKey);
          return;
        }
        
        const partId = partIdMatch[1];
        const sectionId = remainingKey.substring(0, remainingKey.length - partId.length - 1);
        
        console.log('Parsed:', { sectionId, partId, field });
        
        const section = updatedSections.find(s => s.id === sectionId);
        if (!section) {
          console.log('Section not found:', sectionId);
          return;
        }
        
        const part = section.parts.find(p => p.id === partId);
        if (!part) {
          console.log('Part not found:', partId);
          return;
        }
        
        if (editableFields.includes(field as any)) {
          if (field === 'qty') {
            part.qty = 0;
            part.total = 0;  // qtyが0なのでtotalも0
          } else if (field === 'unitPrice') {
            part.unitPrice = 0;
            part.total = 0;  // unitPriceが0なのでtotalも0
          } else if (field === 'mark') {
            part.mark = '-';
          } else {
            (part as any)[field] = '';
          }
        }
      });
      
      console.log('updatedSections:', updatedSections);
      
      // 履歴に追加
      addToHistory(prevSections);
      
      // hasChangesを設定
      setHasChanges(true);
      
      return updatedSections;
    });
    
    setSelectedCells(new Set());
    
    // 削除後に強制的にコンポーネントを更新
    if (onUnsavedChanges) {
      onUnsavedChanges(true);
    }
  }, [onUnsavedChanges, setHasChanges]);

  // 全選択
  const selectAll = () => {
    const newSelectedCells = new Set<string>();
    const editableFields = ['mark', 'name', 'model', 'vender', 'qty', 'unitPrice', 'leadTime', 'supplier', 'note'] as const;
    
    sections.forEach(section => {
      section.parts.forEach(part => {
        editableFields.forEach(field => {
          newSelectedCells.add(`${section.id}-${part.id}-${field}`);
        });
      });
    });
    
    setSelectedCells(newSelectedCells);
  };

  // キーボードショートカット
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditing) {
        // editingCellがない場合のショートカット
        if (!editingCell) {
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
        }
        
        // Delete キーで選択セルを削除
        if (e.key === 'Delete') {
          console.log('Delete key pressed, selectedCellsRef:', selectedCellsRef.current);
          console.log('selectedCellsRef size:', selectedCellsRef.current.size);
          console.log('selectedCellsRef content:', Array.from(selectedCellsRef.current));
          e.preventDefault();
          deleteSelectedCells();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isEditing, editingCell, selectedCellsRef, deleteSelectedCells]);

  // グローバルなマウスアップイベント
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsSelecting(false);
    };
    
    document.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, []);
  
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
    return sum + section.parts.reduce((sectionSum, part) => sectionSum + part.total, 0);
  }, 0);

  // セクション毎の合計金額を計算
  const getSectionTotal = (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    return section ? section.parts.reduce((sum, part) => sum + part.total, 0) : 0;
  };

  // セルのスタイルクラスを取得
  const getCellClassName = (sectionId: string, partId: string, field: string) => {
    const isSelected = selectedCells.has(`${sectionId}-${partId}-${field}`);
    return `cursor-pointer hover:bg-blue-50 px-1 py-0.5 min-h-[1.5rem] ${
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
      <div 
        className="relative outline-none" 
        ref={tableRef} 
        tabIndex={0}
        onClick={(e) => {
          // セレクトボックスをクリックした場合は処理しない
          const target = e.target as HTMLElement;
          if (target.tagName !== 'SELECT' && target.tagName !== 'OPTION') {
            if (tableRef.current) {
              tableRef.current.focus();
            }
          }
        }}
      >
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
                    const newPart: ElectricalPart = {
                      id: `new-${Date.now()}`,
                      item: 0,
                      mark: '-',
                      name: '',
                      model: '',
                      vender: '',
                      qty: 0,
                      unitPrice: 0,
                      total: 0,
                      leadTime: '',
                      supplier: '',
                      note: ''
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-xs"
              >
                編集
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
                  disabled={!hasChanges}
                >
                  保存
                </button>
                <button 
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-xs"
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
                  <span className="font-semibold">操作方法:</span> クリックで編集 | Shift+クリック 範囲選択 | Ctrl+C コピー | Ctrl+V ペースト | Ctrl+A 全選択 | Delete 削除
                </div>
                <button 
                  onClick={addSection}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-xs"
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

            <table className="border-collapse border border-gray-300 w-full table-fixed">
              <colgroup>
                <col style={{ width: '30px' }} />
                <col style={{ width: '55px' }} />
                <col style={{ width: '140px' }} />
                <col style={{ width: '160px' }} />
                <col style={{ width: '70px' }} />
                <col style={{ width: '25px' }} />
                <col style={{ width: '50px' }} />
                <col style={{ width: '50px' }} />
                <col style={{ width: '25px' }} />
                <col style={{ width: '120px' }} />
                <col style={{ width: '250px' }} />
                {isEditing && <col style={{ width: '120px' }} />}
              </colgroup>
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    ITEM
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    MARK
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    NAME
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    MODEL
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    VENDER
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    QTY
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-right font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    UNIT PRICE
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-right font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    TOTAL
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    Lead time
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    Supplier
                  </th>
                  <th className="border border-gray-300 px-2 py-1 text-left font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                    Note
                  </th>
                  {isEditing && (
                    <th className="border border-gray-300 px-2 py-1 text-center font-medium text-gray-700 uppercase tracking-wider" style={{ fontSize: '11px' }}>
                      操作
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white">
                {section.parts.map((part) => (
                  <tr 
                    key={part.id}
                    className="hover:bg-gray-50"
                    onContextMenu={(e) => handleContextMenu(e, section.id, part.id)}
                  >
                    <td className="border border-gray-300 px-2 py-1 text-center text-xs">
                      {part.item}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'mark' ? (
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
                          onClick={(e) => handleCellClick(section.id, part.id, 'mark', e)}
                                                    className={getCellClassName(section.id, part.id, 'mark')}
                        >
                          {part.mark}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
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
                          onMouseDown={(e) => handleMouseDown(section.id, part.id, 'name', e)}
                          onMouseEnter={() => handleMouseEnter(section.id, part.id, 'name')}
                          onMouseUp={handleMouseUp}
                          className={getCellClassName(section.id, part.id, 'name')}
                        >
                          {part.name || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'model' ? (
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
                          onClick={(e) => handleCellClick(section.id, part.id, 'model', e)}
                          className={getCellClassName(section.id, part.id, 'model')}
                        >
                          {part.model || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'vender' ? (
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
                          onClick={(e) => handleCellClick(section.id, part.id, 'vender', e)}
                          className={getCellClassName(section.id, part.id, 'vender')}
                        >
                          {part.vender || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center text-xs">
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
                          {part.qty || ''}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right text-xs">
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
                          {part.unitPrice ? part.unitPrice.toLocaleString('ja-JP') : ''}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-right text-xs bg-gray-50">
                      {part.total ? part.total.toLocaleString('ja-JP') : ''}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-center text-xs">
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
                    <td className="border border-gray-300 px-2 py-1 text-xs">
                      {editingCell?.sectionId === section.id && editingCell?.rowId === part.id && editingCell.field === 'supplier' ? (
                        <div 
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <select
                            value={editValue}
                            onChange={(e) => {
                              const newValue = e.target.value;
                              handleCellChange(newValue);
                              // セレクトボックスの場合は即座に値を反映
                              if (newValue) {
                                const updatedSections = sections.map(section => {
                                  if (section.id === editingCell.sectionId) {
                                    return {
                                      ...section,
                                      parts: section.parts.map(p => {
                                        if (p.id === editingCell.rowId) {
                                          return { ...p, supplier: newValue };
                                        }
                                        return p;
                                      })
                                    };
                                  }
                                  return section;
                                });
                                setSections(updatedSections);
                                addToHistory(updatedSections);
                                setEditingCell(null);
                                setEditValue('');
                              }
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') {
                                e.preventDefault();
                                setEditingCell(null);
                                setEditValue('');
                              }
                            }}
                            className="w-full px-1 py-0.5 text-xs border-0 bg-blue-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onClick={(e) => {
                              e.stopPropagation();
                              console.log('Select clicked, suppliers count:', suppliers.length, 'loading:', suppliersLoading);
                            }}
                          >
                          <option value="">選択してください</option>
                          {suppliersLoading ? (
                            <option value="" disabled>読み込み中...</option>
                          ) : suppliers.length === 0 ? (
                            <option value="" disabled>サプライヤーが見つかりません</option>
                          ) : (
                            suppliers.map(supplier => (
                              <option key={supplier.id} value={supplier.name}>
                                {supplier.name}
                              </option>
                            ))
                          )}
                          </select>
                        </div>
                      ) : (
                        <div
                          onClick={(e) => handleCellClick(section.id, part.id, 'supplier', e)}
                          className={getCellClassName(section.id, part.id, 'supplier')}
                        >
                          {part.supplier || <span className="text-gray-400">-</span>}
                        </div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-2 py-1 text-xs">
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
                    {isEditing && (
                      <td className="border border-gray-300 px-2 py-1 text-center">
                        <button
                          onClick={() => deleteRow(section.id, part.id)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          削除
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {section.parts.length === 0 && (
                  <tr>
                    <td colSpan={isEditing ? 12 : 11} className="border border-gray-300 px-2 py-8 text-center text-gray-500">
                      データがありません。{isEditing && '「部品追加」ボタンをクリックして新しい部品を追加してください。'}
                    </td>
                  </tr>
                )}
                <tr className="font-semibold bg-gray-100">
                  <td colSpan={7} className="border border-gray-300 px-2 py-1 text-right">
                    {section.name} SUBTOTAL
                  </td>
                  <td className="border border-gray-300 px-2 py-1 text-right">
                    {getSectionTotal(section.id).toLocaleString('ja-JP')}
                  </td>
                  <td className="border border-gray-300 px-2 py-1" colSpan={isEditing ? 4 : 3}></td>
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* 総合計 */}
        <div className="mt-4 bg-gray-200 px-4 py-3 flex justify-between items-center rounded-lg">
          <span className="font-bold text-lg">GRAND TOTAL</span>
          <span className="font-bold text-lg">
            {totalAmount.toLocaleString('ja-JP')}
          </span>
        </div>
      </div>
    </div>
  );
}

export default memo(ElectricalPartsTable);