import type { CanvasEdge, CanvasNode } from '@/types/canvas';
import type { Mindmap } from '@/lib/ai/gemini';

const NODE_WIDTH = 160;
const NODE_HEIGHT = 64;
const RADIUS_BRANCH = 320;
const RADIUS_CHILD = 180;
// 자식이 부모 주변에 너무 좁게 몰리지 않도록 한쪽으로 펼치는 부채꼴 각도.
const CHILD_ARC_SPAN = Math.PI * 0.6;

/** Mindmap을 (0,0) 중심의 방사형 노드·엣지로 변환한다. */
export function radialLayout(data: Mindmap): { nodes: CanvasNode[]; edges: CanvasEdge[] } {
  const nodes: CanvasNode[] = [];
  const edges: CanvasEdge[] = [];

  const makeNode = (label: string, cx: number, cy: number): CanvasNode => ({
    id: crypto.randomUUID(),
    x: cx - NODE_WIDTH / 2,
    y: cy - NODE_HEIGHT / 2,
    width: NODE_WIDTH,
    height: NODE_HEIGHT,
    label,
  });

  const root = makeNode(data.root, 0, 0);
  nodes.push(root);

  const branchCount = data.branches.length;
  data.branches.forEach((branch, i) => {
    // -π/2부터 시계방향으로 균등 분포 (12시 방향에서 시작).
    const branchAngle = (i / branchCount) * Math.PI * 2 - Math.PI / 2;
    const bx = Math.cos(branchAngle) * RADIUS_BRANCH;
    const by = Math.sin(branchAngle) * RADIUS_BRANCH;
    const branchNode = makeNode(branch.label, bx, by);
    nodes.push(branchNode);
    edges.push({ id: crypto.randomUUID(), source: root.id, target: branchNode.id });

    const children = branch.children;
    if (children.length === 0) return;
    children.forEach((childLabel, j) => {
      // 자식이 1개면 부모와 같은 각도, 여러 개면 부채꼴로 균등 분포.
      const offset = children.length === 1 ? 0 : (j / (children.length - 1) - 0.5) * CHILD_ARC_SPAN;
      const childAngle = branchAngle + offset;
      const cx = bx + Math.cos(childAngle) * RADIUS_CHILD;
      const cy = by + Math.sin(childAngle) * RADIUS_CHILD;
      const childNode = makeNode(childLabel, cx, cy);
      nodes.push(childNode);
      edges.push({ id: crypto.randomUUID(), source: branchNode.id, target: childNode.id });
    });
  });

  return { nodes, edges };
}
