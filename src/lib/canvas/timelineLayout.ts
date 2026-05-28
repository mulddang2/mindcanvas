import type { CanvasNode } from '@/types/canvas';

const HORIZONTAL_GAP = 200;

/**
 * 타임라인 레이아웃. 노드를 spawnedAt 기준 가로 1줄로 펼친다.
 *  - `spawnedAt`이 정의된 노드만 시간순으로 정렬되고, 정의 안 된 노드(AI 생성·DB 로딩)는 좌측에 모인다
 *  - 같은 시간(또는 정의 안 됨) 노드가 다수면 세로 zigzag로 겹침 방지
 *  - 별도 `createdAt` 필드는 도입하지 않음 — 본 PR 범위에서 spawnedAt 활용이 데모로 충분
 */
export function timelineLayout(
  nodes: CanvasNode[],
): Array<{ id: string; x: number; y: number }> {
  if (nodes.length === 0) return [];

  // 입력 순서를 tie-breaker로 안정화하기 위해 인덱스 동반.
  const indexed = nodes.map((n, i) => ({ n, i }));
  indexed.sort((a, b) => {
    const ta = a.n.spawnedAt ?? 0;
    const tb = b.n.spawnedAt ?? 0;
    if (ta !== tb) return ta - tb;
    return a.i - b.i;
  });

  // 같은 시간 그룹은 세로 zigzag(±height)로 분산. 그룹 내 첫 노드는 y=0.
  const positions: Array<{ id: string; x: number; y: number }> = [];
  let prevTime: number | null = null;
  let groupOffset = 0;
  indexed.forEach(({ n }, i) => {
    const t = n.spawnedAt ?? 0;
    if (t !== prevTime) {
      prevTime = t;
      groupOffset = 0;
    } else {
      // 같은 시간이면 위·아래·위·아래... 패턴으로 분산.
      groupOffset = groupOffset <= 0 ? -groupOffset + n.height : -groupOffset;
    }
    const cx = i * HORIZONTAL_GAP - ((indexed.length - 1) * HORIZONTAL_GAP) / 2;
    const cy = groupOffset;
    positions.push({ id: n.id, x: cx - n.width / 2, y: cy - n.height / 2 });
  });

  return positions;
}
