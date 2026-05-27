'use client';

import { useEffect, useRef, useState } from 'react';
import { useNodeStore } from '@/stores/nodeStore';
import { createClient } from '@/lib/supabase/client';

const DEBOUNCE_MS = 3000;

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface Options {
  canvasId: string;
  /** demo 등 저장 비활성 모드에선 false. */
  enabled: boolean;
}

/**
 * nodeStore의 nodes·edges 변경을 debounce 후 Supabase에 upsert한다.
 * - 첫 hydrate(초기 데이터 주입) 직후 한 번은 저장하지 않음 (불필요한 즉시 저장 방지).
 * - 새 변경이 들어오면 기존 타이머를 취소하고 다시 시작.
 */
export function useAutosave({ canvasId, enabled }: Options): SaveStatus {
  const nodes = useNodeStore((s) => s.nodes);
  const edges = useNodeStore((s) => s.edges);
  const [status, setStatus] = useState<SaveStatus>('idle');
  // 첫 effect 실행은 hydrate 직후라 저장 trigger에서 제외한다.
  const skipNextRef = useRef(true);

  useEffect(() => {
    if (!enabled) return;
    if (skipNextRef.current) {
      skipNextRef.current = false;
      return;
    }

    setStatus('saving');
    const timer = setTimeout(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('canvases')
        .update({ data: { nodes, edges } })
        .eq('id', canvasId);
      setStatus(error ? 'error' : 'saved');
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [nodes, edges, canvasId, enabled]);

  return status;
}
