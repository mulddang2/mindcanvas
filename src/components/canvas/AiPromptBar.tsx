'use client';

import { useState } from 'react';
import { useNodeStore } from '@/stores/nodeStore';
import { useCanvasStore } from '@/stores/canvasStore';
import { radialLayout } from '@/lib/canvas/radialLayout';
import type { Mindmap } from '@/lib/ai/gemini';

/**
 * 캔버스 상단 중앙에 떠 있는 AI 마인드맵 생성 입력 바.
 * - 주제 입력 → /api/ai-generate 호출 → 방사형 레이아웃 → 캔버스 통째 교체.
 * - 한글 IME 조합 중 Enter는 무시 (마지막 글자 끊김 방지).
 */
export function AiPromptBar() {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [composing, setComposing] = useState(false);
  const replaceGraph = useNodeStore((state) => state.replaceGraph);
  const resetViewport = useCanvasStore((state) => state.resetViewport);

  const submit = async () => {
    const trimmed = prompt.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmed }),
      });
      const data = (await res.json()) as Mindmap | { error: string };
      if (!res.ok) {
        throw new Error('error' in data ? data.error : 'AI 생성 실패');
      }
      const { nodes, edges } = radialLayout(data as Mindmap);
      replaceGraph(nodes, edges);
      // 생성 결과는 (0,0) 중심이므로 뷰포트를 리셋해 한눈에 보이게 한다.
      resetViewport();
      setPrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'AI 생성 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed left-1/2 top-3 z-10 flex w-[min(640px,calc(100%-7rem))] -translate-x-1/2 flex-col gap-1">
      <div className="flex items-center gap-1 rounded-md bg-white p-1.5 shadow-md ring-1 ring-black/10">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !composing) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="생성할 주제를 입력하세요 (예: 한국 음식 분류)"
          disabled={loading}
          maxLength={200}
          className="flex-1 rounded px-3 py-2 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 disabled:bg-neutral-50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={loading || !prompt.trim()}
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          {loading ? '생성 중…' : 'AI 생성'}
        </button>
      </div>
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
