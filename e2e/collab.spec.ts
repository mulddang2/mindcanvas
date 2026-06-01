import { test, expect } from '@playwright/test';

// 두 클라이언트(별도 컨텍스트)가 yjs awareness로 커서를 주고받는지 확인한다.
// receive 쪽 RAF coalescing 도입(#53) 후에도 커서 동기화가 정상 동작함을 검증.
test('멀티커서 — 한 사용자의 커서가 다른 사용자 화면에 게스트 라벨로 나타난다', async ({
  browser,
}) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const pageA = await ctxA.newPage();
  const pageB = await ctxB.newPage();

  await pageA.goto('/canvas/demo');
  await pageB.goto('/canvas/demo');

  // 양쪽이 WebSocket으로 연결돼야 awareness가 전파된다.
  await expect(pageA.getByText('ws connected')).toBeVisible();
  await expect(pageB.getByText('ws connected')).toBeVisible();

  // A가 캔버스 위에서 마우스를 움직이면 cursor가 broadcast된다(30Hz throttle, 첫 move는 통과).
  await pageA.mouse.move(400, 300);
  await pageA.mouse.move(440, 340);

  // B 화면에 A의 커서 라벨(게스트 XXXX)이 나타난다 — coalesced receive가 정상 반영.
  await expect(pageB.getByText(/게스트/).first()).toBeVisible();

  await ctxA.close();
  await ctxB.close();
});
