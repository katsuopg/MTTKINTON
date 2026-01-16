const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  console.log('Testing employee page...');
  
  try {
    // Try port 3000 first
    console.log('\nTrying http://localhost:3010/ja/employees...');
    await page.goto('http://localhost:3010/ja/employees', { 
      waitUntil: 'domcontentloaded',
      timeout: 5000 
    });
    console.log('✓ Port 3000 is accessible');
  } catch (error) {
    console.log('✗ Port 3000 failed:', error.message);
    
    // Try port 3001
    try {
      console.log('\nTrying http://localhost:3010/ja/employees...');
      await page.goto('http://localhost:3010/ja/employees', { 
        waitUntil: 'domcontentloaded',
        timeout: 5000 
      });
      console.log('✓ Port 3001 is accessible');
    } catch (error2) {
      console.log('✗ Port 3001 failed:', error2.message);
    }
  }
  
  // Check current URL
  const currentUrl = page.url();
  console.log('\nCurrent URL:', currentUrl);
  
  // Check page title
  const title = await page.title();
  console.log('Page title:', title);
  
  // Check for errors
  const pageContent = await page.content();
  if (pageContent.includes('Error') || pageContent.includes('error')) {
    console.log('\n⚠️  Error found in page content');
    
    // Get error details
    const errorText = await page.evaluate(() => {
      const errorElement = document.querySelector('[data-nextjs-error]') || 
                          document.querySelector('.error') ||
                          document.body;
      return errorElement ? errorElement.innerText : 'No specific error element found';
    });
    console.log('Error details:', errorText);
  }
  
  // Check for login redirect
  if (currentUrl.includes('/auth/login')) {
    console.log('\n→ Redirected to login page');
    console.log('Attempting login...');
    
    // Fill login form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    
    // Click login button
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    const afterLoginUrl = page.url();
    console.log('After login URL:', afterLoginUrl);
  }
  
  // Check console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });
  
  // Take screenshot
  await page.screenshot({ path: 'employee-page-screenshot.png' });
  console.log('\n📸 Screenshot saved as employee-page-screenshot.png');
  
  await browser.close();
})();