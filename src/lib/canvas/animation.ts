/** 노드·엣지 등장 페이드 + 스케일 보간에 쓰는 공통 상수·함수. */

export const SPAWN_DURATION_MS = 500;

/** 끝부분에서 부드럽게 멈추도록 (1-x)²로 감속한 0~1 보간. */
export function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

/** startedAt 시점 기준 등장 진행도(0~1). null이거나 완료 후엔 1. */
export function spawnProgress(now: number, startedAt: number | null): number {
  if (startedAt === null) return 1;
  const elapsed = now - startedAt;
  if (elapsed >= SPAWN_DURATION_MS) return 1;
  if (elapsed < 0) return 0;
  return easeOutQuad(elapsed / SPAWN_DURATION_MS);
}
