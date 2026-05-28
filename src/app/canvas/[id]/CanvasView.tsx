'use client';

import { useEffect, useRef } from 'react';
import { useNodeStore } from '@/stores/nodeStore';
import { InfiniteCanvas } from '@/components/canvas/InfiniteCanvas';
import { AiPromptBar } from '@/components/canvas/AiPromptBar';
import { Toolbar } from '@/components/canvas/Toolbar';
import { ContextMenu } from '@/components/canvas/ContextMenu';
import { CanvasTitle } from '@/components/canvas/CanvasTitle';
import { Minimap } from '@/components/canvas/Minimap';
import { UserMenu } from '@/components/auth/UserMenu';
import { useAutosave } from '@/hooks/useAutosave';
import type { CanvasGraph } from '@/lib/supabase/canvases';

interface Props {
  canvasId: string;
  title: string;
  initialGraph: CanvasGraph;
  /** demo는 DB 저장 없이 임시로 동작한다. */
  demo?: boolean;
}

/** 캔버스 페이지의 클라이언트 진입점. 초기 그래프를 store에 hydrate하고 자동 저장 hook을 건다. */
export function CanvasView({ canvasId, title, initialGraph, demo = false }: Props) {
  const replaceGraph = useNodeStore((s) => s.replaceGraph);
  const status = useAutosave({ canvasId, enabled: !demo });
  const hydratedRef = useRef(false);

  // 첫 mount 시점에 서버에서 받은 그래프를 store에 주입. 이후엔 hydrate 안 함.
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    replaceGraph(initialGraph.nodes, initialGraph.edges);
  }, [initialGraph, replaceGraph]);

  return (
    <>
      <InfiniteCanvas />
      <AiPromptBar />
      <Toolbar />
      <ContextMenu />
      <CanvasTitle
        canvasId={canvasId}
        initialTitle={title}
        editable={!demo}
        status={status}
      />
      <Minimap />
      <UserMenu />
    </>
  );
}
