import type { FieldDefinition, ValidationResult, ValidationError } from '@/types/dynamic-app';
import { NON_INPUT_FIELD_TYPES } from '@/types/dynamic-app';

/**
 * レコードデータをフィールド定義に基づいてバリデーション
 */
export function validateRecordData(
  fields: FieldDefinition[],
  data: Record<string, unknown>
): ValidationResult {
  const errors: ValidationError[] = [];

  for (const field of fields) {
    if (!field.is_active) continue;

    // 自動入力・装飾フィールドはバリデーション不要
    if (NON_INPUT_FIELD_TYPES.has(field.field_type)) continue;

    const value = data[field.field_code];

    // ファイルアップロードはJSONBデータではなく別テーブルで管理するためスキップ
    if (field.field_type === 'file_upload') continue;

    // 関連レコード・計算フィールドは入力バリデーション不要
    if (field.field_type === 'related_records' || field.field_type === 'calculated') continue;

    // 必須チェック
    if (field.required) {
      if (value === undefined || value === null || value === '') {
        errors.push({
          field_code: field.field_code,
          message: `${field.label.ja || field.field_code} は必須です`,
        });
        continue;
      }
    }

    // 値が空なら以降のバリデーションはスキップ
    if (value === undefined || value === null || value === '') continue;

    // フィールドタイプ別バリデーション
    switch (field.field_type) {
      case 'single_line_text':
        if (typeof value !== 'string') {
          errors.push({ field_code: field.field_code, message: '文字列を入力してください' });
        } else {
          if (field.validation?.max && value.length > field.validation.max) {
            errors.push({ field_code: field.field_code, message: `${field.validation.max}文字以内で入力してください` });
          }
          if (field.validation?.pattern) {
            const regex = new RegExp(field.validation.pattern);
            if (!regex.test(value)) {
              errors.push({ field_code: field.field_code, message: field.validation.patternMessage || '入力形式が不正です' });
            }
          }
        }
        break;

      case 'multi_line_text':
        if (typeof value !== 'string') {
          errors.push({ field_code: field.field_code, message: '文字列を入力してください' });
        } else if (field.validation?.max && value.length > field.validation.max) {
          errors.push({ field_code: field.field_code, message: `${field.validation.max}文字以内で入力してください` });
        }
        break;

      case 'number': {
        const numValue = typeof value === 'string' ? Number(value) : value;
        if (typeof numValue !== 'number' || isNaN(numValue)) {
          errors.push({ field_code: field.field_code, message: '数値を入力してください' });
        } else {
          if (field.validation?.min !== undefined && numValue < field.validation.min) {
            errors.push({ field_code: field.field_code, message: `${field.validation.min}以上の値を入力してください` });
          }
          if (field.validation?.max !== undefined && numValue > field.validation.max) {
            errors.push({ field_code: field.field_code, message: `${field.validation.max}以下の値を入力してください` });
          }
        }
        break;
      }

      case 'date':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          errors.push({ field_code: field.field_code, message: '有効な日付を入力してください' });
        }
        break;

      case 'time':
        if (typeof value !== 'string' || !/^\d{2}:\d{2}(:\d{2})?$/.test(value)) {
          errors.push({ field_code: field.field_code, message: '有効な時刻を入力してください（HH:MM）' });
        }
        break;

      case 'datetime':
        if (typeof value !== 'string' || isNaN(Date.parse(value))) {
          errors.push({ field_code: field.field_code, message: '有効な日時を入力してください' });
        }
        break;

      case 'link': {
        const linkType = field.validation?.link_type || 'url';
        const strVal = String(value);
        if (linkType === 'url') {
          try {
            new URL(strVal);
          } catch {
            errors.push({ field_code: field.field_code, message: '有効なURLを入力してください' });
          }
        } else if (linkType === 'email') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
            errors.push({ field_code: field.field_code, message: '有効なメールアドレスを入力してください' });
          }
        } else if (linkType === 'tel') {
          if (!/^[\d\s\-+()]+$/.test(strVal)) {
            errors.push({ field_code: field.field_code, message: '有効な電話番号を入力してください' });
          }
        }
        break;
      }

      case 'dropdown':
      case 'radio_button':
        if (field.options) {
          const validValues = field.options.map((o) => o.value);
          if (!validValues.includes(String(value))) {
            errors.push({ field_code: field.field_code, message: '選択肢から選んでください' });
          }
        }
        break;

      case 'checkbox':
      case 'multi_select':
        if (field.options) {
          const validValues = field.options.map((o) => o.value);
          if (Array.isArray(value)) {
            for (const v of value) {
              if (!validValues.includes(String(v))) {
                errors.push({ field_code: field.field_code, message: '無効な選択肢が含まれています' });
                break;
              }
            }
          }
        }
        break;

      case 'rich_editor':
        if (typeof value !== 'string') {
          errors.push({ field_code: field.field_code, message: 'テキストを入力してください' });
        }
        break;

      case 'lookup':
        if (typeof value !== 'string') {
          errors.push({ field_code: field.field_code, message: 'ルックアップ値を選択してください' });
        }
        break;

      case 'user_select':
      case 'org_select':
      case 'group_select': {
        const allowMultiple = field.validation?.allow_multiple === true;
        if (allowMultiple) {
          if (!Array.isArray(value)) {
            errors.push({ field_code: field.field_code, message: '選択値が不正です' });
          }
        } else {
          if (typeof value !== 'string') {
            errors.push({ field_code: field.field_code, message: '値を選択してください' });
          }
        }
        break;
      }

      case 'subtable': {
        if (!Array.isArray(value)) {
          errors.push({ field_code: field.field_code, message: 'テーブルデータが不正です' });
        } else {
          const config = field.validation?.subtable_config;
          if (config?.min_rows && value.length < config.min_rows) {
            errors.push({ field_code: field.field_code, message: `最低${config.min_rows}行が必要です` });
          }
          if (config?.max_rows && value.length > config.max_rows) {
            errors.push({ field_code: field.field_code, message: `最大${config.max_rows}行までです` });
          }
          // 各行の必須フィールドチェック
          const subtableFields = field.validation?.subtable_fields || [];
          for (let i = 0; i < value.length; i++) {
            const row = value[i] as Record<string, unknown>;
            for (const sf of subtableFields) {
              if (sf.required) {
                const cellVal = row[sf.field_code];
                if (cellVal === undefined || cellVal === null || cellVal === '') {
                  errors.push({
                    field_code: field.field_code,
                    message: `${i + 1}行目: ${sf.label.ja || sf.field_code} は必須です`,
                  });
                }
              }
            }
          }
        }
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}
