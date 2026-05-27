'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_TITLE, EMPTY_GRAPH } from '@/lib/supabase/canvases';

interface Props {
  variant?: 'header' | 'empty' | 'card';
  canvasId?: string;
  canvasTitle?: string;
}

/** 대시보드의 새 캔버스 생성·삭제 액션. 위치별로 모양만 다르고 로직은 동일. */
export function DashboardActions({ variant = 'header', canvasId, canvasTitle }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState(false);

  const onCreate = () => {
    startTransition(async () => {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      const { data, error } = await supabase
        .from('canvases')
        .insert({ owner_id: userData.user.id, title: DEFAULT_TITLE, data: EMPTY_GRAPH })
        .select('id')
        .single();
      if (error || !data) {
        alert(`생성 실패: ${error?.message ?? 'unknown'}`);
        return;
      }
      router.push(`/canvas/${data.id}`);
    });
  };

  const onDelete = async () => {
    if (!canvasId) return;
    if (!confirm(`"${canvasTitle ?? '이 마인드맵'}"을 삭제할까요?`)) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from('canvases').delete().eq('id', canvasId);
    setDeleting(false);
    if (error) {
      alert(`삭제 실패: ${error.message}`);
      return;
    }
    router.refresh();
  };

  if (variant === 'card') {
    return (
      <button
        type="button"
        onClick={onDelete}
        disabled={deleting}
        title="삭제"
        className="absolute right-2 top-2 rounded p-1.5 text-neutral-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 disabled:opacity-100"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onCreate}
      disabled={pending}
      className="flex items-center gap-2 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 disabled:bg-neutral-400"
    >
      <Plus size={16} />
      {pending ? '생성 중…' : '새 마인드맵'}
    </button>
  );
}
