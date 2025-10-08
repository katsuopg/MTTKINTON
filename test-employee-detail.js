const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  try {
    console.log('Navigating to employee detail page...');
    await page.goto('http://localhost:3001/ja/employees/25', { waitUntil: 'networkidle' });
    
    // Check if page loaded successfully
    const hasError = await page.locator('text=Build Error').count();
    if (hasError > 0) {
      console.log('❌ Build error detected');
    } else {
      console.log('✅ Page loaded successfully');
      
      // Check for employee name
      const employeeName = await page.locator('h1').textContent();
      console.log('Employee Name:', employeeName);
      
      // Check for status badge
      const status = await page.locator('.bg-green-500, .bg-gray-500, .bg-yellow-500').textContent();
      console.log('Status:', status);
      
      // Check for basic info section
      const hasBasicInfo = await page.locator('text=基本情報').count();
      console.log('Has Basic Info Section:', hasBasicInfo > 0 ? 'Yes' : 'No');
      
      // Check for contact info
      const hasContactInfo = await page.locator('text=連絡先情報').count();
      console.log('Has Contact Info Section:', hasContactInfo > 0 ? 'Yes' : 'No');
    }
    
    // Take screenshot
    await page.screenshot({ path: 'employee-detail-page.png', fullPage: true });
    console.log('Screenshot saved as employee-detail-page.png');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();