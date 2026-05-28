import type { CanvasNode, NodeColor } from '@/types/canvas';

export interface NodeColorPalette {
  border: string;
  fill: string;
  text: string;
  label: string;
}

/** 7가지 카테고리 색. M11에서 다크모드 진입 시 이 한 테이블만 light/dark로 교체하면 된다. */
export const NODE_COLORS: Record<NodeColor, NodeColorPalette> = {
  default: { border: '#c4c9d1', fill: '#ffffff', text: '#1f2933', label: '기본' },
  red: { border: '#dc2626', fill: '#fee2e2', text: '#991b1b', label: '빨강' },
  orange: { border: '#ea580c', fill: '#ffedd5', text: '#9a3412', label: '주황' },
  yellow: { border: '#ca8a04', fill: '#fef9c3', text: '#854d0e', label: '노랑' },
  green: { border: '#16a34a', fill: '#dcfce7', text: '#166534', label: '초록' },
  blue: { border: '#2563eb', fill: '#dbeafe', text: '#1e40af', label: '파랑' },
  purple: { border: '#9333ea', fill: '#f3e8ff', text: '#6b21a8', label: '보라' },
};

/** swatch UI 노출 순서. default를 맨 앞에 두어 "지정 해제" 의미로 쓴다. */
export const NODE_COLOR_ORDER: NodeColor[] = [
  'default',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
];

export function getNodeColor(node: Pick<CanvasNode, 'color'>): NodeColorPalette {
  return NODE_COLORS[node.color ?? 'default'];
}
