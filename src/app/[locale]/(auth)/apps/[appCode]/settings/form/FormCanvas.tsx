'use client';

import React, { useState } from 'react';
import {
  GripVertical, X, Type, AlignLeft, Hash, Calendar, ChevronDown, CheckSquare,
  Circle, ListChecks, Clock, CalendarClock, Link,
  Paperclip, FileText,
  Search, GitBranch, Calculator, TableProperties,
  User, Building2, Shield,
  UserPlus, CalendarPlus, UserPen, CalendarCog,
  Tag, Square, Minus,
} from 'lucide-react';
import type { FieldDefinition, FieldType } from '@/types/dynamic-app';
import { FIELD_TYPE_INFO, DECORATIVE_FIELD_TYPES, AUTO_FIELD_TYPES, REFERENCE_FIELD_TYPES, ENTITY_SELECT_TYPES } from '@/types/dynamic-app';

const ICON_MAP: Record<string, React.ElementType> = {
  Type, AlignLeft, Hash, Calendar, ChevronDown, CheckSquare,
  Circle, ListChecks, Clock, CalendarClock, Link,
  Paperclip, FileText,
  Search, GitBranch, Calculator, TableProperties,
  User, Building2, Shield,
  UserPlus, CalendarPlus, UserPen, CalendarCog,
  Tag, Square, Minus,
};

interface FormCanvasProps {
  locale: string;
  fields: FieldDefinition[];
  selectedFieldId: string | null;
  onSelectField: (fieldId: string | null) => void;
  onReorderFields: (fields: FieldDefinition[]) => void;
  onRemoveField: (fieldId: string) => void;
  onDropNewField: (fieldType: FieldType, index: number) => void;
}

export default function FormCanvas({
  locale,
  fields,
  selectedFieldId,
  onSelectField,
  onReorderFields,
  onRemoveField,
  onDropNewField,
}: FormCanvasProps) {
  const lang = (locale === 'ja' || locale === 'en' || locale === 'th' ? locale : 'en') as 'ja' | 'en' | 'th';
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedFieldId(fieldId);
    e.dataTransfer.setData('existingFieldId', fieldId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = e.dataTransfer.types.includes('fieldtype') ? 'copy' : 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedFieldId(null);

    const newFieldType = e.dataTransfer.getData('fieldType') as FieldType;
    const existingFieldId = e.dataTransfer.getData('existingFieldId');

    if (newFieldType) {
      onDropNewField(newFieldType, index);
    } else if (existingFieldId) {
      const currentIndex = fields.findIndex((f) => f.id === existingFieldId);
      if (currentIndex === -1 || currentIndex === index) return;

      const newFields = [...fields];
      const [moved] = newFields.splice(currentIndex, 1);
      const insertIndex = currentIndex < index ? index - 1 : index;
      newFields.splice(insertIndex, 0, moved);

      const reordered = newFields.map((f, i) => ({ ...f, display_order: i, row_index: i }));
      onReorderFields(reordered);
    }
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDraggedFieldId(null);

    const newFieldType = e.dataTransfer.getData('fieldType') as FieldType;
    if (newFieldType) {
      onDropNewField(newFieldType, fields.length);
    }
  };

  const emptyText = lang === 'ja'
    ? '左のパレットからフィールドをドラッグ＆ドロップ、またはクリックして追加'
    : lang === 'th'
    ? 'ลากและวางฟิลด์จากแผงด้านซ้าย หรือคลิกเพื่อเพิ่ม'
    : 'Drag & drop fields from the palette, or click to add';

  const renderFieldContent = (field: FieldDefinition) => {
    const info = FIELD_TYPE_INFO[field.field_type];
    const Icon = ICON_MAP[info?.icon || 'Type'] || Type;
    const isDecorative = DECORATIVE_FIELD_TYPES.has(field.field_type);
    const isAuto = AUTO_FIELD_TYPES.has(field.field_type);
    const isReference = REFERENCE_FIELD_TYPES.has(field.field_type);

    if (field.field_type === 'hr') {
      return (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <hr className="flex-1 border-gray-300 dark:border-gray-600" />
        </div>
      );
    }

    if (field.field_type === 'space') {
      return (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <div className="flex-1 border border-dashed border-gray-300 dark:border-gray-600 rounded h-6" />
        </div>
      );
    }

    if (field.field_type === 'label') {
      return (
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
          <span className="text-sm italic text-gray-600 dark:text-gray-400 truncate">
            {field.label[lang] || field.label.ja || field.field_code}
          </span>
        </div>
      );
    }

    return (
      <>
        <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-800 dark:text-white truncate">
              {field.label[lang] || field.label.ja || field.field_code}
            </span>
            {field.required && (
              <span className="text-xs text-red-500 flex-shrink-0">*</span>
            )}
            {isAuto && (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                {lang === 'ja' ? '自動' : 'Auto'}
              </span>
            )}
            {isDecorative && (
              <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                {lang === 'ja' ? '装飾' : 'Deco'}
              </span>
            )}
            {isReference && (
              <span className="text-[10px] text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                {lang === 'ja' ? '参照' : 'Ref'}
              </span>
            )}
            {field.field_type === 'subtable' && (
              <span className="text-[10px] text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                {lang === 'ja' ? 'テーブル' : 'Table'}
              </span>
            )}
            {ENTITY_SELECT_TYPES.has(field.field_type) && (
              <span className="text-[10px] text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-900/20 px-1.5 py-0.5 rounded flex-shrink-0">
                {lang === 'ja' ? '選択' : 'Select'}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">
            {field.field_code}
          </span>
        </div>
      </>
    );
  };

  return (
    <div
      className="flex-1 overflow-y-auto bg-white dark:bg-gray-900/30 p-6"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      }}
      onDrop={handleCanvasDrop}
    >
      <div className="max-w-3xl mx-auto">
        {fields.length === 0 ? (
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 text-center">
            <Type className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">{emptyText}</p>
          </div>
        ) : (
          <div className="space-y-1">
            {fields.map((field, index) => {
              const info = FIELD_TYPE_INFO[field.field_type];
              const isSelected = selectedFieldId === field.id;
              const isDragged = draggedFieldId === field.id;

              return (
                <React.Fragment key={field.id}>
                  {dragOverIndex === index && (
                    <div className="h-1 bg-brand-500 rounded-full mx-4 transition-all" />
                  )}
                  <div
                    draggable
                    onDragStart={(e) => handleDragStart(e, field.id)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    onClick={() => onSelectField(field.id)}
                    className={`group flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 dark:border-brand-400'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    } ${isDragged ? 'opacity-40' : ''}`}
                  >
                    <GripVertical className="w-4 h-4 text-gray-300 dark:text-gray-600 cursor-grab active:cursor-grabbing flex-shrink-0" />
                    {renderFieldContent(field)}
                    <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded flex-shrink-0">
                      {info?.label[lang] || field.field_type}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveField(field.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </React.Fragment>
              );
            })}
            {dragOverIndex === fields.length && (
              <div className="h-1 bg-brand-500 rounded-full mx-4 transition-all" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
