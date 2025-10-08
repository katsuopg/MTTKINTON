import { config } from 'dotenv';
import { KintoneClient } from '../src/lib/kintone/client';
import type { InvoiceRecord } from '../src/types/kintone';

// 環境変数を読み込む
config({ path: '.env.local' });

const APP_ID = '26';
const API_TOKEN = process.env.KINTONE_API_TOKEN_INVOICE || '';

async function debugInvoiceDiscrepancy() {
  console.log('=== 請求書データ相違調査 ===');
  
  const client = new KintoneClient(APP_ID, API_TOKEN);
  
  try {
    // 第9期のデータを詳細に調査
    console.log('\n1. 第9期データの詳細調査');
    
    // パターン1: 9-で始まる
    const query9 = '文字列__1行_ like "9-%" order by 文字列__1行_ asc limit 500';
    const records9 = await client.getRecords<InvoiceRecord>(query9);
    console.log('パターン "9-%" のレコード数:', records9.length);
    
    // パターン2: 09-で始まる
    const query09 = '文字列__1行_ like "09-%" order by 文字列__1行_ asc limit 500';
    const records09 = await client.getRecords<InvoiceRecord>(query09);
    console.log('パターン "09-%" のレコード数:', records09.length);
    
    // 全ての第9期レコードを取得（ORクエリ）
    const query9All = '(文字列__1行_ like "9-%" or 文字列__1行_ like "09-%") order by 文字列__1行_ asc limit 500';
    const records9All = await client.getRecords<InvoiceRecord>(query9All);
    console.log('第9期全体（ORクエリ）のレコード数:', records9All.length);
    
    // 工事番号のパターンを分析
    const patterns9: Record<string, number> = {};
    records9All.forEach(record => {
      const workNo = record.文字列__1行_?.value || '';
      const prefix = workNo.substring(0, 3);
      patterns9[prefix] = (patterns9[prefix] || 0) + 1;
    });
    console.log('第9期の工事番号プレフィックス分析:', patterns9);
    
    // 第10期のデータを詳細に調査
    console.log('\n2. 第10期データの詳細調査');
    
    // パターン1: 10-で始まる
    const query10 = '文字列__1行_ like "10-%" order by 文字列__1行_ asc limit 500';
    const records10 = await client.getRecords<InvoiceRecord>(query10);
    console.log('パターン "10-%" のレコード数:', records10.length);
    
    // パターン2: 010-で始まる（念のため）
    const query010 = '文字列__1行_ like "010-%" order by 文字列__1行_ asc limit 500';
    const records010 = await client.getRecords<InvoiceRecord>(query010);
    console.log('パターン "010-%" のレコード数:', records010.length);
    
    // 工事番号のパターンを分析
    const patterns10: Record<string, number> = {};
    records10.forEach(record => {
      const workNo = record.文字列__1行_?.value || '';
      const prefix = workNo.substring(0, 4);
      patterns10[prefix] = (patterns10[prefix] || 0) + 1;
    });
    console.log('第10期の工事番号プレフィックス分析:', patterns10);
    
    // 重複チェック
    console.log('\n3. 重複レコードの調査');
    
    // 第9期の工事番号リスト
    const workNos9 = new Set<string>();
    const duplicates9: string[] = [];
    records9All.forEach(record => {
      const workNo = record.文字列__1行_?.value || '';
      if (workNos9.has(workNo)) {
        duplicates9.push(workNo);
      } else {
        workNos9.add(workNo);
      }
    });
    console.log('第9期のユニーク工事番号数:', workNos9.size);
    console.log('第9期の重複工事番号数:', duplicates9.length);
    if (duplicates9.length > 0) {
      console.log('重複例:', duplicates9.slice(0, 5));
    }
    
    // 第10期の工事番号リスト
    const workNos10 = new Set<string>();
    const duplicates10: string[] = [];
    records10.forEach(record => {
      const workNo = record.文字列__1行_?.value || '';
      if (workNos10.has(workNo)) {
        duplicates10.push(workNo);
      } else {
        workNos10.add(workNo);
      }
    });
    console.log('第10期のユニーク工事番号数:', workNos10.size);
    console.log('第10期の重複工事番号数:', duplicates10.length);
    if (duplicates10.length > 0) {
      console.log('重複例:', duplicates10.slice(0, 5));
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

debugInvoiceDiscrepancy();