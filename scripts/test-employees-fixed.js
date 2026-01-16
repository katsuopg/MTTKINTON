const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to employees page...');
    await page.goto('http://localhost:3001/ja/employees', { waitUntil: 'networkidle' });
    
    // Check if page loaded successfully
    const title = await page.textContent('h1');
    console.log('Page title:', title);
    
    // Check for any errors
    const hasError = await page.locator('text=Build Error').count();
    if (hasError > 0) {
      console.log('❌ Build error detected');
    } else {
      console.log('✅ Page loaded successfully');
      
      // Check for employee table
      const hasTable = await page.locator('table').count();
      if (hasTable > 0) {
        console.log('✅ Employee table found');
        const rowCount = await page.locator('tbody tr').count();
        console.log(`Found ${rowCount} employee records`);
      } else {
        console.log('No employee table found');
      }
    }
    
    // Take screenshot
    await page.screenshot({ path: 'employees-page-fixed.png' });
    console.log('Screenshot saved as employees-page-fixed.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();