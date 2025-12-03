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

    const { containerLeft, containerRight, mainLeft, mainRight, viewportWidth } = await page.evaluate(() => {
      const container = document.querySelector('[data-testid="import-data-container"]') as HTMLElement | null;
      const main = document.querySelector('main') as HTMLElement | null;
      if (!container || !main) {
        throw new Error('コンテナまたはmain要素が見つかりません');
      }
      const containerRect = container.getBoundingClientRect();
      const mainRect = main.getBoundingClientRect();
      return {
        containerLeft: containerRect.left,
        containerRight: containerRect.right,
        mainLeft: mainRect.left,
        mainRight: mainRect.right,
        viewportWidth: document.documentElement.clientWidth,
      };
    });

    // main要素内でのコンテナの位置を計算（サイドバーの影響を除外）
    const leftMargin = containerLeft - mainLeft;
    const rightMargin = mainRight - containerRight;

    // デバッグ情報を出力
    console.log('Layout Debug:', {
      leftMargin,
      rightMargin,
      viewportWidth,
      mainLeft,
      mainRight,
      containerLeft,
      containerRight,
      difference: Math.abs(leftMargin - rightMargin),
    });

    expect(leftMargin).toBeGreaterThanOrEqual(16);
    expect(rightMargin).toBeGreaterThanOrEqual(16);
    // 左右のマージンの差は4px以内を許容（パディングの計算誤差を考慮）
    expect(Math.abs(leftMargin - rightMargin)).toBeLessThanOrEqual(4);
  });
});
