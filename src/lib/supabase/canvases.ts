import type { CanvasEdge, CanvasNode } from '@/types/canvas';

/** Supabase `canvases` 테이블 row 1대1 대응 타입. data는 노드·엣지 묶음 JSON. */
export interface CanvasRow {
  id: string;
  owner_id: string;
  title: string;
  data: CanvasGraph;
  created_at: string;
  updated_at: string;
}

/** 캔버스에 저장되는 그래프 payload. nodeStore의 nodes·edges를 그대로 직렬화한다. */
export interface CanvasGraph {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** 대시보드 카드 등 목록 표시용 가벼운 형태. data는 제외. */
export type CanvasSummary = Omit<CanvasRow, 'data' | 'owner_id'>;

export const DEFAULT_TITLE = '제목 없음';
export const EMPTY_GRAPH: CanvasGraph = { nodes: [], edges: [] };
