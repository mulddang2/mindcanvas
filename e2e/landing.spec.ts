import { test, expect } from '@playwright/test';

test.describe('랜딩 페이지', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('초기 진입 시 한국어 텍스트와 라이트 모드', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'MindCanvas' })).toBeVisible();
    await expect(page.getByRole('link', { name: '캔버스 열기' })).toBeVisible();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('다크 토글 — 즉시 색상 전환', async ({ page }) => {
    await page.goto('/');
    const themeGroup = page.getByRole('radiogroup', { name: '테마' });
    await themeGroup.getByRole('radio', { name: '다크' }).click();
    await expect(page.locator('html')).toHaveClass(/dark/);
    await themeGroup.getByRole('radio', { name: '라이트' }).click();
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });

  test('언어 토글 — ko → en → ja 즉시 전환', async ({ page }) => {
    await page.goto('/');
    // 그룹 aria-label은 locale에 따라 바뀌므로(언어/Language/言語) radio 자체를 직접 선택.
    // radio 라벨(한국어·English·日本語)은 모든 locale 메시지에서 동일.
    await page.getByRole('radio', { name: 'English' }).click();
    await expect(page.getByRole('link', { name: 'Open canvas' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await page.getByRole('radio', { name: '日本語' }).click();
    await expect(page.getByRole('link', { name: 'キャンバスを開く' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'ja');
  });

  test('캔버스 진입 — "캔버스 열기" 클릭 시 /canvas/demo 로 이동', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: '캔버스 열기' }).click();
    await page.waitForURL('**/canvas/demo');
  });
});
