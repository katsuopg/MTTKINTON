const { chromium } = require('playwright');

async function testSupplierDetail() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Starting Supplier Detail page test...');
    
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
    console.log('\n4. Accessing Suppliers list page...');
    await page.goto('http://localhost:3000/ja/suppliers');
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // 最初のサプライヤーのリンクをクリック
    const firstSupplierLink = await page.$('tbody tr:first-child a');
    if (firstSupplierLink) {
      const supplierName = await firstSupplierLink.textContent();
      console.log(`5. Clicking on supplier: ${supplierName}`);
      await firstSupplierLink.click();
      await page.waitForLoadState('networkidle');
      
      console.log('\n6. Supplier detail page loaded');
      console.log('- Current URL:', page.url());
      console.log('- Page title:', await page.title());
      
      // 詳細ページの内容を確認
      const pageContent = await page.content();
      
      // ヘッダーの存在確認
      const hasHeader = pageContent.includes('nav') || pageContent.includes('header');
      console.log('- Has navigation/header:', hasHeader);
      
      // 一覧に戻るボタンの確認
      const backButton = await page.$('a:has-text("一覧に戻る")');
      console.log('- Has back to list button:', !!backButton);
      
      // 詳細情報の確認
      console.log('\n7. Checking detail information:');
      
      // サプライヤーID
      const supplierId = await page.$('text=サプライヤーID');
      console.log('- Supplier ID label found:', !!supplierId);
      
      // 会社名（現地語）
      const localCompanyName = await page.$('text=会社名（現地語）');
      console.log('- Local company name label found:', !!localCompanyName);
      
      // 電話番号
      const phoneLabel = await page.$('text=電話番号');
      console.log('- Phone label found:', !!phoneLabel);
      
      // メール
      const emailLabel = await page.$('text=メール');
      console.log('- Email label found:', !!emailLabel);
      
      // 住所
      const addressLabel = await page.$('text=住所');
      console.log('- Address label found:', !!addressLabel);
      
      // スクリーンショット
      await page.screenshot({ path: 'screenshots/supplier-detail.png', fullPage: true });
      console.log('\n✅ Screenshot saved: screenshots/supplier-detail.png');
      
      // 一覧に戻るボタンをクリック
      if (backButton) {
        console.log('\n8. Clicking back to list button...');
        await backButton.click();
        await page.waitForLoadState('networkidle');
        console.log('- Returned to suppliers list page');
      }
      
    } else {
      console.log('❌ No supplier links found in the list');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// テストを実行
testSupplierDetail();