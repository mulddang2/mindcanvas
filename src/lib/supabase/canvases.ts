import type { CanvasEdge, CanvasNode } from '@/types/canvas';

/** 공유 링크 토큰의 권한 단계. NULL이면 공유 안 함. */
export type ShareRole = 'view' | 'edit';

/** Supabase `canvases` 테이블 row 1대1 대응 타입. data는 노드·엣지 묶음 JSON. */
export interface CanvasRow {
  id: string;
  owner_id: string;
  title: string;
  data: CanvasGraph;
  created_at: string;
  updated_at: string;
  /** 단일 토큰 share-link 모델. NULL이면 비공개. */
  share_token: string | null;
  /** share_token이 있을 때 그 토큰의 권한 단계. */
  share_role: ShareRole | null;
}

/** 캔버스에 저장되는 그래프 payload. nodeStore의 nodes·edges를 그대로 직렬화한다. */
export interface CanvasGraph {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** 대시보드 카드 등 목록 표시용 가벼운 형태. data·소유자·공유 토큰은 제외. */
export type CanvasSummary = Omit<CanvasRow, 'data' | 'owner_id' | 'share_token' | 'share_role'>;

export const DEFAULT_TITLE = '제목 없음';
export const EMPTY_GRAPH: CanvasGraph = { nodes: [], edges: [] };
