import { test, expect, type Page } from '@playwright/test';

const EMAIL = process.env.PLAYWRIGHT_EMAIL;
const PASSWORD = process.env.PLAYWRIGHT_PASSWORD;

async function login(page: Page) {
  if (!EMAIL || !PASSWORD) {
    test.skip(true, 'PLAYWRIGHT_EMAIL / PLAYWRIGHT_PASSWORD が未設定のためスキップします');
  }
  await page.goto('/ja/auth/login');
  await page.getByLabel('メールアドレス').fill(EMAIL!);
  await page.getByLabel('パスワード').fill(PASSWORD!);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await page.waitForURL('**/ja/dashboard', { timeout: 15_000 });
}

async function openFirstQuotationEdit(page: Page) {
  await page.goto('/ja/quotation');
  await page.waitForSelector('table tbody tr');
  const firstRow = page.locator('table tbody tr').first();
  const detailLink = firstRow.getByRole('link', { name: /詳細|View/ });
  await expect(detailLink).toBeVisible();
  await detailLink.click();
  await page.waitForURL('**/ja/quotation/*', { timeout: 15_000 });
  const editButton = page.getByRole('link', { name: /編集|Edit/ });
  await expect(editButton).toBeVisible();
  await editButton.click();
  await page.waitForURL('**/ja/quotation/**/edit', { timeout: 15_000 });
}

test.describe('Quotation編集', () => {
  test('編集フォームが正常に表示される', async ({ page }) => {
    await login(page);
    await openFirstQuotationEdit(page);

    await expect(page.getByRole('heading', { name: /見積もり編集|Edit Quotation/ })).toBeVisible();
    await expect(page.locator('form')).toBeVisible();
    await expect(page.getByLabel(/顧客|Customer/)).toBeVisible();
    await expect(page.getByLabel(/担当者|Contact/)).toBeVisible();
  });
});
