const { chromium } = require('playwright');

async function testSuppliersRealData() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Starting Suppliers real data test...');
    
    // ログインページにアクセス
    console.log('1. Accessing login page...');
    await page.goto('http://localhost:3000/ja/auth/login');
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
    await page.goto('http://localhost:3000/ja/suppliers');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    console.log('- Current URL:', page.url());
    console.log('- Page title:', await page.title());
    
    // エラーメッセージの確認
    const errorMessage = await page.$('.text-red-600');
    if (errorMessage) {
      console.log('\n⚠️ Error message found:');
      console.log(await errorMessage.textContent());
    }
    
    // ページの内容を確認
    console.log('\n5. Checking page content...');
    
    // メニュー/ヘッダーの存在確認
    const pageContent = await page.content();
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
    
    // 最初の数行のサプライヤー情報を表示
    if (supplierRows.length > 0) {
      console.log('\n6. Sample supplier data:');
      for (let i = 0; i < Math.min(5, supplierRows.length); i++) {
        const row = supplierRows[i];
        const cells = await row.$$('td');
        if (cells.length >= 3) {
          const supplierId = await cells[0].textContent();
          const companyName = await cells[1].textContent();
          const tel = await cells[2].textContent();
          console.log(`  ${i + 1}. ID: ${supplierId?.trim()}, 会社名: ${companyName?.trim()}, TEL: ${tel?.trim()}`);
        }
      }
    }
    
    // デモデータのメッセージを確認
    const demoMessage = await page.$('.text-blue-600');
    if (demoMessage) {
      console.log('\n⚠️ Demo data message:', await demoMessage.textContent());
    }
    
    // スクリーンショット
    await page.screenshot({ path: 'screenshots/suppliers-real-data.png', fullPage: true });
    console.log('\n✅ Screenshot saved: screenshots/suppliers-real-data.png');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// テストを実行
testSuppliersRealData();