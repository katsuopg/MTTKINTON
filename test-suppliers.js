const { chromium } = require('playwright');

async function testSuppliers() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Starting Suppliers page test...');
    
    // ログインページにアクセス
    console.log('1. Accessing login page...');
    await page.goto('http://localhost:3001/ja/auth/login');
    await page.waitForLoadState('networkidle');
    
    // ログイン
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'tadokoro@megatech.co.th');
    await page.fill('input[type="password"]', 'kA906223!!!');
    await page.click('button[type="submit"]');
    
    // ダッシュボードを待つ
    await page.waitForURL('**/dashboard', { timeout: 60000 });
    console.log('3. Login successful');
    
    // サプライヤー管理ページにアクセス
    console.log('\n4. Accessing Suppliers page...');
    await page.goto('http://localhost:3001/ja/suppliers');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    console.log('- Current URL:', page.url());
    console.log('- Page title:', await page.title());
    
    // エラーメッセージの確認
    const errorMessage = await page.$('.text-red-600');
    if (errorMessage) {
      console.log('\n❌ Error found:');
      console.log(await errorMessage.textContent());
    }
    
    // ページの内容を確認
    const pageContent = await page.content();
    console.log('\n5. Checking page structure...');
    
    // メニュー/ヘッダーの存在確認
    const hasHeader = pageContent.includes('nav') || pageContent.includes('header');
    console.log('- Has navigation/header:', hasHeader);
    
    // DashboardLayoutの存在確認
    const hasDashboardLayout = pageContent.includes('DashboardLayout') || pageContent.includes('menu');
    console.log('- Has DashboardLayout:', hasDashboardLayout);
    
    // テーブルの存在確認
    const hasTable = pageContent.includes('<table');
    console.log('- Has table:', hasTable);
    
    // データの存在確認
    const supplierRows = await page.$$('tbody tr');
    console.log('- Number of supplier rows:', supplierRows.length);
    
    // エラーの詳細を確認
    if (pageContent.includes('API token')) {
      console.log('\n⚠️ API token error detected');
      const errorText = pageContent.match(/The API token[^<]*/);
      if (errorText) {
        console.log('Error details:', errorText[0]);
      }
    }
    
    // スクリーンショット
    await page.screenshot({ path: 'screenshots/suppliers-test.png', fullPage: true });
    console.log('\n✅ Screenshot saved: screenshots/suppliers-test.png');
    
    // デバッグ: ネットワークエラーの確認
    page.on('response', response => {
      if (!response.ok() && response.url().includes('kintone')) {
        console.log(`\n❌ Kintone API Error:`, response.status(), response.statusText());
      }
    });
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// テストを実行
testSuppliers();