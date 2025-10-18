import { test, expect } from '@playwright/test';

const TEST_EMAIL = process.env.PLAYWRIGHT_EMAIL;
const TEST_PASSWORD = process.env.PLAYWRIGHT_PASSWORD;

test.describe('Import Data layout', () => {
  test.beforeEach(async ({ page }) => {
    if (!TEST_EMAIL || !TEST_PASSWORD) {
      test.skip(true, 'PLAYWRIGHT_EMAIL / PLAYWRIGHT_PASSWORD が未設定のためスキップします');
    }

    await page.goto('/ja/auth/login');
    await page.getByLabel('メールアドレス').fill(TEST_EMAIL!);
    await page.getByLabel('パスワード').fill(TEST_PASSWORD!);
    await page.getByRole('button', { name: 'ログイン' }).click();
    await page.waitForURL('**/ja/dashboard', { timeout: 15_000 });
  });

  test('コンテナ左右マージンは16px以上で揃っている', async ({ page }) => {
    await page.goto('/ja/import-data');
    await page.waitForSelector('[data-testid="import-data-container"]');

    const { left, right, viewportWidth } = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="import-data-container"]') as HTMLElement | null;
      if (!container) {
        throw new Error('コンテナ要素が見つかりません');
      }
      const rect = container.getBoundingClientRect();
      return {
        left: rect.left,
        right: rect.right,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    const leftMargin = left;
    const rightMargin = viewportWidth - right;

    expect(leftMargin).toBeGreaterThanOrEqual(16);
    expect(rightMargin).toBeGreaterThanOrEqual(16);
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(2);
  });
});
