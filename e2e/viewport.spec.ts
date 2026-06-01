import { test, expect } from '@playwright/test';

// 휠 줌으로 scale이 바뀌고, "뷰 리셋"이 viewport를 초기값(x 0 · y 0 · scale 1)으로 되돌리는지 확인.
test('뷰포트 — 휠 줌으로 scale 변경 후 뷰 리셋으로 복귀', async ({ page }) => {
  await page.goto('/canvas/demo');

  // 알려진 시작 상태로 맞춘다.
  await page.getByRole('button', { name: '뷰 리셋' }).click();
  await expect(page.getByText('scale 1.00')).toBeVisible();

  // 캔버스 위에 커서를 두고 휠을 위로 굴려 줌인 → scale 증가.
  await page.mouse.move(640, 360);
  await page.mouse.wheel(0, -300);
  await expect(page.getByText('scale 1.00')).toBeHidden();

  // 뷰 리셋 → 초기 viewport로 복귀.
  await page.getByRole('button', { name: '뷰 리셋' }).click();
  await expect(page.getByText('x 0.0')).toBeVisible();
  await expect(page.getByText('y 0.0')).toBeVisible();
  await expect(page.getByText('scale 1.00')).toBeVisible();
});
