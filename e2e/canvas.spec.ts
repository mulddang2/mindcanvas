import { test, expect } from '@playwright/test';

test('데모 — 빈 진입 · 노드 추가 · 전체 선택 · 삭제 전체 흐름', async ({ page }) => {
  await page.goto('/canvas/demo');

  // 데모는 yjs 서버 + IndexedDB로 영속화되어 워커 간 노드가 공유될 수 있다. 시작 전 청소.
  await page.locator('text=/^nodes \\d+\\/\\d+$/').first().waitFor();
  const hud = await page.locator('text=/^nodes \\d+\\/\\d+$/').first().textContent();
  const count = parseInt(hud?.match(/nodes (\d+)/)?.[1] ?? '0', 10);
  if (count > 0) {
    await page.keyboard.press('Control+a');
    await page.keyboard.press('Delete');
  }
  await expect(page.getByText('nodes 0/0')).toBeVisible();
  await expect(page.getByText('edges 0')).toBeVisible();

  // 노드 추가 — HUD 카운트 즉시 반영
  await page.getByRole('button', { name: '노드 추가' }).click();
  await expect(page.getByText('nodes 1/1')).toBeVisible();
  await page.getByRole('button', { name: '노드 추가' }).click();
  await expect(page.getByText('nodes 2/2')).toBeVisible();

  // Ctrl+A 전체 선택 → Delete 삭제
  await page.keyboard.press('Control+a');
  await expect(page.getByText('selected 2')).toBeVisible();
  await page.keyboard.press('Delete');
  await expect(page.getByText('nodes 0/0')).toBeVisible();
});
