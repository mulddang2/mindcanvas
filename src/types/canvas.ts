export interface Point {
  x: number;
  y: number;
}

/** world 좌표의 viewport 좌상단 + 배율. scale 1.0이 기본. */
export interface Viewport {
  x: number;
  y: number;
  scale: number;
}

/** world 좌표 기준 직사각형 영역 (culling·격자 범위 계산용). */
export interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}
