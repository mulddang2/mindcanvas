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

/** 노드 종류. 기본값 'text'. */
export type NodeType = 'text' | 'checkbox' | 'image';

export interface CanvasNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  /** 'text'(기본)·'checkbox'·'image'. 누락 시 'text'로 간주(기존 데이터 호환). */
  type?: NodeType;
  /** type이 'checkbox'일 때만 의미가 있는 체크 상태. */
  checked?: boolean;
  /** type이 'image'일 때 노드 안에 그릴 이미지의 public URL. */
  imageUrl?: string;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
}
