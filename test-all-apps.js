const { chromium } = require('playwright');

async function testAllApps() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Starting MTT KINTON app testing...');
    
    // ログインページにアクセス（ポート3001に変更）
    console.log('1. Accessing login page...');
    await page.goto('http://localhost:3001/ja/auth/login');
    await page.waitForLoadState('networkidle');
    console.log('- Login page loaded');
    
    // ログイン情報を入力
    console.log('2. Logging in...');
    await page.fill('input[type="email"]', 'tadokoro@megatech.co.th');
    await page.fill('input[type="password"]', 'kA906223!!!');
    console.log('- Credentials entered');
    
    // ログインボタンをクリック
    await page.click('button[type="submit"]');
    console.log('- Login button clicked');
    
    // ダッシュボードの読み込みを待つ（タイムアウトを延長）
    try {
      await page.waitForURL('**/dashboard', { timeout: 60000 });
      console.log('3. Login successful, now on dashboard');
    } catch (error) {
      console.log('- Current URL:', page.url());
      console.log('- Page title:', await page.title());
      // エラーメッセージがあるか確認
      const errorMessage = await page.$('.text-red-600');
      if (errorMessage) {
        console.log('- Error message found:', await errorMessage.textContent());
      }
      throw error;
    }
    
    // テストするアプリのリスト
    const apps = [
      { name: 'Project Management', url: '/ja/project-management' },
      { name: 'Quotation', url: '/ja/quotation' },
      { name: 'Work No.', url: '/ja/workno' },
      { name: 'Order Management', url: '/ja/order-management' },
      { name: 'Customers', url: '/ja/customers' },
      { name: 'Staff', url: '/ja/staff' },
      { name: 'Suppliers', url: '/ja/suppliers' }
    ];
    
    // 各アプリをテスト
    for (const app of apps) {
      console.log(`\nTesting ${app.name}...`);
      
      // アプリのリストページにアクセス
      await page.goto(`http://localhost:3001${app.url}`);
      await page.waitForLoadState('networkidle');
      console.log(`- Accessed ${app.name} list page`);
      
      // スクリーンショットを撮る
      await page.screenshot({ path: `screenshots/${app.name.replace(/\s+/g, '-')}-list.png` });
      
      // 詳細リンクを探す（アプリ別のロジック）
      let allLinks = await page.$$('a[href]');
      let detailLinks = [];
      
      // 各リンクのhrefをチェックして、詳細ページのリンクのみを抽出
      for (const link of allLinks) {
        const href = await link.getAttribute('href');
        if (!href) continue;
        
        // アプリのベースURLで始まり、かつIDパス部分を持つリンクを探す
        if (href.startsWith(app.url + '/') && href.length > app.url.length + 1) {
          detailLinks.push(link);
        }
      }
      
      console.log(`- Searching for detail links with pattern: ${app.url}/...`);
      console.log(`- Found ${detailLinks.length} detail links`);
      
      if (detailLinks.length > 0) {
        // ランダムにリンクを選択（最大5個から選ぶ）
        const randomIndex = Math.floor(Math.random() * Math.min(detailLinks.length, 5));
        const link = detailLinks[randomIndex];
        const href = await link.getAttribute('href');
        console.log(`- Clicking random link: ${href}`);
        
        // 詳細ページに移動
        await link.click();
        await page.waitForLoadState('networkidle', { timeout: 30000 });
        console.log(`- Accessed detail page: ${page.url()}`);
        
        // 詳細ページのスクリーンショット
        await page.screenshot({ path: `screenshots/${app.name.replace(/\s+/g, '-')}-detail.png` });
        
        // 添付ファイルビューアのテスト
        const fileViewerButton = await page.$('button:has-text("ファイル表示")');
        if (fileViewerButton) {
          console.log(`- Found file viewer button, clicking...`);
          await fileViewerButton.click();
          await page.waitForTimeout(2000);
          
          // モーダルのスクリーンショット
          await page.screenshot({ path: `screenshots/${app.name.replace(/\s+/g, '-')}-file-viewer.png` });
          
          // モーダルを閉じる
          const closeButton = await page.$('button:has-text("閉じる")');
          if (closeButton) {
            await closeButton.click();
          }
        }
        
        // リストページに戻る
        await page.goBack();
        await page.waitForLoadState('networkidle');
      } else {
        console.log(`- No detail links found for ${app.name}`);
      }
    }
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await browser.close();
  }
}

// スクリーンショット用のディレクトリを作成
const fs = require('fs');
if (!fs.existsSync('screenshots')) {
  fs.mkdirSync('screenshots');
}

// テストを実行
testAllApps();