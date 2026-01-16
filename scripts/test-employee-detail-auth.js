const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    // First, login
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3001/ja/auth/login');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'networkidle' });
    console.log('Logged in successfully');
    
    // Navigate to employee detail page
    console.log('Navigating to employee detail page...');
    await page.goto('http://localhost:3001/ja/employees/25', { waitUntil: 'networkidle' });
    
    // Check current URL
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);
    
    // Take screenshot regardless
    await page.screenshot({ path: 'employee-detail-current.png', fullPage: true });
    console.log('Screenshot saved as employee-detail-current.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();