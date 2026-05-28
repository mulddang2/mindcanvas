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

/** 단일 노드 fade-out 길이(ms). 끝나면 store에서 실제 제거. */
export const REMOVE_DURATION_MS = 400;

/**
 * 단일 노드의 추가/제거 fade 진행도(0~1). removingAt이 우선.
 * - removingAt: 1 → 0으로 감소 (fade-out)
 * - spawnedAt: 0 → 1로 증가 (fade-in)
 * - 둘 다 없으면 1 (기본 표시)
 */
export function nodeProgress(now: number, spawnedAt?: number, removingAt?: number): number {
  if (removingAt !== undefined) {
    const elapsed = now - removingAt;
    if (elapsed <= 0) return 1;
    if (elapsed >= REMOVE_DURATION_MS) return 0;
    return 1 - easeOutQuad(elapsed / REMOVE_DURATION_MS);
  }
  if (spawnedAt !== undefined) {
    const elapsed = now - spawnedAt;
    if (elapsed <= 0) return 0;
    if (elapsed >= SPAWN_DURATION_MS) return 1;
    return easeOutQuad(elapsed / SPAWN_DURATION_MS);
  }
  return 1;
}
