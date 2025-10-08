const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // テストページのリスト
    const pages = [
      { name: 'Dashboard', url: 'http://localhost:3000/ja/dashboard' },
      { name: 'Employees', url: 'http://localhost:3000/ja/employees' },
      { name: 'Work No', url: 'http://localhost:3000/ja/workno' },
      { name: 'Projects', url: 'http://localhost:3000/ja/project-management' }
    ];

    console.log('サーバー状態確認中...\n');

    for (const testPage of pages) {
      console.log(`Checking ${testPage.name}...`);
      
      try {
        const response = await page.goto(testPage.url, { 
          waitUntil: 'networkidle',
          timeout: 30000
        });
        const currentUrl = page.url();
        
        if (currentUrl.includes('/auth/login')) {
          console.log(`❌ ${testPage.name}: 認証ページにリダイレクトされました`);
        } else if (response && response.status() === 200) {
          console.log(`✅ ${testPage.name}: 正常にアクセス可能 (Status: ${response.status()})`);
          
          // タイトルを取得
          const title = await page.title();
          console.log(`   Title: ${title}`);
          
          // エラーメッセージをチェック
          const hasError = await page.locator('text=Error').count();
          if (hasError > 0) {
            console.log(`   ⚠️  エラーメッセージが表示されています`);
          }
        } else {
          console.log(`❌ ${testPage.name}: エラー (Status: ${response ? response.status() : 'Unknown'})`);
        }
      } catch (error) {
        console.log(`❌ ${testPage.name}: アクセスエラー - ${error.message}`);
      }
      
      console.log('');
    }

    // スクリーンショット
    await page.goto('http://localhost:3000/ja/dashboard');
    await page.screenshot({ path: 'server-status.png', fullPage: true });
    console.log('スクリーンショットを server-status.png に保存しました');
    
  } catch (error) {
    console.error('テスト実行エラー:', error);
  } finally {
    await browser.close();
  }
})();