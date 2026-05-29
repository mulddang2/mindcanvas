'use client';

import { useEffect, useRef } from 'react';
import { useNodeStore } from '@/stores/nodeStore';
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas';
import { AiPromptBar } from '@/components/canvas/AiPromptBar';
import { Toolbar } from '@/components/canvas/Toolbar';
import { ContextMenu } from '@/components/canvas/ContextMenu';
import { CanvasTitle } from '@/components/canvas/CanvasTitle';
import { Minimap } from '@/components/canvas/Minimap';
import { Cursors } from '@/components/canvas/Cursors';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAutosave } from '@/hooks/useAutosave';
import { useYjs } from '@/hooks/useYjs';
import { useAwareness } from '@/hooks/useAwareness';
import { useRoleStore } from '@/stores/roleStore';
import type { CanvasRole } from '@/lib/supabase/permissions';
import type { CanvasGraph } from '@/lib/supabase/canvases';

interface Props {
  canvasId: string;
  title: string;
  initialGraph: CanvasGraph;
  /** demo는 DB 저장 없이 임시로 동작한다. */
  demo?: boolean;
  /** 공유 라우트(/canvas/share/[token])에서 진입 시 'view'·'edit'. 기본 'owner'(소유자 직접 진입). */
  role?: CanvasRole;
}

/** 캔버스 페이지의 클라이언트 진입점. 초기 그래프를 store에 hydrate하고 자동 저장 hook을 건다. */
export function CanvasView({
  canvasId,
  title,
  initialGraph,
  demo = false,
  role = 'owner',
}: Props) {
  const hydrateIfEmpty = useNodeStore((s) => s.hydrateIfEmpty);
  const setRole = useRoleStore((s) => s.setRole);
  // 자동저장은 owner·edit role에서만. demo도 비활성.
  const status = useAutosave({ canvasId, enabled: !demo && role === 'owner' });
  // Y.Doc · WebsocketProvider + nodeStore 바인딩 + 멀티커서 awareness.
  useYjs(canvasId);
  useAwareness(canvasId);
  const hydratedRef = useRef(false);

  // 현재 role을 roleStore에 동기화 — 자식 UI가 canEdit/canManage로 차단 여부 판단.
  useEffect(() => {
    setRole(role);
    return () => setRole(null);
  }, [role, setRole]);

  // 첫 mount 시점에 서버 데이터를 Y.Doc에 주입. 단, Y.Doc이 이미 채워진 상태(다른 탭 선진입)면 skip.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    hydrateIfEmpty(initialGraph.nodes, initialGraph.edges);
  }, [initialGraph, hydrateIfEmpty]);

  return (
    <>
      <InfiniteCanvas />
      <AiPromptBar />
      <Toolbar />
      <ContextMenu />
      <CanvasTitle
        canvasId={canvasId}
        initialTitle={title}
        editable={!demo && role === 'owner'}
        status={status}
      />
      <Minimap />
      <Cursors />
      <UserMenu />
    </>
  );
}
