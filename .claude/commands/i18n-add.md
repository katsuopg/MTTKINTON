---
name: i18n-add
description: "多言語テキストを追加する"
---

# /i18n-add - 多言語テキスト追加

## 使用方法
```
/i18n-add [キー] [日本語] [英語] [タイ語]
```

## 例
```
/i18n-add saveSuccess "保存しました" "Saved successfully" "บันทึกแล้ว"
```

## 対象ファイル
- `messages/ja.json`
- `messages/en.json`
- `messages/th.json`

## コンポーネント内での使用

### 方式1: messagesファイル使用
```tsx
import ja from '@/messages/ja.json';
const t = locale === 'ja' ? ja : locale === 'th' ? th : en;
```

### 方式2: 翻訳オブジェクト（コンポーネント内）
```tsx
const translations = {
  ja: { title: 'タイトル', save: '保存' },
  en: { title: 'Title', save: 'Save' },
  th: { title: 'หัวข้อ', save: 'บันทึก' }
};
const t = translations[locale] || translations.ja;
```

## ルール
- 新しいテキストは必ず3言語分追加
- キーは英語のcamelCase
- 長文は改行せずに1行で記述
