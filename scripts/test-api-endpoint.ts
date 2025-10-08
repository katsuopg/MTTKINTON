#!/usr/bin/env node
import { config } from 'dotenv';

// 環境変数を読み込む
config({ path: '.env.local' });

async function testApiEndpoint() {
  console.log('=== APIエンドポイントテスト ===\n');
  
  const baseUrl = 'http://localhost:3000';
  const customerId = '57-014-SPT';  // SUGINO PRESS
  const period = '14';
  
  try {
    console.log(`テスト: ${baseUrl}/api/customer/${customerId}/data?period=${period}&type=invoice`);
    
    const response = await fetch(`${baseUrl}/api/customer/${customerId}/data?period=${period}&type=invoice`);
    console.log('HTTPステータス:', response.status);
    console.log('Content-Type:', response.headers.get('content-type'));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('エラーレスポンス:', errorText);
      return;
    }
    
    const data = await response.json();
    console.log('レスポンスデータ:');
    console.log('レコード数:', Array.isArray(data) ? data.length : 'Not an array');
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('\n最初のレコード:');
      console.log(JSON.stringify(data[0], null, 2));
    } else if (Array.isArray(data) && data.length === 0) {
      console.log('データは空の配列です');
      
      // 別の期間でも試す
      console.log('\n第9期のデータも確認...');
      const response9 = await fetch(`${baseUrl}/api/customer/${customerId}/data?period=9&type=invoice`);
      if (response9.ok) {
        const data9 = await response9.json();
        console.log('第9期のレコード数:', Array.isArray(data9) ? data9.length : 'Not an array');
      }
    }
    
  } catch (error) {
    console.error('エラー:', error);
  }
}

testApiEndpoint();