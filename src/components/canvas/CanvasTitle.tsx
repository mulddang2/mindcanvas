'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { SaveStatus } from '@/hooks/useAutosave';

interface Props {
  canvasId: string;
  initialTitle: string;
  /** demo 등 저장 안 하는 모드에서는 편집 비활성 + 저장 인디케이터 숨김. */
  editable: boolean;
  status: SaveStatus;
}

/** 캔버스 상단의 타이틀(클릭 편집) + 저장 상태 표시. 좌상단 디버그 박스 오른쪽에 위치. */
export function CanvasTitle({ canvasId, initialTitle, editable, status }: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(initialTitle);
  const composingRef = useRef(false);

  useEffect(() => {
    setTitle(initialTitle);
    setDraft(initialTitle);
  }, [initialTitle]);

  const commit = async () => {
    const trimmed = draft.trim();
    setEditing(false);
    if (!trimmed || trimmed === title) {
      setDraft(title);
      return;
    }
    setTitle(trimmed);
    const supabase = createClient();
    const { error } = await supabase.from('canvases').update({ title: trimmed }).eq('id', canvasId);
    if (error) {
      // 실패 시 이전 값으로 되돌리고 알림.
      alert(`제목 저장 실패: ${error.message}`);
      setTitle(initialTitle);
      setDraft(initialTitle);
    }
  };

  return (
    <div className="fixed left-3 top-3 z-10 flex items-center gap-2 rounded-md bg-white px-2 py-1.5 shadow-md ring-1 ring-black/10">
      <Link
        href="/dashboard"
        title="대시보드로"
        className="rounded p-1 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
      >
        <ChevronLeft size={14} />
      </Link>
      {editing ? (
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !composingRef.current) commit();
            if (e.key === 'Escape') {
              setDraft(title);
              setEditing(false);
            }
          }}
          onBlur={commit}
          maxLength={80}
          className="w-48 rounded px-2 py-0.5 text-sm text-neutral-900 outline-none ring-1 ring-blue-500"
        />
      ) : (
        <button
          type="button"
          onClick={() => editable && setEditing(true)}
          disabled={!editable}
          className="max-w-48 truncate rounded px-2 py-0.5 text-left text-sm font-medium text-neutral-900 hover:bg-neutral-100 disabled:cursor-default disabled:hover:bg-transparent"
        >
          {title}
        </button>
      )}
      {editable && <SaveBadge status={status} />}
    </div>
  );
}

function SaveBadge({ status }: { status: SaveStatus }) {
  const text =
    status === 'saving' ? '저장 중…' : status === 'saved' ? '저장됨' : status === 'error' ? '저장 실패' : '';
  if (!text) return null;
  return (
    <span
      className={`text-xs ${
        status === 'error' ? 'text-red-600' : 'text-neutral-500'
      }`}
    >
      {text}
    </span>
  );
}
